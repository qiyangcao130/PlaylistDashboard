import { useState } from 'react';
import { Edit2, GripVertical, Play, Trash2, Check, X } from 'lucide-react';
import { Track, Playlist } from '../App';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';

interface PlaylistDetailsProps {
  playlist: Playlist;
  tracks: Track[];
  onPlayTrack: (track: Track) => void;
  onRemoveTrack: (trackId: string, playlistId: string) => void;
  onReorderTracks: (playlistId: string, trackIds: string[]) => void;
  onUpdatePlaylist: (playlistId: string, updates: { name?: string; description?: string }) => void;
}

export function PlaylistDetails({ 
  playlist, 
  tracks, 
  onPlayTrack, 
  onRemoveTrack, 
  onReorderTracks,
  onUpdatePlaylist 
}: PlaylistDetailsProps) {
  const [isEditingName, setIsEditingName] = useState(false);
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [editedName, setEditedName] = useState(playlist.name);
  const [editedDescription, setEditedDescription] = useState(playlist.description || '');
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const handleSaveName = () => {
    if (editedName.trim()) {
      onUpdatePlaylist(playlist.id, { name: editedName.trim() });
    }
    setIsEditingName(false);
  };

  const handleSaveDescription = () => {
    onUpdatePlaylist(playlist.id, { description: editedDescription.trim() });
    setIsEditingDescription(false);
  };

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    setDragOverIndex(index);
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (draggedIndex === null) return;

    const newTrackIds = [...playlist.trackIds];
    const [draggedId] = newTrackIds.splice(draggedIndex, 1);
    newTrackIds.splice(dropIndex, 0, draggedId);

    onReorderTracks(playlist.id, newTrackIds);
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="p-4 lg:p-8">
      {/* Header */}
      <div className="mb-6 lg:mb-8">
        {/* Playlist Name */}
        {isEditingName ? (
          <div className="flex items-center gap-2 mb-4">
            <Input
              value={editedName}
              onChange={(e) => setEditedName(e.target.value)}
              className="bg-zinc-900 border-zinc-700 text-white text-2xl"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSaveName();
                if (e.key === 'Escape') {
                  setEditedName(playlist.name);
                  setIsEditingName(false);
                }
              }}
            />
            <Button
              size="sm"
              onClick={handleSaveName}
              className="bg-green-600 hover:bg-green-700"
            >
              <Check className="w-4 h-4" />
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setEditedName(playlist.name);
                setIsEditingName(false);
              }}
              className="border-zinc-700 bg-zinc-800 hover:bg-zinc-700"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        ) : (
          <div className="flex items-center gap-3 mb-4">
            <h1 className="text-white">{playlist.name}</h1>
            <button
              onClick={() => setIsEditingName(true)}
              className="p-2 hover:bg-zinc-800 rounded-lg transition-colors"
            >
              <Edit2 className="w-4 h-4 text-zinc-400" />
            </button>
          </div>
        )}

        {/* Playlist Description */}
        {isEditingDescription ? (
          <div className="space-y-2">
            <Textarea
              value={editedDescription}
              onChange={(e) => setEditedDescription(e.target.value)}
              className="bg-zinc-900 border-zinc-700 text-white"
              placeholder="Add a description..."
              rows={3}
              autoFocus
            />
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={handleSaveDescription}
                className="bg-green-600 hover:bg-green-700"
              >
                <Check className="w-4 h-4 mr-1" />
                Save
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setEditedDescription(playlist.description || '');
                  setIsEditingDescription(false);
                }}
                className="border-zinc-700 bg-zinc-800 hover:bg-zinc-700"
              >
                <X className="w-4 h-4 mr-1" />
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex items-start gap-2">
            {playlist.description ? (
              <p className="text-zinc-400">{playlist.description}</p>
            ) : (
              <p className="text-zinc-600 italic">No description</p>
            )}
            <button
              onClick={() => setIsEditingDescription(true)}
              className="p-1 hover:bg-zinc-800 rounded transition-colors flex-shrink-0"
            >
              <Edit2 className="w-3 h-3 text-zinc-500" />
            </button>
          </div>
        )}

        <div className="mt-4 text-sm text-zinc-500">
          {tracks.length} {tracks.length === 1 ? 'track' : 'tracks'} • Updated {playlist.updatedAt.toLocaleDateString()}
        </div>
      </div>

      {/* Track List */}
      <div className="space-y-1">
        {tracks.length === 0 ? (
          <div className="text-center py-12 text-zinc-500">
            No tracks in this playlist. Add tracks from your library!
          </div>
        ) : (
          tracks.map((track, index) => (
            <div
              key={track.id}
              draggable
              onDragStart={() => handleDragStart(index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDrop={(e) => handleDrop(e, index)}
              className={`group flex items-center gap-2 lg:gap-3 p-3 rounded-lg active:bg-zinc-900 lg:hover:bg-zinc-900 transition-colors cursor-move ${
                dragOverIndex === index && draggedIndex !== index
                  ? 'border-t-2 border-blue-500'
                  : ''
              }`}
            >
              <GripVertical className="w-5 h-5 lg:w-4 lg:h-4 text-zinc-600 flex-shrink-0 touch-manipulation" />

              <div className="w-6 lg:w-8 text-zinc-500 text-sm flex-shrink-0">
                {index + 1}
              </div>

              {track.coverArt ? (
                <img 
                  src={track.coverArt} 
                  alt={track.title}
                  className="w-12 h-12 lg:w-10 lg:h-10 rounded object-cover flex-shrink-0"
                />
              ) : (
                <div className="w-12 h-12 lg:w-10 lg:h-10 rounded bg-zinc-800 flex-shrink-0" />
              )}

              <div className="flex-1 min-w-0">
                <div className="text-white truncate">{track.title}</div>
                <div className="text-zinc-400 text-sm truncate">{track.artist}</div>
                <div className="text-zinc-500 text-xs lg:hidden mt-1">
                  {formatDuration(track.duration)}
                </div>
              </div>

              <div className="hidden lg:block text-zinc-500 text-sm flex-shrink-0">
                {formatDuration(track.duration)}
              </div>

              <div className="flex items-center gap-1 lg:gap-2 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity flex-shrink-0">
                <Button
                  size="sm"
                  onClick={() => onPlayTrack(track)}
                  className="bg-blue-600 hover:bg-blue-700 text-white h-9 w-9 p-0"
                >
                  <Play className="w-3 h-3 fill-white" />
                </Button>

                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onRemoveTrack(track.id, playlist.id)}
                  className="border-zinc-700 bg-zinc-800 hover:bg-red-900 hover:border-red-700 text-white h-9 w-9 p-0"
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
