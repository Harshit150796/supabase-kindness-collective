import { Navigate, useLocation } from 'react-router-dom';
import { SEO } from '@/components/SEO';
import { breadcrumbJsonLd, canonicalUrl, faqJsonLd } from '@/lib/seo';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { FaqList, OpenRequests, PageHero, RelatedLinks, StoreGrid, TwoPaths } from '@/components/seo/HelpSections';
import { GIVE_PAGES, GIVING_FAQ, givePageForPath } from '@/data/givePages';
import { NEEDS } from '@/data/needs';

/**
 * Pages for people who want to give (/donate-gift-cards, /buy-groceries-for-a-family,
 * /holiday-giving): live requests to choose from, how a gift becomes a gift card, the stores and the
 * questions donors ask. Content lives in src/data/givePages.ts.
 */
export default function GivePage() {
  const { pathname } = useLocation();
  const page = givePageForPath(pathname.replace(/\/+$/, ''));
  if (!page) return <Navigate to="/donate" replace />;

  const faq = [...page.faq, ...GIVING_FAQ];
  const jsonLd = [
    {
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      '@id': canonicalUrl(page.path),
      url: canonicalUrl(page.path),
      name: page.title,
      description: page.description,
      inLanguage: 'en-US',
      isPartOf: { '@id': 'https://coupondonation.com/#website' },
      publisher: { '@id': 'https://coupondonation.com/#organization' },
      potentialAction: { '@type': 'DonateAction', target: canonicalUrl('/donate'), recipient: { '@id': 'https://coupondonation.com/#organization' } },
    },
    breadcrumbJsonLd([{ name: 'Home', path: '/' }, { name: page.name, path: page.path }]),
    faqJsonLd(faq),
  ];

  return (
    <div className="min-h-dvh bg-background">
      <SEO title={page.title} description={page.description} path={page.path} jsonLd={jsonLd} />
      <Navbar />
      <main>
        <PageHero h1={page.h1} lead={page.lead} primary={page.primary} secondary={page.secondary} />
        <OpenRequests
          title={page.requestsTitle}
          needs={page.needs}
          emptyText="There are no open requests that match right now. You can still give to the shared pool, and your gift cards go to people who asked for help."
        />
        <TwoPaths give={{ title: 'How giving works', steps: page.steps, action: page.primary }} />
        <StoreGrid title={page.storesTitle} intro={page.storesIntro} stores={page.stores} />
        <FaqList items={faq}>
          {page.note && (
            <div className="mt-8 max-w-3xl rounded-[1.5rem] p-6 sm:p-7" style={{ backgroundColor: 'hsl(var(--primary-97))' }}>
              <h3 className="font-sans text-lg font-semibold text-foreground">{page.note.title}</h3>
              <p className="mt-2 text-[16px] leading-relaxed text-muted-foreground">{page.note.text}</p>
            </div>
          )}
        </FaqList>
        <RelatedLinks
          title="More ways to help"
          links={[
            ...GIVE_PAGES.filter((g) => g.path !== page.path).map((g) => ({ name: g.name, to: g.path })),
            { name: 'Compare with GoFundMe', to: '/gofundme-alternative' },
            ...NEEDS.map((n) => ({ name: n.name, to: `/help/${n.slug}` })),
          ]}
        />
      </main>
      <Footer />
    </div>
  );
}
