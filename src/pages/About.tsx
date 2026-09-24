import { useRef, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { motion, useInView } from 'motion/react';
import {
  ArrowRight,
  Check,
  ExternalLink,
  Gift,
  HeartHandshake,
  Linkedin,
  MapPin,
  ReceiptText,
  ScanLine,
  ShieldCheck,
  Store,
  UserRoundCheck,
  WalletCards,
  X,
} from 'lucide-react';
import { SEO, breadcrumbJsonLd } from '@/components/SEO';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { useMotionPreference } from '@/hooks/useMotionPreference';
import harshitPhoto from '@/assets/harshit-agrawal.png';

const journey = [
  { icon: HeartHandshake, label: 'Donation', text: 'Support a public fundraiser.' },
  { icon: Store, label: 'Retailer choice', text: 'Choose where the value can be spent.' },
  { icon: Gift, label: 'Coupon created', text: 'Funds become a brand-specific coupon.' },
  { icon: WalletCards, label: 'Recipient wallet', text: 'The recipient receives usable support.' },
  { icon: ReceiptText, label: 'Trackable record', text: 'The giving trail remains visible.' },
];

const principles = [
  {
    number: '01',
    title: 'Choice stays with the donor',
    text: 'Donors choose the fundraiser and familiar retailer connected to their contribution.',
  },
  {
    number: '02',
    title: 'Value moves as a coupon',
    text: 'Donated money is converted into brand-specific coupon value rather than disappearing into an unclear pool.',
  },
  {
    number: '03',
    title: 'Support preserves dignity',
    text: 'Recipients use coupons with familiar brands, giving them agency in how they meet everyday needs.',
  },
  {
    number: '04',
    title: 'The record outlives the moment',
    text: 'Donation and coupon activity creates an accountable trail designed for long-term donor transparency.',
  },
];

const founder = {
  name: 'Harshit Agrawal',
  role: 'Founder & CEO',
  image: harshitPhoto,
  linkedin: 'https://www.linkedin.com/in/harshit-agrawal-71565a139',
  statement: 'CouponDonation began with one question: why should giving require blind trust?',
  bio: 'Harshit founded CouponDonation to create a clearer connection between a donor’s decision and the support a recipient can actually use. His focus is building a trusted giving system where choice, visibility, and accountability are part of the product—not an afterthought.',
};

function Reveal({ children, className = '', delay = 0 }: { children: ReactNode; className?: string; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { amount: 0.2, once: true });
  const gentle = useMotionPreference() === 'gentle';

  return (
    <motion.div
      ref={ref}
      className={className}
      initial={{ opacity: 0, y: gentle ? 6 : 24 }}
      animate={inView ? { opacity: 1, y: 0 } : undefined}
      transition={{ duration: gentle ? 0.35 : 0.7, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}

function DonationTrail() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { amount: 0.35, once: false });
  const gentle = useMotionPreference() === 'gentle';

  return (
    <div ref={ref} className="relative mt-14">
      <div aria-hidden="true" className="absolute left-5 top-5 h-[calc(100%-2.5rem)] w-px bg-primary-foreground/30 md:left-[10%] md:right-[10%] md:top-5 md:h-px md:w-auto">
        <motion.span
          className="absolute inset-0 origin-top bg-accent md:origin-left"
          initial={{ scaleY: 0 }}
          animate={inView ? { scaleY: 1 } : { scaleY: 0 }}
          transition={{ duration: gentle ? 1.4 : 2.4, ease: 'easeInOut' }}
        />
      </div>
      <ol className="relative grid gap-9 md:grid-cols-5 md:gap-5">
        {journey.map((step, index) => (
          <motion.li
            key={step.label}
            className="grid grid-cols-[2.5rem_1fr] gap-4 md:block"
            initial={{ opacity: 0, y: gentle ? 4 : 18 }}
            animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: gentle ? 4 : 18 }}
            transition={{ duration: 0.45, delay: inView ? index * (gentle ? 0.16 : 0.32) : 0 }}
          >
            <div className="relative z-10 flex h-10 w-10 items-center justify-center rounded-full border border-accent bg-background text-primary md:mx-auto">
              <step.icon className="h-4 w-4" />
            </div>
            <div className="md:mt-5 md:text-center">
              <p className="font-about-sans text-sm font-semibold text-primary-foreground">{step.label}</p>
              <p className="mt-1 font-about-sans text-sm leading-relaxed text-primary-foreground/75">{step.text}</p>
            </div>
          </motion.li>
        ))}
      </ol>
    </div>
  );
}

const aboutJsonLd = [
  breadcrumbJsonLd([{ name: 'Home', path: '/' }, { name: 'About', path: '/about' }]),
  {
    '@context': 'https://schema.org',
    '@type': 'AboutPage',
    name: 'About CouponDonation',
    url: 'https://coupondonation.com/about',
    description: 'How CouponDonation makes charitable giving transparent and trackable by converting donations into brand-specific coupons.',
    mainEntity: {
      '@type': 'Organization',
      name: 'CouponDonation',
      url: 'https://coupondonation.com',
      email: 'connect@coupondonation.com',
      areaServed: 'US',
      founder: { '@type': 'Person', name: founder.name },
    },
  },
];

export default function About() {
  return (
    <div className="min-h-dvh overflow-x-hidden bg-background text-foreground">
      <SEO
        title="About CouponDonation — Transparent, Trackable Giving"
        description="Meet CouponDonation, the online donation platform making charitable giving transparent and trackable through brand-specific grocery coupons for US communities."
        path="/about"
        jsonLd={aboutJsonLd}
      />
      <Navbar />

      <main className="overflow-x-hidden font-about-sans">
        <section className="border-b border-border px-5 pb-20 pt-16 md:px-8 md:pb-28 md:pt-24 lg:pt-32">
          <div className="mx-auto max-w-7xl">
            <div className="grid gap-12 lg:grid-cols-12 lg:gap-10">
              <div className="lg:col-span-1">
                <p className="font-about-sans text-xs font-semibold uppercase text-primary lg:[writing-mode:vertical-rl]">
                  About / 2025
                </p>
              </div>
              <Reveal className="lg:col-span-7">
                <p className="mb-6 flex items-center gap-2 text-sm font-semibold text-primary">
                  <ScanLine className="h-4 w-4" /> A new standard for giving
                </p>
                <h1 className="font-about-serif text-5xl font-bold leading-[1.02] text-foreground md:text-7xl lg:text-[6.4rem]">
                  Giving should never be a <span className="italic text-verify">black box.</span>
                </h1>
                <p className="mt-8 max-w-3xl text-lg leading-relaxed text-muted-foreground md:text-2xl">
                  CouponDonation is the world’s first platform of its kind built to make donations transparent and trackable—from a donor’s choice to a coupon a recipient can use.
                </p>
              </Reveal>
              <Reveal className="flex flex-col justify-end border-t border-border pt-7 lg:col-span-4 lg:border-l lg:border-t-0 lg:pl-9 lg:pt-0" delay={0.12}>
                <p className="text-xs font-semibold uppercase text-primary">The premise</p>
                <p className="mt-4 text-base leading-relaxed text-muted-foreground">
                  Donors deserve to know where their money goes. Recipients deserve useful support with dignity. We designed one system to serve both.
                </p>
                <div className="mt-8 flex flex-col gap-3 sm:flex-row lg:flex-col xl:flex-row">
                  <Button asChild size="lg">
                    <Link to="/donate">Start donating <ArrowRight className="ml-2 h-4 w-4" /></Link>
                  </Button>
                  <Button asChild size="lg" variant="outline">
                    <Link to="/how-it-works">See how it works</Link>
                  </Button>
                </div>
              </Reveal>
            </div>
          </div>
        </section>

        <section className="bg-primary px-5 py-20 text-primary-foreground md:px-8 md:py-28">
          <div className="mx-auto max-w-7xl">
            <Reveal className="grid gap-7 md:grid-cols-12">
              <div className="md:col-span-4">
                <p className="text-xs font-semibold uppercase text-accent">The transparent trail</p>
              </div>
              <div className="md:col-span-8">
                <h2 className="font-about-serif text-4xl leading-tight md:text-6xl">From generosity to usable value—with a record at every step.</h2>
                <p className="mt-6 max-w-2xl text-lg leading-relaxed text-primary-foreground/75">
                  Traditional giving can make the journey difficult to see. CouponDonation connects the donation, retailer selection, coupon creation, and recipient wallet in one trackable giving experience.
                </p>
              </div>
            </Reveal>
            <DonationTrail />
          </div>
        </section>

        <section className="px-5 py-20 md:px-8 md:py-28">
          <div className="mx-auto max-w-7xl">
            <Reveal className="grid gap-8 border-b border-border pb-12 md:grid-cols-12">
              <p className="text-xs font-semibold uppercase text-primary md:col-span-3">Our operating standard</p>
              <h2 className="font-about-serif text-4xl leading-tight md:col-span-9 md:text-6xl">
                Technology built around <span className="italic text-verify">accountability.</span>
              </h2>
            </Reveal>
            <div className="divide-y divide-border">
              {principles.map((principle, index) => (
                <Reveal key={principle.number} className="grid gap-4 py-9 md:grid-cols-12 md:items-start md:py-12" delay={index * 0.04}>
                  <p className="font-about-sans text-xs text-primary md:col-span-1">/{principle.number}</p>
                  <h3 className="font-about-serif text-2xl md:col-span-5 md:text-3xl">{principle.title}</h3>
                  <p className="max-w-xl text-base leading-relaxed text-muted-foreground md:col-span-6 md:text-lg">{principle.text}</p>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        <section className="border-y border-border bg-secondary px-5 py-20 md:px-8 md:py-24">
          <div className="mx-auto grid max-w-7xl gap-12 md:grid-cols-2 md:gap-16">
            <Reveal>
              <Check className="h-7 w-7 text-primary" />
              <h2 className="mt-6 font-about-serif text-3xl md:text-4xl">What we do</h2>
              <p className="mt-5 text-lg leading-relaxed text-muted-foreground">
                We provide an online donation platform where people support fundraisers, choose participating brands, and fund coupons that recipients can use for everyday needs.
              </p>
            </Reveal>
            <Reveal className="border-t border-border pt-10 md:border-l md:border-t-0 md:pl-16 md:pt-0" delay={0.1}>
              <X className="h-7 w-7 text-verify" />
              <h2 className="mt-6 font-about-serif text-3xl md:text-4xl">What we do not do</h2>
              <p className="mt-5 text-lg leading-relaxed text-muted-foreground">
                We do not turn “everyday savings” into donations, run meal programs, or move contributions through vague claims. Our purpose is to make the path of donated value clearer.
              </p>
            </Reveal>
          </div>
        </section>

        <section className="px-5 py-20 md:px-8 md:py-28">
          <div className="mx-auto max-w-7xl">
            <Reveal className="grid gap-8 md:grid-cols-12 md:items-end">
              <div className="md:col-span-4">
                <p className="text-xs font-semibold uppercase text-primary">The founding thesis</p>
              </div>
              <div className="md:col-span-8">
                <h2 className="font-about-serif text-4xl leading-tight md:text-6xl">Make trust visible.</h2>
                <p className="mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground">
                  CouponDonation was founded on December 19, 2025 to challenge a familiar limitation in charitable giving: once money is donated, its journey can become difficult to follow.
                </p>
              </div>
            </Reveal>

            <Reveal className="mt-16 grid gap-9 md:mt-24 md:grid-cols-12 md:items-center md:gap-14">
              <div className="relative md:col-span-5">
                <div aria-hidden="true" className="absolute -left-3 -top-3 h-20 w-20 border-l border-t border-accent" />
                <img src={founder.image} alt={`${founder.name}, ${founder.role} at CouponDonation`} className="aspect-[4/5] w-full object-cover object-top grayscale-[20%]" />
                <div className="absolute bottom-5 right-0 bg-background px-5 py-4 shadow-card-hover md:-right-6">
                  <p className="font-about-serif text-lg italic">{founder.name}</p>
                  <p className="mt-1 text-xs font-semibold uppercase text-primary">{founder.role}</p>
                </div>
              </div>
              <div className="md:col-span-6 md:col-start-7">
                <blockquote className="font-about-serif text-2xl italic leading-snug text-foreground md:text-4xl">“{founder.statement}”</blockquote>
                <div className="my-7 h-px w-12 bg-accent" />
                <p className="text-base leading-relaxed text-muted-foreground md:text-lg">{founder.bio}</p>
                <a href={founder.linkedin} target="_blank" rel="noopener noreferrer" className="mt-7 inline-flex items-center gap-2 border-b border-foreground pb-1 text-sm font-semibold text-foreground transition-colors hover:text-primary">
                  <Linkedin className="h-4 w-4" /> Connect on LinkedIn <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </div>
            </Reveal>
          </div>
        </section>

        <section className="bg-verify px-5 py-20 text-verify-foreground md:px-8 md:py-28">
          <div className="mx-auto max-w-7xl">
            <Reveal className="grid gap-10 md:grid-cols-12">
              <div className="md:col-span-4">
                <p className="text-xs font-semibold uppercase text-accent">Our mission</p>
              </div>
              <div className="md:col-span-8">
                <h2 className="font-about-serif text-4xl leading-tight md:text-6xl">Build the most transparent way to give.</h2>
                <p className="mt-7 max-w-3xl text-lg leading-relaxed text-verify-foreground/80 md:text-xl">
                  We are building a future where donor transparency is expected, charitable giving is trackable, and people receiving support retain choice and dignity. One donation. One coupon trail. One clearer standard of accountability for US communities.
                </p>
              </div>
            </Reveal>
          </div>
        </section>

        <section className="px-5 py-20 md:px-8 md:py-28">
          <div className="mx-auto max-w-7xl">
            <Reveal className="text-center">
              <p className="text-xs font-semibold uppercase text-primary">Choose your next step</p>
              <h2 className="mx-auto mt-5 max-w-3xl font-about-serif text-4xl leading-tight md:text-6xl">Be part of a more accountable way to give.</h2>
            </Reveal>
            <div className="mt-12 grid border border-border md:grid-cols-2">
              <Link to="/donate" className="group p-8 transition-colors hover:bg-secondary md:p-12">
                <ShieldCheck className="h-7 w-7 text-primary" />
                <h3 className="mt-8 font-about-serif text-3xl">I want to donate</h3>
                <p className="mt-4 max-w-md leading-relaxed text-muted-foreground">Choose a fundraiser and follow how your donation becomes coupon support.</p>
                <span className="mt-8 inline-flex items-center text-sm font-semibold text-foreground">Explore fundraisers <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" /></span>
              </Link>
              <Link to="/apply" className="group border-t border-border p-8 transition-colors hover:bg-secondary md:border-l md:border-t-0 md:p-12">
                <UserRoundCheck className="h-7 w-7 text-verify" />
                <h3 className="mt-8 font-about-serif text-3xl">I need support</h3>
                <p className="mt-4 max-w-md leading-relaxed text-muted-foreground">Create a fundraiser and tell your story to people ready to help.</p>
                <span className="mt-8 inline-flex items-center text-sm font-semibold text-foreground">Start your application <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" /></span>
              </Link>
            </div>
            <p className="mt-8 flex items-center justify-center gap-2 text-sm text-muted-foreground"><MapPin className="h-4 w-4" /> Serving communities across the US</p>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}