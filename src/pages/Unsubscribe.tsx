import { useEffect, useState, type FormEvent } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, Loader2, Mail } from 'lucide-react';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';

type Kind = 'newsletter' | 'followup' | 'impact' | 'confirm';
type Status = 'loading' | 'success' | 'error' | 'ask' | 'requested';

/** Reads which kind of link this is. ?token= newsletters, ?f= follow-ups, ?stop= impact updates, ?c= typed-in email confirm. */
function linkFrom(params: URLSearchParams): { kind: Kind; token: string } | null {
  const pairs: [string, Kind][] = [['f', 'followup'], ['token', 'newsletter'], ['stop', 'impact'], ['c', 'confirm']];
  for (const [key, kind] of pairs) { const v = params.get(key); if (v) return { kind, token: v }; }
  return null;
}

export default function Unsubscribe() {
  const [params] = useSearchParams();
  const link = linkFrom(params);
  const [status, setStatus] = useState<Status>(link ? 'loading' : 'ask');
  const [email, setEmail] = useState('');
  const [typed, setTyped] = useState('');
  const [sending, setSending] = useState(false);
  const [formError, setFormError] = useState('');

  useEffect(() => {
    if (!link) return;
    let alive = true;
    supabase.functions.invoke('email-unsubscribe', { body: { kind: link.kind, token: link.token } })
      .then(({ data, error }) => {
        if (!alive) return;
        if (error || !data?.success) setStatus('error');
        else { setEmail(data.email || ''); setStatus('success'); }
      })
      .catch(() => alive && setStatus('error'));
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [link?.kind, link?.token]);

  const request = async (e: FormEvent) => {
    e.preventDefault();
    const value = typed.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value)) { setFormError('Enter an email address like name@example.com.'); return; }
    setSending(true); setFormError('');
    const { data, error } = await supabase.functions.invoke('email-unsubscribe', { body: { kind: 'request', email: value } });
    setSending(false);
    if (error || !data?.success) { setFormError('That didn’t go through. Please try again, or email support@coupondonation.com.'); return; }
    setEmail(value); setStatus('requested');
  };

  return (
    <div className="min-h-dvh flex flex-col bg-background">
      <Navbar />
      <main className="flex-1 flex items-center justify-center p-4">
        <Card className="max-w-md w-full rounded-md shadow-sm">
          <CardContent className="p-8 text-center space-y-4">
            {status === 'loading' && (
              <>
                <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto" aria-hidden="true" />
                <p className="text-muted-foreground" role="status">Unsubscribing you…</p>
              </>
            )}
            {status === 'success' && (
              <>
                <CheckCircle className="w-12 h-12 text-primary mx-auto" aria-hidden="true" />
                <h1 className="font-display text-4xl font-normal text-foreground">You’re unsubscribed.</h1>
                <p className="text-muted-foreground">
                  {email ? <><span className="font-medium text-foreground">{email}</span> won’t</> : 'You won’t'} get newsletters, follow-ups or impact updates from us. Receipts, sign-in codes and other account emails will still arrive.
                </p>
                <p className="text-sm text-muted-foreground">Changed your mind? Tick “Email me helpful updates” on any of our forms to sign up again.</p>
              </>
            )}
            {status === 'error' && (
              <>
                <XCircle className="w-12 h-12 text-destructive mx-auto" aria-hidden="true" />
                <h1 className="font-display text-4xl font-normal text-foreground">This link didn’t work.</h1>
                <p className="text-muted-foreground">It may be old or incomplete. Enter your email below and we’ll send you a link to confirm.</p>
                <Button variant="outline" onClick={() => setStatus('ask')}>Unsubscribe by email</Button>
              </>
            )}
            {status === 'ask' && (
              <form onSubmit={request} noValidate className="space-y-4 text-left">
                <h1 className="font-display text-4xl font-normal text-foreground text-center">Stop our emails</h1>
                <p className="text-muted-foreground text-center">Enter your email. We’ll send a link to confirm, so nobody can unsubscribe you by mistake.</p>
                <label htmlFor="unsub-email" className="block text-sm font-medium text-foreground">Email</label>
                <input id="unsub-email" type="email" autoComplete="email" inputMode="email" value={typed} onChange={(e) => setTyped(e.target.value)}
                  aria-invalid={!!formError || undefined} aria-describedby={formError ? 'unsub-error' : undefined}
                  className="w-full h-11 rounded-md border border-input bg-background px-3 text-foreground" placeholder="you@example.com" />
                {formError && <p id="unsub-error" role="alert" className="text-sm text-destructive">{formError}</p>}
                <Button type="submit" disabled={sending} className="w-full h-11">
                  {sending ? <><Loader2 className="animate-spin" aria-hidden="true" />Sending…</> : 'Send confirm link'}
                </Button>
              </form>
            )}
            {status === 'requested' && (
              <>
                <Mail className="w-12 h-12 text-primary mx-auto" aria-hidden="true" />
                <h1 className="font-display text-4xl font-normal text-foreground">Check your inbox.</h1>
                <p className="text-muted-foreground">If <span className="font-medium text-foreground">{email}</span> is on our list, a confirm link is on its way. Open it to stop our emails.</p>
                <p className="text-sm text-muted-foreground">Nothing arrived? Email <a href="mailto:support@coupondonation.com" className="underline underline-offset-4">support@coupondonation.com</a>.</p>
              </>
            )}
          </CardContent>
        </Card>
      </main>
      <Footer contact={false} />
    </div>
  );
}
