import { useDeferredValue, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { LayoutGrid, Search, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FundraiserCard } from '@/components/stories/FundraiserCard';
import { StartFundraiserCard } from '@/components/fundraiser/StartFundraiserCard';
import { NeedIcon } from '@/components/needs/NeedIcon';
import { useFundraisers } from '@/hooks/useFundraisers';
import { useZipStates } from '@/lib/zipStates';
import { HELP_NEEDS, needLabel } from '@/lib/helpNeeds';
import { US_STATES } from '@/data/usStates';
import { indexFundraisers, readSearchParams, searchFundraisers, writeSearchParams, type SearchParamsState, type SearchSort } from '@/lib/fundraiserSearch';
import { cn } from '@/lib/utils';

/** Cards shown before "Show more"; each one loads a photo. */
const PAGE = 24;
/** Typing settles into the address after this pause, so a search can be shared and Back returns to it. */
const WRITE_DELAY_MS = 600;

const SORT_LABELS: Record<SearchSort, string> = { best: 'Best match', newest: 'Newest', goal: 'Closest to goal' };
const stateName = (code: string) => US_STATES.find((s) => s.code === code)?.name ?? code;
const plural = (n: number, one: string, many: string) => `${n.toLocaleString('en-US')} ${n === 1 ? one : many}`;

/**
 * The fundraiser search (founder request, Nov 17 2026, modelled on GoFundMe's search): a search box, the
 * homepage's need chips (each need with open fundraisers, no counts), a state filter and a sort, then the matching fundraisers as
 * cards. Matching lives in src/lib/fundraiserSearch.ts; the search, need, state and sort are kept in the
 * address (?q=&need=&state=&sort=), so a result can be shared and Back returns to it. Used by /search and
 * the "Fundraisers open now" list on /stories.
 */
export function FundraiserSearch({ autoFocus = false }: { autoFocus?: boolean }) {
  const [params, setParams] = useSearchParams();
  const current = readSearchParams(params);
  const [text, setText] = useState(current.q);
  const written = useRef(current.q);
  const inputRef = useRef<HTMLInputElement>(null);
  const chipsRef = useRef<HTMLDivElement>(null);
  const [limit, setLimit] = useState(PAGE);

  const update = (next: Partial<SearchParamsState>) => {
    const merged = { ...readSearchParams(params), q: text, ...next };
    written.current = merged.q.trim();
    setParams(writeSearchParams(merged, params), { replace: true, preventScrollReset: true });
    setLimit(PAGE);
  };

  // Typing writes the address after a pause; Back or a new link puts its search in the box.
  useEffect(() => {
    if (text.trim() === written.current) return;
    const timer = window.setTimeout(() => update({ q: text }), WRITE_DELAY_MS);
    return () => window.clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text]);
  useEffect(() => {
    if (current.q.trim() !== written.current) { written.current = current.q.trim(); setText(current.q); }
  }, [current.q]);
  // On phones the needs scroll sideways; the chosen one is brought into view (sideways only).
  useEffect(() => {
    const row = chipsRef.current;
    const chip = row?.querySelector<HTMLElement>('[aria-pressed="true"]');
    if (row && chip && row.scrollWidth > row.clientWidth) row.scrollLeft = Math.max(0, chip.offsetLeft - row.offsetLeft - 16);
  }, [current.need]);
  useEffect(() => {
    if (autoFocus && !current.q) inputRef.current?.focus({ preventScroll: true });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoFocus]);

  const { data, isLoading, isError, refetch, isFetching } = useFundraisers();
  const zipStates = useZipStates(data ?? []);
  const index = useMemo(() => indexFundraisers(data ?? [], (f) => (f.zip_code ? zipStates.get(f.zip_code) : null)), [data, zipStates]);
  const query = useDeferredValue(text);
  const search = useMemo(() => searchFundraisers(index, { ...current, q: query }), [index, query, current.need, current.state, current.sort]); // eslint-disable-line react-hooks/exhaustive-deps
  const { results, partial, needCounts, parsed } = search;
  // As on the homepage: All needs, then each need with open fundraisers (and the chosen one), no counts.
  const chipNeeds = useMemo(() => {
    const open = new Set(index.flatMap((f) => f.needs));
    return ['all', ...HELP_NEEDS.map((n) => n.id).filter((id) => open.has(id) || id === current.need || isLoading)];
  }, [index, current.need, isLoading]);
  const states = useMemo(() => {
    const codes = new Set(index.map((f) => f.state).filter((s): s is string => !!s));
    if (current.state !== 'all') codes.add(current.state);
    return [...codes].sort((a, b) => stateName(a).localeCompare(stateName(b)));
  }, [index, current.state]);

  const q = query.trim();
  const needName = current.need !== 'all' ? needLabel(current.need) : '';
  const summary = [
    plural(results.length, q ? 'fundraiser' : 'open fundraiser', q ? 'fundraisers' : 'open fundraisers'),
    q && `for “${q}”`,
    needName && `in ${needName}`,
    current.state !== 'all' && `in ${stateName(current.state)}`,
  ].filter(Boolean).join(' ');
  const hintNeeds = current.need === 'all' && results.length > 0 ? parsed.needs.filter((id) => needCounts[id] > 0) : [];
  const filtered = !!q || current.need !== 'all' || current.state !== 'all';
  const clearAll = () => { setText(''); update({ q: '', need: 'all', state: 'all' }); inputRef.current?.focus(); };

  return (
    <div>
      <form role="search" className="max-w-3xl" onSubmit={(e) => { e.preventDefault(); update({ q: text }); inputRef.current?.blur(); }}>
        <label htmlFor="fundraiser-search" className="sr-only">Search fundraisers</label>
        <div className="relative">
          <Search className="pointer-events-none absolute left-5 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" aria-hidden="true" strokeWidth={1.75} />
          <input
            ref={inputRef}
            id="fundraiser-search"
            type="search"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Search by need, name or city"
            enterKeyHint="search"
            autoComplete="off"
            spellCheck={false}
            maxLength={120}
            className="h-14 w-full rounded-full border border-border bg-card pl-[3.25rem] pr-14 text-base text-foreground shadow-[0_1px_0_hsl(var(--border))] outline-none transition-colors placeholder:text-muted-foreground hover:border-primary/40 focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 md:h-16 md:text-lg [&::-webkit-search-cancel-button]:hidden"
          />
          {text && (
            <button type="button" onClick={() => { setText(''); update({ q: '' }); inputRef.current?.focus(); }} aria-label="Clear search" className="absolute right-2 top-1/2 inline-flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
              <X className="h-5 w-5" aria-hidden="true" />
            </button>
          )}
        </div>
      </form>

      <div ref={chipsRef} role="group" aria-label="Filter fundraisers by need" className="-mx-4 mt-6 flex snap-x scroll-px-4 gap-2 overflow-x-auto px-4 pb-1 scrollbar-none md:mx-0 md:flex-wrap md:overflow-visible md:scroll-px-0 md:px-0">
        {chipNeeds.map((id) => {
          const active = current.need === id;
          return (
            <button
              key={id}
              type="button"
              aria-pressed={active}
              onClick={() => update({ need: active && id !== 'all' ? 'all' : id })}
              className={cn('flex min-h-11 shrink-0 snap-start items-center gap-2 rounded-[14px] border px-3 text-[15px] leading-tight text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                active ? 'border-primary bg-[hsl(var(--primary-93))] font-semibold shadow-[inset_0_0_0_.5px_hsl(var(--primary))]' : 'border-border bg-card font-medium hover:border-primary/40 hover:bg-[hsl(var(--primary-97))]')}
            >
              {id === 'all' ? <LayoutGrid className="h-[18px] w-[18px] shrink-0 text-primary" aria-hidden="true" strokeWidth={1.75} /> : <NeedIcon id={id} className="h-[18px] w-[18px] shrink-0 text-primary" />}
              <span className="whitespace-nowrap">{id === 'all' ? 'All needs' : needLabel(id)}</span>
            </button>
          );
        })}
      </div>

      <div className="mt-8 flex flex-col gap-4 border-t border-border pt-6 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0">
          <p className="text-lg font-semibold text-foreground" aria-live="polite">{isLoading ? 'Loading fundraisers…' : summary}</p>
          {partial && <p className="mt-1 text-muted-foreground">No fundraiser matches every word, so these match some of them.</p>}
          {hintNeeds.length > 0 && (
            <p className="mt-1 text-muted-foreground">
              Includes every request for {hintNeeds.map(needLabel).join(' and ')}.{' '}
              {hintNeeds.length === 1 && <button type="button" onClick={() => update({ need: hintNeeds[0] })} className="font-medium text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">Show only these</button>}
            </p>
          )}
        </div>
        <div className="flex shrink-0 gap-2">
          <Select value={current.state} onValueChange={(state) => update({ state })}>
            <SelectTrigger aria-label="State" className="w-auto min-w-[9.5rem] rounded-full bg-card md:text-[15px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All states</SelectItem>
              {states.map((code) => <SelectItem key={code} value={code}>{stateName(code)}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={current.sort} onValueChange={(sort) => update({ sort: sort as SearchSort })}>
            <SelectTrigger aria-label="Sort" className="w-auto min-w-[9.5rem] rounded-full bg-card md:text-[15px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              {(Object.keys(SORT_LABELS) as SearchSort[]).map((sort) => <SelectItem key={sort} value={sort}>{sort === 'best' && !q ? 'Recommended' : SORT_LABELS[sort]}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      {isLoading ? (
        <div className="mt-8 grid gap-8 md:grid-cols-2 lg:grid-cols-3">{[1, 2, 3].map((item) => <div key={item}><Skeleton className="aspect-[4/3] w-full rounded-sm" /><Skeleton className="mt-4 h-5 w-3/4" /><Skeleton className="mt-3 h-2 w-full" /></div>)}</div>
      ) : isError ? (
        <div className="mt-8 border-y border-border py-12"><p>Fundraisers could not be loaded.</p><Button variant="outline" className="mt-4" disabled={isFetching} onClick={() => refetch()}>Try again</Button></div>
      ) : results.length > 0 ? (
        <>
          <div className="mt-8 grid gap-x-7 gap-y-12 md:grid-cols-2 lg:grid-cols-3">
            {results.slice(0, limit).map((fundraiser) => <FundraiserCard key={fundraiser.id} fundraiser={fundraiser} />)}
            {results.length <= limit && <StartFundraiserCard />}
          </div>
          {results.length > limit && <div className="mt-12 flex justify-center"><Button variant="outline" size="lg" className="rounded-full" onClick={() => setLimit((n) => n + PAGE)}>Show more fundraisers</Button></div>}
        </>
      ) : (
        <div className="mt-8 border-y border-border py-14">
          <h3 className="font-display text-3xl text-foreground md:text-4xl">
            {q ? `No fundraisers match “${q}”.` : needName ? `No one is asking for ${needName.toLowerCase()} right now.` : 'No open fundraisers here right now.'}
          </h3>
          <p className="mt-3 max-w-xl text-muted-foreground">
            {q ? 'Try a kind of help like groceries, rent or medicine, a city, or a store name.' : 'If you need help, you can start the first request in a few minutes.'}
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            {filtered && <Button variant="outline" onClick={clearAll}>Clear search</Button>}
            <Button asChild><Link to="/apply">Start a fundraiser</Link></Button>
          </div>
        </div>
      )}
    </div>
  );
}
