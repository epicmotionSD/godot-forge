-- Migration 002: Add deployment config columns to projects
-- Run this in the Supabase SQL Editor
-- =========================================================================

-- Steam deployment config
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS deploy_to_steam boolean NOT NULL DEFAULT false;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS steam_app_id text;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS steam_depot_map jsonb DEFAULT '{}';
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS steam_branch text DEFAULT 'default';
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS steam_username_enc text;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS steam_password_enc text;

-- itch.io deployment config
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS deploy_to_itch boolean NOT NULL DEFAULT false;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS itch_game_slug text;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS itch_api_key_enc text;
