"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle
} from "@/components/ui/alert-dialog";

interface DuplicateModalProps {
  isOpen: boolean;
  onClose(): void;
  trackTitle: string | null;
}

export function DuplicateModal({ isOpen, onClose, trackTitle }: DuplicateModalProps) {
  return (
    <AlertDialog open={isOpen} onOpenChange={(value: boolean) => (!value ? onClose() : undefined)}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Track Already in Playlist</AlertDialogTitle>
          <AlertDialogDescription>
            &ldquo;{trackTitle ?? "This track"}&rdquo; is already part of the selected playlist.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogAction onClick={onClose}>OK</AlertDialogAction>
      </AlertDialogContent>
    </AlertDialog>
  );
}
