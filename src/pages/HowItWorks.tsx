import { useNavigate } from 'react-router-dom';
import { ArrowRight, CreditCard, Gift, Heart, Shield, UserPlus } from 'lucide-react';
import { SEO, breadcrumbJsonLd } from '@/components/SEO';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { LineReveal, Reveal } from '@/components/ui/editorial-motion';
import { ProductTraceVisual } from '@/components/marketing/ProductTraceVisual';

const donorSteps = [
  { icon: UserPlus, title: 'Choose a request', description: 'Pick someone who asked for help, or give to the shared pool that people who asked for help can claim.' },
  { icon: CreditCard, title: 'Choose stores and an amount', description: 'Pick the stores where your gift can be used and how much goes to each, from $10 per store. Payment runs through Square.' },
  { icon: Heart, title: 'Follow your gift', description: 'You get a receipt right away and an email when the recipient has their gift cards.' },
];
const recipientSteps = [
  { icon: UserPlus, title: 'Tell us what you need', description: 'Choose your needs and the stores you’d use, add your story and a photo, and set a goal. It’s free.' },
  { icon: Shield, title: 'Share your page', description: 'Your page goes live when you submit it. Our team reviews requests and may ask for more information.' },
  { icon: Gift, title: 'Use your gift cards', description: 'Gift cards and coupons appear in your wallet as our team issues them. Use them at the store like any gift card.' },
];

export default function HowItWorks() {
  const navigate = useNavigate();
  return (
    <div className="min-h-dvh bg-background">
      <SEO title="How CouponDonation Works: From Donation to Gift Card" description="See how a donation becomes gift cards for the stores someone asked for: you choose the request and stores, our team issues the cards, and you get a receipt." path="/how-it-works" jsonLd={breadcrumbJsonLd([{ name:'Home', path:'/' },{ name:'How It Works', path:'/how-it-works' }])}/>
      <Navbar />
      <main>
        <section className="py-24 md:py-36"><div className="container mx-auto grid gap-10 px-4 lg:grid-cols-[1fr_.8fr] lg:items-center"><div><LineReveal><h1 className="max-w-5xl font-display text-6xl font-normal leading-none text-foreground md:text-8xl">One donation. A visible path to use.</h1></LineReveal><Reveal delay={0.1}><p className="mt-8 max-w-2xl text-xl leading-relaxed text-muted-foreground">Donors choose the request and the stores. People who asked for help receive gift cards and coupons for exactly those stores.</p></Reveal></div><ProductTraceVisual mode="trace"/></div></section>
        <ProcessSection title="For people ready to give." steps={donorSteps} action="Start donating" onAction={()=>navigate('/donate')} />
        <ProcessSection title="For people seeking support." steps={recipientSteps} action="Ask for help" onAction={()=>navigate('/apply')} alternate />
      </main>
      <Footer />
    </div>
  );
}

function ProcessSection({ title, steps, action, onAction, alternate=false }:{title:string;steps:typeof donorSteps;action:string;onAction:()=>void;alternate?:boolean}){
 return <section className="py-24 md:py-32" style={alternate?{backgroundColor:'hsl(var(--primary-20))'}:{backgroundColor:'hsl(var(--primary-97))'}}><div className="container mx-auto px-4"><LineReveal><h2 className={`max-w-3xl font-display text-5xl font-normal md:text-6xl ${alternate?'text-primary-foreground':'text-foreground'}`}>{title}</h2></LineReveal><div className="mt-14 grid gap-5 md:grid-cols-3">{steps.map((step,index)=><Reveal key={step.title} delay={index*.09} className={`rounded-[1.5rem] p-8 ${alternate?'bg-primary-foreground/10 text-primary-foreground':'bg-background text-foreground'}`}><div className={alternate?'text-primary-foreground':'text-primary'}><span className="text-sm">0{index+1}</span><step.icon className="mt-8 h-7 w-7"/></div><h3 className="mt-8 font-display text-3xl font-normal">{step.title}</h3><p className={`mt-4 leading-relaxed ${alternate?'text-primary-foreground/70':'text-muted-foreground'}`}>{step.description}</p></Reveal>)}</div><Reveal className="mt-10"><Button size="lg" variant={alternate?'secondary':'default'} onClick={onAction}>{action}<ArrowRight className="ml-2 h-4 w-4"/></Button></Reveal></div></section>
}