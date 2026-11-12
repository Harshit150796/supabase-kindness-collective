import { AlertCircle, Inbox } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/admin/DataTable';
import { cn } from '@/lib/utils';
import { FundraiserThumb } from './FundraiserThumb';
import { FundraiserRow, ago, percent, progressOf, usdWhole } from './fundraiserList';
import { cityState } from '@/lib/helpNeeds';

/** Photo view of the list: one card per fundraiser, so the team can recognise them at a glance. */
export function FundraiserGallery({ rows, loading, error, onRetry, onOpen, selected, onSelect, openId }: {
  rows: FundraiserRow[] | undefined; loading: boolean; error: string | null; onRetry: () => void;
  onOpen: (row: FundraiserRow) => void; selected: Record<string, string> | null; onSelect: (row: FundraiserRow, on: boolean) => void; openId: string | null;
}) {
  if (loading) {
    return <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">{Array.from({ length: 8 }).map((_, i) => <div key={i} className="overflow-hidden rounded-lg border border-border"><Skeleton className="aspect-[4/3] w-full rounded-none" /><div className="space-y-2 p-3"><Skeleton className="h-4 w-3/4" /><Skeleton className="h-3 w-1/2" /></div></div>)}</div>;
  }
  if (error) {
    return <div className="rounded-lg border border-border py-12 text-center"><AlertCircle className="mx-auto mb-2 h-6 w-6 text-destructive" /><p className="text-sm">Couldn't load this list.</p><p className="mb-3 text-xs text-muted-foreground">{error}</p><Button size="sm" variant="outline" onClick={onRetry}>Try again</Button></div>;
  }
  if (!rows?.length) {
    return <div className="rounded-lg border border-border py-12 text-center text-sm text-muted-foreground"><Inbox className="mx-auto mb-2 h-6 w-6" />No fundraisers match these filters.</div>;
  }
  return (
    <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
      {rows.map((r) => {
        const place = cityState(r.city, r.state_code);
        const progress = progressOf(r);
        return (
          <li key={r.id} className={cn('group relative overflow-hidden rounded-lg border bg-background transition-colors hover:border-primary/50', openId === r.id ? 'border-primary' : 'border-border')}>
            <button type="button" onClick={() => onOpen(r)} className="block w-full text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
              <div className="relative aspect-[4/3] w-full overflow-hidden bg-muted">
                <FundraiserThumb url={r.photo_url} need={r.help_categories[0] ?? r.category} size={0} rounded="" className="h-full w-full" />
                <div className="absolute left-2 top-2 flex flex-wrap gap-1">
                  <span className="rounded bg-background/95 shadow-sm"><StatusBadge value={r.status} /></span>
                  {r.is_example && <span className="rounded bg-background/95 px-1.5 py-0.5 text-[11px] font-medium text-muted-foreground shadow-sm">Example</span>}
                </div>
                {r.coupons_waiting > 0 && <span className="absolute bottom-2 left-2 rounded bg-verify px-1.5 py-0.5 text-[11px] font-medium text-verify-foreground">{r.coupons_waiting} coupon{r.coupons_waiting === 1 ? '' : 's'} to send</span>}
                {r.open_reports > 0 && <span className="absolute bottom-2 right-2 rounded bg-destructive px-1.5 py-0.5 text-[11px] font-medium text-destructive-foreground">{r.open_reports} report{r.open_reports === 1 ? '' : 's'}</span>}
              </div>
              <div className="space-y-1.5 p-3">
                <p className="line-clamp-2 text-sm font-medium leading-snug text-foreground">{r.title}</p>
                <p className="truncate text-xs text-muted-foreground">{r.organizer_name || 'No name'}{place ? ` · ${place}` : ''}</p>
                <div className="h-1.5 overflow-hidden rounded-full bg-muted" aria-hidden="true"><div className="h-full rounded-full bg-primary" style={{ width: `${progress * 100}%` }} /></div>
                <p className="flex justify-between gap-2 text-xs tabular-nums text-muted-foreground">
                  <span><span className="font-medium text-foreground">{usdWhole(r.raised)}</span> of {usdWhole(r.monthly_goal)}</span>
                  <span>{percent(progress)}</span>
                </p>
                <p className="text-xs text-muted-foreground">{r.gifts} gift{r.gifts === 1 ? '' : 's'}{r.last_gift_at ? ` · last ${ago(r.last_gift_at)}` : ''}{r.homepage_position != null && !r.homepage_hidden ? ` · homepage #${r.homepage_position}` : ''}</p>
              </div>
            </button>
            {selected && (
              <span className="absolute right-2 top-2 rounded bg-background/95 p-1 shadow-sm">
                <Checkbox aria-label={`Select ${r.title}`} checked={!!selected[r.id]} onCheckedChange={(v) => onSelect(r, !!v)} />
              </span>
            )}
          </li>
        );
      })}
    </ul>
  );
}
