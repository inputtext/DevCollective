import type { Express, Request, Response } from 'express';
import { supabaseAdmin } from './supabase';

const BGE_URL = () => (process.env.BGE_SERVICE_URL || 'http://127.0.0.1:8000').replace(/\/$/, '');
const TIMEOUT = () => Math.max(1000, Number(process.env.BGE_REQUEST_TIMEOUT_MS || 15000));
const headers = () => ({ 'Content-Type': 'application/json', ...(process.env.BGE_SERVICE_API_KEY ? { 'x-bge-api-key': process.env.BGE_SERVICE_API_KEY } : {}) });
const arr = (v: unknown) => Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string' && x.trim()).map(x => x.trim()) : [];

async function embed(text: string) {
  const controller = new AbortController(); const timer = setTimeout(() => controller.abort(), TIMEOUT());
  try {
    const r = await fetch(`${BGE_URL()}/embed`, { method: 'POST', headers: headers(), body: JSON.stringify({ text }), signal: controller.signal });
    if (!r.ok) throw new Error(`BGE returned ${r.status}`);
    const body = await r.json() as { embedding?: number[] };
    if (!Array.isArray(body.embedding) || body.embedding.length !== 1024) throw new Error('BGE returned an invalid 1024-dimensional embedding.');
    return body.embedding;
  } finally { clearTimeout(timer); }
}

export function registerAiPass2Routes(app: Express, requireAuth: (req: Request, res: Response, next: any) => void) {
  app.post('/api/questions/check-duplicates', requireAuth, async (req, res) => {
    try {
      if (!supabaseAdmin) throw new Error('Supabase is not configured.');
      const title = typeof req.body?.title === 'string' ? req.body.title.trim().slice(0, 160) : '';
      const content = typeof req.body?.content === 'string' ? req.body.content.trim().slice(0, 5000) : '';
      const source = [title, content].filter(Boolean).join('\n\n').trim();
      if (!source) return res.status(400).json({ error: 'Question title or content is required.' });
      const embedding = await embed(source);
      const { data, error } = await supabaseAdmin.rpc('find_duplicate_questions', { query_embedding: embedding, match_threshold: 0.84, match_count: 5 });
      if (error) throw error;
      const duplicates = (data || []).map((p: any) => ({ id: p.id, title: p.title || 'Community question', content: p.content, category: p.category, createdAt: p.created_at, similarity: Math.round(Number(p.similarity || 0) * 100) }));
      return res.json({ isDuplicate: duplicates.length > 0, threshold: 84, duplicates });
    } catch (error) { console.error('Duplicate question check failed:', error); return res.status(503).json({ error: 'Duplicate question detection is temporarily unavailable.' }); }
  });

  app.get('/api/questions/duplicate/:postId', requireAuth, async (req, res) => {
    try {
      if (!supabaseAdmin) throw new Error('Supabase is not configured.');
      const postId = String(req.params.postId || '').trim();
      if (!postId) return res.status(400).json({ error: 'Post ID is required.' });
      const { data: post, error: postError } = await supabaseAdmin.from('devcollective_posts').select('id,title,content,category,created_at,embedding').eq('id', postId).maybeSingle();
      if (postError) throw postError;
      if (!post || post.category !== 'Questions' || !post.embedding) return res.status(404).json({ error: 'Question not found.' });
      const { data, error } = await supabaseAdmin.rpc('find_duplicate_questions', { query_embedding: post.embedding, exclude_post_id: post.id, match_threshold: 0.84, match_count: 1 });
      if (error) throw error;
      const duplicate = data?.[0] || null;
      if (!duplicate) return res.status(404).json({ error: 'No matching question found.' });
      return res.json({ duplicate: { id: duplicate.id, title: duplicate.title || 'Community question', content: duplicate.content || '', category: duplicate.category, createdAt: duplicate.created_at, similarity: Math.round(Number(duplicate.similarity || 0) * 100) } });
    } catch (error) { console.error('Duplicate question lookup failed:', error); return res.status(503).json({ error: 'Could not load the matching question.' }); }
  });

  app.get('/api/learning/adaptive-path', requireAuth, async (req: any, res) => {
    try {
      if (!supabaseAdmin) throw new Error('Supabase is not configured.');
      const userId = String(req.authUserId || '').trim();
      if (!userId) return res.status(401).json({ error: 'Not authenticated.' });
      const { data: profile, error: profileError } = await supabaseAdmin.from('devcollective_profiles').select('clerk_user_id,name,role,college,branch,academic_year,bio,skills,selected_domains,level,rep').eq('clerk_user_id', userId).maybeSingle();
      if (profileError) throw profileError;
      if (!profile) return res.status(404).json({ error: 'Profile not found.' });
      const { data: context, error: contextError } = await supabaseAdmin.rpc('get_adaptive_learning_context', { target_user_id: userId });
      if (contextError) throw contextError;
      const skills = arr(profile.skills), domains = arr(profile.selected_domains), level = Number(profile.level) || 1;
      const role = String(req.query.role || '').trim().slice(0, 100) || 'Software Developer';
      const goal = String(req.query.goal || '').trim().slice(0, 240) || 'Build practical development skills and complete meaningful projects.';
      const query = [`Target role: ${role}`, `Goal: ${goal}`, `Current level: ${level}`, `Skills: ${skills.join(', ')}`, `Domains: ${domains.join(', ')}`, `Bio: ${profile.bio || ''}`].join('\n');
      const embedding = await embed(query);
      const { data: related, error: relatedError } = await supabaseAdmin.rpc('match_community_posts', { query_embedding: embedding, match_threshold: 0.35, match_count: 8 });
      if (relatedError) throw relatedError;
      const completed = Array.isArray(context?.completed_submodules) ? context.completed_submodules.length : 0;
      const plan = [
        { order: 1, title: skills.length ? `Strengthen ${skills.slice(0, 3).join(', ')}` : 'Establish your core development fundamentals', type: 'foundation', status: completed ? 'in_progress' : 'next', estimatedHours: 4, reason: 'Build prerequisites for your target role.' },
        { order: 2, title: domains.length ? `Deep dive into ${domains[0]}` : 'Choose a primary technical domain', type: 'specialization', status: 'next', estimatedHours: 6, reason: 'Concentrate learning on the domain closest to your goal.' },
        { order: 3, title: 'Build and ship a portfolio project', type: 'project', status: 'next', estimatedHours: 8, reason: 'Turn concepts into demonstrable engineering ability.' },
        { order: 4, title: 'Review weak areas and iterate', type: 'reinforcement', status: 'next', estimatedHours: 3, reason: 'Use new progress and questions to adapt the next cycle.' }
      ];
      return res.json({ success: true, adaptive: true, model: 'BAAI/bge-m3', user: { level, rep: Number(profile.rep) || 0, skills, domains }, target: { role, goal }, progress: { completedSubmodules: completed, moduleProgress: Array.isArray(context?.module_progress) ? context.module_progress : [] }, plan, relatedCommunity: (related || []).map((p: any) => ({ id: p.id, title: p.title || 'Community resource', category: p.category, similarity: Number(p.similarity || 0) })) });
    } catch (error) { console.error('Adaptive learning path failed:', error); return res.status(503).json({ error: 'Adaptive learning path is temporarily unavailable.' }); }
  });
}
