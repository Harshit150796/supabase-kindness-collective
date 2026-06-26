import { SEO, breadcrumbJsonLd } from '@/components/SEO';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';

export default function Terms() {
  return (
    <div className="min-h-dvh bg-background">
      <SEO
        title="Terms of Service"
        description="Terms and conditions for using CouponDonation: donation policies, recipient eligibility, refunds, and platform usage."
        path="/terms"
        jsonLd={breadcrumbJsonLd([{ name: 'Home', path: '/' }, { name: 'Terms', path: '/terms' }])}
      />
      <Navbar />
      
      <main className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold mb-8">Terms of Service</h1>
          <p className="text-muted-foreground mb-8">Last updated: June 18, 2026</p>
          
          <div className="prose prose-lg max-w-none space-y-8">
            <section>
              <h2 className="text-2xl font-semibold mb-4">1. Acceptance of Terms</h2>
              <p className="text-muted-foreground leading-relaxed">
                By accessing and using CouponDonation ("the Platform"), you accept and agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our services.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">2. Description of Services</h2>
              <p className="text-muted-foreground leading-relaxed">
                CouponDonation operates as a digital financial infrastructure for philanthropy. We do not distribute physical cash. We facilitate the instant conversion of monetary donations into programmable, restricted digital assets (Smart Vouchers) that are strictly redeemable for essential goods through integrated retail merchant networks.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">3. User Accounts</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                To use certain features of the Platform, you must create an account. You agree to:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2">
                <li>Provide accurate and complete information</li>
                <li>Maintain the security of your account credentials</li>
                <li>Notify us immediately of any unauthorized access</li>
                <li>Be responsible for all activities under your account</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">4. Fundraiser Guidelines</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                When creating a fundraiser, you must:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2">
                <li>Provide truthful and accurate information about your situation</li>
                <li>Use funds only for the stated purpose</li>
                <li>Not engage in fraudulent or deceptive practices</li>
                <li>Comply with all applicable laws and regulations</li>
              </ul>
              <p className="text-muted-foreground leading-relaxed mt-4">
                We reserve the right to remove any fundraiser that violates these guidelines or our community standards.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">5. Donations</h2>
              <p className="text-muted-foreground leading-relaxed">
                Donations made through the Platform are converted into restricted digital Smart Vouchers. CouponDonation structurally guarantees that funds are locked to essential category codes (e.g., groceries, medical supplies) and can only be redeemed via our approved retail partners' checkout APIs. No direct cash transfers are distributed to recipients.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">5.1 Refund Policy</h2>
              <p className="text-muted-foreground leading-relaxed">
                All transactions on CouponDonation are final. Once a donation is processed, our automated backend engine instantaneously converts the funds into restricted digital Smart Vouchers assigned to the specific campaign. Because funds are immediately locked into third-party retail merchant networks at the moment of checkout, we cannot process standard cash refunds.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">6. Fees and Payments</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                CouponDonation may charge platform fees on donations. All payment processing is handled by Stripe, and transactions are subject to Stripe's terms of service. Fees will be clearly disclosed before any transaction is completed.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                The core platform is free for verified causes. Donors are presented with an optional choice at checkout to cover standard payment processing fees and/or leave a voluntary tip (top-up) to support CouponDonation's open-source infrastructure and operational costs.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">7. Prohibited Conduct</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                You may not:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2">
                <li>Use the Platform for illegal purposes</li>
                <li>Create fraudulent fundraisers or provide false information</li>
                <li>Harass, abuse, or harm other users</li>
                <li>Attempt to circumvent security measures</li>
                <li>Use automated systems to access the Platform</li>
                <li>Infringe on intellectual property rights</li>
                <li>Originate transactions from, or provide support to, prohibited jurisdictions including Cuba, Iran, North Korea, Syria, and the Crimea, Donetsk, and Luhansk regions, or persons subject to financial sanctions</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">8. Intellectual Property</h2>
              <p className="text-muted-foreground leading-relaxed">
                All content on the Platform, including logos, text, graphics, and software, is the property of CouponDonation or its licensors. You may not use our intellectual property without prior written consent.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">9. Disclaimer of Warranties</h2>
              <p className="text-muted-foreground leading-relaxed">
                The Platform is provided "as is" without warranties of any kind. We do not guarantee that the Platform will be error-free, secure, or continuously available.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">10. Limitation of Liability</h2>
              <p className="text-muted-foreground leading-relaxed">
                To the maximum extent permitted by law, CouponDonation shall not be liable for any indirect, incidental, special, or consequential damages arising from your use of the Platform.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">11. Changes to Terms</h2>
              <p className="text-muted-foreground leading-relaxed">
                We may modify these Terms at any time. Continued use of the Platform after changes constitutes acceptance of the updated Terms. We will notify users of significant changes via email or platform notification.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">12. Contact Information</h2>
              <p className="text-muted-foreground leading-relaxed">
                For questions about these Terms of Service, please contact us at:
              </p>
              <p className="text-muted-foreground mt-2">
                Email: <a href="mailto:hello@coupondonation.com" className="text-primary hover:underline">hello@coupondonation.com</a>
              </p>
            </section>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
