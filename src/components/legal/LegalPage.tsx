import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { SEO, breadcrumbJsonLd } from '@/components/SEO';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { COMPANY, COMPANY_FORM, LEGAL_EMAIL, LEGAL_PHONE, LEGAL_UPDATED, MAILING_ADDRESS } from '@/lib/legal';

export interface LegalSection { id: string; title: string; body: ReactNode }

/**
 * Shared frame for the legal pages: title, last-updated date, a contents list, numbered sections and
 * the company's contact block. Plain language, one column, at reading width.
 */
export function LegalPage({ title, path, description, intro, sections }: {
  title: string;
  path: string;
  description: string;
  intro: ReactNode;
  sections: LegalSection[];
}) {
  return (
    <div className="min-h-dvh bg-background">
      <SEO title={title} description={description} path={path} jsonLd={breadcrumbJsonLd([{ name: 'Home', path: '/' }, { name: title, path }])} />
      <Navbar />
      <main className="container mx-auto px-4 pb-20 pt-28 md:pt-32">
        <article className="mx-auto max-w-3xl">
          <h1 className="font-display text-5xl font-normal leading-[1.05] text-foreground md:text-6xl">{title}</h1>
          <p className="mt-4 text-sm text-muted-foreground">Last updated {LEGAL_UPDATED}</p>
          <div className="mt-8 space-y-4 text-[17px] leading-[1.7] text-foreground/90">{intro}</div>

          <nav aria-label="On this page" className="mt-10 rounded-2xl bg-muted/50 p-5 sm:p-6">
            <p className="text-sm font-medium text-foreground">On this page</p>
            <ol className="mt-3 grid gap-x-6 gap-y-1.5 text-[15px] sm:grid-cols-2">
              {sections.map((section, i) => (
                <li key={section.id}>
                  <a href={`#${section.id}`} className="inline-flex min-h-9 items-center text-primary underline-offset-2 hover:underline">
                    {i + 1}. {section.title}
                  </a>
                </li>
              ))}
            </ol>
          </nav>

          <div className="mt-12 space-y-12">
            {sections.map((section, i) => (
              <section key={section.id} id={section.id} className="scroll-mt-28">
                <h2 className="font-display text-3xl font-normal text-foreground">{i + 1}. {section.title}</h2>
                <div className="legal-body mt-4 space-y-4 text-[16px] leading-[1.75] text-foreground/85">{section.body}</div>
              </section>
            ))}
          </div>

          <section aria-label="Contact" className="mt-16 rounded-2xl bg-[hsl(var(--primary-97))] p-6 sm:p-7">
            <h2 className="font-display text-2xl font-normal text-foreground">Contact us</h2>
            <p className="mt-3 text-[16px] leading-relaxed text-foreground/85">
              {COMPANY}, {COMPANY_FORM}.<br />
              Email: <a href={`mailto:${LEGAL_EMAIL}`} className="font-medium text-primary underline underline-offset-2">{LEGAL_EMAIL}</a><br />
              Phone: <a href={`tel:${LEGAL_PHONE.replace(/[^+\d]/g, '')}`} className="font-medium text-primary underline underline-offset-2">{LEGAL_PHONE}</a>
              {MAILING_ADDRESS && <><br />Mail: {MAILING_ADDRESS}</>}
            </p>
          </section>
        </article>
      </main>
      <Footer contact={false} />
    </div>
  );
}

/** A bulleted list for legal sections. */
export function Bullets({ items }: { items: ReactNode[] }) {
  return (
    <ul className="list-disc space-y-2 pl-6 marker:text-muted-foreground">
      {items.map((item, i) => <li key={i}>{item}</li>)}
    </ul>
  );
}

/** An in-text link to another legal page. */
export function DocLink({ to, children }: { to: string; children: ReactNode }) {
  return <Link to={to} className="font-medium text-primary underline underline-offset-2">{children}</Link>;
}

export function SupportEmail() {
  return <a href={`mailto:${LEGAL_EMAIL}`} className="font-medium text-primary underline underline-offset-2">{LEGAL_EMAIL}</a>;
}
