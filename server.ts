import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import multer from 'multer';
import { GoogleGenAI, Type } from '@google/genai';
import { clerkClient, clerkMiddleware, getAuth } from '@clerk/express';
import { supabaseAdmin } from './server/supabase';
import { registerLearningProgressRoutes } from './server/learningProgress';
import { getPlatformIdentity, registerAdminRoutes } from './server/adminRoutes';

dotenv.config();
const app = express(); const PORT = 3000; const AI_MODEL = 'gemini-3.6-flash';
app.use(clerkMiddleware()); app.use(express.json());
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 }, fileFilter: (_req, file, cb) => { if (file.mimetype === 'application/pdf') cb(null, true); else cb(new Error('Only PDF files are supported.')); } });
function getAppBaseUrl(req: express.Request): string { return process.env.APP_URL || `http://${req.headers.host || 'localhost:3000'}`; }
function requireAuth(req: express.Request, res: express.Response, next: express.NextFunction) { const { isAuthenticated, userId } = getAuth(req); if (!isAuthenticated || !userId) return res.status(401).json({ error: 'Not authenticated.' }); (req as any).authUserId = userId; next(); }
registerLearningProgressRoutes(app, requireAuth);
registerAdminRoutes(app, requireAuth);
function friendlyAiError(err: any): string { const rawMessage: string = err?.message || ''; if (rawMessage.includes('API key not valid') || rawMessage.includes('API_KEY_INVALID') || rawMessage.includes('403')) return 'The AI service is not configured correctly on this server (invalid API key). Please let the site admin know.'; if (rawMessage.includes('429') || rawMessage.toLowerCase().includes('quota') || rawMessage.toLowerCase().includes('rate limit')) return 'The AI service is getting a lot of requests right now (or the account is out of quota). Please try again shortly.'; if (rawMessage.includes('503') || rawMessage.toLowerCase().includes('unavailable') || rawMessage.toLowerCase().includes('overloaded') || rawMessage.toLowerCase().includes('high demand')) return "Google's AI model is temporarily overloaded from high demand right now. This usually clears up within a minute or two, please try again shortly."; if (rawMessage.includes('500') || rawMessage.toLowerCase().includes('internal error')) return 'The AI service hit an internal error on its end. Please try again in a moment.'; const looksLikeRawJson = rawMessage.trim().startsWith('{') || rawMessage.trim().startsWith('['); return !rawMessage || looksLikeRawJson ? 'Something went wrong reaching the AI service. Please try again in a moment.' : rawMessage; }
function getGeminiClient(): GoogleGenAI | null { const apiKey = process.env.GEMINI_API_KEY; return apiKey ? new GoogleGenAI({ apiKey, httpOptions: { headers: { 'User-Agent': 'aistudio-build' } } }) : null; }
function emptyProfile(userId: string, clerkUser: any, pending: any = {}) { const email = clerkUser.emailAddresses?.find((e: any) => e.id === clerkUser.primaryEmailAddressId)?.emailAddress || clerkUser.emailAddresses?.[0]?.emailAddress || ''; const name = [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(' ') || clerkUser.username || email.split('@')[0] || 'Developer'; return { clerk_user_id: userId, name: pending.name || name, email, role: pending.role || 'student', college: pending.college || '', branch: pending.branch || '', academic_year: pending.academicYear || '', avatar: clerkUser.imageUrl || '', bio: '', rep: 0, level: 1, streak_days: 0, github_url: '', linkedin_url: '', skills: [], selected_domains: [], auth_provider: 'clerk', has_completed_onboarding: false, created_at: new Date().toISOString() }; }
function toUserProfile(row: any) { return row ? { id: row.clerk_user_id, name: row.name, email: row.email, role: row.role, college: row.college, branch: row.branch, academicYear: row.academic_year, avatar: row.avatar, bio: row.bio, rep: row.rep, level: row.level, streakDays: row.streak_days, githubUrl: row.github_url, linkedinUrl: row.linkedin_url, skills: row.skills || [], selectedDomains: row.selected_domains || [], authProvider: 'clerk', createdAt: row.created_at, hasCompletedOnboarding: row.has_completed_onboarding ?? false } : null; }
async function getOrCreateProfile(userId: string, pending: any = {}) { if (!supabaseAdmin) throw new Error('Supabase is not configured. Set SUPABASE_URL and SUPABASE_SECRET_KEY on the server.'); const { data: existing, error: selectError } = await supabaseAdmin.from('devcollective_profiles').select('*').eq('clerk_user_id', userId).maybeSingle(); if (selectError) throw selectError; if (existing) return existing; const clerkUser = await clerkClient.users.getUser(userId); const profile = emptyProfile(userId, clerkUser, pending); const { data, error } = await supabaseAdmin.from('devcollective_profiles').insert(profile).select('*').single(); if (error) throw error; return data; }
async function syncAdminProfileRole(userId: string, profile: any) { if (!supabaseAdmin) return profile; const identity = await getPlatformIdentity(userId); if (!identity.isAdmin || profile.role === 'admin') return profile; const { data, error } = await supabaseAdmin.from('devcollective_profiles').update({ role: 'admin' }).eq('clerk_user_id', userId).select('*').single(); if (error) throw error; return data; }
function toMentorProfile(row: any) { return { id: row.clerk_user_id, name: row.name, title: row.role === 'faculty' ? 'Faculty Mentor' : 'Mentor', college: row.college || '', avatar: row.avatar || '', roleType: row.role === 'faculty' ? 'FACULTY' : 'SENIOR', skills: Array.isArray(row.skills) ? row.skills : [], level: Number(row.level) || 1, rep: Number(row.rep) || 0, bio: row.bio || '', availability: 'Not specified', isBusy: false, rating: 0, studentsHelped: 0 }; }
async function loadCommunityPosts(userId: string) {
  if (!supabaseAdmin) throw new Error('Supabase is not configured.');
  const { data: posts, error: postsError } = await supabaseAdmin.from('devcollective_posts').select('id,author_clerk_user_id,category,title,content,image_url,created_at,updated_at').order('created_at', { ascending: false }).limit(100);
  if (postsError) throw postsError;
  if (!posts?.length) return [];
  const authorIds = Array.from(new Set(posts.map((post: any) => post.author_clerk_user_id)));
  const { data: profiles, error: profilesError } = await supabaseAdmin.from('devcollective_profiles').select('clerk_user_id,name,college,avatar,role,rep').in('clerk_user_id', authorIds);
  if (profilesError) throw profilesError;
  const profileMap = new Map((profiles || []).map((profile: any) => [profile.clerk_user_id, profile]));
  const postIds = posts.map((post: any) => post.id);
  const { data: likes, error: likesError } = await supabaseAdmin.from('devcollective_post_likes').select('post_id,user_clerk_user_id').in('post_id', postIds);
  if (likesError) throw likesError;
  const likeCount = new Map<string, number>();
  const likedByUser = new Set<string>();
  for (const like of likes || []) {
    likeCount.set(like.post_id, (likeCount.get(like.post_id) || 0) + 1);
    if (like.user_clerk_user_id === userId) likedByUser.add(like.post_id);
  }
  return posts.map((post: any) => {
    const author = profileMap.get(post.author_clerk_user_id) || {};
    return {
      id: post.id,
      authorId: post.author_clerk_user_id,
      authorName: author.name || 'Developer',
      authorCollege: author.college || '',
      authorAvatar: author.avatar || '',
      authorRole: author.role || 'student',
      authorRep: Number(author.rep) || 0,
      category: post.category,
      title: post.title || undefined,
      content: post.content,
      imageUrl: post.image_url || undefined,
      likes: likeCount.get(post.id) || 0,
      commentsCount: 0,
      createdAt: post.created_at,
      likedByMe: likedByUser.has(post.id),
    };
  });
}
app.get('/api/health', (_req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));
app.get('/api/auth/info', (req, res) => res.json({ appUrl: getAppBaseUrl(req), authType: 'clerk', googleConfigured: true, githubConfigured: true, googleCallbackUrl: '', githubCallbackUrl: '', message: 'Clerk authentication active; Supabase stores application profiles.' }));
app.get('/api/auth/me', requireAuth, async (req, res) => { try { let user = await getOrCreateProfile((req as any).authUserId); user = await syncAdminProfileRole((req as any).authUserId, user); return res.json({ user: toUserProfile(user) }); } catch (err: any) { console.error('Error loading Clerk/Supabase profile:', err); return res.status(500).json({ error: err.message || 'Could not load your profile.' }); } });
app.post('/api/auth/sync', requireAuth, async (req, res) => { try { let user = await getOrCreateProfile((req as any).authUserId, req.body || {}); user = await syncAdminProfileRole((req as any).authUserId, user); return res.json({ user: toUserProfile(user) }); } catch (err: any) { console.error('Error syncing Clerk profile to Supabase:', err); return res.status(500).json({ error: err.message || 'Could not sync your profile.' }); } });
app.get('/api/mentors', requireAuth, async (_req, res) => { try { if (!supabaseAdmin) throw new Error('Supabase is not configured.'); const { data, error } = await supabaseAdmin.from('devcollective_profiles').select('clerk_user_id,name,email,role,college,avatar,bio,rep,level,skills').in('role', ['mentor','faculty']).order('name', { ascending: true }); if (error) throw error; return res.json({ mentors: (data || []).map(toMentorProfile) }); } catch (err: any) { console.error('Error loading mentors from Supabase:', err); return res.status(500).json({ error: err.message || 'Could not load mentors.' }); } });
app.get('/api/community/posts', requireAuth, async (req, res) => { try { const posts = await loadCommunityPosts((req as any).authUserId); return res.json({ posts }); } catch (err: any) { console.error('Error loading community posts:', err); return res.status(500).json({ error: err.message || 'Could not load community posts.' }); } });
app.post('/api/community/posts', requireAuth, async (req, res) => { try { if (!supabaseAdmin) throw new Error('Supabase is not configured.'); const userId = (req as any).authUserId as string; const category = String(req.body?.category || 'General'); const allowedCategories = new Set(['Build in Public','Questions','Projects','Hackathons','AI','Android','General']); const title = typeof req.body?.title === 'string' ? req.body.title.trim().slice(0, 160) : ''; const content = typeof req.body?.content === 'string' ? req.body.content.trim().slice(0, 5000) : ''; if (!allowedCategories.has(category)) return res.status(400).json({ error: 'Invalid post category.' }); if (!content) return res.status(400).json({ error: 'Post content is required.' }); const { data, error } = await supabaseAdmin.from('devcollective_posts').insert({ author_clerk_user_id: userId, category, title: title || null, content }).select('id,author_clerk_user_id,category,title,content,image_url,created_at,updated_at').single(); if (error) throw error; const posts = await loadCommunityPosts(userId); const created = posts.find((post: any) => post.id === data.id) || null; return res.status(201).json({ success: true, post: created }); } catch (err: any) { console.error('Error creating community post:', err); return res.status(500).json({ error: err.message || 'Could not create community post.' }); } });
app.post('/api/community/posts/:postId/like', requireAuth, async (req, res) => { try { if (!supabaseAdmin) throw new Error('Supabase is not configured.'); const userId = (req as any).authUserId as string; const postId = req.params.postId; const { data: existing, error: lookupError } = await supabaseAdmin.from('devcollective_post_likes').select('post_id').eq('post_id', postId).eq('user_clerk_user_id', userId).maybeSingle(); if (lookupError) throw lookupError; if (existing) { const { error } = await supabaseAdmin.from('devcollective_post_likes').delete().eq('post_id', postId).eq('user_clerk_user_id', userId); if (error) throw error; } else { const { error } = await supabaseAdmin.from('devcollective_post_likes').insert({ post_id: postId, user_clerk_user_id: userId }); if (error) throw error; } const { count, error: countError } = await supabaseAdmin.from('devcollective_post_likes').select('*', { count: 'exact', head: true }).eq('post_id', postId); if (countError) throw countError; return res.json({ success: true, likedByMe: !existing, likes: count || 0 }); } catch (err: any) { console.error('Error toggling community post like:', err); return res.status(500).json({ error: err.message || 'Could not update post like.' }); } });
app.get('/api/auth/profile-by-email', async (req, res) => { try { if (!supabaseAdmin) throw new Error('Supabase is not configured.'); const email = String(req.query.email || '').trim().toLowerCase(); if (!email) return res.status(400).json({ error: 'Email is required.' }); const { data, error } = await supabaseAdmin.from('devcollective_profiles').select('clerk_user_id').ilike('email', email).maybeSingle(); if (error) throw error; return res.json({ exists: Boolean(data) }); } catch (err: any) { console.error('Error checking Supabase profile:', err); return res.status(500).json({ error: err.message || 'Could not check your profile.' }); } });
app.patch('/api/users/profile', requireAuth, async (req, res) => { try { if (!supabaseAdmin) throw new Error('Supabase is not configured.'); const userId = (req as any).authUserId as string; const allowedFields = ['branch', 'academicYear', 'githubUrl', 'linkedinUrl', 'skills', 'bio', 'selectedDomains', 'avatar', 'college', 'name', 'rep', 'hasCompletedOnboarding']; const updates: Record<string, any> = {}; for (const field of allowedFields) if (field in req.body) updates[field] = req.body[field]; const dbUpdates: Record<string, any> = {}; if ('branch' in updates) dbUpdates.branch = updates.branch; if ('academicYear' in updates) dbUpdates.academic_year = updates.academicYear; if ('githubUrl' in updates) dbUpdates.github_url = updates.githubUrl; if ('linkedinUrl' in updates) dbUpdates.linkedin_url = updates.linkedinUrl; if ('skills' in updates) dbUpdates.skills = updates.skills; if ('bio' in updates) dbUpdates.bio = updates.bio; if ('selectedDomains' in updates) dbUpdates.selected_domains = updates.selectedDomains; if ('avatar' in updates) dbUpdates.avatar = updates.avatar; if ('college' in updates) dbUpdates.college = updates.college; if ('name' in updates) dbUpdates.name = updates.name; if ('hasCompletedOnboarding' in updates) dbUpdates.has_completed_onboarding = Boolean(updates.hasCompletedOnboarding); if ('rep' in updates) { dbUpdates.rep = updates.rep; dbUpdates.level = Math.max(1, Math.floor((Number(updates.rep) || 0) / 150) + 1); } const { data, error } = await supabaseAdmin.from('devcollective_profiles').update(dbUpdates).eq('clerk_user_id', userId).select('*').single(); if (error) throw error; return res.json({ success: true, user: toUserProfile(data) }); } catch (err: any) { console.error('Error updating Supabase profile:', err); return res.status(500).json({ error: err.message || 'Failed to update profile.' }); } });

const ROADMAP_JSON_SCHEMA = { type: Type.OBJECT, properties: { roadmapTitle: { type: Type.STRING }, overview: { type: Type.STRING }, targetRole: { type: Type.STRING }, estimatedWeeksTotal: { type: Type.INTEGER }, recommendedPrerequisites: { type: Type.ARRAY, items: { type: Type.STRING } }, levels: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { levelNumber: { type: Type.INTEGER }, title: { type: Type.STRING }, description: { type: Type.STRING }, estimatedWeeks: { type: Type.INTEGER }, topics: { type: Type.ARRAY, items: { type: Type.STRING } }, capstoneProject: { type: Type.OBJECT, properties: { title: { type: Type.STRING }, description: { type: Type.STRING }, keySkills: { type: Type.ARRAY, items: { type: Type.STRING } } }, required: ['title', 'description', 'keySkills'] }, learningResources: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { title: { type: Type.STRING }, type: { type: Type.STRING }, description: { type: Type.STRING } }, required: ['title', 'type', 'description'] } } }, required: ['levelNumber', 'title', 'description', 'estimatedWeeks', 'topics', 'capstoneProject', 'learningResources'] } } }, required: ['roadmapTitle', 'overview', 'targetRole', 'estimatedWeeksTotal', 'levels'] };
const ROADMAP_MENTOR_SYSTEM_PROMPT = `You are an expert tech career mentor and roadmap architect for college engineering students on DevCollective. Your job is to have a short, natural conversation with the student to understand: (1) which technology or field they're interested in, (2) their current skill level (beginner, intermediate, or advanced), and (3) what they already know. Ask ONE short question at a time. Once you have enough information, usually after 2 to 4 exchanges, call finalize_roadmap with a complete, realistic, progressive roadmap. If they're a true beginner, start with real fundamentals and never skip ahead. Use plain, encouraging language and concrete topics, capstones, and learning resources.`;
const finalizeRoadmapFunctionDeclaration = { name: 'finalize_roadmap', description: "Generate the student's complete personalized learning roadmap once enough information is known.", parameters: ROADMAP_JSON_SCHEMA as any };
app.post('/api/ai/roadmap-chat', async (req, res) => { try { const { message, history } = req.body as { message: string; history?: { role: 'user' | 'model'; text: string }[] }; if (!message || !message.trim()) return res.status(400).json({ error: 'Message is required.' }); const ai = getGeminiClient(); if (!ai) return res.status(500).json({ error: 'GEMINI_API_KEY is not configured on the server. Please add it to your environment variables.' }); const contents = [...(history || []).slice(-16).map((h) => ({ role: h.role, parts: [{ text: h.text }] })), { role: 'user', parts: [{ text: message }] }]; const response = await ai.models.generateContent({ model: AI_MODEL, contents, config: { systemInstruction: ROADMAP_MENTOR_SYSTEM_PROMPT, tools: [{ functionDeclarations: [finalizeRoadmapFunctionDeclaration] }] } }); const functionCalls = response.functionCalls; if (functionCalls?.length && functionCalls[0].name === 'finalize_roadmap') return res.json({ success: true, type: 'roadmap', roadmap: functionCalls[0].args }); return res.json({ success: true, type: 'question', message: response.text || "Could you tell me a bit more about what you're interested in?" }); } catch (err: any) { console.error('Error in /api/ai/roadmap-chat:', err); return res.status(500).json({ error: friendlyAiError(err) }); } });
type ResumeExtraction = {
  branch: string;
  academicYear: string;
  bio: string;
  skills: string[];
  githubUrl: string;
  linkedinUrl: string;
  confidence?: string;
};

function validateResumeExtraction(value: unknown): ResumeExtraction {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error('The AI service returned an invalid resume extraction.');
  }

  const data = value as Record<string, unknown>;
  const stringField = (field: keyof ResumeExtraction, maxLength: number, required = true): string => {
    const raw = data[field];
    if (raw === undefined || raw === null) {
      if (required) throw new Error(`Resume extraction is missing the "${String(field)}" field.`);
      return '';
    }
    if (typeof raw !== 'string') throw new Error(`Resume extraction field "${String(field)}" must be a string.`);
    return raw.trim().slice(0, maxLength);
  };

  const rawSkills = data.skills;
  if (!Array.isArray(rawSkills)) {
    throw new Error('Resume extraction field "skills" must be an array.');
  }

  const skills = Array.from(new Set(
    rawSkills
      .filter((skill): skill is string => typeof skill === 'string')
      .map((skill) => skill.trim().slice(0, 80))
      .filter(Boolean)
  )).slice(0, 50);

  if (rawSkills.some((skill) => typeof skill !== 'string')) {
    throw new Error('Resume extraction contains an invalid skill value.');
  }

  const githubUrl = stringField('githubUrl', 500);
  const linkedinUrl = stringField('linkedinUrl', 500);
  const urlPattern = /^https?:\\/\\//i;
  if (githubUrl && !urlPattern.test(githubUrl)) throw new Error('Resume extraction returned an invalid GitHub URL.');
  if (linkedinUrl && !urlPattern.test(linkedinUrl)) throw new Error('Resume extraction returned an invalid LinkedIn URL.');

  return {
    branch: stringField('branch', 120),
    academicYear: stringField('academicYear', 80),
    bio: stringField('bio', 250),
    skills,
    githubUrl,
    linkedinUrl,
    confidence: stringField('confidence', 200, false) || undefined,
  };
}

app.post('/api/resume/parse', requireAuth, upload.single('resume'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No resume file uploaded.' });
    const ai = getGeminiClient();
    if (!ai) return res.status(500).json({ error: 'GEMINI_API_KEY is not configured on the server. Please add it to your environment variables.' });

    const { PDFParse } = await import('pdf-parse');
    const parser = new PDFParse({ data: req.file.buffer });
    const textResult = await parser.getText();
    await parser.destroy();

    const resumeText = textResult.text.slice(0, 15000);
    if (!resumeText.trim()) {
      return res.status(422).json({ error: 'Could not extract any text from this PDF. Try a text-based PDF, not a scanned image.' });
    }

    const prompt = `Here is the raw extracted text from a student's resume:

"""
${resumeText}
"""

Read it carefully and extract structured profile data for a college developer platform.
Only include information actually present or strongly implied by the resume.
Do not invent information.
For skills, only include technologies or technical skills supported by the resume text.
For URLs, return only URLs that are explicitly present in the resume.
Keep the bio concise and grounded in the resume.`;

    const response = await ai.models.generateContent({
      model: AI_MODEL,
      contents: prompt,
      config: {
        systemInstruction: 'You are a resume parser for a student developer platform. Extract accurate, grounded structured data only. Never fabricate skills, links, or achievements.',
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            branch: { type: Type.STRING },
            academicYear: { type: Type.STRING },
            bio: { type: Type.STRING },
            skills: { type: Type.ARRAY, items: { type: Type.STRING } },
            githubUrl: { type: Type.STRING },
            linkedinUrl: { type: Type.STRING },
            confidence: { type: Type.STRING },
          },
          required: ['branch', 'academicYear', 'bio', 'skills', 'githubUrl', 'linkedinUrl'],
        },
      },
    });

    let rawParsed: unknown;
    try {
      rawParsed = JSON.parse(response.text || '{}');
    } catch {
      throw new Error('The AI service returned invalid JSON for the resume.');
    }

    const extracted = validateResumeExtraction(rawParsed);
    return res.json({ success: true, extracted });
  } catch (err: any) {
    console.error('Error parsing resume:', err);
    return res.status(500).json({ error: friendlyAiError(err) });
  }
});

async function startServer() {
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(process.cwd(), 'dist')));
    app.get('*', (req, res, next) => {
      if (req.path.startsWith('/api/')) return next();
      res.sendFile(path.join(process.cwd(), 'dist', 'index.html'));
    });
  } else {
    const vite = await createViteServer({ server: { middlewareMode: true }, appType: 'spa' });
    app.use(vite.middlewares);
  }
  app.listen(PORT, () => console.log(`DevCollective server running on http://localhost:${PORT}`));
}
startServer();
