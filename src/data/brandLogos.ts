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
    logo: 'https://companieslogo.com/img/orig/DASH-4b1e7048.png',
    color: '#FF3008',
    category: 'food-delivery',
    popular: true,
  },
  Walmart: {
    name: 'Walmart',
    logo: 'https://companieslogo.com/img/orig/WMT-0d8ecd74.png',
    color: '#0071CE',
    category: 'grocery',
    popular: true,
  },
  Uber: {
    name: 'Uber',
    logo: 'https://companieslogo.com/img/orig/UBER-c9e8b94b.png',
    color: '#000000',
    category: 'food-delivery',
    popular: true,
  },
  Amazon: {
    name: 'Amazon',
    logo: 'https://companieslogo.com/img/orig/AMZN-e9f942e4.png',
    color: '#FF9900',
    category: 'retail',
    popular: true,
  },
  Target: {
    name: 'Target',
    logo: 'https://companieslogo.com/img/orig/TGT-72eb9761.png',
    color: '#CC0000',
    category: 'retail',
    popular: true,
  },
  Starbucks: {
    name: 'Starbucks',
    logo: 'https://companieslogo.com/img/orig/SBUX-0200dcbd.png',
    color: '#00704A',
    category: 'coffee',
    popular: true,
  },
  // Grocery
  Kroger: {
    name: 'Kroger',
    logo: 'https://companieslogo.com/img/orig/KR-f39fde68.png?t=1720244492',
    color: '#0066B2',
    category: 'grocery',
  },
  WholeFoods: {
    name: 'Whole Foods',
    logo: 'https://img.logo.dev/wholefoodsmarket.com',
    color: '#00674B',
    category: 'grocery',
  },
  Costco: {
    name: 'Costco',
    logo: 'https://companieslogo.com/img/orig/COST-180a6d1f.png?t=1720244491',
    color: '#E31837',
    category: 'grocery',
  },
  Safeway: {
    name: 'Safeway',
    logo: 'https://companieslogo.com/img/orig/SWY.defunct.2015-69b0f460.png?t=1723348719',
    color: '#E21A2C',
    category: 'grocery',
  },
  Publix: {
    name: 'Publix',
    logo: 'https://companieslogo.com/img/orig/publix-dbe14b16.png?t=1720244494',
    color: '#4C8C2B',
    category: 'grocery',
  },
  Aldi: {
    name: 'Aldi',
    logo: 'https://img.logo.dev/aldi.us',
    color: '#00529B',
    category: 'grocery',
  },
  // Food Delivery
  Grubhub: {
    name: 'Grubhub',
    logo: 'https://companieslogo.com/img/orig/GRUB-d0f4fe14.png',
    color: '#F63440',
    category: 'food-delivery',
  },
  Instacart: {
    name: 'Instacart',
    logo: 'https://companieslogo.com/img/orig/CART-3c2b2e4a.png',
    color: '#43B02A',
    category: 'food-delivery',
  },
  Postmates: {
    name: 'Postmates',
    logo: 'https://img.logo.dev/postmates.com',
    color: '#000000',
    category: 'food-delivery',
  },
  // Retail
  BestBuy: {
    name: 'Best Buy',
    logo: 'https://companieslogo.com/img/orig/BBY-ddf0e1a0.png',
    color: '#0046BE',
    category: 'retail',
  },
  HomeDepot: {
    name: 'Home Depot',
    logo: 'https://companieslogo.com/img/orig/HD-02e99030.png',
    color: '#F96302',
    category: 'retail',
  },
  Lowes: {
    name: "Lowe's",
    logo: 'https://companieslogo.com/img/orig/LOW-fb7a22d8.png',
    color: '#004990',
    category: 'retail',
  },
  // Pharmacy
  CVS: {
    name: 'CVS',
    logo: 'https://companieslogo.com/img/orig/CVS-2c77abf0.png',
    color: '#CC0000',
    category: 'pharmacy',
  },
  Walgreens: {
    name: 'Walgreens',
    logo: 'https://companieslogo.com/img/orig/WBA-e9c4a7a9.png',
    color: '#E31837',
    category: 'pharmacy',
  },
  RiteAid: {
    name: 'Rite Aid',
    logo: 'https://companieslogo.com/img/orig/RAD-73c35102.png?t=1720244493',
    color: '#00539B',
    category: 'pharmacy',
  },
  // Coffee/Restaurant
  Dunkin: {
    name: "Dunkin'",
    logo: 'https://companieslogo.com/img/orig/DNKN-99ffe8a0.png',
    color: '#FF671F',
    category: 'coffee',
  },
  Chipotle: {
    name: 'Chipotle',
    logo: 'https://companieslogo.com/img/orig/CMG-0f7b2adb.png',
    color: '#441500',
    category: 'restaurant',
  },
  Panera: {
    name: 'Panera Bread',
    logo: 'https://img.logo.dev/panerabread.com',
    color: '#4A6741',
    category: 'restaurant',
  },
  Subway: {
    name: 'Subway',
    logo: 'https://img.logo.dev/subway.com',
    color: '#008C15',
    category: 'restaurant',
  },
  McDonalds: {
    name: "McDonald's",
    logo: 'https://companieslogo.com/img/orig/MCD-5f219ae8.png',
    color: '#FFC72C',
    category: 'restaurant',
  },
  Wendys: {
    name: "Wendy's",
    logo: 'https://companieslogo.com/img/orig/WEN-3f43f14e.png',
    color: '#E2203D',
    category: 'restaurant',
  },
};

export const brandList = Object.values(brandLogos);
export const popularBrands = brandList.filter(b => b.popular);
export const categories = ['all', 'grocery', 'food-delivery', 'retail', 'coffee', 'pharmacy', 'restaurant'] as const;
export type BrandCategory = typeof categories[number];
