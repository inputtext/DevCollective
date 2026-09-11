create extension if not exists vector with schema extensions;

alter table public.devcollective_posts
  add column if not exists embedding extensions.vector(1024);

create index if not exists devcollective_posts_embedding_hnsw_idx
  on public.devcollective_posts
  using hnsw (embedding vector_cosine_ops)
  where embedding is not null;

create or replace function public.match_community_posts(
  query_embedding extensions.vector(1024),
  match_threshold real default 0.35,
  match_count integer default 12
)
returns table (
  id uuid,
  title text,
  content text,
  category text,
  created_at timestamptz,
  similarity real
)
language sql
stable
set search_path = public, extensions
as $$
  select
    p.id,
    p.title,
    p.content,
    p.category,
    p.created_at,
    (1 - (p.embedding <=> query_embedding))::real as similarity
  from public.devcollective_posts p
  where p.embedding is not null
    and 1 - (p.embedding <=> query_embedding) >= match_threshold
  order by p.embedding <=> query_embedding
  limit greatest(1, least(match_count, 50));
$$;
