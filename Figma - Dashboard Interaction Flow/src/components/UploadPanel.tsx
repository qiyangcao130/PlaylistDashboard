import { useState } from 'react';
import { Upload, Check } from 'lucide-react';
import { Track } from '../App';
import { Button } from './ui/button';
import { Input } from './ui/input';

interface UploadPanelProps {
  onUploadTrack: (track: Omit<Track, 'id' | 'uploadedAt'>) => void;
}

export function UploadPanel({ onUploadTrack }: UploadPanelProps) {
  const [title, setTitle] = useState('');
  const [artist, setArtist] = useState('');
  const [album, setAlbum] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !artist.trim()) return;

    setIsUploading(true);

    // Simulate upload delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Mock track data - in real implementation, this would come from the uploaded file
    const newTrack: Omit<Track, 'id' | 'uploadedAt'> = {
      title: title.trim(),
      artist: artist.trim(),
      album: album.trim() || undefined,
      duration: Math.floor(Math.random() * 300) + 120, // Random duration between 2-7 minutes
      url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3', // Mock URL
      coverArt: `https://images.unsplash.com/photo-${1500000000000 + Math.floor(Math.random() * 100000000000)}-${Math.random().toString(36).substring(7)}?w=400`
    };

    onUploadTrack(newTrack);
    
    setIsUploading(false);
    setUploadSuccess(true);
    
    // Reset form
    setTitle('');
    setArtist('');
    setAlbum('');

    // Reset success message
    setTimeout(() => setUploadSuccess(false), 2000);
  };

  return (
    <div className="p-4 lg:p-6 h-full flex flex-col">
      <div className="flex items-center gap-3 mb-4 lg:mb-4">
        <Upload className="w-5 h-5 text-green-500" />
        <h3 className="text-white">Upload Track</h3>
      </div>

      <form onSubmit={handleSubmit} className="flex-1 flex flex-col">
        <div className="space-y-3 flex-1">
          <Input
            placeholder="Track title *"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            className="bg-zinc-900 border-zinc-700 text-white placeholder:text-zinc-600 h-12"
          />

          <Input
            placeholder="Artist name *"
            value={artist}
            onChange={(e) => setArtist(e.target.value)}
            required
            className="bg-zinc-900 border-zinc-700 text-white placeholder:text-zinc-600 h-12"
          />

          <Input
            placeholder="Album (optional)"
            value={album}
            onChange={(e) => setAlbum(e.target.value)}
            className="bg-zinc-900 border-zinc-700 text-white placeholder:text-zinc-600 h-12"
          />
        </div>

        <Button
          type="submit"
          disabled={isUploading || !title.trim() || !artist.trim()}
          className={`w-full mt-4 h-12 ${
            uploadSuccess 
              ? 'bg-green-600 hover:bg-green-700' 
              : 'bg-blue-600 hover:bg-blue-700'
          } text-white disabled:opacity-50`}
        >
          {uploadSuccess ? (
            <>
              <Check className="w-4 h-4 mr-2" />
              Uploaded!
            </>
          ) : isUploading ? (
            'Uploading...'
          ) : (
            <>
              <Upload className="w-4 h-4 mr-2" />
              Upload Track
            </>
          )}
        </Button>
      </form>

      <div className="text-xs text-zinc-600 mt-3 text-center lg:text-left">
        * In production, this would upload to Supabase Storage
      </div>
    </div>
  );
}
