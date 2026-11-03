import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Copy, Loader2, Mail, Phone, Send } from 'lucide-react';
import { rpc, fmtDate } from '@/lib/adminApi';
import { callFn } from '@/lib/serverActions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { EmailStatus, type EmailRow } from '@/components/admin/EmailStatus';

type Contact = {
  organizer: {
    user_id: string; name: string | null; email: string | null; phone: string | null; city: string | null; country: string | null; username: string | null;
    joined: string | null; last_sign_in_at: string | null; email_confirmed: boolean; restrictions: string[]; fundraisers: number; suppressed: boolean;
  };
  team: Array<{ role: string; status: string; name: string | null; email: string | null }>;
  thread_id: string | null;
  messages: Array<{ id: string; body: string; created_at: string; status: string; from_team: boolean; sender: { name?: string | null } | null }>;
};

const copy = async (text: string) => {
  try { await navigator.clipboard.writeText(text); toast({ title: 'Copied', description: text }); }
  catch { toast({ title: 'Could not copy', description: text, variant: 'destructive' }); }
};

/** Who runs this fundraiser, how to reach them, and everything the team has sent them. */
export function FundraiserContactTab({ fundraiserId, title, canWrite }: { fundraiserId: string; title: string; canWrite: boolean }) {
  const c = useQuery({ queryKey: ['adm-fr-contact', fundraiserId], queryFn: () => rpc<Contact>('admin_fundraiser_contact', { _fid: fundraiserId }) });
  const emails = useQuery({ queryKey: ['adm-fr-emails', fundraiserId],
    queryFn: () => rpc<{ rows: EmailRow[]; total: number; synced_at: string | null }>('admin_email_log', { _fundraiser: fundraiserId, _category: 'not_outreach', _limit: 30, _offset: 0 }) });
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [inbox, setInbox] = useState(true);
  const [email, setEmail] = useState(true);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  if (c.isLoading) return <p className="py-6 text-sm text-muted-foreground">Loading…</p>;
  if (c.error || !c.data) return <p className="py-6 text-sm text-destructive">{c.error ? (c.error as Error).message : 'Could not load the organizer.'}</p>;
  const o = c.data.organizer;
  const place = [o.city, o.country].filter(Boolean).join(', ');

  const send = async () => {
    setErr(null);
    if (!body.trim()) return setErr('Write a message.');
    if (email && !subject.trim()) return setErr('Add a subject for the email.');
    if (!inbox && !email) return setErr('Choose their inbox, email or both.');
    setBusy(true);
    const r = await callFn<{ emailed: boolean; email_error?: string; message_id: string | null }>('admin-contact', {
      action: 'send', fundraiser_id: fundraiserId, subject: subject.trim(), body, post_inbox: inbox, send_email: email,
    });
    setBusy(false);
    if (r.error) return setErr(r.error);
    const parts = [r.data?.message_id ? 'Posted in their CouponDonation inbox.' : null, r.data?.emailed ? `Emailed to ${o.email}.` : null,
      r.data?.email_error ? `Email not sent: ${r.data.email_error}` : null].filter(Boolean);
    toast({ title: 'Message sent', description: parts.join(' ') });
    setSubject(''); setBody('');
    c.refetch(); emails.refetch();
  };

  return (
    <div className="space-y-6 py-3 text-sm">
      <section className="rounded-md bg-muted/50 p-4">
        <p className="text-xs text-muted-foreground">Created by</p>
        <p className="mt-0.5 text-base font-medium">{o.name || 'No name on the account'}{o.username && <span className="ml-2 text-sm font-normal text-muted-foreground">@{o.username}</span>}</p>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          {o.email ? <>
            <a href={`mailto:${o.email}`} className="inline-flex items-center gap-1.5 text-primary underline-offset-4 hover:underline"><Mail className="h-4 w-4" />{o.email}</a>
            <Button size="sm" variant="ghost" className="h-7 px-2" onClick={() => copy(o.email!)} aria-label="Copy email"><Copy className="h-3.5 w-3.5" /></Button>
          </> : <span className="text-muted-foreground">No email on file</span>}
          {o.phone && <>
            <a href={`tel:${o.phone.replace(/[^\d+]/g, '')}`} className="inline-flex items-center gap-1.5 text-primary underline-offset-4 hover:underline"><Phone className="h-4 w-4" />{o.phone}</a>
            <Button size="sm" variant="ghost" className="h-7 px-2" onClick={() => copy(o.phone!)} aria-label="Copy phone"><Copy className="h-3.5 w-3.5" /></Button>
          </>}
        </div>
        <dl className="mt-3 grid grid-cols-[8.5rem_minmax(0,1fr)] gap-x-3 gap-y-1 text-xs">
          <dt className="text-muted-foreground">Joined</dt><dd>{fmtDate(o.joined)}</dd>
          <dt className="text-muted-foreground">Last signed in</dt><dd>{o.last_sign_in_at ? fmtDate(o.last_sign_in_at) : 'Never'}</dd>
          <dt className="text-muted-foreground">Email confirmed</dt><dd>{o.email_confirmed ? 'Yes' : 'Not yet'}</dd>
          {place && <><dt className="text-muted-foreground">Location</dt><dd>{place}</dd></>}
          <dt className="text-muted-foreground">Fundraisers</dt><dd>{o.fundraisers}</dd>
          {o.restrictions.length > 0 && <><dt className="text-muted-foreground">Turned off</dt><dd>{o.restrictions.join(', ')}</dd></>}
        </dl>
        {o.suppressed && <p className="mt-2 text-xs text-muted-foreground">They unsubscribed from optional emails. Messages about their fundraiser still reach them.</p>}
        <div className="mt-3 flex flex-wrap gap-2">
          <Button size="sm" variant="outline" asChild><Link to={`/admin/profiles?uid=${o.user_id}`}>Profile</Link></Button>
          <Button size="sm" variant="outline" asChild><Link to={`/admin/emails?user=${o.user_id}`}>All emails to them</Link></Button>
        </div>
        {c.data.team.length > 0 && (
          <div className="mt-3 border-t border-border pt-3 text-xs">
            <p className="text-muted-foreground">Team</p>
            <ul className="mt-1 space-y-0.5">{c.data.team.map((t, i) => <li key={i} className="break-words"><span className="capitalize">{t.role}</span> · {t.name || 'Invited'}{t.email && <> · <a href={`mailto:${t.email}`} className="text-primary">{t.email}</a></>} · {t.status}</li>)}</ul>
          </div>
        )}
      </section>

      {canWrite && (
        <section className="space-y-3">
          <h3 className="font-medium">Message the organizer</h3>
          <div><Label htmlFor="contact-subject">Subject{email ? '' : ' (for email)'}</Label>
            <Input id="contact-subject" className="mt-1" value={subject} onChange={(e) => setSubject(e.target.value)} maxLength={150} placeholder={`About "${title}"`} /></div>
          <div><Label htmlFor="contact-body">Message</Label>
            <Textarea id="contact-body" className="mt-1" rows={6} value={body} onChange={(e) => setBody(e.target.value)} maxLength={4000} placeholder="Write as the CouponDonation team. The email starts with “Hi {first name},” unless you write your own greeting. Plain text; never include coupon codes." /></div>
          <div className="space-y-1.5">
            <label className="flex items-center gap-2"><Checkbox checked={inbox} onCheckedChange={(v) => setInbox(!!v)} />Post in their CouponDonation inbox, so they can reply on the site</label>
            <label className="flex items-center gap-2"><Checkbox checked={email} disabled={!o.email} onCheckedChange={(v) => setEmail(!!v)} />Email it to {o.email ?? 'them (no address on file)'} from support@coupondonation.com</label>
          </div>
          {err && <p className="text-destructive">{err}</p>}
          <Button onClick={send} disabled={busy}>{busy ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <Send className="mr-1.5 h-4 w-4" />}Send</Button>
        </section>
      )}

      <section>
        <h3 className="font-medium">Conversation with the team</h3>
        {c.data.messages.length === 0 ? <p className="mt-2 text-muted-foreground">No messages yet. What you send to their inbox shows here, with their replies.</p> : (
          <ul className="mt-2 space-y-2">{c.data.messages.map((m) => (
            <li key={m.id} className={`max-w-[90%] rounded-lg px-3 py-2 ${m.from_team ? 'ml-auto bg-primary/10' : 'bg-muted'}`}>
              <p className="text-xs text-muted-foreground">{m.from_team ? `CouponDonation team${m.sender?.name ? ` (${m.sender.name})` : ''}` : o.name || 'Organizer'} · {fmtDate(m.created_at)}{m.status === 'redacted' ? ' · contact details removed' : ''}</p>
              <p className="mt-0.5 whitespace-pre-wrap break-words">{m.body}</p>
            </li>))}
          </ul>
        )}
      </section>

      <section>
        <div className="flex items-baseline justify-between gap-2">
          <h3 className="font-medium">Emails sent to them</h3>
          {emails.data?.synced_at && <span className="text-xs text-muted-foreground">Updated {fmtDate(emails.data.synced_at)}</span>}
        </div>
        {emails.isLoading ? <p className="mt-2 text-muted-foreground">Loading…</p> : emails.error ? <p className="mt-2 text-destructive">{(emails.error as Error).message}</p>
          : !emails.data?.rows.length ? <p className="mt-2 text-muted-foreground">No emails recorded yet.</p> : (
          <ul className="mt-2 divide-y divide-border">{emails.data.rows.map((e) => (
            <li key={e.id} className="flex flex-wrap items-start justify-between gap-2 py-2">
              <div className="min-w-0">
                <p className="break-words font-medium">{e.subject || '(no subject)'}</p>
                <p className="text-xs text-muted-foreground">{fmtDate(e.sent_at)} · {e.to_email}{e.category === 'team' && e.sent_by?.name ? ` · written by ${e.sent_by.name}` : ''}</p>
                {e.body && <p className="mt-1 line-clamp-3 whitespace-pre-wrap text-xs text-foreground/80">{e.body}</p>}
              </div>
              <EmailStatus row={e} />
            </li>))}
          </ul>
        )}
        {(emails.data?.total ?? 0) > 30 && <Button size="sm" variant="link" className="px-0" asChild><Link to={`/admin/emails?fundraiser=${fundraiserId}`}>See all {emails.data!.total}</Link></Button>}
      </section>
    </div>
  );
}
