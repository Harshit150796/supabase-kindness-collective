import { lazy, Suspense } from 'react';
import { CountUp, LineReveal, Reveal } from '@/components/ui/editorial-motion';
import { formatUSD, plural, useLandingStats } from '@/hooks/useLandingStats';
import { ReservedSectionState } from './ReservedSectionState';
const BrandLeaderboard = lazy(() => import('./BrandLeaderboard').then(m => ({default:m.BrandLeaderboard})));
export function ImpactDashboard() {
  const stats = useLandingStats();
  // Three numbers in plain words (Duck.Design audit, Nov 2026: five technical totals read as a mistake).
  const items = stats ? [
    {value:stats.total_raised,label:'Donated',definition:'Money donors have given through completed donations.',currency:true},
    {value:stats.issued_value_total,label:'Delivered as coupons',definition:'Value of the coupons and gift cards sent to the people who asked.',currency:true},
    {value:stats.coupons_used,label:'Coupons used',definition:'Coupons that families or stores have marked as used. We don’t see receipts from the stores themselves.'},
  ] : [];
  return <section className="flex min-h-[var(--lazy-reserved-height,0px)] flex-col bg-primary/5 py-14 lg:py-28" aria-labelledby="impact-figures-heading">
    <div className="container mx-auto flex flex-1 flex-col max-w-6xl px-4">
      <LineReveal><h2 id="impact-figures-heading" className="font-display text-4xl md:text-6xl">The numbers, as they are.</h2></LineReveal>
      <Reveal><p className="mt-5 max-w-3xl text-muted-foreground">Where gifts are right now: what donors gave, what has reached people as coupons, and what has been used.</p></Reveal>
      {stats ? <><div className="mt-8 grid gap-4 sm:grid-cols-3">{items.map(item => <Reveal key={item.label} className="rounded-2xl bg-background p-4 sm:p-6">
        <div className="font-display text-4xl tabular-nums sm:text-5xl"><CountUp value={item.value} formatter={item.currency ? formatUSD : undefined}/></div>
        <p className="mt-3 text-sm font-semibold">{item.label}</p><p className="mt-2 text-xs leading-relaxed text-muted-foreground">{item.definition}</p>
      </Reveal>)}</div><p className="mt-5 text-sm text-muted-foreground">{plural(stats.donations_count,'completed donation')}. {stats.pending_value_total > 0 ? `${formatUSD(stats.pending_value_total)} is still being turned into coupons. ` : stats.issued_value_total >= stats.total_raised && stats.total_raised > 0 ? 'Every completed donation has been turned into coupons. ' : ''}{plural(stats.coupons_received,'coupon')} opened by the people who received {stats.coupons_received === 1 ? 'it' : 'them'}. This month: {formatUSD(stats.issued_value_month)} delivered, {plural(stats.used_month,'coupon')} used.</p></> : <ReservedSectionState title="Waiting for the platform snapshot." description="Figures appear only when the latest totals are available. Refresh to try again, or browse the stories in the meantime." onRetry={() => window.location.reload()} />}
      {stats && <Suspense fallback={<div className="min-h-[320px]"/>}><BrandLeaderboard /></Suspense>}
    </div>
  </section>;
}
