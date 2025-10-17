"use client";

import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { uploadTrackAction, type ActionResult } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { UploadCloud, ImagePlus } from "lucide-react";

const initialState: ActionResult = { success: false };

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? "Uploading..." : "Upload Track"}
    </Button>
  );
}

export function UploadPanel() {
  const formRef = useRef<HTMLFormElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const durationInputRef = useRef<HTMLInputElement>(null);
  const [selectedFileName, setSelectedFileName] = useState<string>("");
  const [selectedCoverName, setSelectedCoverName] = useState<string>("");
  const [audioDuration, setAudioDuration] = useState<number | null>(null);
  const [state, formAction] = useFormState(uploadTrackAction, initialState);

  useEffect(() => {
    if (!state) return;
    if (state.success) {
      toast.success("Track uploaded");
      formRef.current?.reset();
      setSelectedFileName("");
      setSelectedCoverName("");
      setAudioDuration(null);
    } else if (state.error) {
      toast.error(state.error);
    }
  }, [state]);

  const handleFileButtonClick = () => {
    fileInputRef.current?.click();
  };

  const handleCoverButtonClick = () => {
    coverInputRef.current?.click();
  };

  const extractAudioDuration = (file: File): Promise<number> => {
    return new Promise((resolve, reject) => {
      const audio = new Audio();
      const objectUrl = URL.createObjectURL(file);

      audio.addEventListener("loadedmetadata", () => {
        URL.revokeObjectURL(objectUrl);
        resolve(audio.duration);
      });

      audio.addEventListener("error", () => {
        URL.revokeObjectURL(objectUrl);
        reject(new Error("Failed to load audio metadata"));
      });

      audio.src = objectUrl;
    });
  };

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    setSelectedFileName(file ? file.name : "");
    
    if (file) {
      try {
        const duration = await extractAudioDuration(file);
        setAudioDuration(duration);
        // Update hidden input value
        if (durationInputRef.current) {
          durationInputRef.current.value = duration.toString();
        }
      } catch (error) {
        console.warn("Could not extract audio duration:", error);
        setAudioDuration(null);
      }
    } else {
      setAudioDuration(null);
    }
  };

  const handleCoverChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    setSelectedCoverName(file ? file.name : "");
  };

  return (
    <div className="flex h-full flex-col gap-6 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <header className="space-y-1">
        <h2 className="text-lg font-semibold text-slate-900">Upload</h2>
        <p className="text-xs text-slate-500">Audio files are stored in Supabase Storage under your account.</p>
      </header>
      <form ref={formRef} action={formAction} className="flex flex-1 flex-col gap-4">
        <div className="grid grid-cols-1 gap-3">
          <Input name="title" placeholder="Track title" required />
          <Input name="artist" placeholder="Artist" />
          <Input name="album" placeholder="Album" />
          {/* Hidden input for duration */}
          <input ref={durationInputRef} type="hidden" name="duration" value={audioDuration ?? ""} />
          <input
            ref={fileInputRef}
            id="audio-file"
            name="file"
            type="file"
            accept="audio/*"
            required
            className="sr-only"
            onChange={handleFileChange}
          />
          <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-slate-200 bg-slate-50/80 px-4 py-6 text-center">
            <Button
              type="button"
              variant="secondary"
              className="rounded-full px-5"
              onClick={handleFileButtonClick}
              aria-controls="audio-file"
            >
              <UploadCloud className="mr-2 h-4 w-4" />
              {selectedFileName ? "Change audio" : "Choose audio"}
            </Button>
            <p className="max-w-full truncate text-xs text-slate-500" title={selectedFileName || "MP3, WAV or AAC up to 20 MB"}>
              {selectedFileName || "MP3, WAV or AAC up to 20 MB"}
              {audioDuration && (
                <span className="ml-2 text-blue-600">
                  • {Math.floor(audioDuration / 60)}:{Math.floor(audioDuration % 60).toString().padStart(2, "0")}
                </span>
              )}
            </p>
          </div>
          <input
            ref={coverInputRef}
            id="cover-image"
            name="cover"
            type="file"
            accept="image/*"
            className="sr-only"
            onChange={handleCoverChange}
          />
          <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-slate-200 bg-slate-50/80 px-4 py-6 text-center">
            <Button
              type="button"
              variant="secondary"
              className="rounded-full px-5"
              onClick={handleCoverButtonClick}
              aria-controls="cover-image"
            >
              <ImagePlus className="mr-2 h-4 w-4" />
              {selectedCoverName ? "Change cover" : "Choose cover (optional)"}
            </Button>
            <p className="max-w-full truncate text-xs text-slate-500" title={selectedCoverName || "JPG, PNG or WEBP up to 5 MB"}>
              {selectedCoverName || "JPG, PNG or WEBP up to 5 MB"}
            </p>
          </div>
        </div>
        <SubmitButton />
        <p className="text-[10px] text-slate-500">For production deployments, replace mock notes with waveform analysis or tags.</p>
      </form>
    </div>
  );
}
