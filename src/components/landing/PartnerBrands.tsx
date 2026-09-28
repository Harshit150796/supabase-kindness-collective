import { brandLogos } from '@/data/brandLogos';
import { LineReveal, Reveal } from '@/components/ui/editorial-motion';

const partnerNames = ['DoorDash', 'Uber', 'Walmart', 'Amazon', 'Target', 'Starbucks', 'Nike', 'CVS'];

export function PartnerBrands() {
  return (
    <section className="border-y border-border py-24 md:py-32">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl">
          <LineReveal><h2 className="font-display text-5xl font-normal text-foreground md:text-6xl">Familiar places. Restricted value.</h2></LineReveal>
          <Reveal delay={0.08}><p className="mt-5 text-lg leading-relaxed text-muted-foreground">Donors can choose retailers available in the donation flow. No contribution totals are attributed to a brand without completed donation records.</p></Reveal>
        </div>
        <div className="mt-14 grid grid-cols-2 border-y border-border md:grid-cols-4">
          {partnerNames.map((name, index) => (
            <Reveal key={name} delay={index * 0.04} className="flex min-h-36 items-center justify-center border-b border-r border-border p-7 last:border-r-0 md:[&:nth-child(n+5)]:border-b-0">
              {brandLogos[name]?.logo ? <img src={brandLogos[name].logo} alt={name} className="max-h-12 max-w-32 object-contain" loading="lazy" /> : <span className="font-display text-2xl text-foreground">{name}</span>}
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}