import { useEffect, useRef, useState } from 'react';
import { useEarlyReveal } from '@/components/ui/editorial-motion';
import { ArrowRight, Building2, Heart } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { LineReveal, Reveal } from '@/components/ui/editorial-motion';
import { ProductTraceVisual } from '@/components/marketing/ProductTraceVisual';

export function CTASection() {
  const navigate = useNavigate();
  const ref = useRef<HTMLElement>(null);
  const { visible } = useEarlyReveal(ref);
  const [textVisible, setTextVisible] = useState(false);
  useEffect(() => {
    if (!visible) return;
    const timer = setTimeout(() => setTextVisible(true), 900);
    return () => clearTimeout(timer);
  }, [visible]);
  return <section ref={ref} data-cursor="light" className="relative min-h-[38rem] overflow-hidden bg-background">
    <div aria-hidden="true" className={`cta-wipe absolute inset-0 bg-primary-20 ${visible ? 'cta-wipe-visible' : ''}`} />
    <div aria-hidden="true" className="absolute inset-0 opacity-30 [background-image:radial-gradient(circle_at_center,hsl(var(--primary-foreground)/.18)_1px,transparent_1px)] [background-size:26px_26px]" />
    <div className={`container relative mx-auto grid min-h-[38rem] items-center gap-12 px-4 py-24 text-primary-foreground transition-[opacity,transform] duration-700 lg:grid-cols-[1.1fr_.9fr] ${textVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
      <div>
        <LineReveal><h2 className="max-w-4xl font-display text-6xl font-normal leading-none md:text-8xl">Help someone this week. Or ask for help yourself.</h2></LineReveal>
        <div className="mt-10 flex flex-col gap-4 sm:flex-row">
          <Reveal><Button size="lg" variant="secondary" onClick={() => navigate('/donate')}><Heart className="mr-2 h-5 w-5" />Start donating<ArrowRight className="ml-2 h-5 w-5" /></Button></Reveal>
          <Reveal delay={.1}><Button size="lg" variant="outline" className="border-primary-foreground/40 bg-primary-foreground/10 text-primary-foreground hover:bg-primary-foreground hover:text-[hsl(var(--primary-20))]" onClick={() => navigate('/apply')}><Building2 className="mr-2 h-5 w-5" />Apply for support<ArrowRight className="ml-2 h-5 w-5" /></Button></Reveal>
        </div>
      </div>
      <ProductTraceVisual mode="coupon" inverse className="lg:ml-auto lg:w-full" />
    </div>
  </section>;
}