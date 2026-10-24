import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { DonationFlow } from '@/components/landing/DonationFlow';
import { SecurityBadges } from '@/components/landing/SecurityBadges';
import { Link } from 'react-router-dom';
import { SEO, breadcrumbJsonLd } from '@/components/SEO';

export default function Donate() {
  return (
    <div className="min-h-dvh bg-background">
      <SEO
        title="Donate Gift Cards and Groceries to Families in Need"
        description="Choose stores like Walmart, Kroger or CVS and an amount. Your gift becomes gift cards for people who asked for help, with a receipt for every gift."
        path="/donate"
        jsonLd={breadcrumbJsonLd([{ name: 'Home', path: '/' }, { name: 'Donate', path: '/donate' }])}
      />
      <Navbar />
      <main>
        <DonationFlow />
        <section aria-labelledby="donate-card-heading" className="py-14 md:py-20">
          <div className="container mx-auto flex max-w-6xl flex-col gap-5 px-4 md:flex-row md:items-center md:justify-between">
            <div className="max-w-2xl">
              <h2 id="donate-card-heading" className="font-display text-3xl font-normal text-foreground md:text-4xl">Already have a gift card you won’t use?</h2>
              <p className="mt-3 text-[17px] leading-relaxed text-muted-foreground">Donate an unused digital gift card, store coupon or promo code to a family or our shared pool. We check every card before it’s given.</p>
            </div>
            <Link to="/donate-a-card" className="inline-flex h-12 shrink-0 items-center justify-center rounded-md border border-input bg-background px-6 text-[15px] font-medium text-foreground hover:bg-muted">Donate a card</Link>
          </div>
        </section>
        <SecurityBadges />
      </main>
      <Footer />
    </div>
  );
}
