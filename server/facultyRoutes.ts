import type { Express, Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { clerkClient } from '@clerk/express';
import { supabaseAdmin } from './supabase';
import { requireAdmin, normalizeEmail } from './adminRoutes';

const COLLEGE = 'GHRCEMN';

const hashToken = (token: string) => crypto.createHash('sha256').update(token).digest('hex');
const makeToken = () => crypto.randomBytes(32).toString('hex');

async function sendInviteEmail(email: string, inviteUrl: string) {
  const apiKey = process.env.BREVO_API_KEY;
  const senderEmail = process.env.BREVO_SENDER_EMAIL;
  if (!apiKey || !senderEmail) return false;
  const response = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: { 'api-key': apiKey, 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({
      sender: { email: senderEmail, name: process.env.BREVO_SENDER_NAME || 'DevCollective' },
      to: [{ email }],
      subject: 'DevCollective faculty invitation',
      htmlContent: '<div style="font-family:Arial,sans-serif;line-height:1.6"><h2>DevCollective Faculty Invitation</h2><p>You have been invited to join DevCollective as faculty.</p><p><a href="' + inviteUrl + '">Accept faculty invitation</a></p><p>This invitation expires in 7 days.</p></div>',
    }),
  });
  return response.ok;
}

const facultyEmailAllowed = (email: string) => {
  const domain = (process.env.COLLEGE_EMAIL_DOMAIN || 'ghrietn.raisoni.net').toLowerCase();
  return normalizeEmail(email).endsWith('@' + domain);
};

export function registerFacultyRoutes(app: Express, requireAuth: (req: Request, res: Response, next: NextFunction) => void) {
  app.get('/api/faculty/invitations/:token', async (req, res) => {
    if (!supabaseAdmin) return res.status(503).json({ error: 'Supabase is not configured.' });
    const token = String(req.params.token || '');
    if (!token) return res.status(400).json({ error: 'Invitation token is required.' });
    const { data, error } = await supabaseAdmin.from('devcollective_faculty_invitations').select('email,college,expires_at,status').eq('token_hash', hashToken(token)).eq('status', 'pending').gt('expires_at', new Date().toISOString()).maybeSingle();
    if (error) return res.status(500).json({ error: 'Could not validate the faculty invitation.' });
    if (!data) return res.status(404).json({ error: 'This faculty invitation is invalid or expired.' });
    return res.json({ email: data.email, college: data.college, expiresAt: data.expires_at });
  });

  app.post('/api/admin/faculty-invitations', requireAuth, requireAdmin, async (req, res) => {
    try {
      if (!supabaseAdmin) throw new Error('Supabase is not configured.');
      const email = normalizeEmail(String(req.body?.email || ''));
      const college = String(req.body?.college || COLLEGE).trim().slice(0, 120);
      if (!facultyEmailAllowed(email)) return res.status(400).json({ error: 'Use the official faculty college email domain.' });
      const token = makeToken();
      const { data, error } = await supabaseAdmin.from('devcollective_faculty_invitations').insert({ email, college, invited_by: (req as any).authUserId, token_hash: hashToken(token) }).select('id,email,college,expires_at,status').single();
      if (error) throw error;
      const inviteUrl = getInviteUrl(req, token);
      const emailSent = await sendInviteEmail(email, inviteUrl);
      return res.status(201).json({ success: true, invitation: data, inviteUrl, emailSent });
    } catch (error: any) {
      console.error('[faculty] invitation creation failed:', error);
      return res.status(500).json({ error: error.message || 'Could not create faculty invitation.' });
    }
  });

  app.get('/api/admin/faculty-invitations', requireAuth, requireAdmin, async (_req, res) => {
    if (!supabaseAdmin) return res.status(503).json({ error: 'Supabase is not configured.' });
    const { data, error } = await supabaseAdmin.from('devcollective_faculty_invitations').select('id,email,college,status,expires_at,created_at,accepted_at').order('created_at', { ascending: false }).limit(50);
    if (error) {\n      console.error('[faculty] load invitations failed:', error);\n      return res.status(500).json({ error: error.message || 'Could not load faculty invitations.' });\n    }
    return res.json({ invitations: data || [] });
  });

  app.post('/api/auth/faculty/register', requireAuth, async (req, res) => {
    try {
      if (!supabaseAdmin) throw new Error('Supabase is not configured.');
      const userId = (req as any).authUserId as string;
      const clerkUser = await clerkClient.users.getUser(userId);
      const email = normalizeEmail(clerkUser.emailAddresses?.find((item: any) => item.id === clerkUser.primaryEmailAddressId)?.emailAddress || '');
      if (!email || !facultyEmailAllowed(email)) return res.status(403).json({ error: 'Your Clerk account must use the official college faculty email domain.' });
      if (clerkUser.primaryEmailAddress?.verification?.status !== 'verified') return res.status(403).json({ error: 'Verify your official college email before submitting faculty access.' });

      const inviteToken = String(req.body?.inviteToken || '');
      const { data: invitation } = await supabaseAdmin.from('devcollective_faculty_invitations').select('*').eq('token_hash', hashToken(inviteToken)).eq('status', 'pending').gt('expires_at', new Date().toISOString()).maybeSingle();
      if (!invitation) return res.status(400).json({ error: 'This faculty invitation is invalid or expired.' });
      if (normalizeEmail(invitation.email) !== email) return res.status(403).json({ error: 'This invitation is assigned to a different email address.' });

      const required = ['name','employeeId','department','designation'];
      for (const field of required) if (!String(req.body?.[field] || '').trim()) return res.status(400).json({ error: 'Complete all required faculty profile fields.' });

      const { data: existing } = await supabaseAdmin.from('devcollective_faculty_profiles').select('clerk_user_id').eq('clerk_user_id', userId).maybeSingle();
      if (existing) return res.status(409).json({ error: 'Faculty profile already exists for this account.' });

      const { error: profileError } = await supabaseAdmin.from('devcollective_profiles').upsert({
        clerk_user_id: userId, name: String(req.body.name).trim().slice(0, 150), email, role: 'faculty',
        college: invitation.college || COLLEGE, branch: 'Faculty', academic_year: 'Faculty',
        avatar: clerkUser.imageUrl || '', bio: String(req.body.bio || '').trim().slice(0, 4000),
        auth_provider: 'clerk', has_completed_onboarding: true, account_status: 'pending',
      }, { onConflict: 'clerk_user_id' });
      if (profileError) throw profileError;

      const { error: facultyError } = await supabaseAdmin.from('devcollective_faculty_profiles').insert({
        clerk_user_id: userId, employee_id: String(req.body.employeeId).trim().slice(0, 100),
        department: String(req.body.department).trim().slice(0, 200), designation: String(req.body.designation).trim().slice(0, 200),
        phone: String(req.body.phone || '').trim().slice(0, 40),
        subjects: Array.isArray(req.body.subjects) ? req.body.subjects.slice(0, 30) : [],
        expertise: Array.isArray(req.body.expertise) ? req.body.expertise.slice(0, 30) : [],
        years_experience: Number.isFinite(Number(req.body.yearsExperience)) ? Number(req.body.yearsExperience) : null,
        mentoring_areas: Array.isArray(req.body.mentoringAreas) ? req.body.mentoringAreas.slice(0, 30) : [],
        bio: String(req.body.bio || '').trim().slice(0, 4000),
        approval_status: 'pending',
      });
      if (facultyError) throw facultyError;

      const { error: inviteError } = await supabaseAdmin.from('devcollective_faculty_invitations').update({ status: 'accepted', accepted_at: new Date().toISOString() }).eq('id', invitation.id);
      if (inviteError) throw inviteError;

      return res.status(201).json({ success: true, message: 'Faculty registration submitted. Your account is pending admin approval.' });
    } catch (error: any) {
      console.error('[faculty] registration failed:', error);
      return res.status(500).json({ error: error.message || 'Could not submit faculty registration.' });
    }
  });

  app.get('/api/admin/faculty', requireAuth, requireAdmin, async (_req, res) => {
    if (!supabaseAdmin) return res.status(503).json({ error: 'Supabase is not configured.' });
    const { data, error } = await supabaseAdmin.from('devcollective_faculty_profiles').select('*').eq('approval_status', 'pending').order('created_at', { ascending: false });
    if (error) {\n      console.error('[faculty] load profiles failed:', error);\n      return res.status(500).json({ error: error.message || 'Could not load faculty profiles.' });\n    }
    return res.json({ profiles: data || [] });
  });

  app.post('/api/admin/faculty/:clerkUserId/decision', requireAuth, requireAdmin, async (req, res) => {
    try {
      if (!supabaseAdmin) throw new Error('Supabase is not configured.');
      const clerkUserId = String(req.params.clerkUserId);
      const decision = req.body?.decision === 'approve' ? 'approved' : req.body?.decision === 'reject' ? 'rejected' : '';
      if (!decision) return res.status(400).json({ error: 'Decision must be approve or reject.' });
      const now = new Date().toISOString();
      const { data: profile, error: profileError } = await supabaseAdmin.from('devcollective_faculty_profiles').update({ approval_status: decision, approved_by: (req as any).authUserId, approved_at: now, updated_at: now }).eq('clerk_user_id', clerkUserId).eq('approval_status', 'pending').select('*').single();
      if (profileError || !profile) return res.status(404).json({ error: 'Pending faculty profile not found.' });
      const accountStatus = decision === 'approved' ? 'active' : 'suspended';
      const { error: accountError } = await supabaseAdmin.from('devcollective_profiles').update({ account_status: accountStatus }).eq('clerk_user_id', clerkUserId);
      if (accountError) throw accountError;
      return res.json({ success: true, decision, profile });
    } catch (error: any) {
      console.error('[faculty] approval failed:', error);
      return res.status(500).json({ error: error.message || 'Could not update faculty approval.' });
    }
  });
}

function getInviteUrl(req: Request, token: string) {
  const base = process.env.APP_URL || 'http://' + (req.headers.host || 'localhost:3000');
  return base.replace(/\/$/, '') + '/?faculty-register=1&invite=' + encodeURIComponent(token);
}
