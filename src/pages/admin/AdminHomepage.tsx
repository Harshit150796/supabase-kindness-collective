import { Fragment, useEffect, useMemo, useReducer, useRef, useState, useSyncExternalStore, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  closestCenter, DndContext, DragOverlay, KeyboardSensor, MouseSensor, TouchSensor, useSensor, useSensors,
  type Announcements, type CollisionDetection, type DragEndEvent, type DragStartEvent, type KeyboardCoordinateGetter, type UniqueIdentifier,
} from '@dnd-kit/core';
import { SortableContext, type SortingStrategy } from '@dnd-kit/sortable';
import { ArrowLeftRight, ArrowUpToLine, ChevronDown, ExternalLink, EyeOff, Keyboard, Pin, PinOff, Redo2, RotateCcw, Search, Shuffle, Smartphone, Undo2, X } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader, useTeamRole } from '@/components/admin/AdminLayout';
import { Boundary, DragRow, SortableRow, type RowActions } from '@/components/admin/homepage/LineupList';
import { LineupPreview } from '@/components/admin/homepage/LineupPreview';
import { HiddenCampaigns, MoreCampaigns, type ShelfActions } from '@/components/admin/homepage/CampaignShelf';
import { Thumb, type DragData, type DragKind, type LineupRow } from '@/components/admin/homepage/parts';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Skeleton } from '@/components/ui/skeleton';
import { ToastAction } from '@/components/ui/toast';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { toast } from '@/hooks/use-toast';
import { sb, rpc } from '@/lib/adminApi';
import { cn } from '@/lib/utils';
import { useFundraisers } from '@/hooks/useFundraisers';
import {
  HOMEPAGE_LIMIT, insertWithPins, LAPTOP_SHOWN, lineupChanges, lineupPrefix, LINEUP_MAX, moveToTopWithPins, moveWithPins, removeWithPins,
  shuffleLineup, splitLineup, swapAt, type LineupDraft, type Placement,
} from '@/lib/homepageLineup';

/**
 * Admin → Homepage (founder request, Nov 9, 2026): the order of "Fundraisers open now" on the homepage.
 * One list shows the homepage as visitors get it: the team's lineup first, then the campaigns that fill in
 * automatically (Trending order), up to position 24. Anything can be dragged (mouse, touch: press and hold,
 * keyboard: space on the handle), given a typed position, swapped, pinned, hidden or taken out; pinned
 * campaigns keep their position when others move and when the team shuffles. Moving an automatic campaign
 * makes it, and everything above it, part of the lineup. Edits are a draft with undo until "Save lineup",
 * which writes it in one audited call (admin_set_homepage_lineup). Rules: src/lib/homepageLineup.ts.
 */
type Closed = { id: string; title: string; status: string };
type History = { past: LineupDraft[]; present: LineupDraft; future: LineupDraft[] };
type HistoryAction = { type: 'load' | 'edit'; draft: LineupDraft } | { type: 'undo' | 'redo' };

const EMPTY: LineupDraft = { order: [], hidden: [], pinned: [] };
const sorted = (ids: string[]) => [...ids].sort().join(',');
const sameDraft = (a: LineupDraft, b: LineupDraft) => a.order.join(',') === b.order.join(',') && sorted(a.hidden) === sorted(b.hidden) && sorted(a.pinned) === sorted(b.pinned);

function history(state: History, action: HistoryAction): History {
  switch (action.type) {
    case 'load': return { past: [], present: action.draft, future: [] };
    case 'edit': return sameDraft(state.present, action.draft) ? state : { past: [...state.past, state.present].slice(-100), present: action.draft, future: [] };
    case 'undo': return state.past.length ? { past: state.past.slice(0, -1), present: state.past[state.past.length - 1], future: [state.present, ...state.future] } : state;
    case 'redo': return state.future.length ? { past: [...state.past, state.present], present: state.future[0], future: state.future.slice(1) } : state;
  }
}

const WIDE = '(min-width: 1280px)';
function useWide() {
  return useSyncExternalStore(
    (change) => { const m = window.matchMedia(WIDE); m.addEventListener('change', change); return () => m.removeEventListener('change', change); },
    () => window.matchMedia(WIDE).matches,
    () => true,
  );
}

const isRowId = (id: UniqueIdentifier) => String(id).startsWith('row:');
const fidOf = (id: UniqueIdentifier) => String(id).slice(String(id).indexOf(':') + 1);

/** The drop target under the pointer, read from the page itself (data-drop), so sticky panels match what people see. */
function targetAt(point: { x: number; y: number } | null): string | null {
  if (!point) return null;
  for (const el of document.elementsFromPoint(point.x, point.y)) {
    const target = el.closest<HTMLElement>('[data-drop]');
    if (target) return target.dataset.drop ?? null;
  }
  return null;
}

/**
 * Where a drag lands. Preview cards and the hidden shelf sit in a sticky panel, so they are found under the
 * pointer; rows sort by the nearest row wherever the pointer is. Cards and shelf campaigns land at the nearest row
 * while the pointer is over the list's column.
 */
const collisionAt = (pointer: { current: { x: number; y: number } | null }): CollisionDetection => (args) => {
  const kind = (args.active.data.current as DragData | undefined)?.kind;
  const hit = targetAt(pointer.current);
  if (hit && !isRowId(hit) && hit !== 'zone:list') return args.droppableContainers.some((c) => c.id === hit) ? [{ id: hit }] : [];
  const rows = args.droppableContainers.filter((c) => isRowId(c.id));
  if (kind === 'row' || hit) return closestCenter({ ...args, droppableContainers: rows });
  return [];
};

/** Keyboard drags (space on a row's handle) step one row up or down. */
const rowKeys: KeyboardCoordinateGetter = (event, { context: { active, over, droppableRects, droppableContainers, collisionRect } }) => {
  if (event.code !== 'ArrowDown' && event.code !== 'ArrowUp') return undefined;
  event.preventDefault();
  if (!active || !collisionRect) return undefined;
  const rows = droppableContainers.getEnabled().filter((c) => isRowId(c.id))
    .map((c) => ({ id: c.id, rect: droppableRects.get(c.id) })).filter((r) => r.rect).sort((a, b) => a.rect!.top - b.rect!.top);
  const at = rows.findIndex((r) => r.id === (over && isRowId(over.id) ? over.id : active.id));
  const next = rows[at + (event.code === 'ArrowDown' ? 1 : -1)];
  return next ? { x: collisionRect.left, y: next.rect!.top } : undefined;
};

const mac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform);
const MOD = mac ? '⌘' : 'Ctrl+';

function Kbd({ children }: { children: ReactNode }) {
  return <kbd className="rounded border border-border bg-muted px-1.5 py-0.5 font-sans text-[11px] font-medium text-muted-foreground">{children}</kbd>;
}

function ToolButton({ label, keys, onClick, disabled, children }: { label: string; keys?: string; onClick: () => void; disabled?: boolean; children: ReactNode }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button size="icon" variant="ghost" className="h-9 w-9" onClick={onClick} disabled={disabled} aria-label={label} aria-keyshortcuts={keys}>{children}</Button>
      </TooltipTrigger>
      <TooltipContent>{label}{keys && <span className="ml-2 text-muted-foreground">{keys}</span>}</TooltipContent>
    </Tooltip>
  );
}

export default function AdminHomepage() {
  const { canWrite } = useTeamRole();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const wide = useWide();
  const open = useFundraisers();
  // The admin view of the lineup includes pins (visitors' reads don't).
  const lineup = useQuery({
    queryKey: ['adm-homepage-lineup'],
    queryFn: async (): Promise<Array<Placement & { pinned: boolean }>> => {
      const { data, error } = await sb.from('homepage_placements').select('fundraiser_id, position, hidden, pinned');
      if (error) throw error;
      return data ?? [];
    },
    staleTime: 0,
  });

  const [hist, dispatch] = useReducer(history, { past: [], present: EMPTY, future: [] });
  const draft = hist.present;
  const { order, hidden, pinned } = draft;
  const saved = useMemo<LineupDraft | null>(() => {
    if (!lineup.data) return null;
    const split = splitLineup(lineup.data);
    return { order: split.order, hidden: [...split.hidden], pinned: lineup.data.filter((p) => p.pinned && !p.hidden && p.position != null).map((p) => p.fundraiser_id) };
  }, [lineup.data]);
  // Start from what's saved; take a newer saved lineup only while there are no unsaved edits.
  const lastSaved = useRef<LineupDraft | null>(null);
  useEffect(() => {
    if (!saved) return;
    const before = lastSaved.current;
    lastSaved.current = saved;
    if (!before || sameDraft(hist.present, before)) dispatch({ type: 'load', draft: saved });
  }, [saved]); // eslint-disable-line react-hooks/exhaustive-deps
  const dirty = !!saved && !sameDraft(draft, saved);

  const [saving, setSaving] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  const anchor = useRef<string | null>(null);
  const [hoverId, setHoverId] = useState<string | null>(null);
  const [flashId, setFlashId] = useState<string | null>(null);
  const [device, setDevice] = useState<'laptop' | 'phone'>('laptop');
  const [findOpen, setFindOpen] = useState(false);
  const [leaveTo, setLeaveTo] = useState<string | null>(null);
  const [live, setLive] = useState('');
  const [drag, setDrag] = useState<DragData | null>(null);
  const [overId, setOverId] = useState<string | null>(null);

  // What the homepage shows: the lineup, then open campaigns in the ranked order, up to position 24.
  const openList = useMemo(() => open.data ?? [], [open.data]);
  const byId = useMemo(() => new Map(openList.map((f) => [f.id, f])), [openList]);
  const hiddenSet = useMemo(() => new Set(hidden), [hidden]);
  const pinSet = useMemo(() => new Set(pinned), [pinned]);
  const auto = useMemo(() => { const placed = new Set(order); return openList.filter((f) => !placed.has(f.id) && !hiddenSet.has(f.id)); }, [openList, order, hiddenSet]);
  const openPlaced = order.filter((id) => byId.has(id)).length;
  const { autoShown, more } = useMemo(() => {
    const room = Math.max(0, HOMEPAGE_LIMIT - openPlaced);
    return { autoShown: auto.slice(0, room), more: auto.slice(room) };
  }, [auto, openPlaced]);
  const list = useMemo(() => [...order, ...autoShown.map((f) => f.id)], [order, autoShown]);

  // Placed or hidden campaigns that aren't open right now (paused, closed…): named so nothing disappears silently.
  const missing = useMemo(() => [...order, ...hidden].filter((id) => open.data && !byId.has(id)), [order, hidden, byId, open.data]);
  const closed = useQuery({
    queryKey: ['adm-homepage-closed', missing.join(',')],
    enabled: missing.length > 0,
    queryFn: async (): Promise<Closed[]> => {
      const { data, error } = await sb.from('fundraisers').select('id,title,status').in('id', missing);
      if (error) throw error;
      return data ?? [];
    },
  });
  const closedById = useMemo(() => new Map((closed.data ?? []).map((c) => [c.id, c])), [closed.data]);
  const titleOf = (id: string) => byId.get(id)?.title ?? closedById.get(id)?.title ?? 'Campaign';

  const toRows = (ids: string[], placed: ReadonlySet<string> | number): LineupRow[] => {
    let position = 0;
    return ids.map((id, index) => {
      const f = byId.get(id);
      return { id, f, title: f?.title ?? closedById.get(id)?.title ?? 'Campaign', index, position: f ? ++position : null, placed: typeof placed === 'number' ? index < placed : placed.has(id), pinned: pinSet.has(id), status: f ? undefined : closedById.get(id)?.status };
    });
  };
  const rows = useMemo(() => toRows(list, order.length), [list, byId, closedById, order.length, pinSet]); // eslint-disable-line react-hooks/exhaustive-deps
  const rowById = useMemo(() => new Map(rows.map((r) => [r.id, r])), [rows]);
  const openRows = useMemo(() => rows.filter((r) => r.position != null), [rows]);
  const hiddenItems = hidden.map((id) => ({ id, f: byId.get(id), title: titleOf(id) }));

  // Selection follows the list: campaigns that leave it drop out.
  useEffect(() => { setSelected((s) => { const next = s.filter((id) => rowById.has(id)); return next.length === s.length ? s : next; }); }, [rowById]);

  const say = (message: string) => setLive(message);
  const undoToast = (title: string) => toast({ title, action: <ToastAction altText="Undo" onClick={() => dispatch({ type: 'undo' })}>Undo</ToastAction> });
  const apply = (next: LineupDraft, message?: string) => { dispatch({ type: 'edit', draft: next }); if (message) say(message); };
  const positionIn = (ids: string[], id: string) => ids.filter((x) => byId.has(x)).indexOf(id) + 1;

  /** Applies a new homepage order: the lineup becomes everything up to the last campaign that must keep its place. */
  const commit = (next: string[], keep: string[], message: (ids: string[]) => string, pins = pinned, hide = hidden) => {
    const nextOrder = lineupPrefix(next, new Set([...order, ...keep]));
    if (nextOrder.length > LINEUP_MAX) { toast({ title: `A lineup holds up to ${LINEUP_MAX} campaigns`, description: 'Take some out first.', variant: 'destructive' }); return; }
    const inOrder = new Set(nextOrder);
    apply({ order: nextOrder, hidden: hide.filter((id) => !inOrder.has(id)), pinned: [...new Set(pins)].filter((id) => inOrder.has(id)) }, message(next));
  };
  const moveRow = (from: number, to: number) => {
    const id = list[from];
    if (id == null) return;
    commit(moveWithPins(list, pinSet, from, to), [id], (next) => (positionIn(next, id) ? `${titleOf(id)} moved to position ${positionIn(next, id)}.` : `${titleOf(id)} moved.`));
  };
  const swapRows = (a: number, b: number) => {
    if (a < 0 || b < 0 || a === b) return;
    const [x, y] = [list[a], list[b]];
    commit(swapAt(list, a, b), [x, y], (next) => `${titleOf(x)} is now at position ${positionIn(next, x)} and ${titleOf(y)} at ${positionIn(next, y)}.`);
  };
  const placeAt = (id: string, to: number) => {
    const at = list.indexOf(id);
    if (at >= 0) { if (at !== to) moveRow(at, Math.min(to, list.length - 1)); return; }
    commit(insertWithPins(list, pinSet, id, to), [id], (next) => `${titleOf(id)} added at position ${positionIn(next, id)}.`, pinned, hidden.filter((x) => x !== id));
  };
  const takeOut = (id: string, hide: boolean) => {
    apply({ order: removeWithPins(order, pinSet, id), hidden: hide ? [...hidden.filter((x) => x !== id), id] : hidden, pinned: pinned.filter((x) => x !== id) });
    undoToast(hide ? `${titleOf(id)} is hidden from the homepage` : `${titleOf(id)} is back in the automatic order`);
  };

  const actions: RowActions = {
    select: (id, range) => {
      setSelected((s) => {
        if (range && anchor.current && rowById.has(anchor.current)) {
          const [a, b] = [rowById.get(anchor.current)!.index, rowById.get(id)!.index].sort((p, q) => p - q);
          return [...new Set([...s, ...list.slice(a, b + 1)])];
        }
        return s.includes(id) ? s.filter((x) => x !== id) : [...s, id];
      });
      anchor.current = id;
    },
    togglePin: (id) => {
      if (pinSet.has(id)) apply({ ...draft, pinned: pinned.filter((x) => x !== id) }, `${titleOf(id)} unpinned.`);
      else commit(list, [id], () => `${titleOf(id)} pinned at position ${rowById.get(id)?.position}.`, [...pinned, id]);
    },
    moveTop: (id) => moveRow(list.indexOf(id), 0),
    moveEnd: (id) => {
      const at = list.indexOf(id);
      if (at < order.length) moveRow(at, order.length - 1);
      else if (at === order.length) commit(list, [id], () => `${titleOf(id)} added to your lineup at position ${rowById.get(id)?.position}.`);
      else moveRow(at, order.length);
    },
    setPosition: (id, position) => {
      const target = openRows[position - 1]?.index ?? list.length - 1;
      if (list.indexOf(id) !== target) moveRow(list.indexOf(id), target);
    },
    swap: (id, other) => swapRows(list.indexOf(id), list.indexOf(other)),
    keep: (id) => commit(list, [id], () => `${titleOf(id)} kept at position ${rowById.get(id)?.position}.`),
    hide: (id) => takeOut(id, true),
    remove: (id) => takeOut(id, false),
    hover: setHoverId,
  };
  const shelf: ShelfActions = {
    addEnd: (id) => placeAt(id, order.length),
    addTop: (id) => placeAt(id, 0),
    hide: (id) => { apply({ ...draft, hidden: [...hidden.filter((x) => x !== id), id] }); undoToast(`${titleOf(id)} is hidden from the homepage`); },
    show: (id) => apply({ ...draft, hidden: hidden.filter((x) => x !== id) }, `${titleOf(id)} can show on the homepage again.`),
  };

  // Several at once.
  const picked = list.filter((id) => selected.includes(id));
  const bulk = {
    top: () => { const ids = picked.filter((id) => !pinSet.has(id)); commit(moveToTopWithPins(list, pinSet, ids), ids, () => `${ids.length} moved to the top.`); setSelected([]); },
    swap: () => { swapRows(list.indexOf(picked[0]), list.indexOf(picked[1])); setSelected([]); },
    pin: () => { commit(list, picked, () => `${picked.length} pinned.`, [...pinned, ...picked]); setSelected([]); },
    unpin: () => { apply({ ...draft, pinned: pinned.filter((id) => !picked.includes(id)) }, `${picked.length} unpinned.`); setSelected([]); },
    hide: () => {
      apply({ order: picked.reduce((o, id) => removeWithPins(o, pinSet, id), order), hidden: [...new Set([...hidden, ...picked])], pinned: pinned.filter((id) => !picked.includes(id)) });
      undoToast(`${picked.length} hidden from the homepage`); setSelected([]);
    },
    remove: () => {
      apply({ order: picked.reduce((o, id) => removeWithPins(o, pinSet, id), order), hidden, pinned: pinned.filter((id) => !picked.includes(id)) });
      undoToast(`${picked.length} back in the automatic order`); setSelected([]);
    },
  };
  const shuffle = () => {
    apply({ order: shuffleLineup(order, pinSet, openList.map((f) => f.id).filter((id) => !hiddenSet.has(id))), hidden, pinned });
    undoToast(pinned.length ? `Shuffled. ${pinned.length} pinned ${pinned.length === 1 ? 'campaign stayed' : 'campaigns stayed'} in place` : 'Shuffled');
  };
  const resetToAutomatic = () => { apply({ order: [], hidden, pinned: [] }); undoToast('Back to the automatic Trending order'); };
  const discard = () => { if (saved) { apply(saved); undoToast('Changes discarded'); } };

  const save = async () => {
    if (!canWrite || saving || !dirty) return;
    setSaving(true);
    try {
      await rpc('admin_set_homepage_lineup', { _order: order, _hidden: hidden, _pinned: pinned });
      await Promise.all([qc.invalidateQueries({ queryKey: ['homepage-lineup'] }), qc.invalidateQueries({ queryKey: ['adm-homepage-lineup'] })]);
      toast({ title: 'Homepage order saved', description: 'Visitors see it the next time they open the homepage.' });
    } catch (error) {
      toast({ title: 'Could not save the homepage order', description: (error as Error).message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const find = (id: string) => {
    setFindOpen(false);
    const el = document.getElementById(`lineup-row-${id}`) ?? document.getElementById(`shelf-${id}`);
    if (!el) return;
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    (el.querySelector('button') as HTMLButtonElement | null)?.focus({ preventScroll: true });
    setFlashId(id);
    window.setTimeout(() => setFlashId((f) => (f === id ? null : f)), 1600);
  };

  // Shortcuts: undo, redo, save, find, clear the selection.
  const keys = useRef({ save, dirty });
  keys.current = { save, dirty };
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target instanceof Element ? event.target : null;
      const typing = target?.closest('input, textarea, select, [contenteditable="true"], [role="dialog"], [role="menu"]');
      const mod = event.metaKey || event.ctrlKey;
      if (mod && event.key.toLowerCase() === 's') { event.preventDefault(); void keys.current.save(); return; }
      if (typing) return;
      if (mod && event.key.toLowerCase() === 'z') { event.preventDefault(); dispatch({ type: event.shiftKey ? 'redo' : 'undo' }); return; }
      if (mod && event.key.toLowerCase() === 'y') { event.preventDefault(); dispatch({ type: 'redo' }); return; }
      if (!mod && event.key === '/') { event.preventDefault(); setFindOpen(true); return; }
      if (event.key === 'Escape') setSelected([]);
    };
    if (!canWrite) return;
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [canWrite]);

  // Unsaved changes: ask before a reload or a link elsewhere in the portal (new-tab links are fine).
  useEffect(() => {
    if (!dirty) return;
    const unload = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = ''; };
    const follow = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const link = event.target instanceof Element ? event.target.closest<HTMLAnchorElement>('a[href]') : null;
      if (!link || link.target === '_blank' || link.hasAttribute('download')) return;
      const url = new URL(link.href, window.location.href);
      if (url.origin !== window.location.origin || url.pathname === window.location.pathname) return;
      event.preventDefault();
      event.stopPropagation();
      setLeaveTo(url.pathname + url.search + url.hash);
    };
    window.addEventListener('beforeunload', unload);
    document.addEventListener('click', follow, true);
    return () => { window.removeEventListener('beforeunload', unload); document.removeEventListener('click', follow, true); };
  }, [dirty]);

  // Drag and drop.
  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 4 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: rowKeys }),
  );
  // While a row moves, the others make room around it; pinned rows stay where they are.
  const strategy = useMemo<SortingStrategy>(() => {
    let key = '';
    let preview = list;
    return ({ rects, activeIndex, overIndex, index }) => {
      if (activeIndex < 0 || overIndex < 0) return null;
      const k = `${activeIndex}>${overIndex}`;
      if (k !== key) { key = k; preview = moveWithPins(list, pinSet, activeIndex, overIndex); }
      const to = preview.indexOf(list[index]);
      if (to === index || !rects[index] || !rects[to]) return null;
      return { x: 0, y: rects[to].top - rects[index].top, scaleX: 1, scaleY: 1 };
    };
  }, [list, pinSet]);
  // The pointer's place on screen during a drag (mouse, pen or finger), for targetAt.
  const pointer = useRef<{ x: number; y: number } | null>(null);
  const collision = useMemo(() => collisionAt(pointer), []);
  useEffect(() => {
    if (!drag) { pointer.current = null; return; }
    const move = (event: PointerEvent) => { pointer.current = { x: event.clientX, y: event.clientY }; };
    const touch = (event: TouchEvent) => { const t = event.touches[0]; if (t) pointer.current = { x: t.clientX, y: t.clientY }; };
    window.addEventListener('pointermove', move, { passive: true });
    window.addEventListener('touchmove', touch, { passive: true });
    return () => { window.removeEventListener('pointermove', move); window.removeEventListener('touchmove', touch); };
  }, [drag]);
  const onDragStart = ({ active, activatorEvent }: DragStartEvent) => {
    const at = activatorEvent as MouseEvent & TouchEvent;
    const t = at.touches?.[0];
    pointer.current = t ? { x: t.clientX, y: t.clientY } : 'clientX' in at && at.type !== 'keydown' ? { x: at.clientX, y: at.clientY } : null;
    setDrag(active.data.current as DragData);
    setOverId(null);
  };
  const endDrag = () => { setDrag(null); setOverId(null); };
  const onDragEnd = ({ active, over }: DragEndEvent) => {
    endDrag();
    const from = active.data.current as DragData | undefined;
    if (!from || !over || !canWrite) return;
    const target = String(over.id);
    if (target === 'zone:hidden') { if (from.kind !== 'hidden') takeOut(from.fid, true); return; }
    const to = list.indexOf(fidOf(target));
    if (to < 0 || (!isRowId(target) && !target.startsWith('tile:'))) return;
    if (from.kind === 'row' && isRowId(target)) { const at = list.indexOf(from.fid); if (at !== to) moveRow(at, to); return; }
    if (from.kind === 'row' || from.kind === 'tile') { swapRows(list.indexOf(from.fid), to); return; }
    placeAt(from.fid, to);
  };
  const nameOf = (id: UniqueIdentifier) => titleOf(fidOf(id));
  const whereIs = (id: UniqueIdentifier) => {
    if (id === 'zone:hidden') return 'the hidden campaigns';
    const row = rowById.get(fidOf(id));
    return row?.position ? `position ${row.position}` : 'the list';
  };
  const announcements: Announcements = {
    onDragStart: ({ active }) => `Picked up ${nameOf(active.id)}.`,
    onDragOver: ({ active, over }) => (over ? `${nameOf(active.id)} is over ${whereIs(over.id)}.` : `${nameOf(active.id)} is not over a position.`),
    onDragEnd: ({ active, over }) => (over ? `Dropped ${nameOf(active.id)} at ${whereIs(over.id)}.` : `Dropped ${nameOf(active.id)}. Nothing changed.`),
    onDragCancel: ({ active }) => `Cancelled. ${nameOf(active.id)} stays where it was.`,
  };
  const hintFor = (id: string): 'swap' | 'insert' | null => {
    if (!drag || drag.kind === 'row' || overId !== `row:${id}`) return null;
    return drag.kind === 'tile' ? 'swap' : 'insert';
  };
  const dragTitle = drag ? titleOf(drag.fid) : '';
  const dragKind: DragKind | null = drag?.kind ?? null;

  const changes = saved ? lineupChanges(saved, draft) : null;
  const summary = changes ? [
    changes.moved && `${changes.moved} moved`, changes.added && `${changes.added} added`, changes.removed && `${changes.removed} taken out`,
    changes.hidden && `${changes.hidden} hidden`, changes.shown && `${changes.shown} shown again`, changes.pinned && `${changes.pinned} pinned`, changes.unpinned && `${changes.unpinned} unpinned`,
  ].filter(Boolean).join(', ') : '';
  const loading = open.isLoading || lineup.isLoading;
  const failed = open.isError || lineup.isError;
  const previewState = { activeId: drag?.fid ?? null, overId, overKind: dragKind, highlightId: drag ? null : hoverId ?? flashId };
  // While a row is dragged over the list, the preview and the dragged card show where it would land.
  const landing = useMemo(() => {
    if (drag?.kind !== 'row' || !overId || !isRowId(overId)) return null;
    const next = moveWithPins(list, pinSet, list.indexOf(drag.fid), list.indexOf(fidOf(overId)));
    return next === list ? null : toRows(next, new Set([...order, drag.fid]));
  }, [drag, overId, list, pinSet, order]); // eslint-disable-line react-hooks/exhaustive-deps
  const landingAt = useMemo(() => (landing ? new Map(landing.map((r) => [r.id, r.position])) : null), [landing]);
  const preview = <LineupPreview rows={landing ? landing.filter((r) => r.position != null) : openRows} device={device} onDevice={setDevice} canWrite={canWrite} state={previewState} onFind={find} onHover={setHoverId} />;
  const shelves = (
    <>
      <MoreCampaigns items={more} canWrite={canWrite} flashId={flashId} actions={shelf} />
      <HiddenCampaigns items={hiddenItems} canWrite={canWrite} dragging={!!drag && dragKind !== 'hidden'} flashId={flashId} actions={shelf} />
    </>
  );

  return (
    <DashboardLayout>
    <div className="pb-28">
      <PageHeader
        title="Homepage"
        description='Set the order of "Fundraisers open now" on the homepage. Drag campaigns into place, pin the ones that must stay put, and save.'
        actions={<Button asChild variant="outline" size="sm"><a href="/" target="_blank" rel="noopener noreferrer"><ExternalLink className="mr-1.5 h-4 w-4" />View homepage</a></Button>}
      />
      {!canWrite && <p className="mb-4 rounded-md border border-border bg-muted/40 p-3 text-sm text-muted-foreground">You can view the homepage order. Only admins and staff can change it.</p>}
      {loading ? (
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_400px]"><div className="space-y-1.5">{Array.from({ length: 8 }, (_, i) => <Skeleton key={i} className="h-[68px] rounded-lg" />)}</div><Skeleton className="hidden h-80 rounded-xl xl:block" /></div>
      ) : failed ? (
        <div className="rounded-md border border-destructive/40 p-4 text-sm">The campaigns or the saved order could not be loaded. <Button variant="link" className="h-auto p-0" onClick={() => { open.refetch(); lineup.refetch(); }}>Try again</Button></div>
      ) : (
        <DndContext sensors={sensors} collisionDetection={collision} onDragStart={onDragStart} onDragOver={({ over }) => setOverId(over ? String(over.id) : null)} onDragEnd={onDragEnd} onDragCancel={endDrag}
          accessibility={{ announcements, screenReaderInstructions: { draggable: 'To move a campaign, press space on its handle, use the up and down arrow keys, then press space again to drop it, or escape to cancel.' } }}>
          <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_400px] xl:items-start">
            <section aria-labelledby="lineup-order" data-drop="zone:list" className="min-w-0">
              <div className="flex flex-wrap items-end justify-between gap-x-4 gap-y-2">
                <div className="min-w-0">
                  <h2 id="lineup-order" className="text-base font-semibold">Homepage order</h2>
                  <p className="mt-0.5 text-sm text-muted-foreground">
                    {openList.length} open {openList.length === 1 ? 'campaign' : 'campaigns'}: {openPlaced} in your lineup{pinned.length ? `, ${pinned.length} pinned` : ''}{hidden.length ? `, ${hidden.length} hidden` : ''}.
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-1">
                  {canWrite && (
                    <>
                      <ToolButton label="Undo" keys={`${MOD}Z`} onClick={() => dispatch({ type: 'undo' })} disabled={!hist.past.length}><Undo2 className="h-4 w-4" /></ToolButton>
                      <ToolButton label="Redo" keys={mac ? '⇧⌘Z' : 'Ctrl+Y'} onClick={() => dispatch({ type: 'redo' })} disabled={!hist.future.length}><Redo2 className="h-4 w-4" /></ToolButton>
                      <span className="mx-1 h-6 w-px bg-border" aria-hidden="true" />
                      <Tooltip>
                        <TooltipTrigger asChild><Button variant="outline" size="sm" className="h-9" onClick={shuffle} disabled={!openList.length}><Shuffle className="mr-1.5 h-4 w-4" />Shuffle</Button></TooltipTrigger>
                        <TooltipContent className="max-w-60">Every open campaign gets a random position. Pinned ones stay where they are; hidden ones stay hidden.</TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger asChild><Button variant="ghost" size="sm" className="h-9" onClick={resetToAutomatic} disabled={!order.length}><RotateCcw className="mr-1.5 h-4 w-4" />Automatic order</Button></TooltipTrigger>
                        <TooltipContent className="max-w-60">Clear your lineup and pins so the homepage uses the Trending order again. Hidden campaigns stay hidden.</TooltipContent>
                      </Tooltip>
                    </>
                  )}
                  <Popover open={findOpen} onOpenChange={setFindOpen}>
                    <PopoverTrigger asChild><Button variant="ghost" size="sm" className="h-9" aria-keyshortcuts="/"><Search className="mr-1.5 h-4 w-4" />Find<span className="ml-2 hidden sm:inline"><Kbd>/</Kbd></span></Button></PopoverTrigger>
                    <PopoverContent align="end" className="w-80 p-0">
                      <Command>
                        <CommandInput placeholder="Find a campaign by name" />
                        <CommandList className="max-h-72">
                          <CommandEmpty>No campaign found.</CommandEmpty>
                          <CommandGroup heading="Homepage order">
                            {rows.map((r) => <CommandItem key={r.id} value={`${r.title} ${r.id}`} onSelect={() => find(r.id)}><span className="mr-2 w-6 shrink-0 text-right text-xs font-semibold tabular-nums text-muted-foreground">{r.position ?? '–'}</span><span className="truncate">{r.title}</span></CommandItem>)}
                          </CommandGroup>
                          {more.length > 0 && <CommandGroup heading="More open campaigns">{more.map((f) => <CommandItem key={f.id} value={`${f.title} ${f.id}`} onSelect={() => find(f.id)}><span className="truncate">{f.title}</span></CommandItem>)}</CommandGroup>}
                          {hiddenItems.length > 0 && <CommandGroup heading="Hidden">{hiddenItems.map((h) => <CommandItem key={h.id} value={`${h.title} ${h.id}`} onSelect={() => find(h.id)}><EyeOff className="mr-2 h-3.5 w-3.5 text-muted-foreground" /><span className="truncate">{h.title}</span></CommandItem>)}</CommandGroup>}
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  {canWrite && (
                    <Popover>
                      <PopoverTrigger asChild><Button variant="ghost" size="icon" className="hidden h-9 w-9 sm:inline-flex" aria-label="Keyboard shortcuts"><Keyboard className="h-4 w-4" /></Button></PopoverTrigger>
                      <PopoverContent align="end" className="w-72 text-sm">
                        <p className="font-semibold">Shortcuts</p>
                        <dl className="mt-2 grid grid-cols-[auto_1fr] items-center gap-x-3 gap-y-1.5 text-muted-foreground">
                          <dt><Kbd>Space</Kbd></dt><dd>Pick up or drop the focused campaign</dd>
                          <dt><Kbd>↑</Kbd> <Kbd>↓</Kbd></dt><dd>Move it while picked up</dd>
                          <dt><Kbd>Esc</Kbd></dt><dd>Cancel a move, or clear the selection</dd>
                          <dt><Kbd>Shift</Kbd> + click</dt><dd>Select a range of campaigns</dd>
                          <dt><Kbd>{MOD}Z</Kbd></dt><dd>Undo</dd>
                          <dt><Kbd>{mac ? '⇧⌘Z' : 'Ctrl+Y'}</Kbd></dt><dd>Redo</dd>
                          <dt><Kbd>{MOD}S</Kbd></dt><dd>Save the lineup</dd>
                          <dt><Kbd>/</Kbd></dt><dd>Find a campaign</dd>
                        </dl>
                      </PopoverContent>
                    </Popover>
                  )}
                </div>
              </div>
              {canWrite && (
                <p className="mt-2 text-sm text-muted-foreground">
                  <span className="sm:hidden">Press and hold a campaign to drag it, or tap its number to type a position. Pinned ones stay put.</span>
                  <span className="hidden sm:inline">Drag a campaign by its row (on a touch screen, press and hold), or select its number and type a new position. Pinned campaigns stay at their position when others move and when you shuffle.</span>
                </p>
              )}
              {canWrite && !order.length && openList.length > 0 && (
                <p className="mt-3 rounded-lg bg-[hsl(var(--primary-97))] px-3 py-2.5 text-sm text-foreground">Nothing is saved yet, so this is the automatic Trending order. Move any campaign to start your lineup.</p>
              )}

              {!wide && (
                <Collapsible defaultOpen={window.innerWidth >= 768} className="mt-4">
                  <CollapsibleTrigger asChild>
                    <Button variant="outline" size="sm" className="group h-10 w-full justify-between"><span className="flex items-center gap-2"><Smartphone className="h-4 w-4" />What visitors see</span><ChevronDown className="h-4 w-4 transition-transform group-data-[state=open]:rotate-180" /></Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="mt-3">{preview}</CollapsibleContent>
                </Collapsible>
              )}

              {canWrite && picked.length > 0 && (
                <div role="toolbar" aria-label="Selected campaigns" className="sticky top-2 z-20 mt-3 flex flex-wrap items-center gap-1 rounded-lg border border-verify/30 bg-background/95 p-1.5 pl-3 shadow-sm backdrop-blur">
                  <span className="mr-1 text-sm font-medium">{picked.length} selected</span>
                  <Button size="sm" variant="ghost" className="h-8" onClick={bulk.top}><ArrowUpToLine className="mr-1.5 h-4 w-4" />Move to the top</Button>
                  {picked.length === 2 && <Button size="sm" variant="ghost" className="h-8" onClick={bulk.swap}><ArrowLeftRight className="mr-1.5 h-4 w-4" />Swap the two</Button>}
                  <Button size="sm" variant="ghost" className="h-8" onClick={bulk.pin}><Pin className="mr-1.5 h-4 w-4" />Pin</Button>
                  {picked.some((id) => pinSet.has(id)) && <Button size="sm" variant="ghost" className="h-8" onClick={bulk.unpin}><PinOff className="mr-1.5 h-4 w-4" />Unpin</Button>}
                  <Button size="sm" variant="ghost" className="h-8" onClick={bulk.hide}><EyeOff className="mr-1.5 h-4 w-4" />Hide</Button>
                  {picked.some((id) => order.includes(id)) && <Button size="sm" variant="ghost" className="h-8" onClick={bulk.remove}><X className="mr-1.5 h-4 w-4" />Take out of lineup</Button>}
                  <Button size="sm" variant="ghost" className="ml-auto h-8 text-muted-foreground" onClick={() => setSelected([])}>Clear</Button>
                </div>
              )}

              {rows.length ? (
                <SortableContext items={list.map((id) => `row:${id}`)} strategy={strategy}>
                  <ol className="mt-3 space-y-1.5" aria-label="Homepage order">
                    {rows.map((row, i) => (
                      <Fragment key={row.id}>
                        {i === 0 && <Boundary kind="laptop" />}
                        {row.position === LAPTOP_SHOWN + 1 && <Boundary kind="phone" />}
                        {row.position === HOMEPAGE_LIMIT + 1 && <Boundary kind="off" />}
                        {i === order.length && i > 0 && <Boundary kind="auto" />}
                        <SortableRow row={landingAt ? { ...row, position: landingAt.get(row.id) ?? null } : row} rows={rows} canWrite={canWrite} selected={selected.includes(row.id)} highlighted={!drag && hoverId === row.id} flashing={flashId === row.id} hint={hintFor(row.id)} maxPosition={openRows.length} showAuto={order.length > 0} actions={actions} />
                      </Fragment>
                    ))}
                  </ol>
                </SortableContext>
              ) : (
                <p className="mt-4 rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">There are no open campaigns right now, so the homepage shows none.</p>
              )}

              {!wide && <div className="mt-6 space-y-6">{shelves}</div>}
            </section>

            {wide && (
              <aside data-lineup-aside className={cn('space-y-6 xl:sticky xl:top-4 xl:overflow-y-auto xl:overscroll-contain xl:pb-2 xl:pr-1', canWrite && dirty ? 'xl:max-h-[calc(100vh-6.5rem)]' : 'xl:max-h-[calc(100vh-2rem)]')}>
                {preview}
                {shelves}
              </aside>
            )}
          </div>

          <DragOverlay dropAnimation={dragKind === 'row' ? undefined : null}>
            {drag && dragKind === 'row' && rowById.get(drag.fid) ? <DragRow row={landing?.find((r) => r.id === drag.fid) ?? rowById.get(drag.fid)!} /> : drag ? (
              <div className="flex h-full min-h-12 w-full cursor-grabbing items-center gap-2 overflow-hidden rounded-lg border border-primary/40 bg-card p-1.5 pr-3 shadow-[0_18px_40px_-12px_hsl(var(--ink)/0.35)]">
                <Thumb f={byId.get(drag.fid)} className="h-10 w-12" />
                <span className="line-clamp-2 min-w-0 text-xs font-medium leading-tight">{dragTitle}</span>
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      )}

      <p className="sr-only" aria-live="polite">{live}</p>

      {canWrite && dirty && (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t bg-background/95 backdrop-blur" role="region" aria-label="Unsaved changes">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-end gap-2 px-4 py-3">
            <span className="mr-auto min-w-0 text-sm"><span className="font-medium">Unsaved changes</span>{summary && <span className="text-muted-foreground">: {summary}</span>}</span>
            <Button variant="ghost" disabled={saving} onClick={discard}>Discard</Button>
            <Button disabled={saving} onClick={save} aria-keyshortcuts={`${MOD}S`}>{saving ? 'Saving…' : 'Save lineup'}{!saving && <span className="ml-2 hidden text-xs opacity-75 sm:inline">{MOD}S</span>}</Button>
          </div>
        </div>
      )}

      <AlertDialog open={leaveTo != null} onOpenChange={(o) => { if (!o) setLeaveTo(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Leave without saving?</AlertDialogTitle>
            <AlertDialogDescription>Your changes to the homepage order aren't saved, so visitors won't see them.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Stay here</AlertDialogCancel>
            <AlertDialogAction onClick={() => { const to = leaveTo; setLeaveTo(null); if (to) { dispatch({ type: 'load', draft: saved ?? EMPTY }); navigate(to); } }}>Leave without saving</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
    </DashboardLayout>
  );
}
