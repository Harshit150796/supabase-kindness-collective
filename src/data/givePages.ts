import type { FaqItem } from './needs';

/**
 * Pages for people who want to give, each answering a real search ("donate gift cards", "buy
 * groceries for a family in need", "sponsor a family for the holidays"). Same rules as the help
 * pages: every claim true, no promised timing, no tax-deduction or charity wording.
 */
export interface GivePage {
  path: string;
  name: string;
  title: string;
  description: string;
  h1: string;
  lead: string;
  primary: { label: string; to: string };
  secondary?: { label: string; to: string };
  /** Which requests to show: need ids from src/lib/helpNeeds.ts, or every open request when empty. */
  needs: string[];
  requestsTitle: string;
  stores: string[];
  storesTitle: string;
  storesIntro: string;
  steps: { title: string; text: string }[];
  /** One short paragraph of practical advice, shown above the questions. */
  note?: { title: string; text: string };
  faq: FaqItem[];
}

/** Questions every page for donors answers. */
export const GIVING_FAQ: FaqItem[] = [
  { q: 'How much of my gift reaches the family?', a: 'All of it becomes gift cards and coupons for them; no platform fee comes out of your gift. At checkout you can add an optional tip for CouponDonation and choose to cover the card fee.' },
  { q: 'Is my donation tax-deductible?', a: 'No. CouponDonation Inc. is a company, not a registered charity, so gifts aren’t tax-deductible. You get a receipt for every gift.' },
  { q: 'Will the family see my contact details?', a: 'No. Recipients never see your email address or other contact details.' },
];

export const GIVE_STEPS = [
  { title: 'Choose a request or a store', text: 'Pick someone who asked for help, or give from the Donate page and your gift cards go to the shared pool that people who asked for help can claim.' },
  { title: 'Choose an amount', text: 'From $10 per store, up to five stores in one gift. You see exactly how your gift is split.' },
  { title: 'We deliver it', text: 'Our team buys the gift cards or coupons and adds them to the recipient’s wallet. You get a receipt right away and an email when they have them.' },
];

export const GIVE_PAGES: GivePage[] = [
  {
    path: '/donate-gift-cards',
    name: 'Donate gift cards',
    title: 'Donate Gift Cards to Families in Need',
    description: 'Give a Walmart, Kroger, CVS, Target or DoorDash gift card to someone who asked for one. Choose the store and amount; we deliver it with a receipt.',
    h1: 'Donate a gift card to someone who asked for one',
    lead: 'Every request on CouponDonation names the stores that would help most. Pick a request, choose an amount, and your gift becomes a gift card for that store, delivered to the person who asked.',
    primary: { label: 'Donate a gift card', to: '/donate' },
    secondary: { label: 'See who asked', to: '#open-requests' },
    needs: [],
    requestsTitle: 'People asking for gift cards now',
    stores: ['Walmart', 'Kroger', 'Aldi', 'Costco', 'Target', 'Amazon', 'CVS', 'Walgreens', 'DoorDash', 'Uber', 'Instacart', 'Publix'],
    storesTitle: 'Gift cards you can give',
    storesIntro: 'Choose a store to start a gift there. Store names are trademarks of their owners; the stores don’t sponsor CouponDonation.',
    steps: GIVE_STEPS,
    faq: [
      { q: 'Can I donate a gift card I already have?', a: 'No. We buy each gift card new for the store you choose, so it has never been used and the balance is right.' },
      { q: 'Which gift cards can I give?', a: 'Grocery stores such as Walmart, Kroger, Aldi, Costco and Publix; pharmacies such as CVS and Walgreens; meal and ride services such as DoorDash and Uber; and retailers such as Target, Amazon and Best Buy.' },
      { q: 'Do I choose who receives it?', a: 'Yes. Give from a request’s page to help that person. If you give from the Donate page without choosing a request, your gift cards go to a shared pool that people who asked for help can claim.' },
    ],
  },
  {
    path: '/buy-groceries-for-a-family',
    name: 'Buy groceries for a family',
    title: 'Buy Groceries for a Family in Need, Online',
    description: 'Pick a family that asked for help with food and send grocery gift cards for Walmart, Kroger, Aldi or Instacart. From $10, with a receipt.',
    h1: 'Buy groceries for a family in need',
    lead: 'You don’t have to know someone to help fill their fridge. These families asked for help with food and chose the grocery stores they use. Send a gift card from $10 and we’ll let you know when it reaches them.',
    primary: { label: 'Choose a family', to: '#open-requests' },
    secondary: { label: 'Give groceries now', to: '/donate?store=walmart' },
    needs: ['food', 'meals'],
    requestsTitle: 'Families asking for help with food',
    stores: ['Walmart', 'Kroger', 'Aldi', 'Costco', 'Publix', 'Safeway', 'Whole Foods', 'Instacart'],
    storesTitle: 'Grocery stores you can give at',
    storesIntro: 'Choose a store to give a grocery gift card there.',
    steps: GIVE_STEPS,
    faq: [
      { q: 'Can I deliver groceries instead?', a: 'We don’t deliver groceries. A grocery gift card lets the family buy what they need, when they need it, at a store near them.' },
      { q: 'Can I buy groceries for a family I know?', a: 'Yes. Ask them to start a free request and share the link with you, then give from their page.' },
      { q: 'How do I know a request is genuine?', a: 'Our team reviews requests and can ask for proof of identity or need, and gift cards only go to the account that made the request. You can report any request from its page.' },
    ],
  },
  {
    path: '/holiday-giving',
    name: 'Holiday giving',
    title: 'Sponsor a Family for the Holidays',
    description: 'Give a family their Thanksgiving or holiday dinner, or gifts for their kids, with Walmart, Kroger, Target and Amazon gift cards. From $10.',
    h1: 'Sponsor a family for the holidays',
    lead: 'This season, help a family with what they need for Thanksgiving dinner, warm winter clothes or gifts for their kids. Choose a request and the stores, and your gift becomes gift cards they can use at the store.',
    primary: { label: 'Sponsor a family', to: '#open-requests' },
    secondary: { label: 'Give to the shared pool', to: '/donate' },
    needs: [],
    requestsTitle: 'Families you can sponsor',
    stores: ['Walmart', 'Kroger', 'Target', 'Amazon', 'Costco', 'Aldi', 'Publix', 'Instacart'],
    storesTitle: 'Gift cards for holiday meals and gifts',
    storesIntro: 'Grocery stores for the meal, and Target, Amazon or Walmart for clothes and gifts.',
    steps: GIVE_STEPS,
    note: {
      title: 'Give early for Thanksgiving',
      text: 'Thanksgiving is November 26, 2026. Our team issues each gift card by hand, so gifts made by mid-November have the best chance of arriving in time for the meal.',
    },
    faq: [
      { q: 'Is this an adopt-a-family program?', a: 'It works like one: you choose a family that asked for help and give for what they need. You don’t need to shop, wrap or deliver anything.' },
      { q: 'Can my company, school or church sponsor families together?', a: 'Yes. Each person can give to the same request, or your group can partner with us to run requests for families you already support. See Partner with us.' },
      { q: 'Can I give on Giving Tuesday?', a: 'Yes. Giving Tuesday is December 1, 2026, and every request stays open for gifts.' },
    ],
  },
];

export const givePageForPath = (path: string) => GIVE_PAGES.find((page) => page.path === path);
