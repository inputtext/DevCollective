create extension if not exists vector with schema extensions;

alter table public.devcollective_profiles
  add column if not exists mentor_embedding extensions.vector(1024);

create index if not exists devcollective_profiles_mentor_embedding_hnsw_idx
  on public.devcollective_profiles
  using hnsw (mentor_embedding vector_cosine_ops)
  where mentor_embedding is not null;

create or replace function public.match_mentors(
  query_embedding extensions.vector(1024),
  match_threshold real default 0.30,
  match_count integer default 8
)
returns table (
  id text,
  name text,
  title text,
  college text,
  avatar text,
  role_type text,
  skills text[],
  level integer,
  rep integer,
  bio text,
  similarity real
)
language sql
stable
set search_path = public, extensions
as $$
  select
    p.clerk_user_id::text as id,
    p.name::text,
    case when p.role = 'faculty' then 'Faculty Mentor' else 'Mentor' end::text as title,
    coalesce(p.college, '')::text,
    coalesce(p.avatar, '')::text,
    case when p.role = 'faculty' then 'FACULTY' else 'SENIOR' end::text as role_type,
    case
      when jsonb_typeof(p.skills) = 'array' then array(select jsonb_array_elements_text(p.skills))
      else array[]::text[]
    end as skills,
    coalesce(p.level, 1)::integer,
    coalesce(p.rep, 0)::integer,
    coalesce(p.bio, '')::text,
    (1 - (p.mentor_embedding <=> query_embedding))::real as similarity
  from public.devcollective_profiles p
  where p.role in ('mentor', 'faculty')
    and p.mentor_embedding is not null
    and 1 - (p.mentor_embedding <=> query_embedding) >= match_threshold
  order by p.mentor_embedding <=> query_embedding
  limit greatest(1, least(match_count, 20));
$$;
