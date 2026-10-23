/**
 * Help pages at /help/:slug. Each one answers a real search ("food assistance", "help paying bills")
 * for both sides: how to ask for help here, how to give, live requests for that need, and other
 * places that help. Every claim must stay true (AGENTS.md, Legal): we never pay bills or providers,
 * never send cash, and don't promise funding or timing. Resource links were checked October 2026.
 */
export interface HelpResource {
  name: string;
  /** Left out when the help is a call to make rather than a page to visit. */
  url?: string;
  text: string;
}

export interface FaqItem {
  q: string;
  a: string;
}

export interface NeedPage {
  slug: string;
  /** Short name for links ("Food assistance"). */
  name: string;
  /** Search title, before " | CouponDonation"; keep it under about 60 characters. */
  title: string;
  /** Search snippet; keep it under 155 characters. */
  description: string;
  h1: string;
  lead: string;
  /** Request needs (src/lib/helpNeeds.ts ids) plus older category ids that mean the same thing. */
  categories: string[];
  /** Stores shown for this need, as named in the donor catalogue. */
  stores: string[];
  resources: HelpResource[];
  faq: FaqItem[];
}

const R211: HelpResource = {
  name: '211',
  url: 'https://211.org/',
  text: 'Free, confidential help finding local food, rent, utility and emergency programs. Call 211 or search by ZIP code.',
};
const FOOD_BANKS: HelpResource = {
  name: 'Feeding America food bank finder',
  url: 'https://www.feedingamerica.org/find-your-local-foodbank',
  text: 'Find your local food bank and the pantries and meal programs it supplies.',
};
const SNAP: HelpResource = {
  name: 'SNAP (food stamps)',
  url: 'https://www.fna.usda.gov/snap/state-directory',
  text: 'Monthly food benefits on an EBT card for households with low income. Apply through your state; this USDA directory lists each state’s office.',
};
const WIC: HelpResource = {
  name: 'WIC',
  url: 'https://www.fna.usda.gov/wic',
  text: 'Healthy food, infant formula and nutrition support for pregnant women, new mothers and children under five.',
};
const BENEFIT_FINDER: HelpResource = {
  name: 'USAGov benefit finder',
  url: 'https://www.usa.gov/benefit-finder',
  text: 'Answer a few questions to see government benefits you may qualify for.',
};

/** How asking for help works, the same for every need. */
export const ASK_STEPS = [
  { title: 'Tell us what you need', text: 'Choose your needs and the stores you’d use, add a few lines and a photo, and set a goal. It’s free and takes a few minutes.' },
  { title: 'Share your page', text: 'Your page goes live when you submit it. Share it with friends, family, your church or community groups. Our team reviews requests and may ask for more information.' },
  { title: 'Use your gift cards', text: 'When someone gives, our team issues gift cards or coupons for the stores they chose and adds them to your wallet. Use them like any gift card.' },
];

/** Questions every help page answers for people asking for help. */
export const ASKING_FAQ: FaqItem[] = [
  { q: 'Is it free to ask for help?', a: 'Yes. There is no fee to start or keep a request. Donors can add an optional tip for CouponDonation, and it never comes out of your gifts.' },
  { q: 'Who can ask for help?', a: 'Adults 18 or older who live in the United States, for themselves or their household. Community groups can ask on behalf of people who agree to it.' },
  { q: 'Will gift cards affect my benefits?', a: 'They might. Some programs, such as SSI, can count gift cards as income. If you receive benefits, ask your caseworker whether you need to report them.' },
];

export const NEEDS: NeedPage[] = [
  {
    slug: 'food-assistance',
    name: 'Food assistance',
    title: 'Food Assistance for Families in Need',
    description: 'Ask for help with food, or help a family eat this week. Donations become gift cards for the grocery and meal stores they chose. Free to ask.',
    h1: 'Food assistance, from people who want to help',
    lead: 'If you’re struggling to keep food on the table, you can ask for help here in a few minutes. Donors give gift cards for the grocery stores and meal services you choose, so their help arrives as food.',
    categories: ['food', 'meals'],
    stores: ['Walmart', 'Kroger', 'Aldi', 'Costco', 'Publix', 'Instacart', 'DoorDash', 'Safeway'],
    resources: [R211, FOOD_BANKS, SNAP, WIC],
    faq: [
      { q: 'How do I get food assistance on CouponDonation?', a: 'Start a request: choose Food and groceries as your need, pick the stores you would use, add a short story and a photo, and set a goal. Your page goes live when you submit it, and you can share it anywhere.' },
      { q: 'Do I get cash?', a: 'No. Help arrives as gift cards and coupons for the stores you chose, such as Walmart, Kroger, Aldi or DoorDash. That is how donors know their gift buys food.' },
      { q: 'How fast will I get gift cards?', a: 'Our team issues gift cards by hand after each gift, so timing depends on the store. They appear in your wallet as soon as they are ready.' },
      { q: 'Can I still use SNAP or a food bank?', a: 'Yes. CouponDonation doesn’t replace benefits or food banks, and many people use both. The programs listed on this page are a good place to start.' },
    ],
  },
  {
    slug: 'grocery-assistance',
    name: 'Grocery assistance',
    title: 'Grocery Assistance: Gift Cards for the Stores You Use',
    description: 'Need help with groceries? Ask for gift cards to Walmart, Kroger, Aldi, Costco and more. Donors can buy groceries for a family in need online.',
    h1: 'Grocery assistance that fits how you already shop',
    lead: 'Ask for gift cards to the grocery stores you already use, from Walmart and Kroger to Aldi, Publix and Instacart. Donors see exactly which stores you picked and give there.',
    categories: ['food'],
    stores: ['Walmart', 'Kroger', 'Aldi', 'Costco', 'Publix', 'Safeway', 'Whole Foods', 'Instacart'],
    resources: [R211, FOOD_BANKS, SNAP, WIC],
    faq: [
      { q: 'Which grocery stores can I choose?', a: 'Walmart, Kroger, Aldi, Costco, Publix, Safeway, Whole Foods and Instacart, among others. You can pick up to eight stores and say whether gifts to other stores are welcome.' },
      { q: 'Can I get free grocery gift cards?', a: 'Gift cards on CouponDonation come from donors who choose to fund a request, so nothing is guaranteed. Starting a request is free, and sharing it with people you know is the best way to get it funded.' },
      { q: 'Can I buy groceries for a family I don’t know?', a: 'Yes. Choose any open request below, pick one of the stores the family asked for and an amount from $10. They receive a gift card for that store.' },
      { q: 'Why a gift card instead of cash?', a: 'Donors know a grocery gift card buys groceries. Families use it at checkout like any other gift card, at a store they already shop at.' },
    ],
  },
  {
    slug: 'help-paying-bills',
    name: 'Help paying bills',
    title: 'Help Paying Bills: Programs and Community Support',
    description: 'Behind on bills? Find programs that help with utility and phone bills, and ask your community for grocery and household gift cards to free up money.',
    h1: 'Help paying bills when money runs short',
    lead: 'CouponDonation doesn’t pay bills. What it can do is cover groceries, medicine and household basics with gift cards from donors, so more of your own money can go to rent and utilities. Programs that help with the bills themselves are listed below.',
    categories: ['utilities', 'household'],
    stores: ['Walmart', 'Target', 'Costco', 'Home Depot', 'Amazon', 'Kroger'],
    resources: [
      { name: 'LIHEAP', url: 'https://acf.gov/ocs/programs/liheap', text: 'The federal Low Income Home Energy Assistance Program, run by each state, helps with heating and cooling bills.' },
      { name: 'Lifeline', url: 'https://www.lifelinesupport.org/', text: 'A federal discount on phone or internet service for households with low income or on certain benefits.' },
      R211,
      { name: 'Your utility company', text: 'Call the number on your bill and ask about payment plans, hardship funds and protections from shutoff. Most utilities have them.' },
    ],
    faq: [
      { q: 'Does CouponDonation pay my bills?', a: 'No. We never pay bills or send cash. Donors give gift cards for stores like Walmart, Target or Home Depot, which covers everyday costs so your own money can go to bills.' },
      { q: 'Who can help with my electric or heating bill?', a: 'Start with LIHEAP through your state, your utility’s hardship program and 211, which can connect you to local emergency funds.' },
      { q: 'What should I ask for here?', a: 'Choose Home and bills as your need and the stores where you spend the most each month. The more of your regular shopping donors cover, the more money is left for bills.' },
    ],
  },
  {
    slug: 'transportation-assistance',
    name: 'Transportation assistance',
    title: 'Transportation Assistance: Help With Rides and Travel',
    description: 'Need a ride to work, school or a medical appointment? Ask donors for Uber gift cards and travel basics, and find programs that cover rides.',
    h1: 'Transportation and travel assistance',
    lead: 'Getting to a job, a class or the doctor shouldn’t depend on whether you can afford the ride. Ask for Uber gift cards and help with travel basics, and donors can fund exactly that.',
    categories: ['transportation', 'travel'],
    stores: ['Uber', 'Walmart', 'Target', 'Amazon'],
    resources: [
      { name: 'Medicaid rides to medical care', url: 'https://www.healthcare.gov/medicaid-chip/', text: 'Most state Medicaid plans cover rides to medical appointments. If you have Medicaid, call the number on your card to ask.' },
      { name: 'Reduced transit fares', text: 'Many bus and train systems offer lower fares for people with low income, older adults and people with disabilities. 211 can point you to yours.' },
      R211,
    ],
    faq: [
      { q: 'Which ride services can I choose?', a: 'Uber gift cards work for Uber rides and Uber Eats. You can also choose stores like Walmart or Target for travel basics.' },
      { q: 'Can I get help with travel for a family emergency or medical treatment?', a: 'You can ask for ride gift cards and everyday costs around the trip, such as meals and pharmacy items. CouponDonation doesn’t book or pay for plane, train or bus tickets.' },
      { q: 'Can donors help with car repairs or gas?', a: 'Not directly. We don’t pay mechanics or send cash. Gift cards for the stores you choose can cover other costs, so your money can go to the car.' },
    ],
  },
  {
    slug: 'healthcare-assistance',
    name: 'Healthcare assistance',
    title: 'Healthcare Assistance: Help With Pharmacy Costs',
    description: 'Ask donors for CVS and Walgreens gift cards for medicine, first aid and recovery basics, and find programs that help with health care costs.',
    h1: 'Healthcare assistance for the costs around care',
    lead: 'An illness or injury brings costs beyond the doctor: pharmacy items, first aid, groceries while you recover. Ask for pharmacy and grocery gift cards here. For medical bills and coverage, start with the programs below.',
    categories: ['healthcare', 'health'],
    stores: ['CVS', 'Walgreens', 'Walmart', 'Target', 'Amazon'],
    resources: [
      { name: 'Medicaid and CHIP', url: 'https://www.healthcare.gov/medicaid-chip/', text: 'Free or low-cost health coverage for people with low income, families, children, pregnant women and people with disabilities.' },
      { name: 'Community health centers', url: 'https://findahealthcenter.hrsa.gov/', text: 'Federally funded clinics that charge on a sliding scale based on income, including if you have no insurance.' },
      { name: 'NeedyMeds', url: 'https://www.needymeds.org/', text: 'A nonprofit directory of programs that help pay for prescriptions and other health care costs.' },
      R211,
    ],
    faq: [
      { q: 'Can CouponDonation pay my medical bills?', a: 'No. We don’t pay doctors, hospitals or insurers. Donors give pharmacy and grocery gift cards for the everyday costs around care.' },
      { q: 'Which pharmacies can I choose?', a: 'CVS and Walgreens, plus stores with pharmacies and health aisles such as Walmart, Target and Amazon.' },
      { q: 'Do I have to share my diagnosis?', a: 'No. Your page is public, so share only what you are comfortable with. Our Consumer Health Data Privacy Policy explains how we handle any health details you include.' },
    ],
  },
  {
    slug: 'emergency-assistance',
    name: 'Emergency assistance',
    title: 'Emergency Assistance After a Fire, Flood or Crisis',
    description: 'Lost your home to a fire or facing a sudden crisis? Ask for gift cards for food, clothes and essentials, and find disaster and emergency help.',
    h1: 'Emergency assistance when everything happens at once',
    lead: 'After a house fire, a flood or a sudden job loss, the first days are about the basics: food, clothes, toiletries and a place to start again. Ask for gift cards for exactly those things, and let your community help quickly.',
    categories: ['emergency'],
    stores: ['Walmart', 'Target', 'Amazon', 'Kroger', 'CVS', 'DoorDash'],
    resources: [
      { name: 'American Red Cross', url: 'https://www.redcross.org/get-help.html', text: 'Emergency shelter, food and recovery help after home fires and disasters.' },
      { name: 'FEMA disaster assistance', url: 'https://www.disasterassistance.gov/', text: 'Apply for federal help after a declared disaster, such as a hurricane, flood or wildfire.' },
      R211,
    ],
    faq: [
      { q: 'How quickly can I get help after an emergency?', a: 'Your request goes live as soon as you submit it, so you can share it the same day. Our team issues gift cards after each gift, and timing depends on the store.' },
      { q: 'Can I start a request for a family who lost their home?', a: 'Community groups can ask on behalf of people who agree to it. If it is your own household, choose My family when you start.' },
      { q: 'What can emergency gift cards cover?', a: 'Groceries, clothing, toiletries, medicine and household basics at stores like Walmart, Target, Amazon, Kroger, CVS and DoorDash.' },
    ],
  },
  {
    slug: 'help-with-essentials',
    name: 'Help with essentials',
    title: 'Help With Essentials: Diapers, Clothes and Household Basics',
    description: 'Ask donors for gift cards for diapers, formula, clothes, toiletries and cleaning supplies at Walmart, Target, Amazon and more. Free to ask.',
    h1: 'Help with everyday essentials',
    lead: 'Diapers, formula, school clothes, soap and cleaning supplies add up fast, and SNAP doesn’t cover most of them. Ask for gift cards for the stores where you buy them.',
    categories: ['essentials', 'clothing', 'childcare', 'education', 'other'],
    stores: ['Walmart', 'Target', 'Amazon', 'Costco', 'CVS', 'Walgreens'],
    resources: [
      { name: 'National Diaper Bank Network', url: 'https://nationaldiaperbanknetwork.org/', text: 'Find a diaper bank near you that gives free diapers and period supplies.' },
      WIC,
      R211,
      BENEFIT_FINDER,
    ],
    faq: [
      { q: 'Can I ask for diapers and baby formula?', a: 'Yes. Choose Baby and kids as a need and pick stores like Target, Walmart, Amazon or CVS.' },
      { q: 'Why ask for essentials here if I get SNAP?', a: 'SNAP pays for food only. Gift cards from donors can cover what it doesn’t, like diapers, toiletries and cleaning supplies.' },
      { q: 'Can I ask for school supplies or clothes?', a: 'Yes. Choose School and learning or Clothing, and stores like Target, Walmart or Amazon.' },
    ],
  },
];

/** The help page for a request's need or older category id, if there is one. */
export const needForCategory = (category: string | null | undefined) =>
  category ? NEEDS.find((n) => n.categories.includes(category)) : undefined;
