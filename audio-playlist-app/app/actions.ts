"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { randomUUID } from "crypto";
import { Buffer } from "node:buffer";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { clearSession, requireSession, setSession } from "@/lib/auth";
import { requireModifyPermission } from "@/lib/permissions";
import type { DashboardData } from "@/lib/types";
import { fetchDashboardData } from "@/lib/data";
import { SUPABASE_STORAGE_BUCKET, SUPABASE_STORAGE_PREFIX } from "@/lib/env";
import type { Database } from "@/lib/database.types";

export interface ActionResult<T = undefined> {
  success: boolean;
  error?: string;
  data?: T;
}

export interface LoginState extends ActionResult {
  success: boolean;
}

const loginSchema = z.object({
  username: z.string().trim().min(1, "Username is required")
});

export async function loginAction(_: LoginState, formData: FormData): Promise<LoginState> {
  const supabase = createSupabaseServerClient();
  const parsed = loginSchema.safeParse({ username: formData.get("username") });

  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid username" };
  }

  const username = parsed.data.username;
  const { data, error } = await supabase
    .from("username")
    .select("username")
    .eq("username", username)
    .maybeSingle();

  if (error) {
    return { success: false, error: error.message };
  }

  if (!data) {
    return { success: false, error: "That username is not registered" };
  }

  setSession(username);
  revalidatePath("/");
  return { success: true };
}

export async function logoutAction() {
  clearSession();
  revalidatePath("/");
}

const uploadSchema = z.object({
  title: z.string().trim().min(1, "Title is required"),
  artist: z.string().trim().optional(),
  album: z.string().trim().optional()
});

export interface UploadTrackResult extends ActionResult {
  storagePath?: string;
}

type FileLike = Blob & { name: string };

const isFileLike = (value: unknown): value is FileLike => {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const candidate = value as { arrayBuffer?: unknown; name?: unknown; type?: unknown };
  return (
    typeof candidate.arrayBuffer === "function" &&
    typeof candidate.name === "string" &&
    typeof candidate.type === "string"
  );
};

export async function uploadTrackAction(prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const session = requireSession();
  
  // Check if user has permission to modify data
  try {
    requireModifyPermission(session.username);
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Permission denied" };
  }

  const supabase = createSupabaseServerClient();
  const parsedMeta = uploadSchema.safeParse({
    title: formData.get("title"),
    artist: formData.get("artist") ?? undefined,
    album: formData.get("album") ?? undefined
  });

  if (!parsedMeta.success) {
    return { success: false, error: parsedMeta.error.issues[0]?.message ?? "Invalid form fields" };
  }

  // Extract duration if provided
  const durationString = formData.get("duration");
  const duration = durationString && typeof durationString === "string" ? parseFloat(durationString) : null;

  const file = formData.get("file");

  if (!isFileLike(file)) {
    return { success: false, error: "Missing audio file" };
  }

  if (!file.type.startsWith("audio")) {
    return { success: false, error: "File must be an audio format" };
  }

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const extension = file.name.split(".").pop() ?? "audio";
  const path = `${SUPABASE_STORAGE_PREFIX}/${randomUUID()}-${Date.now()}.${extension}`;

  const { error: uploadError } = await supabase.storage.from(SUPABASE_STORAGE_BUCKET).upload(path, buffer, {
    contentType: file.type,
    cacheControl: "3600",
    upsert: false
  });

  if (uploadError) {
    return { success: false, error: uploadError.message };
  }

  // Handle optional cover art upload
  let coverArtUrl: string | null = null;
  const coverFile = formData.get("cover");
  
  if (isFileLike(coverFile) && coverFile.type.startsWith("image")) {
    // Validate image size (5MB max)
    const maxSize = 5 * 1024 * 1024;
    if (coverFile.size > maxSize) {
      // Clean up audio file if cover upload fails validation
      await supabase.storage.from(SUPABASE_STORAGE_BUCKET).remove([path]);
      return { success: false, error: "Cover image must be less than 5 MB" };
    }

    const coverBuffer = Buffer.from(await coverFile.arrayBuffer());
    const coverExtension = coverFile.name.split(".").pop() ?? "jpg";
    const coverPath = `${SUPABASE_STORAGE_PREFIX}/covers/${randomUUID()}-${Date.now()}.${coverExtension}`;

    const { error: coverUploadError } = await supabase.storage.from(SUPABASE_STORAGE_BUCKET).upload(coverPath, coverBuffer, {
      contentType: coverFile.type,
      cacheControl: "3600",
      upsert: false
    });

    if (coverUploadError) {
      // Clean up audio file if cover upload fails
      await supabase.storage.from(SUPABASE_STORAGE_BUCKET).remove([path]);
      return { success: false, error: `Failed to upload cover: ${coverUploadError.message}` };
    }

    // Get public URL for the cover art
    const { data: publicUrlData } = supabase.storage.from(SUPABASE_STORAGE_BUCKET).getPublicUrl(coverPath);
    coverArtUrl = publicUrlData.publicUrl;
  }

  const audioPayload: Database["public"]["Tables"]["audio_files"]["Insert"] = {
    username: session.username,
    title: parsedMeta.data.title,
    artist: parsedMeta.data.artist ?? null,
    album: parsedMeta.data.album ?? null,
    storage_path: path,
    cover_art_url: coverArtUrl,
    content_type: file.type,
    file_size: file.size,
    duration_seconds: duration
  };

  // Supabase client schema typing still resolving in generated types, so fall back to any for now.
  const { error: insertError } = await (supabase.from("audio_files") as any).insert(audioPayload);

  if (insertError) {
    // Clean up uploaded files if database insert fails
    await supabase.storage.from(SUPABASE_STORAGE_BUCKET).remove([path]);
    if (coverArtUrl) {
      const coverPathFromUrl = coverArtUrl.split('/').slice(-3).join('/');
      await supabase.storage.from(SUPABASE_STORAGE_BUCKET).remove([coverPathFromUrl]);
    }
    return { success: false, error: insertError.message };
  }

  revalidatePath("/");
  return { success: true };
}

const createPlaylistSchema = z.object({
  name: z.string().trim().min(1, "Playlist name is required"),
  description: z.string().trim().optional()
});

export async function deleteTrackAction(trackId: string): Promise<ActionResult> {
  const session = requireSession();
  
  // Check if user has permission to modify data
  try {
    requireModifyPermission(session.username);
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Permission denied" };
  }

  const supabase = createSupabaseServerClient();

  const { data: trackData, error: trackLookupError } = await supabase
    .from("audio_files")
    .select("id, storage_path")
    .eq("id", trackId)
    .eq("username", session.username)
    .maybeSingle();

  if (trackLookupError) {
    return { success: false, error: trackLookupError.message };
  }

  type TrackRecord = Pick<Database["public"]["Tables"]["audio_files"]["Row"], "id" | "storage_path">;
  const track = trackData as TrackRecord | null;

  if (!track) {
    return { success: false, error: "Track not found" };
  }

  if (track.storage_path) {
    const { error: storageError } = await supabase.storage.from(SUPABASE_STORAGE_BUCKET).remove([track.storage_path]);
    if (storageError && !/not found/i.test(storageError.message ?? "")) {
      return { success: false, error: storageError.message };
    }
  }

  const { error: playlistCleanupError } = await supabase.from("playlist_items").delete().eq("audio_id", trackId);
  if (playlistCleanupError) {
    return { success: false, error: playlistCleanupError.message };
  }

  const { error: deleteError } = await supabase
    .from("audio_files")
    .delete()
    .eq("id", trackId)
    .eq("username", session.username);

  if (deleteError) {
    return { success: false, error: deleteError.message };
  }

  revalidatePath("/");
  return { success: true };
}

export async function createPlaylistAction(formData: FormData): Promise<ActionResult<{ playlistId: string }>> {
  const session = requireSession();
  
  // Check if user has permission to modify data
  try {
    requireModifyPermission(session.username);
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Permission denied" };
  }

  const supabase = createSupabaseServerClient();
  const parsed = createPlaylistSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description") ?? undefined
  });

  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid playlist data" };
  }

  const id = randomUUID();
  const playlistPayload: Database["public"]["Tables"]["playlists"]["Insert"] = {
    id,
    username: session.username,
    name: parsed.data.name,
    description: parsed.data.description ?? null
  };

  const { error } = await (supabase.from("playlists") as any).insert(playlistPayload);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/");
  return { success: true, data: { playlistId: id } };
}

export async function deletePlaylistAction(playlistId: string): Promise<ActionResult> {
  const session = requireSession();
  
  // Check if user has permission to modify data
  try {
    requireModifyPermission(session.username);
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Permission denied" };
  }

  const supabase = createSupabaseServerClient();

  const { error } = await supabase
    .from("playlists")
    .delete()
    .eq("id", playlistId)
    .eq("username", session.username);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/");
  return { success: true };
}

export async function addTrackToPlaylistAction(args: { playlistId: string; trackId: string }): Promise<ActionResult> {
  const session = requireSession();
  
  // Check if user has permission to modify data
  try {
    requireModifyPermission(session.username);
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Permission denied" };
  }

  const supabase = createSupabaseServerClient();

  const { data: playlist, error: playlistError } = await supabase
    .from("playlists")
    .select("id")
    .eq("id", args.playlistId)
    .eq("username", session.username)
    .maybeSingle();

  if (playlistError) {
    return { success: false, error: playlistError.message };
  }

  if (!playlist) {
    return { success: false, error: "Playlist not found" };
  }

  const { data: existing, error: existingError } = await supabase
    .from("playlist_items")
    .select("id")
    .eq("playlist_id", args.playlistId)
    .eq("audio_id", args.trackId)
    .maybeSingle();

  if (existingError) {
    return { success: false, error: existingError.message };
  }

  if (existing) {
    return { success: false, error: "Track already exists in playlist" };
  }

  const { data: lastPositionData, error: positionError } = await (supabase.from("playlist_items") as any)
    .select("position")
    .eq("playlist_id", args.playlistId)
    .order("position", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (positionError) {
    return { success: false, error: positionError.message };
  }

  const nextPosition = typeof lastPositionData?.position === "number" ? lastPositionData.position + 1 : 0;

  const playlistItemPayload: Database["public"]["Tables"]["playlist_items"]["Insert"] = {
    playlist_id: args.playlistId,
    audio_id: args.trackId,
    position: nextPosition
  };

  const { error: insertError } = await (supabase.from("playlist_items") as any).insert(playlistItemPayload);

  if (insertError) {
    return { success: false, error: insertError.message };
  }

  revalidatePath("/");
  return { success: true };
}

export async function removeTrackFromPlaylistAction(args: { playlistId: string; trackId: string }): Promise<ActionResult> {
  const session = requireSession();
  
  // Check if user has permission to modify data
  try {
    requireModifyPermission(session.username);
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Permission denied" };
  }

  const supabase = createSupabaseServerClient();

  const { error } = await supabase
    .from("playlist_items")
    .delete()
    .eq("playlist_id", args.playlistId)
    .eq("audio_id", args.trackId);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/");
  return { success: true };
}

export async function reorderPlaylistTracksAction(args: { playlistId: string; trackIds: string[] }): Promise<ActionResult> {
  const session = requireSession();
  
  // Check if user has permission to modify data
  try {
    requireModifyPermission(session.username);
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Permission denied" };
  }

  const supabase = createSupabaseServerClient();

  const updates: Database["public"]["Tables"]["playlist_items"]["Insert"][] = args.trackIds.map((trackId, index) => ({
    playlist_id: args.playlistId,
    audio_id: trackId,
    position: index
  }));

  const { error } = await (supabase.from("playlist_items") as any).upsert(updates, {
    onConflict: "playlist_id,audio_id"
  });

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/");
  return { success: true };
}

const updatePlaylistSchema = z.object({
  playlistId: z.string().uuid(),
  name: z.string().trim().min(1, "Name required").optional(),
  description: z.string().trim().optional()
});

export async function updatePlaylistMetadataAction(formData: FormData): Promise<ActionResult> {
  const session = requireSession();
  
  // Check if user has permission to modify data
  try {
    requireModifyPermission(session.username);
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Permission denied" };
  }

  const supabase = createSupabaseServerClient();

  const parsed = updatePlaylistSchema.safeParse({
    playlistId: formData.get("playlistId"),
    name: formData.get("name") ?? undefined,
    description: formData.get("description") ?? undefined
  });

  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid playlist update" };
  }

  const payload: Database["public"]["Tables"]["playlists"]["Update"] = {};

  if (parsed.data.name !== undefined) {
    payload.name = parsed.data.name;
  }

  if (parsed.data.description !== undefined) {
    payload.description = parsed.data.description ?? null;
  }

  const { error } = await supabase
    .from("playlists")
    .update(payload)
    .eq("id", parsed.data.playlistId)
    .eq("username", session.username);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/");
  return { success: true };
}

export async function loadDashboardData(): Promise<ActionResult<DashboardData>> {
  try {
    const session = requireSession();
    const data = await fetchDashboardData(session.username);
    return { success: true, data };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return { success: false, error: message };
  }
}
