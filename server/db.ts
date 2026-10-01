import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { UserProfile, UserRole } from '../src/types';

export interface UserRecord extends UserProfile {
  passwordHash: string;
  resetCodeHash?: string;
  resetCodeExpiresAt?: string;
}

export interface FacultyInvitationRecord {
  id: string;
  email: string;
  college: string;
  tokenHash: string;
  status: 'pending' | 'accepted' | 'revoked' | 'expired';
  expiresAt: string;
  acceptedAt?: string;
  createdAt: string;
}

export interface FacultyRegistrationRecord {
  inviteToken: string;
  email: string;
  name: string;
  employeeId: string;
  department: string;
  designation: string;
  phone?: string;
  subjects?: string[];
  expertise?: string[];
  yearsExperience?: number;
  mentoringAreas?: string[];
  bio?: string;
  passwordRaw: string;
}

export interface FacultyProfileRecord {
  userId: string;
  employeeId: string;
  department: string;
  designation: string;
  phone?: string;
  subjects: string[];
  expertise: string[];
  yearsExperience?: number;
  mentoringAreas: string[];
  bio?: string;
  approvalStatus: 'pending' | 'approved' | 'rejected' | 'suspended';
  approvedBy?: string;
  approvedAt?: string;
  createdAt: string;
  updatedAt: string;
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
const FACULTY_INVITES_FILE = path.join(DATA_DIR, 'faculty-invitations.json');
const FACULTY_PROFILES_FILE = path.join(DATA_DIR, 'faculty-profiles.json');

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
}

function getFacultyInvitations(): FacultyInvitationRecord[] {
  ensureDataDir();
  if (!fs.existsSync(FACULTY_INVITES_FILE)) return [];
  try { return JSON.parse(fs.readFileSync(FACULTY_INVITES_FILE, 'utf-8')); } catch { return []; }
}

function saveFacultyInvitations(invitations: FacultyInvitationRecord[]) {
  ensureDataDir();
  fs.writeFileSync(FACULTY_INVITES_FILE, JSON.stringify(invitations, null, 2));
}

function getFacultyProfiles(): FacultyProfileRecord[] {
  ensureDataDir();
  if (!fs.existsSync(FACULTY_PROFILES_FILE)) return [];
  try { return JSON.parse(fs.readFileSync(FACULTY_PROFILES_FILE, 'utf-8')); } catch { return []; }
}

function saveFacultyProfiles(profiles: FacultyProfileRecord[]) {
  ensureDataDir();
  fs.writeFileSync(FACULTY_PROFILES_FILE, JSON.stringify(profiles, null, 2));
}

function hashInvitationToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export function getFacultyInvitation(token: string): FacultyInvitationRecord | undefined {
  const hash = hashInvitationToken(token);
  const invitations = getFacultyInvitations();
  const index = invitations.findIndex((item) => item.tokenHash === hash);
  if (index === -1) return undefined;
  const invitation = invitations[index];
  if (invitation.status === 'pending' && new Date(invitation.expiresAt) < new Date()) {
    invitations[index] = { ...invitation, status: 'expired' };
    saveFacultyInvitations(invitations);
    return undefined;
  }
  return invitation;
}

export function createFacultyInvitation(email: string, college = 'GHRCEMN', invitedBy?: string): { invitation: FacultyInvitationRecord; token: string } {
  const normalizedEmail = email.trim().toLowerCase();
  if (!normalizedEmail) throw new Error('Faculty email is required.');
  const existingUser = getUserByEmail(normalizedEmail);
  if (existingUser) throw new Error('An account with this email address already exists.');

  const token = crypto.randomBytes(32).toString('hex');
  const invitation: FacultyInvitationRecord = {
    id: crypto.randomUUID(),
    email: normalizedEmail,
    college,
    invitedBy,
    tokenHash: hashInvitationToken(token),
    status: 'pending',
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date().toISOString(),
  } as FacultyInvitationRecord & { invitedBy?: string };

  const invitations = getFacultyInvitations().filter((item) => !(item.email === normalizedEmail && item.status === 'pending'));
  invitations.push(invitation);
  saveFacultyInvitations(invitations);
  return { invitation, token };
}

export function markFacultyInvitationAccepted(id: string) {
  const invitations = getFacultyInvitations();
  const index = invitations.findIndex((item) => item.id === id);
  if (index === -1) return;
  invitations[index] = { ...invitations[index], status: 'accepted', acceptedAt: new Date().toISOString() };
  saveFacultyInvitations(invitations);
}

export function getPendingFacultyProfiles(): FacultyProfileRecord[] {
  return getFacultyProfiles().filter((profile) => profile.approvalStatus === 'pending');
}

export function createFacultyProfile(data: FacultyRegistrationRecord, userId: string): FacultyProfileRecord {
  const profile: FacultyProfileRecord = {
    userId,
    employeeId: data.employeeId,
    department: data.department,
    designation: data.designation,
    phone: data.phone,
    subjects: data.subjects || [],
    expertise: data.expertise || [],
    yearsExperience: data.yearsExperience,
    mentoringAreas: data.mentoringAreas || [],
    bio: data.bio,
    approvalStatus: 'pending',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  const profiles = getFacultyProfiles().filter((item) => item.userId !== userId);
  profiles.push(profile);
  saveFacultyProfiles(profiles);
  return profile;
}

export function setFacultyApproval(userId: string, status: 'approved' | 'rejected' | 'suspended', approvedBy?: string): UserRecord | null {
  const users = getUsers();
  const index = users.findIndex((user) => user.id === userId && user.role === 'faculty');
  if (index === -1) return null;
  const now = new Date().toISOString();
  const accountStatus = status === 'approved' ? 'active' : 'suspended';
  users[index] = { ...users[index], accountStatus };
  saveUsers(users);

  const profiles = getFacultyProfiles();
  const profileIndex = profiles.findIndex((profile) => profile.userId === userId);
  if (profileIndex !== -1) {
    profiles[profileIndex] = { ...profiles[profileIndex], approvalStatus: status, approvedBy, approvedAt: status === 'approved' ? now : undefined, updatedAt: now };
    saveFacultyProfiles(profiles);
  }
  return users[index];
}

export function getFacultyProfile(userId: string): FacultyProfileRecord | undefined {
  return getFacultyProfiles().find((profile) => profile.userId === userId);
}

export function getUsers(): UserRecord[] {
  ensureDataDir();
  if (!fs.existsSync(USERS_FILE)) {
    const seedUsers: UserRecord[] = [
      {
        id: 'user_student_1', name: 'Piyush Kanojiya', email: 'kanojiyapk524@gmail.com', passwordHash: bcrypt.hashSync('password123', 10), role: 'student', college: 'Institute of Technology', branch: 'Computer Science', academicYear: '3rd Year', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80', bio: 'Passionate student developer building full-stack web & AI apps.', rep: 2500, level: 18, streakDays: 42, githubUrl: 'https://github.com/kanojiyapk', linkedinUrl: 'https://linkedin.com/in/piyush-kanojiya', skills: ['React', 'TypeScript', 'Node.js', 'Python', 'AI/ML'], selectedDomains: ['Software Dev', 'AI/ML'], authProvider: 'email', accountStatus: 'active', createdAt: new Date().toISOString(),
      },
      {
        id: 'user_mentor_1', name: 'Rahul Sharma', email: 'rahul.mentor@college.edu', passwordHash: bcrypt.hashSync('password123', 10), role: 'mentor', college: 'Stanford CS', branch: 'Computer Science', academicYear: 'Graduate / Alumni', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80', bio: 'Senior Software Engineer & Student Mentor. Helping devs scale projects.', rep: 8400, level: 32, streakDays: 120, githubUrl: 'https://github.com/rahulsharma', linkedinUrl: 'https://linkedin.com/in/rahulsharma', skills: ['System Design', 'React', 'Go', 'Cloud Architecture'], selectedDomains: ['System Design', 'Backend'], authProvider: 'email', accountStatus: 'active', createdAt: new Date().toISOString(),
      },
      {
        id: 'user_admin_1', name: 'Platform Administrator', email: 'admin@devcollective.edu', passwordHash: bcrypt.hashSync('adminpassword', 10), role: 'admin', college: 'DevCollective Central', branch: 'Administration', academicYear: 'Faculty / Admin', avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80', bio: 'DevCollective Platform Admin. Managing verifications, roles, and ecosystem health.', rep: 15000, level: 50, streakDays: 365, githubUrl: 'https://github.com/devcollective-admin', linkedinUrl: 'https://linkedin.com/company/devcollective', skills: ['Governance', 'Security', 'DevOps', 'Community Management'], selectedDomains: ['Platform Admin'], authProvider: 'email', accountStatus: 'active', createdAt: new Date().toISOString(),
      },
    ];
    fs.writeFileSync(USERS_FILE, JSON.stringify(seedUsers, null, 2));
    return seedUsers;
  }
  try { return JSON.parse(fs.readFileSync(USERS_FILE, 'utf-8')); } catch { return []; }
}

export function saveUsers(users: UserRecord[]) { ensureDataDir(); fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2)); }
export function getUserByEmail(email: string): UserRecord | undefined { return getUsers().find((u) => u.email.toLowerCase() === email.toLowerCase()); }
export function getUserById(id: string): UserRecord | undefined { return getUsers().find((u) => u.id === id); }

export async function createFacultyUser(data: FacultyRegistrationRecord): Promise<UserRecord> {
  const users = getUsers();
  if (users.some((u) => u.email.toLowerCase() === data.email.toLowerCase())) throw new Error('An account with this email address already exists.');
  const passwordHash = await bcrypt.hash(data.passwordRaw, 10);
  const user: UserRecord = { id: `user_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`, name: data.name, email: data.email, passwordHash, role: 'faculty', college: 'GHRCEMN', branch: data.department, academicYear: 'Faculty', avatar: `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(data.email)}`, bio: data.bio || 'DevCollective faculty member.', rep: 100, level: 1, streakDays: 1, skills: [...(data.expertise || []), ...(data.subjects || [])], selectedDomains: data.mentoringAreas || [], authProvider: 'email', hasCompletedOnboarding: true, accountStatus: 'pending', createdAt: new Date().toISOString() };
  users.push(user); saveUsers(users); return user;
}

export async function createUser(data: { name: string; email: string; passwordRaw: string; role?: UserRole; college?: string; branch?: string; academicYear?: string; }): Promise<UserRecord> {
  const users = getUsers();
  if (users.some((u) => u.email.toLowerCase() === data.email.toLowerCase())) throw new Error('An account with this email address already exists.');
  const passwordHash = await bcrypt.hash(data.passwordRaw, 10);
  const newUser: UserRecord = { id: `user_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`, name: data.name, email: data.email, passwordHash, role: 'student', college: data.college || 'Institute of Technology', branch: data.branch || 'Computer Science', academicYear: data.academicYear || '1st Year', avatar: `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(data.email)}`, bio: 'Welcome to DevCollective! Building software as a student.', rep: 100, level: 1, streakDays: 1, skills: ['JavaScript', 'HTML/CSS'], selectedDomains: ['Full Stack Development'], authProvider: 'email', accountStatus: 'active', createdAt: new Date().toISOString() };
  users.push(newUser); saveUsers(users); return newUser;
}

export async function findOrCreateOAuthUser(data: { provider: 'google' | 'github'; email: string; name: string; avatar?: string; }): Promise<{ user: UserRecord; isNewUser: boolean }> {
  const users = getUsers(); const existing = users.find((u) => u.email.toLowerCase() === data.email.toLowerCase());
  if (existing) return { user: existing, isNewUser: false };
  const newUser: UserRecord = { id: `user_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`, name: data.name, email: data.email, passwordHash: '', role: 'student', college: 'Institute of Technology', branch: 'Computer Science', academicYear: '1st Year', avatar: data.avatar || `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(data.email)}`, bio: 'Welcome to DevCollective! Building software as a student.', rep: 100, level: 1, streakDays: 1, skills: ['JavaScript', 'HTML/CSS'], selectedDomains: ['Full Stack Development'], authProvider: data.provider, accountStatus: 'active', createdAt: new Date().toISOString() };
  users.push(newUser); saveUsers(users); return { user: newUser, isNewUser: true };
}

export function setPasswordResetCode(userId: string, codeHash: string, expiresAt: string): void { const users=getUsers(); const i=users.findIndex((u)=>u.id===userId); if(i===-1)return; users[i]={...users[i],resetCodeHash:codeHash,resetCodeExpiresAt:expiresAt}; saveUsers(users); }
export async function resetPasswordWithCode(email:string,code:string,newPasswordRaw:string):Promise<{success:boolean;error?:string}>{ const users=getUsers(); const i=users.findIndex((u)=>u.email.toLowerCase()===email.toLowerCase()); if(i===-1)return{success:false,error:'Invalid or expired code.'}; const user=users[i]; if(!user.resetCodeHash||!user.resetCodeExpiresAt)return{success:false,error:'No password reset was requested for this account.'}; if(new Date(user.resetCodeExpiresAt)<new Date()){users[i]={...user,resetCodeHash:undefined,resetCodeExpiresAt:undefined};saveUsers(users);return{success:false,error:'This code has expired. Please request a new one.'};} const ok=await bcrypt.compare(code,user.resetCodeHash); if(!ok)return{success:false,error:'Incorrect code. Please check and try again.'}; users[i]={...user,passwordHash:await bcrypt.hash(newPasswordRaw,10),resetCodeHash:undefined,resetCodeExpiresAt:undefined};saveUsers(users);return{success:true}; }
export function updateUser(id:string,updates:Partial<UserProfile>):UserRecord|null{const users=getUsers();const i=users.findIndex((u)=>u.id===id);if(i===-1)return null;const{id:_id,email:_email,...safe}=updates as any;users[i]={...users[i],...safe};saveUsers(users);return users[i];}
export function getSessions():SessionRecord[]{ensureDataDir();if(!fs.existsSync(SESSIONS_FILE))return[];try{return JSON.parse(fs.readFileSync(SESSIONS_FILE,'utf-8'));}catch{return[];}}
export function saveSessions(sessions:SessionRecord[]){ensureDataDir();fs.writeFileSync(SESSIONS_FILE,JSON.stringify(sessions,null,2));}
export function createSession(userId:string):string{const sessions=getSessions();const token=`session_${Date.now()}_${Math.random().toString(36).substring(2,10)}`;const now=new Date();sessions.push({token,userId,createdAt:now.toISOString(),expiresAt:new Date(now.getTime()+7*24*60*60*1000).toISOString()});saveSessions(sessions);return token;}
export function getUserByToken(token:string):UserRecord|null{if(!token)return null;const sessions=getSessions();const s=sessions.find((x)=>x.token===token);if(!s)return null;if(new Date(s.expiresAt)<new Date()){deleteSession(token);return null;}return getUserById(s.userId)||null;}
export function deleteSession(token:string){saveSessions(getSessions().filter((s)=>s.token!==token));}
export function sanitizeUser(user:UserRecord):UserProfile{const{passwordHash,...sanitized}=user;return sanitized;}
