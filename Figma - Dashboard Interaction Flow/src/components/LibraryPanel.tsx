import { Music2, Play, Plus } from 'lucide-react';
import { Track, Playlist } from '../App';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { Button } from './ui/button';

interface LibraryPanelProps {
  tracks: Track[];
  onPlayTrack: (track: Track) => void;
  onAddToPlaylist: (trackId: string, playlistId: string) => void;
  playlists: Playlist[];
}

export function LibraryPanel({ tracks, onPlayTrack, onAddToPlaylist, playlists }: LibraryPanelProps) {
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="p-4 lg:p-6">
      <div className="flex items-center gap-3 mb-4 lg:mb-6">
        <Music2 className="w-5 h-5 lg:w-6 lg:h-6 text-blue-500" />
        <h2>Library</h2>
      </div>

      <div className="space-y-2">
        {tracks.map(track => (
          <div 
            key={track.id}
            className="group p-3 rounded-lg bg-zinc-900 active:bg-zinc-800 lg:hover:bg-zinc-800 transition-colors"
          >
            <div className="flex items-start gap-3">
              {track.coverArt ? (
                <img 
                  src={track.coverArt} 
                  alt={track.title}
                  className="w-14 h-14 lg:w-12 lg:h-12 rounded object-cover flex-shrink-0"
                />
              ) : (
                <div className="w-14 h-14 lg:w-12 lg:h-12 rounded bg-zinc-800 flex items-center justify-center flex-shrink-0">
                  <Music2 className="w-6 h-6 lg:w-5 lg:h-5 text-zinc-600" />
                </div>
              )}

              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2 mb-3 lg:mb-0">
                  <div className="flex-1 min-w-0">
                    <div className="text-white truncate">{track.title}</div>
                    <div className="text-zinc-400 text-sm truncate">{track.artist}</div>
                    {track.album && (
                      <div className="text-zinc-500 text-xs truncate">{track.album}</div>
                    )}
                  </div>
                  <div className="text-zinc-500 text-sm whitespace-nowrap">
                    {formatDuration(track.duration)}
                  </div>
                </div>

                <div className="flex items-center gap-2 lg:mt-2 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
                  <Button
                    size="sm"
                    onClick={() => onPlayTrack(track)}
                    className="bg-blue-600 hover:bg-blue-700 text-white h-9"
                  >
                    <Play className="w-3 h-3 mr-1 fill-white" />
                    Play
                  </Button>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-zinc-700 bg-zinc-800 hover:bg-zinc-700 text-white h-9"
                      >
                        <Plus className="w-3 h-3 mr-1" />
                        <span className="hidden sm:inline">Add to playlist</span>
                        <span className="sm:hidden">Add</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="bg-zinc-900 border-zinc-800">
                      {playlists.map(playlist => (
                        <DropdownMenuItem
                          key={playlist.id}
                          onClick={() => onAddToPlaylist(track.id, playlist.id)}
                          className="text-white hover:bg-zinc-800 cursor-pointer"
                        >
                          {playlist.name}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
