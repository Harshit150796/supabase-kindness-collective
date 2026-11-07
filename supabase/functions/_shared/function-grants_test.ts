import { assert, assertEquals } from 'https://deno.land/std@0.224.0/assert/mod.ts';

// Security review, Nov 2026. Supabase grants EXECUTE on every new public function to anon AND
// authenticated, so "revoke ... from public, anon" still leaves a function callable by any signed-in
// account. That is how public_fundraiser_coupons (gift card codes), admin_person (emails) and others
// stayed open until the lockdown migration. This test replays every migration's grants and fails when
// a function meant for server code only (its last grant goes to service_role alone) can still be
// called by authenticated.

const dir = new URL('../../migrations/', import.meta.url);
const files = [...Deno.readDirSync(dir)].map((e) => e.name).filter((n) => n.endsWith('.sql')).sort();
const sql = files.map((n) => Deno.readTextFileSync(new URL(n, dir)).replace(/--[^\n]*/g, ''));

const names = (list: string) => [...list.matchAll(/(?:public\.)?"?(\w+)"?\s*\(/g)].map((m) => m[1].toLowerCase());
const roles = (list: string) => list.split(',').map((r) => r.trim().toLowerCase());

type State = { serviceOnly: boolean; authOpen: boolean };
type FileEffect = { grants: Set<string>; revokesAuth: boolean; revokes: boolean };

/**
 * Replays function grants migration by migration. A file "means" a function for server code only when
 * it revokes the function from someone and grants it to service_role alone; it actually closes it to
 * signed-in accounts only when it also revokes from authenticated. A new function starts open.
 */
function replay(): Map<string, State> {
  const fns = new Map<string, State>();
  for (const src of sql) {
    for (const m of src.matchAll(/drop\s+function\s+(?:if\s+exists\s+)?(?:public\.)?"?(\w+)"?/gi)) fns.delete(m[1].toLowerCase());
    for (const m of src.matchAll(/create\s+(or\s+replace\s+)?function\s+(?:public\.)?"?(\w+)"?\s*\(/gi)) {
      const n = m[2].toLowerCase();
      if (!fns.has(n) || !m[1]) fns.set(n, { serviceOnly: false, authOpen: true });
    }
    const eff = new Map<string, FileEffect>();
    const at = (n: string) => { if (!eff.has(n)) eff.set(n, { grants: new Set(), revokesAuth: false, revokes: false }); return eff.get(n)!; };
    for (const m of src.matchAll(/grant\s+(?:execute|all)(?:\s+privileges)?\s+on\s+function\s+([\s\S]*?)\s+to\s+([^;]+);/gi)) {
      for (const n of names(m[1])) roles(m[2]).forEach((r) => at(n).grants.add(r));
    }
    const revoke = (n: string, rs: string[]) => { const e = at(n); e.revokes = true; if (rs.includes('authenticated')) e.revokesAuth = true; };
    for (const m of src.matchAll(/revoke\s+(?:execute|all)(?:\s+privileges)?\s+on\s+function\s+([\s\S]*?)\s+from\s+([^;]+);/gi)) {
      for (const n of names(m[1])) revoke(n, roles(m[2]));
    }
    // Loops over a list of names: "where p.proname in ('a', 'b') ... revoke ... on function %s from public, anon, authenticated".
    for (const m of src.matchAll(/proname\s+in\s*\(([^)]*)\)[\s\S]*?revoke\s+(?:execute|all)\s+on\s+function\s+%s\s+from\s+([^']+)'/gi)) {
      for (const q of m[1].matchAll(/'(\w+)'/g)) revoke(q[1].toLowerCase(), roles(m[2]));
    }
    for (const [n, e] of eff) {
      const s = fns.get(n) ?? { serviceOnly: false, authOpen: true };
      const toPeople = ['authenticated', 'anon', 'public'].some((r) => e.grants.has(r));
      const toServiceOnly = e.grants.size > 0 && [...e.grants].every((r) => r === 'service_role' || r === 'postgres');
      if (toPeople) fns.set(n, { serviceOnly: false, authOpen: true });
      else if (e.revokesAuth) fns.set(n, { serviceOnly: s.serviceOnly || toServiceOnly, authOpen: false });
      else if (e.revokes && toServiceOnly) fns.set(n, { serviceOnly: true, authOpen: s.authOpen });
    }
  }
  return fns;
}

Deno.test('functions meant for server code only are closed to signed-in accounts too', () => {
  const open = [...replay()].filter(([, s]) => s.serviceOnly && s.authOpen).map(([n]) => n).sort();
  assertEquals(open, [], `callable by any signed-in account: ${open.join(', ')}`);
});

Deno.test('the lockdown covers the functions found open in the November review', () => {
  const fns = replay();
  for (const n of ['public_fundraiser_coupons', 'public_outside_gifts', 'admin_person', '_set_coupon_source_credit', 'email_log_upsert',
    'email_status', 'queue_outside_gift_events', 'purge_removed_conversations', 'coupon_fundraiser', 'fundraiser_card', 'profile_row',
    'is_blocked_pair', 'team_mfa_required', 'svc_end_user_sessions']) {
    assert(fns.get(n) && !fns.get(n)!.authOpen, `${n} is still callable by signed-in accounts`);
  }
  // has_completed_donation answers only about the signed-in person, or for server code.
  const last = sql.map((s) => s.match(/function\s+public\.has_completed_donation[\s\S]*?\$\$([\s\S]*?)\$\$/i)?.[1]).filter(Boolean).pop() ?? '';
  assert(/_uid\s*=\s*auth\.uid\(\)/.test(last) && /service_role/.test(last), 'has_completed_donation must check the caller');
});
