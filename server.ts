import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import { GoogleGenAI, Type } from '@google/genai';
import {
  createUser,
  getUserByEmail,
  getUserByToken,
  createSession,
  deleteSession,
  sanitizeUser,
} from './server/db';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// API Routes
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// AI Personalized Roadmap Generator Endpoint
app.post('/api/ai/generate-roadmap', async (req, res) => {
  try {
    const { branch, targetRole, skillLevel, customGoals } = req.body;

    if (!targetRole || !branch || !skillLevel) {
      return res.status(400).json({ error: 'Branch, target role, and skill level are required.' });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({
        error: 'GEMINI_API_KEY is not configured on the server. Please add it to your environment variables.',
      });
    }

    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });

    const prompt = `Generate an AI-powered personalized tech learning roadmap for an engineering student with:
- Academic Branch: ${branch}
- Target Role: ${targetRole}
- Current Skill Level: ${skillLevel}
${customGoals ? `- Custom Goal / Note: ${customGoals}` : ''}

Create a progressive 4-level roadmap bridging their academic background (${branch}) directly to their goal (${targetRole}).
Include specific topics, estimated timeline, capstone project, and learning resources for each level.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: prompt,
      config: {
        systemInstruction:
          'You are an expert Tech Career Advisor and Senior Software Architect. Output a comprehensive, practical learning roadmap tailored specifically for college engineering students.',
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            roadmapTitle: { type: Type.STRING },
            overview: { type: Type.STRING },
            targetRole: { type: Type.STRING },
            estimatedWeeksTotal: { type: Type.INTEGER },
            recommendedPrerequisites: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
            levels: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  levelNumber: { type: Type.INTEGER },
                  title: { type: Type.STRING },
                  description: { type: Type.STRING },
                  estimatedWeeks: { type: Type.INTEGER },
                  topics: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                  },
                  capstoneProject: {
                    type: Type.OBJECT,
                    properties: {
                      title: { type: Type.STRING },
                      description: { type: Type.STRING },
                      keySkills: {
                        type: Type.ARRAY,
                        items: { type: Type.STRING },
                      },
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
                required: [
                  'levelNumber',
                  'title',
                  'description',
                  'estimatedWeeks',
                  'topics',
                  'capstoneProject',
                  'learningResources',
                ],
              },
            },
          },
          required: ['roadmapTitle', 'overview', 'targetRole', 'estimatedWeeksTotal', 'levels'],
        },
      },
    });

    const jsonText = response.text || '{}';
    const roadmap = JSON.parse(jsonText);

    return res.json({ success: true, roadmap });
  } catch (err: any) {
    console.error('Error in /api/ai/generate-roadmap:', err);
    return res.status(500).json({ error: err.message || 'Failed to generate roadmap.' });
  }
});

// Auth Status Info Endpoint
app.get('/api/auth/info', (req, res) => {
  const baseUrl = process.env.APP_URL || `http://${req.headers.host || 'localhost:3000'}`;
  res.json({
    appUrl: baseUrl,
    authType: 'native_email_password',
    googleConfigured: false,
    githubConfigured: false,
    message: 'Native Email/Password Authentication Active for MVP',
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

    const passwordMatches = await bcrypt.compare(password, user.passwordHash);
    if (!passwordMatches) {
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

// Fallback OAuth URL endpoints (Graceful response for MVP)
app.get('/api/auth/google/url', (_req, res) => {
  res.json({ configured: false, message: 'OAuth disabled for MVP. Please use native Email/Password login.' });
});

app.get('/api/auth/github/url', (_req, res) => {
  res.json({ configured: false, message: 'OAuth disabled for MVP. Please use native Email/Password login.' });
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
