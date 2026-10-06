import { Link, Navigate, useParams } from 'react-router-dom';
import { SEO } from '@/components/SEO';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { FundraiserCard } from '@/components/stories/FundraiserCard';
import { useFundraisers } from '@/hooks/useFundraisers';
import { NEEDS } from '@/data/needs';

const SITE = 'https://coupondonation.com';

export default function NeedPage() {
  const { need } = useParams();
  const page = NEEDS.find((n) => n.slug === need);
  const { data, isLoading } = useFundraisers({ limit: 48 });
  if (!page) return <Navigate to="/stories" replace />;
  const own = (data ?? []).filter((f) => page.categories.includes(f.category));
  const others = (data ?? []).filter((f) => !page.categories.includes(f.category)).slice(0, 3);
  const path = `/help/${page.slug}`;
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      { '@type': 'CollectionPage', name: page.title, description: page.description, url: `${SITE}${path}` },
      { '@type': 'FAQPage', mainEntity: page.faq.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })) },
      { '@type': 'BreadcrumbList', itemListElement: [{ '@type': 'ListItem', position: 1, name: 'Home', item: SITE }, { '@type': 'ListItem', position: 2, name: page.name, item: `${SITE}${path}` }] },
    ],
  };
  return (
    <div className="min-h-dvh bg-background">
      <SEO title={page.title} description={page.description} path={path} jsonLd={jsonLd as any} />
      <Navbar />
      <main>
        <section className="py-20 md:py-28">
          <div className="container mx-auto max-w-4xl px-4">
            <h1 className="font-display text-5xl leading-[1.02] md:text-7xl">{page.h1}</h1>
            {page.explainer.map((p) => <p key={p} className="mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground">{p}</p>)}
            <div className="mt-8 flex flex-wrap gap-3"><Button asChild><Link to="/apply">Start a fundraiser for this need</Link></Button><Button asChild variant="outline"><Link to="/apply">Apply for help</Link></Button></div>
          </div>
        </section>
        <section className="bg-primary/5 py-16" aria-labelledby="need-campaigns">
          <div className="container mx-auto px-4">
            <h2 id="need-campaigns" className="font-display text-4xl">{page.name} campaigns</h2>
            {isLoading ? <div className="mt-8 grid gap-8 md:grid-cols-3">{[0, 1, 2].map((i) => <Skeleton key={i} className="aspect-[4/3]" />)}</div>
              : own.length ? <div className="mt-8 grid gap-10 sm:grid-cols-2 lg:grid-cols-3">{own.map((f) => <FundraiserCard key={f.id} fundraiser={f} />)}</div>
              : <div className="mt-6 max-w-xl"><p className="text-muted-foreground">There are no open {page.name.toLowerCase()} campaigns right now. You can start one, or apply for help.</p><div className="mt-5 flex flex-wrap gap-3"><Button asChild><Link to="/apply">Start a fundraiser for this need</Link></Button><Button asChild variant="outline"><Link to="/apply">Apply for help</Link></Button></div></div>}
          </div>
        </section>
        {!own.length && others.length > 0 && (
          <section className="py-16" aria-labelledby="other-campaigns">
            <div className="container mx-auto px-4">
              <h2 id="other-campaigns" className="font-display text-4xl">Other campaigns open now</h2>
              <p className="mt-2 text-muted-foreground">These campaigns are for different needs.</p>
              <div className="mt-8 grid gap-10 sm:grid-cols-2 lg:grid-cols-3">{others.map((f) => <FundraiserCard key={f.id} fundraiser={f} />)}</div>
            </div>
          </section>
        )}
        <section className="py-16">
          <div className="container mx-auto grid max-w-5xl gap-12 px-4 md:grid-cols-[1.4fr_1fr]">
            <div><h2 className="font-display text-4xl">Questions</h2>
              <Accordion type="single" collapsible className="mt-6">{page.faq.map((f, i) => <AccordionItem key={f.q} value={`q${i}`}><AccordionTrigger className="text-left">{f.q}</AccordionTrigger><AccordionContent className="text-muted-foreground">{f.a}</AccordionContent></AccordionItem>)}</Accordion>
            </div>
            <nav aria-label="Other needs"><h2 className="font-display text-3xl">Other needs</h2><ul className="mt-5 space-y-2">{NEEDS.filter((n) => n.slug !== page.slug).map((n) => <li key={n.slug}><Link to={`/help/${n.slug}`} className="inline-block py-2 text-primary hover:underline">{n.name}</Link></li>)}</ul></nav>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
