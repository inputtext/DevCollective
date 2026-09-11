import 'dotenv/config';
import { supabaseAdmin } from '../server/supabase';

const BGE_SERVICE_URL = (process.env.BGE_SERVICE_URL || 'http://127.0.0.1:8000').replace(/\/$/, '');
const BATCH_SIZE = 32;

function buildMentorText(profile: any) {
  return [
    `Mentor expertise: ${(profile.skills || []).join(', ')}`,
    `Bio: ${profile.bio || ''}`,
    `College: ${profile.college || ''}`,
    `Role: ${profile.role || ''}`,
  ].filter(Boolean).join('\n').trim();
}

async function embedBatch(texts: string[]) {
  const response = await fetch(`${BGE_SERVICE_URL}/embed/batch`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ texts }),
  });
  if (!response.ok) throw new Error(`BGE service returned ${response.status}: ${await response.text()}`);
  const data = await response.json() as { embeddings?: number[][] };
  if (!Array.isArray(data.embeddings) || data.embeddings.length !== texts.length || data.embeddings.some((v) => !Array.isArray(v) || v.length !== 1024)) {
    throw new Error('BGE service returned invalid mentor embeddings.');
  }
  return data.embeddings;
}

async function main() {
  if (!supabaseAdmin) throw new Error('Supabase is not configured.');

  const { data: mentors, error } = await supabaseAdmin
    .from('devcollective_profiles')
    .select('clerk_user_id,name,role,college,bio,skills')
    .in('role', ['mentor', 'faculty'])
    .is('mentor_embedding', null);
  if (error) throw error;

  console.log(`Found ${mentors?.length || 0} mentors without embeddings.`);
  if (!mentors?.length) return;

  for (let start = 0; start < mentors.length; start += BATCH_SIZE) {
    const batch = mentors.slice(start, start + BATCH_SIZE);
    const texts = batch.map(buildMentorText);
    const embeddings = await embedBatch(texts);

    for (let i = 0; i < batch.length; i += 1) {
      const { error: updateError } = await supabaseAdmin
        .from('devcollective_profiles')
        .update({ mentor_embedding: embeddings[i] })
        .eq('clerk_user_id', batch[i].clerk_user_id);
      if (updateError) throw updateError;
    }

    console.log(`Embedded ${Math.min(start + batch.length, mentors.length)}/${mentors.length} mentors.`);
  }

  console.log('Mentor embedding backfill complete.');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
