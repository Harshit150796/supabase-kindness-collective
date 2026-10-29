-- Profiles, follows and message oversight (founder request, Oct 2026).
-- 1) Public profiles: username, display name, bio, photo, cover, causes, links. Private by default:
--    a private profile shows only name, photo and cover. Public profiles can show the fundraisers
--    someone supported (non-anonymous gifts only, never amounts) when they keep that switch on.
-- 2) Follows, person-level blocks and follow notifications. All writes go through the
--    profile-actions edge function (moderated, rate-limited); browsers only read.
-- 3) Admin oversight: list every conversation with who is in it, read it (audited), remove a
--    conversation or a single message (hidden from both people, sealed copy kept one year),
--    restrict a person from messaging, profile edits or following, and moderate profiles.

-- ---------------------------------------------------------------- profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS username text,
  ADD COLUMN IF NOT EXISTS display_name text,
  ADD COLUMN IF NOT EXISTS bio text,
  ADD COLUMN IF NOT EXISTS cover_url text,
  ADD COLUMN IF NOT EXISTS causes text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS show_location boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS links jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS profile_visibility text NOT NULL DEFAULT 'private',
  ADD COLUMN IF NOT EXISTS show_supported boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS pinned_fundraisers uuid[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS username_changed_at timestamptz,
  ADD COLUMN IF NOT EXISTS profile_hidden boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS profile_hidden_reason text,
  ADD COLUMN IF NOT EXISTS restrictions text[] NOT NULL DEFAULT '{}';

ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_username_format,
  DROP CONSTRAINT IF EXISTS profiles_display_name_len,
  DROP CONSTRAINT IF EXISTS profiles_bio_len,
  DROP CONSTRAINT IF EXISTS profiles_causes_max,
  DROP CONSTRAINT IF EXISTS profiles_pinned_max,
  DROP CONSTRAINT IF EXISTS profiles_visibility_check,
  DROP CONSTRAINT IF EXISTS profiles_public_needs_username,
  DROP CONSTRAINT IF EXISTS profiles_restrictions_check,
  DROP CONSTRAINT IF EXISTS profiles_links_object;
ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_username_format CHECK (username IS NULL OR username ~ '^[a-z0-9][a-z0-9_.]{1,28}[a-z0-9]$'),
  ADD CONSTRAINT profiles_display_name_len CHECK (display_name IS NULL OR char_length(display_name) BETWEEN 1 AND 60),
  ADD CONSTRAINT profiles_bio_len CHECK (bio IS NULL OR char_length(bio) <= 160),
  ADD CONSTRAINT profiles_causes_max CHECK (cardinality(causes) <= 5),
  ADD CONSTRAINT profiles_pinned_max CHECK (cardinality(pinned_fundraisers) <= 3),
  ADD CONSTRAINT profiles_visibility_check CHECK (profile_visibility IN ('private', 'public')),
  ADD CONSTRAINT profiles_public_needs_username CHECK (profile_visibility = 'private' OR username IS NOT NULL),
  ADD CONSTRAINT profiles_restrictions_check CHECK (restrictions <@ ARRAY['messaging', 'profile', 'following']::text[]),
  ADD CONSTRAINT profiles_links_object CHECK (jsonb_typeof(links) = 'object');
CREATE UNIQUE INDEX IF NOT EXISTS profiles_username_key ON public.profiles (username) WHERE username IS NOT NULL;

-- Profile identity is written by the profile-actions function (after moderation) or by staff; a
-- browser update of the own row keeps every public-profile field as it was.
CREATE OR REPLACE FUNCTION public.trg_profile_guard() RETURNS trigger
LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF current_user NOT IN ('anon', 'authenticated') THEN RETURN NEW; END IF;
  IF auth.uid() IS NOT NULL THEN
    IF public.is_admin_staff(auth.uid()) THEN RETURN NEW; END IF;
  END IF;
  NEW.email := OLD.email;
  NEW.user_id := OLD.user_id;
  NEW.created_at := OLD.created_at;
  NEW.username := OLD.username;
  NEW.display_name := OLD.display_name;
  NEW.bio := OLD.bio;
  NEW.avatar_url := OLD.avatar_url;
  NEW.cover_url := OLD.cover_url;
  NEW.causes := OLD.causes;
  NEW.show_location := OLD.show_location;
  NEW.links := OLD.links;
  NEW.profile_visibility := OLD.profile_visibility;
  NEW.show_supported := OLD.show_supported;
  NEW.pinned_fundraisers := OLD.pinned_fundraisers;
  NEW.username_changed_at := OLD.username_changed_at;
  NEW.profile_hidden := OLD.profile_hidden;
  NEW.profile_hidden_reason := OLD.profile_hidden_reason;
  NEW.restrictions := OLD.restrictions;
  RETURN NEW;
END $$;

-- ---------------------------------------------------------------- follows, blocks, notifications
CREATE TABLE IF NOT EXISTS public.follows (
  follower_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  followee_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  notify boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (follower_id, followee_id),
  CONSTRAINT follows_not_self CHECK (follower_id <> followee_id)
);
REVOKE ALL ON public.follows FROM anon, authenticated;
GRANT SELECT ON public.follows TO authenticated;
GRANT ALL ON public.follows TO service_role;
CREATE INDEX IF NOT EXISTS follows_followee_idx ON public.follows (followee_id, created_at DESC);
ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "People see their own follows" ON public.follows;
CREATE POLICY "People see their own follows" ON public.follows FOR SELECT TO authenticated
  USING (follower_id = auth.uid() OR followee_id = auth.uid());

CREATE TABLE IF NOT EXISTS public.user_blocks (
  blocker_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  blocked_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (blocker_id, blocked_id),
  CONSTRAINT user_blocks_not_self CHECK (blocker_id <> blocked_id)
);
REVOKE ALL ON public.user_blocks FROM anon, authenticated;
GRANT SELECT ON public.user_blocks TO authenticated;
GRANT ALL ON public.user_blocks TO service_role;
CREATE INDEX IF NOT EXISTS user_blocks_blocked_idx ON public.user_blocks (blocked_id);
ALTER TABLE public.user_blocks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "People see who they blocked" ON public.user_blocks;
CREATE POLICY "People see who they blocked" ON public.user_blocks FOR SELECT TO authenticated
  USING (blocker_id = auth.uid());

CREATE TABLE IF NOT EXISTS public.profile_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  actor_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  kind text NOT NULL CHECK (kind IN ('follow')),
  created_at timestamptz NOT NULL DEFAULT now(),
  read_at timestamptz
);
REVOKE ALL ON public.profile_notifications FROM anon, authenticated;
GRANT SELECT ON public.profile_notifications TO authenticated;
GRANT ALL ON public.profile_notifications TO service_role;
CREATE INDEX IF NOT EXISTS profile_notifications_user_idx ON public.profile_notifications (user_id, created_at DESC);
ALTER TABLE public.profile_notifications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "People see their own notifications" ON public.profile_notifications;
CREATE POLICY "People see their own notifications" ON public.profile_notifications FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- ---------------------------------------------------------------- photos and covers
-- The profile-media bucket itself (public, 5 MB, image/jpeg, image/png, image/webp) is created with the storage tool.
DROP POLICY IF EXISTS "Profile media: own folder read" ON storage.objects;
DROP POLICY IF EXISTS "Profile media: own folder upload" ON storage.objects;
DROP POLICY IF EXISTS "Profile media: own folder delete" ON storage.objects;
CREATE POLICY "Profile media: own folder read" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'profile-media' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Profile media: own folder upload" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'profile-media' AND (storage.foldername(name))[1] = auth.uid()::text
    AND lower(storage.extension(name)) IN ('jpg', 'jpeg', 'png', 'webp'));
CREATE POLICY "Profile media: own folder delete" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'profile-media' AND (storage.foldername(name))[1] = auth.uid()::text);

-- ---------------------------------------------------------------- helpers
CREATE OR REPLACE FUNCTION public.profile_public_name(_display text, _full text)
RETURNS text LANGUAGE sql IMMUTABLE SET search_path = public AS $$
  SELECT coalesce(nullif(btrim(_display), ''), public.short_display_name(_full), 'CouponDonation member')
$$;

CREATE OR REPLACE FUNCTION public.is_blocked_pair(_a uuid, _b uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT _a IS NOT NULL AND _b IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.user_blocks
    WHERE (blocker_id = _a AND blocked_id = _b) OR (blocker_id = _b AND blocked_id = _a))
$$;

CREATE OR REPLACE FUNCTION public.like_pattern(_q text)
RETURNS text LANGUAGE sql IMMUTABLE SET search_path = public AS $$
  SELECT '%' || replace(replace(replace(coalesce(btrim(_q), ''), '\', '\\'), '%', '\%'), '_', '\_') || '%'
$$;

-- A fundraiser as a card: what the site's cards and resolveFundraiserImage() need, nothing private.
CREATE OR REPLACE FUNCTION public.fundraiser_card(_fid uuid)
RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT jsonb_build_object(
    'id', f.id, 'title', f.title, 'unique_slug', f.unique_slug, 'category', f.category,
    'city', f.city, 'state_code', f.state_code, 'cover_photo_url', f.cover_photo_url,
    'fundraiser_images', coalesce((SELECT jsonb_agg(jsonb_build_object('id', i.id, 'image_url', i.image_url, 'is_primary', i.is_primary, 'display_order', i.display_order)
                                   ORDER BY coalesce(i.is_primary, false) DESC, i.display_order)
                                   FROM public.fundraiser_images i WHERE i.fundraiser_id = f.id), '[]'::jsonb))
  FROM public.fundraisers f WHERE f.id = _fid
$$;

-- A person as a list row. Private profiles show only name and photo (GoFundMe's rule).
CREATE OR REPLACE FUNCTION public.profile_row(_uid uuid, _viewer uuid)
RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT jsonb_build_object(
    'username', p.username,
    'display_name', public.profile_public_name(p.display_name, p.full_name),
    'avatar_url', p.avatar_url,
    'visibility', p.profile_visibility,
    'bio', CASE WHEN p.profile_visibility = 'public' THEN p.bio END,
    'is_self', _viewer IS NOT NULL AND _viewer = p.user_id,
    'is_following', _viewer IS NOT NULL AND EXISTS (SELECT 1 FROM public.follows f WHERE f.follower_id = _viewer AND f.followee_id = p.user_id))
  FROM public.profiles p WHERE p.user_id = _uid
$$;

-- ---------------------------------------------------------------- public reads
CREATE OR REPLACE FUNCTION public.get_profile(_username text)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE
  p public.profiles;
  me uuid := auth.uid();
  self boolean;
  r jsonb;
BEGIN
  SELECT * INTO p FROM public.profiles WHERE username = lower(btrim(coalesce(_username, '')));
  IF NOT FOUND THEN RETURN NULL; END IF;
  self := me IS NOT NULL AND me = p.user_id;
  IF NOT self AND (p.profile_hidden OR public.is_blocked_pair(me, p.user_id)) THEN RETURN NULL; END IF;
  r := jsonb_build_object(
    'username', p.username,
    'display_name', public.profile_public_name(p.display_name, p.full_name),
    'avatar_url', p.avatar_url,
    'cover_url', p.cover_url,
    'visibility', p.profile_visibility,
    'hidden', p.profile_hidden,
    'is_self', self,
    'signed_in', me IS NOT NULL,
    'is_following', me IS NOT NULL AND EXISTS (SELECT 1 FROM public.follows WHERE follower_id = me AND followee_id = p.user_id),
    'follow_notify', (SELECT notify FROM public.follows WHERE follower_id = me AND followee_id = p.user_id));
  IF self OR p.profile_visibility = 'public' THEN
    r := r || jsonb_build_object(
      'bio', p.bio,
      'causes', to_jsonb(p.causes),
      'links', p.links,
      'location', CASE WHEN p.show_location THEN nullif(concat_ws(', ', nullif(btrim(p.city), ''), nullif(btrim(p.country), '')), '') END,
      'joined', p.created_at,
      'followers_count', (SELECT count(*) FROM public.follows WHERE followee_id = p.user_id),
      'following_count', (SELECT count(*) FROM public.follows WHERE follower_id = p.user_id),
      'show_supported', p.show_supported,
      'supported_count', CASE WHEN p.show_supported OR self THEN (
        SELECT count(DISTINCT d.fundraiser_id) FROM public.donations d
        JOIN public.fundraisers f ON f.id = d.fundraiser_id AND f.status = 'active' AND NOT f.is_example
        WHERE d.donor_id = p.user_id AND d.status IN ('completed', 'succeeded') AND NOT coalesce(d.is_anonymous, false)) END,
      'organized', coalesce((SELECT jsonb_agg(public.fundraiser_card(f.id) ORDER BY f.created_at DESC)
        FROM public.fundraisers f WHERE f.user_id = p.user_id AND f.status = 'active' AND NOT f.is_example), '[]'::jsonb),
      'pinned', coalesce((SELECT jsonb_agg(public.fundraiser_card(f.id) ORDER BY array_position(p.pinned_fundraisers, f.id))
        FROM public.fundraisers f WHERE f.id = ANY (p.pinned_fundraisers) AND f.status = 'active' AND NOT f.is_example), '[]'::jsonb));
  END IF;
  RETURN r;
END $$;

-- Fundraisers someone gave to without asking to stay anonymous; never amounts.
CREATE OR REPLACE FUNCTION public.get_profile_supported(_username text, _limit int DEFAULT 12, _offset int DEFAULT 0)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE p public.profiles; me uuid := auth.uid(); self boolean; rows jsonb; n bigint;
BEGIN
  SELECT * INTO p FROM public.profiles WHERE username = lower(btrim(coalesce(_username, '')));
  IF NOT FOUND THEN RETURN jsonb_build_object('rows', '[]'::jsonb, 'total', 0); END IF;
  self := me IS NOT NULL AND me = p.user_id;
  IF NOT self AND (p.profile_hidden OR p.profile_visibility <> 'public' OR NOT p.show_supported OR public.is_blocked_pair(me, p.user_id)) THEN
    RETURN jsonb_build_object('rows', '[]'::jsonb, 'total', 0);
  END IF;
  WITH s AS (
    SELECT d.fundraiser_id, max(d.created_at) AS at FROM public.donations d
    JOIN public.fundraisers f ON f.id = d.fundraiser_id AND f.status = 'active' AND NOT f.is_example
    WHERE d.donor_id = p.user_id AND d.status IN ('completed', 'succeeded') AND NOT coalesce(d.is_anonymous, false)
    GROUP BY d.fundraiser_id)
  SELECT (SELECT count(*) FROM s),
         coalesce((SELECT jsonb_agg(public.fundraiser_card(x.fundraiser_id) ORDER BY x.at DESC)
                   FROM (SELECT * FROM s ORDER BY at DESC LIMIT least(greatest(_limit, 1), 48) OFFSET greatest(_offset, 0)) x), '[]'::jsonb)
  INTO n, rows;
  RETURN jsonb_build_object('rows', rows, 'total', n);
END $$;

CREATE OR REPLACE FUNCTION public.get_follow_list(_username text, _which text, _limit int DEFAULT 30, _offset int DEFAULT 0)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE p public.profiles; me uuid := auth.uid(); rows jsonb; n bigint;
BEGIN
  IF _which NOT IN ('followers', 'following') THEN RAISE EXCEPTION 'Invalid list'; END IF;
  SELECT * INTO p FROM public.profiles WHERE username = lower(btrim(coalesce(_username, '')));
  IF NOT FOUND OR (NOT (me IS NOT NULL AND me = p.user_id)
     AND (p.profile_hidden OR p.profile_visibility <> 'public' OR public.is_blocked_pair(me, p.user_id))) THEN
    RETURN jsonb_build_object('rows', '[]'::jsonb, 'total', 0);
  END IF;
  WITH l AS (
    SELECT CASE WHEN _which = 'followers' THEN f.follower_id ELSE f.followee_id END AS uid, f.created_at
    FROM public.follows f
    WHERE (_which = 'followers' AND f.followee_id = p.user_id) OR (_which = 'following' AND f.follower_id = p.user_id)),
  v AS (
    SELECT l.* FROM l JOIN public.profiles q ON q.user_id = l.uid
    WHERE NOT q.profile_hidden AND NOT public.is_blocked_pair(me, l.uid))
  SELECT (SELECT count(*) FROM v),
         coalesce((SELECT jsonb_agg(public.profile_row(x.uid, me) ORDER BY x.created_at DESC)
                   FROM (SELECT * FROM v ORDER BY created_at DESC LIMIT least(greatest(_limit, 1), 60) OFFSET greatest(_offset, 0)) x), '[]'::jsonb)
  INTO n, rows;
  RETURN jsonb_build_object('rows', rows, 'total', n);
END $$;

-- Public profiles only; private and hidden profiles are never searchable.
CREATE OR REPLACE FUNCTION public.search_people(_q text, _limit int DEFAULT 20, _offset int DEFAULT 0)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE me uuid := auth.uid(); q text := lower(btrim(coalesce(_q, ''))); rows jsonb; n bigint;
BEGIN
  IF char_length(q) < 2 THEN RETURN jsonb_build_object('rows', '[]'::jsonb, 'total', 0); END IF;
  WITH m AS (
    SELECT p.user_id,
           (p.username = ltrim(q, '@'))::int * 3 + (p.username LIKE ltrim(q, '@') || '%')::int AS rank,
           (SELECT count(*) FROM public.follows f WHERE f.followee_id = p.user_id) AS followers
    FROM public.profiles p
    WHERE p.profile_visibility = 'public' AND NOT p.profile_hidden AND p.username IS NOT NULL
      AND (p.username ILIKE public.like_pattern(ltrim(q, '@')) OR p.display_name ILIKE public.like_pattern(q))
      AND NOT public.is_blocked_pair(me, p.user_id))
  SELECT (SELECT count(*) FROM m),
         coalesce((SELECT jsonb_agg(public.profile_row(x.user_id, me) ORDER BY x.rank DESC, x.followers DESC)
                   FROM (SELECT * FROM m ORDER BY rank DESC, followers DESC, user_id LIMIT least(greatest(_limit, 1), 50) OFFSET greatest(_offset, 0)) x), '[]'::jsonb)
  INTO n, rows;
  RETURN jsonb_build_object('rows', rows, 'total', n);
END $$;

-- People you may know: organizers you gave to, people who care about the same needs, people
-- who supported the same fundraisers (publicly), and people your follows follow.
CREATE OR REPLACE FUNCTION public.suggested_people(_limit int DEFAULT 8)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE me uuid := auth.uid(); my_causes text[]; rows jsonb;
BEGIN
  SELECT causes INTO my_causes FROM public.profiles WHERE user_id = me;
  WITH cand AS (
    SELECT p.user_id, p.causes, p.avatar_url FROM public.profiles p
    WHERE p.profile_visibility = 'public' AND NOT p.profile_hidden AND p.username IS NOT NULL
      AND (me IS NULL OR (p.user_id <> me AND NOT public.is_blocked_pair(me, p.user_id)
           AND NOT EXISTS (SELECT 1 FROM public.follows f WHERE f.follower_id = me AND f.followee_id = p.user_id)))),
  my_funds AS (
    SELECT DISTINCT d.fundraiser_id FROM public.donations d
    WHERE me IS NOT NULL AND d.donor_id = me AND d.status IN ('completed', 'succeeded')),
  scored AS (
    SELECT c.user_id,
      3 * (SELECT count(*) FROM public.fundraisers f JOIN my_funds m ON m.fundraiser_id = f.id WHERE f.user_id = c.user_id)
      + 2 * (SELECT count(DISTINCT d.fundraiser_id) FROM public.donations d JOIN my_funds m ON m.fundraiser_id = d.fundraiser_id
             JOIN public.profiles q ON q.user_id = d.donor_id AND q.show_supported
             WHERE d.donor_id = c.user_id AND d.status IN ('completed', 'succeeded') AND NOT coalesce(d.is_anonymous, false))
      + coalesce(cardinality(ARRAY(SELECT unnest(c.causes) INTERSECT SELECT unnest(coalesce(my_causes, '{}'::text[])))), 0)
      + (SELECT count(*) FROM public.follows a JOIN public.follows b ON b.follower_id = a.followee_id
         WHERE me IS NOT NULL AND a.follower_id = me AND b.followee_id = c.user_id)
      + (c.avatar_url IS NOT NULL)::int AS score,
      (SELECT count(*) FROM public.follows f WHERE f.followee_id = c.user_id) AS followers
    FROM cand c)
  SELECT coalesce(jsonb_agg(public.profile_row(s.user_id, me) ORDER BY s.score DESC, s.followers DESC), '[]'::jsonb) INTO rows
  FROM (SELECT * FROM scored ORDER BY score DESC, followers DESC, user_id LIMIT least(greatest(_limit, 1), 24)) s;
  RETURN rows;
END $$;

-- What the people you follow have been doing: new fundraisers and (public, no amounts) support.
CREATE OR REPLACE FUNCTION public.following_feed(_limit int DEFAULT 20, _offset int DEFAULT 0)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE me uuid := auth.uid(); rows jsonb;
BEGIN
  IF me IS NULL THEN RETURN '[]'::jsonb; END IF;
  WITH fol AS (
    SELECT p.user_id FROM public.follows f JOIN public.profiles p ON p.user_id = f.followee_id
    WHERE f.follower_id = me AND p.profile_visibility = 'public' AND NOT p.profile_hidden AND NOT public.is_blocked_pair(me, p.user_id)),
  ev AS (
    SELECT 'fundraiser'::text AS kind, f.user_id AS actor, f.id AS fid, f.created_at AS at
    FROM public.fundraisers f JOIN fol ON fol.user_id = f.user_id
    WHERE f.status = 'active' AND NOT f.is_example
    UNION ALL
    SELECT 'supported', d.donor_id, d.fundraiser_id, max(d.created_at)
    FROM public.donations d JOIN fol ON fol.user_id = d.donor_id
    JOIN public.profiles q ON q.user_id = d.donor_id AND q.show_supported
    JOIN public.fundraisers f ON f.id = d.fundraiser_id AND f.status = 'active' AND NOT f.is_example
    WHERE d.status IN ('completed', 'succeeded') AND NOT coalesce(d.is_anonymous, false)
    GROUP BY d.donor_id, d.fundraiser_id)
  SELECT coalesce(jsonb_agg(jsonb_build_object('kind', e.kind, 'at', e.at, 'actor', public.profile_row(e.actor, me), 'fundraiser', public.fundraiser_card(e.fid)) ORDER BY e.at DESC), '[]'::jsonb)
  INTO rows
  FROM (SELECT * FROM ev ORDER BY at DESC LIMIT least(greatest(_limit, 1), 50) OFFSET greatest(_offset, 0)) e;
  RETURN rows;
END $$;

CREATE OR REPLACE FUNCTION public.my_profile_notifications(_limit int DEFAULT 20)
RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT coalesce(jsonb_agg(jsonb_build_object('id', n.id, 'kind', n.kind, 'at', n.created_at, 'read', n.read_at IS NOT NULL,
                                               'actor', public.profile_row(n.actor_id, auth.uid())) ORDER BY n.created_at DESC), '[]'::jsonb)
  FROM (SELECT * FROM public.profile_notifications
        WHERE user_id = auth.uid() AND NOT public.is_blocked_pair(auth.uid(), actor_id)
        ORDER BY created_at DESC LIMIT least(greatest(_limit, 1), 50)) n
$$;

CREATE OR REPLACE FUNCTION public.mark_profile_notifications_read()
RETURNS void LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  UPDATE public.profile_notifications SET read_at = now() WHERE user_id = auth.uid() AND read_at IS NULL
$$;

-- The people you blocked, so you can unblock them from your profile settings.
CREATE OR REPLACE FUNCTION public.my_blocked_people()
RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT coalesce(jsonb_agg(jsonb_build_object('username', p.username, 'display_name', public.profile_public_name(p.display_name, p.full_name),
                                               'avatar_url', p.avatar_url, 'blocked_at', b.created_at) ORDER BY b.created_at DESC), '[]'::jsonb)
  FROM public.user_blocks b JOIN public.profiles p ON p.user_id = b.blocked_id
  WHERE b.blocker_id = auth.uid()
$$;

CREATE OR REPLACE FUNCTION public.username_available(_username text)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT auth.uid() IS NOT NULL
    AND lower(btrim(coalesce(_username, ''))) ~ '^[a-z0-9][a-z0-9_.]{1,28}[a-z0-9]$'
    AND NOT EXISTS (SELECT 1 FROM public.profiles WHERE username = lower(btrim(_username)) AND user_id <> auth.uid())
$$;

-- Organizer cards link to a public profile.
DROP FUNCTION IF EXISTS public.get_fundraiser_team_public(uuid);
CREATE FUNCTION public.get_fundraiser_team_public(_fundraiser_id uuid)
 RETURNS TABLE(display_name text, role text, city text, country text, username text, avatar_url text)
 LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $function$
  SELECT * FROM (
  SELECT CASE WHEN f.show_full_name AND t.role='organizer' THEN NULLIF(btrim(p.full_name),'') ELSE public.short_display_name(p.full_name) END,
         t.role, p.city, p.country,
         CASE WHEN p.profile_visibility = 'public' AND NOT p.profile_hidden THEN p.username END,
         CASE WHEN p.profile_visibility = 'public' AND NOT p.profile_hidden THEN p.avatar_url END
  FROM public.fundraiser_team t
  JOIN public.fundraisers f ON f.id=t.fundraiser_id AND f.status IN ('active','pending') AND NOT f.is_example
  JOIN public.profiles p ON p.user_id=t.user_id
  WHERE t.fundraiser_id=_fundraiser_id AND t.status='accepted'
  ORDER BY (t.role='organizer') DESC, t.created_at) a
  UNION ALL
  SELECT public.short_display_name(f.example_organizer), 'organizer', NULL, f.country, NULL, NULL FROM public.fundraisers f
  WHERE f.id=_fundraiser_id AND f.is_example AND f.status IN ('active','pending')
$function$;

-- Donor names in a fundraiser's list link to the donor's public profile (non-anonymous gifts only).
CREATE OR REPLACE FUNCTION public.get_fundraiser_donor_profiles(_fundraiser_id uuid)
RETURNS TABLE(donation_id uuid, username text, avatar_url text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT d.id, p.username, p.avatar_url
  FROM public.donations d
  JOIN public.fundraisers f ON f.id = d.fundraiser_id AND f.status IN ('active', 'pending') AND NOT f.is_example
  JOIN public.profiles p ON p.user_id = d.donor_id
  WHERE d.fundraiser_id = _fundraiser_id AND d.status IN ('completed', 'succeeded') AND NOT coalesce(d.is_anonymous, false)
    AND p.profile_visibility = 'public' AND NOT p.profile_hidden AND p.username IS NOT NULL
$$;

-- People can report a profile (photo, name, bio or links) like any other content.
ALTER TABLE public.content_reports DROP CONSTRAINT IF EXISTS content_reports_target_type_check;
ALTER TABLE public.content_reports ADD CONSTRAINT content_reports_target_type_check
  CHECK (target_type IN ('fundraiser', 'comment', 'message', 'conversation', 'profile'));

-- ---------------------------------------------------------------- removing conversations and messages
ALTER TABLE public.conversations
  ADD COLUMN IF NOT EXISTS removed_at timestamptz,
  ADD COLUMN IF NOT EXISTS removed_by uuid,
  ADD COLUMN IF NOT EXISTS removed_reason text,
  ADD COLUMN IF NOT EXISTS status_before_removal text;
ALTER TABLE public.conversations DROP CONSTRAINT IF EXISTS conversations_status_check;
ALTER TABLE public.conversations ADD CONSTRAINT conversations_status_check CHECK (status IN ('open', 'blocked', 'removed'));
ALTER TABLE public.messages
  ADD COLUMN IF NOT EXISTS removed_at timestamptz,
  ADD COLUMN IF NOT EXISTS removed_by uuid,
  ADD COLUMN IF NOT EXISTS removed_reason text,
  ADD COLUMN IF NOT EXISTS status_before_removal text;
ALTER TABLE public.messages DROP CONSTRAINT IF EXISTS messages_status_check;
ALTER TABLE public.messages ADD CONSTRAINT messages_status_check CHECK (status IN ('delivered', 'redacted', 'removed'));

-- A removed conversation disappears for both people; admins keep the sealed copy.
CREATE OR REPLACE FUNCTION public.can_access_conversation(_cid uuid, _uid uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.conversations c WHERE c.id = _cid
    AND ((c.status <> 'removed' AND (c.supporter_id = _uid OR public.is_fundraiser_team(c.fundraiser_id, _uid)))
         OR public.has_role(_uid, 'admin')))
$$;
DROP POLICY IF EXISTS "Participants view conversations" ON public.conversations;
CREATE POLICY "Participants view conversations" ON public.conversations FOR SELECT TO authenticated
  USING ((status <> 'removed' AND (supporter_id = auth.uid() OR public.is_fundraiser_team(fundraiser_id, auth.uid())))
         OR public.has_role(auth.uid(), 'admin'));
DROP POLICY IF EXISTS "Team views conversation metadata" ON public.conversations;
CREATE POLICY "Team views conversation metadata" ON public.conversations FOR SELECT TO authenticated
  USING (public.is_admin_any(auth.uid()));
DROP POLICY IF EXISTS "Participants view messages" ON public.messages;
CREATE POLICY "Participants view messages" ON public.messages FOR SELECT TO authenticated
  USING (public.can_access_conversation(conversation_id, auth.uid()) AND (status <> 'removed' OR public.has_role(auth.uid(), 'admin')));

-- ---------------------------------------------------------------- admin: conversations
CREATE OR REPLACE FUNCTION public.admin_person(_uid uuid)
RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT CASE WHEN _uid IS NULL THEN NULL ELSE coalesce((
    SELECT jsonb_build_object('user_id', p.user_id, 'name', coalesce(nullif(btrim(p.full_name), ''), p.display_name), 'email', p.email,
                              'username', p.username, 'restrictions', to_jsonb(p.restrictions))
    FROM public.profiles p WHERE p.user_id = _uid), jsonb_build_object('user_id', _uid)) END
$$;

CREATE OR REPLACE FUNCTION public.admin_list_conversations(_search text DEFAULT '', _status text DEFAULT 'all', _limit int DEFAULT 25, _offset int DEFAULT 0, _user uuid DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE rows jsonb; n bigint; pat text := public.like_pattern(_search);
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'Admin access required'; END IF;
  IF _status NOT IN ('all', 'open', 'blocked', 'removed', 'flagged') THEN RAISE EXCEPTION 'Invalid status'; END IF;
  WITH c AS (
    SELECT c.*, f.title AS fundraiser_title, f.unique_slug, f.user_id AS organizer_id,
           sp.full_name AS s_name, sp.email AS s_email, op.full_name AS o_name, op.email AS o_email
    FROM public.conversations c
    JOIN public.fundraisers f ON f.id = c.fundraiser_id
    LEFT JOIN public.profiles sp ON sp.user_id = c.supporter_id
    LEFT JOIN public.profiles op ON op.user_id = f.user_id
    WHERE (_status = 'all' OR c.status = _status
           OR (_status = 'flagged' AND EXISTS (SELECT 1 FROM public.messages m WHERE m.conversation_id = c.id AND m.status = 'redacted')))
      AND (_user IS NULL OR c.supporter_id = _user OR f.user_id = _user
           OR EXISTS (SELECT 1 FROM public.fundraiser_team t WHERE t.fundraiser_id = f.id AND t.user_id = _user AND t.status = 'accepted'))
      AND (coalesce(btrim(_search), '') = ''
           OR f.title ILIKE pat OR coalesce(sp.full_name, '') ILIKE pat OR coalesce(sp.email, '') ILIKE pat
           OR coalesce(op.full_name, '') ILIKE pat OR coalesce(op.email, '') ILIKE pat OR coalesce(sp.username, '') ILIKE pat))
  SELECT (SELECT count(*) FROM c),
    coalesce((SELECT jsonb_agg(jsonb_build_object(
      'id', x.id, 'status', x.status, 'created_at', x.created_at, 'last_message_at', x.last_message_at,
      'removed_at', x.removed_at, 'removed_reason', x.removed_reason,
      'fundraiser', jsonb_build_object('id', x.fundraiser_id, 'title', x.fundraiser_title, 'unique_slug', x.unique_slug),
      'supporter', public.admin_person(x.supporter_id),
      'organizer', public.admin_person(x.organizer_id),
      'message_count', (SELECT count(*) FROM public.messages m WHERE m.conversation_id = x.id),
      'flagged_count', (SELECT count(*) FROM public.messages m WHERE m.conversation_id = x.id AND m.status = 'redacted'),
      'removed_count', (SELECT count(*) FROM public.messages m WHERE m.conversation_id = x.id AND m.status = 'removed'))
      ORDER BY x.last_message_at DESC)
      FROM (SELECT * FROM c ORDER BY last_message_at DESC, id LIMIT least(greatest(_limit, 1), 100) OFFSET greatest(_offset, 0)) x), '[]'::jsonb)
  INTO n, rows;
  RETURN jsonb_build_object('rows', rows, 'total', n);
END $$;

-- Reading a conversation is recorded in the audit log every time.
CREATE OR REPLACE FUNCTION public.admin_conversation_thread(_cid uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE c public.conversations; f public.fundraisers; msgs jsonb;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'Admin access required'; END IF;
  SELECT * INTO c FROM public.conversations WHERE id = _cid;
  IF NOT FOUND THEN RAISE EXCEPTION 'Conversation not found'; END IF;
  SELECT * INTO f FROM public.fundraisers WHERE id = c.fundraiser_id;
  PERFORM public.log_admin_action('conversation.view', 'conversations', _cid::text, NULL, NULL);
  SELECT coalesce(jsonb_agg(jsonb_build_object(
    'id', m.id, 'sender', public.admin_person(m.sender_id),
    'side', CASE WHEN m.sender_id = c.supporter_id THEN 'supporter' WHEN m.sender_id = f.user_id THEN 'organizer' ELSE 'co-organizer' END,
    'body', m.body, 'status', m.status, 'flags', to_jsonb(m.flags), 'created_at', m.created_at,
    'removed_at', m.removed_at, 'removed_reason', m.removed_reason, 'ref_label', m.ref_label) ORDER BY m.created_at), '[]'::jsonb)
  INTO msgs FROM public.messages m WHERE m.conversation_id = _cid;
  RETURN jsonb_build_object(
    'id', c.id, 'status', c.status, 'created_at', c.created_at, 'removed_at', c.removed_at, 'removed_reason', c.removed_reason,
    'fundraiser', jsonb_build_object('id', f.id, 'title', f.title, 'unique_slug', f.unique_slug),
    'supporter', public.admin_person(c.supporter_id), 'organizer', public.admin_person(f.user_id),
    'messages', msgs);
END $$;

CREATE OR REPLACE FUNCTION public.admin_remove_conversation(_cid uuid, _reason text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE c public.conversations;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'Admin access required'; END IF;
  IF char_length(btrim(coalesce(_reason, ''))) NOT BETWEEN 3 AND 500 THEN RAISE EXCEPTION 'Give a reason (3 to 500 characters)'; END IF;
  SELECT * INTO c FROM public.conversations WHERE id = _cid FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Conversation not found'; END IF;
  IF c.status = 'removed' THEN RETURN; END IF;
  UPDATE public.conversations SET status = 'removed', status_before_removal = c.status, removed_at = now(),
    removed_by = auth.uid(), removed_reason = btrim(_reason) WHERE id = _cid;
  DELETE FROM public.notification_queue WHERE ref_id = _cid AND sent_at IS NULL;
  PERFORM public.log_admin_action('conversation.remove', 'conversations', _cid::text,
    jsonb_build_object('status', c.status), jsonb_build_object('status', 'removed', 'reason', btrim(_reason)));
END $$;

CREATE OR REPLACE FUNCTION public.admin_restore_conversation(_cid uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE c public.conversations;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'Admin access required'; END IF;
  SELECT * INTO c FROM public.conversations WHERE id = _cid FOR UPDATE;
  IF NOT FOUND OR c.status <> 'removed' THEN RAISE EXCEPTION 'Conversation is not removed'; END IF;
  UPDATE public.conversations SET status = coalesce(c.status_before_removal, 'open'), status_before_removal = NULL,
    removed_at = NULL, removed_by = NULL, removed_reason = NULL WHERE id = _cid;
  PERFORM public.log_admin_action('conversation.restore', 'conversations', _cid::text,
    jsonb_build_object('status', 'removed'), jsonb_build_object('status', coalesce(c.status_before_removal, 'open')));
END $$;

CREATE OR REPLACE FUNCTION public.admin_remove_message(_mid uuid, _reason text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE m public.messages;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'Admin access required'; END IF;
  IF char_length(btrim(coalesce(_reason, ''))) NOT BETWEEN 3 AND 500 THEN RAISE EXCEPTION 'Give a reason (3 to 500 characters)'; END IF;
  SELECT * INTO m FROM public.messages WHERE id = _mid FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Message not found'; END IF;
  IF m.status = 'removed' THEN RETURN; END IF;
  UPDATE public.messages SET status = 'removed', status_before_removal = m.status, removed_at = now(),
    removed_by = auth.uid(), removed_reason = btrim(_reason) WHERE id = _mid;
  PERFORM public.log_admin_action('message.remove', 'messages', _mid::text,
    jsonb_build_object('status', m.status, 'conversation_id', m.conversation_id), jsonb_build_object('status', 'removed', 'reason', btrim(_reason)));
END $$;

CREATE OR REPLACE FUNCTION public.admin_restore_message(_mid uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE m public.messages;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'Admin access required'; END IF;
  SELECT * INTO m FROM public.messages WHERE id = _mid FOR UPDATE;
  IF NOT FOUND OR m.status <> 'removed' THEN RAISE EXCEPTION 'Message is not removed'; END IF;
  UPDATE public.messages SET status = coalesce(m.status_before_removal, 'delivered'), status_before_removal = NULL,
    removed_at = NULL, removed_by = NULL, removed_reason = NULL WHERE id = _mid;
  PERFORM public.log_admin_action('message.restore', 'messages', _mid::text, NULL, jsonb_build_object('conversation_id', m.conversation_id));
END $$;

-- Sealed copies are kept one year after removal, then deleted (called by admin-dispatch).
CREATE OR REPLACE FUNCTION public.purge_removed_conversations()
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE nc int; nm int;
BEGIN
  DELETE FROM public.messages WHERE status = 'removed' AND removed_at < now() - interval '1 year';
  GET DIAGNOSTICS nm = ROW_COUNT;
  DELETE FROM public.conversations WHERE status = 'removed' AND removed_at < now() - interval '1 year';
  GET DIAGNOSTICS nc = ROW_COUNT;
  RETURN jsonb_build_object('conversations', nc, 'messages', nm);
END $$;

-- ---------------------------------------------------------------- admin: people and profiles
CREATE OR REPLACE FUNCTION public.admin_set_restrictions(_uid uuid, _restrictions text[], _reason text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE before text[]; next text[] := ARRAY(SELECT DISTINCT unnest(coalesce(_restrictions, '{}'::text[])) ORDER BY 1);
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'Admin access required'; END IF;
  IF NOT next <@ ARRAY['messaging', 'profile', 'following']::text[] THEN RAISE EXCEPTION 'Invalid restriction'; END IF;
  IF char_length(btrim(coalesce(_reason, ''))) NOT BETWEEN 3 AND 500 THEN RAISE EXCEPTION 'Give a reason (3 to 500 characters)'; END IF;
  SELECT restrictions INTO before FROM public.profiles WHERE user_id = _uid FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Person not found'; END IF;
  UPDATE public.profiles SET restrictions = next WHERE user_id = _uid;
  IF 'following' = ANY (next) THEN DELETE FROM public.follows WHERE follower_id = _uid; END IF;
  PERFORM public.log_admin_action('profile.restrict', 'profiles', _uid::text,
    jsonb_build_object('restrictions', before), jsonb_build_object('restrictions', next, 'reason', btrim(_reason)));
END $$;

CREATE OR REPLACE FUNCTION public.admin_list_profiles(_search text DEFAULT '', _filter text DEFAULT 'all', _limit int DEFAULT 25, _offset int DEFAULT 0, _uid uuid DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE rows jsonb; n bigint; pat text := public.like_pattern(_search);
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'Admin access required'; END IF;
  IF _filter NOT IN ('all', 'public', 'private', 'hidden', 'restricted', 'reported') THEN RAISE EXCEPTION 'Invalid filter'; END IF;
  WITH p AS (
    SELECT p.* FROM public.profiles p
    WHERE (_uid IS NULL OR p.user_id = _uid)
      AND (_filter = 'all' OR (_filter = 'public' AND p.profile_visibility = 'public') OR (_filter = 'private' AND p.profile_visibility = 'private')
           OR (_filter = 'hidden' AND p.profile_hidden) OR (_filter = 'restricted' AND cardinality(p.restrictions) > 0)
           OR (_filter = 'reported' AND EXISTS (SELECT 1 FROM public.content_reports r WHERE r.target_type = 'profile' AND r.target_id = p.user_id AND r.status IN ('open', 'reviewing'))))
      AND (coalesce(btrim(_search), '') = '' OR coalesce(p.username, '') ILIKE pat OR coalesce(p.display_name, '') ILIKE pat
           OR coalesce(p.full_name, '') ILIKE pat OR p.email ILIKE pat))
  SELECT (SELECT count(*) FROM p),
    coalesce((SELECT jsonb_agg(jsonb_build_object(
      'user_id', x.user_id, 'username', x.username, 'display_name', x.display_name, 'full_name', x.full_name, 'email', x.email,
      'avatar_url', x.avatar_url, 'cover_url', x.cover_url, 'bio', x.bio, 'links', x.links, 'visibility', x.profile_visibility,
      'hidden', x.profile_hidden, 'hidden_reason', x.profile_hidden_reason, 'restrictions', to_jsonb(x.restrictions), 'created_at', x.created_at,
      'followers', (SELECT count(*) FROM public.follows f WHERE f.followee_id = x.user_id),
      'following', (SELECT count(*) FROM public.follows f WHERE f.follower_id = x.user_id),
      'open_reports', (SELECT count(*) FROM public.content_reports r WHERE r.target_type = 'profile' AND r.target_id = x.user_id AND r.status IN ('open', 'reviewing')),
      'conversations', (SELECT count(*) FROM public.conversations c WHERE c.supporter_id = x.user_id))
      ORDER BY x.created_at DESC)
      FROM (SELECT * FROM p ORDER BY created_at DESC, user_id LIMIT least(greatest(_limit, 1), 100) OFFSET greatest(_offset, 0)) x), '[]'::jsonb)
  INTO n, rows;
  RETURN jsonb_build_object('rows', rows, 'total', n);
END $$;

CREATE OR REPLACE FUNCTION public.admin_profile_action(_uid uuid, _action text, _reason text DEFAULT NULL)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE p public.profiles;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'Admin access required'; END IF;
  IF _action NOT IN ('hide', 'unhide', 'clear_avatar', 'clear_cover', 'clear_bio', 'clear_links', 'reset_name', 'reset_username', 'make_private') THEN
    RAISE EXCEPTION 'Invalid action';
  END IF;
  IF _action <> 'unhide' AND char_length(btrim(coalesce(_reason, ''))) NOT BETWEEN 3 AND 500 THEN RAISE EXCEPTION 'Give a reason (3 to 500 characters)'; END IF;
  SELECT * INTO p FROM public.profiles WHERE user_id = _uid FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Person not found'; END IF;
  UPDATE public.profiles SET
    profile_hidden = CASE _action WHEN 'hide' THEN true WHEN 'unhide' THEN false ELSE profile_hidden END,
    profile_hidden_reason = CASE _action WHEN 'hide' THEN btrim(_reason) WHEN 'unhide' THEN NULL ELSE profile_hidden_reason END,
    avatar_url = CASE WHEN _action = 'clear_avatar' THEN NULL ELSE avatar_url END,
    cover_url = CASE WHEN _action = 'clear_cover' THEN NULL ELSE cover_url END,
    bio = CASE WHEN _action = 'clear_bio' THEN NULL ELSE bio END,
    links = CASE WHEN _action = 'clear_links' THEN '{}'::jsonb ELSE links END,
    display_name = CASE WHEN _action = 'reset_name' THEN NULL ELSE display_name END,
    username = CASE WHEN _action = 'reset_username' THEN NULL ELSE username END,
    profile_visibility = CASE WHEN _action IN ('reset_username', 'make_private') THEN 'private' ELSE profile_visibility END
  WHERE user_id = _uid;
  PERFORM public.log_admin_action('profile.' || _action, 'profiles', _uid::text,
    jsonb_build_object('username', p.username, 'display_name', p.display_name, 'bio', p.bio, 'avatar_url', p.avatar_url,
                       'cover_url', p.cover_url, 'visibility', p.profile_visibility, 'hidden', p.profile_hidden),
    jsonb_build_object('reason', nullif(btrim(coalesce(_reason, '')), '')));
END $$;

-- ---------------------------------------------------------------- grants
REVOKE ALL ON FUNCTION public.get_profile(text), public.get_profile_supported(text, int, int), public.get_follow_list(text, text, int, int),
  public.search_people(text, int, int), public.suggested_people(int), public.following_feed(int, int), public.my_profile_notifications(int),
  public.mark_profile_notifications_read(), public.my_blocked_people(), public.username_available(text), public.get_fundraiser_team_public(uuid),
  public.get_fundraiser_donor_profiles(uuid), public.fundraiser_card(uuid), public.profile_row(uuid, uuid), public.is_blocked_pair(uuid, uuid),
  public.admin_person(uuid), public.admin_list_conversations(text, text, int, int, uuid), public.admin_conversation_thread(uuid),
  public.admin_remove_conversation(uuid, text), public.admin_restore_conversation(uuid), public.admin_remove_message(uuid, text),
  public.admin_restore_message(uuid), public.purge_removed_conversations(), public.admin_set_restrictions(uuid, text[], text),
  public.admin_list_profiles(text, text, int, int, uuid), public.admin_profile_action(uuid, text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_profile(text), public.get_profile_supported(text, int, int), public.get_follow_list(text, text, int, int),
  public.search_people(text, int, int), public.suggested_people(int), public.get_fundraiser_team_public(uuid),
  public.get_fundraiser_donor_profiles(uuid) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.following_feed(int, int), public.my_profile_notifications(int), public.mark_profile_notifications_read(), public.my_blocked_people(),
  public.username_available(text), public.admin_list_conversations(text, text, int, int, uuid), public.admin_conversation_thread(uuid),
  public.admin_remove_conversation(uuid, text), public.admin_restore_conversation(uuid), public.admin_remove_message(uuid, text),
  public.admin_restore_message(uuid), public.admin_set_restrictions(uuid, text[], text), public.admin_list_profiles(text, text, int, int, uuid),
  public.admin_profile_action(uuid, text, text) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.purge_removed_conversations(), public.fundraiser_card(uuid), public.profile_row(uuid, uuid),
  public.is_blocked_pair(uuid, uuid), public.admin_person(uuid) TO service_role;