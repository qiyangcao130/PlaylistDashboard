-- Enable required extensions
create extension if not exists "pgcrypto";
create extension if not exists "uuid-ossp";

-- Application users
create table if not exists public.username (
    username text primary key,
    displayname text not null,
    created_at timestamptz not null default timezone('utc'::text, now())
);

-- Audio library
create table if not exists public.audio_files (
    id uuid not null default gen_random_uuid() primary key,
    username text not null references public.username (username) on delete cascade,
    title text not null,
    artist text,
    album text,
    cover_art_url text,
    version text,
    storage_path text not null,
    content_type text,
    file_size bigint,
    duration_seconds double precision,
    created_at timestamptz not null default timezone('utc'::text, now()),
    unique (username, title, created_at),
    constraint audio_files_storage_path_key unique (storage_path)
);

create index if not exists audio_files_username_idx on public.audio_files (username);
create index if not exists audio_files_created_at_idx on public.audio_files (created_at desc);

-- Playlists
create table if not exists public.playlists (
    id uuid not null default gen_random_uuid() primary key,
    username text not null references public.username (username) on delete cascade,
    name text not null,
    description text,
    created_at timestamptz not null default timezone('utc'::text, now()),
    updated_at timestamptz not null default timezone('utc'::text, now())
);

create index if not exists playlists_username_idx on public.playlists (username);
create index if not exists playlists_updated_at_idx on public.playlists (updated_at desc);

-- updated_at trigger
create or replace function public.touch_playlists_updated_at()
returns trigger
language plpgsql
as $$
begin
    new.updated_at = timezone('utc'::text, now());
    return new;
end;
$$;

create trigger playlists_touch_updated_at
before update on public.playlists
for each row execute procedure public.touch_playlists_updated_at();

-- Playlist items
create table if not exists public.playlist_items (
    id uuid not null default gen_random_uuid() primary key,
    username text not null references public.username (username) on delete cascade,
    playlist_id uuid not null references public.playlists (id) on delete cascade,
    audio_id uuid not null references public.audio_files (id) on delete cascade,
    position integer not null,
    created_at timestamptz not null default timezone('utc'::text, now()),
    constraint playlist_items_playlist_audio_unique unique (playlist_id, audio_id)
);

create index if not exists playlist_items_playlist_idx on public.playlist_items (playlist_id, position);
create index if not exists playlist_items_audio_idx on public.playlist_items (audio_id);

-- Ensure position uniqueness per playlist
create unique index if not exists playlist_items_position_idx
    on public.playlist_items (playlist_id, position);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on all tables
alter table public.username enable row level security;
alter table public.audio_files enable row level security;
alter table public.playlists enable row level security;
alter table public.playlist_items enable row level security;

-- Username table policies
create policy "Users can view their own username"
    on public.username for select
    using (username = (auth.jwt() -> 'user_metadata' ->> 'username')::text);

create policy "Users can insert their own username"
    on public.username for insert
    with check (username = (auth.jwt() -> 'user_metadata' ->> 'username')::text);

-- Audio files policies
create policy "Users can view their own audio files"
    on public.audio_files for select
    using (username = (auth.jwt() -> 'user_metadata' ->> 'username')::text);

create policy "Users can insert their own audio files"
    on public.audio_files for insert
    with check (username = (auth.jwt() -> 'user_metadata' ->> 'username')::text);

create policy "Users can update their own audio files"
    on public.audio_files for update
    using (username = (auth.jwt() -> 'user_metadata' ->> 'username')::text);

create policy "Users can delete their own audio files"
    on public.audio_files for delete
    using (username = (auth.jwt() -> 'user_metadata' ->> 'username')::text);

-- Playlists policies
create policy "Users can view their own playlists"
    on public.playlists for select
    using (username = (auth.jwt() -> 'user_metadata' ->> 'username')::text);

create policy "Users can insert their own playlists"
    on public.playlists for insert
    with check (username = (auth.jwt() -> 'user_metadata' ->> 'username')::text);

create policy "Users can update their own playlists"
    on public.playlists for update
    using (username = (auth.jwt() -> 'user_metadata' ->> 'username')::text);

create policy "Users can delete their own playlists"
    on public.playlists for delete
    using (username = (auth.jwt() -> 'user_metadata' ->> 'username')::text);

-- Playlist items policies
create policy "Users can view their own playlist items"
    on public.playlist_items for select
    using (username = (auth.jwt() -> 'user_metadata' ->> 'username')::text);

create policy "Users can insert their own playlist items"
    on public.playlist_items for insert
    with check (username = (auth.jwt() -> 'user_metadata' ->> 'username')::text);

create policy "Users can update their own playlist items"
    on public.playlist_items for update
    using (username = (auth.jwt() -> 'user_metadata' ->> 'username')::text);

create policy "Users can delete their own playlist items"
    on public.playlist_items for delete
    using (username = (auth.jwt() -> 'user_metadata' ->> 'username')::text);

-- ============================================================================
-- STORAGE SETUP
-- ============================================================================

-- Create private storage bucket 'track'
-- 
-- IMPORTANT: Folders are created automatically when files are uploaded.
-- The application will create these folders on first upload:
--   track/
--     ├── audio/     (created when first audio file is uploaded)
--     └── cover/     (created when first cover art is uploaded)
-- 
-- These match the default values of STORAGE_AUDIO_FOLDER and STORAGE_COVER_FOLDER env vars

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
    'track',
    'track',
    false, -- PRIVATE bucket, requires authentication
    104857600, -- 100MB file size limit
    array[
        -- Audio formats
        'audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg', 'audio/flac', 'audio/aac', 'audio/m4a',
        -- Image formats
        'image/jpeg', 'image/png', 'image/webp', 'image/gif'
    ]
)
on conflict (id) do update set
    public = false,
    file_size_limit = 104857600,
    allowed_mime_types = array[
        'audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg', 'audio/flac', 'audio/aac', 'audio/m4a',
        'image/jpeg', 'image/png', 'image/webp', 'image/gif'
    ];

-- ============================================================================
-- STORAGE POLICIES
-- ============================================================================

-- Any authenticated user can upload files to audio/ or cover/ folders
create policy "Authenticated users can upload files"
    on storage.objects for insert
    with check (
        bucket_id = 'track'
        and auth.role() = 'authenticated'
    );

-- Any authenticated user can view all audio and cover files
create policy "Authenticated users can view all files"
    on storage.objects for select
    using (
        bucket_id = 'track'
        and auth.role() = 'authenticated'
    );

-- Users can only update their own files
create policy "Users can update their own files"
    on storage.objects for update
    using (
        bucket_id = 'track'
        and auth.role() = 'authenticated'
        and exists (
            select 1 from public.audio_files
            where audio_files.username = (auth.jwt() -> 'user_metadata' ->> 'username')::text
            and (
                audio_files.storage_path = storage.objects.name
                or
                audio_files.cover_art_url like '%' || storage.objects.name
            )
        )
    );

-- Users can only delete their own files
create policy "Users can delete their own files"
    on storage.objects for delete
    using (
        bucket_id = 'track'
        and auth.role() = 'authenticated'
        and exists (
            select 1 from public.audio_files
            where audio_files.username = (auth.jwt() -> 'user_metadata' ->> 'username')::text
            and (
                audio_files.storage_path = storage.objects.name
                or
                audio_files.cover_art_url like '%' || storage.objects.name
            )
        )
    );
