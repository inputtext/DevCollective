import type { Express, NextFunction, Request, Response } from 'express';

const LEVEL_0_ID = 'level-0';

function getSupabaseConfig() {
  const url = process.env.SUPABASE_URL;
  const secretKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !secretKey) throw new Error('SUPABASE_URL and SUPABASE_SECRET_KEY must be configured on the server.');
  return { url: url.replace(/\/$/, ''), secretKey };
}

function getSupabaseHeaders(secretKey: string): Record<string, string> {
  const headers: Record<string, string> = { apikey: secretKey, 'Content-Type': 'application/json' };
  if (!secretKey.startsWith('sb_secret_')) headers.Authorization = `Bearer ${secretKey}`;
  return headers;
}

async function supabaseRequest(path: string, init: RequestInit = {}) {
  const { url, secretKey } = getSupabaseConfig();
  const response = await fetch(`${url}/rest/v1/${path}`, { ...init, headers: { ...getSupabaseHeaders(secretKey), ...(init.headers || {}) } });
  const text = await response.text();
  let body: unknown = null;
  try { body = text ? JSON.parse(text) : null; } catch { body = text; }
  if (!response.ok) throw new Error(typeof body === 'string' ? body : JSON.stringify(body));
  return body;
}

async function completeSubmodule(userId: string, submoduleId: string) {
  const { url, secretKey } = getSupabaseConfig();
  const response = await fetch(`${url}/rest/v1/rpc/complete_learning_submodule`, {
    method: 'POST', headers: getSupabaseHeaders(secretKey), body: JSON.stringify({ p_user_id: userId, p_submodule_id: submoduleId }),
  });
  const text = await response.text();
  let body: any = null;
  try { body = text ? JSON.parse(text) : null; } catch { body = text; }
  if (!response.ok) throw new Error(typeof body === 'string' ? body : JSON.stringify(body));
  return body;
}

const PHASE3_REACTIONS = ['👍', '❤️', '🔥', '😂', '🎉', '🚀', '👀', '💯'];

async function assertMessageAccess(messageId: string, userId: string) {
  const rows = await supabaseRequest(`devcollective_messages?id=eq.${encodeURIComponent(messageId)}&select=id,conversation_id,sender_clerk_user_id,body,created_at` ) as any[];
  const message = Array.isArray(rows) ? rows[0] : null;
  if (!message) throw new Error('Message not found.');
  const members = await supabaseRequest(`devcollective_conversation_members?conversation_id=eq.${encodeURIComponent(message.conversation_id)}&clerk_user_id=eq.${encodeURIComponent(userId)}&select=conversation_id&limit=1`) as any[];
  if (!Array.isArray(members) || !members.length) throw new Error('Conversation access denied.');
  return message;
}

async function loadMessageEnhancements(messageIds: string[], userId: string) {
  if (!messageIds.length) return new Map<string, any>();
  const encoded = messageIds.map(encodeURIComponent).join(',');
  const [reactions, stars, pins] = await Promise.all([
    supabaseRequest(`devcollective_message_reactions?message_id=in.(${encoded})&select=message_id,clerk_user_id,reaction`) as Promise<any[]>,
    supabaseRequest(`devcollective_message_stars?message_id=in.(${encoded})&clerk_user_id=eq.${encodeURIComponent(userId)}&select=message_id`) as Promise<any[]>,
    supabaseRequest(`devcollective_message_pins?message_id=in.(${encoded})&select=message_id`) as Promise<any[]>,
  ]);
  const map = new Map<string, any>();
  for (const id of messageIds) map.set(id, { reactions: [], starred: false, pinned: false });
  for (const row of reactions || []) {
    const entry = map.get(row.message_id);
    if (!entry) continue;
    const existing = entry.reactions.find((item: any) => item.emoji === row.reaction);
    if (existing) existing.count += 1; else entry.reactions.push({ emoji: row.reaction, count: 1, reacted: row.clerk_user_id === userId });
    if (row.clerk_user_id === userId && entry.reactions.find((item: any) => item.emoji === row.reaction)) entry.reactions.find((item: any) => item.emoji === row.reaction).reacted = true;
  }
  for (const row of stars || []) { const entry = map.get(row.message_id); if (entry) entry.starred = true; }
  for (const row of pins || []) { const entry = map.get(row.message_id); if (entry) entry.pinned = true; }
  return map;
}

export function registerLearningProgressRoutes(app: Express, requireAuth: (req: Request, res: Response, next: NextFunction) => void) {
  app.get('/api/learning/level-0', requireAuth, async (req, res) => {
    try {
      const userId = (req as any).authUserId as string;
      if (!userId) return res.status(401).json({ error: 'Not authenticated.' });
      const [modules, submodules, progress, moduleProgress, levelProgress] = await Promise.all([
        supabaseRequest(`learning_modules?level_id=eq.${encodeURIComponent(LEVEL_0_ID)}&select=id,module_order,title,description,icon,estimated_minutes,rep_reward&order=module_order.asc`),
        supabaseRequest(`learning_submodules?select=id,module_id,submodule_order,title,description,estimated_minutes,kind,rep_reward&order=submodule_order.asc`),
        supabaseRequest(`user_submodule_progress?user_id=eq.${encodeURIComponent(userId)}&select=submodule_id,verified_at`),
        supabaseRequest(`user_module_progress?user_id=eq.${encodeURIComponent(userId)}&select=module_id,verified_submodule_count,completed_at,updated_at`),
        supabaseRequest(`user_level_progress?user_id=eq.${encodeURIComponent(userId)}&level_id=eq.${encodeURIComponent(LEVEL_0_ID)}&select=level_id,verified_submodule_count,total_submodule_count,completed_at,updated_at`),
      ]);
      return res.json({ success: true, levelId: LEVEL_0_ID, modules, submodules, progress, moduleProgress, levelProgress: Array.isArray(levelProgress) ? levelProgress[0] ?? null : levelProgress });
    } catch (error: any) {
      console.error('Error loading Level 0 progress:', error);
      return res.status(500).json({ error: 'Failed to load learning progress.' });
    }
  });

  app.post('/api/learning/level-0/submodules/:submoduleId/verify', requireAuth, async (req, res) => {
    try {
      const userId = (req as any).authUserId as string;
      const submoduleId = req.params.submoduleId;
      if (!userId) return res.status(401).json({ error: 'Not authenticated.' });
      if (!submoduleId) return res.status(400).json({ error: 'Submodule id is required.' });
      const result = await completeSubmodule(userId, submoduleId);
      return res.json({ success: true, result });
    } catch (error: any) {
      console.error('Error verifying Level 0 submodule:', error);
      const message = String(error?.message || '');
      if (message.includes('Unknown learning submodule')) return res.status(404).json({ error: 'Learning submodule not found.' });
      return res.status(500).json({ error: 'Failed to verify learning checkpoint.' });
    }
  });

  app.get('/api/mentors', requireAuth, async (req, res) => {
    try {
      const userId = (req as any).authUserId as string;
      if (!userId) return res.status(401).json({ error: 'Not authenticated.' });
      const rows = await supabaseRequest(`devcollective_profiles?select=clerk_user_id,name,college,branch,avatar,role,level,rep,bio,skills&role=eq.mentor&clerk_user_id=neq.${encodeURIComponent(userId)}&order=name.asc`) as any[];
      const mentors = (Array.isArray(rows) ? rows : []).map((row) => ({
        id: row.clerk_user_id,
        name: row.name || 'Mentor',
        title: 'DevCollective Mentor',
        college: row.college || '',
        avatar: row.avatar || '',
        roleType: 'SENIOR',
        company: '',
        skills: Array.isArray(row.skills) ? row.skills.slice(0, 8) : [],
        level: Number(row.level) || 1,
        rep: Number(row.rep) || 0,
        rating: 0,
        studentsHelped: 0,
        bio: row.bio || 'Available to help fellow developers.',
        availability: 'Available for chat',
        isBusy: false,
      }));
      return res.json({ mentors });
    } catch (error: any) {
      console.error('Error loading mentors:', error);
      return res.status(500).json({ error: 'Could not load mentors right now.' });
    }
  });

  app.get('/api/users/directory', requireAuth, async (req, res) => {
    try {
      const userId = (req as any).authUserId as string;
      if (!userId) return res.status(401).json({ error: 'Not authenticated.' });
      const rawQuery = String(req.query.q || '').trim().slice(0, 80);
      const rawLimit = Number(req.query.limit || 50);
      const limit = Number.isFinite(rawLimit) ? Math.min(50, Math.max(1, Math.floor(rawLimit))) : 50;
      const safeQuery = rawQuery.replace(/[,*()]/g, ' ').trim();
      let path = `devcollective_profiles?select=clerk_user_id,name,role,college,branch,avatar,level,rep,skills&clerk_user_id=neq.${encodeURIComponent(userId)}&order=name.asc&limit=${limit}`;
      if (safeQuery) {
        const encodedQuery = encodeURIComponent(safeQuery);
        path += `&or=(name.ilike.*${encodedQuery}*,college.ilike.*${encodedQuery}*,role.ilike.*${encodedQuery}*,branch.ilike.*${encodedQuery}*)`;
      }
      const rows = await supabaseRequest(path) as any[];
      const members = (Array.isArray(rows) ? rows : []).map((row) => ({
        id: row.clerk_user_id,
        name: row.name || 'Developer',
        role: row.role || 'student',
        college: row.college || '',
        branch: row.branch || '',
        avatar: row.avatar || '',
        level: Number(row.level) || 1,
        rep: Number(row.rep) || 0,
        skills: Array.isArray(row.skills) ? row.skills.slice(0, 4) : [],
      }));
      return res.json({ members });
    } catch (error: any) {
      console.error('Error loading member directory:', error);
      return res.status(500).json({ error: 'Could not load members right now.' });
    }
  });

  // Phase 3 chat APIs: every operation is authenticated and verifies conversation membership server-side.
  app.get('/api/messages/:conversationId/features', requireAuth, async (req, res) => {
    try {
      const userId = (req as any).authUserId as string;
      const conversationId = req.params.conversationId;
      const members = await supabaseRequest(`devcollective_conversation_members?conversation_id=eq.${encodeURIComponent(conversationId)}&clerk_user_id=eq.${encodeURIComponent(userId)}&select=conversation_id&limit=1`) as any[];
      if (!Array.isArray(members) || !members.length) return res.status(403).json({ error: 'Conversation access denied.' });
      const messages = await supabaseRequest(`devcollective_messages?conversation_id=eq.${encodeURIComponent(conversationId)}&select=id&order=created_at.desc&limit=100`) as any[];
      const map = await loadMessageEnhancements((messages || []).map((m: any) => m.id), userId);
      return res.json({ reactions: Object.fromEntries(Array.from(map.entries()).map(([id, value]) => [id, value.reactions])), starred: Object.fromEntries(Array.from(map.entries()).map(([id, value]) => [id, value.starred])), pinned: Object.fromEntries(Array.from(map.entries()).map(([id, value]) => [id, value.pinned])) });
    } catch (error: any) { console.error('Error loading chat features:', error); return res.status(500).json({ error: 'Could not load message features.' }); }
  });

  app.post('/api/messages/:messageId/reactions', requireAuth, async (req, res) => {
    try {
      const userId = (req as any).authUserId as string;
      const message = await assertMessageAccess(req.params.messageId, userId);
      const reaction = String(req.body?.reaction || '');
      if (!PHASE3_REACTIONS.includes(reaction)) return res.status(400).json({ error: 'Unsupported reaction.' });
      await supabaseRequest('devcollective_message_reactions', { method: 'POST', headers: { Prefer: 'resolution=merge-duplicates' }, body: JSON.stringify({ message_id: message.id, clerk_user_id: userId, reaction }) });
      const rows = await supabaseRequest(`devcollective_message_reactions?message_id=eq.${encodeURIComponent(message.id)}&select=clerk_user_id,reaction`) as any[];
      return res.json({ messageId: message.id, reactions: rows || [] });
    } catch (error: any) { console.error('Error adding reaction:', error); return res.status(500).json({ error: error.message || 'Could not add reaction.' }); }
  });

  app.delete('/api/messages/:messageId/reactions/:reaction', requireAuth, async (req, res) => {
    try {
      const userId = (req as any).authUserId as string;
      const message = await assertMessageAccess(req.params.messageId, userId);
      const reaction = decodeURIComponent(req.params.reaction);
      if (!PHASE3_REACTIONS.includes(reaction)) return res.status(400).json({ error: 'Unsupported reaction.' });
      await supabaseRequest(`devcollective_message_reactions?message_id=eq.${encodeURIComponent(message.id)}&clerk_user_id=eq.${encodeURIComponent(userId)}&reaction=eq.${encodeURIComponent(reaction)}`, { method: 'DELETE' });
      const rows = await supabaseRequest(`devcollective_message_reactions?message_id=eq.${encodeURIComponent(message.id)}&select=clerk_user_id,reaction`) as any[];
      return res.json({ messageId: message.id, reactions: rows || [] });
    } catch (error: any) { console.error('Error removing reaction:', error); return res.status(500).json({ error: error.message || 'Could not remove reaction.' }); }
  });

  app.post('/api/messages/:messageId/star', requireAuth, async (req, res) => {
    try {
      const userId = (req as any).authUserId as string;
      const message = await assertMessageAccess(req.params.messageId, userId);
      const starred = Boolean(req.body?.starred);
      if (starred) await supabaseRequest('devcollective_message_stars', { method: 'POST', headers: { Prefer: 'resolution=merge-duplicates' }, body: JSON.stringify({ message_id: message.id, clerk_user_id: userId }) });
      else await supabaseRequest(`devcollective_message_stars?message_id=eq.${encodeURIComponent(message.id)}&clerk_user_id=eq.${encodeURIComponent(userId)}`, { method: 'DELETE' });
      return res.json({ messageId: message.id, starred });
    } catch (error: any) { console.error('Error updating star:', error); return res.status(500).json({ error: error.message || 'Could not update saved message.' }); }
  });

  app.post('/api/messages/:messageId/pin', requireAuth, async (req, res) => {
    try {
      const userId = (req as any).authUserId as string;
      const message = await assertMessageAccess(req.params.messageId, userId);
      const pinned = Boolean(req.body?.pinned);
      if (pinned) await supabaseRequest('devcollective_message_pins', { method: 'POST', headers: { Prefer: 'resolution=merge-duplicates' }, body: JSON.stringify({ message_id: message.id, conversation_id: message.conversation_id, pinned_by: userId }) });
      else await supabaseRequest(`devcollective_message_pins?message_id=eq.${encodeURIComponent(message.id)}`, { method: 'DELETE' });
      return res.json({ messageId: message.id, pinned });
    } catch (error: any) { console.error('Error updating pin:', error); return res.status(500).json({ error: error.message || 'Could not update pinned message.' }); }
  });

  app.get('/api/messages/:conversationId/search', requireAuth, async (req, res) => {
    try {
      const userId = (req as any).authUserId as string;
      const conversationId = req.params.conversationId;
      const members = await supabaseRequest(`devcollective_conversation_members?conversation_id=eq.${encodeURIComponent(conversationId)}&clerk_user_id=eq.${encodeURIComponent(userId)}&select=conversation_id&limit=1`) as any[];
      if (!Array.isArray(members) || !members.length) return res.status(403).json({ error: 'Conversation access denied.' });
      const query = String(req.query.q || '').trim().slice(0, 120);
      if (!query) return res.json({ messages: [] });
      const encoded = encodeURIComponent(query.replace(/[,*()]/g, ' '));
      const rows = await supabaseRequest(`devcollective_messages?conversation_id=eq.${encodeURIComponent(conversationId)}&body=ilike.*${encoded}*&deleted_at=is.null&select=id,conversation_id,sender_clerk_user_id,body,created_at,read_at,delivered_at,edited_at,deleted_at,deleted_by,reply_to_message_id&order=created_at.asc&limit=100`) as any[];
      const map = await loadMessageEnhancements((rows || []).map((m: any) => m.id), userId);
      return res.json({ messages: (rows || []).map((m: any) => ({ ...m, ...(map.get(m.id) || { reactions: [], starred: false, pinned: false }) })) });
    } catch (error: any) { console.error('Error searching messages:', error); return res.status(500).json({ error: 'Could not search messages.' }); }
  });
}
