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
  createFacultyInvitation,
  getFacultyInvitation,
  markFacultyInvitationAccepted,
  createFacultyUser,
  createFacultyProfile,
  getPendingFacultyProfiles,
  getFacultyProfile,
  setFacultyApproval,
  getUsers,
} from './server/db';

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
  return nodemailer.createTransport({ service: 'gmail', auth: { user: emailUser, pass: emailPass } });
}

function requireAuth(req: express.Request, res: express.Response, next: express.NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) return res.status(401).json({ error: 'Not authenticated.' });
  const user = getUserByToken(authHeader.substring(7));
  if (!user) return res.status(401).json({ error: 'Session expired or invalid.' });
  if (user.accountStatus === 'suspended') return res.status(403).json({ error: 'This account has been suspended.' });
  (req as any).authUser = user;
  next();
}

function requireAdmin(req: express.Request, res: express.Response, next: express.NextFunction) {
  const user = (req as any).authUser;
  if (!user || user.role !== 'admin') return res.status(403).json({ error: 'Admin access is required.' });
  next();
}

// Shared: turn raw Gemini errors into something safe/readable to show the user
function friendlyAiError(err: any): string {
  const rawMessage: string = err?.message || '';
  if (rawMessage.includes('API key not valid') || rawMessage.includes('API_KEY_INVALID') || rawMessage.includes('403')) return 'The AI service is not configured correctly on this server (invalid API key). Please let the site admin know.';
  if (rawMessage.includes('429') || rawMessage.toLowerCase().includes('quota') || rawMessage.toLowerCase().includes('rate limit')) return 'The AI service is getting a lot of requests right now (or the account is out of quota). Please try again shortly.';
  if (rawMessage.includes('503') || rawMessage.toLowerCase().includes('unavailable') || rawMessage.toLowerCase().includes('overloaded') || rawMessage.toLowerCase().includes('high demand')) return "Google's AI model is temporarily overloaded from high demand right now. This usually clears up within a minute or two, please try again shortly.";
  if (rawMessage.includes('500') || rawMessage.toLowerCase().includes('internal error')) return 'The AI service hit an internal error on its end. Please try again in a moment.';
  const looksLikeRawJson = rawMessage.trim().startsWith('{') || rawMessage.trim().startsWith('[');
  if (!rawMessage || looksLikeRawJson) return 'Something went wrong reaching the AI service. Please try again in a moment.';
  return rawMessage;
}

function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  return new GoogleGenAI({ apiKey, httpOptions: { headers: { 'User-Agent': 'aistudio-build' } } });
}

// In-memory upload (no need to persist the raw PDF, we only need its text)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => file.mimetype === 'application/pdf' ? cb(null, true) : cb(new Error('Only PDF files are supported.')),
});

// API Routes
app.get('/api/health', (_req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

