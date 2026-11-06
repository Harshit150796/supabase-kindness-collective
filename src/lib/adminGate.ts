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
/**
 * The authenticator step is off for now (founder's call, Nov 6, 2026): signing in through the link with
 * email and password (or Google) opens the portal for that sign-in. Turning it on later means setting
 * this to true and security_settings.require_team_mfa to true.
 */
export const TEAM_MFA_REQUIRED = false;

const GATE_KEY = 'cd-admin-gate';
const NEXT_KEY = 'cd-admin-next';
const PASS_KEY = 'cd-team-pass';

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

/** The sign-in (session) a token belongs to; it stays the same when the token refreshes. */
function sessionIdOf(token: string | null | undefined): string | null {
  try {
    const part = (token ?? '').split('.')[1] ?? '';
    const json = atob(part.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(part.length / 4) * 4, '='));
    const id = JSON.parse(json)?.session_id;
    return typeof id === 'string' && id ? id : null;
  } catch {
    return null;
  }
}

/** Records that this sign-in came through the hidden link (used while the authenticator step is off). */
export function markGatePassed(userId: string, token: string | null | undefined) {
  const session = sessionIdOf(token);
  if (!session) return;
  try { localStorage.setItem(PASS_KEY, JSON.stringify({ u: userId, s: session, at: Date.now() })); } catch { /* private mode */ }
}

/** True when this exact sign-in came through the hidden link within TEAM_MFA_MAX_AGE_HOURS. */
export function gatePassed(userId: string, token: string | null | undefined): boolean {
  try {
    const pass = JSON.parse(localStorage.getItem(PASS_KEY) ?? 'null');
    const session = sessionIdOf(token);
    return !!pass && !!session && pass.u === userId && pass.s === session && Date.now() - Number(pass.at) < TEAM_MFA_MAX_AGE_HOURS * 3_600_000;
  } catch {
    return false;
  }
}

/** Whether this session may open the admin portal (beyond having a team role). */
export async function teamAccessOk(userId: string, token: string | null | undefined): Promise<boolean> {
  return TEAM_MFA_REQUIRED ? teamSessionFresh() : gatePassed(userId, token);
}

/** Signing out ends the link's pass and this tab's way back to it. */
export function forgetGate() {
  write(GATE_KEY, null);
  write(NEXT_KEY, null);
  try { localStorage.removeItem(PASS_KEY); } catch { /* private mode */ }
}
