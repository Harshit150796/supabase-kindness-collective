import { assert, assertEquals } from 'https://deno.land/std@0.224.0/assert/mod.ts';

// Security review, Nov 2026. Supabase grants EXECUTE on every new public function to anon AND
// authenticated (on top of Postgres's PUBLIC), so "revoke ... from public, anon" still leaves a function
// callable by any signed-in account. That is how public_fundraiser_coupons (gift card codes), admin_person
// (emails) and others stayed open until the lockdown migration. This test replays every migration's
// function permissions and fails when:
//  1. someone restricted a function but signed-in accounts can still call it, and no migration opened it
//     to them on purpose (a grant naming authenticated, anon or public), or
//  2. a migration after the lockdown creates a new SECURITY DEFINER function without saying who may
//     call it (a grant or revoke for it in the same migration).

const LOCKDOWN = '20261107023755';
const PEOPLE = ['public', 'anon', 'authenticated'];

type Fn = { acl: Set<string>; restricted: boolean; openOnPurpose: boolean; sigs: Set<string> };
type Migration = { name: string; sql: string };
type Result = { open: string[]; undeclared: string[]; fns: Map<string, Fn> };

const stripComments = (s: string) => s.replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/--[^\n]*/g, ' ');
const roleList = (s: string) => s.split(',').map((r) => r.trim().toLowerCase().replace(/^"|"$/g, '')).filter(Boolean);
const ident = (s: string) => s.trim().toLowerCase().replace(/^public\./, '').replace(/"/g, '');
const isIdent = (s: string) => /^[a-z_][a-z0-9_]*$/.test(s);

/** The text inside the parenthesis that opens at `open`, and the index just after its close. */
function inParens(s: string, open: number): [string, number] {
  let depth = 0;
  for (let i = open; i < s.length; i++) {
    if (s[i] === '(') depth++;
    else if (s[i] === ')' && --depth === 0) return [s.slice(open + 1, i), i + 1];
  }
  return [s.slice(open + 1), s.length];
}

function splitTop(s: string): string[] {
  const out: string[] = []; let depth = 0; let cur = '';
  for (const ch of s) {
    if (ch === '(' || ch === '[') depth++;
    if (ch === ')' || ch === ']') depth--;
    if (ch === ',' && depth === 0) { out.push(cur); cur = ''; } else cur += ch;
  }
  if (cur.trim()) out.push(cur);
  return out;
}

const TYPE_ALIASES: Record<string, string> = { int: 'integer', int4: 'integer', int8: 'bigint', bool: 'boolean', float8: 'double precision', varchar: 'character varying', timestamptz: 'timestamp with time zone' };
/** A function's argument types, without names, modes or defaults (for telling overloads apart). */
function argSig(args: string): string {
  return splitTop(args).map((p) => {
    let t = p.replace(/\s+(default\s|=)[\s\S]*$/i, '').trim().toLowerCase().replace(/^(inout|in|out|variadic)\s+/, '');
    const words = t.split(/\s+/);
    if (words.length > 1 && !/^(double|character|timestamp|time|bit|interval)$/.test(words[0])) t = words.slice(1).join(' ');
    t = t.replace(/^public\./, '').replace(/"/g, '');
    return TYPE_ALIASES[t] ?? t;
  }).join(',');
}

/** "on function a(uuid), public.b, c" -> [{a, sig}, {b, null}, {c, null}] (ignores %s placeholders). */
function targets(list: string): { name: string; sig: string | null }[] {
  const out: { name: string; sig: string | null }[] = [];
  for (const part of splitTop(list)) {
    const m = part.trim().match(/^((?:public\.)?"?\w+"?)\s*(\(([\s\S]*)\))?\s*$/);
    if (!m) continue;
    const name = ident(m[1]);
    if (isIdent(name)) out.push({ name, sig: m[2] ? argSig(m[3]) : null });
  }
  return out;
}

export function replayGrants(migrations: Migration[]): Result {
  let defaults = new Set(['public', 'anon', 'authenticated', 'service_role']);
  const fns = new Map<string, Fn>();
  const undeclared: string[] = [];
  const known = (name: string) => fns.get(name);

  for (const { name: file, sql: raw } of [...migrations].sort((a, b) => a.name.localeCompare(b.name))) {
    const sql = stripComments(raw);
    const events: { at: number; run: () => void }[] = [];
    const created: { name: string; definer: boolean }[] = [];
    const mentioned = new Set<string>();

    for (const m of sql.matchAll(/create\s+(?:or\s+replace\s+)?function\s+((?:public\.)?"?\w+"?)\s*\(/gi)) {
      const name = ident(m[1]);
      const [args, after] = inParens(sql, m.index! + m[0].length - 1);
      const tag = sql.slice(after).match(/\$(\w*)\$/);
      let attrs = sql.slice(after, after + (tag?.index ?? 0));
      if (tag) {
        const bodyStart = after + tag.index! + tag[0].length;
        const bodyEnd = sql.indexOf(tag[0], bodyStart);
        const stmtEnd = sql.indexOf(';', bodyEnd < 0 ? bodyStart : bodyEnd);
        attrs += sql.slice(bodyEnd < 0 ? bodyStart : bodyEnd, stmtEnd < 0 ? undefined : stmtEnd);
      }
      const definer = /security\s+definer/i.test(attrs);
      const sig = argSig(args);
      events.push({ at: m.index!, run: () => {
        const f = known(name);
        if (!f || f.sigs.size === 0) {
          // A new function (or one recreated after a drop) starts with the default grants; a drop does not erase
          // an earlier intent to restrict it.
          if (!f) created.push({ name, definer });
          fns.set(name, { acl: new Set(defaults), restricted: f?.restricted ?? false, openOnPurpose: f?.openOnPurpose ?? false, sigs: new Set([sig]) });
        } else if (!f.sigs.has(sig)) {
          // "create or replace" with a different argument list makes a new overload, open by default.
          f.sigs.add(sig); defaults.forEach((r) => f.acl.add(r));
        }
      } });
    }

    for (const m of sql.matchAll(/drop\s+function\s+(?:if\s+exists\s+)?([^;]+);/gi)) {
      for (const t of targets(m[1].replace(/\s+(cascade|restrict)\s*$/i, ''))) {
        events.push({ at: m.index!, run: () => {
          const f = known(t.name);
          if (!f) return;
          if (t.sig === null) f.sigs.clear(); else f.sigs.delete(t.sig);
          if (f.sigs.size === 0) f.acl.clear();
        } });
      }
    }

    const grant = (name: string, rs: string[]) => {
      mentioned.add(name);
      const f = known(name);
      if (!f) return;
      rs.forEach((r) => f.acl.add(r));
      if (rs.some((r) => PEOPLE.includes(r))) f.openOnPurpose = true;
    };
    const revoke = (name: string, rs: string[]) => {
      mentioned.add(name);
      const f = known(name);
      if (!f) return;
      rs.forEach((r) => f.acl.delete(r));
      f.restricted = true;
      if (rs.includes('authenticated')) f.openOnPurpose = false;
    };
    const PRIV = String.raw`(?:execute|all)(?:\s+privileges)?`;

    for (const m of sql.matchAll(new RegExp(String.raw`grant\s+${PRIV}\s+on\s+function\s+([\s\S]*?)\s+to\s+([^;]+);`, 'gi'))) {
      const rs = roleList(m[2]);
      for (const t of targets(m[1])) events.push({ at: m.index!, run: () => grant(t.name, rs) });
    }
    for (const m of sql.matchAll(new RegExp(String.raw`revoke\s+${PRIV}\s+on\s+function\s+([\s\S]*?)\s+from\s+([^;]+);`, 'gi'))) {
      const rs = roleList(m[2]);
      for (const t of targets(m[1])) events.push({ at: m.index!, run: () => revoke(t.name, rs) });
    }
    for (const m of sql.matchAll(new RegExp(String.raw`(grant|revoke)\s+${PRIV}\s+on\s+all\s+functions\s+in\s+schema\s+public\s+(?:to|from)\s+([^;]+);`, 'gi'))) {
      const rs = roleList(m[2]);
      events.push({ at: m.index!, run: () => { for (const n of fns.keys()) (m[1].toLowerCase() === 'grant' ? grant : revoke)(n, rs); } });
    }
    for (const m of sql.matchAll(/alter\s+default\s+privileges[^;]*?\s(grant|revoke)\s+(?:execute|all)(?:\s+privileges)?\s+on\s+functions\s+(?:to|from)\s+([^;]+);/gi)) {
      const rs = roleList(m[2]);
      events.push({ at: m.index!, run: () => { defaults = new Set(defaults); rs.forEach((r) => m[1].toLowerCase() === 'grant' ? defaults.add(r) : defaults.delete(r)); } });
    }
    // Loops: "for f in select ... proname in ('a', 'b') loop" or "foreach f in array array['a(uuid)', ...] loop",
    // then execute format('revoke ... on function %s from ...', f) / format('grant ... to ...', f).
    for (const m of sql.matchAll(/\b(?:for|foreach)\s+\w+\s+in\s+([\s\S]*?)\bloop\b([\s\S]*?)\bend\s+loop/gi)) {
      const names = [...(m[1].match(/proname\s+in\s*\(([^)]*)\)/i)?.[1] ?? m[1].match(/array\s*\[([\s\S]*?)\]/i)?.[1] ?? '').matchAll(/'([^']+)'/g)]
        .map((q) => ident(q[1].replace(/\(.*$/, ''))).filter(isIdent);
      for (const s of m[2].matchAll(/format\s*\(\s*'(grant|revoke)\s+(?:execute|all)(?:\s+privileges)?\s+on\s+function\s+(?:public\.)?%[sI]\s+(?:to|from)\s+([^']+)'/gi)) {
        const rs = roleList(s[2]);
        for (const n of names) events.push({ at: m.index! + (s.index ?? 0), run: () => (s[1].toLowerCase() === 'grant' ? grant : revoke)(n, rs) });
      }
    }

    events.sort((a, b) => a.at - b.at).forEach((e) => e.run());
    if (file.slice(0, 14) > LOCKDOWN) {
      for (const c of created) if (c.definer && !mentioned.has(c.name)) undeclared.push(`${c.name} (${file})`);
    }
  }
  const open = [...fns].filter(([, f]) => f.sigs.size > 0 && f.restricted && f.acl.has('authenticated') && !f.openOnPurpose).map(([n]) => n).sort();
  return { open, undeclared, fns };
}

const dir = new URL('../../migrations/', import.meta.url);
const migrations: Migration[] = [...Deno.readDirSync(dir)].filter((e) => e.name.endsWith('.sql')).map((e) => ({ name: e.name, sql: Deno.readTextFileSync(new URL(e.name, dir)) }));

Deno.test('functions someone restricted are closed to signed-in accounts too, unless opened on purpose', () => {
  const { open } = replayGrants(migrations);
  assertEquals(open, [], `callable by any signed-in account: ${open.join(', ')}`);
});

Deno.test('new SECURITY DEFINER functions say who may call them', () => {
  const { undeclared } = replayGrants(migrations);
  assertEquals(undeclared, [], `add a grant/revoke for: ${undeclared.join(', ')}`);
});

Deno.test('the lockdown covers the functions found open in the November review', () => {
  const { fns } = replayGrants(migrations);
  for (const n of ['public_fundraiser_coupons', 'public_outside_gifts', 'admin_person', '_set_coupon_source_credit', 'email_log_upsert',
    'email_status', 'queue_outside_gift_events', 'purge_removed_conversations', 'coupon_fundraiser', 'fundraiser_card', 'profile_row',
    'is_blocked_pair', 'team_mfa_required', 'svc_end_user_sessions', 'get_top_donors_week']) {
    const f = fns.get(n);
    assert(f && !f.acl.has('authenticated') && !f.acl.has('anon') && !f.acl.has('public'), `${n} is still callable from browsers`);
  }
  // has_completed_donation answers only about the signed-in person, or for server code.
  const last = migrations.sort((a, b) => a.name.localeCompare(b.name)).map((m) => m.sql.match(/function\s+public\.has_completed_donation[\s\S]*?\$\$([\s\S]*?)\$\$/i)?.[1]).filter(Boolean).pop() ?? '';
  assert(/_uid\s*=\s*auth\.uid\(\)/.test(last) && /service_role/.test(last), 'has_completed_donation must check the caller');
});

Deno.test('the replay catches the ways the original mistake can come back', () => {
  const run = (...sqls: string[]) => replayGrants(sqls.map((sql, i) => ({ name: `2026120${i}000000_t.sql`, sql })));
  const fn = 'create function public.f(_id uuid) returns int language sql security definer as $$ select 1 $$;';
  // The original mistake, written plainly, as a loop, and spread over two migrations.
  assertEquals(run(fn + 'revoke all on function public.f(uuid) from public, anon; grant execute on function public.f(uuid) to service_role;').open, ['f']);
  assertEquals(run(fn + "do $$ declare x regprocedure; begin for x in select p.oid from pg_proc p where p.proname in ('f') loop execute format('revoke all on function %s from public, anon', x); execute format('grant execute on function %s to service_role', x); end loop; end $$;").open, ['f']);
  assertEquals(run(fn, 'revoke all on function public.f(uuid) from public, anon;', 'grant execute on function public.f(uuid) to service_role;').open, ['f']);
  // No argument list, and a commented-out fix that must not count.
  assertEquals(run(fn + 'revoke all on function f from public, anon; /* revoke all on function f(uuid) from authenticated; */').open, ['f']);
  // Dropped and recreated, or a new overload: open again until revoked again.
  const closed = fn + 'revoke all on function public.f(uuid) from public, anon, authenticated; grant execute on function public.f(uuid) to service_role;';
  assertEquals(run(closed).open, []);
  assertEquals(run(closed, 'drop function public.f(uuid); ' + fn).open, ['f']);
  assertEquals(run(closed, 'create or replace function public.f(_id uuid, _x text) returns int language sql security definer as $$ select 1 $$;').open, ['f']);
  // Opened to signed-in accounts on purpose: fine.
  assertEquals(run(fn + 'revoke all on function public.f(uuid) from public, anon; grant execute on function public.f(uuid) to authenticated;').open, []);
  // After the lockdown, a new definer function must declare its grants.
  assertEquals(run(fn).undeclared, ['f (20261200000000_t.sql)']);
  assertEquals(run(closed).undeclared, []);
});
