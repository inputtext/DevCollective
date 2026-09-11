import 'dotenv/config';
import { supabaseAdmin } from '../server/supabase';

const BGE_SERVICE_URL = (process.env.BGE_SERVICE_URL || 'http://127.0.0.1:8000').replace(/\/$/, '');

async function main() {
  if (!supabaseAdmin) throw new Error('Supabase is not configured.');

  const { data: posts, error } = await supabaseAdmin
    .from('devcollective_posts')
    .select('id,title,content')
    .is('embedding', null)
    .order('created_at', { ascending: true });
  if (error) throw error;

  console.log(`Found ${posts?.length || 0} community posts without embeddings.`);
  if (!posts?.length) return;

  for (let start = 0; start < posts.length; start += 32) {
    const batch = posts.slice(start, start + 32);
    const texts = batch.map((post: any) => [post.title, post.content].filter(Boolean).join('\n\n'));
    const response = await fetch(`${BGE_SERVICE_URL}/embed/batch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ texts }),
    });
    if (!response.ok) throw new Error(`BGE service returned ${response.status}: ${await response.text()}`);

    const payload = await response.json() as { embeddings?: number[][]; dimensions?: number };
    if (!Array.isArray(payload.embeddings) || payload.embeddings.length !== batch.length || payload.dimensions !== 1024) {
      throw new Error('BGE batch response did not contain the expected 1024-dimensional embeddings.');
    }

    for (let index = 0; index < batch.length; index += 1) {
      const { error: updateError } = await supabaseAdmin
        .from('devcollective_posts')
        .update({ embedding: payload.embeddings[index] })
        .eq('id', batch[index].id);
      if (updateError) throw updateError;
    }

    console.log(`Embedded ${Math.min(start + batch.length, posts.length)}/${posts.length} posts.`);
  }

  console.log('Community embedding backfill complete.');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
