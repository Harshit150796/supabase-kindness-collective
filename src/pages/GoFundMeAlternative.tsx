import { SEO } from '@/components/SEO';
import { breadcrumbJsonLd, canonicalUrl, faqJsonLd } from '@/lib/seo';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { FaqList, PageHero, RelatedLinks } from '@/components/seo/HelpSections';
import { GIVE_PAGES } from '@/data/givePages';
import { NEEDS } from '@/data/needs';

const PATH = '/gofundme-alternative';
const TITLE = 'A GoFundMe Alternative for Groceries and Essentials';
const DESCRIPTION = 'How CouponDonation compares with GoFundMe: fees, how help is delivered, who decides how it’s spent, and which one fits your need.';

/**
 * Comparison rows. GoFundMe facts come from its help center (sources listed under the table, checked
 * October 2026); recheck them before changing this page, and keep it fair: a comparison that
 * overstates our side is false advertising.
 */
const ROWS: { label: string; ours: string; theirs: string }[] = [
  { label: 'What the person receives', ours: 'Gift cards and coupons for the stores they chose', theirs: 'Money, transferred to a bank account' },
  { label: 'Platform fee', ours: 'None', theirs: 'None' },
  { label: 'Card processing fee', ours: 'Never taken from the gift. Donors can cover it at checkout; otherwise optional tips pay it', theirs: '2.9% + $0.30 per donation in the US, deducted from the funds (5% on recurring donations)' },
  { label: 'Optional tip to the platform', ours: 'Yes', theirs: 'Yes' },
  { label: 'How the help can be used', ours: 'Only at the stores named, so donors know what their gift buys', theirs: 'However the organizer decides' },
  { label: 'When it arrives', ours: 'Our team issues gift cards after each gift; timing depends on the store', theirs: 'Bank transfers take 2 to 5 business days once donations are available; new donations can take up to 5 business days to verify' },
  { label: 'Best for', ours: 'Groceries, meals, medicine, rides, baby items and household essentials', theirs: 'Rent, medical and funeral bills, travel and anything paid in cash' },
];

const FAQ = [
  { q: 'Is CouponDonation free like GoFundMe?', a: 'Yes, it is free to start a request on both. On CouponDonation the card fee never comes out of the gift; on GoFundMe a transaction fee is deducted from each donation.' },
  { q: 'Can I move my GoFundMe to CouponDonation?', a: 'You can start a CouponDonation request for everyday costs in a few minutes. Donations already made on GoFundMe stay there.' },
  { q: 'Can I use both?', a: 'Yes. Some people raise cash on GoFundMe for rent or bills and use CouponDonation for groceries and essentials, so each gift goes where it helps most.' },
  { q: 'Do donors get a receipt?', a: 'Yes. Every gift on CouponDonation comes with a receipt, and donors get an email when the family receives their gift cards.' },
  { q: 'Are donations tax-deductible?', a: 'Not on CouponDonation. CouponDonation Inc. is a company, not a registered charity.' },
];

const FITS_US = [
  'The need is something a store sells: groceries, meals, pharmacy items, diapers, clothes or rides.',
  'Donors want to know exactly what their gift buys.',
  'You want help that can only be spent on what you asked for.',
  'You want every card fee kept out of the gift.',
];
const FITS_THEM = [
  'You need cash for rent, a mortgage, medical or funeral bills, car repairs or travel.',
  'You live outside the United States, where CouponDonation isn’t available.',
  'You are raising money for a registered charity and donors want a tax deduction.',
];

export default function GoFundMeAlternative() {
  const jsonLd = [
    {
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      '@id': canonicalUrl(PATH),
      url: canonicalUrl(PATH),
      name: TITLE,
      description: DESCRIPTION,
      inLanguage: 'en-US',
      dateModified: '2026-10-23',
      isPartOf: { '@id': 'https://coupondonation.com/#website' },
      publisher: { '@id': 'https://coupondonation.com/#organization' },
    },
    breadcrumbJsonLd([{ name: 'Home', path: '/' }, { name: 'Compare with GoFundMe', path: PATH }]),
    faqJsonLd(FAQ),
  ];

  return (
    <div className="min-h-dvh bg-background">
      <SEO title={TITLE} description={DESCRIPTION} path={PATH} jsonLd={jsonLd} />
      <Navbar />
      <main>
        <PageHero
          h1="A GoFundMe alternative for everyday needs"
          lead="GoFundMe raises money that’s paid into a bank account. CouponDonation raises gift cards for the specific stores someone asked for. When the need is groceries, medicine, rides or household basics, that difference matters to donors and to the people asking."
          primary={{ label: 'Ask for help', to: '/apply' }}
          secondary={{ label: 'See open requests', to: '/stories' }}
        />

        <section aria-labelledby="compare-heading" className="py-16 md:py-24" style={{ backgroundColor: 'hsl(var(--primary-97))' }}>
          <div className="container mx-auto max-w-6xl px-4">
            <h2 id="compare-heading" className="font-display text-4xl font-normal text-foreground md:text-5xl">CouponDonation and GoFundMe, side by side</h2>
            <table className="mt-10 w-full border-collapse text-left text-[16px] leading-relaxed">
              <caption className="sr-only">How CouponDonation and GoFundMe compare for personal fundraisers in the United States</caption>
              <thead className="hidden md:table-header-group">
                <tr className="border-b border-foreground/20">
                  <th scope="col" className="w-[24%] py-4 pr-6 font-sans text-sm font-medium text-muted-foreground"><span className="sr-only">Topic</span></th>
                  <th scope="col" className="w-[38%] py-4 pr-6 font-sans text-base font-semibold text-foreground">CouponDonation</th>
                  <th scope="col" className="py-4 font-sans text-base font-semibold text-foreground">GoFundMe</th>
                </tr>
              </thead>
              <tbody>
                {ROWS.map((row) => (
                  <tr key={row.label} className="block border-b border-foreground/10 py-5 md:table-row md:py-0">
                    <th scope="row" className="block font-sans font-semibold text-foreground md:table-cell md:py-5 md:pr-6 md:align-top">{row.label}</th>
                    <td className="mt-2 block text-foreground/85 md:mt-0 md:table-cell md:py-5 md:pr-6 md:align-top"><span className="font-medium text-foreground md:hidden">CouponDonation: </span>{row.ours}</td>
                    <td className="mt-1.5 block text-muted-foreground md:mt-0 md:table-cell md:py-5 md:align-top"><span className="font-medium text-foreground md:hidden">GoFundMe: </span>{row.theirs}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="mt-6 max-w-3xl text-sm leading-relaxed text-muted-foreground">
              GoFundMe details are from its help center:{' '}
              <a className="text-primary underline underline-offset-2" href="https://support.gofundme.com/hc/en-us/articles/203604424-Pricing-and-fees" target="_blank" rel="noopener noreferrer">Pricing and fees</a>{' '}(updated September 30, 2026) and{' '}
              <a className="text-primary underline underline-offset-2" href="https://support.gofundme.com/hc/en-us/articles/360042184631-Withdraw-money-to-your-personal-bank-account" target="_blank" rel="noopener noreferrer">Withdraw money to your personal bank account</a>, checked October 2026. GoFundMe is a trademark of GoFundMe, Inc.; CouponDonation isn’t affiliated with or endorsed by GoFundMe.
            </p>
          </div>
        </section>

        <section aria-label="Which one fits" className="py-16 md:py-24">
          <div className="container mx-auto grid max-w-6xl gap-14 px-4 lg:grid-cols-2 lg:gap-20">
            <div>
              <h2 className="font-display text-4xl font-normal text-foreground md:text-5xl">When CouponDonation fits better</h2>
              <ul className="mt-8 list-disc space-y-3 pl-6 text-[17px] leading-relaxed text-foreground/85 marker:text-primary">{FITS_US.map((item) => <li key={item}>{item}</li>)}</ul>
            </div>
            <div>
              <h2 className="font-display text-4xl font-normal text-foreground md:text-5xl">When GoFundMe fits better</h2>
              <ul className="mt-8 list-disc space-y-3 pl-6 text-[17px] leading-relaxed text-foreground/85 marker:text-muted-foreground">{FITS_THEM.map((item) => <li key={item}>{item}</li>)}</ul>
            </div>
          </div>
        </section>

        <FaqList items={FAQ} />
        <RelatedLinks
          title="Get or give help"
          links={[...NEEDS.map((n) => ({ name: n.name, to: `/help/${n.slug}` })), ...GIVE_PAGES.map((g) => ({ name: g.name, to: g.path }))]}
        />
      </main>
      <Footer />
    </div>
  );
}
