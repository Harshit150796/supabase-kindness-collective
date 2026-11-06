import { supabase } from '@/integrations/supabase/client';

/**
 * The hidden team sign-in (founder request, Nov 6, 2026). The admin portal opens only after signing in
 * through one secret link and passing an authenticator-app code. The site's code keeps only the link's
 * SHA-256, so the link itself is not in any file a visitor can download. To change the link, put the
 * SHA-256 of the new path (for example "/team-…") here.
 */
export const ADMIN_GATE_HASH = '6efdaacd9eecedce6964d5d905b0933370ba7280ca387ffeae1d1a98a7c073df';
/** How long an authenticator check lasts before the code is asked again (security_settings.team_mfa_max_age_hours). */
export const TEAM_MFA_MAX_AGE_HOURS = 12;

const GATE_KEY = 'cd-admin-gate';
const NEXT_KEY = 'cd-admin-next';

/** Whether this path is the secret sign-in link. */
export async function isAdminGatePath(pathname: string): Promise<boolean> {
  const clean = pathname.replace(/\/+$/, '');
  if (!/^\/[a-z0-9-]{20,60}$/.test(clean) || !globalThis.crypto?.subtle) return false;
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(clean));
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('') === ADMIN_GATE_HASH;
}

const read = (key: string) => { try { return sessionStorage.getItem(key); } catch { return null; } };
const write = (key: string, value: string | null) => {
  try { if (value === null) sessionStorage.removeItem(key); else sessionStorage.setItem(key, value); } catch { /* private mode */ }
};

/** This tab came through the secret link, so the portal can send the team back there when the check runs out. */
export const rememberGate = (path: string) => write(GATE_KEY, path);
export const gatePath = () => read(GATE_KEY);
/** The admin page someone wanted before signing in (only /admin paths). */
export const rememberAdminNext = (path: string) => { if (path.startsWith('/admin')) write(NEXT_KEY, path); };
export const takeAdminNext = () => { const next = read(NEXT_KEY); write(NEXT_KEY, null); return next?.startsWith('/admin') ? next : '/admin'; };

/** True when this session passed the authenticator step within TEAM_MFA_MAX_AGE_HOURS. */
export async function teamSessionFresh(): Promise<boolean> {
  const { data, error } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  if (error || data?.currentLevel !== 'aal2') return false;
  const times = (data.currentAuthenticationMethods ?? []).filter((m) => m.method === 'totp').map((m) => Number(m.timestamp) || 0);
  const latest = times.length ? Math.max(...times) : 0;
  return latest * 1000 > Date.now() - TEAM_MFA_MAX_AGE_HOURS * 3_600_000;
}
