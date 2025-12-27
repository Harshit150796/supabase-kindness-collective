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
    logo: 'https://companieslogo.com/img/orig/KR-cb5c97d8.png',
    color: '#0066B2',
    category: 'grocery',
  },
  WholeFoods: {
    name: 'Whole Foods',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a2/Whole_Foods_Market_201x_logo.svg/640px-Whole_Foods_Market_201x_logo.svg.png',
    color: '#00674B',
    category: 'grocery',
  },
  Costco: {
    name: 'Costco',
    logo: 'https://companieslogo.com/img/orig/COST-c37b9de7.png',
    color: '#E31837',
    category: 'grocery',
  },
  Safeway: {
    name: 'Safeway',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5a/Safeway_Logo.svg/640px-Safeway_Logo.svg.png',
    color: '#E21A2C',
    category: 'grocery',
  },
  Publix: {
    name: 'Publix',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/07/Publix_Logo.svg/640px-Publix_Logo.svg.png',
    color: '#4C8C2B',
    category: 'grocery',
  },
  Aldi: {
    name: 'Aldi',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2e/Aldi_Nord_Logo_2022.svg/640px-Aldi_Nord_Logo_2022.svg.png',
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
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/de/Postmates_Logo_2020.svg/640px-Postmates_Logo_2020.svg.png',
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
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/75/Rite_Aid_logo.svg/640px-Rite_Aid_logo.svg.png',
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
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/37/Panera_Bread_logo.svg/640px-Panera_Bread_logo.svg.png',
    color: '#4A6741',
    category: 'restaurant',
  },
  Subway: {
    name: 'Subway',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5c/Subway_2016_logo.svg/640px-Subway_2016_logo.svg.png',
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
