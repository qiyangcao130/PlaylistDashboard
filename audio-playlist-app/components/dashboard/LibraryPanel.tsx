"use client";

import { Music2, Plus, Play, Trash2 } from "lucide-react";
import type { PlaylistWithTracks, Track } from "@/lib/types";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import Image from "next/image";
import { useMemo } from "react";

interface LibraryPanelProps {
  tracks: Track[];
  playlists: PlaylistWithTracks[];
  onPlayTrack(track: Track): void;
  onAddToPlaylist(trackId: string, playlistId: string): void;
  onDeleteTrack(trackId: string): void;
  canModify?: boolean;
}

export function LibraryPanel({ tracks, playlists, onPlayTrack, onAddToPlaylist, onDeleteTrack, canModify = true }: LibraryPanelProps) {
  const sortedTracks = useMemo(() => [...tracks].sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime()), [tracks]);

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return "--";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60)
      .toString()
      .padStart(2, "0");
    return `${mins}:${secs}`;
  };

  return (
    <div className="space-y-4 p-4 lg:p-6">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-slate-700">
          <Music2 className="h-5 w-5 text-blue-500" />
          <h2 className="text-lg font-semibold">Library</h2>
        </div>
        <span className="text-xs text-slate-500">{sortedTracks.length} tracks</span>
      </header>
      <div className="space-y-3">
        {sortedTracks.map((track) => (
          <article
            key={track.id}
            className="group flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:shadow-md"
          >
            <div className="flex items-center gap-3">
              {track.coverArtUrl ? (
                <Image
                  src={track.coverArtUrl}
                  alt={track.title}
                  width={48}
                  height={48}
                  className="h-12 w-12 rounded-lg object-cover"
                />
              ) : (
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
                  <Music2 className="h-6 w-6" />
                </div>
              )}
              <div className="flex flex-1 flex-col gap-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate text-sm font-medium text-slate-900">{track.title}</span>
                  <span className="text-xs text-slate-500">{formatDuration(track.duration)}</span>
                </div>
                <span className="text-xs text-slate-500">
                  {[track.artist, track.album].filter(Boolean).join(" • ") || "Unknown artist"}
                </span>
              </div>
            </div>
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Button size="sm" onClick={() => onPlayTrack(track)} className="bg-blue-600 hover:bg-blue-500">
                  <Play className="mr-1.5 h-4 w-4" />
                  Play
                </Button>
                {canModify && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm" className="border-slate-200 text-slate-700">
                        <Plus className="mr-1.5 h-4 w-4" />
                        Add
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="w-48 text-slate-700">
                      <DropdownMenuLabel className="text-xs uppercase tracking-wide text-slate-500">
                        Add to playlist
                      </DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      {playlists.length === 0 ? (
                      <DropdownMenuItem disabled className="text-slate-400">
                        No playlists yet
                      </DropdownMenuItem>
                    ) : (
                      playlists.map((playlist) => (
                        <DropdownMenuItem
                          key={playlist.id}
                          onSelect={() => onAddToPlaylist(track.id, playlist.id)}
                          className="text-slate-700 hover:text-slate-900"
                        >
                          {playlist.name}
                        </DropdownMenuItem>
                      ))
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
                )}
                {canModify && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-red-200 bg-red-50 text-red-600 hover:bg-red-100"
                    onClick={() => onDeleteTrack(track.id)}
                  >
                    <Trash2 className="mr-1.5 h-4 w-4" />
                    Delete
                  </Button>
                )}
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
