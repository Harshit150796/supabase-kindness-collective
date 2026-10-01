import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { callFn, signInPath } from '@/lib/serverActions';

export interface TeamMember { display_name: string | null; role: string; city: string | null; country: string | null }

export function useFundraiserTeam(fid: string | undefined) {
  const [team, setTeam] = useState<TeamMember[]>([]);
  useEffect(() => {
    if (!fid) return;
    (async () => {
      const { data } = await supabase.rpc('get_fundraiser_team_public' as never, { _fundraiser_id: fid } as never);
      let rows = (data as unknown as TeamMember[]) ?? [];
      if (!rows.length) {
        const { data: o } = await supabase.rpc('get_fundraiser_organizer' as never, { _fundraiser_id: fid } as never);
        const r = (o as unknown as Array<{ display_name: string | null; city: string | null; country: string | null }>)?.[0];
        if (r) rows = [{ ...r, role: 'organizer' }];
      }
      setTeam(rows);
    })();
  }, [fid]);
  return team;
}

export function MessageDialog({ open, onOpenChange, fundraiserId, organizerName }: { open: boolean; onOpenChange: (o: boolean) => void; fundraiserId: string; organizerName: string }) {
  const { toast } = useToast(); const navigate = useNavigate();
  const [body, setBody] = useState(''); const [busy, setBusy] = useState(false); const [err, setErr] = useState<string | null>(null);
  const send = async () => {
    setBusy(true); setErr(null);
    const r = await callFn<{ message: { conversation_id: string }; redacted: boolean }>('send-message', { fundraiser_id: fundraiserId, body });
    setBusy(false);
    if (r.error) { setErr(r.error); return; }
    toast({ title: 'Message sent', description: r.data?.redacted ? 'Contact details were removed for safety.' : 'You can follow the conversation in Messages.' });
    setBody(''); onOpenChange(false);
    navigate(`/messages?c=${r.data!.message.conversation_id}`);
  };
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="font-display text-3xl font-normal">Message {organizerName}</DialogTitle>
          <DialogDescription>Messages are delivered through CouponDonation. Your email and phone are never shared. All support must go through CouponDonation — never send money, codes or gift cards directly.</DialogDescription>
        </DialogHeader>
        <Textarea value={body} onChange={(e) => setBody(e.target.value)} maxLength={2000} rows={5} placeholder="Write a message" />
        {err && <p className="rounded-xl bg-destructive/10 p-3 text-sm text-destructive">{err}</p>}
        <Button onClick={send} disabled={busy || !body.trim()}>Send message</Button>
      </DialogContent>
    </Dialog>
  );
}

export function TeamSection({ team, fundraiserId, allowMessages, isTeam, beneficiary, slug }: { team: TeamMember[]; fundraiserId: string; allowMessages: boolean; isTeam: boolean; beneficiary: string | null; slug: string }) {
  const { user } = useAuth(); const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const organizer = team.find((t) => t.role === 'organizer') ?? team[0];
  const place = (m: TeamMember) => [m.city, m.country].filter(Boolean).join(', ');
  return (
    <section>
      <h2 className="font-display text-4xl font-normal text-foreground">Organizer{beneficiary ? ' and beneficiary' : ''}</h2>
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {team.map((m, i) => (
          <div key={i} className="rounded-[1.25rem] bg-secondary/60 p-5">
            <div className="flex items-center gap-3">
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-ink text-lg text-ink-foreground">{(m.display_name ?? 'O')[0].toUpperCase()}</span>
              <div className="min-w-0">
                <p className="truncate font-medium text-foreground">{m.display_name ?? 'Organizer'}</p>
                <p className="text-sm text-muted-foreground">{m.role === 'organizer' ? 'Organizer' : 'Co-organizer'}</p>
              </div>
            </div>
            {place(m) && <p className="mt-3 flex items-center gap-1.5 text-sm text-muted-foreground"><MapPin className="h-4 w-4" />{place(m)}</p>}
            {m === organizer && allowMessages && !isTeam && (
              <Button variant="outline" className="mt-4 w-full" onClick={() => (user ? setOpen(true) : navigate(signInPath(`/f/${slug}`)))}>
                <MessageCircle className="mr-2 h-4 w-4" />Message
              </Button>
            )}
          </div>
        ))}
        {beneficiary && (
          <div className="rounded-[1.25rem] bg-secondary/60 p-5">
            <div className="flex items-center gap-3">
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-lg text-primary-foreground">{beneficiary[0].toUpperCase()}</span>
              <div><p className="font-medium text-foreground">{beneficiary}</p><p className="text-sm text-muted-foreground">Beneficiary</p></div>
            </div>
          </div>
        )}
      </div>
      <MessageDialog open={open} onOpenChange={setOpen} fundraiserId={fundraiserId} organizerName={organizer?.display_name ?? 'the organizer'} />
    </section>
  );
}
