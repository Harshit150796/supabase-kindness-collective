// Case-insensitive, authoritative check for whether an account already exists.
// Checks public.profiles first, then falls back to the auth user list so
// accounts created without a profile row are still detected.

// Exact, case-insensitive match: % and _ in an address must not act as wildcards.
export const likeExact = (s: string) => s.trim().replace(/[\\%_]/g, (c) => `\\${c}`);

// The same rule as the sign-up form (zod's email check): letters, digits and . _ ' + - before the @,
// a normal domain after it. No spaces, quotes, * or %.
export const EMAIL_RE = /^(?!\.)(?!.*\.\.)([A-Z0-9_'+\-.]*)[A-Z0-9_+-]@([A-Z0-9][A-Z0-9-]*\.)+[A-Z]{2,}$/i;
export const isEmail = (s: unknown): s is string => typeof s === "string" && s.trim().length <= 254 && EMAIL_RE.test(s.trim());

/**
 * Adds an exact, case-insensitive email match to a query. The database API turns * into a wildcard
 * in like/ilike (and % and _ are wildcards anyway), so % and _ are escaped and an address with a *
 * is matched exactly as written instead.
 */
// deno-lint-ignore no-explicit-any
export function whereEmail(query: any, column: string, email: string) {
  const e = email.trim();
  if (e.includes("*")) return query.in(column, [...new Set([e, e.toLowerCase()])]);
  return query.ilike(column, likeExact(e));
}

// deno-lint-ignore no-explicit-any
export async function emailExists(supabaseAdmin: any, email: string): Promise<boolean> {
  const normalized = email.trim().toLowerCase();

  const { data: profileData, error: profileError } = await whereEmail(
    supabaseAdmin.from("profiles").select("id"), "email", normalized,
  ).limit(1).maybeSingle();

  if (profileError) {
    console.error("Error checking email in profiles:", profileError);
  } else if (profileData) {
    return true;
  }

  return (await findAuthUserByEmail(supabaseAdmin, normalized)) !== null;
}

export interface AuthUserLite {
  id: string;
  email?: string;
  email_confirmed_at?: string | null;
  last_sign_in_at?: string | null;
}

/**
 * Whether an address can't be used for a new account. An account someone opened through the
 * sign-up API without being able to read the inbox stays unconfirmed and is never signed in to;
 * that one doesn't block the real owner, who proves they read the inbox with a code (replaceId is
 * the account to remove first).
 */
// deno-lint-ignore no-explicit-any
export async function signupBlocked(supabaseAdmin: any, email: string): Promise<{ blocked: boolean; replaceId?: string }> {
  const user = await findAuthUserByEmail(supabaseAdmin, email);
  if (user) {
    if (!user.email_confirmed_at && !user.last_sign_in_at) return { blocked: false, replaceId: user.id };
    return { blocked: true };
  }
  return { blocked: await emailExists(supabaseAdmin, email) };
}

/** The auth user with this email (any letter case), looking through every page of users. */
// deno-lint-ignore no-explicit-any
export async function findAuthUserByEmail(supabaseAdmin: any, email: string): Promise<AuthUserLite | null> {
  const normalized = email.trim().toLowerCase();
  for (let page = 1; page <= 50; page++) {
    const { data, error } = await supabaseAdmin.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) {
      console.error("Error listing auth users:", error);
      return null;
    }
    const users = data?.users ?? [];
    // deno-lint-ignore no-explicit-any
    const found = users.find((u: any) => (u.email ?? "").toLowerCase() === normalized);
    if (found) return found;
    if (users.length < 1000) break;
  }
  return null;
}
