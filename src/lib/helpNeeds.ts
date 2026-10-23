/**
 * What a recipient can ask for, and the stores that fit each need. Founder request: a recipient picks
 * one or more needs and, for each, the stores whose coupons would help most, so donors give where
 * the help is useful. Store names are the donor catalogue's own names (src/data/brandLogos.ts), so a
 * request always matches something a donor can choose. Icons live in the UI (NeedIcon).
 *
 * `fundraisers.category` keeps the first need (older pages and filters read it);
 * `fundraisers.help_categories` keeps them all and `preferred_brands` the chosen store names.
 */
export interface HelpNeed {
  id: string;
  label: string;
  /** One line on what the need covers, in the recipient's words. */
  hint: string;
  /** Stores shown first for this need, best fit first. */
  stores: string[];
}

export const HELP_NEEDS: HelpNeed[] = [
  { id: 'food', label: 'Food & groceries', hint: 'Weekly groceries and pantry staples', stores: ['Walmart', 'Kroger', 'Aldi', 'Costco', 'Publix', 'Safeway', 'Whole Foods', 'Instacart'] },
  { id: 'meals', label: 'Meals & delivery', hint: 'Hot meals and food brought to your door', stores: ['DoorDash', 'Uber', 'Grubhub', 'Postmates', 'Subway', 'Panera Bread', "McDonald's", 'Chipotle'] },
  { id: 'healthcare', label: 'Health & pharmacy', hint: 'Medicine, first aid and recovery basics', stores: ['CVS', 'Walgreens', 'Walmart', 'Target', 'Amazon'] },
  { id: 'childcare', label: 'Baby & kids', hint: 'Diapers, formula and children’s needs', stores: ['Target', 'Walmart', 'Amazon', 'CVS', 'Walgreens', 'Costco'] },
  { id: 'clothing', label: 'Clothing', hint: 'Clothes and shoes for work, school or weather', stores: ['Target', 'Walmart', 'Amazon', 'Costco'] },
  { id: 'education', label: 'School & learning', hint: 'Supplies, books and a device for school', stores: ['Amazon', 'Target', 'Walmart', 'Best Buy'] },
  { id: 'transportation', label: 'Getting around', hint: 'Rides to work, school or appointments', stores: ['Uber', 'Walmart', 'Target', 'Amazon'] },
  { id: 'utilities', label: 'Home & bills', hint: 'Household basics so money stretches to bills', stores: ['Walmart', 'Target', 'Home Depot', "Lowe's", 'Costco', 'Amazon'] },
  { id: 'essentials', label: 'Everyday essentials', hint: 'Cleaning, toiletries and household goods', stores: ['Walmart', 'Target', 'Amazon', 'Costco', 'CVS', 'Walgreens'] },
  { id: 'emergency', label: 'Emergency', hint: 'Fast help after a fire, flood or crisis', stores: ['Walmart', 'Target', 'Amazon', 'Kroger', 'CVS', 'DoorDash'] },
];

/** The most stores one request can name. Donors choose up to five per gift from these, or any other. */
export const MAX_PREFERRED_STORES = 8;

/** Older category ids written by earlier forms and the admin panel. */
const ALIASES: Record<string, string> = { health: 'healthcare', household: 'utilities', other: 'essentials', travel: 'transportation' };
const LEGACY_LABELS: Record<string, string> = { household: 'Housing', other: 'Other needs', travel: 'Travel' };

const BY_ID = new Map(HELP_NEEDS.map((n) => [n.id, n]));

export function needById(id: string | null | undefined): HelpNeed | undefined {
  if (!id) return undefined;
  return BY_ID.get(id) ?? BY_ID.get(ALIASES[id] ?? '');
}

/** A need's label for any category id, old or new; unknown ids read as written. */
export function needLabel(id: string | null | undefined): string {
  if (!id) return '';
  return LEGACY_LABELS[id] ?? needById(id)?.label ?? id.charAt(0).toUpperCase() + id.slice(1);
}

/** Needs in the order chosen, without repeats or unknown ids; falls back to the single category. */
export function requestNeeds(helpCategories: string[] | null | undefined, category?: string | null): string[] {
  const list = helpCategories?.length ? helpCategories : category ? [category] : [];
  const out: string[] = [];
  for (const id of list) if (id && !out.includes(id)) out.push(id);
  return out;
}

/**
 * Stores to offer for the chosen needs, need by need, each store once (under the first need that
 * lists it). Used by the application's store picker.
 */
export function storesByNeed(needIds: string[]): { need: HelpNeed; stores: string[] }[] {
  const seen = new Set<string>();
  const groups: { need: HelpNeed; stores: string[] }[] = [];
  for (const id of needIds) {
    const need = needById(id);
    if (!need) continue;
    const stores = need.stores.filter((s) => !seen.has(s));
    stores.forEach((s) => seen.add(s));
    if (stores.length) groups.push({ need, stores });
  }
  return groups;
}

/** Turns "Syracuse" + "NY" into "Syracuse, NY"; either part may be missing. */
export function cityState(city?: string | null, stateCode?: string | null): string | null {
  const c = city?.trim();
  const s = stateCode?.trim().toUpperCase();
  if (c && s) return `${c}, ${s}`;
  return c || s || null;
}
