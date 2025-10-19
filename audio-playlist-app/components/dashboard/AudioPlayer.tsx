"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { Pause, Play, SkipBack, SkipForward, Volume2, VolumeX } from "lucide-react";
import type { Track } from "@/lib/types";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface AudioPlayerProps {
  track: Track | null;
  isPlaying: boolean;
  onPlayPause(): void;
  onNext(): void;
  onPrevious(): void;
}

export function AudioPlayer({ track, isPlaying, onPlayPause, onNext, onPrevious }: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(70);
  const [isMuted, setIsMuted] = useState(false);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (track) {
      audio.src = track.url;
      audio.load();
      setCurrentTime(0);
      setDuration(0);
    }
  }, [track]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.volume = isMuted ? 0 : volume / 100;
  }, [volume, isMuted]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    
    if (isPlaying && track) {
      void audio.play().catch((error) => {
        audio.pause();
        toast.error("Playback failed to start.");
        console.error("Audio playback error", error);
      });
    } else {
      try {
        audio.pause();
      } catch (error) {
        console.error("Audio pause error", error);
      }
    }
  }, [isPlaying, track]);

  const progress = useMemo(() => {
    if (!duration) return 0;
    return (currentTime / duration) * 100;
  }, [currentTime, duration]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
      .toString()
      .padStart(2, "0");
    const secs = Math.floor(seconds % 60)
      .toString()
      .padStart(2, "0");
    return `${mins}:${secs}`;
  };

  const handleTimeChange = (value: number[]) => {
    const next = value[0];
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = (next / 100) * (audio.duration || 0);
  };

  const toggleMute = () => {
    setIsMuted((prev: boolean) => !prev);
  };

  return (
    <footer className="fixed bottom-0 left-0 right-0 border-t border-slate-200 bg-white/95 shadow-lg backdrop-blur">
      <audio
        ref={audioRef}
        onTimeUpdate={() => setCurrentTime(audioRef.current?.currentTime ?? 0)}
        onLoadedMetadata={() => setDuration(audioRef.current?.duration ?? 0)}
        onEnded={onNext}
        hidden
      />
      <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-1 flex-col items-center gap-2 lg:max-w-2xl">
          <div className="w-full">
            <p className="truncate text-center text-sm font-semibold text-slate-900">
              {track ? (
                <>
                  {track.title}
                  {track.version && <span className="font-normal text-slate-600"> ({track.version})</span>}
                </>
              ) : (
                "No track selected"
              )}
            </p>
            <p className="truncate text-center text-xs text-slate-500">
              {track ? [track.artist, track.album].filter(Boolean).join(" • ") || "Unknown artist" : "Choose a track to begin playback"}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={onPrevious} disabled={!track}>
              <SkipBack className="h-4 w-4" />
            </Button>
            <Button
              className="h-12 w-12 rounded-full bg-primary text-primary-foreground hover:bg-primary/90"
              onClick={onPlayPause}
              disabled={!track}
            >
              {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
            </Button>
            <Button variant="ghost" size="icon" onClick={onNext} disabled={!track}>
              <SkipForward className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex w-full items-center gap-2 text-xs text-slate-500">
            <span>{formatTime(currentTime)}</span>
            <Slider value={[progress]} onValueChange={handleTimeChange} className="flex-1" disabled={!track} />
            <span>{formatTime(duration || (track?.duration ?? 0))}</span>
          </div>
        </div>

        <div className="hidden items-center gap-3 lg:flex">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={toggleMute} className={cn(isMuted && "text-blue-400")}>
              {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
            </Button>
            <Slider value={[isMuted ? 0 : volume]} onValueChange={(value) => setVolume(value[0] ?? 0)} className="w-24" disabled={!track} />
          </div>
          {track?.coverArtUrl ? (
            <Image src={track.coverArtUrl} alt={track.title} width={80} height={80} className="h-20 w-20 rounded-lg object-cover shadow-md" />
          ) : (
            <div className="flex h-20 w-20 items-center justify-center rounded-lg bg-slate-100 text-slate-500 shadow-md">
              <Play className="h-8 w-8" />
            </div>
          )}
        </div>
      </div>
    </footer>
  );
}
