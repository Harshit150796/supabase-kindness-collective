import { useDraggable, useDroppable } from '@dnd-kit/core';
import { Laptop, Pin, Smartphone } from 'lucide-react';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { HOMEPAGE_LIMIT, LAPTOP_SHOWN } from '@/lib/homepageLineup';
import { cn } from '@/lib/utils';
import { photoOf, type DragData, type LineupRow } from './parts';

/**
 * Live preview in Admin → Homepage: the cards visitors see, laid out like "Fundraisers open now" (ImpactStories)
 * on a laptop (big card 1, cards 2 to 5 beside it, big card 6 below) and on a phone (FundraiserMosaic panels of
 * four: one tall, two small, one wide, every other panel mirrored). Drop one card on another to swap them.
 */
type Shape = 'lead' | 'card' | 'tall' | 'small' | 'wide';

export type PreviewState = { activeId: string | null; overId: string | null; overKind: string | null; highlightId: string | null };

function Tile({ slot, row, shape, canWrite, state, onFind, onHover, className }: {
  slot: number;
  row?: LineupRow;
  shape: Shape;
  canWrite: boolean;
  state: PreviewState;
  onFind: (id: string) => void;
  onHover: (id: string | null) => void;
  className?: string;
}) {
  const id = row ? `tile:${row.id}` : `tile-empty:${slot}`;
  const drag = useDraggable({ id, data: row ? ({ kind: 'tile', fid: row.id } satisfies DragData) : undefined, disabled: !canWrite || !row });
  const drop = useDroppable({ id, data: row ? ({ kind: 'tile', fid: row.id } satisfies DragData) : undefined, disabled: !row });
  if (!row) return <span ref={drop.setNodeRef} className={cn('rounded-md border border-dashed border-foreground/15', shape === 'lead' ? 'aspect-[16/12]' : shape === 'card' ? 'aspect-[4/4.2]' : '', className)} aria-hidden="true" />;

  const url = photoOf(row.f, shape === 'lead' || shape === 'wide' ? 480 : 260);
  const ring = isOverRing(state, id, row.id);
  const isOver = state.overId === id && state.activeId !== row.id;
  const verb = state.overKind === 'shelf' || state.overKind === 'hidden' ? 'Put here' : 'Swap';
  const overlayTitle = shape === 'tall' || shape === 'wide' || shape === 'small';
  const ringClass = ring === 'over' ? 'ring-2 ring-primary ring-offset-2' : ring === 'highlight' ? 'ring-2 ring-verify ring-offset-2' : '';
  const { onKeyDown: _keyboard, ...pointer } = drag.listeners ?? {};
  return (
    <button
      ref={(node) => { drag.setNodeRef(node); drop.setNodeRef(node); }}
      type="button"
      {...(canWrite ? pointer : {})}
      onClick={() => onFind(row.id)}
      onMouseEnter={() => onHover(row.id)}
      onMouseLeave={() => onHover(null)}
      data-preview-tile={row.position ?? undefined}
      data-drop={id}
      aria-label={`Position ${row.position}: ${row.title}. Show it in the list`}
      className={cn(
        'group relative block min-w-0 touch-manipulation select-none text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        canWrite && 'cursor-grab active:cursor-grabbing',
        overlayTitle && cn('overflow-hidden rounded-md bg-primary-20', ringClass),
        drag.isDragging && 'opacity-40',
        className,
      )}
    >
      <span className={cn('block overflow-hidden bg-muted', overlayTitle ? 'absolute inset-0' : cn('relative rounded-md', shape === 'lead' ? 'aspect-[16/10]' : 'aspect-[4/3]', ringClass))}>
        {url && <img src={url} alt="" draggable={false} loading="lazy" className="absolute inset-0 h-full w-full object-cover" />}
        <span className={cn('absolute left-1 top-1 inline-flex h-5 min-w-5 items-center justify-center gap-0.5 rounded px-1 text-[11px] font-semibold leading-none tabular-nums shadow-sm', row.pinned ? 'bg-primary text-primary-foreground' : row.placed ? 'bg-background text-foreground' : 'bg-background/80 text-muted-foreground')}>
          {row.position}{row.pinned && <Pin className="h-2.5 w-2.5 fill-current" aria-hidden="true" />}
        </span>
        {isOver && <span className="absolute inset-0 flex items-center justify-center bg-primary/55 text-xs font-semibold text-primary-foreground">{verb}</span>}
      </span>
      {overlayTitle ? (
        <span className={cn('absolute bottom-1 left-1 rounded-sm bg-background px-1.5 py-1 text-[10px] font-medium leading-tight text-foreground', shape === 'wide' ? 'max-w-[60%]' : 'right-1', shape === 'tall' ? 'line-clamp-3' : 'line-clamp-2')}>{row.title}</span>
      ) : (
        <span className={cn('mt-1 line-clamp-2 font-medium leading-snug text-foreground', shape === 'lead' ? 'text-xs' : 'text-[11px]')}>{row.title}</span>
      )}
    </button>
  );
}

const PANEL: Record<number, { a: string[]; b: string[] }> = {
  4: { a: ['col-start-1 row-start-1 row-span-2', 'col-start-2 row-start-1', 'col-start-2 row-start-2', 'col-span-2 row-start-3'], b: ['col-start-1 row-start-1', 'col-start-2 row-start-1 row-span-2', 'col-start-1 row-start-2', 'col-span-2 row-start-3'] },
  3: { a: ['col-start-1 row-start-1 row-span-2', 'col-start-2 row-start-1', 'col-start-2 row-start-2'], b: ['col-start-1 row-start-1', 'col-start-2 row-start-1 row-span-2', 'col-start-1 row-start-2'] },
  2: { a: ['col-start-1 row-start-1 row-span-2', 'col-start-2 row-start-1 row-span-2'], b: ['col-start-1 row-start-1 row-span-2', 'col-start-2 row-start-1 row-span-2'] },
  1: { a: ['col-span-2 row-start-1 row-span-2'], b: ['col-span-2 row-start-1 row-span-2'] },
};
/** A tile's ring: green while something is dropped on it, blue while its row is pointed at. */
function isOverRing(state: PreviewState, id: string, fid: string): 'over' | 'highlight' | null {
  if (state.overId === id && state.activeId !== fid) return 'over';
  return state.highlightId === fid ? 'highlight' : null;
}
const shapeOf = (place: string): Shape => (place.includes('col-span-2 row-start-3') ? 'wide' : place.includes('row-span-2') ? 'tall' : 'small');

export function LineupPreview({ rows, device, onDevice, canWrite, state, onFind, onHover }: {
  /** Open campaigns in homepage order. */
  rows: LineupRow[];
  device: 'laptop' | 'phone';
  onDevice: (device: 'laptop' | 'phone') => void;
  canWrite: boolean;
  state: PreviewState;
  onFind: (id: string) => void;
  onHover: (id: string | null) => void;
}) {
  const shown = rows.slice(0, device === 'laptop' ? LAPTOP_SHOWN : HOMEPAGE_LIMIT);
  const tile = (i: number, shape: Shape, className?: string) => <Tile key={shown[i]?.id ?? `empty-${i}`} slot={i} row={shown[i]} shape={shape} canWrite={canWrite} state={state} onFind={onFind} onHover={onHover} className={className} />;
  const panels: LineupRow[][] = [];
  for (let i = 0; i < shown.length; i += 4) panels.push(shown.slice(i, i + 4));

  return (
    <section aria-labelledby="lineup-preview" className="rounded-xl border bg-card p-4">
      <div className="flex items-center justify-between gap-3">
        <h2 id="lineup-preview" className="text-base font-semibold">What visitors see</h2>
        <ToggleGroup type="single" size="sm" value={device} onValueChange={(v) => v && onDevice(v as 'laptop' | 'phone')} aria-label="Preview on" className="rounded-md bg-muted p-0.5">
          <ToggleGroupItem value="laptop" className="h-7 gap-1.5 px-2.5 text-xs data-[state=on]:bg-background data-[state=on]:text-foreground data-[state=on]:shadow-sm"><Laptop className="h-3.5 w-3.5" />Laptop</ToggleGroupItem>
          <ToggleGroupItem value="phone" className="h-7 gap-1.5 px-2.5 text-xs data-[state=on]:bg-background data-[state=on]:text-foreground data-[state=on]:shadow-sm"><Smartphone className="h-3.5 w-3.5" />Phone</ToggleGroupItem>
        </ToggleGroup>
      </div>
      <p className="mt-1 text-xs text-muted-foreground">
        {device === 'laptop' ? 'Laptops show the first 6.' : `Phones show the first ${HOMEPAGE_LIMIT}, four at a time; people swipe for more.`}
        {canWrite ? ' Drop one card on another to swap them.' : ''} Select a card to find it in the list.
      </p>

      {device === 'laptop' ? (
        <div className="mt-4 grid grid-cols-[1.3fr_1fr] gap-2.5" data-preview="laptop">
          <div className="flex flex-col gap-2.5">{tile(0, 'lead')}{tile(5, 'lead')}</div>
          <div className="grid grid-cols-2 content-start gap-x-2 gap-y-2.5">
            {tile(1, 'card')}{tile(2, 'card')}{tile(3, 'card')}{tile(4, 'card')}
            <span className="col-span-2 rounded-md border border-dashed border-foreground/15 px-2 py-3 text-[11px] leading-tight text-muted-foreground">Start a fundraiser card</span>
          </div>
        </div>
      ) : (
        <div className="-mx-4 mt-4 flex snap-x snap-mandatory gap-2.5 overflow-x-auto px-4 pb-2" data-preview="phone">
          {panels.map((panel, p) => {
            const places = PANEL[panel.length][p % 2 ? 'b' : 'a'];
            return (
              <div key={panel[0].id} className={cn('grid w-[206px] shrink-0 snap-start grid-cols-2 gap-1.5', panel.length === 4 ? 'grid-rows-[96px_96px_84px]' : 'grid-rows-[96px_96px]')}>
                {panel.map((row, i) => <Tile key={row.id} slot={p * 4 + i} row={row} shape={shapeOf(places[i])} canWrite={canWrite} state={state} onFind={onFind} onHover={onHover} className={places[i]} />)}
              </div>
            );
          })}
          <span className="flex w-24 shrink-0 snap-start items-center rounded-md bg-primary/10 p-2.5 text-[11px] font-semibold leading-tight text-primary">See all fundraisers</span>
        </div>
      )}
    </section>
  );
}
