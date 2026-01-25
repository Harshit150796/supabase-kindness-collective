import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Clock, ShieldAlert } from 'lucide-react';

interface IdleWarningModalProps {
  open: boolean;
  remainingTime: number;
  onStayActive: () => void;
}

export function IdleWarningModal({ open, remainingTime, onStayActive }: IdleWarningModalProps) {
  const minutes = Math.floor(remainingTime / 60000);
  const seconds = Math.floor((remainingTime % 60000) / 1000);
  
  const formatTime = () => {
    if (minutes > 0) {
      return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${seconds} seconds`;
  };

  return (
    <AlertDialog open={open}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-destructive/10 rounded-full">
              <ShieldAlert className="h-6 w-6 text-destructive" />
            </div>
            <AlertDialogTitle className="text-xl">Session Timeout Warning</AlertDialogTitle>
          </div>
          <AlertDialogDescription className="space-y-4">
            <p>
              For your security, you'll be automatically logged out due to inactivity.
            </p>
            <div className="flex items-center justify-center gap-2 p-4 bg-muted rounded-lg">
              <Clock className="h-5 w-5 text-muted-foreground" />
              <span className="text-2xl font-mono font-bold text-foreground">
                {formatTime()}
              </span>
            </div>
            <p className="text-sm">
              Click the button below to continue your session.
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogAction onClick={onStayActive} className="w-full">
            Stay Logged In
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
