import { useState } from 'react';
import { LibraryPanel } from './components/LibraryPanel';
import { PlaylistsPanel } from './components/PlaylistsPanel';
import { PlaylistDetails } from './components/PlaylistDetails';
import { UploadPanel } from './components/UploadPanel';
import { AudioPlayer } from './components/AudioPlayer';
import { DuplicateModal } from './components/DuplicateModal';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './components/ui/tabs';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from './components/ui/sheet';
import { Music2, ListMusic, Upload } from 'lucide-react';

export interface Track {
  id: string;
  title: string;
  artist: string;
  album?: string;
  duration: number;
  url: string;
  coverArt?: string;
  uploadedAt: Date;
}

export interface Playlist {
  id: string;
  name: string;
  description?: string;
  trackIds: string[];
  createdAt: Date;
  updatedAt: Date;
}

export default function App() {
  const [tracks, setTracks] = useState<Track[]>([
    {
      id: '1',
      title: 'Midnight Dreams',
      artist: 'Luna Wave',
      album: 'Nocturnal',
      duration: 245,
      url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
      coverArt: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400',
      uploadedAt: new Date('2025-01-15')
    },
    {
      id: '2',
      title: 'Electric Sunrise',
      artist: 'Synthwave Collective',
      album: 'Dawn',
      duration: 198,
      url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
      coverArt: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400',
      uploadedAt: new Date('2025-01-16')
    },
    {
      id: '3',
      title: 'Urban Echoes',
      artist: 'City Lights',
      duration: 212,
      url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3',
      coverArt: 'https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?w=400',
      uploadedAt: new Date('2025-01-17')
    }
  ]);

  const [playlists, setPlaylists] = useState<Playlist[]>([
    {
      id: 'p1',
      name: 'Chill Vibes',
      description: 'Relaxing tracks for late night coding',
      trackIds: ['1', '3'],
      createdAt: new Date('2025-01-10'),
      updatedAt: new Date('2025-01-17')
    },
    {
      id: 'p2',
      name: 'Workout Mix',
      description: 'High energy beats',
      trackIds: ['2'],
      createdAt: new Date('2025-01-12'),
      updatedAt: new Date('2025-01-16')
    }
  ]);

  const [activePlaylistId, setActivePlaylistId] = useState<string | null>('p1');
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duplicateModalOpen, setDuplicateModalOpen] = useState(false);
  const [duplicateTrackTitle, setDuplicateTrackTitle] = useState('');
  const [playlistSheetOpen, setPlaylistSheetOpen] = useState(false);

  const handlePlayTrack = (track: Track) => {
    setCurrentTrack(track);
    setIsPlaying(true);
  };

  const handleAddToPlaylist = (trackId: string, playlistId: string) => {
    const playlist = playlists.find(p => p.id === playlistId);
    const track = tracks.find(t => t.id === trackId);
    
    if (!playlist || !track) return;

    if (playlist.trackIds.includes(trackId)) {
      setDuplicateTrackTitle(track.title);
      setDuplicateModalOpen(true);
      return;
    }

    setPlaylists(playlists.map(p => 
      p.id === playlistId 
        ? { ...p, trackIds: [...p.trackIds, trackId], updatedAt: new Date() }
        : p
    ));
  };

  const handleRemoveFromPlaylist = (trackId: string, playlistId: string) => {
    setPlaylists(playlists.map(p => 
      p.id === playlistId 
        ? { ...p, trackIds: p.trackIds.filter(id => id !== trackId), updatedAt: new Date() }
        : p
    ));
  };

  const handleReorderTracks = (playlistId: string, trackIds: string[]) => {
    setPlaylists(playlists.map(p => 
      p.id === playlistId 
        ? { ...p, trackIds, updatedAt: new Date() }
        : p
    ));
  };

  const handleUpdatePlaylist = (playlistId: string, updates: { name?: string; description?: string }) => {
    setPlaylists(playlists.map(p => 
      p.id === playlistId 
        ? { ...p, ...updates, updatedAt: new Date() }
        : p
    ));
  };

  const handleUploadTrack = (newTrack: Omit<Track, 'id' | 'uploadedAt'>) => {
    const track: Track = {
      ...newTrack,
      id: `track-${Date.now()}`,
      uploadedAt: new Date()
    };
    setTracks([track, ...tracks]);
  };

  const activePlaylist = playlists.find(p => p.id === activePlaylistId);
  const activePlaylistTracks = activePlaylist 
    ? activePlaylist.trackIds.map(id => tracks.find(t => t.id === id)).filter(Boolean) as Track[]
    : [];

  const handleSelectPlaylist = (playlistId: string) => {
    setActivePlaylistId(playlistId);
    setPlaylistSheetOpen(true);
  };

  return (
    <div className="flex flex-col h-screen bg-zinc-950 text-white">
      {/* Mobile Layout */}
      <div className="lg:hidden flex flex-col flex-1 overflow-hidden pb-20">
        <Tabs defaultValue="library" className="flex flex-col flex-1 overflow-hidden">
          <TabsList className="w-full bg-zinc-900 border-b border-zinc-800 rounded-none h-14 p-0">
            <TabsTrigger value="library" className="flex-1 h-full data-[state=active]:bg-zinc-800">
              <Music2 className="w-4 h-4 mr-2" />
              Library
            </TabsTrigger>
            <TabsTrigger value="playlists" className="flex-1 h-full data-[state=active]:bg-zinc-800">
              <ListMusic className="w-4 h-4 mr-2" />
              Playlists
            </TabsTrigger>
            <TabsTrigger value="upload" className="flex-1 h-full data-[state=active]:bg-zinc-800">
              <Upload className="w-4 h-4 mr-2" />
              Upload
            </TabsTrigger>
          </TabsList>

          <TabsContent value="library" className="flex-1 overflow-y-auto mt-0 p-0">
            <LibraryPanel 
              tracks={tracks}
              onPlayTrack={handlePlayTrack}
              onAddToPlaylist={handleAddToPlaylist}
              playlists={playlists}
            />
          </TabsContent>

          <TabsContent value="playlists" className="flex-1 overflow-y-auto mt-0 p-0">
            <PlaylistsPanel 
              playlists={playlists}
              activePlaylistId={activePlaylistId}
              onSelectPlaylist={handleSelectPlaylist}
            />
          </TabsContent>

          <TabsContent value="upload" className="flex-1 overflow-y-auto mt-0 p-0">
            <div className="h-full flex items-center justify-center">
              <div className="w-full max-w-md px-4">
                <UploadPanel onUploadTrack={handleUploadTrack} />
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* Mobile Playlist Details Sheet */}
        <Sheet open={playlistSheetOpen} onOpenChange={setPlaylistSheetOpen}>
          <SheetContent side="bottom" className="bg-zinc-950 border-zinc-800 h-[90vh] p-0" aria-describedby={undefined}>
            <SheetHeader className="sr-only">
              <SheetTitle>{activePlaylist?.name || 'Playlist'}</SheetTitle>
            </SheetHeader>
            <div className="h-full overflow-y-auto">
              {activePlaylist && (
                <PlaylistDetails 
                  playlist={activePlaylist}
                  tracks={activePlaylistTracks}
                  onPlayTrack={handlePlayTrack}
                  onRemoveTrack={handleRemoveFromPlaylist}
                  onReorderTracks={handleReorderTracks}
                  onUpdatePlaylist={handleUpdatePlaylist}
                />
              )}
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Desktop Layout */}
      <div className="hidden lg:flex flex-1 overflow-hidden">
        {/* Left Sidebar */}
        <div className="w-80 border-r border-zinc-800 flex flex-col">
          {/* Library Section */}
          <div className="flex-1 overflow-y-auto border-b border-zinc-800">
            <LibraryPanel 
              tracks={tracks}
              onPlayTrack={handlePlayTrack}
              onAddToPlaylist={handleAddToPlaylist}
              playlists={playlists}
            />
          </div>

          {/* Upload Section */}
          <div className="h-64 border-b border-zinc-800">
            <UploadPanel onUploadTrack={handleUploadTrack} />
          </div>
        </div>

        {/* Middle Panel - Playlists */}
        <div className="w-72 border-r border-zinc-800">
          <PlaylistsPanel 
            playlists={playlists}
            activePlaylistId={activePlaylistId}
            onSelectPlaylist={setActivePlaylistId}
          />
        </div>

        {/* Right Panel - Playlist Details */}
        <div className="flex-1 overflow-y-auto">
          {activePlaylist ? (
            <PlaylistDetails 
              playlist={activePlaylist}
              tracks={activePlaylistTracks}
              onPlayTrack={handlePlayTrack}
              onRemoveTrack={handleRemoveFromPlaylist}
              onReorderTracks={handleReorderTracks}
              onUpdatePlaylist={handleUpdatePlaylist}
            />
          ) : (
            <div className="h-full flex items-center justify-center text-zinc-500">
              Select a playlist to view details
            </div>
          )}
        </div>
      </div>

      {/* Audio Player Footer */}
      <AudioPlayer 
        track={currentTrack}
        isPlaying={isPlaying}
        onPlayPause={() => setIsPlaying(!isPlaying)}
        onNext={() => {
          if (activePlaylistTracks.length > 0 && currentTrack) {
            const currentIndex = activePlaylistTracks.findIndex(t => t.id === currentTrack.id);
            const nextIndex = (currentIndex + 1) % activePlaylistTracks.length;
            handlePlayTrack(activePlaylistTracks[nextIndex]);
          }
        }}
        onPrevious={() => {
          if (activePlaylistTracks.length > 0 && currentTrack) {
            const currentIndex = activePlaylistTracks.findIndex(t => t.id === currentTrack.id);
            const prevIndex = currentIndex === 0 ? activePlaylistTracks.length - 1 : currentIndex - 1;
            handlePlayTrack(activePlaylistTracks[prevIndex]);
          }
        }}
      />

      {/* Duplicate Modal */}
      <DuplicateModal 
        isOpen={duplicateModalOpen}
        onClose={() => setDuplicateModalOpen(false)}
        trackTitle={duplicateTrackTitle}
      />
    </div>
  );
}
