import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import { UserProfile, UserRole } from '../src/types';

export interface UserRecord extends UserProfile {
  passwordHash: string;
}

export interface SessionRecord {
  token: string;
  userId: string;
  createdAt: string;
  expiresAt: string;
}

const DATA_DIR = path.join(process.cwd(), 'data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const SESSIONS_FILE = path.join(DATA_DIR, 'sessions.json');

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

// Read users from storage
export function getUsers(): UserRecord[] {
  ensureDataDir();
  if (!fs.existsSync(USERS_FILE)) {
    // Seed initial users with bcrypt hashed passwords
    const seedUsers: UserRecord[] = [
      {
        id: 'user_student_1',
        name: 'Piyush Kanojiya',
        email: 'kanojiyapk524@gmail.com',
        passwordHash: bcrypt.hashSync('password123', 10),
        role: 'student',
        college: 'Institute of Technology',
        branch: 'Computer Science',
        academicYear: '3rd Year',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        bio: 'Passionate student developer building full-stack web & AI apps.',
        rep: 2500,
        level: 18,
        streakDays: 42,
        githubUrl: 'https://github.com/kanojiyapk',
        linkedinUrl: 'https://linkedin.com/in/piyush-kanojiya',
        skills: ['React', 'TypeScript', 'Node.js', 'Python', 'AI/ML'],
        selectedDomains: ['Software Dev', 'AI/ML'],
        authProvider: 'email',
        createdAt: new Date().toISOString(),
      },
      {
        id: 'user_mentor_1',
        name: 'Rahul Sharma',
        email: 'rahul.mentor@college.edu',
        passwordHash: bcrypt.hashSync('password123', 10),
        role: 'mentor',
        college: 'Stanford CS',
        branch: 'Computer Science',
        academicYear: 'Graduate / Alumni',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
        bio: 'Senior Software Engineer & Student Mentor. Helping devs scale projects.',
        rep: 8400,
        level: 32,
        streakDays: 120,
        githubUrl: 'https://github.com/rahulsharma',
        linkedinUrl: 'https://linkedin.com/in/rahulsharma',
        skills: ['System Design', 'React', 'Go', 'Cloud Architecture'],
        selectedDomains: ['System Design', 'Backend'],
        authProvider: 'email',
        createdAt: new Date().toISOString(),
      },
      {
        id: 'user_admin_1',
        name: 'Platform Administrator',
        email: 'admin@devcollective.edu',
        passwordHash: bcrypt.hashSync('adminpassword', 10),
        role: 'admin',
        college: 'DevCollective Central',
        branch: 'Administration',
        academicYear: 'Faculty / Admin',
        avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
        bio: 'DevCollective Platform Admin. Managing verifications, roles, and ecosystem health.',
        rep: 15000,
        level: 50,
        streakDays: 365,
        githubUrl: 'https://github.com/devcollective-admin',
        linkedinUrl: 'https://linkedin.com/company/devcollective',
        skills: ['Governance', 'Security', 'DevOps', 'Community Management'],
        selectedDomains: ['Platform Admin'],
        authProvider: 'email',
        createdAt: new Date().toISOString(),
      },
    ];

    fs.writeFileSync(USERS_FILE, JSON.stringify(seedUsers, null, 2));
    return seedUsers;
  }

  try {
    const raw = fs.readFileSync(USERS_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

// Save users to storage
export function saveUsers(users: UserRecord[]) {
  ensureDataDir();
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
}

// Find user by email
export function getUserByEmail(email: string): UserRecord | undefined {
  const users = getUsers();
  return users.find((u) => u.email.toLowerCase() === email.toLowerCase());
}

// Find user by ID
export function getUserById(id: string): UserRecord | undefined {
  const users = getUsers();
  return users.find((u) => u.id === id);
}

// Create new user with hashed password
export async function createUser(data: {
  name: string;
  email: string;
  passwordRaw: string;
  role?: UserRole;
  college?: string;
  branch?: string;
  academicYear?: string;
}): Promise<UserRecord> {
  const users = getUsers();

  if (users.some((u) => u.email.toLowerCase() === data.email.toLowerCase())) {
    throw new Error('An account with this email address already exists.');
  }

  const saltRounds = 10;
  const passwordHash = await bcrypt.hash(data.passwordRaw, saltRounds);

  const newUser: UserRecord = {
    id: `user_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    name: data.name,
    email: data.email,
    passwordHash,
    role: data.role || 'student',
    college: data.college || 'Institute of Technology',
    branch: data.branch || 'Computer Science',
    academicYear: data.academicYear || '1st Year',
    avatar: `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(data.email)}`,
    bio: `Welcome to DevCollective! Building software as a ${data.role || 'student'}.`,
    rep: 100,
    level: 1,
    streakDays: 1,
    skills: ['JavaScript', 'HTML/CSS'],
    selectedDomains: ['Full Stack Development'],
    authProvider: 'email',
    createdAt: new Date().toISOString(),
  };

  users.push(newUser);
  saveUsers(users);
  return newUser;
}

// Session store management
export function getSessions(): SessionRecord[] {
  ensureDataDir();
  if (!fs.existsSync(SESSIONS_FILE)) {
    return [];
  }
  try {
    const raw = fs.readFileSync(SESSIONS_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function saveSessions(sessions: SessionRecord[]) {
  ensureDataDir();
  fs.writeFileSync(SESSIONS_FILE, JSON.stringify(sessions, null, 2));
}

export function createSession(userId: string): string {
  const sessions = getSessions();
  const token = `session_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString(); // 7 days

  const newSession: SessionRecord = {
    token,
    userId,
    createdAt: now.toISOString(),
    expiresAt,
  };

  sessions.push(newSession);
  saveSessions(sessions);
  return token;
}

export function getUserByToken(token: string): UserRecord | null {
  if (!token) return null;
  const sessions = getSessions();
  const session = sessions.find((s) => s.token === token);
  if (!session) return null;

  // Check expiration
  if (new Date(session.expiresAt) < new Date()) {
    deleteSession(token);
    return null;
  }

  const user = getUserById(session.userId);
  return user || null;
}

export function deleteSession(token: string) {
  const sessions = getSessions();
  const updated = sessions.filter((s) => s.token !== token);
  saveSessions(updated);
}

// Strip passwordHash before returning to client
export function sanitizeUser(user: UserRecord): UserProfile {
  const { passwordHash, ...sanitized } = user;
  return sanitized;
}
