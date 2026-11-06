import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Copy, Loader2, ShieldCheck } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useSignOut } from '@/hooks/useSignOut';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { GoogleSignIn } from '@/components/auth/GoogleSignIn';
import { TEAM_ROLES } from '@/components/navigation/siteLinks';
import { markGatePassed, rememberGate, takeAdminNext, teamSessionFresh, TEAM_MFA_REQUIRED } from '@/lib/adminGate';

type Step = 'signin' | 'checking' | 'not-team' | 'enroll' | 'challenge' | 'error';
type Enrollment = { id: string; qr: string; secret: string };

const CODE_RE = /^\d{6}$/;

/**
 * The hidden team sign-in (src/lib/adminGate.ts). Step 1: sign in as usual (email and password, or
 * Google). Step 2, only when TEAM_MFA_REQUIRED is on: a code from an authenticator app (the first visit
 * sets it up with a QR code). While it is off, a team sign-in made here opens the admin portal.
 */
export default function AdminSignIn() {
  const { user, roles, loading, rolesLoaded, signIn } = useAuth();
  const signOut = useSignOut();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [step, setStep] = useState<Step>('checking');
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [factorId, setFactorId] = useState<string | null>(null);
  const [enrollment, setEnrollment] = useState<Enrollment | null>(null);
  const started = useRef<string | null>(null);

  useEffect(() => { rememberGate(pathname); }, [pathname]);

  const finish = useCallback(() => navigate(takeAdminNext(), { replace: true }), [navigate]);

  // After sign-in: team members go to the authenticator step (set up on the first visit).
  useEffect(() => {
    if (loading || (user && !rolesLoaded)) { setStep('checking'); return; }
    if (!user) { setStep('signin'); started.current = null; return; }
    if (!roles.some((role) => TEAM_ROLES.includes(role))) { setStep('not-team'); return; }
    if (started.current === user.id) return;
    started.current = user.id;
    (async () => {
      setStep('checking');
      if (!TEAM_MFA_REQUIRED) {
        // Authenticator step off (founder's call): this sign-in came through the link, so it opens the portal.
        const { data } = await supabase.auth.getSession();
        markGatePassed(user.id, data.session?.access_token);
        finish();
        return;
      }
      if (await teamSessionFresh()) { finish(); return; }
      const { data, error } = await supabase.auth.mfa.listFactors();
      if (error) { setMessage('Could not load your authenticator. Refresh and try again.'); setStep('error'); return; }
      const verified = (data?.totp ?? []).filter((f) => f.status === 'verified');
      if (verified.length) { setFactorId(verified[0].id); setStep('challenge'); return; }
      // A setup that was started and never finished is removed, so a fresh QR code can be shown.
      for (const f of data?.all ?? []) {
        if (f.factor_type === 'totp' && f.status !== 'verified') await supabase.auth.mfa.unenroll({ factorId: f.id });
      }
      const { data: en, error: enrollError } = await supabase.auth.mfa.enroll({
        factorType: 'totp', friendlyName: `CouponDonation team ${new Date().toISOString().slice(0, 10)}`, issuer: 'CouponDonation',
      });
      if (enrollError || !en) { setMessage('Authenticator setup is not available right now. Please contact support.'); setStep('error'); return; }
      setFactorId(en.id);
      setEnrollment({ id: en.id, qr: en.totp.qr_code, secret: en.totp.secret });
      setStep('enroll');
    })();
  }, [user, roles, loading, rolesLoaded, finish]);

  const submitPassword = async (e: FormEvent) => {
    e.preventDefault();
    if (busy) return;
    setBusy(true); setMessage(null);
    const { error } = await signIn(email.trim(), password);
    setBusy(false);
    if (error) setMessage('Email or password is incorrect.');
  };

  const submitCode = async (e: FormEvent) => {
    e.preventDefault();
    const clean = code.replace(/\s+/g, '');
    if (!factorId || busy) return;
    if (!CODE_RE.test(clean)) { setMessage('Enter the 6-digit code from your authenticator app.'); return; }
    setBusy(true); setMessage(null);
    const { error } = await supabase.auth.mfa.challengeAndVerify({ factorId, code: clean });
    setBusy(false);
    if (error) { setMessage("That code didn't work. Enter the newest code, and check that your phone's clock is set automatically."); setCode(''); return; }
    finish();
  };

  const codeField = (
    <div>
      <Label htmlFor="team-code">6-digit code</Label>
      <Input id="team-code" name="one-time-code" inputMode="numeric" autoComplete="one-time-code" maxLength={7} autoFocus
        value={code} onChange={(e) => setCode(e.target.value.replace(/[^\d ]/g, ''))} className="mt-1.5 h-12 text-center text-lg tracking-[0.4em]" />
    </div>
  );

  return (
    <main className="flex min-h-dvh items-center justify-center bg-muted/40 px-4 py-12">
      <div className="w-full max-w-md rounded-2xl bg-background p-7 shadow-sm sm:p-9">
        <div className="mb-6 flex items-center gap-3">
          <img src="/brand/logo-256.webp" alt="" width={40} height={40} className="h-10 w-10" />
          <div>
            <h1 className="font-display text-2xl font-normal leading-tight text-foreground">Team sign-in</h1>
            <p className="text-sm text-muted-foreground">CouponDonation</p>
          </div>
        </div>

        {step === 'checking' && <p className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />Checking…</p>}

        {step === 'signin' && (
          <>
            <form onSubmit={submitPassword} className="space-y-4" noValidate>
              <div><Label htmlFor="team-email">Email</Label>
                <Input id="team-email" type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1.5 h-11" required /></div>
              <div><Label htmlFor="team-password">Password</Label>
                <Input id="team-password" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} className="mt-1.5 h-11" required /></div>
              {message && <p role="alert" className="text-sm text-destructive">{message}</p>}
              <Button type="submit" className="h-11 w-full" disabled={busy || !email || !password}>{busy ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Continue'}</Button>
            </form>
            <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground"><span className="h-px flex-1 bg-border" />or<span className="h-px flex-1 bg-border" /></div>
            <GoogleSignIn />
            {TEAM_MFA_REQUIRED && <p className="mt-5 text-xs leading-relaxed text-muted-foreground">After signing in you'll be asked for a code from your authenticator app.</p>}
          </>
        )}

        {step === 'enroll' && enrollment && (
          <form onSubmit={submitCode} className="space-y-4">
            <p className="flex items-start gap-2 text-sm text-foreground"><ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />Set up your authenticator app. You'll need it every time you sign in here.</p>
            <ol className="list-decimal space-y-1 pl-5 text-sm text-muted-foreground">
              <li>Open an authenticator app (Google Authenticator, Microsoft Authenticator, 1Password or similar).</li>
              <li>Scan this code, or type the setup key below.</li>
              <li>Enter the 6-digit code the app shows.</li>
            </ol>
            <div className="flex justify-center rounded-lg bg-white p-3"><img src={enrollment.qr} alt="QR code for your authenticator app" width={192} height={192} className="h-48 w-48" /></div>
            <div className="flex items-center justify-between gap-2 rounded-md bg-muted px-3 py-2">
              <code className="break-all text-xs text-foreground">{enrollment.secret.replace(/(.{4})/g, '$1 ').trim()}</code>
              <button type="button" onClick={() => void navigator.clipboard?.writeText(enrollment.secret)} className="rounded p-1 text-muted-foreground hover:bg-background hover:text-foreground" aria-label="Copy setup key"><Copy className="h-4 w-4" /></button>
            </div>
            <p className="text-xs text-muted-foreground">Keep this setup key somewhere safe, like a password manager. It's the way back in if you lose your phone.</p>
            {codeField}
            {message && <p role="alert" className="text-sm text-destructive">{message}</p>}
            <Button type="submit" className="h-11 w-full" disabled={busy}>{busy ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Turn on and continue'}</Button>
          </form>
        )}

        {step === 'challenge' && (
          <form onSubmit={submitCode} className="space-y-4">
            <p className="text-sm text-foreground">Enter the 6-digit code from your authenticator app.</p>
            {codeField}
            {message && <p role="alert" className="text-sm text-destructive">{message}</p>}
            <Button type="submit" className="h-11 w-full" disabled={busy}>{busy ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Continue'}</Button>
          </form>
        )}

        {step === 'not-team' && <p className="text-sm text-foreground">This account doesn't have team access.</p>}
        {step === 'error' && <p role="alert" className="text-sm text-destructive">{message}</p>}

        {user && step !== 'signin' && (
          <button type="button" onClick={() => void signOut()} className="mt-6 text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline">Sign out</button>
        )}
      </div>
    </main>
  );
}
