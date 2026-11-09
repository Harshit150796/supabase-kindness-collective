import { useMemo, useState } from 'react';
import { useDraggable, useDroppable } from '@dnd-kit/core';
import { ArrowUpToLine, Eye, EyeOff, MoreHorizontal, Plus, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { type Fundraiser } from '@/hooks/useFundraisers';
import { funded } from '@/lib/fundraiserCollections';
import { needLabel } from '@/lib/helpNeeds';
import { cn } from '@/lib/utils';
import { Facts, Thumb, type DragData } from './parts';

/**
 * The two shelves beside the homepage order in Admin → Homepage: open campaigns past position 24 (drag one into
 * the order, or add it) and the campaigns hidden from the homepage (drop any campaign here to hide it).
 */
export type ShelfActions = { addEnd: (id: string) => void; addTop: (id: string) => void; hide: (id: string) => void; show: (id: string) => void };

const SORTS = {
  trending: { label: 'Trending order', by: null },
  raised: { label: 'Most raised', by: (a: Fundraiser, b: Fundraiser) => b.live_raised - a.live_raised },
  close: { label: 'Closest to goal', by: (a: Fundraiser, b: Fundraiser) => funded(b) - funded(a) },
  donations: { label: 'Most donations', by: (a: Fundraiser, b: Fundraiser) => b.live_donations_count - a.live_donations_count },
  newest: { label: 'Newest', by: (a: Fundraiser, b: Fundraiser) => Date.parse(b.created_at) - Date.parse(a.created_at) },
  least: { label: 'Least funded', by: (a: Fundraiser, b: Fundraiser) => funded(a) - funded(b) },
} as const;
type SortId = keyof typeof SORTS;

function ShelfItem({ id, f, title, kind, canWrite, flashing, actions }: { id: string; f?: Fundraiser; title: string; kind: 'shelf' | 'hidden'; canWrite: boolean; flashing: boolean; actions: ShelfActions }) {
  const drag = useDraggable({ id: `${kind}:${id}`, data: { kind, fid: id } satisfies DragData, disabled: !canWrite || (kind === 'hidden' && !f) });
  const { onKeyDown: _keyboard, ...pointer } = drag.listeners ?? {};
  return (
    <li
      ref={drag.setNodeRef}
      id={`shelf-${id}`}
      {...(canWrite ? pointer : {})}
      className={cn(
        'flex h-16 items-center gap-2.5 rounded-lg border bg-card px-2 transition-shadow',
        canWrite && f && 'cursor-grab touch-manipulation select-none active:cursor-grabbing',
        kind === 'hidden' && 'bg-muted/40',
        drag.isDragging && 'opacity-40',
        flashing && 'ring-2 ring-verify/60',
      )}
    >
      <Thumb f={f} className={cn('h-10 w-12', kind === 'hidden' && 'opacity-70')} />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-medium">{title}</span>
        <span className="mt-1 block">{f ? <Facts f={f} wide={false} /> : <span className="text-xs text-muted-foreground">Not open right now</span>}</span>
      </span>
      {canWrite && kind === 'shelf' && (
        <span className="flex shrink-0 items-center" onMouseDown={(e) => e.stopPropagation()} onTouchStart={(e) => e.stopPropagation()}>
          <Button size="sm" variant="outline" className="h-8 px-2.5" onClick={() => actions.addEnd(id)} aria-label={`Add ${title} to the end of your lineup`}><Plus className="mr-1 h-3.5 w-3.5" />Add</Button>
          <DropdownMenu modal={false}>
            <DropdownMenuTrigger asChild><Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground" aria-label={`More for ${title}`}><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onSelect={() => actions.addTop(id)}><ArrowUpToLine className="mr-2 h-4 w-4" />Add at the top</DropdownMenuItem>
              <DropdownMenuItem onSelect={() => actions.hide(id)}><EyeOff className="mr-2 h-4 w-4" />Hide from the homepage</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </span>
      )}
      {canWrite && kind === 'hidden' && (
        <span className="shrink-0" onMouseDown={(e) => e.stopPropagation()} onTouchStart={(e) => e.stopPropagation()}>
          <Button size="sm" variant="outline" className="h-8 px-2.5" onClick={() => actions.show(id)} aria-label={`Show ${title} on the homepage again`}><Eye className="mr-1 h-3.5 w-3.5" />Show</Button>
        </span>
      )}
    </li>
  );
}

export function MoreCampaigns({ items, canWrite, flashId, actions }: { items: Fundraiser[]; canWrite: boolean; flashId: string | null; actions: ShelfActions }) {
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<SortId>('trending');
  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    const found = q ? items.filter((f) => `${f.title} ${needLabel(f.category)} ${f.unique_slug}`.toLowerCase().includes(q)) : items;
    const by = SORTS[sort].by;
    return by ? [...found].sort(by) : found;
  }, [items, query, sort]);
  if (!items.length) return null;
  return (
    <section aria-labelledby="lineup-more" className="rounded-xl border bg-card p-4">
      <h2 id="lineup-more" className="text-base font-semibold">More open campaigns <span className="font-normal text-muted-foreground">({items.length})</span></h2>
      <p className="mt-1 text-xs text-muted-foreground">These come after position 24, so the homepage doesn't show them. Drag one into the order, or add it.</p>
      <div className="mt-3 flex gap-2">
        <span className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" aria-hidden="true" />
          <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search" aria-label="Search more open campaigns" className="h-9 pl-8" />
        </span>
        <Select value={sort} onValueChange={(v) => setSort(v as SortId)}>
          <SelectTrigger className="h-9 w-[160px]" aria-label="Sort more open campaigns"><SelectValue /></SelectTrigger>
          <SelectContent>{(Object.keys(SORTS) as SortId[]).map((id) => <SelectItem key={id} value={id}>{SORTS[id].label}</SelectItem>)}</SelectContent>
        </Select>
      </div>
      <ul className="mt-3 max-h-[420px] space-y-1.5 overflow-y-auto pr-0.5">
        {list.map((f) => <ShelfItem key={f.id} id={f.id} f={f} title={f.title} kind="shelf" canWrite={canWrite} flashing={flashId === f.id} actions={actions} />)}
        {!list.length && <li className="rounded-lg border border-dashed p-4 text-center text-sm text-muted-foreground">No campaign matches "{query}".</li>}
      </ul>
    </section>
  );
}

export function HiddenCampaigns({ items, canWrite, dragging, flashId, actions }: { items: Array<{ id: string; f?: Fundraiser; title: string }>; canWrite: boolean; dragging: boolean; flashId: string | null; actions: ShelfActions }) {
  const zone = useDroppable({ id: 'zone:hidden', disabled: !canWrite });
  return (
    <section
      ref={zone.setNodeRef}
      aria-labelledby="lineup-hidden"
      data-hidden-zone
      data-drop={canWrite ? 'zone:hidden' : undefined}
      className={cn('rounded-xl border bg-card p-4 transition-colors', dragging && 'border-dashed border-foreground/30', zone.isOver && 'border-primary bg-[hsl(var(--primary-97))]')}
    >
      <h2 id="lineup-hidden" className="flex items-center gap-2 text-base font-semibold"><EyeOff className="h-4 w-4 text-muted-foreground" aria-hidden="true" />Hidden from the homepage <span className="font-normal text-muted-foreground">({items.length})</span></h2>
      <p className="mt-1 text-xs text-muted-foreground">{zone.isOver ? 'Drop to hide it from the homepage.' : 'Still open on their own pages and under "See all fundraisers". Drop a campaign here to hide it; drag one back into the order to show it there.'}</p>
      <ul className="mt-3 space-y-1.5">
        {items.map((item) => <ShelfItem key={item.id} id={item.id} f={item.f} title={item.title} kind="hidden" canWrite={canWrite} flashing={flashId === item.id} actions={actions} />)}
        {!items.length && <li className={cn('rounded-lg border border-dashed p-4 text-center text-sm text-muted-foreground', zone.isOver && 'border-primary text-foreground')}>Nothing hidden.</li>}
      </ul>
    </section>
  );
}
