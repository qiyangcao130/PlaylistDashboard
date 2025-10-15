import { ListMusic } from 'lucide-react';
import { Playlist } from '../App';

interface PlaylistsPanelProps {
  playlists: Playlist[];
  activePlaylistId: string | null;
  onSelectPlaylist: (playlistId: string) => void;
}

export function PlaylistsPanel({ playlists, activePlaylistId, onSelectPlaylist }: PlaylistsPanelProps) {
  return (
    <div className="p-4 lg:p-6">
      <div className="flex items-center gap-3 mb-4 lg:mb-6">
        <ListMusic className="w-5 h-5 lg:w-6 lg:h-6 text-purple-500" />
        <h2>Playlists</h2>
      </div>

      <div className="space-y-2">
        {playlists.map(playlist => (
          <button
            key={playlist.id}
            onClick={() => onSelectPlaylist(playlist.id)}
            className={`w-full p-4 rounded-lg text-left transition-colors touch-manipulation ${
              activePlaylistId === playlist.id
                ? 'bg-purple-600 text-white'
                : 'bg-zinc-900 active:bg-zinc-800 lg:hover:bg-zinc-800 text-white'
            }`}
          >
            <div className="mb-1">{playlist.name}</div>
            {playlist.description && (
              <div className={`text-sm ${
                activePlaylistId === playlist.id ? 'text-purple-100' : 'text-zinc-400'
              }`}>
                {playlist.description}
              </div>
            )}
            <div className={`text-xs mt-2 ${
              activePlaylistId === playlist.id ? 'text-purple-200' : 'text-zinc-500'
            }`}>
              {playlist.trackIds.length} {playlist.trackIds.length === 1 ? 'track' : 'tracks'}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
