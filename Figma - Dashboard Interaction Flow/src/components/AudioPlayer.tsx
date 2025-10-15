import { useEffect, useRef, useState } from 'react';
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX } from 'lucide-react';
import { Track } from '../App';
import { Slider } from './ui/slider';
import { Button } from './ui/button';

interface AudioPlayerProps {
  track: Track | null;
  isPlaying: boolean;
  onPlayPause: () => void;
  onNext: () => void;
  onPrevious: () => void;
}

export function AudioPlayer({ track, isPlaying, onPlayPause, onNext, onPrevious }: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolume] = useState(70);
  const [isMuted, setIsMuted] = useState(false);

  useEffect(() => {
    if (!audioRef.current || !track) return;

    if (isPlaying) {
      audioRef.current.play().catch(err => console.error('Playback error:', err));
    } else {
      audioRef.current.pause();
    }
  }, [isPlaying, track]);

  useEffect(() => {
    if (!audioRef.current || !track) return;
    
    // Load new track
    audioRef.current.src = track.url;
    audioRef.current.load();
    
    if (isPlaying) {
      audioRef.current.play().catch(err => console.error('Playback error:', err));
    }
    
    setCurrentTime(0);
  }, [track]);

  useEffect(() => {
    if (!audioRef.current) return;
    audioRef.current.volume = isMuted ? 0 : volume / 100;
  }, [volume, isMuted]);

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleSeek = (value: number[]) => {
    if (audioRef.current && track) {
      const newTime = (value[0] / 100) * track.duration;
      audioRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!track) {
    return (
      <div className="fixed bottom-0 left-0 right-0 h-20 lg:h-24 bg-zinc-900 border-t border-zinc-800 flex items-center justify-center">
        <p className="text-zinc-600">No track selected</p>
      </div>
    );
  }

  const progress = track.duration > 0 ? (currentTime / track.duration) * 100 : 0;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-zinc-900 border-t border-zinc-800">
      <audio
        ref={audioRef}
        onTimeUpdate={handleTimeUpdate}
        onEnded={onNext}
      />

      {/* Mobile Layout */}
      <div className="lg:hidden">
        {/* Progress Bar - Top */}
        <div className="px-4 pt-2">
          <Slider
            value={[progress]}
            onValueChange={handleSeek}
            max={100}
            step={0.1}
            className="w-full"
          />
        </div>

        {/* Player Controls */}
        <div className="px-4 pb-3 pt-1">
          <div className="flex items-center justify-between gap-3">
            {/* Track Info */}
            <div className="flex items-center gap-3 flex-1 min-w-0">
              {track.coverArt ? (
                <img 
                  src={track.coverArt} 
                  alt={track.title}
                  className="w-12 h-12 rounded object-cover flex-shrink-0"
                />
              ) : (
                <div className="w-12 h-12 rounded bg-zinc-800 flex-shrink-0" />
              )}
              <div className="min-w-0 flex-1">
                <div className="text-white text-sm truncate">{track.title}</div>
                <div className="text-zinc-400 text-xs truncate">{track.artist}</div>
              </div>
            </div>

            {/* Playback Controls */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <Button
                size="sm"
                variant="ghost"
                onClick={onPrevious}
                className="text-zinc-400 hover:text-white hover:bg-zinc-800 h-10 w-10 p-0"
              >
                <SkipBack className="w-5 h-5" />
              </Button>

              <Button
                size="sm"
                onClick={onPlayPause}
                className="bg-white hover:bg-zinc-200 text-black rounded-full h-12 w-12 p-0"
              >
                {isPlaying ? (
                  <Pause className="w-5 h-5 fill-black" />
                ) : (
                  <Play className="w-5 h-5 fill-black ml-0.5" />
                )}
              </Button>

              <Button
                size="sm"
                variant="ghost"
                onClick={onNext}
                className="text-zinc-400 hover:text-white hover:bg-zinc-800 h-10 w-10 p-0"
              >
                <SkipForward className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Desktop Layout */}
      <div className="hidden lg:flex h-24 px-6 items-center gap-6">
        {/* Track Info */}
        <div className="flex items-center gap-4 w-64 flex-shrink-0">
          {track.coverArt ? (
            <img 
              src={track.coverArt} 
              alt={track.title}
              className="w-14 h-14 rounded object-cover"
            />
          ) : (
            <div className="w-14 h-14 rounded bg-zinc-800" />
          )}
          <div className="min-w-0 flex-1">
            <div className="text-white text-sm truncate">{track.title}</div>
            <div className="text-zinc-400 text-xs truncate">{track.artist}</div>
          </div>
        </div>

        {/* Playback Controls */}
        <div className="flex-1 flex flex-col items-center gap-2">
          <div className="flex items-center gap-4">
            <Button
              size="sm"
              variant="ghost"
              onClick={onPrevious}
              className="text-zinc-400 hover:text-white hover:bg-zinc-800"
            >
              <SkipBack className="w-5 h-5" />
            </Button>

            <Button
              size="sm"
              onClick={onPlayPause}
              className="bg-white hover:bg-zinc-200 text-black rounded-full w-10 h-10 p-0"
            >
              {isPlaying ? (
                <Pause className="w-5 h-5 fill-black" />
              ) : (
                <Play className="w-5 h-5 fill-black ml-0.5" />
              )}
            </Button>

            <Button
              size="sm"
              variant="ghost"
              onClick={onNext}
              className="text-zinc-400 hover:text-white hover:bg-zinc-800"
            >
              <SkipForward className="w-5 h-5" />
            </Button>
          </div>

          {/* Progress Bar */}
          <div className="w-full max-w-2xl flex items-center gap-2">
            <span className="text-xs text-zinc-500 w-10 text-right">
              {formatTime(currentTime)}
            </span>
            <Slider
              value={[progress]}
              onValueChange={handleSeek}
              max={100}
              step={0.1}
              className="flex-1"
            />
            <span className="text-xs text-zinc-500 w-10">
              {formatTime(track.duration)}
            </span>
          </div>
        </div>

        {/* Volume Control */}
        <div className="flex items-center gap-2 w-32 flex-shrink-0">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setIsMuted(!isMuted)}
            className="text-zinc-400 hover:text-white hover:bg-zinc-800"
          >
            {isMuted || volume === 0 ? (
              <VolumeX className="w-5 h-5" />
            ) : (
              <Volume2 className="w-5 h-5" />
            )}
          </Button>
          <Slider
            value={[isMuted ? 0 : volume]}
            onValueChange={(value) => {
              setVolume(value[0]);
              setIsMuted(false);
            }}
            max={100}
            step={1}
            className="flex-1"
          />
        </div>
      </div>
    </div>
  );
}
