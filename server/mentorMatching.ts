import type { Express, Request, Response } from 'express';
import { supabaseAdmin } from './supabase';

const DEFAULT_BGE_SERVICE_URL = 'http://127.0.0.1:8000';

function getBgeServiceUrl() {
  return (process.env.BGE_SERVICE_URL || DEFAULT_BGE_SERVICE_URL).replace(/\/$/, '');
}

async function embedText(text: string): Promise<number[]> {
  const response = await fetch(`${getBgeServiceUrl()}/embed`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text }),
  });
  if (!response.ok) {
    const body = await response.text().catch(() => '');
    throw new Error(`BGE service returned ${response.status}${body ? `: ${body}` : ''}`);
  }
  const data = await response.json() as { embedding?: number[] };
  if (!Array.isArray(data.embedding) || data.embedding.length !== 1024) {
    throw new Error('BGE service returned an invalid 1024-dimensional embedding.');
  }
  return data.embedding;
}

function buildStudentText(profile: any) {
  return [
    `Goal: ${profile.bio || ''}`,
    `Skills: ${(profile.skills || []).join(', ')}`,
    `Interests: ${(profile.selected_domains || []).join(', ')}`,
    `Branch: ${profile.branch || ''}`,
    `Academic year: ${profile.academic_year || ''}`,
  ].filter(Boolean).join('\n').trim();
}

export function buildMentorText(profile: any) {
  return [
    `Mentor expertise: ${(profile.skills || []).join(', ')}`,
    `Bio: ${profile.bio || ''}`,
    `College: ${profile.college || ''}`,
    `Role: ${profile.role || ''}`,
  ].filter(Boolean).join('\n').trim();
}

export async function createMentorEmbedding(profile: any) {
  const sourceText = buildMentorText(profile);
  if (!sourceText) return null;
  try {
    return await embedText(sourceText);
  } catch (error) {
    console.warn('BGE mentor embedding skipped:', error);
    return null;
  }
}

export function registerMentorMatchingRoutes(
  app: Express,
  requireAuth: (req: Request, res: Response, next: () => void) => void,
) {
  app.get('/api/mentors/matches', requireAuth, async (req, res) => {
    try {
      if (!supabaseAdmin) throw new Error('Supabase is not configured.');
      const userId = (req as any).authUserId as string;
      const { data: profile, error: profileError } = await supabaseAdmin
        .from('devcollective_profiles')
        .select('bio,skills,selected_domains,branch,academic_year')
        .eq('clerk_user_id', userId)
        .maybeSingle();
      if (profileError) throw profileError;
      if (!profile) return res.status(404).json({ error: 'Profile not found.' });

      const query = typeof req.query.q === 'string' ? req.query.q.trim().slice(0, 1000) : '';
      const sourceText = query || buildStudentText(profile);
      if (!sourceText) return res.json({ results: [] });

      const embedding = await embedText(sourceText);
      const { data, error } = await supabaseAdmin.rpc('match_mentors', {
        query_embedding: embedding,
        match_threshold: 0.30,
        match_count: 8,
      });
      if (error) throw error;

      return res.json({
        results: (data || []).map((mentor: any) => ({
          id: mentor.id,
          name: mentor.name,
          title: mentor.title,
          college: mentor.college,
          avatar: mentor.avatar,
          roleType: mentor.role_type,
          skills: mentor.skills || [],
          level: Number(mentor.level) || 1,
          rep: Number(mentor.rep) || 0,
          bio: mentor.bio || '',
          similarity: Number(mentor.similarity),
        })),
      });
    } catch (error: any) {
      console.error('Mentor semantic matching failed:', error);
      return res.status(503).json({ error: 'Mentor matching is temporarily unavailable.' });
    }
  });
}
