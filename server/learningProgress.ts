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
}
