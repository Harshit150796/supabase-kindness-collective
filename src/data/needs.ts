export interface NeedPage {
  slug: string;
  name: string;
  title: string;
  description: string;
  h1: string;
  categories: string[];
  explainer: string[];
  faq: { q: string; a: string }[];
}

const commonFaq = [
  { q: 'Is the money given as cash?', a: 'No. Donations are converted into coupons or gift cards that can only be used at participating retailers, so support goes toward the need the fundraiser describes.' },
  { q: 'Can I see where my donation went?', a: 'Each donation has a receipt and a coupon trail. Public pages show campaign-level totals only; individual redemptions stay private.' },
];

export const NEEDS: NeedPage[] = [
  {
    slug: 'food-assistance', name: 'Food assistance', categories: ['food'],
    title: 'Food Assistance Fundraisers', h1: 'Food assistance, delivered as coupons for groceries',
    description: 'Support families who need help with food. CouponDonation turns donations into coupon-locked grocery support with a receipt trail.',
    explainer: ['When a family is struggling to put food on the table, a fundraiser on CouponDonation lets friends, neighbours and strangers help directly.', 'Donations become coupons for participating grocery and food retailers instead of cash, so support is used for food.'],
    faq: [{ q: 'Who can start a food assistance fundraiser?', a: 'Anyone with an account can start one for themselves, their family, or someone they support with consent.' }, ...commonFaq],
  },
  {
    slug: 'grocery-assistance', name: 'Grocery assistance', categories: ['food'],
    title: 'Grocery Assistance Fundraisers', h1: 'Grocery assistance through coupon-locked giving',
    description: 'Help with grocery bills through fundraisers that convert donations into grocery coupons for participating retailers.',
    explainer: ['Grocery fundraisers cover the weekly basket: fresh food, pantry staples and household basics sold at participating grocers.', 'Donors choose an amount and the retailers to support; the gift is issued as coupons the recipient uses at checkout.'],
    faq: [{ q: 'Which stores can grocery coupons be used at?', a: 'Coupons are issued for the participating retailers shown during donation. Availability can vary by brand.' }, ...commonFaq],
  },
  {
    slug: 'help-paying-bills', name: 'Help paying bills', categories: ['utilities'],
    title: 'Help Paying Bills Fundraisers', h1: 'Help paying bills and household essentials',
    description: 'Fundraisers for people who need help with utility and household bills, with support delivered as coupon-locked value.',
    explainer: ['Utility shutoffs and overdue bills can leave a household choosing between heat and food. Bill-help fundraisers raise support for essential household costs.', 'Because CouponDonation delivers support as coupons rather than cash, value raised for everyday purchases can free up a family’s own money for bills.'],
    faq: [{ q: 'Does CouponDonation pay bills directly?', a: 'No. Support is issued as coupons for participating retailers; we do not pay utility companies directly.' }, ...commonFaq],
  },
  {
    slug: 'transportation-assistance', name: 'Transportation assistance', categories: ['transportation'],
    title: 'Transportation Assistance Fundraisers', h1: 'Transportation assistance for getting to work, school and care',
    description: 'Fundraisers for people who need help with transportation costs, supported through coupon-locked giving.',
    explainer: ['Getting to a job, a clinic or a child’s school can depend on fuel, transit or a working car. Transportation fundraisers gather support for those costs.', 'Donations are issued as coupons for participating retailers, never as cash.'],
    faq: [{ q: 'Can I start a transportation fundraiser?', a: 'Yes. Choose Transportation as the category when you start a fundraiser.' }, ...commonFaq],
  },
  {
    slug: 'healthcare-assistance', name: 'Healthcare assistance', categories: ['health', 'healthcare'],
    title: 'Healthcare Assistance Fundraisers', h1: 'Healthcare assistance for everyday health needs',
    description: 'Fundraisers for people facing health challenges, with donations converted into coupon-locked support.',
    explainer: ['An illness or injury often brings costs beyond the hospital: pharmacy items, groceries during recovery and household basics.', 'Healthcare fundraisers on CouponDonation raise coupon-locked support for those everyday needs. We do not pay medical providers.'],
    faq: [{ q: 'Does this cover medical bills?', a: 'No. Support is delivered as coupons for participating retailers, which can cover everyday needs during recovery.' }, ...commonFaq],
  },
  {
    slug: 'emergency-assistance', name: 'Emergency assistance', categories: ['emergency'],
    title: 'Emergency Assistance Fundraisers', h1: 'Emergency assistance when something unexpected happens',
    description: 'Fundraisers for families facing a sudden emergency, with donations delivered as coupon-locked support.',
    explainer: ['Fires, accidents and sudden job loss can leave a household without the basics overnight. Emergency fundraisers let a community respond quickly.', 'Support is issued as coupons for participating retailers so it goes toward essentials.'],
    faq: [{ q: 'How quickly are coupons issued?', a: 'Coupons are generated after a donation completes. Some brands need extra procurement time before codes are available.' }, ...commonFaq],
  },
  {
    slug: 'help-with-essentials', name: 'Help with essentials', categories: ['essentials', 'clothing'],
    title: 'Help With Essentials Fundraisers', h1: 'Help with essentials: clothing, hygiene and household basics',
    description: 'Fundraisers for everyday essentials such as clothing and household basics, supported through coupon-locked giving.',
    explainer: ['Diapers, clothing, cleaning supplies and toiletries add up. Essentials fundraisers gather support for the everyday items a household needs.', 'Donations become coupons for participating retailers rather than cash.'],
    faq: [{ q: 'What counts as an essential?', a: 'Everyday household items such as clothing, hygiene products and cleaning supplies sold by participating retailers.' }, ...commonFaq],
  },
];

export const needForCategory = (category: string) => NEEDS.find((n) => n.categories.includes(category));
