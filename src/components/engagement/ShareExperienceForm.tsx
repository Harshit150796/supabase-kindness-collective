import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from '@/hooks/use-toast';

export function ShareExperienceForm({ role }: { role: 'donor' | 'recipient' }) {
  const { user } = useAuth();
  const [quote, setQuote] = useState('');
  const [consent, setConsent] = useState(false);
  const [anonymous, setAnonymous] = useState(role === 'recipient');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  if (!user) return null;
  if (done) return <p className="text-sm text-muted-foreground">Thank you. Our team will review your note before anything is published.</p>;
  const submit = async () => {
    const q = quote.trim();
    if (q.length < 10) return toast({ title: 'Please write at least a short sentence.' });
    if (!consent) return toast({ title: 'Please tick the consent box to submit.' });
    setBusy(true);
    const { data, error } = await supabase.functions.invoke('public-submit', { body: { action: 'testimonial', quote: q, consent: true, anonymous, role } });
    setBusy(false);
    if (error || (data as any)?.error) return toast({ title: 'Could not send', description: (data as any)?.error ?? 'Please try again.', variant: 'destructive' });
    setDone(true);
  };
  return (
    <div className="space-y-3">
      <h3 className="font-display text-2xl">Share a sentence about your experience</h3>
      <p className="text-sm text-muted-foreground">Optional. Nothing is published until our team reviews it.</p>
      <Textarea value={quote} maxLength={300} onChange={(e) => setQuote(e.target.value)} placeholder="What was it like?" aria-label="Your experience" />
      <p className="text-right text-xs text-muted-foreground">{quote.length}/300</p>
      <label className="flex items-start gap-2 text-sm"><Checkbox checked={consent} onCheckedChange={(v) => setConsent(!!v)} className="mt-0.5" />CouponDonation may publish this with my first name and last initial.</label>
      <label className="flex items-start gap-2 text-sm"><Checkbox checked={anonymous} onCheckedChange={(v) => setAnonymous(!!v)} className="mt-0.5" />Show me as anonymous instead.</label>
      <Button onClick={submit} disabled={busy}>{busy ? 'Sending…' : 'Send'}</Button>
    </div>
  );
}
