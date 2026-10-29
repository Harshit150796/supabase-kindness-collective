// Server-only write path for public profiles: profile fields, username, photo and cover, follows,
// person-level blocks and profile reports. Browsers can only read these (RLS + trg_profile_guard).
// Every text a person writes goes through _shared/moderation.ts (via profile-rules.ts) first.
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { createClient } from 'npm:@supabase/supabase-js@2';
import { requestUser, UUID_RE } from '../_shared/auth.ts';
import { overLimit, HOUR } from '../_shared/rate-limit.ts';
import {
  checkBio, checkCauses, checkDisplayName, checkLinks, checkMediaPath, checkUsername, REPORT_REASONS,
} from '../_shared/profile-rules.ts';

const BUCKET = 'profile-media';
const DAY = 24 * HOUR;
const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
const fail = (error: string, status = 400) => json({ error }, status);

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return fail('Method not allowed', 405);
  const SUPA = Deno.env.get('SUPABASE_URL')!;
  const admin = createClient(SUPA, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
  const user = await requestUser(req, admin);
  if (!user) return fail('Please sign in first.', 401);
  const uid = user.id;
  const body = await req.json().catch(() => ({})) as Record<string, unknown>;
  const action = String(body.action ?? '');

  try {
    const { data: me } = await admin.from('profiles')
      .select('user_id, username, avatar_url, cover_url, restrictions, profile_visibility').eq('user_id', uid).maybeSingle();
    if (!me) return fail('Your account isn’t ready yet. Please sign out and in again.', 409);
    const restricted = (what: string) => (me.restrictions ?? []).includes(what);

    // The person on the other side of a follow, block or report.
    const target = async () => {
      const name = String(body.username ?? '').trim().replace(/^@/, '').toLowerCase();
      if (!name) return null;
      const { data } = await admin.from('profiles').select('user_id, username, profile_hidden').eq('username', name).maybeSingle();
      return data && data.user_id !== uid ? data : null;
    };
    const blockedEitherWay = async (other: string) => {
      const { data } = await admin.from('user_blocks').select('blocker_id')
        .or(`and(blocker_id.eq.${uid},blocked_id.eq.${other}),and(blocker_id.eq.${other},blocked_id.eq.${uid})`).limit(1);
      return (data ?? []).length > 0;
    };

    switch (action) {
      case 'save': {
        if (restricted('profile')) return fail('Profile changes are turned off for your account. Contact support@coupondonation.com.', 403);
        if (await overLimit(admin, 'profile-save', uid, 30, HOUR)) return fail('Too many changes. Please try again in a little while.', 429);
        const patch: Record<string, unknown> = {};
        if ('display_name' in body) { const r = checkDisplayName(body.display_name); if (!r.ok) return fail(r.error); patch.display_name = r.value; }
        if ('bio' in body) { const r = checkBio(body.bio); if (!r.ok) return fail(r.error); patch.bio = r.value; }
        if ('causes' in body) { const r = checkCauses(body.causes); if (!r.ok) return fail(r.error); patch.causes = r.value; }
        if ('links' in body) { const r = checkLinks(body.links); if (!r.ok) return fail(r.error); patch.links = r.value; }
        if ('show_location' in body) patch.show_location = body.show_location === true;
        if ('show_supported' in body) patch.show_supported = body.show_supported === true;
        if ('visibility' in body) {
          const v = body.visibility === 'public' ? 'public' : 'private';
          if (v === 'public' && !me.username) return fail('Choose a username before making your profile public.');
          patch.profile_visibility = v;
        }
        if ('pinned_fundraisers' in body) {
          const ids = Array.isArray(body.pinned_fundraisers) ? Array.from(new Set(body.pinned_fundraisers.map(String))) : null;
          if (!ids || ids.length > 3 || !ids.every((x) => UUID_RE.test(x))) return fail('Pin up to 3 fundraisers.');
          if (ids.length) {
            // Only fundraisers you run or gave to (not anonymously), and only open ones.
            const [{ data: open }, { data: mine }, { data: gave }] = await Promise.all([
              admin.from('fundraisers').select('id').in('id', ids).eq('status', 'active').eq('is_example', false),
              admin.from('fundraiser_team').select('fundraiser_id').eq('user_id', uid).eq('status', 'accepted').in('fundraiser_id', ids),
              admin.from('donations').select('fundraiser_id').eq('donor_id', uid).in('status', ['completed', 'succeeded']).not('is_anonymous', 'is', true).in('fundraiser_id', ids),
            ]);
            const openSet = new Set((open ?? []).map((r) => r.id));
            const allowed = new Set([...(mine ?? []).map((r) => r.fundraiser_id), ...(gave ?? []).map((r) => r.fundraiser_id)]);
            if (!ids.every((x) => openSet.has(x) && allowed.has(x))) return fail('You can pin open fundraisers you run or supported.');
          }
          patch.pinned_fundraisers = ids;
        }
        if (!Object.keys(patch).length) return json({ ok: true });
        const { error } = await admin.from('profiles').update(patch).eq('user_id', uid);
        if (error) { console.error('profile save', error); return fail('Could not save your profile. Please try again.', 500); }
        return json({ ok: true });
      }

      case 'username': {
        if (restricted('profile')) return fail('Profile changes are turned off for your account. Contact support@coupondonation.com.', 403);
        const r = checkUsername(body.username);
        if (!r.ok) return fail(r.error);
        if (r.value === me.username) return json({ ok: true, username: r.value });
        if (await overLimit(admin, 'profile-username', uid, 5, DAY)) return fail('You’ve changed your username a lot today. Please try again tomorrow.', 429);
        const { error } = await admin.from('profiles').update({ username: r.value, username_changed_at: new Date().toISOString() }).eq('user_id', uid);
        if (error) {
          if ((error as { code?: string }).code === '23505') return fail('That username is taken. Please choose another.', 409);
          console.error('username', error);
          return fail('Could not save your username. Please try again.', 500);
        }
        return json({ ok: true, username: r.value });
      }

      case 'image': {
        if (restricted('profile')) return fail('Profile changes are turned off for your account. Contact support@coupondonation.com.', 403);
        const kind = body.kind === 'cover' ? 'cover' : body.kind === 'avatar' ? 'avatar' : null;
        if (!kind) return fail('Choose a photo or a cover.');
        if (await overLimit(admin, 'profile-image', uid, 20, HOUR)) return fail('Too many uploads. Please try again in a little while.', 429);
        const column = kind === 'avatar' ? 'avatar_url' : 'cover_url';
        const previous: string | null = me[column];
        let url: string | null = null;
        if (body.path !== null) {
          const r = checkMediaPath(body.path, uid, kind);
          if (!r.ok) return fail(r.error);
          const file = r.value.split('/')[1];
          const { data: found } = await admin.storage.from(BUCKET).list(uid, { search: file, limit: 1 });
          if (!(found ?? []).some((o: { name: string }) => o.name === file)) return fail('Upload the photo again.');
          url = `${SUPA}/storage/v1/object/public/${BUCKET}/${r.value}`;
        }
        const { error } = await admin.from('profiles').update({ [column]: url }).eq('user_id', uid);
        if (error) return fail('Could not save the photo. Please try again.', 500);
        // Remove the replaced file from your own folder.
        const prefix = `${SUPA}/storage/v1/object/public/${BUCKET}/${uid}/`;
        if (previous && previous.startsWith(prefix) && previous !== url) {
          await admin.storage.from(BUCKET).remove([previous.slice(prefix.length - uid.length - 1)]).catch(() => undefined);
        }
        return json({ ok: true, url });
      }

      case 'follow': {
        const t = await target();
        if (!t || t.profile_hidden) return fail('We couldn’t find that person.', 404);
        if (body.follow === false) {
          await admin.from('follows').delete().eq('follower_id', uid).eq('followee_id', t.user_id);
          return json({ ok: true, following: false });
        }
        if (restricted('following')) return fail('Following is turned off for your account. Contact support@coupondonation.com.', 403);
        if (await blockedEitherWay(t.user_id)) return fail('You can’t follow this person.', 403);
        if (await overLimit(admin, 'profile-follow', uid, 60, HOUR)) return fail('You’re following people too quickly. Please try again later.', 429);
        const { data: row } = await admin.from('follows').upsert({ follower_id: uid, followee_id: t.user_id }, { onConflict: 'follower_id,followee_id', ignoreDuplicates: true }).select('created_at');
        if ((row ?? []).length) {
          // One "started following you" per person per week, so follow/unfollow can't spam.
          const since = new Date(Date.now() - 7 * DAY).toISOString();
          const { data: recent } = await admin.from('profile_notifications').select('id').eq('user_id', t.user_id).eq('actor_id', uid).eq('kind', 'follow').gte('created_at', since).limit(1);
          if (!(recent ?? []).length) await admin.from('profile_notifications').insert({ user_id: t.user_id, actor_id: uid, kind: 'follow' });
        }
        return json({ ok: true, following: true });
      }

      case 'notify': {
        const t = await target();
        if (!t) return fail('We couldn’t find that person.', 404);
        await admin.from('follows').update({ notify: body.notify === true }).eq('follower_id', uid).eq('followee_id', t.user_id);
        return json({ ok: true });
      }

      case 'block': {
        const t = await target();
        if (!t) return fail('We couldn’t find that person.', 404);
        if (body.block === false) {
          await admin.from('user_blocks').delete().eq('blocker_id', uid).eq('blocked_id', t.user_id);
          return json({ ok: true, blocked: false });
        }
        if (await overLimit(admin, 'profile-block', uid, 30, HOUR)) return fail('Please try again in a little while.', 429);
        await admin.from('user_blocks').upsert({ blocker_id: uid, blocked_id: t.user_id }, { onConflict: 'blocker_id,blocked_id', ignoreDuplicates: true });
        // Blocking ends following both ways (GoFundMe's rule).
        await admin.from('follows').delete().or(`and(follower_id.eq.${uid},followee_id.eq.${t.user_id}),and(follower_id.eq.${t.user_id},followee_id.eq.${uid})`);
        return json({ ok: true, blocked: true });
      }

      case 'report': {
        const t = await target();
        if (!t) return fail('We couldn’t find that person.', 404);
        const reason = String(body.reason ?? '');
        if (!REPORT_REASONS.includes(reason)) return fail('Choose a reason.');
        const details = String(body.details ?? '').trim().slice(0, 2000) || null;
        if (await overLimit(admin, 'profile-report', uid, 10, HOUR)) return fail('Please try again in a little while.', 429);
        const { error } = await admin.from('content_reports').insert({ reporter_id: uid, target_type: 'profile', target_id: t.user_id, reason, details });
        if (error) { console.error('profile report', error); return fail('Could not send the report. Please try again.', 500); }
        return json({ ok: true });
      }

      default:
        return fail('Unknown action');
    }
  } catch (e) {
    console.error('profile-actions', action, e);
    return fail('Something went wrong. Please try again.', 500);
  }
});
