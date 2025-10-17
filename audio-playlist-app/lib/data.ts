import { SUPABASE_STORAGE_BUCKET } from "./env";
import { createSupabaseServerClient } from "./supabase-server";
import { canModifyData } from "./permissions";
import type { DashboardData, PlaylistWithTracks, Track } from "./types";
import type { Database } from "./database.types";

export async function fetchDashboardData(username: string): Promise<DashboardData> {
  const supabase = createSupabaseServerClient();

  type TrackRow = Database["public"]["Tables"]["audio_files"]["Row"];
  type PlaylistRow = Database["public"]["Tables"]["playlists"]["Row"];
  type PlaylistItemRow = Database["public"]["Tables"]["playlist_items"]["Row"];

  const { data: trackRowsRaw, error: trackError } = await supabase
    .from("audio_files")
    .select("*")
    .eq("username", username)
    .order("created_at", { ascending: false });

  if (trackError) {
    throw new Error(trackError.message);
  }

  const trackRows = (trackRowsRaw ?? []) as TrackRow[];

  const { data: playlistRowsRaw, error: playlistError } = await supabase
    .from("playlists")
    .select("*")
    .eq("username", username)
    .order("updated_at", { ascending: false });

  if (playlistError) {
    throw new Error(playlistError.message);
  }

  const playlistRows = (playlistRowsRaw ?? []) as PlaylistRow[];

  const tracks: Track[] = await Promise.all(
    trackRows.map(async (row) => {
      const { data: signed, error: signedError } = await supabase.storage
        .from(SUPABASE_STORAGE_BUCKET)
        .createSignedUrl(row.storage_path, 3600);

      const signedUrl = signed?.signedUrl ?? "";
      const isMissingAsset = signedError && /not found/i.test(signedError.message ?? "");

      if (signedError && !isMissingAsset) {
        throw new Error(`Failed to sign URL for track ${row.id}: ${signedError.message}`);
      }

      return {
        id: row.id,
        username: row.username,
        title: row.title,
        artist: row.artist,
        album: row.album,
        coverArtUrl: row.cover_art_url,
        duration: row.duration_seconds,
        url: isMissingAsset ? "" : signedUrl,
        contentType: row.content_type,
        fileSize: row.file_size,
        uploadedAt: row.created_at
      };
    })
  );

  const playlistIds = playlistRows.map((playlist) => playlist.id);

  if (playlistIds.length === 0) {
    return {
      tracks,
      playlists: [],
      canModify: canModifyData(username)
    };
  }

  const { data: playlistItemRowsRaw, error: playlistItemsError } = await supabase
    .from("playlist_items")
    .select("*")
    .in("playlist_id", playlistIds)
    .order("position", { ascending: true });

  if (playlistItemsError) {
    throw new Error(playlistItemsError.message);
  }

  const playlistItemRows = (playlistItemRowsRaw ?? []) as PlaylistItemRow[];

  const trackMap = new Map(tracks.map((track) => [track.id, track] as const));

  const playlists: PlaylistWithTracks[] = playlistRows.map((playlist) => {
    const items = playlistItemRows.filter((item) => item.playlist_id === playlist.id);
    const orderedTracks = items
      .sort((a, b) => a.position - b.position)
      .map((item) => trackMap.get(item.audio_id))
      .filter((track): track is Track => Boolean(track));
    return {
      id: playlist.id,
      username: playlist.username,
      name: playlist.name,
      description: playlist.description,
      createdAt: playlist.created_at,
      updatedAt: playlist.updated_at,
      trackIds: items.map((item) => item.audio_id),
      tracks: orderedTracks
    };
  });

  return {
    tracks,
    playlists,
    canModify: canModifyData(username)
  };
}
