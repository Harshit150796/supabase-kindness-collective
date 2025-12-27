import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { 
  Heart, 
  Target, 
  Eye, 
  Users, 
  Building2, 
  Utensils, 
  ShoppingBag, 
  Calculator, 
  HandHeart,
  Shield,
  TrendingUp,
  Sparkles,
  GraduationCap,
  Users2,
  Globe,
  Linkedin,
  MapPin,
  Calendar,
  ExternalLink,
  ChevronRight,
  Baby,
  Home,
  Truck,
  FileCheck
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

const whoWeHelp = [
  { 
    icon: Baby, 
    title: 'Children & Teens', 
    description: 'Supporting young people at risk of malnutrition and food insecurity with nutritious meals and essential supplies.' 
  },
  { 
    icon: Home, 
    title: 'Families in Need', 
    description: 'Helping families facing instability due to job loss, inflation, displacement, or rising cost of living.' 
  },
  { 
    icon: HandHeart, 
    title: 'Service Providers', 
    description: 'Empowering local organizations working to deliver necessities and emergency aid to their communities.' 
  },
  { 
    icon: Building2, 
    title: 'Partner Networks', 
    description: 'Connecting hospitality, food industry, retail, and logistics partners to extend impact through coordinated support.' 
  },
];

const whatWeSupport = [
  { 
    icon: Utensils, 
    title: 'Food Security', 
    description: 'Hunger reduction through food assistance and meal support programs.',
    color: 'text-primary'
  },
  { 
    icon: ShoppingBag, 
    title: 'Basic Supplies', 
    description: 'Hygiene kits, diapers, school essentials, and seasonal necessities.',
    color: 'text-gold'
  },
  { 
    icon: Shield, 
    title: 'Emergency Relief', 
    description: 'Family support for communities under economic strain or crisis conditions.',
    color: 'text-primary'
  },
  { 
    icon: Globe, 
    title: 'Global Partnerships', 
    description: 'Local and international aid aligned to measurable outcomes and transparent reporting.',
    color: 'text-gold'
  },
];

const whySupport = [
  { icon: Heart, title: 'Human Dignity', description: 'Improving access to essential necessities for all' },
  { icon: Users2, title: 'Community Resilience', description: 'Reducing crisis-level shortages' },
  { icon: TrendingUp, title: 'Health & Wellbeing', description: 'Through nutrition and hygiene support' },
  { icon: GraduationCap, title: 'Opportunity', description: 'Helping children stay ready for school and life' },
  { icon: Sparkles, title: 'Collective Impact', description: 'Making micro-giving easy to repeat and grow' },
];

const partnerships = [
  { icon: Building2, title: 'Hospitality & Lodging', description: 'Hotels, travel platforms, and operators' },
  { icon: Utensils, title: 'Food Industry', description: 'Restaurants, grocers, suppliers, and delivery networks' },
  { icon: ShoppingBag, title: 'Consumer Brands', description: 'Retailers and loyalty/coupon ecosystems' },
  { icon: Calculator, title: 'Tax & Accounting', description: 'Professionals supporting donation strategy' },
  { icon: HandHeart, title: 'Nonprofits', description: 'Community organizations enabling on-the-ground distribution' },
  { icon: Truck, title: 'Logistics Networks', description: 'Partners helping with last-mile delivery' },
];

export default function About() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="overflow-hidden">
        {/* Hero Section */}
        <section className="relative py-24 md:py-32 bg-gradient-to-br from-primary/10 via-background to-gold/10 overflow-hidden">
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/5 rounded-full blur-3xl" />
            <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gold/5 rounded-full blur-3xl" />
          </div>
          
          <div className="container mx-auto px-4 relative z-10">
            <div className="flex flex-wrap items-center justify-center gap-3 mb-8 animate-fade-in">
              <span className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-full text-sm font-medium">
                <Calendar className="w-4 h-4" />
                Founded December 19, 2025
              </span>
              <span className="inline-flex items-center gap-2 px-4 py-2 bg-gold/10 text-gold rounded-full text-sm font-medium">
                <MapPin className="w-4 h-4" />
                New York & Los Angeles
              </span>
            </div>
            
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground text-center mb-6 animate-fade-in">
              Transforming Everyday Savings Into{' '}
              <span className="text-gradient-gold">Global Hunger Relief</span>
            </h1>
            
            <p className="text-xl md:text-2xl text-muted-foreground max-w-4xl mx-auto text-center mb-8 animate-fade-in" style={{ animationDelay: '0.1s' }}>
              A mission-first digital donation marketplace designed to expand access to food assistance, 
              basic necessities, and essential care for children, teens, and adults worldwide.
            </p>

            <div className="flex flex-wrap justify-center gap-4 animate-fade-in" style={{ animationDelay: '0.2s' }}>
              <Button 
                size="lg" 
                className="bg-primary hover:bg-primary/90 text-primary-foreground"
                onClick={() => navigate('/auth?mode=signup&role=donor')}
              >
                Start Donating
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
              <Button 
                size="lg" 
                variant="outline"
                onClick={() => navigate('/how-it-works')}
              >
                See How It Works
              </Button>
            </div>
          </div>
        </section>

        {/* Founders Section */}
        <section className="py-20 bg-background">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">Meet Our Founders</h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Two visionaries committed to making charitable giving transparent, efficient, and scalable.
              </p>
            </div>
            
            <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
              {/* Harshit Agrawal */}
              <Card className="p-8 bg-card border-border hover:border-gold/50 hover:shadow-[0_0_20px_hsl(var(--gold)/0.2)] transition-all duration-300 group">
                <div className="flex flex-col items-center text-center">
                  <div className="w-32 h-32 rounded-full bg-gradient-to-br from-primary/20 to-gold/20 flex items-center justify-center mb-6 group-hover:scale-105 transition-transform">
                    <span className="text-4xl font-bold text-primary">HA</span>
                  </div>
                  <h3 className="text-2xl font-bold text-foreground mb-1">Harshit Agrawal</h3>
                  <p className="text-gold font-medium mb-4">Founder & CEO</p>
                  <p className="text-muted-foreground mb-6">
                    Developed CouponDonation.com after witnessing how consistent support can change lives 
                    locally in New York, choosing to scale that same life-saving model globally.
                  </p>
                  <blockquote className="italic text-muted-foreground border-l-2 border-gold pl-4 text-left mb-6">
                    "Every donation counts, and it adds up faster than people realize. No child, teen, 
                    or adult should suffer from hunger or go without the basics needed to live."
                  </blockquote>
                  <a 
                    href="https://linkedin.com/in/harshitagrawal" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-primary hover:text-primary/80 transition-colors"
                  >
                    <Linkedin className="w-5 h-5" />
                    Connect on LinkedIn
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              </Card>

              {/* Paul Savluc */}
              <Card className="p-8 bg-card border-border hover:border-gold/50 hover:shadow-[0_0_20px_hsl(var(--gold)/0.2)] transition-all duration-300 group">
                <div className="flex flex-col items-center text-center">
                  <div className="w-32 h-32 rounded-full bg-gradient-to-br from-gold/20 to-primary/20 flex items-center justify-center mb-6 group-hover:scale-105 transition-transform">
                    <span className="text-4xl font-bold text-gold">PS</span>
                  </div>
                  <h3 className="text-2xl font-bold text-foreground mb-1">Paul Savluc</h3>
                  <p className="text-gold font-medium mb-4">Co-Founder, COO & CMO</p>
                  <p className="text-muted-foreground mb-6">
                    A technology executive shaped by firsthand experiences witnessing extreme hardship 
                    in major U.S. cities, driving scalable platforms for measurable humanitarian impact.
                  </p>
                  <blockquote className="italic text-muted-foreground border-l-2 border-gold pl-4 text-left mb-6">
                    "Reducing hunger and lack of basic care is a real-world logistics and accountability 
                    challenge. We built CouponDonation.com to make giving more accessible and measurable."
                  </blockquote>
                  <a 
                    href="https://linkedin.com/in/paulsavluc" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-primary hover:text-primary/80 transition-colors"
                  >
                    <Linkedin className="w-5 h-5" />
                    Connect on LinkedIn
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              </Card>
            </div>
          </div>
        </section>

        {/* Mission Statement */}
        <section className="py-20 bg-gradient-to-r from-primary/5 via-background to-gold/5">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full mb-8">
                <Target className="w-5 h-5 text-primary" />
                <span className="text-primary font-medium">Our Mission</span>
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-8">
                A Transparent, Scalable Model for{' '}
                <span className="text-gradient-emerald">Hunger Relief</span> and{' '}
                <span className="text-gradient-gold">Basic Care</span>
              </h2>
              <p className="text-xl text-muted-foreground leading-relaxed">
                CouponDonation.com operates as a donation and philanthropy platform that prioritizes 
                clear giving, operational efficiency, and partner-driven distribution. By reducing 
                friction and limiting unnecessary intermediaries, the platform is built to help 
                contributions translate into timely support for people facing urgent need.
              </p>
            </div>
          </div>
        </section>

        {/* Who We Help */}
        <section className="py-20 bg-background">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">Who We Help</h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Our mission supports children, families, service providers, and partners across industries.
              </p>
            </div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {whoWeHelp.map((item, index) => (
                <Card 
                  key={item.title} 
                  className="p-6 bg-card border-border hover:border-gold/50 hover:shadow-[0_0_20px_hsl(var(--gold)/0.2)] transition-all duration-300 animate-fade-in"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className="w-14 h-14 bg-gradient-to-br from-primary/20 to-gold/20 rounded-2xl flex items-center justify-center mb-4">
                    <item.icon className="w-7 h-7 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold text-foreground mb-2">{item.title}</h3>
                  <p className="text-muted-foreground">{item.description}</p>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* What We Support */}
        <section className="py-20 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">What We Support</h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Our platform is structured to support programs and initiatives focused on real-world impact.
              </p>
            </div>
            
            <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
              {whatWeSupport.map((item, index) => (
                <Card 
                  key={item.title} 
                  className="p-6 bg-card border-border hover:border-gold/50 hover:shadow-[0_0_20px_hsl(var(--gold)/0.2)] transition-all duration-300 flex gap-4 animate-fade-in"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className={`w-12 h-12 bg-${item.color === 'text-gold' ? 'gold' : 'primary'}/10 rounded-xl flex items-center justify-center flex-shrink-0`}>
                    <item.icon className={`w-6 h-6 ${item.color}`} />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-foreground mb-1">{item.title}</h3>
                    <p className="text-muted-foreground">{item.description}</p>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Join Our Mission - Merged Accordion Section */}
        <section className="py-16 md:py-20 bg-gradient-to-br from-primary/5 via-background to-gold/5">
          <div className="container mx-auto px-4">
            <div className="text-center mb-8 md:mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                Join Our Mission
              </h2>
              <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto">
                Whether you're looking to make an impact or partner with us, there's a place for you
              </p>
            </div>
            
            <div className="max-w-4xl mx-auto">
              <Accordion type="single" collapsible className="space-y-4" defaultValue="donors">
                {/* For Donors Panel */}
                <AccordionItem 
                  value="donors" 
                  className="border-2 border-gold/30 rounded-xl overflow-hidden bg-card shadow-sm hover:shadow-[0_0_20px_hsl(var(--gold)/0.15)] transition-all duration-300"
                >
                  <AccordionTrigger className="px-4 md:px-8 py-4 md:py-6 hover:no-underline hover:bg-gold/5 transition-colors [&[data-state=open]]:bg-gold/5">
                    <div className="flex items-center gap-3 md:gap-4">
                      <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-br from-gold/20 to-gold/10 rounded-xl flex items-center justify-center flex-shrink-0">
                        <Heart className="w-5 h-5 md:w-6 md:h-6 text-gold" />
                      </div>
                      <div className="text-left">
                        <h3 className="text-lg md:text-xl font-bold text-foreground">For Donors</h3>
                        <p className="text-xs md:text-sm text-muted-foreground">Why support CouponDonation?</p>
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-4 md:px-8 pb-6 md:pb-8">
                    <div className="pt-4 md:pt-6 border-t border-gold/20">
                      <p className="text-muted-foreground mb-6 text-sm md:text-base">
                        Your contributions create scalable outcomes that strengthen communities worldwide.
                      </p>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4 mb-6 md:mb-8">
                        {whySupport.map((item, index) => (
                          <div 
                            key={item.title} 
                            className="p-4 md:p-5 bg-gold/5 rounded-xl border border-gold/10 hover:border-gold/30 transition-all duration-300 animate-fade-in"
                            style={{ animationDelay: `${index * 0.05}s` }}
                          >
                            <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-br from-gold/20 to-primary/10 rounded-xl flex items-center justify-center mb-3">
                              <item.icon className="w-5 h-5 md:w-6 md:h-6 text-gold" />
                            </div>
                            <h4 className="text-sm md:text-base font-semibold text-foreground mb-1">{item.title}</h4>
                            <p className="text-xs md:text-sm text-muted-foreground">{item.description}</p>
                          </div>
                        ))}
                      </div>
                      
                      <Button 
                        size="lg" 
                        className="w-full sm:w-auto bg-gold hover:bg-gold/90 text-charcoal font-semibold"
                        onClick={() => navigate('/auth?mode=signup&role=donor')}
                      >
                        Start Making an Impact
                        <Heart className="w-4 h-4 ml-2" />
                      </Button>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                {/* For Partners Panel */}
                <AccordionItem 
                  value="partners" 
                  className="border-2 border-primary/30 rounded-xl overflow-hidden bg-card shadow-sm hover:shadow-[0_0_20px_hsl(var(--primary)/0.15)] transition-all duration-300"
                >
                  <AccordionTrigger className="px-4 md:px-8 py-4 md:py-6 hover:no-underline hover:bg-primary/5 transition-colors [&[data-state=open]]:bg-primary/5">
                    <div className="flex items-center gap-3 md:gap-4">
                      <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-br from-primary/20 to-primary/10 rounded-xl flex items-center justify-center flex-shrink-0">
                        <Building2 className="w-5 h-5 md:w-6 md:h-6 text-primary" />
                      </div>
                      <div className="text-left">
                        <h3 className="text-lg md:text-xl font-bold text-foreground">For Partners</h3>
                        <p className="text-xs md:text-sm text-muted-foreground">Partnership opportunities</p>
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-4 md:px-8 pb-6 md:pb-8">
                    <div className="pt-4 md:pt-6 border-t border-primary/20">
                      <p className="text-muted-foreground mb-6 text-sm md:text-base">
                        We welcome collaboration with organizations across industries to expand reach and build trust.
                      </p>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4 mb-6 md:mb-8">
                        {partnerships.map((item, index) => (
                          <div 
                            key={item.title} 
                            className="p-4 md:p-5 bg-primary/5 rounded-xl border border-primary/10 hover:border-primary/30 transition-all duration-300 animate-fade-in"
                            style={{ animationDelay: `${index * 0.05}s` }}
                          >
                            <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-br from-primary/20 to-gold/10 rounded-xl flex items-center justify-center mb-3">
                              <item.icon className="w-5 h-5 md:w-6 md:h-6 text-primary" />
                            </div>
                            <h4 className="text-sm md:text-base font-semibold text-foreground mb-1">{item.title}</h4>
                            <p className="text-xs md:text-sm text-muted-foreground">{item.description}</p>
                          </div>
                        ))}
                      </div>
                      
                      <Button 
                        size="lg" 
                        className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
                        onClick={() => navigate('/auth')}
                      >
                        Become a Partner
                        <ChevronRight className="w-4 h-4 ml-2" />
                      </Button>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
          </div>
        </section>

        {/* Tax Benefits */}
        <section className="py-20 bg-background">
          <div className="container mx-auto px-4">
            <Card className="max-w-4xl mx-auto p-8 md:p-10 bg-card border-border">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                  <FileCheck className="w-6 h-6 text-primary" />
                </div>
                <h2 className="text-2xl md:text-3xl font-bold text-foreground">
                  Tax Benefits & Accounting Considerations
                </h2>
              </div>
              
              <p className="text-muted-foreground mb-6">
                CouponDonation.com encourages donors to consider potential tax advantages of charitable 
                giving where applicable. In many jurisdictions, including the United States, donations 
                to qualified charitable organizations may be tax-deductible if donors meet eligibility 
                requirements, itemize where necessary, and maintain proper documentation.
              </p>
              
              <h3 className="text-lg font-semibold text-foreground mb-4">Key Reminders:</h3>
              <ul className="space-y-3 text-muted-foreground mb-6">
                <li className="flex items-start gap-3">
                  <ChevronRight className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                  Tax treatment varies by jurisdiction, filing status, income level, and recipient eligibility
                </li>
                <li className="flex items-start gap-3">
                  <ChevronRight className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                  Individual donation deductions differ widely based on local law and filing method
                </li>
                <li className="flex items-start gap-3">
                  <ChevronRight className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                  Businesses may deduct qualifying donations depending on corporate structure and tax rules
                </li>
                <li className="flex items-start gap-3">
                  <ChevronRight className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                  Documentation matters: keep receipts, acknowledgments, and records of amounts and dates
                </li>
              </ul>
              
              <div className="p-4 bg-muted/50 rounded-lg border border-border">
                <p className="text-sm text-muted-foreground">
                  <strong className="text-foreground">Note:</strong> CouponDonation.com will provide 
                  donation confirmations and supporting records as appropriate for eligible donation 
                  pathways. Donors are encouraged to consult a licensed tax professional or accountant 
                  for guidance tailored to their specific situation.
                </p>
              </div>
            </Card>
          </div>
        </section>

        {/* Updated Stats */}
        <section className="py-20 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
              <Card className="p-6 text-center bg-card border-border hover:border-gold/50 hover:shadow-[0_0_20px_hsl(var(--gold)/0.2)] transition-all duration-300">
                <div className="text-4xl font-bold text-primary mb-2">2025</div>
                <div className="text-sm text-muted-foreground">Founded</div>
              </Card>
              <Card className="p-6 text-center bg-card border-border hover:border-gold/50 hover:shadow-[0_0_20px_hsl(var(--gold)/0.2)] transition-all duration-300">
                <div className="text-4xl font-bold text-primary mb-2">2</div>
                <div className="text-sm text-muted-foreground">U.S. Locations</div>
              </Card>
              <Card className="p-6 text-center bg-card border-border hover:border-gold/50 hover:shadow-[0_0_20px_hsl(var(--gold)/0.2)] transition-all duration-300">
                <div className="text-4xl font-bold text-gold mb-2">6</div>
                <div className="text-sm text-muted-foreground">Partner Sectors</div>
              </Card>
              <Card className="p-6 text-center bg-card border-border hover:border-gold/50 hover:shadow-[0_0_20px_hsl(var(--gold)/0.2)] transition-all duration-300">
                <div className="text-4xl font-bold text-gold mb-2">∞</div>
                <div className="text-sm text-muted-foreground">Lives to Impact</div>
              </Card>
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="py-20 bg-gradient-to-br from-primary/10 via-background to-gold/10">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Join the Movement
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
              This platform is about more than donations. It's about human dignity, community stability, 
              and building systems that make it easier for people and companies to do good at scale.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Button 
                size="lg" 
                className="bg-primary hover:bg-primary/90 text-primary-foreground"
                onClick={() => navigate('/auth?mode=signup&role=donor')}
              >
                Donate Now
                <Heart className="w-4 h-4 ml-2" />
              </Button>
              <Button 
                size="lg" 
                variant="outline"
                onClick={() => navigate('/how-it-works')}
              >
                Learn How It Works
              </Button>
              <Button 
                size="lg" 
                variant="outline"
                onClick={() => navigate('/faq')}
              >
                Read FAQ
              </Button>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
