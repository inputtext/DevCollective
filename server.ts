import express from 'express';
import path from 'path';
import crypto from 'crypto';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import multer from 'multer';
import nodemailer from 'nodemailer';
import { GoogleGenAI, Type } from '@google/genai';
import {
  createUser,
  getUserByEmail,
  getUserByToken,
  createSession,
  deleteSession,
  sanitizeUser,
  updateUser,
  findOrCreateOAuthUser,
  setPasswordResetCode,
  resetPasswordWithCode,
} from './server/db';
import { registerLearningProgressRoutes } from './server/learningProgress';

dotenv.config();

const app = express();
const PORT = 3000;
const AI_MODEL = 'gemini-3.6-flash';

app.use(express.json());

// --- OAuth + Email config -------------------------------------------------
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '';
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || '';
const GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID || '';
const GITHUB_CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET || '';

function getAppBaseUrl(req: express.Request): string {
  return process.env.APP_URL || `http://${req.headers.host || 'localhost:3000'}`;
}

function getMailTransporter() {
  const emailUser = process.env.EMAIL_USER;
  const emailPass = process.env.EMAIL_APP_PASSWORD;
  if (!emailUser || !emailPass) return null;
  return nodemailer.createTransport({
    service: 'gmail',
    auth: { user: emailUser, pass: emailPass },
  });
}

// In-memory upload (no need to persist the raw PDF, we only need its text)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB cap
  fileFilter: (_req, file, cb) => {
    if (file.mimetype === 'application/pdf') cb(null, true);
    else cb(new Error('Only PDF files are supported.'));
  },
});

// Shared auth guard: reads Bearer token, attaches the user, or 401s
function requireAuth(req: express.Request, res: express.Response, next: express.NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Not authenticated.' });
  }
  const token = authHeader.substring(7);
  const user = getUserByToken(token);
  if (!user) {
    return res.status(401).json({ error: 'Session expired or invalid.' });
  }
  (req as any).authUser = user;
  next();
}

// Level 0 learning progression routes. These use the existing DevCollective
// session guard and keep learning progress/REP authoritative in Supabase.
registerLearningProgressRoutes(app, requireAuth);

// Shared: turn raw Gemini errors into something safe/readable to show the user
function friendlyAiError(err: any): string {
  const rawMessage: string = err?.message || '';
  if (rawMessage.includes('API key not valid') || rawMessage.includes('API_KEY_INVALID') || rawMessage.includes('403')) {
    return 'The AI service is not configured correctly on this server (invalid API key). Please let the site admin know.';
  }
  if (rawMessage.includes('429') || rawMessage.toLowerCase().includes('quota') || rawMessage.toLowerCase().includes('rate limit')) {
    return 'The AI service is getting a lot of requests right now (or the account is out of quota). Please try again shortly.';
  }
  if (rawMessage.includes('503') || rawMessage.toLowerCase().includes('unavailable') || rawMessage.toLowerCase().includes('overloaded') || rawMessage.toLowerCase().includes('high demand')) {
    return "Google's AI model is temporarily overloaded from high demand right now. This usually clears up within a minute or two, please try again shortly.";
  }
  if (rawMessage.includes('500') || rawMessage.toLowerCase().includes('internal error')) {
    return 'The AI service hit an internal error on its end. Please try again in a moment.';
  }
  // Never show a raw JSON error body to the user, always fall back to something clean
  const looksLikeRawJson = rawMessage.trim().startsWith('{') || rawMessage.trim().startsWith('[');
  if (!rawMessage || looksLikeRawJson) {
    return 'Something went wrong reaching the AI service. Please try again in a moment.';
  }
  return rawMessage;
}

function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  return new GoogleGenAI({
    apiKey,
    httpOptions: { headers: { 'User-Agent': 'aistudio-build' } },
  });
}

// API Routes
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Shared JSON schema for the roadmap object, using Gemini's Type enum (used for function-calling)
const ROADMAP_JSON_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    roadmapTitle: { type: Type.STRING },
    overview: { type: Type.STRING },
    targetRole: { type: Type.STRING },
    estimatedWeeksTotal: { type: Type.INTEGER },
    recommendedPrerequisites: { type: Type.ARRAY, items: { type: Type.STRING } },
    levels: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          levelNumber: { type: Type.INTEGER },
          title: { type: Type.STRING },
          description: { type: Type.STRING },
          estimatedWeeks: { type: Type.INTEGER },
          topics: { type: Type.ARRAY, items: { type: Type.STRING } },
          capstoneProject: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              description: { type: Type.STRING },
              keySkills: { type: Type.ARRAY, items: { type: Type.STRING } },
            },
            required: ['title', 'description', 'keySkills'],
          },
          learningResources: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                type: { type: Type.STRING },
                description: { type: Type.STRING },
              },
              required: ['title', 'type', 'description'],
            },
          },
        },
        required: ['levelNumber', 'title', 'description', 'estimatedWeeks', 'topics', 'capstoneProject', 'learningResources'],
      },
    },
  },
  required: ['roadmapTitle', 'overview', 'targetRole', 'estimatedWeeksTotal', 'levels'],
};

const ROADMAP_MENTOR_SYSTEM_PROMPT = `You are an expert tech career mentor and roadmap architect for college engineering students on DevCollective.

Your job is to have a short, natural conversation with the student to understand three things before you build anything:
1. Which technology or field they're interested in (for example: AI/Machine Learning, Web Development, Cybersecurity, Cloud & DevOps, Mobile Development, or something else).
2. Their current skill level in that area: beginner, intermediate, or advanced.
3. What they already know right now, specific languages, tools, or concepts, if any (a true beginner may know nothing yet, and that's fine).

Ask ONE short, friendly, easy-to-understand question at a time. Do not ask about their academic branch or degree unless the student brings it up. Do not front-load a long list of questions, have a real back-and-forth conversation.

Once you have enough information, usually after 2 to 4 short exchanges, call the finalize_roadmap function with a complete, realistic, progressive roadmap broken into levels, built specifically around what the student told you. If they're a true beginner in a field, the roadmap must start from real fundamentals (for example: Python basics before ML libraries, HTML/CSS/JS before frameworks), never skip ahead of what they actually know. Write every description in plain, encouraging language a student can immediately understand, no unexplained jargon. Make it concrete: real topics, a real capstone project, and real learning resources for each level.`;

const finalizeRoadmapFunctionDeclaration = {
  name: 'finalize_roadmap',
  description: "Call this once you have gathered the student's area of interest, skill level, and current knowledge, to generate their complete personalized learning roadmap.",
  parameters: ROADMAP_JSON_SCHEMA as any,
};

// Conversational Roadmap Mentor Endpoint: AI asks the questions itself, then generates the roadmap
app.post('/api/ai/roadmap-chat', async (req, res) => {
  try {
    const { message, history } = req.body as { message: string; history?: { role: 'user' | 'model'; text: string }[] };

    if (!message || !message.trim()) {
      return res.status(400).json({ error: 'Message is required.' });
    }

    const ai = getGeminiClient();
    if (!ai) {
      return res.status(500).json({
        error: 'GEMINI_API_KEY is not configured on the server. Please add it to your environment variables.',
      });
    }

    const contents = [
      ...(history || []).slice(-16).map((h) => ({
        role: h.role,
        parts: [{ text: h.text }],
      })),
      { role: 'user', parts: [{ text: message }] },
    ];

    const response = await ai.models.generateContent({
      model: AI_MODEL,
      contents,
      config: {
        systemInstruction: ROADMAP_MENTOR_SYSTEM_PROMPT,
        tools: [{ functionDeclarations: [finalizeRoadmapFunctionDeclaration] }],
      },
    });

    const functionCalls = response.functionCalls;

    if (functionCalls && functionCalls.length > 0 && functionCalls[0].name === 'finalize_roadmap') {
      const roadmap = functionCalls[0].args;
      return res.json({ success: true, type: 'roadmap', roadmap });
    }

    const reply = response.text || "Could you tell me a bit more about what you're interested in?";
    return res.json({ success: true, type: 'question', message: reply });
  } catch (err: any) {
    console.error('Error in /api/ai/roadmap-chat:', err);
    return res.status(500).json({ error: friendlyAiError(err) });
  }
});

// Update Profile Endpoint (persists edits from Profile Setup / resume auto-fill)
app.patch('/api/users/profile', requireAuth, (req, res) => {
  try {
    const authUser = (req as any).authUser;
    const allowedFields = [
      'branch',
      'academicYear',
      'githubUrl',
      'linkedinUrl',
      'skills',
      'bio',
      'selectedDomains',
      'avatar',
      'college',
      'name',
    ];
    const updates: Record<string, any> = {};
    for (const field of allowedFields) {
      if (field in req.body) updates[field] = req.body[field];
    }

    const updated = updateUser(authUser.id, updates);
    if (!updated) {
      return res.status(404).json({ error: 'User not found.' });
    }

    return res.json({ success: true, user: sanitizeUser(updated) });
  } catch (err: any) {
    console.error('Error in /api/users/profile:', err);
    return res.status(500).json({ error: err.message || 'Failed to update profile.' });
  }
});

// Resume Upload -> AI Auto-Fill Endpoint
app.post('/api/resume/parse', requireAuth, upload.single('resume'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No resume file uploaded.' });
    }

    const ai = getGeminiClient();
    if (!ai) {
      return res.status(500).json({
        error: 'GEMINI_API_KEY is not configured on the server. Please add it to your environment variables.',
      });
    }

    // Extract raw text from the PDF
    const { PDFParse } = await import('pdf-parse');
    const parser = new PDFParse({ data: req.file.buffer });
    const textResult = await parser.getText();
    await parser.destroy();
    const resumeText = textResult.text.slice(0, 15000); // guard against huge resumes

    if (!resumeText.trim()) {
      return res.status(422).json({ error: 'Could not extract any text from this PDF. Try a text-based PDF, not a scanned image.' });
    }

    const prompt = `Here is the raw extracted text from a student's resume:\n\n"""\n${resumeText}\n"""\n\nRead it carefully and extract structured profile data for a college developer platform. Only include skills, links, and details that are actually present or strongly implied in the resume text. Do not invent information.`;

    const response = await ai.models.generateContent({
      model: AI_MODEL,
      contents: prompt,
      config: {
        systemInstruction:
          'You are a resume parser for a student developer platform. Extract accurate, grounded structured data only. Never fabricate skills, links, or achievements that are not evidenced in the text.',
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            branch: { type: Type.STRING, description: 'Academic branch/major, e.g. Computer Science' },
            academicYear: { type: Type.STRING, description: 'e.g. Third Year, Final Year, if determinable from graduation date, else best guess' },
            bio: { type: Type.STRING, description: 'A concise 1-2 sentence professional bio written in first person, based on the resume' },
            skills: { type: Type.ARRAY, items: { type: Type.STRING }, description: 'Technical skills, languages, frameworks, tools found in the resume' },
            githubUrl: { type: Type.STRING, description: 'GitHub profile URL if present in resume, else empty string' },
            linkedinUrl: { type: Type.STRING, description: 'LinkedIn profile URL if present in resume, else empty string' },
            confidence: { type: Type.STRING, description: 'One short sentence noting anything the user should double check' },
          },
          required: ['branch', 'academicYear', 'bio', 'skills', 'githubUrl', 'linkedinUrl'],
        },
      },
    });

    const jsonText = response.text || '{}';
    const extracted = JSON.parse(jsonText);

    return res.json({ success: true, extracted });
  } catch (err: any) {
    console.error('Error in /api/resume/parse:', err);
    return res.status(500).json({ error: friendlyAiError(err) });
  }
});

// Platform Chatbot Endpoint
const PLATFORM_KNOWLEDGE = `
DevCollective is a collaborative learning and mentorship platform for college developers. Here is the exact structure of the site. Use these exact names when directing students, don't paraphrase them.

The sidebar navigation has these exact items, in order: Dashboard, Community, Roadmaps, Leaderboard, Mentors, Profile (and Admin Terminal for admin accounts only).

- DASHBOARD (sidebar item "Dashboard"): the student's home screen after login. Shows current roadmap tasks in progress, total REP points, current level, and daily activity streak.

- ROADMAPS (sidebar item "Roadmaps"): has two tabs at the top, "AI Custom Roadmap" and "Standard Track". The AI Custom Roadmap tab is a live chat box called the "Roadmap Mentor". The student types answers directly in that chat, the AI asks what technology/field they're interested in, their current skill level (beginner/intermediate/advanced), and what they already know, one question at a time. There are also quick-tap topic buttons (like "AI Engineer", "Full Stack Developer") to skip straight to that topic. Once the AI has enough info it generates a full multi-level roadmap below the chat: each level has topics, a capstone project, and learning resources. Students can keep chatting in the same box afterward to ask follow-up questions or adjust the roadmap. There's a "Start Over" button to reset the conversation.

- COMMUNITY (sidebar item "Community"): a feed where students post updates, questions, and progress, organized into categories: Build in Public, Questions, Projects, Hackathons, AI, and Android. Posts can be liked and commented on.

- LEADERBOARD (sidebar item "Leaderboard"): ranks all students by total REP points earned.

- MENTORS (sidebar item "Mentors"): a directory of senior students, alumni, faculty, and industry mentors, filterable by skill area.

- PROFILE (sidebar item "Profile"): where students edit branch, academic year, bio, skills, GitHub link, and LinkedIn link. Profile Setup (shown right after registering, or reachable again from Profile) has a dedicated "Upload your resume (PDF)" box near the top, students can either upload a resume there to auto-fill the fields below (skills, bio, links, branch, year), or click "Skip for now" to fill it manually. Fields stay editable after auto-fill so students can correct anything before saving.

- REP & LEVELS: REP (reputation points) are earned by completing roadmap tasks, posting in Community, and other activity. REP determines a student's Level and their position on the Leaderboard.

- THIS CHAT ASSISTANT: the chat bubble in the bottom-right corner of every page, always available, click it anytime to ask about the platform or get learning guidance.
`.trim();

app.post('/api/chat', async (req, res) => {
  try {
    const { message, history } = req.body as { message: string; history?: { role: 'user' | 'model'; text: string }[] };

    if (!message || !message.trim()) {
      return res.status(400).json({ error: 'Message is required.' });
    }

    const ai = getGeminiClient();
    if (!ai) {
      return res.status(500).json({
        error: 'GEMINI_API_KEY is not configured on the server. Please add it to your environment variables.',
      });
    }

    const systemInstruction = `You are the DevCollective Platform Assistant, a friendly guide for college students on the DevCollective platform. You have two jobs:

1. HELP WITH THE PLATFORM: answer questions about how DevCollective works, using ONLY the information below. This is the complete and only source of truth about the platform, do not guess, assume, or make up any feature, button, or page that isn't listed here.
${PLATFORM_KNOWLEDGE}

RULES FOR PLATFORM QUESTIONS:
- Always be specific and concrete, never vague. Bad: "You can find that in your profile settings." Good: "Go to Profile in the sidebar, your skills and bio are editable fields there."
- If the student asks how to do something, name the exact sidebar item and what they'll see, using the exact names given above (Dashboard, Community, Roadmaps, Leaderboard, Mentors, Profile).
- If a student asks about a feature that isn't in the knowledge above, say plainly that DevCollective doesn't have that yet, don't invent an answer.
- Keep answers short, 2-4 sentences for a simple question. Only go longer if the student asks for a full walkthrough.

2. GUIDE NEW LEARNERS: if a student says they're new to coding, a specific field (like AI, web dev, etc), or asks "how do I start", don't just describe the platform. Actually act as a mentor:
   - Ask their academic year and what area interests them, if they haven't said
   - Once you know their interest and level, give a concrete, honest starting point in plain language. For example: someone brand new to AI should start with Python fundamentals before touching ML libraries, someone starting web dev should learn HTML/CSS/JS before frameworks. Be specific and realistic, not vague.
   - Then point them to the exact place to act on it: "Go to Roadmaps in the sidebar and open the AI Custom Roadmap tab, chat with the Roadmap Mentor there and it'll build you a personalized step-by-step plan."

Keep the tone warm, direct, and encouraging, like a senior student who's happy to help, not a corporate FAQ bot. Ask at most one follow-up question at a time, don't interrogate them. If something is totally unrelated to learning to code or DevCollective, say briefly that it's outside what you can help with.`;

    const contents = [
      ...(history || []).slice(-10).map((h) => ({
        role: h.role,
        parts: [{ text: h.text }],
      })),
      { role: 'user', parts: [{ text: message }] },
    ];

    const response = await ai.models.generateContent({
      model: AI_MODEL,
      contents,
      config: { systemInstruction },
    });

    const reply = response.text || "Sorry, I couldn't generate a response. Please try again.";
    return res.json({ success: true, reply });
  } catch (err: any) {
    console.error('Error in /api/chat:', err);
    return res.status(500).json({ error: friendlyAiError(err) });
  }
});

// Auth Status Info Endpoint
app.get('/api/auth/info', (req, res) => {
  const baseUrl = getAppBaseUrl(req);
  res.json({
    appUrl: baseUrl,
    authType: 'native_email_password',
    googleConfigured: Boolean(GOOGLE_CLIENT_ID && GOOGLE_CLIENT_SECRET),
    githubConfigured: Boolean(GITHUB_CLIENT_ID && GITHUB_CLIENT_SECRET),
    googleCallbackUrl: `${baseUrl}/api/auth/google/callback`,
    githubCallbackUrl: `${baseUrl}/api/auth/github/callback`,
    message: 'Native Email/Password Authentication Active',
  });
});

// 1. Native User Registration Endpoint
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password, role, college, branch, academicYear } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long.' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Please enter a valid email address.' });
    }

    const newUser = await createUser({
      name,
      email,
      passwordRaw: password,
      role: role || 'student',
      college: college || 'Institute of Technology',
      branch: branch || 'Computer Science',
      academicYear: academicYear || '1st Year',
    });

    const token = createSession(newUser.id);
    return res.status(201).json({
      user: sanitizeUser(newUser),
      token,
      message: 'Account created successfully.',
    });
  } catch (err: any) {
    console.error('Registration error:', err);
    return res.status(400).json({ error: err.message || 'Registration failed.' });
  }
});

// 2. Native User Login Endpoint
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Please enter both email and password.' });
    }

    const user = getUserByEmail(email);
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    if (!user.passwordHash) {
      const providerName = user.authProvider === 'google' ? 'Google' : user.authProvider === 'github' ? 'GitHub' : 'a social account';
      return res.status(401).json({ error: `This account was created with ${providerName}. Please use the "${providerName}" button to sign in instead.` });
    }

    const passwordMatches = await bcrypt.compare(password, user.passwordHash);
    if (!passwordMatches) { // agar nahi toh niche wala response chalenga 
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const token = createSession(user.id);
    return res.json({
      user: sanitizeUser(user),
      token,
      message: 'Logged in successfully.',
    });
  } catch (err: any) {
    console.error('Login error:', err);
    return res.status(500).json({ error: 'Server error during login.' });
  }
});

// 3. Current Authenticated User Endpoint (Session Check)
app.get('/api/auth/me', (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Not authenticated.' });
  }

  const token = authHeader.substring(7);
  const user = getUserByToken(token);

  if (!user) {
    return res.status(401).json({ error: 'Session expired or invalid.' });
  }

  return res.json({ user: sanitizeUser(user) });
});

// 4. Logout Endpoint
app.post('/api/auth/logout', (req, res) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    deleteSession(token);
  }
  return res.json({ success: true, message: 'Logged out successfully.' });
});

// Fallback OAuth URL endpoints (kept for backwards compatibility with older frontend calls)
app.get('/api/auth/google/url', (req, res) => {
  const configured = Boolean(GOOGLE_CLIENT_ID && GOOGLE_CLIENT_SECRET);
  res.json({
    configured,
    message: configured ? 'Google OAuth is configured.' : 'Google OAuth is not configured yet. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in .env.',
  });
});

app.get('/api/auth/github/url', (req, res) => {
  const configured = Boolean(GITHUB_CLIENT_ID && GITHUB_CLIENT_SECRET);
  res.json({
    configured,
    message: configured ? 'GitHub OAuth is configured.' : 'GitHub OAuth is not configured yet. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in .env.',
  });
});

// --- Real Google OAuth ------------------------------------------------------
app.get('/api/auth/google', (req, res) => {
  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
    return res.redirect(`/?authError=${encodeURIComponent('Google sign-in is not configured on this server yet.')}`);
  }
  const redirectUri = `${getAppBaseUrl(req)}/api/auth/google/callback`;
  const params = new URLSearchParams({
    client_id: GOOGLE_CLIENT_ID,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'openid email profile',
    prompt: 'select_account',
  });
  res.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`);
});

app.get('/api/auth/google/callback', async (req, res) => {
  try {
    const code = req.query.code as string | undefined;
    if (!code) {
      return res.redirect(`/?authError=${encodeURIComponent('Google sign-in was cancelled or failed.')}`);
    }

    const redirectUri = `${getAppBaseUrl(req)}/api/auth/google/callback`;

    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });
    const tokenData: any = await tokenRes.json();
    if (!tokenRes.ok || !tokenData.access_token) {
      console.error('Google token exchange failed:', tokenData);
      return res.redirect(`/?authError=${encodeURIComponent('Could not complete Google sign-in.')}`);
    }

    const profileRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    const profile: any = await profileRes.json();

    if (!profile.email) {
      return res.redirect(`/?authError=${encodeURIComponent('Google did not share an email address.')}`);
    }

    const { user, isNewUser } = await findOrCreateOAuthUser({
      provider: 'google',
      email: profile.email,
      name: profile.name || profile.email.split('@')[0],
      avatar: profile.picture,
    });

    const token = createSession(user.id);
    return res.redirect(`/?token=${encodeURIComponent(token)}${isNewUser ? '&newUser=1' : ''}`);
  } catch (err: any) {
    console.error('Error in /api/auth/google/callback:', err);
    return res.redirect(`/?authError=${encodeURIComponent('Something went wrong during Google sign-in.')}`);
  }
});

// --- Real GitHub OAuth -------------------------------------------------------
app.get('/api/auth/github', (req, res) => {
  if (!GITHUB_CLIENT_ID || !GITHUB_CLIENT_SECRET) {
    return res.redirect(`/?authError=${encodeURIComponent('GitHub sign-in is not configured on this server yet.')}`);
  }
  const redirectUri = `${getAppBaseUrl(req)}/api/auth/github/callback`;
  const params = new URLSearchParams({
    client_id: GITHUB_CLIENT_ID,
    redirect_uri: redirectUri,
    scope: 'read:user user:email',
  });
  res.redirect(`https://github.com/login/oauth/authorize?${params.toString()}`);
});

app.get('/api/auth/github/callback', async (req, res) => {
  try {
    const code = req.query.code as string | undefined;
    if (!code) {
      return res.redirect(`/?authError=${encodeURIComponent('GitHub sign-in was cancelled or failed.')}`);
    }

    const redirectUri = `${getAppBaseUrl(req)}/api/auth/github/callback`;

    const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({
        client_id: GITHUB_CLIENT_ID,
        client_secret: GITHUB_CLIENT_SECRET,
        code,
        redirect_uri: redirectUri,
      }),
    });
    const tokenData: any = await tokenRes.json();
    if (!tokenRes.ok || !tokenData.access_token) {
      console.error('GitHub token exchange failed:', tokenData);
      return res.redirect(`/?authError=${encodeURIComponent('Could not complete GitHub sign-in.')}`);
    }

    const profileRes = await fetch('https://api.github.com/user', {
      headers: { Authorization: `Bearer ${tokenData.access_token}`, Accept: 'application/vnd.github+json' },
    });
    const profile: any = await profileRes.json();

    // GitHub only returns a public email if the user has one set; otherwise fetch the verified emails list
    let email: string | undefined = profile.email;
    if (!email) {
      const emailsRes = await fetch('https://api.github.com/user/emails', {
        headers: { Authorization: `Bearer ${tokenData.access_token}`, Accept: 'application/vnd.github+json' },
      });
      const emails: any[] = await emailsRes.json();
      const primary = Array.isArray(emails) ? emails.find((e) => e.primary && e.verified) : null;
      email = primary?.email || (Array.isArray(emails) ? emails[0]?.email : undefined);
    }

    if (!email) {
      return res.redirect(`/?authError=${encodeURIComponent('GitHub did not share a verified email address. Make sure your GitHub account has a public or verified email.')}`);
    }

    const { user, isNewUser } = await findOrCreateOAuthUser({
      provider: 'github',
      email,
      name: profile.name || profile.login || email.split('@')[0],
      avatar: profile.avatar_url,
    });

    const token = createSession(user.id);
    return res.redirect(`/?token=${encodeURIComponent(token)}${isNewUser ? '&newUser=1' : ''}`);
  } catch (err: any) {
    console.error('Error in /api/auth/github/callback:', err);
    return res.redirect(`/?authError=${encodeURIComponent('Something went wrong during GitHub sign-in.')}`);
  }
});

// --- Forgot Password (email verification code) ------------------------------
app.post('/api/auth/forgot-password', async (req, res) => {
  try {
    const { email } = req.body as { email?: string };
    if (!email) {
      return res.status(400).json({ error: 'Email is required.' });
    }

    const transporter = getMailTransporter();
    if (!transporter) {
      return res.status(500).json({
        error: 'Email sending is not configured on this server yet (EMAIL_USER / EMAIL_APP_PASSWORD missing).',
      });
    }

    const user = getUserByEmail(email);

    // Always respond the same way whether or not the account exists, so people can't
    // use this endpoint to check which emails are registered.
    if (!user) {
      return res.json({ success: true, message: 'If an account exists for that email, a verification code has been sent.' });
    }

    if (!user.passwordHash) {
      // OAuth-only account, there's no password to reset
      return res.json({ success: true, message: 'If an account exists for that email, a verification code has been sent.' });
    }

    const code = String(Math.floor(100000 + Math.random() * 900000)); // 6-digit code
    const codeHash = await bcrypt.hash(code, 10);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString(); // 10 minutes

    setPasswordResetCode(user.id, codeHash, expiresAt);

    await transporter.sendMail({
      from: `"DevCollective" <${process.env.EMAIL_USER}>`,
      to: user.email,
      subject: 'Your DevCollective password reset code',
      text: `Your DevCollective password reset code is ${code}. It expires in 10 minutes. If you didn't request this, you can safely ignore this email.`,
      html: `<div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h2 style="color:#111;">Reset your DevCollective password</h2>
        <p>Use this code to reset your password. It expires in 10 minutes.</p>
        <p style="font-size: 32px; font-weight: bold; letter-spacing: 6px; background:#f4f4f5; padding: 16px 24px; border-radius: 8px; text-align:center;">${code}</p>
        <p style="color:#666; font-size: 13px;">If you didn't request this, you can safely ignore this email.</p>
      </div>`,
    });

    return res.json({ success: true, message: 'If an account exists for that email, a verification code has been sent.' });
  } catch (err: any) {
    console.error('Error in /api/auth/forgot-password:', err);
    return res.status(500).json({ error: 'Could not send the verification email right now. Please try again shortly.' });
  }
});

app.post('/api/auth/reset-password', async (req, res) => {
  try {
    const { email, code, newPassword } = req.body as { email?: string; code?: string; newPassword?: string };

    if (!email || !code || !newPassword) {
      return res.status(400).json({ error: 'Email, code, and new password are all required.' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long.' });
    }

    const result = await resetPasswordWithCode(email, code, newPassword);
    if (!result.success) {
      return res.status(400).json({ error: result.error || 'Could not reset password.' });
    }

    return res.json({ success: true, message: 'Password updated successfully. You can now log in with your new password.' });
  } catch (err: any) {
    console.error('Error in /api/auth/reset-password:', err);
    return res.status(500).json({ error: 'Could not reset the password right now. Please try again.' });
  }
});

// Vite Integration
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`DevCollective Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
