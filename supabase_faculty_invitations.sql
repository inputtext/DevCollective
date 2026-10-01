-- Faculty invitation + approval data model for DevCollective.
-- Applied to Supabase project: jzanieialphvqtnzoncp

create extension if not exists pgcrypto;

create table if not exists public.devcollective_faculty_invitations (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  college text not null default 'GHRCEMN',
  invited_by uuid,
  token_hash text not null unique,
  status text not null default 'pending',
  expires_at timestamptz not null default (now() + interval '7 days'),
  accepted_at timestamptz,
  created_at timestamptz not null default now(),
  constraint devcollective_faculty_inv_status_check check (status in ('pending','accepted','revoked','expired'))
);

create index if not exists devcollective_faculty_invitations_email_idx
  on public.devcollective_faculty_invitations (lower(email));

create table if not exists public.devcollective_faculty_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  employee_id text not null,
  department text not null,
  designation text not null,
  phone text,
  subjects text[] not null default '{}',
  expertise text[] not null default '{}',
  years_experience integer,
  mentoring_areas text[] not null default '{}',
  bio text,
  approval_status text not null default 'pending',
  approved_by uuid,
  approved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint devcollective_faculty_profile_status_check check (approval_status in ('pending','approved','rejected','suspended'))
);

alter table public.devcollective_faculty_invitations enable row level security;
alter table public.devcollective_faculty_profiles enable row level security;

revoke all on public.devcollective_faculty_invitations from anon, authenticated;
revoke all on public.devcollective_faculty_profiles from anon, authenticated;

drop policy if exists "Faculty can view own profile" on public.devcollective_faculty_profiles;
create policy "Faculty can view own profile"
  on public.devcollective_faculty_profiles for select
  to authenticated
  using (user_id = auth.uid());

drop policy if exists "Faculty can update own pending profile" on public.devcollective_faculty_profiles;
create policy "Faculty can update own pending profile"
  on public.devcollective_faculty_profiles for update
  to authenticated
  using (user_id = auth.uid() and approval_status = 'pending')
  with check (user_id = auth.uid() and approval_status = 'pending');

grant select on public.devcollective_faculty_profiles to authenticated;
grant update (department, designation, phone, subjects, expertise, years_experience, mentoring_areas, bio, updated_at)
  on public.devcollective_faculty_profiles to authenticated;
