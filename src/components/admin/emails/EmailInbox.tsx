import { useState } from 'react';
import { Link } from 'react-router-dom';
import { keepPreviousData, useQuery, useQueryClient } from '@tanstack/react-query';
import { Check, Copy, Reply, RotateCcw } from 'lucide-react';
import { callFn } from '@/lib/serverActions';
import { fmtDate } from '@/lib/adminApi';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from '@/hooks/use-toast';
import type { ComposerStart } from '@/components/admin/emails/EmailComposer';

export type InboxMessage = {
  id: string; from_email: string; from_name: string | null; to_email: string | null; subject: string | null; body: string | null;
  received_at: string; from_user_id: string | null; account_name: string | null; status: 'open' | 'answered' | 'done'; handled_at: string | null;
};
type Inbox = { rows: InboxMessage[]; total: number; open: number; address: string };
const PAGE = 25;
const STATUS_LABEL = { open: 'Needs an answer', answered: 'Answered', done: 'Done' } as const;

export const inboxKey = ['adm-email-inbox'] as const;
export async function loadInbox(status: string | null, page: number): Promise<Inbox> {
  const r = await callFn<Inbox>('admin-contact', { action: 'inbox', status, limit: PAGE, offset: page * PAGE });
  if (r.error || !r.data) throw new Error(r.error ?? 'Could not load the inbox.');
  return r.data;
}

/** Who a reply to this message goes to: their account when they have one, otherwise the address. */
export function replyTo(m: InboxMessage): ComposerStart {
  const subject = m.subject ? (/^re:/i.test(m.subject) ? m.subject : `Re: ${m.subject}`).slice(0, 150) : '';
  return { subject, inboxId: m.id, to: m.from_user_id ? { kind: 'person', userId: m.from_user_id, name: m.account_name ?? m.from_name, email: m.from_email } : { kind: 'address', email: m.from_email } };
}

/**
 * Admin > Emails > Inbox (founder request, Nov 16, 2026): email people sent to the team, copied every five
 * minutes from the address the support mailbox forwards to. Read it, answer it from support@, mark it done.
 * The text is shown as plain text only.
 */
export function EmailInbox({ canWrite, onReply }: { canWrite: boolean; onReply: (start: ComposerStart) => void }) {
  const qc = useQueryClient();
  const [status, setStatus] = useState<'open' | 'answered' | 'done' | 'all'>('open');
  const [page, setPage] = useState(0);
  const [open, setOpen] = useState<InboxMessage | null>(null);
  const q = useQuery({ queryKey: [...inboxKey, status, page], queryFn: () => loadInbox(status === 'all' ? null : status, page), placeholderData: keepPreviousData, refetchInterval: 60_000 });

  const mark = async (m: InboxMessage, next: InboxMessage['status']) => {
    const r = await callFn('admin-contact', { action: 'inbox_set', id: m.id, status: next });
    if (r.error) return toast({ title: 'Could not save', description: r.error, variant: 'destructive' });
    setOpen(null);
    qc.invalidateQueries({ queryKey: inboxKey });
  };
  const copy = async (text: string) => { try { await navigator.clipboard.writeText(text); toast({ title: 'Copied', description: text }); } catch { toast({ title: 'Could not copy', description: text, variant: 'destructive' }); } };

  const rows = q.data?.rows ?? [];
  const pages = Math.ceil((q.data?.total ?? 0) / PAGE);
  return (
    <div className="max-w-4xl">
      <Tabs value={status} onValueChange={(v) => { setStatus(v as typeof status); setPage(0); }} className="mb-3">
        <TabsList>
          <TabsTrigger value="open">Needs an answer{q.data ? ` (${q.data.open})` : ''}</TabsTrigger>
          <TabsTrigger value="answered">Answered</TabsTrigger><TabsTrigger value="done">Done</TabsTrigger><TabsTrigger value="all">All</TabsTrigger>
        </TabsList>
      </Tabs>
      {q.error ? <p className="text-sm text-destructive">{(q.error as Error).message}</p>
        : q.isLoading ? <p className="py-6 text-sm text-muted-foreground">Loading…</p>
        : rows.length === 0 ? (
          <div className="rounded-md border border-border p-5 text-sm">
            <p className="font-medium">{status === 'open' ? 'Nothing is waiting for an answer.' : 'No messages here.'}</p>
            {q.data?.address && <>
              <p className="mt-2 text-muted-foreground">Replies show up here when the support mailbox (support@coupondonation.com in Zoho Mail) forwards a copy of its incoming mail to this address. If nothing has ever shown up here, that forwarding isn't set up yet. Set it up once in the mailbox's forwarding settings:</p>
              <p className="mt-2 flex flex-wrap items-center gap-2"><code className="rounded bg-muted px-2 py-1">{q.data.address}</code>
                <Button size="sm" variant="ghost" className="h-7 px-2" onClick={() => copy(q.data!.address)} aria-label="Copy the address"><Copy className="h-3.5 w-3.5" /></Button></p>
            </>}
          </div>
        ) : (
          <ul className="divide-y divide-border rounded-md border border-border">
            {rows.map((m) => (
              <li key={m.id}>
                <button type="button" className="flex w-full flex-wrap items-baseline gap-x-4 gap-y-1 px-4 py-3 text-left hover:bg-muted/60" onClick={() => setOpen(m)}>
                  <span className="min-w-0 flex-1 basis-56">
                    <span className="block truncate font-medium">{m.account_name || m.from_name || m.from_email}</span>
                    <span className="block truncate text-sm">{m.subject || '(no subject)'}</span>
                    <span className="block truncate text-xs text-muted-foreground">{(m.body ?? '').replace(/\s+/g, ' ').slice(0, 140)}</span>
                  </span>
                  <span className="whitespace-nowrap text-xs text-muted-foreground">{fmtDate(m.received_at)}{status === 'all' ? ` · ${STATUS_LABEL[m.status]}` : ''}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      {pages > 1 && (
        <div className="mt-3 flex items-center gap-2 text-sm">
          <Button size="sm" variant="outline" disabled={page === 0} onClick={() => setPage(page - 1)}>Newer</Button>
          <span className="text-muted-foreground">Page {page + 1} of {pages}</span>
          <Button size="sm" variant="outline" disabled={page + 1 >= pages} onClick={() => setPage(page + 1)}>Older</Button>
        </div>
      )}
      {rows.length > 0 && q.data?.address && <p className="mt-3 text-xs text-muted-foreground">Copied every 5 minutes from mail forwarded to {q.data.address}. Answers go out from support@coupondonation.com.</p>}

      <Sheet open={!!open} onOpenChange={(o) => !o && setOpen(null)}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
          {open && <>
            <SheetHeader><SheetTitle className="break-words text-left">{open.subject || '(no subject)'}</SheetTitle><SheetDescription className="text-left">{STATUS_LABEL[open.status]}</SheetDescription></SheetHeader>
            <dl className="mt-4 grid grid-cols-[5rem_minmax(0,1fr)] gap-2 text-sm">
              <dt className="text-muted-foreground">From</dt><dd className="break-words">{open.account_name || open.from_name ? `${open.account_name || open.from_name} · ` : ''}{open.from_email}</dd>
              {open.to_email && <><dt className="text-muted-foreground">To</dt><dd className="break-words">{open.to_email}</dd></>}
              <dt className="text-muted-foreground">Received</dt><dd>{fmtDate(open.received_at)}</dd>
            </dl>
            <p className="mt-4 whitespace-pre-wrap break-words rounded-md bg-muted/50 p-3 text-sm">{open.body || 'This message has no text.'}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {canWrite && <Button size="sm" onClick={() => { onReply(replyTo(open)); setOpen(null); }}><Reply className="mr-1.5 h-4 w-4" aria-hidden="true" />Reply</Button>}
              {canWrite && open.status !== 'done' && <Button size="sm" variant="outline" onClick={() => mark(open, 'done')}><Check className="mr-1.5 h-4 w-4" aria-hidden="true" />Mark done</Button>}
              {canWrite && open.status !== 'open' && <Button size="sm" variant="outline" onClick={() => mark(open, 'open')}><RotateCcw className="mr-1.5 h-4 w-4" aria-hidden="true" />Needs an answer again</Button>}
              {open.from_user_id && <Button size="sm" variant="outline" asChild><Link to={`/admin/emails?user=${open.from_user_id}`}>Emails we sent them</Link></Button>}
            </div>
          </>}
        </SheetContent>
      </Sheet>
    </div>
  );
}
