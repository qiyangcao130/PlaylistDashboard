import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from './ui/alert-dialog';

interface DuplicateModalProps {
  isOpen: boolean;
  onClose: () => void;
  trackTitle: string;
}

export function DuplicateModal({ isOpen, onClose, trackTitle }: DuplicateModalProps) {
  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent className="bg-zinc-900 border-zinc-800 text-white">
        <AlertDialogHeader>
          <AlertDialogTitle>Track Already in Playlist</AlertDialogTitle>
          <AlertDialogDescription className="text-zinc-400">
            "{trackTitle}" is already in this playlist. Each track can only be added once.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogAction 
            onClick={onClose}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            OK
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
