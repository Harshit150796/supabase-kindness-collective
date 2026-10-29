import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/hooks/use-toast';
import { getFollowList, profileAction, REPORT_REASONS, type PersonRow } from '@/lib/profiles';
import { PersonRowView } from './ProfileBits';

const PAGE = 30;

export function FollowListDialog({ username, which, open, onOpenChange, signedIn }: {
  username: string; which: 'followers' | 'following'; open: boolean; onOpenChange: (o: boolean) => void; signedIn: boolean;
}) {
  const [rows, setRows] = useState<PersonRow[] | null>(null);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const load = async (offset: number) => {
    setLoading(true);
    try {
      const r = await getFollowList(username, which, offset, PAGE);
      setRows((prev) => (offset ? [...(prev ?? []), ...r.rows] : r.rows));
      setTotal(r.total);
    } catch {
      toast({ title: 'Could not load the list. Please try again.', variant: 'destructive' });
    } finally { setLoading(false); }
  };
  useEffect(() => { if (open) { setRows(null); load(0); } }, [open, username, which]); // eslint-disable-line react-hooks/exhaustive-deps
  const title = which === 'followers' ? 'Followers' : 'Following';
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85dvh] max-w-md overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display text-3xl font-normal">{title}</DialogTitle>
          <DialogDescription className="sr-only">{title} of @{username}</DialogDescription>
        </DialogHeader>
        {rows === null
          ? <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" aria-hidden="true" /></div>
          : rows.length === 0
            ? <p className="py-6 text-muted-foreground">{which === 'followers' ? 'No followers yet.' : 'Not following anyone yet.'}</p>
            : <ul className="divide-y divide-border">{rows.map((p, i) => <PersonRowView key={`${p.username ?? 'p'}-${i}`} person={p} signedIn={signedIn} />)}</ul>}
        {rows && rows.length < total && (
          <Button variant="outline" className="min-h-11 w-full" disabled={loading} onClick={() => load(rows.length)}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />}Show more
          </Button>
        )}
      </DialogContent>
    </Dialog>
  );
}

export function ReportProfileDialog({ username, open, onOpenChange }: { username: string; open: boolean; onOpenChange: (o: boolean) => void }) {
  const [reason, setReason] = useState('');
  const [details, setDetails] = useState('');
  const [busy, setBusy] = useState(false);
  const send = async () => {
    setBusy(true);
    const { error } = await profileAction('report', { username, reason, details });
    setBusy(false);
    if (error) { toast({ title: error, variant: 'destructive' }); return; }
    toast({ title: 'Thanks. Our safety team will review this profile.' });
    setReason(''); setDetails(''); onOpenChange(false);
  };
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-3xl font-normal">Report @{username}</DialogTitle>
          <DialogDescription>Reports are private. This person isn’t told who reported them.</DialogDescription>
        </DialogHeader>
        <RadioGroup value={reason} onValueChange={setReason} className="gap-1">
          {REPORT_REASONS.map((r) => (
            <Label key={r} className="flex min-h-11 cursor-pointer items-center gap-3 rounded-md px-2 font-normal hover:bg-secondary">
              <RadioGroupItem value={r} />{r}
            </Label>
          ))}
        </RadioGroup>
        <div className="space-y-1.5">
          <Label htmlFor="report-details">What happened? (optional)</Label>
          <Textarea id="report-details" value={details} maxLength={2000} onChange={(e) => setDetails(e.target.value)} rows={3} />
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" className="min-h-11" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button className="min-h-11" onClick={send} disabled={!reason || busy}>{busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />}Send report</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
