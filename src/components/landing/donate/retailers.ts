import { brandLogos, type BrandInfo } from '@/data/brandLogos';

export interface Retailer {
  id: string;
  name: string;
  logo: string;
  category: BrandInfo['category'];
}

/** The id the brand picker and the checkout use: the name in lowercase without spaces. */
export const retailerId = (name: string) => name.toLowerCase().replace(/\s+/g, '');

/** Official square emblems (crisp at any size) where we have them; the rest keep their icon files. */
const EMBLEMS: Record<string, string> = {
  DoorDash: 'doordash',
  Walmart: 'walmart',
  Target: 'target',
  Starbucks: 'starbucks',
  Kroger: 'kroger',
  Aldi: 'aldi',
  Chipotle: 'chipotle',
  "McDonald's": 'mcdonalds',
  'Whole Foods': 'whole-foods',
};

/** What families use each kind of store for, in the words a donor would use. */
export const CATEGORY_LABEL: Record<BrandInfo['category'], string> = {
  grocery: 'Groceries',
  'food-delivery': 'Meal delivery',
  retail: 'Everyday essentials',
  coffee: 'Coffee and breakfast',
  pharmacy: 'Pharmacy',
  restaurant: 'Meals out',
};

const toRetailer = (info: BrandInfo): Retailer => ({
  id: retailerId(info.name),
  name: info.name,
  logo: EMBLEMS[info.name] ? `/brand-logos/${EMBLEMS[info.name]}.svg` : info.logo,
  category: info.category,
});

const ALL = Object.values(brandLogos).map(toRetailer);
const BY_ID = new Map(ALL.map((r) => [r.id, r]));

export const POPULAR_RETAILERS = Object.values(brandLogos).filter((b) => b.popular).map(toRetailer);

export function findRetailer(id: string): Retailer {
  return BY_ID.get(retailerId(id)) ?? { id, name: id, logo: '', category: 'retail' };
}

/**
 * One colour per retailer, by position in the split. Mid tones that read on the deep-green ledger
 * and, with a hairline ring, on white: logo green and logo blue, alternating, light to dark.
 */
export const SHARE_TONES = [
  'hsl(123 46% 56%)',
  'hsl(212 80% 64%)',
  'hsl(123 50% 80%)',
  'hsl(212 85% 84%)',
  'hsl(123 46% 40%)',
] as const;

export const usd = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
export const plainNumber = new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 });
