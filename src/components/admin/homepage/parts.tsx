import { type Fundraiser } from '@/hooks/useFundraisers';
import { resolveFundraiserImage, transformedFundraiserImage } from '@/lib/fundraiserImages';
import { funded, launchedAgo } from '@/lib/fundraiserCollections';
import { needLabel } from '@/lib/helpNeeds';
import { usd } from '@/lib/adminApi';
import { cn } from '@/lib/utils';

/**
 * Pieces shared by Admin → Homepage (AdminHomepage): one row of the homepage order, as the list, the preview
 * and the shelves show it.
 */
export type LineupRow = {
  id: string;
  /** The open campaign; missing when a placed campaign isn't open right now. */
  f?: Fundraiser;
  title: string;
  /** Index in the homepage order (placed campaigns, then the automatic ones). */
  index: number;
  /** Position visitors see (1 = first card); null for a placed campaign that isn't open. */
  position: number | null;
  placed: boolean;
  pinned: boolean;
  /** For a placed campaign that isn't open: its status (paused, closed…). */
  status?: string;
};

export type DragKind = 'row' | 'tile' | 'shelf' | 'hidden';
export type DragData = { kind: DragKind; fid: string };

export function photoOf(f?: Fundraiser, width = 200) {
  const src = f ? resolveFundraiserImage(f) : null;
  return src ? transformedFundraiserImage(src, width) ?? src : null;
}

export function Thumb({ f, className }: { f?: Fundraiser; className?: string }) {
  const url = photoOf(f);
  return url
    ? <img src={url} alt="" draggable={false} loading="lazy" className={cn('shrink-0 select-none rounded-md bg-muted object-cover', className)} />
    : <span aria-hidden="true" className={cn('shrink-0 rounded-md bg-muted', className)} />;
}

export const fundedPct = (f: Fundraiser) => Math.floor(funded(f) * 100);

export function Progress({ f, className }: { f: Fundraiser; className?: string }) {
  return (
    <span aria-hidden="true" className={cn('block h-1 overflow-hidden rounded-full bg-primary/10', className)}>
      <span className="block h-full rounded-full bg-primary" style={{ width: `${Math.min(100, fundedPct(f))}%` }} />
    </span>
  );
}

const gifts = (n: number) => `${n} ${n === 1 ? 'donation' : 'donations'}`;

/** Progress, raised of goal, donations, need and age: what the team weighs when ordering campaigns. */
export function Facts({ f, wide = true }: { f: Fundraiser; wide?: boolean }) {
  return (
    <span className="flex min-w-0 items-center gap-x-3 overflow-hidden whitespace-nowrap text-xs text-muted-foreground">
      <span className="flex shrink-0 items-center gap-1.5">
        <Progress f={f} className="w-12" />
        <span className="font-semibold tabular-nums text-foreground">{fundedPct(f)}%</span>
      </span>
      <span className="hidden min-w-0 truncate tabular-nums sm:block">{usd(f.live_raised)} of {usd(f.monthly_goal)}</span>
      {wide && <span className="hidden shrink-0 tabular-nums md:inline">{gifts(Math.max(0, f.live_donations_count))}</span>}
      {wide && <span className="hidden truncate lg:inline">{needLabel(f.category)}</span>}
      {wide && <span className="hidden shrink-0 2xl:inline">Launched {launchedAgo(f.created_at).toLowerCase()}</span>}
      {f.is_example && <span className="hidden shrink-0 sm:inline">Example</span>}
    </span>
  );
}

/** The position number: green when pinned, outlined when the campaign fills in automatically. */
export function positionChipClass(row: Pick<LineupRow, 'placed' | 'pinned' | 'position'>) {
  return cn(
    'inline-flex h-8 min-w-8 shrink-0 items-center justify-center gap-0.5 rounded-md px-1.5 text-sm font-semibold tabular-nums',
    row.pinned ? 'bg-primary text-primary-foreground' : row.placed ? 'bg-foreground/[0.07] text-foreground' : 'border border-dashed border-foreground/25 text-muted-foreground',
    row.position == null && 'text-muted-foreground',
  );
}
