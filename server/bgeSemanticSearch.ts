import type { Express, Request, Response } from 'express';
import { supabaseAdmin } from './supabase';

const DEFAULT_BGE_SERVICE_URL = 'http://127.0.0.1:8000';
const DEFAULT_BGE_TIMEOUT_MS = 15_000;

function getBgeServiceUrl() { return (process.env.BGE_SERVICE_URL || DEFAULT_BGE_SERVICE_URL).replace(/\/$/, ''); }
function getBgeTimeoutMs() { const configured = Number(process.env.BGE_REQUEST_TIMEOUT_MS || DEFAULT_BGE_TIMEOUT_MS); return Number.isFinite(configured) && configured >= 1_000 ? configured : DEFAULT_BGE_TIMEOUT_MS; }
function getBgeHeaders() { const apiKey = process.env.BGE_SERVICE_API_KEY?.trim(); return { 'Content-Type': 'application/json', ...(apiKey ? { 'x-bge-api-key': apiKey } : {}) }; }

async function embedText(text: string): Promise<number[]> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), getBgeTimeoutMs());
  try {
    const response = await fetch(`${getBgeServiceUrl()}/embed`, { method: 'POST', headers: getBgeHeaders(), body: JSON.stringify({ text }), signal: controller.signal });
    if (!response.ok) { const body = await response.text().catch(() => ''); throw new Error(`BGE service returned ${response.status}${body ? `: ${body}` : ''}`); }
    const data = await response.json() as { embedding?: number[] };
    if (!Array.isArray(data.embedding) || data.embedding.length !== 1024) throw new Error('BGE service returned an invalid 1024-dimensional embedding.');
    return data.embedding;
  } finally { clearTimeout(timeout); }
}

export async function createPostEmbedding(title: string | null, content: string) {
  if (!supabaseAdmin) return null;
  const sourceText = [title, content].filter(Boolean).join('\n\n').trim();
  if (!sourceText) return null;
  try { return await embedText(sourceText); } catch (error) { console.warn('BGE embedding skipped for community post:', error); return null; }
}

function textArray(value: unknown): string[] { return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0).map((item) => item.trim()) : []; }
function mentorQueryText(profile: any) { return [`Name: ${profile.name || ''}`, `Role: ${profile.role || ''}`, `College: ${profile.college || ''}`, `Branch: ${profile.branch || ''}`, `Academic year: ${profile.academic_year || ''}`, `Bio: ${profile.bio || ''}`, `Skills: ${textArray(profile.skills).join(', ')}`, `Interests: ${textArray(profile.selected_domains).join(', ')}`].join('\n'); }

export function registerBgeSemanticSearchRoutes(app: Express, requireAuth: (req: Request, res: Response, next: () => void) => void) {
  app.get('/api/search/semantic', requireAuth, async (req, res) => {
    try {
      if (!supabaseAdmin) throw new Error('Supabase is not configured.');
      const query = String(req.query.q || '').trim();
      if (!query) return res.json({ results: [] });
      if (query.length > 500) return res.status(400).json({ error: 'Search query is too long.' });
      const embedding = await embedText(query);
      const { data, error } = await supabaseAdmin.rpc('match_community_posts', { query_embedding: embedding, match_threshold: 0.35, match_count: 12 });
      if (error) throw error;
      return res.json({ results: (data || []).map((post: any) => ({ id: post.id, title: post.title || 'Community discussion', content: post.content, category: post.category, createdAt: post.created_at, similarity: Number(post.similarity) })) });
    } catch (error) { console.error('Semantic search failed:', error); return res.status(503).json({ error: 'Semantic search is temporarily unavailable.' }); }
  });

  app.get('/api/search/hybrid', requireAuth, async (req, res) => {
    try {
      if (!supabaseAdmin) throw new Error('Supabase is not configured.');
      const query = String(req.query.q || '').trim();
      if (!query) return res.json({ results: [] });
      if (query.length > 500) return res.status(400).json({ error: 'Search query is too long.' });
      const embedding = await embedText(query);
      const { data, error } = await supabaseAdmin.rpc('hybrid_search_community_posts', { query_text: query, query_embedding: embedding, match_count: 12, semantic_weight: 0.70, keyword_weight: 0.30, rrf_k: 50 });
      if (error) throw error;
      return res.json({ mode: 'hybrid', results: (data || []).map((post: any) => ({ id: post.id, title: post.title || 'Community discussion', content: post.content, category: post.category, createdAt: post.created_at, semanticSimilarity: post.semantic_similarity == null ? null : Number(post.semantic_similarity), keywordRank: post.keyword_rank == null ? null : Number(post.keyword_rank), semanticRank: post.semantic_rank == null ? null : Number(post.semantic_rank), hybridScore: Number(post.hybrid_score || 0) })) });
    } catch (error) { console.error('Hybrid search failed:', error); return res.status(503).json({ error: 'Hybrid search is temporarily unavailable.' }); }
  });

  app.get('/api/mentors/matches', requireAuth, async (req: any, res) => {
    try {
      if (!supabaseAdmin) throw new Error('Supabase is not configured.');
      const userId = String(req.authUserId || '').trim();
      if (!userId) return res.status(401).json({ error: 'Not authenticated.' });
      const { data: profile, error: profileError } = await supabaseAdmin.from('devcollective_profiles').select('clerk_user_id,name,role,college,branch,academic_year,bio,skills,selected_domains,level').eq('clerk_user_id', userId).maybeSingle();
      if (profileError) throw profileError;
      if (!profile) return res.status(404).json({ error: 'Profile not found.' });
      const embedding = await embedText(mentorQueryText(profile));
      const { data, error } = await supabaseAdmin.rpc('match_mentors_v2', { query_embedding: embedding, query_skills: textArray(profile.skills), query_domains: textArray(profile.selected_domains), query_level: Number(profile.level) || 1, match_count: Math.min(12, Math.max(1, Number(req.query.limit) || 8)) });
      if (error) throw error;
      return res.json({ mode: 'weighted-semantic', model: 'BAAI/bge-m3', weights: { semantic: 0.55, skills: 0.20, domains: 0.15, level: 0.05, reputation: 0.05 }, results: (data || []).map((mentor: any) => ({ id: mentor.id, name: mentor.name, title: mentor.title, college: mentor.college, avatar: mentor.avatar, roleType: mentor.role_type, skills: mentor.skills || [], selectedDomains: mentor.selected_domains || [], level: Number(mentor.level) || 1, rep: Number(mentor.rep) || 0, bio: mentor.bio || '', match: Math.round(Number(mentor.match_score || 0) * 100), signals: { semantic: Math.round(Number(mentor.semantic_score || 0) * 100), skills: Math.round(Number(mentor.skill_score || 0) * 100), domains: Math.round(Number(mentor.domain_score || 0) * 100), level: Math.round(Number(mentor.level_score || 0) * 100), reputation: Math.round(Number(mentor.reputation_score || 0) * 100) } })) });
    } catch (error) { console.error('Mentor matching failed:', error); return res.status(503).json({ error: 'Mentor matching is temporarily unavailable.' }); }
  });

  app.post('/api/questions/check-duplicates', requireAuth, async (req, res) => {
    try {
      if (!supabaseAdmin) throw new Error('Supabase is not configured.');
      const title = typeof req.body?.title === 'string' ? req.body.title.trim().slice(0, 160) : '';
      const content = typeof req.body?.content === 'string' ? req.body.content.trim().slice(0, 5000) : '';
      const source = [title, content].filter(Boolean).join('\n\n').trim();
      if (!source) return res.status(400).json({ error: 'Question title or content is required.' });
      const embedding = await embedText(source);
      const { data, error } = await supabaseAdmin.rpc('find_duplicate_questions', { query_embedding: embedding, match_threshold: 0.84, match_count: 5 });
      if (error) throw error;
      const duplicates = (data || []).map((post: any) => ({ id: post.id, title: post.title || 'Community question', content: post.content || '', category: post.category, createdAt: post.created_at, similarity: Math.round(Number(post.similarity || 0) * 100) }));
      return res.json({ isDuplicate: duplicates.length > 0, threshold: 84, duplicates });
    } catch (error) { console.error('Duplicate question lookup failed:', error); return res.status(503).json({ error: 'Duplicate question detection is temporarily unavailable.' }); }
  });
}
