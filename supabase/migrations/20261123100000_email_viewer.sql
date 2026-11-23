-- Admin > Emails shows every email as it was sent, and only says "not opened" when opens are tracked
-- (founder request, Nov 23, 2026).
--  1. email_log keeps a copy of each email's text (content_html, content_text, reply_to), fetched from Resend by
--     admin-dispatch (Resend keeps an email for about 30 days) or when someone opens it in Admin > Emails.
--     Sign-in codes and one-time links are replaced with "[hidden]" before the copy is saved
--     (_shared/email-redact.ts), so they are still never stored. Read only through admin-contact "email_view"
--     (staff, audited as email.view); browsers still can't read the table.
--  2. Open tracking: Resend's setting for coupondonation.com is read on every sync (email_log_sync.open_tracking).
--     Each email records whether opens were tracked when it went out (opens_tracked). It was switched off in
--     Resend around Nov 20-21, 2026, so emails since then had been shown as "Delivered, not opened" although
--     nobody could know. Plain-text emails (no HTML) can't be tracked either.
--  3. The new sign-in code subject ("Your CouponDonation code") is filed under Sign-in and account.

ALTER TABLE public.email_log
  ADD COLUMN IF NOT EXISTS content_html text,
  ADD COLUMN IF NOT EXISTS content_text text,
  ADD COLUMN IF NOT EXISTS reply_to text,
  ADD COLUMN IF NOT EXISTS content_state text CHECK (content_state IN ('saved', 'gone')),
  ADD COLUMN IF NOT EXISTS content_saved_at timestamptz,
  ADD COLUMN IF NOT EXISTS opens_tracked boolean;
CREATE INDEX IF NOT EXISTS email_log_content_todo_idx ON public.email_log (sent_at DESC) WHERE content_state IS NULL AND resend_id IS NOT NULL;

ALTER TABLE public.email_log_sync
  ADD COLUMN IF NOT EXISTS open_tracking boolean,
  ADD COLUMN IF NOT EXISTS open_tracking_checked_at timestamptz;

-- Opens were tracked for site emails from Nov 4, 2026 (16:40 UTC) until the switch went off. An email that was
-- opened proves tracking was on when it went out, so everything up to the last opened site email counts as
-- tracked; later emails count as not tracked (nobody can tell whether they were opened). Church outreach
-- (outreach.coupondonation.com) never had open tracking.
UPDATE public.email_log e SET opens_tracked = (
    e.category <> 'outreach'
    AND e.sent_at >= '2026-11-04T16:40:00Z'
    AND e.sent_at <= coalesce((SELECT max(x.sent_at) FROM public.email_log x WHERE x.opened_at IS NOT NULL AND x.category <> 'outreach'), '2026-11-04T16:40:00Z'))
  WHERE e.opens_tracked IS NULL;

-- New rows (from the Resend sync or written by the team) take the current setting.
CREATE OR REPLACE FUNCTION public.trg_email_log_topic() RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  NEW.topic := coalesce(NEW.topic, public.email_topic(NEW.subject, NEW.category));
  NEW.opens_tracked := coalesce(NEW.opens_tracked,
    NEW.category <> 'outreach' AND coalesce((SELECT s.open_tracking FROM public.email_log_sync s WHERE s.id = 1), false));
  RETURN NEW;
END $$;

CREATE OR REPLACE FUNCTION public.email_topic(_subject text, _category text)
RETURNS text LANGUAGE sql IMMUTABLE SET search_path = public AS $$
  SELECT CASE
    WHEN _category = 'outreach' THEN 'outreach'
    WHEN _category = 'team' THEN 'team'
    WHEN s ~* '(needs review|account activity|replied to the couponDonation team|^new message:|paused|call list|partner inquiry)' THEN 'alerts'
    WHEN s ~* '(verification code|your coupondonation code|reset your|password|confirm you want to stop|sign in|welcome to coupondonation)' THEN 'account'
    WHEN s ~* '(you.re live|isn.t live right now|one text can start it|gifts? just came in|new gifts came in|your first week|you.re halfway|you reached your goal|a short update brings)' THEN 'fundraiser'
    WHEN s ~* '(a donation arrived for your fundraiser|quick note about your fundraiser|did you use|coupon is ready|card is ready|cards are ready|card work\?)' THEN 'family'
    WHEN s ~* '(donation is confirmed|your gift|your donation|monthly gift|receipt|thank you for|we received your gift)' THEN 'donor'
    WHEN s ~* '(your fundraiser is live|update about your fundraiser|invited to help|invited to co-organize|still want to help run|fundraiser invitation|posted an update)' THEN 'fundraiser'
    WHEN s ~* '(message is waiting|message from the coupondonation team|new message about|we received your message|we got your message)' THEN 'messages'
    ELSE 'other' END
  FROM (SELECT coalesce(_subject, '') AS s) x
$$;
UPDATE public.email_log SET topic = public.email_topic(subject, category) WHERE topic = 'other';

-- The list: "not opened" only where opens were tracked, an open rate over tracked emails only, the current
-- tracking setting, and which emails have their text saved. Same arguments as 20261104170300.
CREATE OR REPLACE FUNCTION public.admin_email_log(_search text DEFAULT '', _category text DEFAULT 'all', _status text DEFAULT 'all',
  _user uuid DEFAULT NULL, _fundraiser uuid DEFAULT NULL, _limit int DEFAULT 25, _offset int DEFAULT 0, _topic text DEFAULT 'all', _days int DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE rows jsonb; n bigint; totals jsonb; pat text := public.like_pattern(_search); people uuid[]; owner_email text;
BEGIN
  IF NOT public.is_admin_staff(auth.uid()) THEN RAISE EXCEPTION 'Staff access required'; END IF;
  IF _category NOT IN ('all', 'site', 'team', 'outreach', 'not_outreach') THEN RAISE EXCEPTION 'Invalid category'; END IF;
  IF _status NOT IN ('all', 'delivered', 'opened', 'not_opened', 'problem', 'pending') THEN RAISE EXCEPTION 'Invalid status'; END IF;
  IF _topic NOT IN ('all', 'account', 'donor', 'family', 'fundraiser', 'messages', 'team', 'alerts', 'outreach', 'other') THEN RAISE EXCEPTION 'Invalid topic'; END IF;
  IF _fundraiser IS NOT NULL THEN
    SELECT array_agg(DISTINCT u) INTO people FROM (
      SELECT f.user_id u FROM public.fundraisers f WHERE f.id = _fundraiser
      UNION SELECT t.user_id FROM public.fundraiser_team t WHERE t.fundraiser_id = _fundraiser AND t.status = 'accepted' AND t.user_id IS NOT NULL) x;
    SELECT lower(btrim(p.email)) INTO owner_email FROM public.fundraisers f JOIN public.profiles p ON p.user_id = f.user_id WHERE f.id = _fundraiser;
  END IF;
  WITH e AS (
    SELECT e.* FROM public.email_log e
    WHERE (_category = 'all' OR e.category = _category OR (_category = 'not_outreach' AND e.category <> 'outreach'))
      AND (_topic = 'all' OR e.topic = _topic)
      AND (_days IS NULL OR e.sent_at >= now() - make_interval(days => greatest(_days, 1)))
      AND (_user IS NULL OR e.to_user_id = _user)
      AND (_fundraiser IS NULL OR e.fundraiser_id = _fundraiser OR e.to_user_id = ANY (people) OR lower(e.to_email) = owner_email)
      AND (coalesce(btrim(_search), '') = '' OR e.to_email ILIKE pat OR coalesce(e.subject, '') ILIKE pat OR coalesce(e.from_email, '') ILIKE pat)),
  s AS (
    SELECT * FROM e WHERE _status = 'all'
       OR (_status = 'delivered' AND e.last_event IN ('delivered', 'opened', 'clicked'))
       OR (_status = 'opened' AND e.last_event IN ('opened', 'clicked'))
       OR (_status = 'not_opened' AND e.last_event = 'delivered' AND coalesce(e.opens_tracked, false))
       OR (_status = 'problem' AND e.last_event IN ('bounced', 'complained', 'suppressed', 'failed', 'canceled'))
       OR (_status = 'pending' AND (e.last_event IS NULL OR e.last_event IN ('queued', 'scheduled', 'sent', 'delivery_delayed'))))
  SELECT (SELECT count(*) FROM s),
    jsonb_build_object(
      'sent', (SELECT count(*) FROM e),
      'delivered', (SELECT count(*) FROM e WHERE last_event IN ('delivered', 'opened', 'clicked')),
      'opened', (SELECT count(*) FROM e WHERE last_event IN ('opened', 'clicked')),
      'tracked', (SELECT count(*) FROM e WHERE last_event IN ('delivered', 'opened', 'clicked') AND coalesce(opens_tracked, false)),
      'problem', (SELECT count(*) FROM e WHERE last_event IN ('bounced', 'complained', 'suppressed', 'failed', 'canceled'))),
    coalesce((SELECT jsonb_agg(jsonb_build_object(
        'id', x.id, 'sent_at', x.sent_at, 'to_email', x.to_email, 'to', public.admin_person(x.to_user_id), 'from_email', x.from_email,
        'subject', x.subject, 'category', x.category, 'topic', x.topic, 'last_event', x.last_event,
        'delivered_at', x.delivered_at, 'opened_at', x.opened_at, 'clicked_at', x.clicked_at, 'problem_at', x.problem_at,
        'opens_tracked', coalesce(x.opens_tracked, false), 'has_content', (x.content_state = 'saved' OR x.body IS NOT NULL),
        'fundraiser', CASE WHEN x.fundraiser_id IS NOT NULL THEN (SELECT jsonb_build_object('id', f.id, 'title', f.title) FROM public.fundraisers f WHERE f.id = x.fundraiser_id) END,
        'sent_by', public.admin_person(x.sent_by), 'body', x.body) ORDER BY x.sent_at DESC)
      FROM (SELECT * FROM s ORDER BY sent_at DESC, id LIMIT least(greatest(_limit, 1), 100) OFFSET greatest(_offset, 0)) x), '[]'::jsonb)
  INTO n, totals, rows;
  RETURN jsonb_build_object('rows', rows, 'total', n, 'totals', totals,
    'synced_at', (SELECT last_run_at FROM public.email_log_sync WHERE id = 1),
    'history_complete', (SELECT backfill_done FROM public.email_log_sync WHERE id = 1),
    'oldest', (SELECT min(sent_at) FROM public.email_log),
    'opens_since', (SELECT min(opened_at) FROM public.email_log WHERE category <> 'outreach'),
    'open_tracking', (SELECT open_tracking FROM public.email_log_sync WHERE id = 1),
    'open_tracking_checked_at', (SELECT open_tracking_checked_at FROM public.email_log_sync WHERE id = 1));
END $$;
REVOKE ALL ON FUNCTION public.admin_email_log(text, text, text, uuid, uuid, int, int, text, int) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_email_log(text, text, text, uuid, uuid, int, int, text, int) TO authenticated, service_role;
