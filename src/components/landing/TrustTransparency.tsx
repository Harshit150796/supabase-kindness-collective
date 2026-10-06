import { Heart, PieChart, CheckCircle } from 'lucide-react';
import { LineReveal, Reveal } from '@/components/ui/editorial-motion';
export function TrustTransparency(){ return <section className="bg-[hsl(var(--primary-20))] py-14 text-primary-foreground lg:py-24">
  <div className="container mx-auto grid max-w-6xl gap-8 px-4 lg:grid-cols-[.8fr_1.2fr] lg:items-center">
    <Reveal><p className="font-display text-7xl">95¢</p><p className="mt-3 text-primary-foreground/75">of each $1 is allocated to purchasing coupons for recipients.</p></Reveal>
    <div><LineReveal><h2 className="font-display text-4xl md:text-6xl">See where every dollar goes.</h2></LineReveal>
      <p className="mt-5 text-primary-foreground/75">Our allocation model sets aside the rest for platform operations (3¢) and payment processing (2¢). These are allocation proportions, not live spending totals.</p>
      <div className="mt-6 flex flex-wrap gap-5 text-sm">{[{Icon:Heart,label:'Recipient purchases'},{Icon:PieChart,label:'Platform operations'},{Icon:CheckCircle,label:'Payment processing'}].map(({Icon,label})=><span key={label} className="flex items-center gap-2"><Icon className="h-4 w-4"/>{label}</span>)}</div>
      <p className="mt-6 text-primary-foreground/75">The coupon trail stays visible, from donation to recipient-reported use.</p>
    </div>
  </div>
</section>; }
