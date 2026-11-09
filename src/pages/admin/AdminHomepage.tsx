import { useEffect, useMemo, useRef, useState, type DragEvent } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowDown, ArrowUp, Eye, EyeOff, ExternalLink, GripVertical, Plus, X } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader, useTeamRole } from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import { sb, rpc, usd } from '@/lib/adminApi';
import { cn } from '@/lib/utils';
import { useFundraisers, type Fundraiser } from '@/hooks/useFundraisers';
import { useHomepageLineup } from '@/hooks/useHomepageLineup';
import { HOMEPAGE_LIMIT, splitLineup } from '@/lib/homepageLineup';
import { resolveFundraiserImage, transformedFundraiserImage } from '@/lib/fundraiserImages';

/**
 * Admin → Homepage (founder request, Nov 9, 2026): which open campaigns lead "Fundraisers open now" on the
 * homepage, in what order, and which are kept off it. Placed campaigns come first in the Trending view;
 * the rest follow in the site's ranked order; hidden ones never show on the homepage. Saved in one audited
 * call (admin_set_homepage_lineup); rules in src/lib/homepageLineup.ts.
 */
type Closed = { id: string; title: string; status: string };

function Thumb({ f }: { f?: Fundraiser }) {
  const src = f ? resolveFundraiserImage(f) : null;
  const url = src ? transformedFundraiserImage(src, 160) ?? src : null;
  return url ? <img src={url} alt="" className="h-12 w-16 shrink-0 rounded-md object-cover" loading="lazy" /> : <span className="h-12 w-16 shrink-0 rounded-md bg-muted" aria-hidden="true" />;
}

function Facts({ f }: { f: Fundraiser }) {
  return (
    <span className="mt-0.5 block text-xs text-muted-foreground">
      {usd(f.live_raised)} raised · {f.live_donations_count} {f.live_donations_count === 1 ? 'donation' : 'donations'}
      {f.is_example ? ' · Example campaign' : ''}
    </span>
  );
}

export default function AdminHomepage() {
  const { canWrite } = useTeamRole();
  const qc = useQueryClient();
  const open = useFundraisers();
  const lineup = useHomepageLineup({ fresh: true });
  const [order, setOrder] = useState<string[]>([]);
  const [hidden, setHidden] = useState<string[]>([]);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [dragId, setDragId] = useState<string | null>(null);
  const [dropAt, setDropAt] = useState<number | null>(null);
  const loaded = useRef(false);

  // Start from what's saved (again after a save or Discard).
  const reset = () => {
    const { order: o, hidden: h } = splitLineup(lineup.data ?? []);
    setOrder(o); setHidden([...h]); setDirty(false);
  };
  useEffect(() => { if (lineup.data && (!loaded.current || !dirty)) { loaded.current = true; reset(); } }, [lineup.data]); // eslint-disable-line react-hooks/exhaustive-deps

  const byId = useMemo(() => new Map((open.data ?? []).map((f) => [f.id, f])), [open.data]);
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
  const automatic = useMemo(() => (open.data ?? []).filter((f) => !order.includes(f.id) && !hidden.includes(f.id)), [open.data, order, hidden]);

  const edit = (o: string[], h: string[]) => { setOrder(o); setHidden(h); setDirty(true); };
  const move = (id: string, to: number) => {
    const rest = order.filter((x) => x !== id);
    rest.splice(Math.max(0, Math.min(rest.length, to)), 0, id);
    edit(rest, hidden);
  };
  const place = (id: string) => edit([...order.filter((x) => x !== id), id], hidden.filter((x) => x !== id));
  const unplace = (id: string) => edit(order.filter((x) => x !== id), hidden);
  const hide = (id: string) => edit(order.filter((x) => x !== id), [...hidden.filter((x) => x !== id), id]);
  const show = (id: string) => edit(order, hidden.filter((x) => x !== id));

  // Drag and drop within the lineup (rows also have up/down buttons for keyboards and touch screens).
  const onDragOver = (event: DragEvent<HTMLLIElement>, index: number) => {
    if (!dragId) return;
    event.preventDefault();
    const box = event.currentTarget.getBoundingClientRect();
    setDropAt(event.clientY < box.top + box.height / 2 ? index : index + 1);
  };
  const onDrop = (event: DragEvent) => {
    event.preventDefault();
    if (dragId && dropAt != null) {
      const from = order.indexOf(dragId);
      if (from >= 0) move(dragId, dropAt > from ? dropAt - 1 : dropAt);
      else edit([...order.slice(0, dropAt), dragId, ...order.slice(dropAt)], hidden.filter((x) => x !== dragId));
    }
    setDragId(null); setDropAt(null);
  };

  const save = async () => {
    setSaving(true);
    try {
      await rpc('admin_set_homepage_lineup', { _order: order, _hidden: hidden });
      setDirty(false);
      await qc.invalidateQueries({ queryKey: ['homepage-lineup'] });
      toast({ title: 'Homepage lineup saved', description: 'The homepage shows it right away.' });
    } catch (error) {
      toast({ title: 'Could not save the lineup', description: (error as Error).message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const title = (id: string) => byId.get(id)?.title ?? closedById.get(id)?.title ?? 'Campaign';
  const loading = open.isLoading || lineup.isLoading;
  const failed = open.isError || lineup.isError;

  return (
    <DashboardLayout>
    <div className="pb-28">
      <PageHeader
        title="Homepage"
        description={`Choose which campaigns lead "Fundraisers open now" and in what order. Your picks come first in the Trending view; every other open campaign follows automatically. Hidden campaigns never show on the homepage. The homepage shows up to ${HOMEPAGE_LIMIT}.`}
        actions={<Button asChild variant="outline" size="sm"><a href="/" target="_blank" rel="noopener noreferrer"><ExternalLink className="mr-1.5 h-4 w-4" />View homepage</a></Button>}
      />
      {!canWrite && <p className="mb-4 rounded-md border border-border bg-muted/40 p-3 text-sm text-muted-foreground">You can view the lineup. Only admins and staff can change it.</p>}
      {loading ? <p className="text-sm text-muted-foreground">Loading campaigns…</p> : failed ? (
        <div className="rounded-md border border-destructive/40 p-4 text-sm">The campaigns or the saved lineup could not be loaded. <Button variant="link" className="h-auto p-0" onClick={() => { open.refetch(); lineup.refetch(); }}>Try again</Button></div>
      ) : (
        <div className="grid gap-8 xl:grid-cols-[1.15fr_1fr]">
          <section aria-labelledby="lineup-placed">
            <h2 id="lineup-placed" className="text-base font-semibold">On the homepage, in this order</h2>
            <p className="mt-1 text-sm text-muted-foreground">Drag to reorder, or use the arrows. Position 1 is the big card at the top.</p>
            <ol className="mt-3 space-y-2" onDragOver={(e) => { if (dragId && !order.length) { e.preventDefault(); setDropAt(0); } }} onDrop={onDrop}>
              {order.length === 0 && (
                <li className={cn('rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground', dropAt === 0 && 'border-primary bg-primary/5')}>
                  No campaigns placed yet: the homepage uses its automatic Trending order. Use "Place" on a campaign to pin it here.
                </li>
              )}
              {order.map((id, index) => {
                const f = byId.get(id);
                const gone = closedById.get(id);
                return (
                  <li
                    key={id}
                    draggable={canWrite}
                    onDragStart={(e) => { setDragId(id); e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('text/plain', id); }}
                    onDragEnd={() => { setDragId(null); setDropAt(null); }}
                    onDragOver={(e) => onDragOver(e, index)}
                    className={cn('relative flex items-center gap-3 rounded-lg border bg-card p-2.5', dragId === id && 'opacity-50', dropAt === index && 'before:absolute before:-top-[5px] before:left-0 before:right-0 before:h-0.5 before:rounded before:bg-primary', dropAt === index + 1 && index === order.length - 1 && 'after:absolute after:-bottom-[5px] after:left-0 after:right-0 after:h-0.5 after:rounded after:bg-primary')}
                  >
                    {canWrite && <GripVertical className="h-4 w-4 shrink-0 cursor-grab text-muted-foreground" aria-hidden="true" />}
                    <span className="w-7 shrink-0 text-center text-sm font-semibold tabular-nums">{index + 1}</span>
                    <Thumb f={f} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium">{title(id)}</span>
                      {f ? <Facts f={f} /> : <span className="mt-0.5 block text-xs text-amber-700">Not open right now{gone ? ` (${gone.status})` : ''}: it won't show until it's open again.</span>}
                    </span>
                    {canWrite && (
                      <span className="flex shrink-0 items-center gap-1">
                        <Button size="icon" variant="ghost" className="h-8 w-8" disabled={index === 0} onClick={() => move(id, index - 1)} aria-label={`Move ${title(id)} up`}><ArrowUp className="h-4 w-4" /></Button>
                        <Button size="icon" variant="ghost" className="h-8 w-8" disabled={index === order.length - 1} onClick={() => move(id, index + 1)} aria-label={`Move ${title(id)} down`}><ArrowDown className="h-4 w-4" /></Button>
                        <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => hide(id)} aria-label={`Hide ${title(id)} from the homepage`} title="Hide from the homepage"><EyeOff className="h-4 w-4" /></Button>
                        <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => unplace(id)} aria-label={`Remove ${title(id)} from the lineup`} title="Remove from the lineup (it goes back to the automatic order)"><X className="h-4 w-4" /></Button>
                      </span>
                    )}
                  </li>
                );
              })}
            </ol>
          </section>

          <div className="space-y-8">
            <section aria-labelledby="lineup-auto">
              <h2 id="lineup-auto" className="text-base font-semibold">Shown automatically after your picks</h2>
              <p className="mt-1 text-sm text-muted-foreground">Every other open campaign, in the Trending order (recent gifts, amount raised, donors, progress). Drag one into the lineup or use "Place".</p>
              <ul className="mt-3 space-y-2">
                {automatic.length === 0 && <li className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">Every open campaign is placed or hidden.</li>}
                {automatic.map((f, index) => (
                  <li key={f.id} draggable={canWrite} onDragStart={(e) => { setDragId(f.id); e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('text/plain', f.id); }} onDragEnd={() => { setDragId(null); setDropAt(null); }} className={cn('flex items-center gap-3 rounded-lg border bg-card p-2.5', dragId === f.id && 'opacity-50')}>
                    <span className="w-7 shrink-0 text-center text-sm tabular-nums text-muted-foreground">{order.filter((id) => byId.has(id)).length + index + 1}</span>
                    <Thumb f={f} />
                    <span className="min-w-0 flex-1"><span className="block truncate text-sm font-medium">{f.title}</span><Facts f={f} /></span>
                    {canWrite && (
                      <span className="flex shrink-0 items-center gap-1">
                        <Button size="sm" variant="outline" className="h-8" onClick={() => place(f.id)}><Plus className="mr-1 h-3.5 w-3.5" />Place</Button>
                        <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => hide(f.id)} aria-label={`Hide ${f.title} from the homepage`} title="Hide from the homepage"><EyeOff className="h-4 w-4" /></Button>
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </section>

            <section aria-labelledby="lineup-hidden">
              <h2 id="lineup-hidden" className="text-base font-semibold">Hidden from the homepage</h2>
              <p className="mt-1 text-sm text-muted-foreground">These stay open on their own pages and on the fundraisers page; they just don't show on the homepage.</p>
              <ul className="mt-3 space-y-2">
                {hidden.length === 0 && <li className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">Nothing hidden.</li>}
                {hidden.map((id) => {
                  const f = byId.get(id);
                  return (
                    <li key={id} className="flex items-center gap-3 rounded-lg border bg-muted/30 p-2.5">
                      <Thumb f={f} />
                      <span className="min-w-0 flex-1"><span className="block truncate text-sm font-medium">{title(id)}</span>{f ? <Facts f={f} /> : <span className="mt-0.5 block text-xs text-muted-foreground">Not open right now</span>}</span>
                      {canWrite && <Button size="sm" variant="outline" className="h-8" onClick={() => show(id)}><Eye className="mr-1 h-3.5 w-3.5" />Show again</Button>}
                    </li>
                  );
                })}
              </ul>
            </section>
          </div>
        </div>
      )}

      {canWrite && dirty && (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t bg-background/95 backdrop-blur">
          <div className="mx-auto flex max-w-5xl items-center justify-end gap-3 px-4 py-3">
            <span className="mr-auto text-sm text-muted-foreground">You have unsaved changes to the homepage lineup.</span>
            <Button variant="ghost" disabled={saving} onClick={reset}>Discard</Button>
            <Button disabled={saving} onClick={save}>{saving ? 'Saving…' : 'Save lineup'}</Button>
          </div>
        </div>
      )}
    </div>
    </DashboardLayout>
  );
}
