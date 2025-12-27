import { UserPlus, Shield, Gift, Sparkles } from 'lucide-react';

const steps = [
  {
    icon: UserPlus,
    title: 'Sign Up',
    description: 'Create your account as a donor or recipient. Our verification process ensures trust and transparency.',
    color: 'bg-primary/10 text-primary'
  },
  {
    icon: Shield,
    title: 'Get Verified',
    description: 'Recipients complete a simple verification process. Donors can start contributing immediately.',
    color: 'bg-gold/10 text-gold'
  },
  {
    icon: Gift,
    title: 'Give or Receive',
    description: 'Donors contribute to specific categories. Recipients browse and redeem available coupons.',
    color: 'bg-emerald-light/20 text-primary'
  },
  {
    icon: Sparkles,
    title: 'Track Impact',
    description: 'Both parties see real-time impact metrics. Complete transparency in every transaction.',
    color: 'bg-accent/50 text-accent-foreground'
  }
];

export function HowItWorksSection() {
  return (
    <section className="py-20 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            How It Works
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Our streamlined process makes giving and receiving simple, secure, and impactful.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step, index) => (
            <div key={step.title} className="relative group">
              {/* Connector line */}
              {index < steps.length - 1 && (
                <div className="hidden lg:block absolute top-12 left-[60%] w-[80%] h-0.5 bg-border" />
              )}
              
              <div className="relative bg-card rounded-2xl p-6 border border-border hover:border-primary/50 transition-colors">
                {/* Step number */}
                <div className="absolute -top-3 -left-3 w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold">
                  {index + 1}
                </div>
                
                <div className={`w-16 h-16 rounded-2xl ${step.color} flex items-center justify-center mb-4`}>
                  <step.icon className="w-8 h-8" />
                </div>
                
                <h3 className="text-xl font-semibold text-foreground mb-2">{step.title}</h3>
                <p className="text-muted-foreground text-sm">{step.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
