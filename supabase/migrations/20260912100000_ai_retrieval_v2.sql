-- DevCollective AI retrieval v2
-- Pass 1: hybrid community search + weighted mentor matching.

alter table public.devcollective_posts
  add column if not exists search_vector tsvector
  generated always as (
    to_tsvector(
      'english',
      concat_ws(' ', coalesce(title, ''), coalesce(content, ''), coalesce(category, ''))
    )
  ) stored;

create index if not exists devcollective_posts_search_vector_gin_idx
  on public.devcollective_posts using gin (search_vector);

create index if not exists devcollective_profiles_mentor_embedding_hnsw_idx
  on public.devcollective_profiles
  using hnsw (mentor_embedding vector_cosine_ops)
  where mentor_embedding is not null;

create or replace function public.hybrid_search_community_posts(
  query_text text,
  query_embedding extensions.vector(1024),
  match_count integer default 12,
  semantic_weight real default 0.70,
  keyword_weight real default 0.30,
  rrf_k integer default 50
)
returns table (
  id uuid,
  title text,
  content text,
  category text,
  created_at timestamptz,
  semantic_similarity real,
  keyword_rank bigint,
  semantic_rank bigint,
  hybrid_score real
)
language sql
stable
set search_path = public, extensions
as $$
  with params as (
    select
      greatest(1, least(match_count, 50)) as requested_count,
      greatest(1, rrf_k) as smooth_k,
      greatest(0.0, semantic_weight) as sw,
      greatest(0.0, keyword_weight) as kw,
      websearch_to_tsquery('english', coalesce(query_text, '')) as tsq
  ),
  full_text as (
    select
      p.id,
      row_number() over (order by ts_rank_cd(p.search_vector, params.tsq) desc, p.created_at desc) as rank_ix
    from public.devcollective_posts p
    cross join params
    where params.tsq <> to_tsquery('english', '')
      and p.search_vector @@ params.tsq
    order by rank_ix
    limit (select requested_count * 2 from params)
  ),
  semantic as (
    select
      p.id,
      row_number() over (order by p.embedding <=> query_embedding) as rank_ix
    from public.devcollective_posts p
    where p.embedding is not null
    order by p.embedding <=> query_embedding
    limit (select requested_count * 2 from params)
  ),
  ranked as (
    select
      p.id,
      p.title,
      p.content,
      p.category,
      p.created_at,
      (1 - (p.embedding <=> query_embedding))::real as semantic_similarity,
      ft.rank_ix as keyword_rank,
      sem.rank_ix as semantic_rank,
      (
        coalesce(1.0 / (params.smooth_k + ft.rank_ix), 0.0) * params.kw +
        coalesce(1.0 / (params.smooth_k + sem.rank_ix), 0.0) * params.sw
      )::real as hybrid_score
    from full_text ft
    full outer join semantic sem on sem.id = ft.id
    join public.devcollective_posts p on p.id = coalesce(ft.id, sem.id)
    cross join params
  )
  select *
  from ranked
  order by hybrid_score desc, created_at desc
  limit (select requested_count from params);
$$;

create or replace function public.match_mentors_v2(
  query_embedding extensions.vector(1024),
  query_skills text[] default array[]::text[],
  query_domains text[] default array[]::text[],
  query_level integer default 1,
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
  selected_domains text[],
  level integer,
  rep integer,
  bio text,
  semantic_score real,
  skill_score real,
  domain_score real,
  level_score real,
  reputation_score real,
  match_score real
)
language sql
stable
set search_path = public, extensions
as $$
  with normalized_query as (
    select
      coalesce(array(
        select lower(trim(value))
        from unnest(coalesce(query_skills, array[]::text[])) value
        where trim(value) <> ''
      ), array[]::text[]) as skills,
      coalesce(array(
        select lower(trim(value))
        from unnest(coalesce(query_domains, array[]::text[])) value
        where trim(value) <> ''
      ), array[]::text[]) as domains,
      greatest(1, least(coalesce(query_level, 1), 10)) as level
  ),
  candidates as (
    select
      p.*,
      (1 - (p.mentor_embedding <=> query_embedding))::real as semantic_score,
      case
        when cardinality(nq.skills) = 0 then 0::real
        else least(1.0, (
          select count(*)::real
          from (
            select distinct lower(trim(jsonb_array_elements_text(p.skills))) as skill
          ) mentor_skills
          where mentor_skills.skill = any(nq.skills)
        ) / cardinality(nq.skills))
      end as skill_score,
      case
        when cardinality(nq.domains) = 0 then 0::real
        else least(1.0, (
          select count(*)::real
          from (
            select distinct lower(trim(jsonb_array_elements_text(p.selected_domains))) as domain
          ) mentor_domains
          where mentor_domains.domain = any(nq.domains)
        ) / cardinality(nq.domains))
      end as domain_score,
      greatest(0.0, 1.0 - least(1.0, abs(coalesce(p.level, 1) - nq.level)::real / 5.0))::real as level_score,
      least(1.0, ln(1.0 + greatest(coalesce(p.rep, 0), 0)) / ln(2001.0))::real as reputation_score
    from public.devcollective_profiles p
    cross join normalized_query nq
    where p.role in ('mentor', 'faculty')
      and (p.role = 'faculty' or p.mentor_verified_at is not null)
      and p.mentor_embedding is not null
  ),
  scored as (
    select
      c.*,
      (
        c.semantic_score * 0.55 +
        c.skill_score * 0.20 +
        c.domain_score * 0.15 +
        c.level_score * 0.05 +
        c.reputation_score * 0.05
      )::real as match_score
    from candidates c
  )
  select
    s.clerk_user_id::text as id,
    s.name::text,
    case when s.role = 'faculty' then 'Faculty Mentor' else 'Mentor' end::text as title,
    coalesce(s.college, '')::text,
    coalesce(s.avatar, '')::text,
    case when s.role = 'faculty' then 'FACULTY' else 'SENIOR' end::text,
    case when jsonb_typeof(s.skills) = 'array' then array(select jsonb_array_elements_text(s.skills)) else array[]::text[] end,
    case when jsonb_typeof(s.selected_domains) = 'array' then array(select jsonb_array_elements_text(s.selected_domains)) else array[]::text[] end,
    coalesce(s.level, 1)::integer,
    coalesce(s.rep, 0)::integer,
    coalesce(s.bio, '')::text,
    s.semantic_score,
    s.skill_score,
    s.domain_score,
    s.level_score,
    s.reputation_score,
    s.match_score
  from scored s
  order by s.match_score desc, s.rep desc, s.name asc
  limit greatest(1, least(match_count, 20));
$$;
