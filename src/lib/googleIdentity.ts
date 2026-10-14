// Public Web OAuth client ID from the configured provider's public authorize URL.
export const GOOGLE_CLIENT_ID = import.meta.env?.VITE_GOOGLE_CLIENT_ID ||
  '489615157150-dallsag01smn1laq5d16epmf40spm180.apps.googleusercontent.com';

export interface GoogleCredential { credential?: string }
export interface GoogleIdentityApi {
  initialize(options: { client_id: string; callback: (response: GoogleCredential) => void; nonce: string; auto_select: boolean; ux_mode: 'popup' }): void;
  renderButton(parent: HTMLElement, options: { type: 'standard'; theme: 'outline'; size: 'large'; text: 'continue_with'; shape: 'rectangular'; width: number; logo_alignment: 'left' }): void;
}
function identityApi(): GoogleIdentityApi | undefined {
  return (window as Window & { google?: { accounts?: { id?: GoogleIdentityApi } } }).google?.accounts?.id;
}
let scriptPromise: Promise<GoogleIdentityApi> | undefined;
export function loadGoogleIdentity(): Promise<GoogleIdentityApi> {
  const current = identityApi();
  if (current) return Promise.resolve(current);
  if (scriptPromise) return scriptPromise;
  scriptPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    const fail = () => {
      clearTimeout(timer);
      script.remove();
      scriptPromise = undefined;
      reject(new Error('Google sign-in could not load. Please use email or try again.'));
    };
    const timer = window.setTimeout(fail, 12000);
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.onload = () => {
      const api = identityApi();
      if (!api) { fail(); return; }
      clearTimeout(timer);
      resolve(api);
    };
    script.onerror = fail;
    document.head.appendChild(script);
  });
  return scriptPromise;
}
export async function createGoogleNonce() {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  const raw = Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('');
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(raw));
  const hashed = Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, '0')).join('');
  return { raw, hashed };
}
export function googleIdentityOptions(hashedNonce: string, callback: (response: GoogleCredential) => void) {
  return { client_id: GOOGLE_CLIENT_ID, callback, nonce: hashedNonce, auto_select: false, ux_mode: 'popup' as const };
}
export function googleTokenRequest(credential: string | undefined, rawNonce: string) {
  if (!credential?.trim() || !rawNonce) throw new Error('Google did not return a sign-in credential. Please try again.');
  return { provider: 'google' as const, token: credential, nonce: rawNonce };
}
