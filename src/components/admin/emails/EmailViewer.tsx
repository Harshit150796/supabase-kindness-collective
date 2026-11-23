import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ChevronDown, ChevronUp, Loader2, Reply, RotateCcw } from 'lucide-react';
import { callFn } from '@/lib/serverActions';
import { fmtDate } from '@/lib/adminApi';
import { topicLabel, type EmailRow } from '@/lib/emailTopics';
import { EmailStatus, PROBLEM, opensTracked } from '@/components/admin/EmailStatus';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';

const stamp = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
const short = (s: string) => stamp.format(new Date(s));

/** admin-contact "email_view": the email as it went out, with codes and one-time links already hidden. */
type Content = { html: string | null; text: string | null; reply_to: string | null; from_email: string | null; written: string | null; state: 'saved' | 'gone' | 'missing'; links: string[]; hidden: boolean };

/**
 * The email inside a frame that can't run anything, load anything but our own logo, or follow a link (so a look
 * never counts as an open or a click, and never uses a link meant for the recipient).
 */
export function emailFrameDoc(html: string) {
  const head = '<meta http-equiv="Content-Security-Policy" content="default-src \'none\'; img-src https://coupondonation.com https://www.coupondonation.com data:; style-src \'unsafe-inline\'; font-src data:">'
    + '<style>a{pointer-events:none;cursor:default}html,body{margin:0!important;height:auto!important;min-height:0!important}</style>';
  return /<head[^>]*>/i.test(html) ? html.replace(/<head[^>]*>/i, (m) => m + head) : `<!doctype html><html><head>${head}</head><body>${html}</body></html>`;
}

/** The sender as people saw it: "CouponDonation <support@…>" becomes a name and an address. */
export function splitSender(from: string | null | undefined) {
  const m = (from ?? '').match(/^\s*"?([^"<]*?)"?\s*<([^>]+)>\s*$/);
  return m ? { name: m[1].trim() || null, address: m[2].trim() } : { name: null, address: (from ?? '').trim() || null };
}

function Frame({ html }: { html: string }) {
  const ref = useRef<HTMLIFrameElement>(null);
  const [height, setHeight] = useState(320);
  const fit = () => {
    const doc = ref.current?.contentDocument;
    // The body's own height: the page's would never be smaller than the frame.
    const h = Math.max(doc?.body?.scrollHeight ?? 0, doc?.body?.offsetHeight ?? 0);
    if (h) setHeight(Math.min(Math.max(h + 8, 200), 4000));
  };
  return <iframe ref={ref} title="The email as it was sent" sandbox="allow-same-origin" srcDoc={emailFrameDoc(html)} onLoad={fit} style={{ height }} className="block w-full bg-white" />;
}

function Steps({ e }: { e: EmailRow }) {
  const bad = !!e.last_event && PROBLEM.has(e.last_event);
  const tracked = opensTracked(e);
  const steps: Array<{ label: string; at?: string | null; done: boolean; note?: string; bad?: boolean }> = bad
    ? [{ label: 'Sent', at: e.sent_at, done: true }, { label: e.last_event === 'complained' ? 'Marked as spam' : e.last_event === 'suppressed' ? 'Not sent: address bounced before' : 'Bounced', at: e.problem_at, done: true, bad: true }]
    : [
      { label: 'Sent', at: e.sent_at, done: true },
      { label: 'Delivered', at: e.delivered_at, done: !!e.delivered_at || ['delivered', 'opened', 'clicked'].includes(e.last_event ?? '') },
      e.opened_at || ['opened', 'clicked'].includes(e.last_event ?? '')
        ? { label: e.clicked_at ? 'Opened, link clicked' : 'Opened', at: e.opened_at, done: true }
        : { label: 'Opened', done: false, note: tracked ? 'Not yet' : 'Not tracked' },
    ];
  return (
    <ol className="grid grid-cols-3 gap-2" aria-label="Delivery">
      {steps.map((s) => (
        <li key={s.label} className={cn('border-t-2 pt-2', s.bad ? 'border-destructive' : s.done ? 'border-primary' : 'border-border')}>
          <p className={cn('text-sm font-medium', s.bad && 'text-destructive', !s.done && 'text-muted-foreground')}>{s.label}</p>
          <p className="text-xs text-muted-foreground">{s.done ? (s.at ? short(s.at) : 'Yes') : s.note}</p>
        </li>
      ))}
    </ol>
  );
}

/**
 * One sent email, opened from Admin > Emails or a fundraiser's Contact & emails tab (founder request,
 * Nov 23, 2026): who sent it and from which address, who got it, what happened to it, and the email itself
 * exactly as it went out (sign-in codes and one-time links hidden). J and K step through the list.
 */
export function EmailViewer({ email, onClose, onPrev, onNext, onFollowUp }: {
  email: EmailRow | null; onClose: () => void; onPrev?: (() => void) | null; onNext?: (() => void) | null; onFollowUp?: ((e: EmailRow) => void) | null;
}) {
  const [view, setView] = useState<'email' | 'text'>('email');
  useEffect(() => { setView('email'); }, [email?.id]);
  const q = useQuery({
    queryKey: ['adm-email-view', email?.id], enabled: !!email, staleTime: 5 * 60_000,
    queryFn: async () => {
      const r = await callFn<Content>('admin-contact', { action: 'email_view', id: email!.id });
      if (r.error || !r.data) throw new Error(r.error ?? 'Could not load this email.');
      return r.data;
    },
  });
  useEffect(() => {
    if (!email) return;
    const key = (ev: KeyboardEvent) => {
      const t = ev.target as HTMLElement | null;
      if (ev.metaKey || ev.ctrlKey || ev.altKey || (t && /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))) return;
      if (ev.key === 'j' && onNext) { ev.preventDefault(); onNext(); }
      if (ev.key === 'k' && onPrev) { ev.preventDefault(); onPrev(); }
    };
    window.addEventListener('keydown', key);
    return () => window.removeEventListener('keydown', key);
  }, [email, onNext, onPrev]);

  const c = q.data;
  const from = splitSender(c?.from_email ?? email?.from_email);
  const hasHtml = !!c?.html;
  const shown = view === 'text' || !hasHtml ? 'text' : 'email';

  return (
    <Sheet open={!!email} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="w-full overflow-y-auto p-0 sm:max-w-2xl">
        {email && <div className="flex min-h-full flex-col">
          <SheetHeader className="space-y-1 border-b border-border px-5 pb-4 pt-5 text-left sm:px-6">
            <div className="flex items-center gap-1 pr-8">
              <p className="mr-auto text-xs text-muted-foreground">{topicLabel(email.topic)}</p>
              {(onPrev || onNext) && <>
                <Button size="icon" variant="ghost" className="h-7 w-7" disabled={!onPrev} onClick={() => onPrev?.()} aria-label="Newer email (K)"><ChevronUp className="h-4 w-4" /></Button>
                <Button size="icon" variant="ghost" className="h-7 w-7" disabled={!onNext} onClick={() => onNext?.()} aria-label="Older email (J)"><ChevronDown className="h-4 w-4" /></Button>
              </>}
            </div>
            <SheetTitle className="break-words font-serif text-2xl font-normal leading-tight">{email.subject || '(no subject)'}</SheetTitle>
            <SheetDescription className="flex flex-wrap items-center gap-2"><EmailStatus row={email} /><span>{fmtDate(email.sent_at)}</span></SheetDescription>
          </SheetHeader>

          <div className="space-y-5 px-5 py-5 sm:px-6">
            <dl className="grid grid-cols-[5.5rem_minmax(0,1fr)] gap-x-3 gap-y-2 text-sm">
              <dt className="text-muted-foreground">From</dt>
              <dd className="break-words">{from.name && <span className="font-medium">{from.name} </span>}<span className={from.name ? 'text-muted-foreground' : ''}>{from.address ?? '—'}</span></dd>
              {c?.reply_to && c.reply_to !== from.address && <><dt className="text-muted-foreground">Replies to</dt><dd className="break-words">{c.reply_to}</dd></>}
              <dt className="text-muted-foreground">To</dt>
              <dd className="break-words">
                {email.to?.name && <span className="font-medium">{email.to.name} </span>}<span className={email.to?.name ? 'text-muted-foreground' : ''}>{email.to_email}</span>
                {email.to?.user_id && <Link to={`/admin/emails?user=${email.to.user_id}`} onClick={onClose} className="mt-0.5 block w-fit text-xs text-primary underline-offset-4 hover:underline">All emails to them</Link>}
              </dd>
              {email.sent_by?.name && <><dt className="text-muted-foreground">Written by</dt><dd>{email.sent_by.name}</dd></>}
              {email.fundraiser && <><dt className="text-muted-foreground">Fundraiser</dt><dd className="break-words"><Link className="text-primary underline-offset-4 hover:underline" to={`/admin/fundraisers?id=${email.fundraiser.id}&tab=contact`} onClick={onClose}>{email.fundraiser.title}</Link></dd></>}
            </dl>

            <Steps e={email} />

            <section aria-label="The email">
              <div className="mb-2 flex items-center justify-between gap-2">
                <h3 className="font-sans text-sm font-medium">The email</h3>
                {hasHtml && c?.text && (
                  <div className="inline-flex rounded-md bg-muted p-0.5 text-xs" role="tablist" aria-label="Show as">
                    {(['email', 'text'] as const).map((v) => (
                      <button key={v} type="button" role="tab" aria-selected={shown === v} onClick={() => setView(v)}
                        className={cn('rounded px-2.5 py-1 font-medium transition-colors', shown === v ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground')}>
                        {v === 'email' ? 'As sent' : 'Plain text'}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div className="overflow-hidden rounded-lg border border-border bg-white">
                {q.isLoading ? <p className="flex items-center gap-2 px-4 py-16 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" />Loading the email…</p>
                  : q.error ? <div className="px-4 py-10 text-center text-sm"><p className="text-destructive">{(q.error as Error).message}</p>
                    <Button size="sm" variant="outline" className="mt-3" onClick={() => q.refetch()}><RotateCcw className="mr-1.5 h-4 w-4" />Try again</Button></div>
                  : shown === 'email' && c?.html ? <Frame html={c.html} />
                  : c?.text ? <pre className="whitespace-pre-wrap break-words px-5 py-4 font-sans text-sm leading-relaxed text-[#1f2421]">{c.text}</pre>
                  : c?.written ? <pre className="whitespace-pre-wrap break-words px-5 py-4 font-sans text-sm leading-relaxed text-[#1f2421]">{c.written}</pre>
                  : <p className="px-4 py-10 text-center text-sm text-muted-foreground">{c?.state === 'gone'
                    ? 'Resend keeps an email’s text for about 30 days, and this one is older. Its sender, recipient and delivery are above.'
                    : 'The text of this email isn’t available right now. Try again in a few minutes.'}</p>}
              </div>
              {c?.hidden && <p className="mt-2 text-xs text-muted-foreground">Sign-in codes and one-time links are hidden here, so only the person it was sent to can use them.</p>}
            </section>

            {!!c?.links.length && (
              <section aria-label="Links in this email">
                <h3 className="mb-1.5 font-sans text-sm font-medium">Links in this email</h3>
                <ul className="space-y-1 text-xs">
                  {c.links.map((l) => <li key={l} className="break-all text-muted-foreground">{l}</li>)}
                </ul>
              </section>
            )}
          </div>

          {onFollowUp && (
            <div className="sticky bottom-0 mt-auto flex flex-wrap gap-2 border-t border-border bg-background px-5 py-3 sm:px-6">
              <Button size="sm" onClick={() => onFollowUp(email)}><Reply className="mr-1.5 h-4 w-4" aria-hidden="true" />Follow up</Button>
            </div>
          )}
        </div>}
      </SheetContent>
    </Sheet>
  );
}
