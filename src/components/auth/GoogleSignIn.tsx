import { useEffect, useRef, useState } from 'react';
import { Loader2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { createGoogleNonce, googleIdentityOptions, googleTokenRequest, loadGoogleIdentity } from '@/lib/googleIdentity';
import { markAgreement } from '@/lib/legal';

/** Google's own button opens from this site's origin, not an OAuth redirect. */
export function GoogleSignIn() {
  const hostRef = useRef<HTMLDivElement>(null);
  const inFlight = useRef(false);
  const [attempt, setAttempt] = useState(0);
  const [state, setState] = useState<'loading' | 'ready' | 'signing-in' | 'failed'>('loading');
  const [error, setError] = useState('');
  useEffect(() => {
    let disposed = false;
    let resize: ResizeObserver | undefined;
    setState('loading');
    const setup = async () => {
      try {
        const [api, nonce] = await Promise.all([loadGoogleIdentity(), createGoogleNonce()]);
        const host = hostRef.current;
        if (disposed || !host) return;
        api.initialize(googleIdentityOptions(nonce.hashed, async response => {
          if (disposed || inFlight.current) return;
          inFlight.current = true;
          setError('');
          setState('signing-in');
          markAgreement('google');
          try {
            const { data, error: authError } = await supabase.auth.signInWithIdToken(googleTokenRequest(response.credential, nonce.raw));
            if (authError || !data.user || !data.session) throw new Error('Google sign-in could not finish.');
            // The existing Auth listener owns navigation and account access.
          } catch {
            if (!disposed) {
              setError('Google sign-in could not finish. Please try again or use email.');
              setAttempt(value => value + 1);
            }
          } finally { inFlight.current = false; }
        }));
        let renderedWidth = 0;
        const render = () => {
          if (disposed || inFlight.current) return;
          const width = Math.min(400, Math.max(200, Math.floor(host.clientWidth)));
          if (renderedWidth === width) return;
          renderedWidth = width;
          host.replaceChildren();
          api.renderButton(host, { type: 'standard', theme: 'outline', size: 'large', text: 'continue_with', shape: 'rectangular', width, logo_alignment: 'left' });
        };
        render();
        resize = new ResizeObserver(render);
        resize.observe(host);
        setState('ready');
      } catch {
        if (!disposed) {
          setState('failed');
          setError('Google sign-in is unavailable right now. You can still sign in with email.');
        }
      }
    };
    void setup();
    const host = hostRef.current;
    return () => { disposed = true; resize?.disconnect(); host?.replaceChildren(); };
  }, [attempt]);
  return (
    <div className="space-y-2">
      <div className="relative flex min-h-11 w-full items-center justify-center" aria-busy={state === 'loading' || state === 'signing-in'}>
        <div ref={hostRef} className={`flex w-full min-h-11 justify-center ${state === 'signing-in' ? 'pointer-events-none opacity-40' : ''}`} />
        {(state === 'loading' || state === 'signing-in') && <span role="status" className="absolute inset-0 flex items-center justify-center gap-2 bg-background text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" />{state === 'loading' ? 'Loading Google…' : 'Signing in…'}</span>}
        {state === 'failed' && <Button type="button" variant="outline" className="absolute inset-0 w-full" onClick={() => { setError(''); setAttempt(value => value + 1); }}><RefreshCw className="mr-2 h-4 w-4" />Retry Google sign-in</Button>}
      </div>
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
