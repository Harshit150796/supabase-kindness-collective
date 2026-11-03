-- Admin contact tools (founder request, Nov 2026): see who created each fundraiser, message and email
-- organizers as the CouponDonation team, and a log of every email the site sends.

-- ---------------------------------------------------------------- team threads
-- A fundraiser can have one thread with the CouponDonation team. It is an ordinary conversation of kind
-- 'team' whose "supporter" side is the team inbox id below, so the organizer's inbox, unread dots and
-- realtime work unchanged. Staff write in it only through the admin-contact function; organizers reply
-- through send-message as usual.
CREATE OR REPLACE FUNCTION public.team_inbox_id() RETURNS uuid LANGUAGE sql IMMUTABLE AS $$
  SELECT '00000000-0000-4000-8000-00000000c0de'::uuid
$$;

ALTER TABLE public.conversations ADD COLUMN IF NOT EXISTS kind text NOT NULL DEFAULT 'supporter';
ALTER TABLE public.conversations DROP CONSTRAINT IF EXISTS conversations_kind_check;
ALTER TABLE public.conversations ADD CONSTRAINT conversations_kind_check CHECK (kind IN ('supporter', 'team'));
ALTER TABLE public.conversations DROP CONSTRAINT IF EXISTS conversations_team_inbox_check;
ALTER TABLE public.conversations ADD CONSTRAINT conversations_team_inbox_check
  CHECK ((kind = 'team') = (supporter_id = '00000000-0000-4000-8000-00000000c0de'::uuid));
CREATE UNIQUE INDEX IF NOT EXISTS conversations_one_team_thread ON public.conversations (fundraiser_id) WHERE kind = 'team';

-- The team inbox shows as "CouponDonation team" everywhere admins see people.
CREATE OR REPLACE FUNCTION public.admin_person(_uid uuid)
RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT CASE WHEN _uid IS NULL THEN NULL
    WHEN _uid = public.team_inbox_id() THEN jsonb_build_object('user_id', _uid, 'name', 'CouponDonation team', 'email', 'support@coupondonation.com', 'team', true)
    ELSE coalesce((
    SELECT jsonb_build_object('user_id', p.user_id, 'name', coalesce(nullif(btrim(p.full_name), ''), p.display_name), 'email', p.email,
                              'username', p.username, 'restrictions', to_jsonb(p.restrictions))
    FROM public.profiles p WHERE p.user_id = _uid), jsonb_build_object('user_id', _uid)) END
$$;

CREATE OR REPLACE FUNCTION public.admin_list_conversations(_search text DEFAULT '', _status text DEFAULT 'all', _limit int DEFAULT 25, _offset int DEFAULT 0, _user uuid DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE rows jsonb; n bigint; pat text := public.like_pattern(_search);
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'Admin access required'; END IF;
  IF _status NOT IN ('all', 'open', 'blocked', 'removed', 'flagged', 'team') THEN RAISE EXCEPTION 'Invalid status'; END IF;
  WITH c AS (
    SELECT c.*, f.title AS fundraiser_title, f.unique_slug, f.user_id AS organizer_id,
           sp.full_name AS s_name, sp.email AS s_email, op.full_name AS o_name, op.email AS o_email
    FROM public.conversations c
    JOIN public.fundraisers f ON f.id = c.fundraiser_id
    LEFT JOIN public.profiles sp ON sp.user_id = c.supporter_id
    LEFT JOIN public.profiles op ON op.user_id = f.user_id
    WHERE (_status = 'all' OR c.status = _status OR (_status = 'team' AND c.kind = 'team')
           OR (_status = 'flagged' AND EXISTS (SELECT 1 FROM public.messages m WHERE m.conversation_id = c.id AND m.status = 'redacted')))
      AND (_user IS NULL OR c.supporter_id = _user OR f.user_id = _user
           OR EXISTS (SELECT 1 FROM public.fundraiser_team t WHERE t.fundraiser_id = f.id AND t.user_id = _user AND t.status = 'accepted'))
      AND (coalesce(btrim(_search), '') = ''
           OR f.title ILIKE pat OR coalesce(sp.full_name, '') ILIKE pat OR coalesce(sp.email, '') ILIKE pat
           OR coalesce(op.full_name, '') ILIKE pat OR coalesce(op.email, '') ILIKE pat OR coalesce(sp.username, '') ILIKE pat))
  SELECT (SELECT count(*) FROM c),
    coalesce((SELECT jsonb_agg(jsonb_build_object(
      'id', x.id, 'kind', x.kind, 'status', x.status, 'created_at', x.created_at, 'last_message_at', x.last_message_at,
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
    'side', CASE WHEN c.kind = 'team' AND NOT public.is_fundraiser_team(c.fundraiser_id, m.sender_id) THEN 'team'
                 WHEN m.sender_id = c.supporter_id THEN 'supporter' WHEN m.sender_id = f.user_id THEN 'organizer' ELSE 'co-organizer' END,
    'body', m.body, 'status', m.status, 'flags', to_jsonb(m.flags), 'created_at', m.created_at,
    'removed_at', m.removed_at, 'removed_reason', m.removed_reason, 'ref_label', m.ref_label) ORDER BY m.created_at), '[]'::jsonb)
  INTO msgs FROM public.messages m WHERE m.conversation_id = _cid;
  RETURN jsonb_build_object(
    'id', c.id, 'kind', c.kind, 'status', c.status, 'created_at', c.created_at, 'removed_at', c.removed_at, 'removed_reason', c.removed_reason,
    'fundraiser', jsonb_build_object('id', f.id, 'title', f.title, 'unique_slug', f.unique_slug),
    'supporter', public.admin_person(c.supporter_id), 'organizer', public.admin_person(f.user_id),
    'messages', msgs);
END $$;

-- ---------------------------------------------------------------- email log
-- Every email the site sends through Resend, copied from Resend's own log by admin-dispatch every few
-- minutes (with its delivery status), plus the messages the team writes from the admin portal (which
-- also keep their text). No other email body is stored, so codes and sign-in links never land here.
CREATE TABLE IF NOT EXISTS public.email_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  resend_id text UNIQUE,
  to_email text NOT NULL,
  to_user_id uuid,
  from_email text,
  subject text,
  category text NOT NULL DEFAULT 'site' CHECK (category IN ('site', 'team', 'outreach')),
  last_event text,
  sent_at timestamptz NOT NULL DEFAULT now(),
  fundraiser_id uuid REFERENCES public.fundraisers(id) ON DELETE SET NULL,
  conversation_id uuid,
  sent_by uuid,
  body text,
  updated_at timestamptz NOT NULL DEFAULT now()
);
REVOKE ALL ON public.email_log FROM anon, authenticated;
GRANT ALL ON public.email_log TO service_role;
ALTER TABLE public.email_log ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS email_log_sent_idx ON public.email_log (sent_at DESC);
CREATE INDEX IF NOT EXISTS email_log_to_idx ON public.email_log (lower(to_email), sent_at DESC);
CREATE INDEX IF NOT EXISTS email_log_user_idx ON public.email_log (to_user_id, sent_at DESC);
CREATE INDEX IF NOT EXISTS email_log_fundraiser_idx ON public.email_log (fundraiser_id, sent_at DESC);

CREATE TABLE IF NOT EXISTS public.email_log_sync (
  id int PRIMARY KEY CHECK (id = 1),
  backfill_after text,
  backfill_done boolean NOT NULL DEFAULT false,
  last_run_at timestamptz,
  last_error text
);
REVOKE ALL ON public.email_log_sync FROM anon, authenticated;
GRANT ALL ON public.email_log_sync TO service_role;
ALTER TABLE public.email_log_sync ENABLE ROW LEVEL SECURITY;
INSERT INTO public.email_log_sync (id) VALUES (1) ON CONFLICT DO NOTHING;

-- Rows as Resend lists them: {id, to, from, subject, last_event, created_at}. New rows are added; known
-- rows only get their delivery status refreshed (team-written rows keep their fundraiser and text).
CREATE OR REPLACE FUNCTION public.email_log_upsert(_rows jsonb)
RETURNS int LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE n int;
BEGIN
  WITH r AS (
    SELECT DISTINCT ON (x->>'id') x->>'id' AS rid, lower(btrim(x->>'to')) AS to_email, nullif(btrim(x->>'from'), '') AS from_email,
           left(x->>'subject', 300) AS subject, nullif(x->>'last_event', '') AS last_event,
           coalesce((x->>'created_at')::timestamptz, now()) AS sent_at
    FROM jsonb_array_elements(coalesce(_rows, '[]'::jsonb)) x
    WHERE coalesce(x->>'id', '') <> '' AND coalesce(btrim(x->>'to'), '') <> ''),
  up AS (
    INSERT INTO public.email_log (resend_id, to_email, to_user_id, from_email, subject, category, last_event, sent_at)
    SELECT r.rid, r.to_email, (SELECT p.user_id FROM public.profiles p WHERE lower(btrim(p.email)) = r.to_email LIMIT 1),
           r.from_email, r.subject, CASE WHEN coalesce(r.from_email, '') ILIKE '%@outreach.%' THEN 'outreach' ELSE 'site' END,
           r.last_event, r.sent_at
    FROM r
    ON CONFLICT (resend_id) DO UPDATE SET last_event = EXCLUDED.last_event, updated_at = now()
      WHERE public.email_log.last_event IS DISTINCT FROM EXCLUDED.last_event
    RETURNING 1)
  SELECT count(*) INTO n FROM up;
  RETURN n;
END $$;

-- What the admin portal reads. Staff and admins; viewers can't see people's addresses.
CREATE OR REPLACE FUNCTION public.admin_email_log(_search text DEFAULT '', _category text DEFAULT 'all', _status text DEFAULT 'all',
  _user uuid DEFAULT NULL, _fundraiser uuid DEFAULT NULL, _limit int DEFAULT 25, _offset int DEFAULT 0)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE rows jsonb; n bigint; pat text := public.like_pattern(_search); people uuid[]; owner_email text;
BEGIN
  IF NOT public.is_admin_staff(auth.uid()) THEN RAISE EXCEPTION 'Staff access required'; END IF;
  IF _category NOT IN ('all', 'site', 'team', 'outreach', 'not_outreach') THEN RAISE EXCEPTION 'Invalid category'; END IF;
  IF _status NOT IN ('all', 'delivered', 'opened', 'problem', 'pending') THEN RAISE EXCEPTION 'Invalid status'; END IF;
  IF _fundraiser IS NOT NULL THEN
    SELECT array_agg(DISTINCT u) INTO people FROM (
      SELECT f.user_id u FROM public.fundraisers f WHERE f.id = _fundraiser
      UNION SELECT t.user_id FROM public.fundraiser_team t WHERE t.fundraiser_id = _fundraiser AND t.status = 'accepted' AND t.user_id IS NOT NULL) x;
    SELECT lower(btrim(p.email)) INTO owner_email FROM public.fundraisers f JOIN public.profiles p ON p.user_id = f.user_id WHERE f.id = _fundraiser;
  END IF;
  WITH e AS (
    SELECT e.* FROM public.email_log e
    WHERE (_category = 'all' OR e.category = _category OR (_category = 'not_outreach' AND e.category <> 'outreach'))
      AND (_status = 'all'
           OR (_status = 'delivered' AND e.last_event IN ('delivered', 'opened', 'clicked'))
           OR (_status = 'opened' AND e.last_event IN ('opened', 'clicked'))
           OR (_status = 'problem' AND e.last_event IN ('bounced', 'complained', 'suppressed', 'failed', 'canceled'))
           OR (_status = 'pending' AND (e.last_event IS NULL OR e.last_event IN ('queued', 'scheduled', 'sent', 'delivery_delayed'))))
      AND (_user IS NULL OR e.to_user_id = _user)
      AND (_fundraiser IS NULL OR e.fundraiser_id = _fundraiser OR e.to_user_id = ANY (people) OR lower(e.to_email) = owner_email)
      AND (coalesce(btrim(_search), '') = '' OR e.to_email ILIKE pat OR coalesce(e.subject, '') ILIKE pat OR coalesce(e.from_email, '') ILIKE pat))
  SELECT (SELECT count(*) FROM e),
    coalesce((SELECT jsonb_agg(jsonb_build_object(
        'id', x.id, 'sent_at', x.sent_at, 'to_email', x.to_email, 'to', public.admin_person(x.to_user_id), 'from_email', x.from_email,
        'subject', x.subject, 'category', x.category, 'last_event', x.last_event,
        'fundraiser', CASE WHEN x.fundraiser_id IS NOT NULL THEN (SELECT jsonb_build_object('id', f.id, 'title', f.title) FROM public.fundraisers f WHERE f.id = x.fundraiser_id) END,
        'sent_by', public.admin_person(x.sent_by), 'body', x.body) ORDER BY x.sent_at DESC)
      FROM (SELECT * FROM e ORDER BY sent_at DESC, id LIMIT least(greatest(_limit, 1), 100) OFFSET greatest(_offset, 0)) x), '[]'::jsonb)
  INTO n, rows;
  RETURN jsonb_build_object('rows', rows, 'total', n,
    'synced_at', (SELECT last_run_at FROM public.email_log_sync WHERE id = 1),
    'history_complete', (SELECT backfill_done FROM public.email_log_sync WHERE id = 1),
    'oldest', (SELECT min(sent_at) FROM public.email_log));
END $$;

-- ---------------------------------------------------------------- one fundraiser's organizer
CREATE OR REPLACE FUNCTION public.admin_fundraiser_contact(_fid uuid)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE f public.fundraisers; p public.profiles; u record; thread uuid;
BEGIN
  IF NOT public.is_admin_staff(auth.uid()) THEN RAISE EXCEPTION 'Staff access required'; END IF;
  SELECT * INTO f FROM public.fundraisers WHERE id = _fid;
  IF NOT FOUND THEN RAISE EXCEPTION 'Fundraiser not found'; END IF;
  SELECT * INTO p FROM public.profiles WHERE user_id = f.user_id;
  SELECT au.created_at, au.last_sign_in_at, au.email_confirmed_at INTO u FROM auth.users au WHERE au.id = f.user_id;
  SELECT c.id INTO thread FROM public.conversations c WHERE c.fundraiser_id = _fid AND c.kind = 'team';
  RETURN jsonb_build_object(
    'organizer', jsonb_build_object('user_id', f.user_id, 'name', coalesce(nullif(btrim(p.full_name), ''), p.display_name), 'email', p.email,
      'phone', nullif(btrim(coalesce(p.phone, '')), ''), 'city', p.city, 'country', p.country, 'username', p.username,
      'joined', coalesce(u.created_at, p.created_at), 'last_sign_in_at', u.last_sign_in_at, 'email_confirmed', u.email_confirmed_at IS NOT NULL,
      'restrictions', to_jsonb(coalesce(p.restrictions, '{}'::text[])),
      'fundraisers', (SELECT count(*) FROM public.fundraisers x WHERE x.user_id = f.user_id),
      'suppressed', EXISTS (SELECT 1 FROM public.email_suppressions s WHERE s.email = lower(btrim(coalesce(p.email, ''))))),
    'team', coalesce((SELECT jsonb_agg(jsonb_build_object('role', t.role, 'status', t.status, 'name', coalesce(nullif(btrim(q.full_name), ''), q.display_name),
        'email', coalesce(q.email, t.invite_email)) ORDER BY t.created_at)
      FROM public.fundraiser_team t LEFT JOIN public.profiles q ON q.user_id = t.user_id
      WHERE t.fundraiser_id = _fid AND t.user_id IS DISTINCT FROM f.user_id), '[]'::jsonb),
    'thread_id', thread,
    'messages', coalesce((SELECT jsonb_agg(jsonb_build_object('id', m.id, 'body', m.body, 'created_at', m.created_at, 'status', m.status,
        'from_team', NOT public.is_fundraiser_team(_fid, m.sender_id), 'sender', public.admin_person(m.sender_id)) ORDER BY m.created_at)
      FROM public.messages m WHERE m.conversation_id = thread), '[]'::jsonb));
END $$;

-- ---------------------------------------------------------------- grants
REVOKE ALL ON FUNCTION public.email_log_upsert(jsonb), public.admin_email_log(text, text, text, uuid, uuid, int, int),
  public.admin_fundraiser_contact(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.team_inbox_id() TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.email_log_upsert(jsonb) TO service_role;
GRANT EXECUTE ON FUNCTION public.admin_email_log(text, text, text, uuid, uuid, int, int), public.admin_fundraiser_contact(uuid) TO authenticated, service_role;