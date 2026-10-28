import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { type Fundraiser } from '@/hooks/useFundraisers';
import { usd } from '@/hooks/useFundraiserLive';
import { resolveFundraiserImage } from '@/lib/fundraiserImages';
import { ResponsivePhoto } from '@/components/ResponsivePhoto';

type TileKind = 'tall' | 'small' | 'wide';
interface Slot { kind: TileKind; place: string }

/**
 * Phone layout for "Fundraisers open now": panels of up to four fundraisers (one tall tile, two
 * small, one wide) that people swipe through sideways, ending with links to every fundraiser and to
 * starting one. Every other panel mirrors so the strip doesn't repeat itself. Class names stay
 * literal so Tailwind keeps them.
 */
const LAYOUTS: Record<number, { rows: string; a: Slot[]; b: Slot[] }> = {
  4: {
    rows: 'grid-rows-[168px_168px_148px]',
    a: [
      { kind: 'tall', place: 'col-start-1 row-start-1 row-span-2' },
      { kind: 'small', place: 'col-start-2 row-start-1' },
      { kind: 'small', place: 'col-start-2 row-start-2' },
      { kind: 'wide', place: 'col-span-2 row-start-3' },
    ],
    b: [
      { kind: 'small', place: 'col-start-1 row-start-1' },
      { kind: 'tall', place: 'col-start-2 row-start-1 row-span-2' },
      { kind: 'small', place: 'col-start-1 row-start-2' },
      { kind: 'wide', place: 'col-span-2 row-start-3' },
    ],
  },
  3: {
    rows: 'grid-rows-[168px_168px]',
    a: [
      { kind: 'tall', place: 'col-start-1 row-start-1 row-span-2' },
      { kind: 'small', place: 'col-start-2 row-start-1' },
      { kind: 'small', place: 'col-start-2 row-start-2' },
    ],
    b: [
      { kind: 'small', place: 'col-start-1 row-start-1' },
      { kind: 'tall', place: 'col-start-2 row-start-1 row-span-2' },
      { kind: 'small', place: 'col-start-1 row-start-2' },
    ],
  },
  2: {
    rows: 'grid-rows-[168px_168px]',
    a: [
      { kind: 'tall', place: 'col-start-1 row-start-1 row-span-2' },
      { kind: 'tall', place: 'col-start-2 row-start-1 row-span-2' },
    ],
    b: [
      { kind: 'tall', place: 'col-start-1 row-start-1 row-span-2' },
      { kind: 'tall', place: 'col-start-2 row-start-1 row-span-2' },
    ],
  },
  1: {
    rows: 'grid-rows-[168px_168px]',
    a: [{ kind: 'tall', place: 'col-span-2 row-start-1 row-span-2' }],
    b: [{ kind: 'tall', place: 'col-span-2 row-start-1 row-span-2' }],
  },
};

const BOX: Record<TileKind, string> = {
  tall: 'left-1.5 right-1.5 gap-2 p-2.5',
  small: 'left-1.5 right-1.5 gap-1.5 p-2',
  wide: 'left-1.5 w-[190px] gap-1.5 p-2.5',
};
const TITLE: Record<TileKind, string> = {
  tall: 'text-xl line-clamp-4',
  small: 'text-base line-clamp-2',
  wide: 'text-lg line-clamp-2',
};

function MosaicTile({ fundraiser, kind, place }: { fundraiser: Fundraiser } & Slot) {
  const image = resolveFundraiserImage(fundraiser);
  const raised = fundraiser.live_raised ?? 0;
  const pct = fundraiser.monthly_goal > 0 ? Math.min(100, Math.round(raised / fundraiser.monthly_goal * 100)) : 0;
  return (
    <Link
      to={`/f/${fundraiser.unique_slug}`}
      data-mosaic-tile={kind}
      className={`group relative block overflow-hidden rounded-md bg-primary-20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${place}`}
    >
      {image && <ResponsivePhoto src={image} alt="" sizes={kind === 'wide' ? '86vw' : '45vw'} className="absolute inset-0 h-full w-full object-cover transition-transform duration-350 group-hover:scale-[1.03]" onError={(event) => { event.currentTarget.style.visibility = 'hidden'; }} />}
      <span className={`absolute bottom-1.5 flex flex-col rounded bg-background ${BOX[kind]}`}>
        {fundraiser.is_example && <span className="text-[11px] leading-none text-muted-foreground">Example campaign</span>}
        <span className={`font-display leading-[1.05] text-foreground group-hover:underline decoration-1 underline-offset-4 ${TITLE[kind]}`}>{fundraiser.title}</span>
        {kind === 'tall' ? (
          <>
            <span className="block h-1 overflow-hidden rounded-full bg-primary/10"><span className="block h-full bg-primary" style={{ width: `${pct}%` }} /></span>
            <span className="text-xs text-muted-foreground">
              {raised > 0 ? <><strong className="font-semibold text-foreground">{usd(raised)}</strong> of {usd(fundraiser.monthly_goal)}</> : <strong className="font-semibold text-foreground">Be the first to give</strong>}
            </span>
          </>
        ) : (
          <span className="flex items-center gap-1.5 text-[11px] font-semibold text-foreground">
            <span className="block h-[3px] flex-1 overflow-hidden rounded-full bg-primary/10"><span className="block h-full bg-primary" style={{ width: `${pct}%` }} /></span>
            {raised > 0 ? `${pct}%` : 'New'}
          </span>
        )}
      </span>
    </Link>
  );
}

export function FundraiserMosaic({ fundraisers }: { fundraisers: Fundraiser[] }) {
  const strip = useRef<HTMLDivElement>(null);
  const [bar, setBar] = useState({ width: 100, left: 0 });
  const measure = useCallback(() => {
    const el = strip.current;
    if (!el) return;
    const width = el.scrollWidth > 0 ? Math.min(100, el.clientWidth / el.scrollWidth * 100) : 100;
    const max = el.scrollWidth - el.clientWidth;
    setBar({ width, left: max > 0 ? el.scrollLeft / max * (100 - width) : 0 });
  }, []);
  useEffect(() => {
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [measure, fundraisers.length]);

  const panels: Fundraiser[][] = [];
  for (let i = 0; i < fundraisers.length; i += 4) panels.push(fundraisers.slice(i, i + 4));

  return (
    <div data-fundraiser-mosaic>
      <div
        ref={strip}
        onScroll={measure}
        className="-mx-4 flex snap-x snap-mandatory scroll-pl-4 gap-3 overflow-x-auto px-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        aria-label="Fundraisers, swipe for more"
      >
        {panels.map((panel, index) => {
          const layout = LAYOUTS[panel.length];
          const slots = index % 2 ? layout.b : layout.a;
          return (
            <div key={panel[0].id} className={`grid w-[min(330px,calc(100vw-60px))] shrink-0 snap-start grid-cols-2 gap-2 self-start ${layout.rows}`}>
              {panel.map((f, i) => <MosaicTile key={f.id} fundraiser={f} {...slots[i]} />)}
            </div>
          );
        })}
        <div className="flex w-[150px] shrink-0 snap-start flex-col gap-2">
          <Link to="/stories" className="flex min-h-[168px] flex-1 flex-col justify-between rounded-md bg-primary/10 p-3.5 text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
            <span className="font-display text-[23px] leading-[1.05]">Every open fundraiser in one place</span>
            <span className="text-sm font-semibold text-primary">See all fundraisers</span>
          </Link>
          <Link to="/apply" className="flex h-[148px] flex-col justify-between rounded-md border border-border p-3.5 text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
            <span className="font-display text-[21px] leading-[1.05]">Need help yourself?</span>
            <span className="text-sm font-semibold text-primary">Start a fundraiser</span>
          </Link>
        </div>
      </div>
      {bar.width < 100 && (
        <div className="mt-3 flex items-center gap-3 text-[13px] text-muted-foreground">
          <span className="relative block h-[3px] flex-1 overflow-hidden rounded-full bg-primary/10" aria-hidden="true">
            <span className="absolute inset-y-0 block bg-primary" style={{ width: `${bar.width}%`, left: `${bar.left}%` }} />
          </span>
          <span className="inline-flex items-center gap-1">Swipe for more<ArrowRight className="h-3.5 w-3.5" aria-hidden="true" /></span>
        </div>
      )}
    </div>
  );
}
