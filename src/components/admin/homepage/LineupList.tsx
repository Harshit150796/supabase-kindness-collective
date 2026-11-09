import { useEffect, useRef, useState, type KeyboardEvent, type SyntheticEvent } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { ArrowDownToLine, ArrowLeftRight, ArrowUpToLine, CircleAlert, ExternalLink, EyeOff, GripVertical, Hash, Laptop, MoreHorizontal, Pin, PinOff, Plus, Smartphone, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuSub, DropdownMenuSubContent, DropdownMenuSubTrigger, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { Facts, positionChipClass, Thumb, type DragData, type LineupRow } from './parts';

/** What a row can do; AdminHomepage turns each into an edit of the draft lineup. */
export type RowActions = {
  select: (id: string, range: boolean) => void;
  togglePin: (id: string) => void;
  moveTop: (id: string) => void;
  moveEnd: (id: string) => void;
  setPosition: (id: string, position: number) => void;
  swap: (id: string, other: string) => void;
  keep: (id: string) => void;
  hide: (id: string) => void;
  remove: (id: string) => void;
  hover: (id: string | null) => void;
};

/** Pointer and touch drags start anywhere on a row except on its own controls (marked data-no-drag). */
type Listener = ((event: SyntheticEvent) => void) | undefined;
const fromRow = (handler: unknown) => (handler ? (event: SyntheticEvent) => {
  if ((event.target as HTMLElement).closest('[data-no-drag]')) return;
  (handler as (event: SyntheticEvent) => void)(event);
} : undefined);

function PositionField({ row, max, onSet, onDone }: { row: LineupRow; max: number; onSet: (n: number) => void; onDone: () => void }) {
  const input = useRef<HTMLInputElement>(null);
  useEffect(() => { input.current?.focus(); input.current?.select(); }, []);
  const commit = () => {
    const n = Number.parseInt(input.current?.value ?? '', 10);
    if (Number.isFinite(n) && n >= 1 && n !== row.position) onSet(Math.min(n, max));
    onDone();
  };
  return (
    <input
      ref={input}
      data-no-drag
      type="text"
      inputMode="numeric"
      pattern="[0-9]*"
      defaultValue={row.position ?? ''}
      aria-label={`New position for ${row.title}, 1 to ${max}`}
      onKeyDown={(event: KeyboardEvent<HTMLInputElement>) => {
        if (event.key === 'Enter') { event.preventDefault(); commit(); }
        if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); onDone(); }
      }}
      onBlur={commit}
      className="h-8 w-11 shrink-0 rounded-md border border-primary bg-background text-center text-sm font-semibold tabular-nums outline-none ring-2 ring-primary/25"
    />
  );
}

export function SortableRow({ row, rows, canWrite, selected, highlighted, flashing, hint, maxPosition, showAuto, actions }: {
  row: LineupRow;
  /** Label automatic rows (once there is a lineup to tell them apart from). */
  showAuto: boolean;
  rows: LineupRow[];
  canWrite: boolean;
  selected: boolean;
  highlighted: boolean;
  flashing: boolean;
  /** Something dragged from the preview or a shelf is over this row: it will swap with it or go here. */
  hint: 'swap' | 'insert' | 'hide' | null;
  maxPosition: number;
  actions: RowActions;
}) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({
    id: `row:${row.id}`,
    data: { kind: 'row', fid: row.id } satisfies DragData,
    disabled: !canWrite,
  });
  const [editing, setEditing] = useState(false);
  const label = row.position == null ? row.title : `${row.title}, position ${row.position}`;
  const swapTargets = rows.filter((r) => r.id !== row.id && r.position != null);

  return (
    <li
      ref={setNodeRef}
      id={`lineup-row-${row.id}`}
      data-lineup-row={row.id}
      data-drop={`row:${row.id}`}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      onMouseDown={fromRow(listeners?.onMouseDown)}
      onTouchStart={fromRow(listeners?.onTouchStart)}
      onMouseEnter={() => actions.hover(row.id)}
      onMouseLeave={() => actions.hover(null)}
      className={cn(
        'group relative flex h-[68px] items-center gap-2 rounded-lg border bg-card pl-1.5 pr-1.5 sm:gap-2.5 sm:pr-2',
        canWrite && 'cursor-grab touch-manipulation select-none active:cursor-grabbing',
        !row.placed && 'border-dashed bg-transparent',
        row.pinned && 'border-primary/45 bg-[hsl(var(--primary-97))]',
        selected && 'border-verify/60 bg-verify/[0.06] ring-1 ring-verify/40',
        (highlighted || flashing) && !isDragging && 'ring-2 ring-verify/60',
        hint === 'swap' && 'ring-2 ring-primary ring-offset-1',
        hint === 'insert' && 'before:absolute before:-top-[5px] before:left-1 before:right-1 before:h-[3px] before:rounded-full before:bg-primary',
        isDragging && 'z-10 border-dashed border-primary/50 bg-primary/[0.04] opacity-60 [&>*]:invisible',
        'transition-[box-shadow,background-color,border-color] duration-200',
      )}
    >
      {canWrite && (
        <span data-no-drag className="hidden sm:flex">
          <Checkbox checked={selected} onClick={(event) => { event.preventDefault(); actions.select(row.id, event.shiftKey); }} aria-label={`Select ${row.title}`} className="h-4 w-4" />
        </span>
      )}
      {canWrite && (
        <button
          type="button"
          ref={setActivatorNodeRef}
          {...attributes}
          onKeyDown={listeners?.onKeyDown as Listener}
          aria-label={`Move ${label}`}
          className="flex h-10 w-6 shrink-0 cursor-grab items-center justify-center rounded text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring active:cursor-grabbing"
        >
          <GripVertical className="h-4 w-4" aria-hidden="true" />
        </button>
      )}

      {editing && row.position != null ? (
        <PositionField row={row} max={maxPosition} onSet={(n) => actions.setPosition(row.id, n)} onDone={() => setEditing(false)} />
      ) : canWrite && row.position != null ? (
        <Tooltip>
          <TooltipTrigger asChild>
            <button type="button" data-no-drag onClick={() => setEditing(true)} aria-label={`Position ${row.position}. Type a new position for ${row.title}`} className={cn(positionChipClass(row), 'cursor-text hover:ring-2 hover:ring-primary/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring')}>
              {row.position}{row.pinned && <Pin className="h-3 w-3 fill-current" aria-hidden="true" />}
            </button>
          </TooltipTrigger>
          <TooltipContent>Type a position</TooltipContent>
        </Tooltip>
      ) : (
        <span className={positionChipClass(row)} aria-label={row.position == null ? 'Not shown' : `Position ${row.position}`}>{row.position ?? '–'}{row.pinned && <Pin className="h-3 w-3 fill-current" aria-hidden="true" />}</span>
      )}

      <Thumb f={row.f} className="h-10 w-11 sm:h-12 sm:w-16" />
      <span className="min-w-0 flex-1">
        <span className="flex min-w-0 items-center gap-2">
          <span className="truncate text-sm font-medium">{row.title}</span>
          {!row.placed && showAuto && <span className="hidden shrink-0 text-[11px] text-muted-foreground sm:inline">Automatic</span>}
        </span>
        <span className="mt-1 block">
          {row.f ? <Facts f={row.f} /> : (
            <span className="flex items-center gap-1 text-xs text-verify"><CircleAlert className="h-3.5 w-3.5 shrink-0" aria-hidden="true" /><span className="truncate">{row.status ? `${row.status[0].toUpperCase()}${row.status.slice(1)}` : 'Not open'}: skipped on the homepage until it reopens</span></span>
          )}
        </span>
      </span>

      {canWrite && (
        <span data-no-drag className="flex shrink-0 items-center gap-0.5">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button size="icon" variant="ghost" className={cn('h-8 w-8 sm:h-9 sm:w-9', row.pinned ? 'text-primary hover:text-primary' : 'text-muted-foreground')} onClick={() => actions.togglePin(row.id)} aria-pressed={row.pinned} aria-label={`${row.pinned ? 'Unpin' : 'Pin'} ${label}`}>
                <Pin className={cn('h-4 w-4', row.pinned && 'fill-current')} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>{row.pinned ? 'Unpin' : 'Pin to this position'}</TooltipContent>
          </Tooltip>
          <DropdownMenu modal={false}>
            <DropdownMenuTrigger asChild>
              <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground sm:h-9 sm:w-9" aria-label={`More for ${row.title}`}><MoreHorizontal className="h-4 w-4" /></Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-60">
              <DropdownMenuItem disabled={row.index === 0} onSelect={() => actions.moveTop(row.id)}><ArrowUpToLine className="mr-2 h-4 w-4" />Move to the top</DropdownMenuItem>
              {row.placed && <DropdownMenuItem onSelect={() => actions.moveEnd(row.id)}><ArrowDownToLine className="mr-2 h-4 w-4" />Move to the end of your lineup</DropdownMenuItem>}
              {!row.placed && <DropdownMenuItem onSelect={() => actions.moveEnd(row.id)}><Plus className="mr-2 h-4 w-4" />Add to the end of your lineup</DropdownMenuItem>}
              {row.position != null && <DropdownMenuItem onSelect={() => setTimeout(() => setEditing(true), 0)}><Hash className="mr-2 h-4 w-4" />Type a position…</DropdownMenuItem>}
              {swapTargets.length > 0 && (
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger><ArrowLeftRight className="mr-2 h-4 w-4" />Swap with</DropdownMenuSubTrigger>
                  <DropdownMenuSubContent className="max-h-80 w-72 overflow-y-auto">
                    {swapTargets.map((r) => (
                      <DropdownMenuItem key={r.id} onSelect={() => actions.swap(row.id, r.id)}>
                        <span className="mr-2 w-6 shrink-0 text-right text-xs font-semibold tabular-nums text-muted-foreground">{r.position}</span>
                        <span className="truncate">{r.title}</span>
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuSubContent>
                </DropdownMenuSub>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={() => actions.togglePin(row.id)}>{row.pinned ? <PinOff className="mr-2 h-4 w-4" /> : <Pin className="mr-2 h-4 w-4" />}{row.pinned ? 'Unpin' : 'Pin to this position'}</DropdownMenuItem>
              {!row.placed && <DropdownMenuItem onSelect={() => actions.keep(row.id)}><Hash className="mr-2 h-4 w-4" />Keep at this position</DropdownMenuItem>}
              {row.f && <DropdownMenuItem asChild><a href={`/f/${row.f.unique_slug}`} target="_blank" rel="noopener noreferrer"><ExternalLink className="mr-2 h-4 w-4" />Open the campaign page</a></DropdownMenuItem>}
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={() => actions.hide(row.id)}><EyeOff className="mr-2 h-4 w-4" />Hide from the homepage</DropdownMenuItem>
              {row.placed && <DropdownMenuItem onSelect={() => actions.remove(row.id)}><X className="mr-2 h-4 w-4" />Take out of your lineup</DropdownMenuItem>}
            </DropdownMenuContent>
          </DropdownMenu>
        </span>
      )}
    </li>
  );
}

/** The row that follows the pointer while it is dragged. */
export function DragRow({ row }: { row: LineupRow }) {
  return (
    <div className="flex h-[68px] cursor-grabbing items-center gap-2.5 rounded-lg border border-primary/40 bg-card pl-3 pr-4 shadow-[0_18px_40px_-12px_hsl(var(--ink)/0.35),0_2px_6px_hsl(var(--ink)/0.12)] ring-1 ring-primary/20">
      <GripVertical className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
      <span className={positionChipClass(row)}>{row.position ?? '–'}{row.pinned && <Pin className="h-3 w-3 fill-current" aria-hidden="true" />}</span>
      <Thumb f={row.f} className="h-12 w-16" />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-medium">{row.title}</span>
        {row.f && <span className="mt-1 block"><Facts f={row.f} wide={false} /></span>}
      </span>
    </div>
  );
}

/** Where the homepage changes: what laptops show, what only phones show, where the saved lineup ends. */
export function Boundary({ kind }: { kind: 'laptop' | 'phone' | 'off' | 'auto' }) {
  const text = {
    laptop: { icon: Laptop, title: 'Laptops and phones', body: 'Positions 1 to 6: the two big cards and the four beside them.' },
    phone: { icon: Smartphone, title: 'Phones only', body: 'Positions 7 to 24 show when people swipe through the cards.' },
    off: { icon: EyeOff, title: 'Not on the homepage', body: 'After position 24 a campaign shows only under "See all fundraisers".' },
    auto: { icon: null, title: 'Your lineup ends here', body: 'Campaigns below fill in automatically, in the Trending order. Move one and it joins your lineup.' },
  }[kind];
  const Icon = text.icon;
  return (
    <li data-boundary={kind} className={cn('flex items-center gap-2 px-1 text-xs', kind === 'auto' ? 'pt-3 text-muted-foreground' : 'pt-4 first:pt-0')}>
      {Icon && <Icon className="h-3.5 w-3.5 shrink-0 text-foreground/70" aria-hidden="true" />}
      <span className={cn('shrink-0 font-semibold', kind === 'auto' ? 'text-muted-foreground' : 'text-foreground')}>{text.title}</span>
      <span className="hidden truncate text-muted-foreground sm:inline">{text.body}</span>
      <span aria-hidden="true" className={cn('h-px min-w-6 flex-1', kind === 'auto' ? 'border-t border-dashed border-foreground/20' : 'bg-border')} />
    </li>
  );
}
