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
