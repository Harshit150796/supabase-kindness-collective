// The admin portal stops timing out (founder report, Nov 23, 2026): the site-wide 15-minute idle sign-out (and
// the 24-hour one) no longer apply to team members, the hourly token refresh no longer swaps the portal for
// "Loading…", and an ended session goes back to the team sign-in instead of the public 404 page.
import { assert, assertEquals, assertStringIncludes } from 'https://deno.land/std@0.224.0/assert/mod.ts';

const root = new URL('../../../', import.meta.url);
const read = (path: string) => Deno.readTextFileSync(new URL(path, root));

Deno.test('team members are never signed out by the idle or 24-hour timers', () => {
  const src = read('src/hooks/useSessionSecurity.ts');
  assertStringIncludes(src, 'const timed = !!user && rolesLoaded && !roles.some((role) => TEAM_ROLES.includes(role));');
  assertStringIncludes(src, 'enabled: timed,');
  assertStringIncludes(src, 'if (!timed) return;');
  assertEquals(src.includes('enabled: !!user'), false);
  // Everyone else keeps both timers as before.
  assertStringIncludes(src, 'const IDLE_TIMEOUT = 15 * 60 * 1000;');
  assertStringIncludes(src, 'const ABSOLUTE_TIMEOUT = 24 * 60 * 60 * 1000;');
});

Deno.test('the admin check reruns in place: a refreshed token for the same sign-in keeps the portal open', () => {
  const src = read('src/hooks/useTeamSession.ts');
  assertStringIncludes(src, "const key = userId ? `${userId}:${sessionIdOf(token) ?? ''}` : null;");
  assertStringIncludes(src, '}, [key, userId]);');
  assertEquals(src.includes('setFresh(null)'), false, 'never blanked on a token refresh');
  assertEquals(/\[user, token\]/.test(src), false);
  assertStringIncludes(read('src/lib/adminGate.ts'), 'export function sessionIdOf(');
  // The 12-hour rule itself is unchanged.
  assertStringIncludes(read('src/lib/adminGate.ts'), 'export const TEAM_MFA_MAX_AGE_HOURS = 12;');
});

Deno.test('an ended session goes back to the team sign-in, or a plain "sign in again" page, never the 404 for the team', () => {
  const src = read('src/components/admin/AdminShell.tsx');
  assert(/const gate = gatePath\(\);\s+if \(gate\) return <Navigate to=\{gate\} replace \/>;/.test(src));
  assertStringIncludes(src, 'return team ? <><NoIndex title="Sign in again" /><SessionEnded /></> : <AdminNotFound />;');
  // The page names no link: only the public site.
  const page = src.slice(src.indexOf('export function SessionEnded'), src.indexOf('export function AdminShell'));
  assertEquals((page.match(/href="/g) ?? []).length, 1);
  assertStringIncludes(page, '<a href="/">Go to the public site</a>');
  assertEquals(/team-|ADMIN_GATE_HASH|gatePath/.test(page), false);
});
