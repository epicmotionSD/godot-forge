-- Run this in the Supabase SQL Editor (Dashboard > SQL Editor > New Query)

-- 1. Create the waitlist table
create table public.waitlist (
  id uuid default gen_random_uuid() primary key,
  email text not null,
  source text default 'landing_page',
  created_at timestamptz default now()
);

-- 2. Add a unique constraint on email to prevent duplicates
alter table public.waitlist add constraint waitlist_email_unique unique (email);

-- 3. Enable Row Level Security
alter table public.waitlist enable row level security;

-- 4. No RLS policies needed — the serverless API uses the service_role key,
--    which bypasses RLS. This means the table is locked down from direct
--    client access via the anon key (no one can read/write from the browser).
