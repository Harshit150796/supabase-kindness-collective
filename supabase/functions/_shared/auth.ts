// Shared request checks for edge functions (October 2026 security audit).

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

export async function isStaff(admin: Admin, uid: string): Promise<boolean> {
  const { data } = await admin.rpc('is_admin_staff', { _uid: uid });
  return !!data;
}

/** Service-role callers, or signed-in staff (admin or staff role). */
export async function serviceOrStaff(req: Request, admin: Admin): Promise<boolean> {
  if (isServiceCall(req)) return true;
  const user = await requestUser(req, admin);
  return !!user && (await isStaff(admin, user.id));
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
