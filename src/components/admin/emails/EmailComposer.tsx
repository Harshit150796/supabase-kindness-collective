import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Loader2, Search, Send, X } from 'lucide-react';
import { rpc } from '@/lib/adminApi';
import { callFn } from '@/lib/serverActions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { toast } from '@/hooks/use-toast';

/** Who an email goes to: a fundraiser's organizer, an account, or any address. */
export type Recipient =
  | { kind: 'fundraiser'; fundraiserId: string; title: string; name: string | null; email: string | null }
  | { kind: 'person'; userId: string; name: string | null; email: string }
  | { kind: 'address'; email: string };
export type ComposerStart = { to?: Recipient; subject?: string };

type FundraiserHit = { id: string; title: string; organizer_name: string | null; organizer_email: string | null };
type PersonHit = { user_id: string; email: string; full_name: string | null };
const EMAIL_RE = /^[^\s@<>"',;]+@[^\s@<>"',;]+\.[a-z]{2,}$/i;

const label = (r: Recipient) => r.kind === 'fundraiser' ? `${r.name || 'Organizer'} · ${r.title}` : r.kind === 'person' ? `${r.name || r.email}` : r.email;
const address = (r: Recipient) => (r.kind === 'address' ? r.email : r.email ?? 'no email on file');

/**
 * Admin > Emails > Write an email (founder request, Nov 15, 2026): the team writes to an organizer, any
 * account or any address from support@coupondonation.com. Written to an organizer, the message can also
 * be posted in their CouponDonation inbox, where they can answer on the site.
 */
export function EmailComposer({ open, onOpenChange, start, onSent }: { open: boolean; onOpenChange: (open: boolean) => void; start?: ComposerStart | null; onSent?: () => void }) {
  const [to, setTo] = useState<Recipient | null>(null);
  const [search, setSearch] = useState('');
  const [dq, setDq] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [inbox, setInbox] = useState(true);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => { if (open) { setTo(start?.to ?? null); setSubject(start?.subject ?? ''); setBody(''); setSearch(''); setDq(''); setErr(null); setInbox(true); } }, [open, start]);
  useEffect(() => { const t = setTimeout(() => setDq(search.trim()), 300); return () => clearTimeout(t); }, [search]);

  const hits = useQuery({
    queryKey: ['adm-compose-search', dq], enabled: open && !to && dq.length >= 2,
    queryFn: async () => {
      const [fundraisers, people] = await Promise.all([
        rpc<FundraiserHit[]>('admin_fundraiser_list', { _search: dq, _limit: 5, _offset: 0 }).catch(() => [] as FundraiserHit[]),
        rpc<PersonHit[]>('admin_list_users', { _search: dq, _role: null, _limit: 5, _offset: 0 }).catch(() => [] as PersonHit[]),
      ]);
      return { fundraisers: fundraisers ?? [], people: people ?? [] };
    },
  });
  const typedAddress = EMAIL_RE.test(search.trim()) ? search.trim().toLowerCase() : null;

  const send = async () => {
    setErr(null);
    if (!to) return setErr('Choose who to write to.');
    if (!subject.trim()) return setErr('Add a subject.');
    if (!body.trim()) return setErr('Write a message.');
    setBusy(true);
    const r = to.kind === 'fundraiser'
      ? await callFn<{ emailed: boolean; email_error?: string; message_id: string | null }>('admin-contact', { action: 'send', fundraiser_id: to.fundraiserId, subject: subject.trim(), body, post_inbox: inbox, send_email: true })
      : await callFn<{ emailed: boolean; email_error?: string; message_id?: string | null }>('admin-contact', { action: 'send', subject: subject.trim(), body, ...(to.kind === 'person' ? { user_id: to.userId } : { to_email: to.email }) });
    setBusy(false);
    if (r.error) return setErr(r.error);
    const parts = [r.data?.emailed ? `Emailed to ${address(to)}.` : null, r.data?.message_id ? 'Posted in their CouponDonation inbox.' : null, r.data?.email_error ? `Email not sent: ${r.data.email_error}` : null].filter(Boolean);
    toast({ title: r.data?.emailed ? 'Email sent' : 'Message sent', description: parts.join(' ') });
    onSent?.();
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
        <SheetHeader>
          <SheetTitle className="text-left">Write an email</SheetTitle>
          <SheetDescription className="text-left">Sent from support@coupondonation.com as the CouponDonation team. Replies arrive in the support mailbox.</SheetDescription>
        </SheetHeader>
        <div className="mt-5 space-y-4 text-sm">
          <div>
            <Label htmlFor="compose-to">To</Label>
            {to ? (
              <div className="mt-1 flex items-center justify-between gap-2 rounded-md border border-border px-3 py-2">
                <div className="min-w-0"><p className="truncate font-medium">{label(to)}</p><p className="truncate text-xs text-muted-foreground">{address(to)}</p></div>
                <Button size="sm" variant="ghost" className="h-7 px-2" onClick={() => setTo(null)} aria-label="Choose someone else"><X className="h-4 w-4" /></Button>
              </div>
            ) : (
              <>
                <div className="relative mt-1">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" aria-hidden="true" />
                  <Input id="compose-to" className="pl-8" autoComplete="off" placeholder="Fundraiser, name or email address" value={search} onChange={(e) => setSearch(e.target.value)} />
                </div>
                {dq.length >= 2 && (
                  <ul className="mt-1 max-h-64 divide-y divide-border overflow-y-auto rounded-md border border-border">
                    {hits.isLoading && <li className="px-3 py-2 text-muted-foreground">Searching…</li>}
                    {hits.data?.fundraisers.map((f) => (
                      <li key={`f-${f.id}`}><button type="button" className="w-full px-3 py-2 text-left hover:bg-muted" onClick={() => setTo({ kind: 'fundraiser', fundraiserId: f.id, title: f.title, name: f.organizer_name, email: f.organizer_email })}>
                        <span className="block truncate font-medium">{f.title}</span><span className="block truncate text-xs text-muted-foreground">Fundraiser · {f.organizer_name || 'Organizer'}{f.organizer_email ? ` · ${f.organizer_email}` : ''}</span></button></li>
                    ))}
                    {hits.data?.people.map((p) => (
                      <li key={`p-${p.user_id}`}><button type="button" className="w-full px-3 py-2 text-left hover:bg-muted" onClick={() => setTo({ kind: 'person', userId: p.user_id, name: p.full_name, email: p.email })}>
                        <span className="block truncate font-medium">{p.full_name || p.email}</span><span className="block truncate text-xs text-muted-foreground">Account · {p.email}</span></button></li>
                    ))}
                    {typedAddress && !hits.data?.people.some((p) => p.email?.toLowerCase() === typedAddress) && (
                      <li><button type="button" className="w-full px-3 py-2 text-left hover:bg-muted" onClick={() => setTo({ kind: 'address', email: typedAddress })}>
                        <span className="block truncate font-medium">{typedAddress}</span><span className="block text-xs text-muted-foreground">Send to this address</span></button></li>
                    )}
                    {hits.data && !hits.data.fundraisers.length && !hits.data.people.length && !typedAddress && <li className="px-3 py-2 text-muted-foreground">No fundraiser or account matches. Type a full email address to write to it.</li>}
                  </ul>
                )}
              </>
            )}
          </div>
          <div><Label htmlFor="compose-subject">Subject</Label>
            <Input id="compose-subject" className="mt-1" value={subject} onChange={(e) => setSubject(e.target.value)} maxLength={150} /></div>
          <div><Label htmlFor="compose-body">Message</Label>
            <Textarea id="compose-body" className="mt-1" rows={9} value={body} onChange={(e) => setBody(e.target.value)} maxLength={4000} placeholder="Write as the CouponDonation team. The email starts with “Hi {first name},” unless you write your own greeting. Plain text; never include coupon codes." /></div>
          {to?.kind === 'fundraiser' && (
            <label className="flex items-start gap-2"><Checkbox className="mt-0.5" checked={inbox} onCheckedChange={(v) => setInbox(!!v)} />Also post it in their CouponDonation inbox, so they can answer on the site</label>
          )}
          {to?.kind === 'fundraiser' && !to.email && <p className="text-muted-foreground">This organizer has no email address on file, so it can only go to their inbox.</p>}
          {err && <p className="text-destructive" role="alert">{err}</p>}
          <Button onClick={send} disabled={busy}>{busy ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <Send className="mr-1.5 h-4 w-4" aria-hidden="true" />}Send email</Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
