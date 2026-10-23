import { Navigate, useParams } from 'react-router-dom';
import { SEO } from '@/components/SEO';
import { breadcrumbJsonLd, canonicalUrl, faqJsonLd } from '@/lib/seo';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { FaqList, OpenRequests, PageHero, RelatedLinks, ResourceList, StoreGrid, TwoPaths } from '@/components/seo/HelpSections';
import { ASKING_FAQ, ASK_STEPS, NEEDS } from '@/data/needs';
import { GIVE_PAGES, GIVE_STEPS } from '@/data/givePages';

/** Older or alternative addresses for a help page. */
const ALIASES: Record<string, string> = { 'travel-assistance': 'transportation-assistance', 'bill-assistance': 'help-paying-bills' };

/**
 * A help page for one need (/help/food-assistance and the rest): how to ask, live requests, how to
 * give, stores, other programs that help and the common questions, all readable without JavaScript
 * tricks. Content lives in src/data/needs.ts.
 */
export default function NeedPage() {
  const { need = '' } = useParams();
  if (ALIASES[need]) return <Navigate to={`/help/${ALIASES[need]}`} replace />;
  const page = NEEDS.find((n) => n.slug === need);
  if (!page) return <Navigate to="/stories" replace />;

  const path = `/help/${page.slug}`;
  const faq = [...page.faq, ...ASKING_FAQ];
  const lower = page.name.toLowerCase();
  const jsonLd = [
    {
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      '@id': canonicalUrl(path),
      url: canonicalUrl(path),
      name: page.title,
      description: page.description,
      inLanguage: 'en-US',
      about: page.name,
      isPartOf: { '@id': 'https://coupondonation.com/#website' },
      publisher: { '@id': 'https://coupondonation.com/#organization' },
    },
    breadcrumbJsonLd([{ name: 'Home', path: '/' }, { name: page.name, path }]),
    faqJsonLd(faq),
  ];

  return (
    <div className="min-h-dvh bg-background">
      <SEO title={page.title} description={page.description} path={path} jsonLd={jsonLd} />
      <Navbar />
      <main>
        <PageHero h1={page.h1} lead={page.lead} primary={{ label: 'Ask for help', to: '/apply' }} secondary={{ label: 'Help someone', to: '#open-requests' }} />
        <OpenRequests
          title={`Open requests for ${lower}`}
          needs={page.categories}
          emptyText={`No one is asking for ${lower} right now. If you need it, you can start the first request in a few minutes.`}
        />
        <TwoPaths
          ask={{ title: 'If you need help', steps: ASK_STEPS, action: { label: 'Ask for help', to: '/apply' } }}
          give={{ title: 'If you want to help', steps: GIVE_STEPS, action: { label: 'Give a gift card', to: '#open-requests' } }}
        />
        <StoreGrid title="Stores people ask for" intro={`Requests for ${lower} usually name these stores. Choose one to give a gift card there.`} stores={page.stores} />
        <ResourceList
          title="Other places to get help"
          intro="CouponDonation is one way to get help. These programs may help too, often with things donors here can’t cover."
          items={page.resources}
        />
        <FaqList items={faq} />
        <RelatedLinks
          title="More ways to get or give help"
          links={[
            ...NEEDS.filter((n) => n.slug !== page.slug).map((n) => ({ name: n.name, to: `/help/${n.slug}` })),
            ...GIVE_PAGES.map((g) => ({ name: g.name, to: g.path })),
          ]}
        />
      </main>
      <Footer />
    </div>
  );
}
