import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { UserPlus, Shield, CreditCard, Gift, BarChart, Heart } from 'lucide-react';

const donorSteps = [
  { icon: UserPlus, title: 'Create Account', description: 'Sign up as a donor with your email. No verification needed to start giving.' },
  { icon: CreditCard, title: 'Choose Amount', description: 'Decide how much you want to contribute. Select categories or regions if you prefer.' },
  { icon: BarChart, title: 'Track Impact', description: 'See real-time reports on how your donations are being used and who they help.' },
];

const recipientSteps = [
  { icon: UserPlus, title: 'Apply', description: 'Create an account and submit your application with required documentation.' },
  { icon: Shield, title: 'Get Verified', description: 'Our team reviews your application. This usually takes 2-3 business days.' },
  { icon: Gift, title: 'Redeem Coupons', description: 'Browse available coupons and redeem them at partner stores. Earn loyalty points!' },
];

export default function HowItWorks() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main>
        {/* Hero */}
        <section className="py-20 bg-gradient-to-br from-primary/5 via-background to-gold/5">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6">How It Works</h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Whether you're here to give or receive, our process is designed to be simple, 
              secure, and transparent.
            </p>
          </div>
        </section>

        {/* For Donors */}
        <section className="py-20">
          <div className="container mx-auto px-4">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                <Heart className="w-6 h-6 text-primary" />
              </div>
              <h2 className="text-3xl font-bold text-foreground">For Donors</h2>
            </div>
            <div className="grid md:grid-cols-3 gap-8 mb-8">
              {donorSteps.map((step, index) => (
                <div key={step.title} className="relative">
                  <div className="absolute -top-3 -left-3 w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold">
                    {index + 1}
                  </div>
                  <div className="bg-card rounded-2xl p-6 border border-border h-full">
                    <div className="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center mb-4">
                      <step.icon className="w-7 h-7 text-primary" />
                    </div>
                    <h3 className="text-xl font-semibold text-foreground mb-2">{step.title}</h3>
                    <p className="text-muted-foreground">{step.description}</p>
                  </div>
                </div>
              ))}
            </div>
            <Button size="lg" onClick={() => navigate('/auth?mode=signup&role=donor')}>
              Start Donating Today
            </Button>
          </div>
        </section>

        {/* For Recipients */}
        <section className="py-20 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-12 h-12 bg-gold/10 rounded-xl flex items-center justify-center">
                <Gift className="w-6 h-6 text-gold" />
              </div>
              <h2 className="text-3xl font-bold text-foreground">For Recipients</h2>
            </div>
            <div className="grid md:grid-cols-3 gap-8 mb-8">
              {recipientSteps.map((step, index) => (
                <div key={step.title} className="relative">
                  <div className="absolute -top-3 -left-3 w-8 h-8 bg-gold text-gold-foreground rounded-full flex items-center justify-center text-sm font-bold">
                    {index + 1}
                  </div>
                  <div className="bg-card rounded-2xl p-6 border border-border h-full">
                    <div className="w-14 h-14 bg-gold/10 rounded-xl flex items-center justify-center mb-4">
                      <step.icon className="w-7 h-7 text-gold" />
                    </div>
                    <h3 className="text-xl font-semibold text-foreground mb-2">{step.title}</h3>
                    <p className="text-muted-foreground">{step.description}</p>
                  </div>
                </div>
              ))}
            </div>
            <Button size="lg" variant="outline" className="border-gold text-gold hover:bg-gold/10" onClick={() => navigate('/auth?mode=signup&role=recipient')}>
              Apply as Recipient
            </Button>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
