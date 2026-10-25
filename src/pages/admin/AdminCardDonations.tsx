import { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Eye, Loader2, Search } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader, useTeamRole } from '@/components/admin/AdminLayout';
import { DataTable, StatusBadge, type Column } from '@/components/admin/DataTable';
import { useAdminPaged } from '@/hooks/useAdminPaged';
import { rpc, sb, usd } from '@/lib/adminApi';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { CARD_PHOTO_BUCKET, cardStatusText, cardTypeLabel, type CardDonation, type CardStatus } from '@/lib/cardDonations';
import { safeHref } from '@/lib/safeUrl';

type Filter = CardStatus | 'all';
const FILTERS: { value: Filter; label: string }[] = [
  { value: 'pending', label: 'To check' }, { value: 'accepted', label: 'Accepted' }, { value: 'declined', label: 'Declined' },
  { value: 'withdrawn', label: 'Withdrawn' }, { value: 'all', label: 'All' },
];
const WHEN = new Intl.DateTimeFormat('en-US', { dateStyle: 'medium', timeStyle: 'short' });
const DAY = new Intl.DateTimeFormat('en-US', { dateStyle: 'medium' });
const DECLINE_REASONS = [
  'The balance is zero or couldn’t be confirmed',
  'It has expired',
  'It’s tied to the owner’s name or account',
  'The store doesn’t allow it to be transferred',
  'It’s a physical card or paper coupon',
];
type Secret = { code: string | null; pin: string | null; redemption_url: string | null };
type Destination = 'chosen' | 'pool' | 'other';

/**
 * Donated cards queue: staff open each submitted card, look at its code (audited) to check the
 * balance on the store's site, then accept it (to the family the donor chose, another family or the
 * shared pool) or decline it with a reason the donor sees. Codes leave this queue on either decision.
 */
export default function AdminCardDonations() {
  const qc = useQueryClient();
  const { canWrite } = useTeamRole();
  const [filter, setFilter] = useState<Filter>('pending');
  const [open, setOpen] = useState<CardDonation | null>(null);
  const t = useAdminPaged<CardDonation>({
    table: 'card_donations', select: '*, fundraisers(title, unique_slug)', searchCols: ['store_name', 'donor_name', 'donor_email'],
    defaultSort: { key: 'created_at', dir: 'desc' }, filter: (b) => (filter === 'all' ? b : b.eq('status', filter)), deps: [filter],
  });
  const refresh = () => qc.invalidateQueries({ queryKey: ['adm-paged', 'card_donations'] });

  const cols: Column<CardDonation>[] = [
    { key: 'store_name', header: 'Card', sortable: true, cell: (r) => <div className="min-w-0"><p className="font-medium">{r.store_name}</p><p className="text-xs text-muted-foreground">{cardTypeLabel(r.card_type)} · {r.code_hint}</p></div> },
    { key: 'value', header: 'Value', sortable: true, cell: (r) => <span className="whitespace-nowrap text-sm">{r.value ? usd(r.value) : r.discount_text ?? '—'}</span> },
    { key: 'fundraiser_id', header: 'For', cell: (r) => <span className="text-sm">{r.fundraisers?.title ?? 'Shared pool'}</span> },
    { key: 'donor_name', header: 'From', sortable: true, cell: (r) => <div className="min-w-0"><p className="truncate text-sm">{r.donor_name ?? '—'}</p><p className="truncate text-xs text-muted-foreground">{r.donor_email}</p></div> },
    { key: 'status', header: 'Status', sortable: true, cell: (r) => <StatusBadge value={r.status} /> },
    { key: 'created_at', header: 'Sent', sortable: true, cell: (r) => <span className="whitespace-nowrap text-xs">{WHEN.format(new Date(r.created_at))}</span> },
  ];

  return (
    <DashboardLayout>
      <PageHeader title="Donated cards" description="Gift cards, store coupons and promo codes people gave from the Donate a card page. Check each balance on the store's site before accepting it." />
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <div className="relative w-full max-w-sm"><Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" aria-hidden="true" /><Input className="h-9 pl-8" placeholder="Search store, name or email" value={t.search} onChange={(e) => t.setSearch(e.target.value)} aria-label="Search donated cards" /></div>
        <div role="group" aria-label="Filter by status" className="flex flex-wrap gap-1 rounded-md bg-muted p-1">
          {FILTERS.map((f) => (
            <button key={f.value} type="button" aria-pressed={filter === f.value} onClick={() => setFilter(f.value)}
              className={cn('inline-flex h-7 items-center rounded px-2.5 text-xs font-medium transition-colors', filter === f.value ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground')}>{f.label}</button>
          ))}
        </div>
      </div>
      <DataTable columns={cols} {...t.tableProps} rowKey={(r) => r.id} onRowClick={(r) => setOpen(r)}
        empty={filter === 'pending' ? 'No cards waiting. Cards donated on the Donate a card page appear here.' : 'No cards match.'} />
      <Sheet open={!!open} onOpenChange={(o) => !o && setOpen(null)}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
          {open && <CardReview key={open.id} card={open} canWrite={canWrite} onDone={() => { setOpen(null); refresh(); }} />}
        </SheetContent>
      </Sheet>
    </DashboardLayout>
  );
}

function CardReview({ card, canWrite, onDone }: { card: CardDonation; canWrite: boolean; onDone: () => void }) {
  const [secret, setSecret] = useState<Secret | null>(null);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [value, setValue] = useState(card.value ? String(card.value) : '');
  const [destination, setDestination] = useState<Destination>(card.fundraiser_id ? 'chosen' : 'pool');
  const [other, setOther] = useState('');
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const pending = card.status === 'pending';

  const requests = useQuery({
    queryKey: ['adm-card-requests'], enabled: pending && canWrite,
    queryFn: async () => {
      const { data } = await sb.from('fundraisers').select('id, title').eq('status', 'active').eq('is_example', false).is('archived_at', null).order('created_at', { ascending: false }).limit(200);
      return (data ?? []) as { id: string; title: string }[];
    },
  });

  useEffect(() => {
    if (!card.photo_path) return;
    sb.storage.from(CARD_PHOTO_BUCKET).createSignedUrl(card.photo_path, 600).then(({ data }: { data: { signedUrl: string } | null }) => setPhotoUrl(data?.signedUrl ?? null));
  }, [card.photo_path]);

  const reveal = async () => {
    try { setSecret(await rpc<Secret>('admin_card_donation_secret', { _id: card.id })); }
    catch (e) { toast({ title: 'Couldn’t show the code', description: (e as Error).message, variant: 'destructive' }); }
  };

  const review = async (accept: boolean) => {
    if (busy) return;
    if (accept && destination === 'other' && !other) { toast({ title: 'Choose a family', variant: 'destructive' }); return; }
    if (!accept && !reason.trim()) { toast({ title: 'Give the donor a reason', variant: 'destructive' }); return; }
    setBusy(true);
    try {
      await rpc('admin_review_card_donation', {
        _id: card.id, _accept: accept, _value: accept && value ? Number(value) : null, _reason: accept ? null : reason.trim(),
        _fundraiser: accept && destination === 'other' ? other : null, _to_pool: accept && destination === 'pool',
      });
      toast({ title: accept ? 'Card accepted' : 'Card declined', description: accept ? (destination === 'pool' ? 'It’s in coupon stock for the shared pool.' : 'It’s in the family’s wallet. Send the donor’s confirmation from the fundraiser’s Outside coupons list.') : 'The donor sees your reason, and the code was deleted.' });
      onDone();
    } catch (e) {
      toast({ title: 'Couldn’t save the decision', description: (e as Error).message, variant: 'destructive' });
    } finally { setBusy(false); }
  };

  return (
    <div className="space-y-6">
      <SheetHeader className="space-y-1 text-left">
        <SheetTitle className="font-serif text-2xl font-normal">{card.store_name} {cardTypeLabel(card.card_type).toLowerCase()}</SheetTitle>
        <SheetDescription>Sent {WHEN.format(new Date(card.created_at))}</SheetDescription>
      </SheetHeader>
      <div className="flex flex-wrap items-center gap-2"><StatusBadge value={card.status} /><span className="text-xs text-muted-foreground">{cardStatusText(card)}</span></div>

      <dl className="grid grid-cols-[7rem_minmax(0,1fr)] gap-x-3 gap-y-2.5 text-sm">
        <dt className="text-muted-foreground">Value</dt><dd>{card.value ? usd(card.value) : '—'}{card.discount_text ? ` · ${card.discount_text}` : ''}</dd>
        <dt className="text-muted-foreground">Expires</dt><dd>{card.expires_on ? DAY.format(new Date(`${card.expires_on}T12:00:00`)) : 'Not given'}</dd>
        <dt className="text-muted-foreground">For</dt><dd>{card.fundraisers?.title ?? 'Shared pool'}</dd>
        <dt className="text-muted-foreground">From</dt><dd>{card.donor_name ?? '—'} · {card.donor_email}{card.is_anonymous ? ' (anonymous to the family)' : ''}</dd>
        <dt className="text-muted-foreground">Code</dt>
        <dd>{secret ? <span className="font-mono break-all">{secret.code ?? '—'}{secret.pin ? ` · PIN ${secret.pin}` : ''}{secret.redemption_url ? <><br /><a href={safeHref(secret.redemption_url)} target="_blank" rel="noopener noreferrer" className="text-primary underline">{secret.redemption_url}</a></> : null}</span>
          : pending && canWrite ? <Button size="sm" variant="outline" onClick={reveal}><Eye aria-hidden="true" />Show code (logged)</Button> : <span className="text-muted-foreground">{card.code_hint}{pending ? '' : ' (moved or deleted after review)'}</span>}</dd>
      </dl>
      {card.terms && <div><p className="text-sm font-medium">Rules and terms</p><p className="mt-1 whitespace-pre-wrap rounded-md bg-muted/60 p-3 text-sm">{card.terms}</p></div>}
      {card.note && <div><p className="text-sm font-medium">Note from the donor</p><p className="mt-1 whitespace-pre-wrap rounded-md bg-muted/60 p-3 text-sm">{card.note}</p></div>}
      {photoUrl && <a href={photoUrl} target="_blank" rel="noopener noreferrer"><img src={photoUrl} alt="Screenshot the donor added" className="max-h-72 rounded-md border border-border object-contain" /></a>}

      {pending && canWrite && (
        <div className="space-y-5 border-t border-border pt-5">
          <div className="space-y-3">
            <p className="text-sm font-medium">Accept</p>
            <div><Label htmlFor="card-confirmed-value">Value you confirmed ($)</Label><Input id="card-confirmed-value" inputMode="decimal" className="mt-1" value={value} onChange={(e) => setValue(e.target.value.replace(/[^\d.]/g, ''))} /></div>
            <div role="radiogroup" aria-label="Where it goes" className="space-y-1.5 text-sm">
              {card.fundraiser_id && <label className="flex items-center gap-2"><input type="radio" checked={destination === 'chosen'} onChange={() => setDestination('chosen')} />The family the donor chose</label>}
              <label className="flex items-center gap-2"><input type="radio" checked={destination === 'pool'} onChange={() => setDestination('pool')} />Shared pool (coupon stock)</label>
              <label className="flex items-center gap-2"><input type="radio" checked={destination === 'other'} onChange={() => setDestination('other')} />Another family</label>
              {destination === 'other' && (
                <select value={other} onChange={(e) => setOther(e.target.value)} className="h-9 w-full rounded-md border border-input bg-background px-2 text-sm" aria-label="Family">
                  <option value="">Choose a request</option>
                  {(requests.data ?? []).map((r) => <option key={r.id} value={r.id}>{r.title}</option>)}
                </select>
              )}
            </div>
            <Button disabled={busy || !(Number(value) > 0)} onClick={() => review(true)}>{busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}Accept card</Button>
          </div>
          <div className="space-y-3 border-t border-border pt-5">
            <p className="text-sm font-medium">Decline</p>
            <div className="flex flex-wrap gap-1.5">{DECLINE_REASONS.map((r) => <button key={r} type="button" onClick={() => setReason(r)} className="rounded bg-muted px-2 py-1 text-xs hover:bg-muted/70">{r}</button>)}</div>
            <Input aria-label="Reason the donor will see" maxLength={300} placeholder="Reason the donor will see" value={reason} onChange={(e) => setReason(e.target.value)} />
            <Button variant="outline" disabled={busy} onClick={() => review(false)}>Decline and delete code</Button>
          </div>
        </div>
      )}
      {pending && !canWrite && <p className="border-t border-border pt-4 text-xs text-muted-foreground">Viewers can read cards. Staff and admins check and accept them.</p>}
    </div>
  );
}
