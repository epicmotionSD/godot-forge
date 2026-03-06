-- GodotForge — Full Supabase Schema
-- Run this in the Supabase SQL Editor (Dashboard > SQL Editor > New Query)
-- =========================================================================

-- 1. Waitlist (landing page signups)
-- =========================================================================
create table if not exists public.waitlist (
  id uuid default gen_random_uuid() primary key,
  email text not null,
  source text default 'landing_page',
  created_at timestamptz default now()
);
alter table public.waitlist add constraint waitlist_email_unique unique (email);
alter table public.waitlist enable row level security;

-- 2. Profiles (user data + GitHub OAuth token)
-- =========================================================================
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  github_token text,
  avatar_url text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
alter table public.profiles enable row level security;

-- Users can read and update their own profile
create policy "Users can read own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- Auto-create profile on signup via trigger
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email);
  return new;
end;
$$;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 3. Projects (Godot repos connected by users)
-- =========================================================================
create table if not exists public.projects (
  id uuid default gen_random_uuid() primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  repo_provider text not null default 'github',
  repo_url text not null,
  repo_branch text default 'main',
  godot_version text,
  project_path text default '.',
  platforms text[] default '{windows,linux}',
  trigger_on_push boolean default true,
  trigger_on_tag boolean default true,
  trigger_on_pr boolean default false,
  webhook_id text,
  webhook_secret text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
alter table public.projects enable row level security;

create policy "Users can read own projects"
  on public.projects for select
  using (auth.uid() = user_id);

create policy "Users can insert own projects"
  on public.projects for insert
  with check (auth.uid() = user_id);

create policy "Users can update own projects"
  on public.projects for update
  using (auth.uid() = user_id);

create policy "Users can delete own projects"
  on public.projects for delete
  using (auth.uid() = user_id);

-- 4. Builds (build records per project)
-- =========================================================================
create table if not exists public.builds (
  id uuid default gen_random_uuid() primary key,
  project_id uuid not null references public.projects(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'queued',
  trigger_type text not null default 'manual',
  trigger_ref text default '',
  commit_sha text default '',
  commit_message text default '',
  platforms text[] default '{}',
  started_at timestamptz,
  finished_at timestamptz,
  duration_seconds integer,
  created_at timestamptz default now()
);
alter table public.builds enable row level security;

create policy "Users can read own builds"
  on public.builds for select
  using (auth.uid() = user_id);

create policy "Users can insert own builds"
  on public.builds for insert
  with check (auth.uid() = user_id);

-- Service role handles status updates from Inngest/webhooks (bypasses RLS)

-- Auto-compute duration on status change
create or replace function public.compute_build_duration()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  if new.finished_at is not null and new.started_at is not null then
    new.duration_seconds := extract(epoch from (new.finished_at - new.started_at))::integer;
  end if;
  return new;
end;
$$;

create or replace trigger build_duration_trigger
  before update on public.builds
  for each row execute function public.compute_build_duration();

-- 5. Build Logs (streaming log entries per build)
-- =========================================================================
create table if not exists public.build_logs (
  id uuid default gen_random_uuid() primary key,
  build_id uuid not null references public.builds(id) on delete cascade,
  phase text not null default 'clone',
  platform text,
  message text not null,
  level text default 'info',
  created_at timestamptz default now()
);
alter table public.build_logs enable row level security;

-- Users can read logs for their own builds
create policy "Users can read own build logs"
  on public.build_logs for select
  using (
    exists (
      select 1 from public.builds
      where builds.id = build_logs.build_id
        and builds.user_id = auth.uid()
    )
  );

-- Service role inserts logs from build containers (bypasses RLS)

-- Index for fast log retrieval
create index if not exists idx_build_logs_build_id on public.build_logs(build_id, created_at);

-- 6. Artifacts (built files per build)
-- =========================================================================
create table if not exists public.artifacts (
  id uuid default gen_random_uuid() primary key,
  build_id uuid not null references public.builds(id) on delete cascade,
  platform text not null,
  file_name text not null,
  file_size bigint default 0,
  storage_path text not null,
  created_at timestamptz default now()
);
alter table public.artifacts enable row level security;

-- Users can read artifacts for their own builds
create policy "Users can read own artifacts"
  on public.artifacts for select
  using (
    exists (
      select 1 from public.builds
      where builds.id = artifacts.build_id
        and builds.user_id = auth.uid()
    )
  );

-- Service role inserts artifacts from build containers (bypasses RLS)

-- Index for fast artifact retrieval
create index if not exists idx_artifacts_build_id on public.artifacts(build_id);

-- 7. Storage bucket for build artifacts
-- =========================================================================
insert into storage.buckets (id, name, public)
values ('artifacts', 'artifacts', false)
on conflict (id) do nothing;

-- Service role uploads artifacts; signed URLs for downloads
create policy "Service role can upload artifacts"
  on storage.objects for insert
  with check (bucket_id = 'artifacts');

create policy "Authenticated users can download own artifacts"
  on storage.objects for select
  using (
    bucket_id = 'artifacts'
    and auth.role() = 'authenticated'
  );

-- 8. Enable Realtime for live build updates
-- =========================================================================
alter publication supabase_realtime add table public.builds;
alter publication supabase_realtime add table public.build_logs;
