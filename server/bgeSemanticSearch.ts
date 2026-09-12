import type { Express, Request, Response } from 'express';
import { supabaseAdmin } from './supabase';

const DEFAULT_BGE_SERVICE_URL = 'http://127.0.0.1:8000';
const DEFAULT_BGE_TIMEOUT_MS = 15_000;

function getBgeServiceUrl() {
  return (process.env.BGE_SERVICE_URL || DEFAULT_BGE_SERVICE_URL).replace(/\/$/, '');
}

function getBgeTimeoutMs() {
  const configured = Number(process.env.BGE_REQUEST_TIMEOUT_MS || DEFAULT_BGE_TIMEOUT_MS);
  return Number.isFinite(configured) && configured >= 1_000 ? configured : DEFAULT_BGE_TIMEOUT_MS;
}

function getBgeHeaders() {
  const apiKey = process.env.BGE_SERVICE_API_KEY?.trim();
  return {
    'Content-Type': 'application/json',
    ...(apiKey ? { 'x-bge-api-key': apiKey } : {}),
  };
}

async function embedText(text: string): Promise<number[]> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), getBgeTimeoutMs());

  try {
    const response = await fetch(`${getBgeServiceUrl()}/embed`, {
      method: 'POST',
      headers: getBgeHeaders(),
      body: JSON.stringify({ text }),
      signal: controller.signal,
    });

    if (!response.ok) {
      const body = await response.text().catch(() => '');
      throw new Error(`BGE service returned ${response.status}${body ? `: ${body}` : ''}`);
    }

    const data = await response.json() as { embedding?: number[]; dimensions?: number };
    if (!Array.isArray(data.embedding) || data.embedding.length !== 1024) {
      throw new Error('BGE service returned an invalid 1024-dimensional embedding.');
    }
    return data.embedding;
  } finally {
    clearTimeout(timeout);
  }
}

export async function createPostEmbedding(title: string | null, content: string) {
  if (!supabaseAdmin) return null;
  const sourceText = [title, content].filter(Boolean).join('\n\n').trim();
  if (!sourceText) return null;
  try {
    return await embedText(sourceText);
  } catch (error) {
    console.warn('BGE embedding skipped for community post:', error);
    return null;
  }
}

export function registerBgeSemanticSearchRoutes(app: Express, requireAuth: (req: Request, res: Response, next: () => void) => void) {
  app.get('/api/search/semantic', requireAuth, async (req, res) => {
    try {
      if (!supabaseAdmin) throw new Error('Supabase is not configured.');
      const query = String(req.query.q || '').trim();
      if (!query) return res.json({ results: [] });
      if (query.length > 500) return res.status(400).json({ error: 'Search query is too long.' });

      const embedding = await embedText(query);
      const { data, error } = await supabaseAdmin.rpc('match_community_posts', {
        query_embedding: embedding,
        match_threshold: 0.35,
        match_count: 12,
      });
      if (error) throw error;

      return res.json({
        results: (data || []).map((post: any) => ({
          id: post.id,
          title: post.title || 'Community discussion',
          content: post.content,
          category: post.category,
          createdAt: post.created_at,
          similarity: Number(post.similarity),
        })),
      });
    } catch (error: any) {
      console.error('Semantic search failed:', error);
      return res.status(503).json({ error: 'Semantic search is temporarily unavailable.' });
    }
  });
}
