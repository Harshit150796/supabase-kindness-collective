import { lazy, Suspense } from 'react';
import { CountUp, LineReveal, Reveal } from '@/components/ui/editorial-motion';
import { formatUSD, plural, useLandingStats } from '@/hooks/useLandingStats';
import { ReservedSectionState } from './ReservedSectionState';
const BrandLeaderboard = lazy(() => import('./BrandLeaderboard').then(m => ({default:m.BrandLeaderboard})));
export function ImpactDashboard() {
  const stats = useLandingStats();
  const items = stats ? [
    {value:stats.total_raised,label:'Donated',definition:'Total amount of completed donations.',currency:true},
    {value:stats.pending_value_total,label:'Coupons being prepared',definition:'Value of coupons for completed donations that are still being purchased from retailers and have no code yet.',currency:true},
    {value:stats.issued_value_total,label:'Issued coupon value',definition:'Value of non-void, credential-issued coupons linked to completed donations.',currency:true},
    {value:stats.coupons_received,label:'Coupons received',definition:'Coupons revealed by recipients, including those subsequently marked used.'},
    {value:stats.coupons_used,label:'Coupons marked used',definition:'Recipient-reported use or recorded retailer redemption; not independent proof of purchase.'},
  ] : [];
  return <section className="flex min-h-[var(--lazy-reserved-height,0px)] flex-col bg-primary/5 py-14 lg:py-28" aria-labelledby="impact-figures-heading">
    <div className="container mx-auto flex flex-1 flex-col max-w-6xl px-4">
      <LineReveal><h2 id="impact-figures-heading" className="font-display text-4xl md:text-6xl">The numbers, as they are.</h2></LineReveal>
      <p className="mt-5 max-w-3xl text-muted-foreground">One platform snapshot, different stages of giving. Donations, allocations and issued value are not interchangeable totals.</p>
      {stats ? <><div className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-5">{items.map(item => <Reveal key={item.label} className="rounded-2xl bg-background p-4 sm:p-6">
        <div className="font-display text-4xl tabular-nums sm:text-5xl">{item.currency ? formatUSD(item.value) : <CountUp value={item.value}/>}</div>
        <p className="mt-3 text-sm font-semibold">{item.label}</p><p className="mt-2 text-xs leading-relaxed text-muted-foreground">{item.definition}</p>
      </Reveal>)}</div><p className="mt-5 text-sm text-muted-foreground">{plural(stats.donations_count,'completed donation')}; {plural(stats.coupons_pending,'coupon')} still being prepared. This calendar month: {formatUSD(stats.issued_value_month)} issued; {plural(stats.used_month,'coupon')} marked used. All-time retailer allocations: {formatUSD(stats.allocated_total)}.</p></> : <ReservedSectionState title="Waiting for the platform snapshot." description="Figures appear only when the latest totals are available. Refresh to try again, or browse the stories in the meantime." onRetry={() => window.location.reload()} />}
      {stats && <Suspense fallback={<div className="min-h-[320px]"/>}><BrandLeaderboard /></Suspense>}
    </div>
  </section>;
}
