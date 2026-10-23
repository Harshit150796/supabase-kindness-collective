import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { FundraiserCard } from '@/components/stories/FundraiserCard';
import { RetailerLogo } from '@/components/landing/donate/GiftLedger';
import { findRetailer } from '@/components/landing/donate/retailers';
import { useFundraisers } from '@/hooks/useFundraisers';
import type { FaqItem, HelpResource } from '@/data/needs';

/**
 * Building blocks for the search landing pages (/help/:need, the ways-to-give pages and the GoFundMe
 * comparison). Everything a crawler should read is in the page as text: answers are shown in full,
 * never hidden behind an accordion, and live requests load in one small query.
 */

export interface PageAction {
  label: string;
  to: string;
}

/** In-page anchors use a plain link so the browser scrolls; everything else uses the router. */
function ActionLink({ action, variant }: { action: PageAction; variant?: 'outline' }) {
  return (
    <Button asChild size="lg" variant={variant}>
      {action.to.startsWith('#') ? <a href={action.to}>{action.label}</a> : <Link to={action.to}>{action.label}</Link>}
    </Button>
  );
}

export function PageHero({ h1, lead, primary, secondary, children }: { h1: string; lead: string; primary: PageAction; secondary?: PageAction; children?: ReactNode }) {
  return (
    <section className="pb-14 pt-28 md:pb-20 md:pt-36">
      <div className="container mx-auto max-w-6xl px-4">
        <h1 className="max-w-4xl font-display text-5xl font-normal leading-[1.02] text-foreground md:text-7xl">{h1}</h1>
        <p className="mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground md:text-xl">{lead}</p>
        <div className="mt-8 flex flex-wrap gap-3">
          <ActionLink action={primary} />
          {secondary && <ActionLink action={secondary} variant="outline" />}
        </div>
        {children}
      </div>
    </section>
  );
}

/** Live requests for one or more needs; real requests first, examples labelled on the card. */
export function OpenRequests({ id = 'open-requests', title, needs, limit = 6, emptyText }: { id?: string; title: string; needs: string[]; limit?: number; emptyText: string }) {
  const { data, isLoading, isError, refetch } = useFundraisers({ needs, limit: limit + 6 });
  const list = [...(data ?? [])].sort((a, b) => Number(!!a.is_example) - Number(!!b.is_example)).slice(0, limit);
  return (
    <section id={id} aria-labelledby={`${id}-heading`} className="scroll-mt-24 py-16 md:py-24" style={{ backgroundColor: 'hsl(var(--primary-97))' }}>
      <div className="container mx-auto max-w-6xl px-4">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <h2 id={`${id}-heading`} className="max-w-3xl font-display text-4xl font-normal text-foreground md:text-5xl">{title}</h2>
          <Link to="/stories" className="inline-flex min-h-11 items-center text-[15px] font-medium text-primary hover:underline">All open requests</Link>
        </div>
        {isLoading ? (
          <div className="mt-10 grid gap-10 sm:grid-cols-2 lg:grid-cols-3">{[0, 1, 2].map((i) => <Skeleton key={i} className="aspect-[4/3] rounded-none" />)}</div>
        ) : isError ? (
          <div className="mt-8"><p className="text-muted-foreground">Requests couldn’t be loaded.</p><Button className="mt-4" variant="outline" onClick={() => refetch()}>Try again</Button></div>
        ) : list.length ? (
          <div className="mt-10 grid gap-10 sm:grid-cols-2 lg:grid-cols-3">{list.map((f) => <FundraiserCard key={f.id} fundraiser={f} />)}</div>
        ) : (
          <div className="mt-6 max-w-xl">
            <p className="text-[17px] leading-relaxed text-muted-foreground">{emptyText}</p>
            <div className="mt-5 flex flex-wrap gap-3"><Button asChild><Link to="/apply">Ask for help</Link></Button><Button asChild variant="outline"><Link to="/stories">See all requests</Link></Button></div>
          </div>
        )}
      </div>
    </section>
  );
}

export interface PathSteps {
  title: string;
  steps: { title: string; text: string }[];
  action: PageAction;
}

function PathColumn({ path, id }: { path: PathSteps; id: string }) {
  return (
    <div>
      <h2 id={id} className="font-display text-4xl font-normal text-foreground md:text-5xl">{path.title}</h2>
      <ol className="mt-8 space-y-7">
        {path.steps.map((step, i) => (
          <li key={step.title} className="grid grid-cols-[2.25rem_minmax(0,1fr)] gap-x-4">
            <span className="font-display text-4xl leading-none text-primary" aria-hidden="true">{i + 1}</span>
            <div>
              <h3 className="font-sans text-lg font-semibold text-foreground">{step.title}</h3>
              <p className="mt-1.5 text-[16px] leading-relaxed text-muted-foreground">{step.text}</p>
            </div>
          </li>
        ))}
      </ol>
      <div className="mt-8"><ActionLink action={path.action} /></div>
    </div>
  );
}

/** Numbered steps for asking for help and for giving it, side by side on wide screens. */
export function TwoPaths({ ask, give }: { ask?: PathSteps; give: PathSteps }) {
  return (
    <section aria-label="How it works" className="py-16 md:py-24">
      <div className={`container mx-auto grid max-w-6xl gap-14 px-4 ${ask ? 'lg:grid-cols-2 lg:gap-20' : ''}`}>
        {ask && <PathColumn path={ask} id="ask-heading" />}
        <PathColumn path={give} id="give-heading" />
      </div>
    </section>
  );
}

/** Stores for a need, each one tap from a gift there (the donate flow opens with it chosen). */
export function StoreGrid({ title, intro, stores }: { title: string; intro: string; stores: string[] }) {
  const retailers = stores.map(findRetailer).filter((r) => !!r.logo);
  if (!retailers.length) return null;
  return (
    <section aria-labelledby="stores-heading" className="py-16 md:py-24" style={{ backgroundColor: 'hsl(var(--primary-97))' }}>
      <div className="container mx-auto max-w-6xl px-4">
        <h2 id="stores-heading" className="font-display text-4xl font-normal text-foreground md:text-5xl">{title}</h2>
        <p className="mt-3 max-w-2xl text-[16px] leading-relaxed text-muted-foreground">{intro}</p>
        <ul className="mt-8 grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-4">
          {retailers.map((r) => (
            <li key={r.id}>
              <Link
                to={`/donate?store=${encodeURIComponent(r.id)}`}
                className="flex items-center gap-3 rounded-2xl bg-background p-3 outline-none transition-[box-shadow,transform] hover:shadow-[inset_0_0_0_2px_hsl(var(--primary))] focus-visible:ring-2 focus-visible:ring-ring active:scale-[.98]"
              >
                <RetailerLogo retailer={r} className="h-10 w-10 p-1.5" />
                <span className="min-w-0">
                  <span className="block truncate text-[15px] font-medium text-foreground">{r.name}</span>
                  <span className="block text-xs text-primary">Give a gift card</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

/** Other places that help. Outside links open in a new tab; we're not affiliated with any of them. */
export function ResourceList({ title, intro, items }: { title: string; intro: string; items: HelpResource[] }) {
  return (
    <section aria-labelledby="resources-heading" className="py-16 md:py-24">
      <div className="container mx-auto max-w-6xl px-4">
        <h2 id="resources-heading" className="font-display text-4xl font-normal text-foreground md:text-5xl">{title}</h2>
        <p className="mt-3 max-w-2xl text-[16px] leading-relaxed text-muted-foreground">{intro}</p>
        <ul className="mt-10 grid gap-x-12 gap-y-8 md:grid-cols-2">
          {items.map((item) => (
            <li key={item.name}>
              {item.url ? (
                <a href={item.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-lg font-semibold text-primary underline-offset-4 hover:underline">
                  {item.name}<ArrowUpRight className="h-4 w-4" aria-hidden="true" /><span className="sr-only"> (opens in a new tab)</span>
                </a>
              ) : (
                <p className="text-lg font-semibold text-foreground">{item.name}</p>
              )}
              <p className="mt-1.5 text-[16px] leading-relaxed text-muted-foreground">{item.text}</p>
            </li>
          ))}
        </ul>
        <p className="mt-10 max-w-2xl text-sm leading-relaxed text-muted-foreground">We list these because they help; CouponDonation isn’t connected to any of them. Programs change, so check each one for current rules.</p>
      </div>
    </section>
  );
}

/** Questions with their answers shown in full, so people and search engines read the same thing. */
export function FaqList({ title = 'Questions people ask', items, children }: { title?: string; items: FaqItem[]; children?: ReactNode }) {
  return (
    <section aria-labelledby="faq-heading" className="py-16 md:py-24">
      <div className="container mx-auto max-w-6xl px-4">
        <h2 id="faq-heading" className="font-display text-4xl font-normal text-foreground md:text-5xl">{title}</h2>
        {children}
        <dl className="mt-10 max-w-3xl space-y-9">
          {items.map((item) => (
            <div key={item.q}>
              <dt className="font-sans text-lg font-semibold text-foreground">{item.q}</dt>
              <dd className="mt-2 text-[16px] leading-relaxed text-muted-foreground">{item.a}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}

/** Links to related pages, so every landing page is a few clicks from the rest. */
export function RelatedLinks({ title, links }: { title: string; links: { name: string; to: string }[] }) {
  return (
    <nav aria-labelledby="related-heading" className="pb-20 pt-4">
      <div className="container mx-auto max-w-6xl px-4">
        <h2 id="related-heading" className="font-display text-3xl font-normal text-foreground">{title}</h2>
        <ul className="mt-5 flex flex-wrap gap-x-8 gap-y-1">
          {links.map((link) => (
            <li key={link.to}><Link to={link.to} className="inline-flex min-h-11 items-center text-[16px] font-medium text-primary hover:underline">{link.name}</Link></li>
          ))}
        </ul>
      </div>
    </nav>
  );
}
