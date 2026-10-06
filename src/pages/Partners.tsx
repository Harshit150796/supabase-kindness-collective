import { useState } from 'react';
import { z } from 'zod';
import { SEO } from '@/components/SEO';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

const schema = z.object({
  org_name: z.string().trim().min(2, 'Enter your organization name').max(160),
  org_type: z.string().trim().min(2, 'Choose a type').max(60),
  contact_name: z.string().trim().min(2, 'Enter your name').max(120),
  email: z.string().trim().email('Enter a valid email').max(255),
  city_state: z.string().trim().max(120).optional(),
  families_count: z.number().int().min(0).max(100000).optional(),
  message: z.string().trim().max(2000).optional(),
});

const provides = [
  ['Coupon-locked giving', 'Donations are converted into coupons for participating retailers, never cash, so support goes to the need described.'],
  ['A receipt trail', 'Every completed donation has a receipt and a coupon trail. Public pages show only campaign totals.'],
  ['Organizer tools', 'Co-organizers, campaign updates, supporter messaging with safety checks, and share links with QR codes.'],
];

export default function Partners() {
  const [f, setF] = useState({ org_name: '', org_type: 'Church', contact_name: '', email: '', city_state: '', families_count: '', message: '', website: '' });
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => setF((p) => ({ ...p, [k]: e.target.value }));
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse({ ...f, families_count: f.families_count ? Number(f.families_count) : undefined, city_state: f.city_state || undefined, message: f.message || undefined });
    if (!parsed.success) return toast({ title: parsed.error.issues[0].message, variant: 'destructive' });
    setBusy(true);
    const { data, error } = await supabase.functions.invoke('public-submit', { body: { action: 'partner', website: f.website, ...parsed.data } });
    setBusy(false);
    if (error || (data as any)?.error) return toast({ title: 'Could not send', description: (data as any)?.error ?? 'Please try again later.', variant: 'destructive' });
    setSent(true);
  };
  return (
    <div className="min-h-dvh bg-background">
      <SEO title="Partner With CouponDonation" description="Churches, nonprofits and community organizations can run coupon-locked fundraisers for the families they already serve, with each family's consent." path="/partners" />
      <Navbar />
      <main>
        <section className="py-20 md:py-28"><div className="container mx-auto max-w-4xl px-4">
          <h1 className="font-display text-5xl leading-[1.02] md:text-7xl">Run fundraisers for the families you already serve</h1>
          <p className="mt-6 max-w-2xl text-lg text-muted-foreground">Churches, nonprofits and community organizations can organize campaigns for households in their care. Each family consents to its campaign, chooses what is shared, and receives support as coupons for participating retailers.</p>
        </div></section>
        <section className="bg-primary/5 py-16"><div className="container mx-auto grid gap-10 px-4 md:grid-cols-3">
          {provides.map(([t, d]) => <div key={t}><h2 className="font-display text-3xl">{t}</h2><p className="mt-3 text-muted-foreground">{d}</p></div>)}
        </div></section>
        <section className="py-16"><div className="container mx-auto max-w-2xl px-4">
          <h2 className="font-display text-4xl">Tell us about your organization</h2>
          {sent ? <p className="mt-6 text-lg">Thank you. Our team will reply by email.</p> : (
            <form onSubmit={submit} className="mt-8 grid gap-5 sm:grid-cols-2" noValidate>
              <div className="sm:col-span-2"><Label htmlFor="org">Organization name</Label><Input id="org" value={f.org_name} onChange={set('org_name')} maxLength={160} required /></div>
              <div><Label htmlFor="type">Type</Label><select id="type" value={f.org_type} onChange={set('org_type')} className="mt-1 h-11 w-full border border-input bg-background px-3 text-sm"><option>Church</option><option>Nonprofit</option><option>Community organization</option><option>School</option><option>Other</option></select></div>
              <div><Label htmlFor="fam">Families you serve (approx.)</Label><Input id="fam" type="number" min={0} value={f.families_count} onChange={set('families_count')} /></div>
              <div><Label htmlFor="cn">Contact name</Label><Input id="cn" value={f.contact_name} onChange={set('contact_name')} maxLength={120} required /></div>
              <div><Label htmlFor="em">Email</Label><Input id="em" type="email" value={f.email} onChange={set('email')} maxLength={255} required /></div>
              <div className="sm:col-span-2"><Label htmlFor="cs">City, state</Label><Input id="cs" value={f.city_state} onChange={set('city_state')} maxLength={120} /></div>
              <div className="sm:col-span-2"><Label htmlFor="msg">Message</Label><Textarea id="msg" value={f.message} onChange={set('message')} maxLength={2000} rows={5} /></div>
              <div className="absolute -left-[9999px]" aria-hidden="true"><label>Website<input tabIndex={-1} autoComplete="off" value={f.website} onChange={set('website')} /></label></div>
              <div className="sm:col-span-2"><Button type="submit" disabled={busy}>{busy ? 'Sending…' : 'Send inquiry'}</Button></div>
            </form>
          )}
        </div></section>
      </main>
      <Footer />
    </div>
  );
}
