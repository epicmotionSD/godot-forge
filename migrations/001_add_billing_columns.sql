-- Migration: Add billing columns to profiles table
-- Run this in the Supabase SQL Editor (Dashboard > SQL Editor > New Query)
-- =========================================================================

-- Add Stripe billing columns to profiles
alter table public.profiles
  add column if not exists plan text not null default 'starter',
  add column if not exists stripe_customer_id text,
  add column if not exists stripe_subscription_id text;

-- Index for looking up profiles by Stripe customer ID (webhook handler)
create index if not exists idx_profiles_stripe_customer_id
  on public.profiles(stripe_customer_id)
  where stripe_customer_id is not null;
