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
    logo: 'https://logo.clearbit.com/doordash.com',
    color: '#FF3008',
    category: 'food-delivery',
    popular: true,
  },
  Walmart: {
    name: 'Walmart',
    logo: 'https://logo.clearbit.com/walmart.com',
    color: '#0071CE',
    category: 'grocery',
    popular: true,
  },
  Uber: {
    name: 'Uber',
    logo: 'https://logo.clearbit.com/ubereats.com',
    color: '#000000',
    category: 'food-delivery',
    popular: true,
  },
  Amazon: {
    name: 'Amazon',
    logo: 'https://logo.clearbit.com/amazon.com',
    color: '#FF9900',
    category: 'retail',
    popular: true,
  },
  Target: {
    name: 'Target',
    logo: 'https://logo.clearbit.com/target.com',
    color: '#CC0000',
    category: 'retail',
    popular: true,
  },
  Starbucks: {
    name: 'Starbucks',
    logo: 'https://logo.clearbit.com/starbucks.com',
    color: '#00704A',
    category: 'coffee',
    popular: true,
  },
  // Grocery
  Kroger: {
    name: 'Kroger',
    logo: 'https://logo.clearbit.com/kroger.com',
    color: '#0066B2',
    category: 'grocery',
  },
  WholeFoods: {
    name: 'Whole Foods',
    logo: 'https://logo.clearbit.com/wholefoodsmarket.com',
    color: '#00674B',
    category: 'grocery',
  },
  Costco: {
    name: 'Costco',
    logo: 'https://logo.clearbit.com/costco.com',
    color: '#E31837',
    category: 'grocery',
  },
  Safeway: {
    name: 'Safeway',
    logo: 'https://logo.clearbit.com/safeway.com',
    color: '#E21A2C',
    category: 'grocery',
  },
  Publix: {
    name: 'Publix',
    logo: 'https://logo.clearbit.com/publix.com',
    color: '#4C8C2B',
    category: 'grocery',
  },
  Aldi: {
    name: 'Aldi',
    logo: 'https://logo.clearbit.com/aldi.us',
    color: '#00529B',
    category: 'grocery',
  },
  // Food Delivery
  Grubhub: {
    name: 'Grubhub',
    logo: 'https://logo.clearbit.com/grubhub.com',
    color: '#F63440',
    category: 'food-delivery',
  },
  Instacart: {
    name: 'Instacart',
    logo: 'https://logo.clearbit.com/instacart.com',
    color: '#43B02A',
    category: 'food-delivery',
  },
  Postmates: {
    name: 'Postmates',
    logo: 'https://logo.clearbit.com/postmates.com',
    color: '#000000',
    category: 'food-delivery',
  },
  // Retail
  BestBuy: {
    name: 'Best Buy',
    logo: 'https://logo.clearbit.com/bestbuy.com',
    color: '#0046BE',
    category: 'retail',
  },
  HomeDepot: {
    name: 'Home Depot',
    logo: 'https://logo.clearbit.com/homedepot.com',
    color: '#F96302',
    category: 'retail',
  },
  Lowes: {
    name: "Lowe's",
    logo: 'https://logo.clearbit.com/lowes.com',
    color: '#004990',
    category: 'retail',
  },
  // Pharmacy
  CVS: {
    name: 'CVS',
    logo: 'https://logo.clearbit.com/cvs.com',
    color: '#CC0000',
    category: 'pharmacy',
  },
  Walgreens: {
    name: 'Walgreens',
    logo: 'https://logo.clearbit.com/walgreens.com',
    color: '#E31837',
    category: 'pharmacy',
  },
  RiteAid: {
    name: 'Rite Aid',
    logo: 'https://logo.clearbit.com/riteaid.com',
    color: '#00539B',
    category: 'pharmacy',
  },
  // Coffee/Restaurant
  Dunkin: {
    name: "Dunkin'",
    logo: 'https://logo.clearbit.com/dunkindonuts.com',
    color: '#FF671F',
    category: 'coffee',
  },
  Chipotle: {
    name: 'Chipotle',
    logo: 'https://logo.clearbit.com/chipotle.com',
    color: '#441500',
    category: 'restaurant',
  },
  Panera: {
    name: 'Panera Bread',
    logo: 'https://logo.clearbit.com/panerabread.com',
    color: '#4A6741',
    category: 'restaurant',
  },
  Subway: {
    name: 'Subway',
    logo: 'https://logo.clearbit.com/subway.com',
    color: '#008C15',
    category: 'restaurant',
  },
  McDonalds: {
    name: "McDonald's",
    logo: 'https://logo.clearbit.com/mcdonalds.com',
    color: '#FFC72C',
    category: 'restaurant',
  },
  Wendys: {
    name: "Wendy's",
    logo: 'https://logo.clearbit.com/wendys.com',
    color: '#E2203D',
    category: 'restaurant',
  },
};

export const brandList = Object.values(brandLogos);
export const popularBrands = brandList.filter(b => b.popular);
export const categories = ['all', 'grocery', 'food-delivery', 'retail', 'coffee', 'pharmacy', 'restaurant'] as const;
export type BrandCategory = typeof categories[number];
