import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

/** Every removal and restriction asks for a reason; it goes into the audit log with the action. */
export function ReasonDialog({ open, title, description, confirm, destructive = true, onCancel, onConfirm }: {
  open: boolean; title: string; description: string; confirm: string; destructive?: boolean;
  onCancel: () => void; onConfirm: (reason: string) => Promise<void>;
}) {
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  useEffect(() => { if (open) setReason(''); }, [open]);
  const go = async () => { setBusy(true); try { await onConfirm(reason.trim()); } finally { setBusy(false); } };
  return (
    <Dialog open={open} onOpenChange={(o) => !o && !busy && onCancel()}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>{title}</DialogTitle><DialogDescription>{description}</DialogDescription></DialogHeader>
        <div className="space-y-1.5">
          <Label htmlFor="admin-reason">Reason (kept in the audit log)</Label>
          <Textarea id="admin-reason" value={reason} onChange={(e) => setReason(e.target.value)} maxLength={500} rows={3} />
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onCancel} disabled={busy}>Cancel</Button>
          <Button variant={destructive ? 'destructive' : 'default'} onClick={go} disabled={busy || reason.trim().length < 3}>{busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}{confirm}</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
