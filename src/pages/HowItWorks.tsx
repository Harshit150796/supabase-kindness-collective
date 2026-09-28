import { useNavigate } from 'react-router-dom';
import { ArrowRight, CreditCard, Gift, Heart, Shield, UserPlus } from 'lucide-react';
import { SEO, breadcrumbJsonLd } from '@/components/SEO';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { LineReveal, Reveal } from '@/components/ui/editorial-motion';

const donorSteps = [
  { icon: UserPlus, title: 'Choose a fundraiser', description: 'Browse active campaigns and decide where your support should go.' },
  { icon: CreditCard, title: 'Choose the amount and retailer', description: 'Make a secure donation and select the familiar brand where its coupon value can be used.' },
  { icon: Heart, title: 'Follow the record', description: 'Your account keeps the donation and resulting coupon activity connected.' },
];
const recipientSteps = [
  { icon: UserPlus, title: 'Tell us what you need', description: 'Create an account and submit an application with the requested information.' },
  { icon: Shield, title: 'Complete review', description: 'The CouponDonation team reviews the application before recipient access is approved.' },
  { icon: Gift, title: 'Use available coupons', description: 'Approved recipients can browse their coupon wallet and use available value at its named retailer.' },
];

export default function HowItWorks() {
  const navigate = useNavigate();
  return (
    <div className="min-h-dvh bg-background">
      <SEO title="How CouponDonation Works — Donate, Verify, Redeem" description="See how donations become retailer-specific coupons through a transparent path for donors and approved recipients." path="/how-it-works" jsonLd={breadcrumbJsonLd([{ name:'Home', path:'/' },{ name:'How It Works', path:'/how-it-works' }])}/>
      <Navbar />
      <main>
        <section className="border-b border-border py-24 md:py-36"><div className="container mx-auto px-4"><LineReveal><h1 className="max-w-5xl font-display text-6xl font-normal leading-none text-foreground md:text-8xl">One donation. A visible path to use.</h1></LineReveal><Reveal delay={0.1}><p className="mt-8 max-w-2xl text-xl leading-relaxed text-muted-foreground">Donors choose the cause and retailer. Approved recipients receive restricted coupon value for everyday needs.</p></Reveal></div></section>
        <ProcessSection title="For people ready to give." steps={donorSteps} action="Start donating" onAction={()=>navigate('/donate')} />
        <ProcessSection title="For people seeking support." steps={recipientSteps} action="Apply for support" onAction={()=>navigate('/auth?mode=signup&role=recipient')} alternate />
      </main>
      <Footer />
    </div>
  );
}

function ProcessSection({ title, steps, action, onAction, alternate=false }:{title:string;steps:typeof donorSteps;action:string;onAction:()=>void;alternate?:boolean}){
 return <section className={alternate?'border-y border-border bg-secondary/40 py-24 md:py-32':'py-24 md:py-32'}><div className="container mx-auto px-4"><LineReveal><h2 className="max-w-3xl font-display text-5xl font-normal text-foreground md:text-6xl">{title}</h2></LineReveal><div className="mt-14 border-y border-border">{steps.map((step,index)=><Reveal key={step.title} delay={index*.07} className="grid gap-5 border-b border-border py-8 last:border-b-0 md:grid-cols-[5rem_1fr_1fr] md:items-start md:py-11"><div className="flex items-center gap-3 text-primary"><span className="text-sm">0{index+1}</span><step.icon className="h-5 w-5"/></div><h3 className="font-display text-3xl font-normal text-foreground">{step.title}</h3><p className="max-w-xl leading-relaxed text-muted-foreground">{step.description}</p></Reveal>)}</div><Reveal className="mt-10"><Button size="lg" onClick={onAction}>{action}<ArrowRight className="ml-2 h-4 w-4"/></Button></Reveal></div></section>
}