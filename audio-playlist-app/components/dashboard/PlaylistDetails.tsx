"use client";

import { useEffect, useMemo, useState, type ChangeEvent } from "react";
import { Check, GripVertical, Pencil, Play, Trash2, X } from "lucide-react";
import type { PlaylistWithTracks, Track } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import Image from "next/image";
import { cn } from "@/lib/utils";

interface PlaylistDetailsProps {
  playlist: PlaylistWithTracks;
  onPlayTrack(track: Track): void;
  onRemoveTrack(trackId: string, playlistId: string): void;
  onReorderTracks(playlistId: string, trackIds: string[]): void;
  onUpdatePlaylist(playlistId: string, updates: { name?: string; description?: string | null }): void;
}

export function PlaylistDetails({ playlist, onPlayTrack, onRemoveTrack, onReorderTracks, onUpdatePlaylist }: PlaylistDetailsProps) {
  const [isEditingName, setIsEditingName] = useState(false);
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [editedName, setEditedName] = useState(playlist.name);
  const [editedDescription, setEditedDescription] = useState(playlist.description ?? "");
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  useEffect(() => {
    setEditedName(playlist.name);
    setEditedDescription(playlist.description ?? "");
  }, [playlist.id, playlist.name, playlist.description]);

  const updatedTimestamp = useMemo(() => new Date(playlist.updatedAt).toLocaleDateString(), [playlist.updatedAt]);

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return "--";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60)
      .toString()
      .padStart(2, "0");
    return `${mins}:${secs}`;
  };

  const handleSaveName = () => {
    const trimmed = editedName.trim();
    if (!trimmed) return;
    onUpdatePlaylist(playlist.id, { name: trimmed });
    setIsEditingName(false);
  };

  const handleSaveDescription = () => {
    onUpdatePlaylist(playlist.id, { description: editedDescription.trim() || null });
    setIsEditingDescription(false);
  };

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragEnter = (index: number) => {
    setDragOverIndex(index);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDrop = () => {
    if (draggedIndex === null || dragOverIndex === null || draggedIndex === dragOverIndex) {
      handleDragEnd();
      return;
    }
    const updated = [...playlist.trackIds];
    const [removed] = updated.splice(draggedIndex, 1);
    updated.splice(dragOverIndex, 0, removed);
    onReorderTracks(playlist.id, updated);
    handleDragEnd();
  };

  return (
    <section className="space-y-6">
      <header className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          {isEditingName ? (
            <div className="flex w-full max-w-xl items-center gap-2">
              <Input
                value={editedName}
                onChange={(event: ChangeEvent<HTMLInputElement>) => setEditedName(event.target.value)}
                autoFocus
              />
              <Button size="sm" onClick={handleSaveName}>
                <Check className="h-4 w-4" />
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setIsEditingName(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-semibold text-slate-900">{playlist.name}</h1>
              <Button size="icon" variant="ghost" className="text-slate-400 hover:text-slate-600" onClick={() => setIsEditingName(true)}>
                <Pencil className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
        <div>
          {isEditingDescription ? (
            <div className="flex flex-col gap-2">
              <Textarea
                value={editedDescription}
                onChange={(event: ChangeEvent<HTMLTextAreaElement>) => setEditedDescription(event.target.value)}
                rows={3}
              />
              <div className="flex gap-2">
                <Button size="sm" onClick={handleSaveDescription}>
                  <Check className="h-4 w-4" />
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setIsEditingDescription(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex items-start gap-2 text-sm text-slate-600">
              <p>{playlist.description || "No description yet."}</p>
              <Button size="icon" variant="ghost" className="text-slate-400 hover:text-slate-600" onClick={() => setIsEditingDescription(true)}>
                <Pencil className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
        <p className="text-xs uppercase tracking-wide text-slate-500">
          {playlist.trackIds.length} {playlist.trackIds.length === 1 ? "track" : "tracks"} • Updated {updatedTimestamp}
        </p>
      </header>

      <div className="space-y-2">
        {playlist.tracks.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 bg-white p-6 text-center text-sm text-slate-500 shadow-sm">
            No tracks in this playlist yet.
          </div>
        ) : (
          playlist.tracks.map((track, index) => (
            <div
              key={track.id}
              draggable
              onDragStart={() => handleDragStart(index)}
              onDragEnter={() => handleDragEnter(index)}
              onDrop={handleDrop}
              onDragEnd={handleDragEnd}
              className={cn(
                "group flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 shadow-sm transition hover:border-blue-200 hover:bg-blue-50",
                dragOverIndex === index && draggedIndex !== null ? "border-blue-300" : ""
              )}
            >
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-6 items-center justify-center text-xs text-slate-500">{index + 1}</span>
                <button className="hidden rounded-md p-2 text-slate-400 transition hover:bg-slate-200 hover:text-slate-600 lg:flex">
                  <GripVertical className="h-4 w-4" />
                </button>
              </div>
              {track.coverArtUrl ? (
                <Image src={track.coverArtUrl} alt={track.title} width={48} height={48} className="h-12 w-12 rounded-lg object-cover" />
              ) : (
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
                  <Play className="h-5 w-5" />
                </div>
              )}
              <div className="flex flex-1 items-center justify-between gap-4">
                <div className="flex min-w-0 flex-col gap-1">
                  <span className="truncate text-sm font-medium text-slate-900">{track.title}</span>
                  <span className="truncate text-xs text-slate-500">
                    {[track.artist, track.album].filter(Boolean).join(" • ") || "Unknown artist"}
                  </span>
                </div>
                <span className="text-xs text-slate-500">{formatDuration(track.duration)}</span>
              </div>
              <div className="flex items-center gap-2">
                <Button size="icon" variant="ghost" className="text-slate-500 hover:text-slate-700" onClick={() => onPlayTrack(track)}>
                  <Play className="h-4 w-4" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="text-slate-500 hover:text-red-500"
                  onClick={() => onRemoveTrack(track.id, playlist.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
