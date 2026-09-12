-- DevCollective AI Pass 2: duplicate question detection + adaptive learning context

create index if not exists devcollective_posts_embedding_hnsw_idx
  on public.devcollective_posts using hnsw (embedding vector_cosine_ops)
  where embedding is not null;

create or replace function public.find_duplicate_questions(
  query_embedding extensions.vector(1024),
  exclude_post_id uuid default null,
  match_threshold real default 0.84,
  match_count integer default 5
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
    coalesce(p.title, 'Community question')::text,
    p.content::text,
    p.category::text,
    p.created_at,
    (1 - (p.embedding <=> query_embedding))::real as similarity
  from public.devcollective_posts p
  where p.embedding is not null
    and p.category = 'Questions'
    and (exclude_post_id is null or p.id <> exclude_post_id)
    and (1 - (p.embedding <=> query_embedding)) >= greatest(0.50, least(match_threshold, 0.99))
  order by p.embedding <=> query_embedding
  limit greatest(1, least(match_count, 10));
$$;

create or replace function public.get_adaptive_learning_context(target_user_id text)
returns jsonb
language sql
stable
set search_path = public, extensions
as $$
  select jsonb_build_object(
    'profile', coalesce((select to_jsonb(p) - 'email' from public.devcollective_profiles p where p.clerk_user_id = target_user_id), '{}'::jsonb),
    'completed_submodules', coalesce((select jsonb_agg(to_jsonb(u)) from public.user_submodule_progress u where u.user_id = target_user_id and u.verified_at is not null), '[]'::jsonb),
    'module_progress', coalesce((select jsonb_agg(to_jsonb(u)) from public.user_module_progress u where u.user_id = target_user_id), '[]'::jsonb),
    'level_progress', coalesce((select jsonb_agg(to_jsonb(u)) from public.user_level_progress u where u.user_id = target_user_id), '[]'::jsonb),
    'recent_posts', coalesce((select jsonb_agg(to_jsonb(x)) from (select id,title,category,created_at from public.devcollective_posts where author_clerk_user_id = target_user_id order by created_at desc limit 20) x), '[]'::jsonb)
  );
$$;
