"use client";

import { useState, type FormEvent } from "react";
import { ListMusic, Plus } from "lucide-react";
import type { PlaylistWithTracks } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

interface PlaylistsPanelProps {
  playlists: PlaylistWithTracks[];
  activePlaylistId: string | null;
  onSelectPlaylist(playlistId: string): void;
  onCreatePlaylist?(payload: { name: string; description?: string }): Promise<void> | void;
  isBusy?: boolean;
  canModify?: boolean;
}

export function PlaylistsPanel({ playlists, activePlaylistId, onSelectPlaylist, onCreatePlaylist, isBusy = false, canModify = true }: PlaylistsPanelProps) {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const trimmedName = name.trim();
    const trimmedDescription = description.trim();

    if (!trimmedName) {
      toast.error("Playlist name is required");
      return;
    }

    try {
      await onCreatePlaylist?.({ name: trimmedName, description: trimmedDescription || undefined });
      setName("");
      setDescription("");
      setShowCreateForm(false);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to create playlist";
      toast.error(message);
    }
  };

  return (
    <div className="space-y-4 p-4 lg:p-6">
      <header className="flex items-center justify-between text-slate-700">
        <div className="flex items-center gap-2">
          <ListMusic className="h-5 w-5 text-purple-500" />
          <h2 className="text-lg font-semibold">Playlists</h2>
        </div>
        {canModify && (
          <Button size="sm" variant={showCreateForm ? "secondary" : "outline"} onClick={() => setShowCreateForm((value) => !value)} disabled={isBusy}>
            <Plus className="mr-1.5 h-4 w-4" />
            {showCreateForm ? "Cancel" : "New playlist"}
          </Button>
        )}
      </header>

      {showCreateForm && canModify ? (
        <form onSubmit={handleSubmit} className="space-y-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="space-y-2">
            <label className="text-xs font-medium uppercase tracking-wide text-slate-500" htmlFor="playlist-name">
              Name
            </label>
            <Input id="playlist-name" value={name} onChange={(event) => setName(event.target.value)} placeholder="Road trip bangers" required disabled={isBusy} />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-medium uppercase tracking-wide text-slate-500" htmlFor="playlist-description">
              Description
            </label>
            <Textarea id="playlist-description" value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Optional notes" rows={3} disabled={isBusy} />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" size="sm" onClick={() => setShowCreateForm(false)} disabled={isBusy}>
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={isBusy}>
              {isBusy ? "Creating..." : "Create"}
            </Button>
          </div>
        </form>
      ) : null}

      <div className="space-y-3">
        {playlists.map((playlist) => {
          const isActive = playlist.id === activePlaylistId;
          return (
            <button
              key={playlist.id}
              onClick={() => onSelectPlaylist(playlist.id)}
              className={cn(
                "w-full rounded-xl border p-4 text-left transition",
                isActive
                  ? "border-transparent bg-primary text-primary-foreground shadow-md"
                  : "border-slate-200 bg-white text-slate-700 shadow-sm hover:bg-slate-100"
              )}
            >
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <h3 className="text-sm font-semibold">{playlist.name}</h3>
                  {playlist.description ? <p className={cn("text-xs", isActive ? "text-white/80" : "text-slate-500")}>{playlist.description}</p> : null}
                </div>
                <span className={cn("text-xs", isActive ? "text-white/80" : "text-slate-500")}>
                  {playlist.trackIds.length} {playlist.trackIds.length === 1 ? "track" : "tracks"}
                </span>
              </div>
            </button>
          );
        })}
        {playlists.length === 0 ? <p className="text-sm text-slate-500">Create your first playlist to get started.</p> : null}
      </div>
    </div>
  );
}
