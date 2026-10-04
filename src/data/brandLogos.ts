export interface BrandInfo {
  name: string;
  logo: string;
  color: string;
  category: 'grocery' | 'food-delivery' | 'retail' | 'coffee' | 'pharmacy' | 'restaurant';
  popular?: boolean;
}

// Self-hosted brand logos (originally fetched from Google's favicon service —
// that endpoint added 1.5–1.8s of latency per icon on mobile and leaked the
// visitor's IP to Google). Files live in /public/brands/*.png; total ~51 KB.
const logo = (file: string) => `/brands/${file}`;

export const brandLogos: Record<string, BrandInfo> = {
  // Popular brands (shown on main screen)
  DoorDash: { name: 'DoorDash', logo: logo('doordash.com.png'), color: '#FF3008', category: 'food-delivery', popular: true },
  Walmart: { name: 'Walmart', logo: logo('walmart.com.png'), color: '#0071CE', category: 'grocery', popular: true },
  Uber: { name: 'Uber', logo: logo('ubereats.com.png'), color: '#000000', category: 'food-delivery', popular: true },
  Amazon: { name: 'Amazon', logo: logo('amazon.com.png'), color: '#FF9900', category: 'retail', popular: true },
  Target: { name: 'Target', logo: logo('target.com.png'), color: '#CC0000', category: 'retail', popular: true },
  Starbucks: { name: 'Starbucks', logo: logo('starbucks.com.png'), color: '#00704A', category: 'coffee', popular: true },
  // Grocery
  Kroger: { name: 'Kroger', logo: logo('kroger.com.png'), color: '#0066B2', category: 'grocery' },
  WholeFoods: { name: 'Whole Foods', logo: logo('wholefoodsmarket.com.png'), color: '#00674B', category: 'grocery' },
  Costco: { name: 'Costco', logo: logo('costco.com.png'), color: '#E31837', category: 'grocery' },
  Safeway: { name: 'Safeway', logo: logo('safeway.com.png'), color: '#E21A2C', category: 'grocery' },
  Publix: { name: 'Publix', logo: logo('publix.com.png'), color: '#4C8C2B', category: 'grocery' },
  Aldi: { name: 'Aldi', logo: logo('aldi.us.png'), color: '#00529B', category: 'grocery' },
  // Food Delivery
  Grubhub: { name: 'Grubhub', logo: logo('grubhub.com.png'), color: '#F63440', category: 'food-delivery' },
  Instacart: { name: 'Instacart', logo: '/brand-logos/instacart.svg', color: '#0AAD0A', category: 'food-delivery' },
  Postmates: { name: 'Postmates', logo: logo('postmates.com.png'), color: '#000000', category: 'food-delivery' },
  // Retail
  BestBuy: { name: 'Best Buy', logo: logo('bestbuy.com.png'), color: '#0046BE', category: 'retail' },
  HomeDepot: { name: 'Home Depot', logo: logo('homedepot.com.png'), color: '#F96302', category: 'retail' },
  Lowes: { name: "Lowe's", logo: logo('lowes.com.png'), color: '#004990', category: 'retail' },
  // Pharmacy
  CVS: { name: 'CVS', logo: '/brand-logos/cvs.svg', color: '#CC0000', category: 'pharmacy' },
  Walgreens: { name: 'Walgreens', logo: logo('walgreens.com.png'), color: '#E31837', category: 'pharmacy' },
  RiteAid: { name: 'Rite Aid', logo: logo('riteaid.com.png'), color: '#00539B', category: 'pharmacy' },
  // Coffee/Restaurant
  Dunkin: { name: "Dunkin'", logo: logo('dunkindonuts.com.png'), color: '#FF671F', category: 'coffee' },
  Chipotle: { name: 'Chipotle', logo: logo('chipotle.com.png'), color: '#441500', category: 'restaurant' },
  Panera: { name: 'Panera Bread', logo: logo('panerabread.com.png'), color: '#4A6741', category: 'restaurant' },
  Subway: { name: 'Subway', logo: logo('subway.com.png'), color: '#008C15', category: 'restaurant' },
  McDonalds: { name: "McDonald's", logo: logo('mcdonalds.com.png'), color: '#FFC72C', category: 'restaurant' },
  Wendys: { name: "Wendy's", logo: logo('wendys.com.png'), color: '#E2203D', category: 'restaurant' },
};

export const brandList = Object.values(brandLogos);
export const popularBrands = brandList.filter(b => b.popular);
export const categories = ['all', 'grocery', 'food-delivery', 'retail', 'coffee', 'pharmacy', 'restaurant'] as const;
export type BrandCategory = typeof categories[number];

/** Card networks an admin may issue as (prepaid cards). Never offered to donors as a brand choice. */
export const issuerBrands: Record<string, BrandInfo> = {
  Visa: { name: 'Visa', logo: '/brand-logos/visa.svg', color: '#1A1F71', category: 'retail' },
  Mastercard: { name: 'Mastercard', logo: '/brand-logos/mastercard.svg', color: '#EB001B', category: 'retail' },
  AmericanExpress: { name: 'American Express', logo: '/brand-logos/amex.svg', color: '#2E77BC', category: 'retail' },
};

/** Names an admin can pick for "Brand shown to recipient". */
export const issuableBrandNames = [...brandList, ...Object.values(issuerBrands)].map((b) => b.name);

const norm = (s: string) => s.toLowerCase().replace(/[^a-z]/g, '');
/** Logo for any brand name in either catalog (matches "Uber Eats", "WholeFoods", etc). */
export const brandLogoFor = (name?: string | null): string | null => {
  if (!name) return null;
  const n = norm(name);
  const all = { ...brandLogos, ...issuerBrands };
  const hit = Object.entries(all).find(([k, b]) => norm(k) === n || norm(b.name) === n);
  return hit ? hit[1].logo : null;
};
