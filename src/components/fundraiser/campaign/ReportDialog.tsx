import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { signInPath } from '@/lib/serverActions';

const REASONS = ['Asking for payment outside CouponDonation', 'Scam or fraud', 'Harassment or hate', 'Inappropriate content', 'Misleading information', 'Other'];

export function ReportDialog({ open, onOpenChange, targetType, targetId, fundraiserId }: {
  open: boolean; onOpenChange: (o: boolean) => void; targetType: 'fundraiser' | 'comment' | 'message' | 'update'; targetId: string; fundraiserId?: string;
}) {
  const { user } = useAuth(); const navigate = useNavigate(); const { toast } = useToast();
  const [reason, setReason] = useState(REASONS[0]); const [details, setDetails] = useState(''); const [busy, setBusy] = useState(false);
  const submit = async () => {
    if (!user) { navigate(signInPath(window.location.pathname)); return; }
    setBusy(true);
    const { error } = await supabase.from('content_reports').insert({ reporter_id: user.id, target_type: targetType, target_id: targetId, fundraiser_id: fundraiserId ?? null, reason, details: details.slice(0, 1000) || null, status: 'open' });
    setBusy(false);
    if (error) { toast({ title: 'Could not send report', variant: 'destructive' }); return; }
    toast({ title: 'Report sent', description: 'Our team reviews every report.' });
    onOpenChange(false); setDetails('');
  };
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="font-display text-3xl font-normal">Report this {targetType}</DialogTitle>
          <DialogDescription>Reports are private. The organizer is not told who reported.</DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          {REASONS.map((r) => (
            <label key={r} className="flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2 hover:bg-secondary">
              <input type="radio" name="reason" checked={reason === r} onChange={() => setReason(r)} className="accent-[hsl(var(--primary))]" />
              <span className="text-sm">{r}</span>
            </label>
          ))}
        </div>
        <Textarea placeholder="Anything else we should know (optional)" value={details} onChange={(e) => setDetails(e.target.value)} maxLength={1000} />
        <Button onClick={submit} disabled={busy}>{user ? 'Send report' : 'Sign in to report'}</Button>
      </DialogContent>
    </Dialog>
  );
}
