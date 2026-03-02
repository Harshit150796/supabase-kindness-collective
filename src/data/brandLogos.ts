export interface BrandInfo {
  name: string;
  logo: string;
  color: string;
  category: 'grocery' | 'food-delivery' | 'retail' | 'coffee' | 'pharmacy' | 'restaurant';
  popular?: boolean;
}

export const brandLogos: Record<string, BrandInfo> = {
  // Popular brands (shown on main screen)
  DoorDash: {
    name: 'DoorDash',
    logo: 'https://www.google.com/s2/favicons?domain=doordash.com&sz=128',
    color: '#FF3008',
    category: 'food-delivery',
    popular: true,
  },
  Walmart: {
    name: 'Walmart',
    logo: 'https://www.google.com/s2/favicons?domain=walmart.com&sz=128',
    color: '#0071CE',
    category: 'grocery',
    popular: true,
  },
  Uber: {
    name: 'Uber',
    logo: 'https://www.google.com/s2/favicons?domain=ubereats.com&sz=128',
    color: '#000000',
    category: 'food-delivery',
    popular: true,
  },
  Amazon: {
    name: 'Amazon',
    logo: 'https://www.google.com/s2/favicons?domain=amazon.com&sz=128',
    color: '#FF9900',
    category: 'retail',
    popular: true,
  },
  Target: {
    name: 'Target',
    logo: 'https://www.google.com/s2/favicons?domain=target.com&sz=128',
    color: '#CC0000',
    category: 'retail',
    popular: true,
  },
  Starbucks: {
    name: 'Starbucks',
    logo: 'https://www.google.com/s2/favicons?domain=starbucks.com&sz=128',
    color: '#00704A',
    category: 'coffee',
    popular: true,
  },
  // Grocery
  Kroger: {
    name: 'Kroger',
    logo: 'https://www.google.com/s2/favicons?domain=kroger.com&sz=128',
    color: '#0066B2',
    category: 'grocery',
  },
  WholeFoods: {
    name: 'Whole Foods',
    logo: 'https://www.google.com/s2/favicons?domain=wholefoodsmarket.com&sz=128',
    color: '#00674B',
    category: 'grocery',
  },
  Costco: {
    name: 'Costco',
    logo: 'https://www.google.com/s2/favicons?domain=costco.com&sz=128',
    color: '#E31837',
    category: 'grocery',
  },
  Safeway: {
    name: 'Safeway',
    logo: 'https://www.google.com/s2/favicons?domain=safeway.com&sz=128',
    color: '#E21A2C',
    category: 'grocery',
  },
  Publix: {
    name: 'Publix',
    logo: 'https://www.google.com/s2/favicons?domain=publix.com&sz=128',
    color: '#4C8C2B',
    category: 'grocery',
  },
  Aldi: {
    name: 'Aldi',
    logo: 'https://www.google.com/s2/favicons?domain=aldi.us&sz=128',
    color: '#00529B',
    category: 'grocery',
  },
  // Food Delivery
  Grubhub: {
    name: 'Grubhub',
    logo: 'https://www.google.com/s2/favicons?domain=grubhub.com&sz=128',
    color: '#F63440',
    category: 'food-delivery',
  },
  Instacart: {
    name: 'Instacart',
    logo: 'https://www.google.com/s2/favicons?domain=instacart.com&sz=128',
    color: '#43B02A',
    category: 'food-delivery',
  },
  Postmates: {
    name: 'Postmates',
    logo: 'https://www.google.com/s2/favicons?domain=postmates.com&sz=128',
    color: '#000000',
    category: 'food-delivery',
  },
  // Retail
  BestBuy: {
    name: 'Best Buy',
    logo: 'https://www.google.com/s2/favicons?domain=bestbuy.com&sz=128',
    color: '#0046BE',
    category: 'retail',
  },
  HomeDepot: {
    name: 'Home Depot',
    logo: 'https://www.google.com/s2/favicons?domain=homedepot.com&sz=128',
    color: '#F96302',
    category: 'retail',
  },
  Lowes: {
    name: "Lowe's",
    logo: 'https://www.google.com/s2/favicons?domain=lowes.com&sz=128',
    color: '#004990',
    category: 'retail',
  },
  // Pharmacy
  CVS: {
    name: 'CVS',
    logo: 'https://www.google.com/s2/favicons?domain=cvs.com&sz=128',
    color: '#CC0000',
    category: 'pharmacy',
  },
  Walgreens: {
    name: 'Walgreens',
    logo: 'https://www.google.com/s2/favicons?domain=walgreens.com&sz=128',
    color: '#E31837',
    category: 'pharmacy',
  },
  RiteAid: {
    name: 'Rite Aid',
    logo: 'https://www.google.com/s2/favicons?domain=riteaid.com&sz=128',
    color: '#00539B',
    category: 'pharmacy',
  },
  // Coffee/Restaurant
  Dunkin: {
    name: "Dunkin'",
    logo: 'https://www.google.com/s2/favicons?domain=dunkindonuts.com&sz=128',
    color: '#FF671F',
    category: 'coffee',
  },
  Chipotle: {
    name: 'Chipotle',
    logo: 'https://www.google.com/s2/favicons?domain=chipotle.com&sz=128',
    color: '#441500',
    category: 'restaurant',
  },
  Panera: {
    name: 'Panera Bread',
    logo: 'https://www.google.com/s2/favicons?domain=panerabread.com&sz=128',
    color: '#4A6741',
    category: 'restaurant',
  },
  Subway: {
    name: 'Subway',
    logo: 'https://www.google.com/s2/favicons?domain=subway.com&sz=128',
    color: '#008C15',
    category: 'restaurant',
  },
  McDonalds: {
    name: "McDonald's",
    logo: 'https://www.google.com/s2/favicons?domain=mcdonalds.com&sz=128',
    color: '#FFC72C',
    category: 'restaurant',
  },
  Wendys: {
    name: "Wendy's",
    logo: 'https://www.google.com/s2/favicons?domain=wendys.com&sz=128',
    color: '#E2203D',
    category: 'restaurant',
  },
};

export const brandList = Object.values(brandLogos);
export const popularBrands = brandList.filter(b => b.popular);
export const categories = ['all', 'grocery', 'food-delivery', 'retail', 'coffee', 'pharmacy', 'restaurant'] as const;
export type BrandCategory = typeof categories[number];
