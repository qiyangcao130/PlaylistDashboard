"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { LibraryPanel } from "./LibraryPanel";
import { PlaylistsPanel } from "./PlaylistsPanel";
import { PlaylistDetails } from "./PlaylistDetails";
import { UploadPanel } from "./UploadPanel";
import { AudioPlayer } from "./AudioPlayer";
import { DuplicateModal } from "./DuplicateModal";
import type { DashboardData, PlaylistWithTracks, Track } from "@/lib/types";
import {
  addTrackToPlaylistAction,
  createPlaylistAction,
  deletePlaylistAction,
  deleteTrackAction,
  logoutAction,
  removeTrackFromPlaylistAction,
  reorderPlaylistTracksAction,
  updatePlaylistMetadataAction,
  type ActionResult
} from "@/app/actions";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

interface DashboardClientProps {
  initialData: DashboardData;
  username: string;
}

export function DashboardClient({ initialData, username }: DashboardClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [activePlaylistId, setActivePlaylistId] = useState<string | null>(initialData.playlists[0]?.id ?? null);
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duplicateModalOpen, setDuplicateModalOpen] = useState(false);
  const [duplicateTrackTitle, setDuplicateTrackTitle] = useState<string | null>(null);
  const [playlistSheetOpen, setPlaylistSheetOpen] = useState(false);

  const playlists = initialData.playlists;
  const tracks = initialData.tracks;
  const canModify = initialData.canModify;

  useEffect(() => {
    if (!activePlaylistId && playlists.length > 0) {
      setActivePlaylistId(playlists[0].id);
    }
  }, [playlists, activePlaylistId]);

  const activePlaylist = useMemo<PlaylistWithTracks | null>(() => {
    return playlists.find((playlist: PlaylistWithTracks) => playlist.id === activePlaylistId) ?? null;
  }, [playlists, activePlaylistId]);

  useEffect(() => {
    if (currentTrack) {
      const stillExists = tracks.some((track: Track) => track.id === currentTrack.id);
      if (!stillExists) {
        setCurrentTrack(null);
        setIsPlaying(false);
      }
    }
  }, [tracks, currentTrack]);

  const queue = useMemo<Track[]>(() => {
    if (activePlaylist?.tracks.length) {
      return activePlaylist.tracks;
    }
    return tracks;
  }, [activePlaylist?.tracks, tracks]);

  const handlePlayTrack = (track: Track) => {
    if (!track.url) {
      toast.error("Track file is unavailable. Please re-upload the audio.");
      return;
    }
    setCurrentTrack(track);
    setIsPlaying(true);
    setPlaylistSheetOpen(false);
  };

  const togglePlayPause = () => {
    if (!currentTrack && queue.length > 0) {
      setCurrentTrack(queue[0]);
      setIsPlaying(true);
      return;
    }
    setIsPlaying((prev: boolean) => !prev);
  };

  const playNext = () => {
    if (queue.length === 0) return;
    if (!currentTrack) {
      setCurrentTrack(queue[0]);
      setIsPlaying(true);
      return;
    }
  const currentIndex = queue.findIndex((track: Track) => track.id === currentTrack.id);
    const nextTrack = queue[(currentIndex + 1) % queue.length];
    setCurrentTrack(nextTrack);
    setIsPlaying(true);
  };

  const playPrevious = () => {
    if (queue.length === 0) return;
    if (!currentTrack) {
      setCurrentTrack(queue[0]);
      setIsPlaying(true);
      return;
    }
  const currentIndex = queue.findIndex((track: Track) => track.id === currentTrack.id);
    const previousIndex = (currentIndex - 1 + queue.length) % queue.length;
    setCurrentTrack(queue[previousIndex]);
    setIsPlaying(true);
  };

  const handleAddToPlaylist = (trackId: string, playlistId: string) => {
    if (!canModify) {
      toast.error("You do not have permission to modify data. This account is read-only.");
      return;
    }

    startTransition(() => {
      addTrackToPlaylistAction({ trackId, playlistId }).then((result: ActionResult) => {
        if (result.success) {
          toast.success("Track added to playlist");
          router.refresh();
        } else if (result.error === "Track already exists in playlist") {
          const track = tracks.find((item: Track) => item.id === trackId);
          setDuplicateTrackTitle(track?.title ?? "This track");
          setDuplicateModalOpen(true);
        } else if (result.error) {
          toast.error(result.error);
        }
      });
    });
  };

  const handleDeleteTrack = (trackId: string) => {
    if (!canModify) {
      toast.error("You do not have permission to modify data. This account is read-only.");
      return;
    }

    if (currentTrack?.id === trackId) {
      setCurrentTrack(null);
      setIsPlaying(false);
    }

    startTransition(() => {
      deleteTrackAction(trackId).then((result: ActionResult) => {
        if (result.success) {
          toast.success("Track deleted");
          router.refresh();
        } else if (result.error) {
          toast.error(result.error);
        }
      });
    });
  };

  const handleRemoveTrack = (trackId: string, playlistId: string) => {
    if (!canModify) {
      toast.error("You do not have permission to modify data. This account is read-only.");
      return;
    }

    startTransition(() => {
  removeTrackFromPlaylistAction({ playlistId, trackId }).then((result: ActionResult) => {
        if (result.success) {
          toast.success("Track removed");
          router.refresh();
        } else if (result.error) {
          toast.error(result.error);
        }
      });
    });
  };

  const handleReorderTracks = (playlistId: string, trackIds: string[]) => {
    if (!canModify) {
      toast.error("You do not have permission to modify data. This account is read-only.");
      return;
    }

    startTransition(() => {
  reorderPlaylistTracksAction({ playlistId, trackIds }).then((result: ActionResult) => {
        if (result.success) {
          router.refresh();
        } else if (result.error) {
          toast.error(result.error);
        }
      });
    });
  };

  const handleUpdatePlaylist = (playlistId: string, updates: { name?: string; description?: string | null }) => {
    if (!canModify) {
      toast.error("You do not have permission to modify data. This account is read-only.");
      return;
    }

    const formData = new FormData();
    formData.append("playlistId", playlistId);
    if (updates.name !== undefined) {
      formData.append("name", updates.name);
    }
    if (updates.description !== undefined) {
      formData.append("description", updates.description ?? "");
    }

    startTransition(() => {
  updatePlaylistMetadataAction(formData).then((result: ActionResult) => {
        if (result.success) {
          toast.success("Playlist updated");
          router.refresh();
        } else if (result.error) {
          toast.error(result.error);
        }
      });
    });
  };

  const handleSelectPlaylist = (playlistId: string) => {
    setActivePlaylistId(playlistId);
    setPlaylistSheetOpen(true);
  };

  const handleCloseDuplicate = () => {
    setDuplicateModalOpen(false);
    setDuplicateTrackTitle(null);
  };

  const handleCreatePlaylist = (payload: { name: string; description?: string }) => {
    if (!canModify) {
      toast.error("You do not have permission to modify data. This account is read-only.");
      return;
    }

    const formData = new FormData();
    formData.append("name", payload.name);
    if (payload.description) {
      formData.append("description", payload.description);
    }

    startTransition(() => {
      createPlaylistAction(formData).then((result) => {
        if (result.success) {
          const newId = result.data?.playlistId ?? null;
          toast.success("Playlist created");
          if (newId) {
            setActivePlaylistId(newId);
          }
          router.refresh();
        } else if (result.error) {
          toast.error(result.error);
        }
      });
    });
  };

  const handleDeletePlaylist = (playlistId: string) => {
    if (!canModify) {
      toast.error("You do not have permission to modify data. This account is read-only.");
      return;
    }

    startTransition(() => {
      deletePlaylistAction(playlistId).then((result: ActionResult) => {
        if (result.success) {
          toast.success("Playlist deleted");
          // Close the sheet and reset active playlist
          setPlaylistSheetOpen(false);
          setActivePlaylistId(playlists.find(p => p.id !== playlistId)?.id ?? null);
          router.refresh();
        } else if (result.error) {
          toast.error(result.error);
        }
      });
    });
  };

  const handleLogout = () => {
    startTransition(() => {
      logoutAction().then(() => {
        router.refresh();
      });
    });
  };

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-white via-slate-50 to-slate-100 text-slate-900">
      <header className="flex items-center justify-between border-b border-slate-200 bg-white/80 px-4 py-3 shadow-sm backdrop-blur lg:px-8">
        <div>
          <h1 className="text-lg font-semibold">Playlist Dashboard</h1>
          <p className="text-xs text-slate-500">
            Signed in as {username}
            {!canModify && <span className="ml-2 rounded bg-amber-100 px-2 py-0.5 text-[10px] font-medium text-amber-800">READ-ONLY</span>}
          </p>
        </div>
        <Button variant="ghost" size="sm" onClick={handleLogout} disabled={isPending}>
          Log out
        </Button>
      </header>

      <main className="flex-1 pb-28 lg:pb-40">
        <div className="lg:hidden">
          <Tabs defaultValue="library" className="w-full">
            <TabsList className="mx-4 mt-4 w-[calc(100%-2rem)]">
              <TabsTrigger value="library">Library</TabsTrigger>
              <TabsTrigger value="playlists">Playlists</TabsTrigger>
              <TabsTrigger value="upload">Upload</TabsTrigger>
            </TabsList>
            <TabsContent value="library">
              <LibraryPanel
                tracks={tracks}
                playlists={playlists}
                onPlayTrack={handlePlayTrack}
                onAddToPlaylist={handleAddToPlaylist}
                onDeleteTrack={handleDeleteTrack}
                canModify={canModify}
              />
            </TabsContent>
            <TabsContent value="playlists">
              <PlaylistsPanel
                playlists={playlists}
                activePlaylistId={activePlaylistId}
                onSelectPlaylist={handleSelectPlaylist}
                onCreatePlaylist={handleCreatePlaylist}
                isBusy={isPending}
                canModify={canModify}
              />
            </TabsContent>
            <TabsContent value="upload">
              <div className="p-4">
                {canModify ? (
                  <UploadPanel />
                ) : (
                  <div className="flex h-64 flex-col items-center justify-center rounded-xl border border-slate-200 bg-white p-6 text-center shadow-sm">
                    <p className="text-lg font-semibold text-slate-700">Upload Disabled</p>
                    <p className="mt-2 text-sm text-slate-500">This account has read-only access.</p>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>

          <Sheet open={playlistSheetOpen} onOpenChange={setPlaylistSheetOpen}>
            <SheetContent side="bottom" className="h-[90vh] overflow-y-auto border-t border-slate-200 bg-white">
              {activePlaylist ? (
                <PlaylistDetails
                  playlist={activePlaylist}
                  onPlayTrack={handlePlayTrack}
                  onRemoveTrack={handleRemoveTrack}
                  onReorderTracks={handleReorderTracks}
                  onUpdatePlaylist={handleUpdatePlaylist}
                  onDeletePlaylist={handleDeletePlaylist}
                  canModify={canModify}
                />
              ) : (
                <p className="text-sm text-slate-500">Select a playlist to view its details.</p>
              )}
            </SheetContent>
          </Sheet>
        </div>

        <div className="hidden h-full gap-6 px-6 py-6 lg:grid lg:grid-cols-[320px_280px_minmax(0,1fr)]">
          <div className="flex flex-col gap-6 overflow-y-auto">
            <LibraryPanel
              tracks={tracks}
              playlists={playlists}
              onPlayTrack={handlePlayTrack}
              onAddToPlaylist={handleAddToPlaylist}
              onDeleteTrack={handleDeleteTrack}
              canModify={canModify}
            />
            {canModify ? (
              <UploadPanel />
            ) : (
              <div className="flex flex-col items-center justify-center rounded-xl border border-slate-200 bg-white p-6 text-center shadow-sm">
                <p className="text-sm font-semibold text-slate-700">Upload Disabled</p>
                <p className="mt-1 text-xs text-slate-500">Read-only access</p>
              </div>
            )}
          </div>
          <div className="overflow-y-auto">
            <PlaylistsPanel
              playlists={playlists}
              activePlaylistId={activePlaylistId}
              onSelectPlaylist={setActivePlaylistId}
              onCreatePlaylist={handleCreatePlaylist}
              isBusy={isPending}
              canModify={canModify}
            />
          </div>
          <div className="overflow-y-auto rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            {activePlaylist ? (
              <PlaylistDetails
                playlist={activePlaylist}
                onPlayTrack={handlePlayTrack}
                onRemoveTrack={handleRemoveTrack}
                onReorderTracks={handleReorderTracks}
                onUpdatePlaylist={handleUpdatePlaylist}
                onDeletePlaylist={handleDeletePlaylist}
                canModify={canModify}
              />
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-slate-500">
                Select a playlist to begin managing its tracks.
              </div>
            )}
          </div>
        </div>
      </main>

      <AudioPlayer track={currentTrack} isPlaying={isPlaying} onPlayPause={togglePlayPause} onNext={playNext} onPrevious={playPrevious} />

      <DuplicateModal isOpen={duplicateModalOpen} onClose={handleCloseDuplicate} trackTitle={duplicateTrackTitle} />
    </div>
  );
}
