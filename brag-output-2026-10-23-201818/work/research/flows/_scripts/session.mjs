// A neutral, obviously-placeholder signed-in session for local previews only (never shown as real data).
const b64 = (o) => Buffer.from(JSON.stringify(o)).toString('base64url');
export const USER = { id: '00000000-0000-4000-8000-000000000001', aud: 'authenticated', role: 'authenticated', email: 'you@example.com', user_metadata: { full_name: 'Preview' }, app_metadata: { provider: 'email' }, created_at: '2026-10-01T00:00:00Z' };
const exp = Math.floor(Date.now() / 1000) + 3600 * 24;
const jwt = `${b64({ alg: 'HS256', typ: 'JWT' })}.${b64({ sub: USER.id, email: USER.email, role: 'authenticated', aud: 'authenticated', exp })}.c2ln`;
export const SESSION = { access_token: jwt, token_type: 'bearer', expires_in: 86400, expires_at: exp, refresh_token: 'preview', user: USER };
export const KEY = 'sb-vbnbacowuoeeojjdrzzp-auth-token';
export async function signIn(ctx) {
  await ctx.addInitScript(({ key, session }) => { try { localStorage.setItem(key, JSON.stringify(session)); } catch {} }, { key: KEY, session: SESSION });
}
