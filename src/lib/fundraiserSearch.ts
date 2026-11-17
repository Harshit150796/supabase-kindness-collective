/**
 * Fundraiser search (founder request, Nov 17 2026), modelled on GoFundMe's: one box that finds a
 * fundraiser by what it is for, its title or story, the organizer, the city or state, or a store it asks
 * for, plus the same filters GoFundMe offers (purpose → our needs, location → state, progress → "closest to
 * goal"). Typing a kind of help ("medical", "rent", "diapers") also finds every request for that need, the
 * way GoFundMe's "medical" search shows medical fundraisers. Everything here is pure; the page
 * (src/components/search/FundraiserSearch.tsx) feeds it the open fundraisers useFundraisers already loads.
 */
import { HELP_NEEDS, needById, requestNeeds } from './helpNeeds.ts';
import { US_STATES } from '../data/usStates.ts';

/** Words that point to a need. Need ids are HELP_NEEDS ids; old category ids are mapped by needById. */
export const NEED_WORDS: Record<string, string[]> = {
  food: ['food', 'grocery', 'groceries', 'pantry', 'hungry', 'hunger', 'feed', 'feeding', 'eat', 'eating', 'snap', 'supermarket', 'produce', 'milk', 'bread'],
  meals: ['meal', 'meals', 'dinner', 'lunch', 'breakfast', 'delivery', 'deliver', 'takeout', 'restaurant', 'cooked'],
  healthcare: ['health', 'healthcare', 'medical', 'medicine', 'medication', 'prescription', 'pharmacy', 'doctor', 'hospital', 'surgery', 'cancer', 'treatment', 'therapy', 'recovery', 'clinic', 'dental', 'dentist', 'sick', 'illness', 'injury', 'chemo', 'insulin', 'healing', 'disability'],
  childcare: ['baby', 'babies', 'kid', 'kids', 'child', 'children', 'childcare', 'diaper', 'diapers', 'formula', 'toddler', 'newborn', 'infant', 'daycare'],
  clothing: ['clothing', 'clothes', 'shoe', 'shoes', 'coat', 'jacket', 'uniform', 'boots'],
  education: ['school', 'education', 'college', 'university', 'tuition', 'book', 'books', 'student', 'students', 'laptop', 'supplies', 'learning', 'class', 'classes', 'teacher'],
  transportation: ['transportation', 'transport', 'car', 'gas', 'fuel', 'ride', 'rides', 'bus', 'train', 'travel', 'commute', 'lyft', 'repair', 'tires', 'vehicle'],
  utilities: ['rent', 'bill', 'bills', 'utility', 'utilities', 'electric', 'electricity', 'power', 'water', 'heat', 'heating', 'housing', 'house', 'home', 'eviction', 'evicted', 'homeless', 'homelessness', 'shelter', 'mortgage', 'internet', 'phone'],
  essentials: ['essential', 'essentials', 'toiletries', 'toiletry', 'hygiene', 'cleaning', 'household', 'soap', 'detergent', 'supplies'],
  emergency: ['emergency', 'urgent', 'crisis', 'fire', 'flood', 'disaster', 'hurricane', 'storm', 'tornado', 'accident', 'wildfire', 'earthquake'],
};

/** Words that carry no meaning in a fundraiser search ("help my family with rent" → family, rent). */
const STOPWORDS = new Set(('a an the and or of to in on at for with by from as my our your his her their its me we us i you it is are was be ' +
  'this that these those please help helping helps need needs needed fundraiser fundraisers fundraising support supporting donate donation ' +
  'donations give giving someone').split(' '));

export const SORTS = ['best', 'newest', 'goal'] as const;
export type SearchSort = typeof SORTS[number];

export interface SearchParamsState {
  q: string;
  /** A HELP_NEEDS id, or 'all'. */
  need: string;
  /** A two-letter state code, or 'all'. */
  state: string;
  sort: SearchSort;
}

export interface SearchableFundraiser {
  id: string;
  title: string;
  story?: string | null;
  category?: string | null;
  help_categories?: string[] | null;
  preferred_brands?: string[] | null;
  city?: string | null;
  state_code?: string | null;
  organizer_name?: string;
  monthly_goal: number;
  live_raised: number;
  created_at: string;
}

const STATE_CODES = new Set(US_STATES.map((s) => s.code));

/** Lower case, no accents, letters and digits only, single spaces. */
export function normalizeText(text: string | null | undefined): string {
  return (text ?? '').normalize('NFKD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/['’]/g, '').replace(/[^a-z0-9]+/g, ' ').trim();
}

/** A rough singular, so "bills" finds "bill" and "groceries" finds "grocery". */
export function stem(word: string): string {
  if (word.length > 4 && word.endsWith('ies')) return `${word.slice(0, -3)}y`;
  if (word.length > 3 && word.endsWith('s') && !word.endsWith('ss')) return word.slice(0, -1);
  return word;
}

/** At most one letter added, dropped, changed or two swapped ("medcal", "grocerys"). Words of 5+ letters only. */
function nearlySame(a: string, b: string): boolean {
  if (a.length < 5 || b.length < 5 || Math.abs(a.length - b.length) > 1) return false;
  let i = 0;
  while (i < a.length && i < b.length && a[i] === b[i]) i++;
  if (i === a.length && i === b.length) return true;
  if (a.length === b.length) {
    if (a.slice(i + 1) === b.slice(i + 1)) return true;
    return a[i] === b[i + 1] && a[i + 1] === b[i] && a.slice(i + 2) === b.slice(i + 2);
  }
  return a.length > b.length ? a.slice(i + 1) === b.slice(i) : a.slice(i) === b.slice(i + 1);
}

type Hit = 'exact' | 'prefix' | 'typo' | null;

/** How well one query word matches one word of text. Prefixes count from 3 letters ("groc" → groceries). */
function wordHit(token: string, word: string, typos: boolean): Hit {
  if (token === word || stem(token) === stem(word)) return 'exact';
  if (token.length >= 3 && word.startsWith(token)) return 'prefix';
  if (typos && nearlySame(stem(token), stem(word))) return 'typo';
  return null;
}

function bestHit(token: string, words: Iterable<string>, typos: boolean): Hit {
  let best: Hit = null;
  for (const word of words) {
    const hit = wordHit(token, word, typos);
    if (hit === 'exact') return hit;
    if (hit === 'prefix' || (hit === 'typo' && !best)) best = hit;
  }
  return best;
}

/** The needs a query word points to ("med" → healthcare, "rent" → utilities). */
export function needsForWord(token: string): string[] {
  const out: string[] = [];
  for (const [id, words] of Object.entries(NEED_WORDS)) if (bestHit(token, words, token.length >= 5)) out.push(id);
  return out;
}

const STATE_NAMES = US_STATES.map((s) => ({ code: s.code, name: normalizeText(s.name) })).sort((a, b) => b.name.length - a.name.length);

export interface ParsedQuery {
  /** Meaningful words, in order. */
  tokens: string[];
  /** States named in full ("new york", "texas"); results must be in one of them. */
  states: string[];
  /** Needs the words point to, for the "show only" hint. */
  needs: string[];
  /** The whole query, normalized, for the title phrase bonus. */
  phrase: string;
}

export function parseQuery(q: string): ParsedQuery {
  let text = ` ${normalizeText(q)} `;
  const states: string[] = [];
  for (const s of STATE_NAMES) {
    if (text.includes(` ${s.name} `)) { states.push(s.code); text = text.replace(` ${s.name} `, ' '); }
  }
  const tokens: string[] = [];
  for (const word of text.trim().split(' ')) if (word && !STOPWORDS.has(word) && !tokens.includes(word)) tokens.push(word);
  const needs = HELP_NEEDS.map((n) => n.id).filter((id) => tokens.some((t) => needsForWord(t).includes(id)));
  return { tokens: tokens.slice(0, 8), states, needs, phrase: normalizeText(q) };
}

/** A fundraiser's needs as current HELP_NEEDS ids (old ids such as health and travel are mapped). */
export function fundraiserNeeds(f: Pick<SearchableFundraiser, 'help_categories' | 'category'>): string[] {
  const out: string[] = [];
  for (const id of requestNeeds(f.help_categories, f.category)) {
    const need = needById(id)?.id;
    if (need && !out.includes(need)) out.push(need);
  }
  return out;
}

/** What a search reads of one fundraiser, worked out once per list rather than once per keystroke. */
export interface IndexedFundraiser<T> {
  item: T;
  rank: number;
  needs: string[];
  state: string | null;
  title: string;
  titleWords: string[];
  storyWords: Set<string>;
  storeWords: string[];
  placeWords: string[];
  organizerWords: string[];
  progress: number;
}

const words = (text: string | null | undefined) => normalizeText(text).split(' ').filter(Boolean);

/** `list` is in the site's order (rankFundraisers); `stateOf` may add a state found from the ZIP code. */
export function indexFundraisers<T extends SearchableFundraiser>(list: T[], stateOf?: (f: T) => string | null | undefined): IndexedFundraiser<T>[] {
  return list.map((item, rank) => {
    const code = (item.state_code?.trim().toUpperCase() || stateOf?.(item)?.toUpperCase() || '') || null;
    const state = code && STATE_CODES.has(code) ? code : null;
    const stateName = state ? US_STATES.find((s) => s.code === state)?.name : '';
    return {
      item,
      rank,
      needs: fundraiserNeeds(item),
      state,
      title: normalizeText(item.title),
      titleWords: words(item.title),
      storyWords: new Set(words(item.story)),
      storeWords: words((item.preferred_brands ?? []).join(' ')),
      placeWords: words(`${item.city ?? ''} ${stateName ?? ''}`),
      organizerWords: words(item.organizer_name),
      progress: item.monthly_goal > 0 ? Math.min(1, Math.max(0, item.live_raised) / item.monthly_goal) : 0,
    };
  });
}

const POINTS = { title: { exact: 6, prefix: 4, typo: 3 }, store: { exact: 4, prefix: 3, typo: 2 }, place: { exact: 4, prefix: 3, typo: 2 }, organizer: { exact: 4, prefix: 3, typo: 2 }, story: { exact: 2, prefix: 1, typo: 0 } } as const;

/** Asking for the need a word points to ("therapy" → Health & pharmacy). Added to the best text match. */
const NEED_POINTS = 3;

/**
 * Points for one query word against one fundraiser; 0 means the word is not found anywhere in it. The best
 * text match counts, plus NEED_POINTS when the fundraiser asks for the need the word points to, so a
 * request that also says the word leads the ones that only share the need.
 */
function tokenScore<T>(token: string, tokenNeeds: string[], f: IndexedFundraiser<T>): number {
  let best = 0;
  const take = (field: keyof typeof POINTS, hit: Hit) => { if (hit) best = Math.max(best, POINTS[field][hit]); };
  take('title', bestHit(token, f.titleWords, true));
  take('store', bestHit(token, f.storeWords, true));
  take('place', bestHit(token, f.placeWords, true));
  if (token.length === 2 && f.state === token.toUpperCase()) best = Math.max(best, 4);
  take('organizer', bestHit(token, f.organizerWords, false));
  if (best < POINTS.story.exact) {
    if (f.storyWords.has(token)) best = Math.max(best, 2);
    else take('story', bestHit(token, f.storyWords, false));
  }
  return best + (tokenNeeds.some((id) => f.needs.includes(id)) ? NEED_POINTS : 0);
}

export interface SearchResult<T> {
  results: T[];
  /** No fundraiser had every word, so these have some of them. */
  partial: boolean;
  /** Count per need (and 'all') for the need chips: the query and state applied, the need not. */
  needCounts: Record<string, number>;
  parsed: ParsedQuery;
}

export function searchFundraisers<T extends SearchableFundraiser>(index: IndexedFundraiser<T>[], params: SearchParamsState): SearchResult<T> {
  const parsed = parseQuery(params.q);
  const inPlace = (f: IndexedFundraiser<T>) =>
    (params.state === 'all' || f.state === params.state) && (!parsed.states.length || (!!f.state && parsed.states.includes(f.state)));
  const placed = index.filter(inPlace);

  type Scored = { f: IndexedFundraiser<T>; score: number; found: number };
  const tokenNeeds = parsed.tokens.map(needsForWord);
  const score = (f: IndexedFundraiser<T>): Scored => {
    let total = 0, found = 0;
    parsed.tokens.forEach((token, i) => { const s = tokenScore(token, tokenNeeds[i], f); if (s > 0) { total += s; found++; } });
    if (parsed.tokens.length > 1 && f.title.includes(parsed.phrase)) total += 6;
    return { f, score: total, found };
  };

  let partial = false;
  let matched: Scored[];
  if (!parsed.tokens.length) matched = placed.map((f) => ({ f, score: 0, found: 0 }));
  else {
    const scored = placed.map(score);
    matched = scored.filter((s) => s.found === parsed.tokens.length);
    if (!matched.length) { matched = scored.filter((s) => s.found > 0); partial = matched.length > 0; }
  }

  const needCounts: Record<string, number> = { all: matched.length };
  for (const n of HELP_NEEDS) needCounts[n.id] = 0;
  for (const { f } of matched) for (const id of f.needs) needCounts[id] = (needCounts[id] ?? 0) + 1;

  const need = params.need !== 'all' ? needById(params.need)?.id ?? params.need : 'all';
  const shown = need === 'all' ? matched : matched.filter((s) => s.f.needs.includes(need));
  const time = (s: string) => { const t = Date.parse(s); return Number.isFinite(t) ? t : 0; };
  shown.sort((a, b) => {
    if (params.sort === 'newest') return time(b.f.item.created_at) - time(a.f.item.created_at) || a.f.rank - b.f.rank;
    if (params.sort === 'goal') return b.f.progress - a.f.progress || a.f.rank - b.f.rank;
    return (parsed.tokens.length ? b.found - a.found || b.score - a.score : 0) || a.f.rank - b.f.rank;
  });
  return { results: shown.map((s) => s.f.item), partial, needCounts, parsed };
}

/** Reads ?q=&need=&state=&sort= safely; anything unknown falls back to the default. */
export function readSearchParams(params: URLSearchParams): SearchParamsState {
  const q = (params.get('q') ?? '').slice(0, 120);
  const rawNeed = params.get('need') ?? 'all';
  const need = rawNeed === 'all' ? 'all' : needById(rawNeed)?.id ?? 'all';
  const rawState = (params.get('state') ?? 'all').toUpperCase();
  const state = STATE_CODES.has(rawState) ? rawState : 'all';
  const rawSort = params.get('sort') ?? 'best';
  const sort = (SORTS as readonly string[]).includes(rawSort) ? rawSort as SearchSort : 'best';
  return { q, need, state, sort };
}

/** Writes only what differs from the defaults, so a plain search page has a plain address. */
export function writeSearchParams(state: SearchParamsState, base?: URLSearchParams): URLSearchParams {
  const out = new URLSearchParams(base);
  const set = (key: string, value: string, fallback: string) => { if (value && value !== fallback) out.set(key, value); else out.delete(key); };
  set('q', state.q.trim(), '');
  set('need', state.need, 'all');
  set('state', state.state, 'all');
  set('sort', state.sort, 'best');
  return out;
}
