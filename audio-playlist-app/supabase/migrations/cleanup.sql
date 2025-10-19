-- ============================================================================
-- CLEANUP SCRIPT - Remove all database objects and storage
-- WARNING: This will delete ALL data! Use only for development/testing.
-- ============================================================================

-- Drop all storage policies first
drop policy if exists "Authenticated users can upload files" on storage.objects;
drop policy if exists "Authenticated users can view all files" on storage.objects;
drop policy if exists "Users can update their own files" on storage.objects;
drop policy if exists "Users can delete their own files" on storage.objects;

-- Drop old storage policies (in case they exist from previous versions)
drop policy if exists "Authenticated users can upload audio files" on storage.objects;
drop policy if exists "Users can upload audio files" on storage.objects;
drop policy if exists "Users can view their own audio and cover files" on storage.objects;
drop policy if exists "Users can update their own audio and cover files" on storage.objects;
drop policy if exists "Users can delete their own audio and cover files" on storage.objects;
drop policy if exists "Users can upload their own audio files" on storage.objects;
drop policy if exists "Users can view their own audio files" on storage.objects;
drop policy if exists "Users can update their own audio files" on storage.objects;
drop policy if exists "Users can delete their own audio files" on storage.objects;
drop policy if exists "Users can upload their own cover art" on storage.objects;
drop policy if exists "Users can view their own cover art" on storage.objects;
drop policy if exists "Users can update their own cover art" on storage.objects;
drop policy if exists "Users can delete their own cover art" on storage.objects;

-- Delete all files from storage buckets first (to avoid foreign key constraint errors)
delete from storage.objects where bucket_id = 'track';
delete from storage.objects where bucket_id = 'audio';
delete from storage.objects where bucket_id = 'audio-files';
delete from storage.objects where bucket_id = 'cover-art';

-- Now drop storage buckets
delete from storage.buckets where id = 'track';
delete from storage.buckets where id = 'audio';
delete from storage.buckets where id = 'audio-files';
delete from storage.buckets where id = 'cover-art';

-- Drop all RLS policies on tables
drop policy if exists "Users can view their own username" on public.username;
drop policy if exists "Users can insert their own username" on public.username;
drop policy if exists "Users can view their own audio files" on public.audio_files;
drop policy if exists "Users can insert their own audio files" on public.audio_files;
drop policy if exists "Users can update their own audio files" on public.audio_files;
drop policy if exists "Users can delete their own audio files" on public.audio_files;
drop policy if exists "Users can view their own playlists" on public.playlists;
drop policy if exists "Users can insert their own playlists" on public.playlists;
drop policy if exists "Users can update their own playlists" on public.playlists;
drop policy if exists "Users can delete their own playlists" on public.playlists;
drop policy if exists "Users can view their own playlist items" on public.playlist_items;
drop policy if exists "Users can insert their own playlist items" on public.playlist_items;
drop policy if exists "Users can update their own playlist items" on public.playlist_items;
drop policy if exists "Users can delete their own playlist items" on public.playlist_items;

-- Disable RLS on all tables
alter table if exists public.username disable row level security;
alter table if exists public.audio_files disable row level security;
alter table if exists public.playlists disable row level security;
alter table if exists public.playlist_items disable row level security;

-- Drop triggers
drop trigger if exists playlists_touch_updated_at on public.playlists;

-- Drop functions
drop function if exists public.touch_playlists_updated_at();

-- Drop indexes
drop index if exists public.playlist_items_position_idx;
drop index if exists public.playlist_items_audio_idx;
drop index if exists public.playlist_items_playlist_idx;
drop index if exists public.playlists_updated_at_idx;
drop index if exists public.playlists_username_idx;
drop index if exists public.audio_files_created_at_idx;
drop index if exists public.audio_files_username_idx;

-- Drop tables (in correct order due to foreign key constraints)
drop table if exists public.playlist_items cascade;
drop table if exists public.playlists cascade;
drop table if exists public.audio_files cascade;
drop table if exists public.username cascade;

-- Clean up auth users (Supabase Auth)
-- WARNING: This deletes all authenticated users from Supabase Auth
delete from auth.users;

-- Drop extensions (optional - only if you want to remove them completely)
-- drop extension if exists "uuid-ossp";
-- drop extension if exists "pgcrypto";

-- ============================================================================
-- CLEANUP COMPLETE
-- ============================================================================
-- Next steps:
-- 1. Run the main migration file (0001_audio_playlist.sql) to recreate everything
-- 2. Manually delete all files from storage buckets in Supabase Dashboard if needed
-- 3. Recreate auth users if using Supabase Auth
-- ============================================================================
