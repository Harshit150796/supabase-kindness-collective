import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { useNewContactCount } from '@/hooks/useNewContactCount';
import { Archive, Check, Copy, Mail, RotateCcw, Search } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader, useTeamRole } from '@/components/admin/AdminLayout';
import { DataTable, StatusBadge, type Column } from '@/components/admin/DataTable';
import { useAdminPaged } from '@/hooks/useAdminPaged';
import { rpc, sb } from '@/lib/adminApi';
import { contactTopicLabel } from '@/lib/contactForm';
import { usRegionName } from '@/data/usStates';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

type ContactMessage = {
  id: string; created_at: string; name: string; email: string; phone: string | null; state: string; topic: string;
  message: string; page: string | null; user_id: string | null; status: 'new' | 'read' | 'replied' | 'archived';
  handled_at: string | null; support_email_status: string; confirmation_email_status: string;
};
type Filter = 'new' | 'read' | 'replied' | 'archived' | 'all';

const FILTERS: { value: Filter; label: string }[] = [
  { value: 'all', label: 'All' }, { value: 'new', label: 'New' }, { value: 'read', label: 'Read' },
  { value: 'replied', label: 'Replied' }, { value: 'archived', label: 'Archived' },
];
const WHEN = new Intl.DateTimeFormat('en-US', { dateStyle: 'medium', timeStyle: 'short' });
const SHORT = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
const EMAIL_STATUS: Record<string, string> = { sent: 'Sent', failed: 'Failed to send', skipped: 'Email not configured', pending: 'Not sent yet' };

const phoneLabel = (e164: string | null) => {
  const d = (e164 ?? '').replace(/^\+1/, '');
  return d.length === 10 ? `+1 (${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}` : null;
};

// Mail apps cut long mailto links, so the reply quotes the start of the message only.
const quote = (text: string) => (text.length > 600 ? `${text.slice(0, 600).trimEnd()}…` : text);

export default function AdminContactMessages() {
  const qc = useQueryClient();
  const { canWrite } = useTeamRole();
  const [params, setParams] = useSearchParams();
  const [filter, setFilter] = useState<Filter>('all');
  const [open, setOpen] = useState<ContactMessage | null>(null);
  const [busy, setBusy] = useState(false);
  const newCount = useNewContactCount();
  const t = useAdminPaged<ContactMessage>({
    table: 'contact_messages', searchCols: ['name', 'email', 'message'], defaultSort: { key: 'created_at', dir: 'desc' },
    filter: (b) => (filter === 'all' ? b : b.eq('status', filter)), deps: [filter],
  });

  const refresh = () => {
    qc.invalidateQueries({ queryKey: ['adm-paged', 'contact_messages'] });
    qc.invalidateQueries({ queryKey: ['adm-contact-new'] });
  };

  const setStatus = async (message: ContactMessage, status: ContactMessage['status'], quiet = false) => {
    if (!canWrite || message.status === status) return;
    setBusy(true);
    try {
      await rpc('admin_set_contact_message_status', { _id: message.id, _status: status });
      setOpen((current) => (current?.id === message.id ? { ...current, status } : current));
      if (!quiet) toast({ title: status === 'replied' ? 'Marked as replied' : status === 'archived' ? 'Archived' : status === 'new' ? 'Marked as new' : 'Marked as read' });
      refresh();
    } catch (e) {
      toast({ title: 'Could not update the message', description: (e as Error).message, variant: 'destructive' });
    } finally {
      setBusy(false);
    }
  };

  const show = (message: ContactMessage) => {
    setOpen(message);
    if (message.status === 'new') void setStatus(message, 'read', true);
  };

  // Links in the support email open the message directly (?id=…).
  const linked = params.get('id');
  useEffect(() => {
    if (!linked) return;
    let cancelled = false;
    sb.from('contact_messages').select('*').eq('id', linked).maybeSingle().then(({ data }: { data: ContactMessage | null }) => {
      if (!cancelled && data) show(data);
    });
    return () => { cancelled = true; };
  }, [linked]); // eslint-disable-line react-hooks/exhaustive-deps

  const close = () => {
    setOpen(null);
    if (linked) { params.delete('id'); setParams(params, { replace: true }); }
  };

  const copyEmail = async (email: string) => {
    try { await navigator.clipboard.writeText(email); toast({ title: 'Email address copied' }); } catch { toast({ title: email }); }
  };

  const cols: Column<ContactMessage>[] = [
    { key: 'name', header: 'From', sortable: true, cell: (r) => <div className="min-w-0"><p className={cn('truncate', r.status === 'new' ? 'font-semibold text-foreground' : 'font-medium')}>{r.name}</p><p className="truncate text-xs text-muted-foreground">{r.email}</p></div> },
    { key: 'topic', header: 'About', sortable: true, cell: (r) => <span className="whitespace-nowrap text-sm">{contactTopicLabel(r.topic)}</span> },
    { key: 'state', header: 'State', sortable: true, cell: (r) => <span title={usRegionName(r.state)} className="text-sm">{r.state}</span> },
    { key: 'message', header: 'Message', cell: (r) => <p className="line-clamp-2 max-w-md text-sm text-muted-foreground">{r.message}</p> },
    { key: 'status', header: 'Status', sortable: true, cell: (r) => <StatusBadge value={r.status} /> },
    { key: 'created_at', header: 'Received', sortable: true, cell: (r) => <span className="whitespace-nowrap text-xs">{SHORT.format(new Date(r.created_at))}</span> },
  ];

  const replyHref = (m: ContactMessage) =>
    `mailto:${encodeURIComponent(m.email)}?subject=${encodeURIComponent('Re: Your message to CouponDonation')}&body=${encodeURIComponent(`Hi ${m.name.split(' ')[0]},\n\n\n\n—\nCouponDonation support\nsupport@coupondonation.com\n\nOn ${WHEN.format(new Date(m.created_at))} you wrote:\n> ${quote(m.message).replace(/\n/g, '\n> ')}`)}`;

  return (
    <DashboardLayout>
      <PageHeader title="Contact messages" description="Sent from the contact form at the end of every public page. Each one is also emailed to support@coupondonation.com." />
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <div className="relative w-full max-w-sm"><Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" aria-hidden="true" /><Input className="h-9 pl-8" placeholder="Search name, email or message" value={t.search} onChange={(e) => t.setSearch(e.target.value)} aria-label="Search messages" /></div>
        <div role="group" aria-label="Filter by status" className="flex flex-wrap gap-1 rounded-md bg-muted p-1">
          {FILTERS.map((f) => (
            <button key={f.value} type="button" aria-pressed={filter === f.value} onClick={() => setFilter(f.value)}
              className={cn('inline-flex h-7 items-center gap-1.5 rounded px-2.5 text-xs font-medium transition-colors', filter === f.value ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground')}>
              {f.label}{f.value === 'new' && !!newCount.data && <span className="tabular-nums text-primary">{newCount.data}</span>}
            </button>
          ))}
        </div>
      </div>
      <DataTable columns={cols} {...t.tableProps} rowKey={(r) => r.id} onRowClick={show}
        rowClassName={(r) => (r.status === 'new' ? 'bg-primary/[0.035]' : undefined)}
        empty={filter === 'new' ? 'No new messages. Everything has been read.' : filter === 'all' && !t.search ? 'No messages yet. Messages sent from the contact form at the end of the website will appear here.' : 'No messages match.'} />

      <Sheet open={!!open} onOpenChange={(o) => !o && close()}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
          {open && <div className="space-y-6">
            <SheetHeader className="space-y-1 text-left">
              <SheetTitle className="font-serif text-2xl font-normal">{open.name}</SheetTitle>
              <SheetDescription>{contactTopicLabel(open.topic)} · {WHEN.format(new Date(open.created_at))}</SheetDescription>
            </SheetHeader>
            <div className="flex items-center gap-2"><StatusBadge value={open.status} />{open.handled_at && open.status !== 'new' && <span className="text-xs text-muted-foreground">Updated {SHORT.format(new Date(open.handled_at))}</span>}</div>

            <dl className="grid grid-cols-[6.5rem_minmax(0,1fr)] gap-x-3 gap-y-2.5 text-sm">
              <dt className="text-muted-foreground">Email</dt>
              <dd className="flex min-w-0 items-center gap-1.5"><a href={`mailto:${open.email}`} className="truncate text-primary underline-offset-4 hover:underline">{open.email}</a>
                <button type="button" onClick={() => copyEmail(open.email)} className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground" aria-label="Copy email address"><Copy className="h-3.5 w-3.5" /></button></dd>
              <dt className="text-muted-foreground">Phone</dt>
              <dd>{phoneLabel(open.phone) ? <a href={`tel:${open.phone}`} className="text-primary underline-offset-4 hover:underline">{phoneLabel(open.phone)}</a> : <span className="text-muted-foreground">Not given</span>}</dd>
              <dt className="text-muted-foreground">State</dt><dd>{usRegionName(open.state)} ({open.state})</dd>
              <dt className="text-muted-foreground">Sent from</dt><dd className="truncate">{open.page ?? '—'}</dd>
              <dt className="text-muted-foreground">Account</dt><dd>{open.user_id ? 'Signed in' : 'Not signed in'}</dd>
              <dt className="text-muted-foreground">Support inbox</dt><dd>{EMAIL_STATUS[open.support_email_status] ?? open.support_email_status}</dd>
              <dt className="text-muted-foreground">Confirmation</dt><dd>{EMAIL_STATUS[open.confirmation_email_status] ?? open.confirmation_email_status}</dd>
            </dl>

            <div className="rounded-md bg-muted/60 p-4">
              <p className="whitespace-pre-wrap break-words text-[15px] leading-relaxed text-foreground">{open.message}</p>
            </div>

            <div className="space-y-3">
              <Button asChild className="w-full sm:w-auto"><a href={replyHref(open)}><Mail aria-hidden="true" />Reply by email</a></Button>
              <p className="text-xs leading-relaxed text-muted-foreground">The copy in support@coupondonation.com already replies to {open.email}, so you can also answer from Zoho Mail. Mark it as replied here when you have.</p>
            </div>

            {canWrite ? (
              <div className="flex flex-wrap gap-2 border-t border-border pt-4">
                {open.status !== 'replied' && <Button size="sm" variant="outline" disabled={busy} onClick={() => setStatus(open, 'replied')}><Check aria-hidden="true" />Mark as replied</Button>}
                {open.status !== 'archived' && <Button size="sm" variant="outline" disabled={busy} onClick={() => setStatus(open, 'archived')}><Archive aria-hidden="true" />Archive</Button>}
                {open.status !== 'new' && <Button size="sm" variant="ghost" disabled={busy} onClick={() => setStatus(open, 'new')}><RotateCcw aria-hidden="true" />Mark as new</Button>}
              </div>
            ) : (
              <p className="border-t border-border pt-4 text-xs text-muted-foreground">Viewers can read messages. Staff and admins can change their status.</p>
            )}
          </div>}
        </SheetContent>
      </Sheet>
    </DashboardLayout>
  );
}
