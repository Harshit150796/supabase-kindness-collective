// Shared request checks for edge functions (October 2026 security audit).
import { createClient } from 'npm:@supabase/supabase-js@2';

// deno-lint-ignore no-explicit-any
type Admin = any;

/** Compares two secrets in constant time, so response timing reveals nothing about either. */
export function timingSafeEqual(a: string, b: string): boolean {
  const enc = new TextEncoder();
  const x = enc.encode(a);
  const y = enc.encode(b);
  let diff = x.length ^ y.length;
  const n = Math.max(x.length, y.length);
  for (let i = 0; i < n; i++) diff |= (x[i] ?? 0) ^ (y[i] ?? 0);
  return diff === 0;
}

export function bearerToken(req: Request): string {
  return (req.headers.get('Authorization') ?? '').replace(/^Bearer\s+/i, '').trim();
}

/** True only when another edge function or a scheduled job called with the service-role key. */
export function isServiceCall(req: Request): boolean {
  const key = (Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '').trim();
  const token = bearerToken(req);
  return key.length > 0 && token.length > 0 && timingSafeEqual(token, key);
}

/** The signed-in person behind the request, or null. The anon and service keys are not people. */
export async function requestUser(req: Request, admin: Admin): Promise<{ id: string; email?: string | null } | null> {
  const token = bearerToken(req);
  if (!token) return null;
  try {
    const { data } = await admin.auth.getUser(token);
    return data?.user ?? null;
  } catch {
    return null;
  }
}

/**
 * A team-role check (is_admin_staff, is_admin_any, has_role) run as the signed-in person, not the
 * service role, so the database applies the team sign-in's authenticator rule (team_session_ok,
 * founder request Nov 2026). Every admin or staff check in an edge function goes through this;
 * a service-role rpc of these functions would skip the rule.
 */
export async function teamRpc(req: Request, fn: 'is_admin_staff' | 'is_admin_any' | 'has_role', args: Record<string, unknown>): Promise<boolean> {
  const token = bearerToken(req);
  if (!token) return false;
  const client = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data, error } = await client.rpc(fn, args);
  if (error) console.error('team check failed', fn, error.message);
  return data === true;
}

/** Service-role callers, or signed-in staff (admin or staff role) who passed the team sign-in. */
export async function serviceOrStaff(req: Request, admin: Admin): Promise<boolean> {
  if (isServiceCall(req)) return true;
  const user = await requestUser(req, admin);
  return !!user && (await teamRpc(req, 'is_admin_staff', { _uid: user.id }));
}

const SITE = 'https://coupondonation.com';
// Where a payment may send the donor back to: the live site and this project's own previews.
// Other lovable.app addresses belong to other people, so they are not trusted.
const RETURN_ORIGINS = [
  /^https:\/\/(www\.)?coupondonation\.com$/,
  /^https:\/\/(id-preview--|preview--)?3641b9a8-53c7-44ac-9c94-6032b9d89582\.(lovable\.app|lovableproject\.com)$/,
  /^http:\/\/localhost(:\d{2,5})?$/,
];

/** The site address to send people back to after checkout; never an address the caller made up. */
export function returnOrigin(req: Request): string {
  const origin = req.headers.get('origin') ?? '';
  return RETURN_ORIGINS.some((r) => r.test(origin)) ? origin : SITE;
}

export const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
