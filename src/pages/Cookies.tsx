import { SEO, breadcrumbJsonLd } from '@/components/SEO';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';

export default function Cookies() {
  return (
    <div className="min-h-dvh bg-background">
      <SEO
        title="Cookie Policy"
        description="How CouponDonation uses cookies and similar technologies to operate the site, analyze usage, and remember your preferences."
        path="/cookies"
        jsonLd={breadcrumbJsonLd([{ name: 'Home', path: '/' }, { name: 'Cookies', path: '/cookies' }])}
      />
      <Navbar />

      <main className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold mb-8">Cookie Policy</h1>
          <p className="text-muted-foreground mb-8">Last updated: July 19, 2026</p>

          <div className="prose prose-lg max-w-none space-y-8">
            <section>
              <h2 className="text-2xl font-semibold mb-4">1. Introduction</h2>
              <p className="text-muted-foreground leading-relaxed">
                This Cookie Policy explains how CouponDonation ("we," "our," or "us") uses cookies and similar tracking technologies when you visit coupondonation.com. It explains what these technologies are, why we use them, and the choices you have to control them.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">2. What Are Cookies</h2>
              <p className="text-muted-foreground leading-relaxed">
                Cookies are small text files placed on your device when you visit a website. They allow the site to recognize your device, remember your preferences, keep you signed in, and understand how the site is being used. We also use similar technologies such as localStorage and sessionStorage.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">3. Types of Cookies We Use</h2>
              <ul className="list-disc list-inside text-muted-foreground space-y-2">
                <li><strong className="text-foreground">Essential cookies</strong> — required for authentication, session security, fraud prevention, and core platform functionality. The site cannot work properly without these.</li>
                <li><strong className="text-foreground">Preference cookies</strong> — remember settings such as your privacy consent choice and dashboard role (donor or recipient).</li>
                <li><strong className="text-foreground">Analytics cookies</strong> — help us understand which pages are visited, how donors interact with fundraisers, and where we can improve the experience.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">4. Third-Party Cookies</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                Some cookies are placed by trusted third-party services we rely on to operate the platform:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2">
                <li><strong className="text-foreground">Stripe</strong> — secure payment processing and fraud detection during checkout.</li>
                <li><strong className="text-foreground">Supabase</strong> — authentication tokens and session management.</li>
                <li><strong className="text-foreground">Analytics providers</strong> — anonymous usage measurement to improve the platform.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">5. Managing Cookies</h2>
              <p className="text-muted-foreground leading-relaxed">
                You can control or delete cookies through your browser settings at any time. Most browsers let you block cookies entirely, allow only first-party cookies, or delete stored cookies. Please note that disabling essential cookies may prevent you from signing in, donating, or using key features of CouponDonation.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">6. Changes to This Policy</h2>
              <p className="text-muted-foreground leading-relaxed">
                We may update this Cookie Policy from time to time to reflect changes in technology, legal requirements, or how we operate. The "Last updated" date at the top of this page indicates when the policy was last revised.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">7. Contact Us</h2>
              <p className="text-muted-foreground leading-relaxed">
                If you have questions about our use of cookies, please contact us at:
              </p>
              <p className="text-muted-foreground mt-2">
                Email: <a href="mailto:connect@coupondonation.com" className="text-primary hover:underline">connect@coupondonation.com</a>
              </p>
            </section>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
