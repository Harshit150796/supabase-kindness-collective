-- Admin operations update (founder request, Nov 2026): email opens and a timeline per email, topics to
-- organize the log, coupon follow-ups that also cover company/outside coupons, and a search that covers
-- everything in operations (plus whitelisted numbers for the AI "Ask" box).

-- ---------------------------------------------------------------- email log: when each status was first seen, and a topic
ALTER TABLE public.email_log
  ADD COLUMN IF NOT EXISTS delivered_at timestamptz,
  ADD COLUMN IF NOT EXISTS opened_at timestamptz,
  ADD COLUMN IF NOT EXISTS clicked_at timestamptz,
  ADD COLUMN IF NOT EXISTS problem_at timestamptz,
  ADD COLUMN IF NOT EXISTS topic text;

-- What an email is about, from its subject (the site's subjects are fixed in code).
CREATE OR REPLACE FUNCTION public.email_topic(_subject text, _category text)
RETURNS text LANGUAGE sql IMMUTABLE SET search_path = public AS $$
  SELECT CASE
    WHEN _category = 'outreach' THEN 'outreach'
    WHEN _category = 'team' THEN 'team'
    WHEN s ~* '(needs review|account activity|replied to the couponDonation team|^new message:|paused|call list|partner inquiry)' THEN 'alerts'
    WHEN s ~* '(verification code|reset your|password|confirm you want to stop|sign in|welcome to coupondonation)' THEN 'account'
    WHEN s ~* '(a donation arrived for your fundraiser|quick note about your fundraiser|did you use|coupon is ready|card is ready)' THEN 'family'
    WHEN s ~* '(donation is confirmed|your gift|your donation|monthly gift|receipt|thank you for)' THEN 'donor'
    WHEN s ~* '(your fundraiser is live|update about your fundraiser|invited to help|fundraiser invitation|posted an update)' THEN 'fundraiser'
    WHEN s ~* '(message is waiting|message from the coupondonation team|we received your message)' THEN 'messages'
    ELSE 'other' END
  FROM (SELECT coalesce(_subject, '') AS s) x
$$;

UPDATE public.email_log SET topic = public.email_topic(subject, category) WHERE topic IS NULL;
UPDATE public.email_log SET delivered_at = sent_at WHERE delivered_at IS NULL AND last_event IN ('delivered', 'opened', 'clicked');
UPDATE public.email_log SET problem_at = sent_at WHERE problem_at IS NULL AND last_event IN ('bounced', 'complained', 'suppressed', 'failed');
CREATE INDEX IF NOT EXISTS email_log_topic_idx ON public.email_log (topic, sent_at DESC);
CREATE INDEX IF NOT EXISTS email_log_resend_idx ON public.email_log (resend_id);

-- Rows as Resend lists them. A status seen for the first time records when we saw it (opens and clicks
-- within the 5-minute sync; Resend's list doesn't give event times).
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
    INSERT INTO public.email_log (resend_id, to_email, to_user_id, from_email, subject, category, topic, last_event, sent_at, delivered_at, opened_at, clicked_at, problem_at)
    SELECT r.rid, r.to_email, (SELECT p.user_id FROM public.profiles p WHERE lower(btrim(p.email)) = r.to_email LIMIT 1),
           r.from_email, r.subject, cat, public.email_topic(r.subject, cat), r.last_event, r.sent_at,
           CASE WHEN r.last_event IN ('delivered', 'opened', 'clicked') THEN r.sent_at END,
           CASE WHEN r.last_event IN ('opened', 'clicked') THEN now() END,
           CASE WHEN r.last_event = 'clicked' THEN now() END,
           CASE WHEN r.last_event IN ('bounced', 'complained', 'suppressed', 'failed') THEN now() END
    FROM r, LATERAL (SELECT CASE WHEN coalesce(r.from_email, '') ILIKE '%@outreach.%' THEN 'outreach' ELSE 'site' END AS cat) c
    ON CONFLICT (resend_id) DO UPDATE SET last_event = EXCLUDED.last_event, updated_at = now(),
      delivered_at = coalesce(public.email_log.delivered_at, CASE WHEN EXCLUDED.last_event IN ('delivered', 'opened', 'clicked') THEN now() END),
      opened_at = coalesce(public.email_log.opened_at, CASE WHEN EXCLUDED.last_event IN ('opened', 'clicked') THEN now() END),
      clicked_at = coalesce(public.email_log.clicked_at, CASE WHEN EXCLUDED.last_event = 'clicked' THEN now() END),
      problem_at = coalesce(public.email_log.problem_at, CASE WHEN EXCLUDED.last_event IN ('bounced', 'complained', 'suppressed', 'failed') THEN now() END)
      WHERE public.email_log.last_event IS DISTINCT FROM EXCLUDED.last_event
    RETURNING 1)
  SELECT count(*) INTO n FROM up;
  RETURN n;
END $$;

-- Team-written rows get their topic too.
CREATE OR REPLACE FUNCTION public.trg_email_log_topic() RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.topic := coalesce(NEW.topic, public.email_topic(NEW.subject, NEW.category)); RETURN NEW; END $$;
DROP TRIGGER IF EXISTS email_log_topic ON public.email_log;
CREATE TRIGGER email_log_topic BEFORE INSERT ON public.email_log FOR EACH ROW EXECUTE FUNCTION public.trg_email_log_topic();

DROP FUNCTION IF EXISTS public.admin_email_log(text, text, text, uuid, uuid, int, int);
CREATE FUNCTION public.admin_email_log(_search text DEFAULT '', _category text DEFAULT 'all', _status text DEFAULT 'all',
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
       OR (_status = 'not_opened' AND e.last_event = 'delivered')
       OR (_status = 'problem' AND e.last_event IN ('bounced', 'complained', 'suppressed', 'failed', 'canceled'))
       OR (_status = 'pending' AND (e.last_event IS NULL OR e.last_event IN ('queued', 'scheduled', 'sent', 'delivery_delayed'))))
  SELECT (SELECT count(*) FROM s),
    jsonb_build_object(
      'sent', (SELECT count(*) FROM e),
      'delivered', (SELECT count(*) FROM e WHERE last_event IN ('delivered', 'opened', 'clicked')),
      'opened', (SELECT count(*) FROM e WHERE last_event IN ('opened', 'clicked')),
      'problem', (SELECT count(*) FROM e WHERE last_event IN ('bounced', 'complained', 'suppressed', 'failed', 'canceled'))),
    coalesce((SELECT jsonb_agg(jsonb_build_object(
        'id', x.id, 'sent_at', x.sent_at, 'to_email', x.to_email, 'to', public.admin_person(x.to_user_id), 'from_email', x.from_email,
        'subject', x.subject, 'category', x.category, 'topic', x.topic, 'last_event', x.last_event,
        'delivered_at', x.delivered_at, 'opened_at', x.opened_at, 'clicked_at', x.clicked_at, 'problem_at', x.problem_at,
        'fundraiser', CASE WHEN x.fundraiser_id IS NOT NULL THEN (SELECT jsonb_build_object('id', f.id, 'title', f.title) FROM public.fundraisers f WHERE f.id = x.fundraiser_id) END,
        'sent_by', public.admin_person(x.sent_by), 'body', x.body) ORDER BY x.sent_at DESC)
      FROM (SELECT * FROM s ORDER BY sent_at DESC, id LIMIT least(greatest(_limit, 1), 100) OFFSET greatest(_offset, 0)) x), '[]'::jsonb)
  INTO n, totals, rows;
  RETURN jsonb_build_object('rows', rows, 'total', n, 'totals', totals,
    'synced_at', (SELECT last_run_at FROM public.email_log_sync WHERE id = 1),
    'history_complete', (SELECT backfill_done FROM public.email_log_sync WHERE id = 1),
    'oldest', (SELECT min(sent_at) FROM public.email_log),
    'opens_since', (SELECT min(opened_at) FROM public.email_log WHERE category <> 'outreach'));
END $$;

-- ---------------------------------------------------------------- coupon follow-ups
-- The 7-day "did you use it?" reminder now records its email, and company/outside coupons get the
-- same follow-ups as donation coupons: their donor hears when the family received it and used it.
ALTER TABLE public.coupons ADD COLUMN IF NOT EXISTS reveal_reminder_resend_id text;

CREATE TABLE IF NOT EXISTS public.outside_gift_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id uuid NOT NULL REFERENCES public.coupon_sources(id) ON DELETE CASCADE,
  coupon_id uuid NOT NULL REFERENCES public.coupons(id),
  kind text NOT NULL CHECK (kind IN ('received', 'used')),
  created_at timestamptz NOT NULL DEFAULT now(),
  emailed_at timestamptz,
  resend_id text,
  skipped_reason text,
  last_error text,
  UNIQUE (coupon_id, kind)
);
REVOKE ALL ON public.outside_gift_events FROM anon, authenticated;
GRANT ALL ON public.outside_gift_events TO service_role;
ALTER TABLE public.outside_gift_events ENABLE ROW LEVEL SECURITY;

-- The fundraiser a coupon belongs to, whether it came from a site donation or from outside.
CREATE OR REPLACE FUNCTION public.coupon_fundraiser(_coupon_id uuid)
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT coalesce(
    (SELECT d.fundraiser_id FROM public.coupons c JOIN public.donations d ON d.id = c.donation_id WHERE c.id = _coupon_id),
    (SELECT s.fundraiser_id FROM public.coupons c JOIN public.coupon_sources s ON s.id = c.source_id WHERE c.id = _coupon_id AND c.donation_id IS NULL))
$$;

-- Outside coupons the family revealed or used, still waiting for their follow-up event (impact-dispatch).
CREATE OR REPLACE FUNCTION public.queue_outside_gift_events(_since interval DEFAULT interval '30 days')
RETURNS int LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE n int := 0; k int;
BEGIN
  INSERT INTO public.outside_gift_events (source_id, coupon_id, kind)
  SELECT c.source_id, c.id, 'received' FROM public.coupons c
  WHERE c.donation_id IS NULL AND c.source_id IS NOT NULL AND c.revealed_at IS NOT NULL AND c.revealed_at >= now() - _since
    AND c.status::text NOT IN ('void', 'returned')
  ON CONFLICT (coupon_id, kind) DO NOTHING;
  GET DIAGNOSTICS k = ROW_COUNT; n := n + k;
  INSERT INTO public.outside_gift_events (source_id, coupon_id, kind)
  SELECT c.source_id, c.id, 'used' FROM public.coupons c
  WHERE c.donation_id IS NULL AND c.source_id IS NOT NULL AND c.used_at IS NOT NULL AND c.used_at >= now() - _since
    AND c.status::text NOT IN ('void', 'returned')
  ON CONFLICT (coupon_id, kind) DO NOTHING;
  GET DIAGNOSTICS k = ROW_COUNT; n := n + k;
  RETURN n;
END $$;

CREATE OR REPLACE FUNCTION public.email_status(_resend_id text)
RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT CASE WHEN _resend_id IS NULL THEN NULL ELSE (
    SELECT jsonb_build_object('id', e.id, 'last_event', e.last_event, 'opened_at', e.opened_at, 'to_email', e.to_email, 'subject', e.subject)
    FROM public.email_log e WHERE e.resend_id = _resend_id) END
$$;

-- Every coupon that went to a family, with each step and the email that went with it.
CREATE OR REPLACE FUNCTION public.admin_coupon_followups(_status text DEFAULT 'all', _search text DEFAULT '', _limit int DEFAULT 25, _offset int DEFAULT 0)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE rows jsonb; n bigint; counts jsonb; pat text := public.like_pattern(_search);
BEGIN
  IF NOT public.is_admin_staff(auth.uid()) THEN RAISE EXCEPTION 'Staff access required'; END IF;
  IF _status NOT IN ('all', 'waiting', 'revealed', 'reminder_due', 'used') THEN RAISE EXCEPTION 'Invalid status'; END IF;
  WITH base AS (
    SELECT c.id, coalesce(c.issued_brand, c.store_name) AS brand, c.value, c.created_at, c.revealed_at, c.used_at, c.used_category,
           c.reveal_reminder_sent_at, c.reveal_reminder_resend_id, c.donation_id, c.source_id, public.coupon_fundraiser(c.id) AS fid
    FROM public.coupons c
    WHERE c.has_credential AND c.status::text IN ('claimed', 'reserved', 'redeemed', 'expired')
      AND (c.donation_id IS NOT NULL OR c.source_id IS NOT NULL)),
  b AS (
    SELECT b.*, f.title, f.user_id AS organizer_id,
      CASE WHEN b.used_at IS NOT NULL THEN 'used' WHEN b.revealed_at IS NULL THEN 'waiting'
           WHEN b.reveal_reminder_sent_at IS NULL AND b.revealed_at <= now() - interval '7 days' THEN 'reminder_due' ELSE 'revealed' END AS stage
    FROM base b JOIN public.fundraisers f ON f.id = b.fid AND NOT f.is_example
    WHERE coalesce(btrim(_search), '') = '' OR f.title ILIKE pat OR b.brand ILIKE pat OR b.id::text ILIKE btrim(_search) || '%')
  SELECT (SELECT count(*) FROM b WHERE _status = 'all' OR stage = _status OR (_status = 'revealed' AND stage = 'reminder_due')),
    (SELECT jsonb_object_agg(stage, k) FROM (SELECT stage, count(*) k FROM b GROUP BY stage) z),
    coalesce((SELECT jsonb_agg(jsonb_build_object(
      'id', x.id, 'brand', x.brand, 'value', x.value, 'created_at', x.created_at, 'stage', x.stage,
      'fundraiser', jsonb_build_object('id', x.fid, 'title', x.title), 'organizer', public.admin_person(x.organizer_id),
      'from', CASE WHEN x.donation_id IS NOT NULL THEN (SELECT jsonb_build_object('kind', 'donation', 'name', CASE WHEN d.is_anonymous THEN 'Anonymous' ELSE coalesce(d.donor_name, 'Guest') END, 'email', d.donor_email) FROM public.donations d WHERE d.id = x.donation_id)
                   ELSE (SELECT jsonb_build_object('kind', CASE WHEN s.public_credit = 'company' THEN 'company' ELSE 'outside' END, 'name', coalesce(s.donor_name, s.source_label, 'Outside gift'), 'email', s.donor_email) FROM public.coupon_sources s WHERE s.id = x.source_id) END,
      'organizer_told', (SELECT jsonb_build_object('at', a.sent_at, 'email', public.email_status(a.resend_id), 'error', a.last_error)
                         FROM public.coupon_owner_alerts a WHERE a.coupon_id = x.id ORDER BY a.created_at DESC LIMIT 1),
      'revealed_at', x.revealed_at, 'used_at', x.used_at, 'used_category', x.used_category,
      'donor_told_received', CASE WHEN x.donation_id IS NOT NULL
          THEN (SELECT jsonb_build_object('at', ev.emailed_at, 'skipped', ev.skipped_reason, 'error', ev.last_error, 'email', public.email_status(ev.resend_id)) FROM public.donor_impact_events ev WHERE ev.coupon_id = x.id AND ev.kind = 'received')
          ELSE (SELECT jsonb_build_object('at', ev.emailed_at, 'skipped', ev.skipped_reason, 'error', ev.last_error, 'email', public.email_status(ev.resend_id)) FROM public.outside_gift_events ev WHERE ev.coupon_id = x.id AND ev.kind = 'received') END,
      'donor_told_used', CASE WHEN x.donation_id IS NOT NULL
          THEN (SELECT jsonb_build_object('at', ev.emailed_at, 'skipped', ev.skipped_reason, 'error', ev.last_error, 'email', public.email_status(ev.resend_id)) FROM public.donor_impact_events ev WHERE ev.coupon_id = x.id AND ev.kind = 'used')
          ELSE (SELECT jsonb_build_object('at', ev.emailed_at, 'skipped', ev.skipped_reason, 'error', ev.last_error, 'email', public.email_status(ev.resend_id)) FROM public.outside_gift_events ev WHERE ev.coupon_id = x.id AND ev.kind = 'used') END,
      'reminder', jsonb_build_object('sent_at', x.reveal_reminder_sent_at, 'email', public.email_status(x.reveal_reminder_resend_id),
          'due_at', CASE WHEN x.revealed_at IS NOT NULL AND x.used_at IS NULL AND x.reveal_reminder_sent_at IS NULL THEN x.revealed_at + interval '7 days' END))
      ORDER BY coalesce(x.used_at, x.revealed_at, x.created_at) DESC)
      FROM (SELECT * FROM b WHERE _status = 'all' OR stage = _status OR (_status = 'revealed' AND stage = 'reminder_due')
            ORDER BY coalesce(used_at, revealed_at, created_at) DESC, id LIMIT least(greatest(_limit, 1), 100) OFFSET greatest(_offset, 0)) x), '[]'::jsonb)
  INTO n, counts, rows;
  RETURN jsonb_build_object('rows', rows, 'total', n, 'counts', coalesce(counts, '{}'::jsonb));
END $$;

-- ---------------------------------------------------------------- search everything in operations
CREATE OR REPLACE FUNCTION public.admin_search(_q text) RETURNS TABLE(kind text, id text, label text, sub text, link text)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE q text := btrim(coalesce(_q, '')); pat text; staff boolean; adm boolean; num numeric; digits text; idpre text;
BEGIN
  IF NOT public.is_admin_any(auth.uid()) THEN RAISE EXCEPTION 'Team access required'; END IF;
  IF length(q) < 2 THEN RETURN; END IF;
  pat := public.like_pattern(q);
  staff := public.is_admin_staff(auth.uid());
  adm := public.has_role(auth.uid(), 'admin');
  num := CASE WHEN q ~ '^\$?\d{1,7}(\.\d{1,2})?$' THEN replace(q, '$', '')::numeric END;
  digits := regexp_replace(q, '\D', '', 'g');
  -- Record ids can be found by their first characters (as shown in the portal).
  idpre := CASE WHEN q ~* '^[0-9a-f-]{4,36}$' THEN lower(q) || '%' END;
  RETURN QUERY
  (SELECT 'fundraiser'::text, f.id::text, f.title, initcap(coalesce(f.status, '')) || coalesce(' · ' || nullif(btrim(p.full_name), ''), '') || coalesce(' · ' || p.email, ''),
          '/admin/fundraisers?id=' || f.id
   FROM public.fundraisers f LEFT JOIN public.profiles p ON p.user_id = f.user_id
   WHERE f.title ILIKE pat OR f.unique_slug ILIKE pat OR f.id::text LIKE idpre OR coalesce(f.zip_code, '') = q OR coalesce(f.city, '') ILIKE pat
      OR coalesce(p.email, '') ILIKE pat OR coalesce(p.full_name, '') ILIKE pat
   ORDER BY (f.title ILIKE q || '%') DESC, f.created_at DESC LIMIT 6)
  UNION ALL
  (SELECT 'person', p.user_id::text, coalesce(nullif(btrim(p.full_name), ''), p.email, 'Account'), concat_ws(' · ', p.email, nullif(btrim(coalesce(p.phone, '')), ''), CASE WHEN p.username IS NOT NULL THEN '@' || p.username END),
          '/admin/users?q=' || coalesce(p.email, p.user_id::text)
   FROM public.profiles p
   WHERE coalesce(p.email, '') ILIKE pat OR coalesce(p.full_name, '') ILIKE pat OR coalesce(p.username, '') ILIKE pat OR p.user_id::text LIKE idpre
      OR (length(digits) >= 6 AND regexp_replace(coalesce(p.phone, ''), '\D', '', 'g') LIKE '%' || digits || '%')
   ORDER BY p.created_at DESC LIMIT 6)
  UNION ALL
  (SELECT 'donation', d.id::text, '$' || d.amount || ' · ' || CASE WHEN d.is_anonymous THEN coalesce(d.donor_name, 'Guest') || ' (anonymous)' ELSE coalesce(d.donor_name, 'Guest') END,
          d.status || ' · ' || to_char(d.created_at AT TIME ZONE 'America/New_York', 'Mon DD, YYYY'), '/admin/donations?id=' || d.id
   FROM public.donations d
   WHERE coalesce(d.donor_name, '') ILIKE pat OR coalesce(d.donor_email, '') ILIKE pat OR d.id::text LIKE idpre OR (num IS NOT NULL AND d.amount = num)
   ORDER BY d.created_at DESC LIMIT 6)
  UNION ALL
  (SELECT 'coupon', c.id::text, coalesce(c.issued_brand, c.store_name, 'Coupon') || ' $' || coalesce(c.value, 0) || ' · ' || f.title,
          c.status::text || CASE WHEN c.used_at IS NOT NULL THEN ' · used' WHEN c.revealed_at IS NOT NULL THEN ' · revealed' ELSE '' END,
          '/admin/fundraisers?id=' || f.id || '&tab=coupons'
   FROM public.coupons c JOIN public.fundraisers f ON f.id = public.coupon_fundraiser(c.id)
   WHERE c.status::text <> 'void' AND (c.id::text LIKE idpre OR coalesce(c.issued_brand, c.store_name, '') ILIKE pat)
   ORDER BY c.created_at DESC LIMIT 5)
  UNION ALL
  (SELECT 'donated card', cd.id::text, coalesce(cd.store_name, 'Card') || coalesce(' $' || cd.value, '') || ' · ' || coalesce(cd.donor_name, cd.donor_email, 'Donor'), cd.status,
          '/admin/card-donations?id=' || cd.id
   FROM public.card_donations cd
   WHERE coalesce(cd.store_name, '') ILIKE pat OR coalesce(cd.donor_email, '') ILIKE pat OR coalesce(cd.donor_name, '') ILIKE pat OR cd.id::text LIKE idpre
   ORDER BY cd.created_at DESC LIMIT 5)
  UNION ALL
  (SELECT 'monthly gift', r.id::text, '$' || round(coalesce(r.gift_cents, 0) / 100.0, 2) || '/month · ' || coalesce(r.donor_email, 'Donor'), r.status,
          '/admin/monthly?q=' || coalesce(r.donor_email, r.id::text)
   FROM public.recurring_donations r
   WHERE coalesce(r.donor_email, '') ILIKE pat OR r.id::text LIKE idpre OR coalesce(r.brand_name, '') ILIKE pat
   ORDER BY r.created_at DESC LIMIT 4)
  UNION ALL
  (SELECT 'email', e.id::text, coalesce(e.subject, '(no subject)'), e.to_email || ' · ' || coalesce(e.last_event, 'sent') || ' · ' || to_char(e.sent_at AT TIME ZONE 'America/New_York', 'Mon DD'),
          '/admin/emails?q=' || e.to_email
   FROM public.email_log e
   WHERE staff AND e.category <> 'outreach' AND (e.to_email ILIKE pat OR coalesce(e.subject, '') ILIKE pat)
   ORDER BY e.sent_at DESC LIMIT 5)
  UNION ALL
  (SELECT 'conversation', c.id::text, f.title, CASE WHEN c.kind = 'team' THEN 'With the CouponDonation team' ELSE 'Supporter · ' || coalesce(sp.full_name, sp.email, 'Supporter') END,
          '/admin/messages?cid=' || c.id
   FROM public.conversations c JOIN public.fundraisers f ON f.id = c.fundraiser_id LEFT JOIN public.profiles sp ON sp.user_id = c.supporter_id
   WHERE adm AND (f.title ILIKE pat OR coalesce(sp.full_name, '') ILIKE pat OR coalesce(sp.email, '') ILIKE pat)
   ORDER BY c.last_message_at DESC LIMIT 4)
  UNION ALL
  (SELECT 'contact message', m.id::text, coalesce(m.topic, 'Message') || ' · ' || coalesce(m.name, m.email), m.status || ' · ' || m.email, '/admin/contact?id=' || m.id
   FROM public.contact_messages m
   WHERE coalesce(m.name, '') ILIKE pat OR coalesce(m.email, '') ILIKE pat OR coalesce(m.topic, '') ILIKE pat OR coalesce(m.message, '') ILIKE pat
   ORDER BY m.created_at DESC LIMIT 4)
  UNION ALL
  (SELECT 'partner', pi.id::text, coalesce(pi.org_name, pi.contact_name, 'Partner'), concat_ws(' · ', pi.status, pi.email), '/admin/partners?id=' || pi.id
   FROM public.partner_inquiries pi
   WHERE coalesce(pi.org_name, '') ILIKE pat OR coalesce(pi.contact_name, '') ILIKE pat OR coalesce(pi.email, '') ILIKE pat OR coalesce(pi.city_state, '') ILIKE pat
   ORDER BY pi.created_at DESC LIMIT 4)
  UNION ALL
  (SELECT 'task', t.id::text, t.title, t.status, '/admin/tasks?id=' || t.id
   FROM public.admin_tasks t WHERE t.title ILIKE pat OR coalesce(t.description, '') ILIKE pat
   ORDER BY t.created_at DESC LIMIT 4);
END $$;

-- Numbers the AI "Ask" box may report. The AI only picks a metric and dates; these queries compute the
-- answer, so it never invents figures and never sees a record.
CREATE OR REPLACE FUNCTION public.admin_ask_metric(_metric text, _from timestamptz, _to timestamptz, _status text DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE a timestamptz := coalesce(_from, now() - interval '30 days'); b timestamptz := coalesce(_to, now()); r jsonb;
BEGIN
  IF NOT public.is_admin_any(auth.uid()) THEN RAISE EXCEPTION 'Team access required'; END IF;
  IF b < a THEN RAISE EXCEPTION 'Invalid dates'; END IF;
  r := CASE _metric
    WHEN 'donations' THEN (SELECT jsonb_build_object('count', count(*), 'amount', coalesce(sum(amount), 0), 'donors', count(DISTINCT coalesce(donor_id::text, lower(donor_email), id::text)))
      FROM public.donations WHERE status = 'completed' AND created_at >= a AND created_at < b)
    WHEN 'new_fundraisers' THEN (SELECT jsonb_build_object('count', count(*), 'by_status', coalesce(jsonb_object_agg(s, k), '{}'::jsonb))
      FROM (SELECT coalesce(status, 'unknown') s, count(*) k FROM public.fundraisers WHERE NOT is_example AND created_at >= a AND created_at < b
            AND (_status IS NULL OR status = _status) GROUP BY 1) z)
    WHEN 'fundraisers_now' THEN (SELECT jsonb_build_object('count', count(*), 'by_status', coalesce(jsonb_object_agg(s, k), '{}'::jsonb))
      FROM (SELECT coalesce(status, 'unknown') s, count(*) k FROM public.fundraisers WHERE NOT is_example AND archived_at IS NULL AND (_status IS NULL OR status = _status) GROUP BY 1) z)
    WHEN 'coupons_delivered' THEN (SELECT jsonb_build_object('count', count(*), 'amount', coalesce(sum(value), 0))
      FROM public.coupons WHERE has_credential AND status::text IN ('claimed', 'reserved', 'redeemed', 'expired') AND (donation_id IS NOT NULL OR source_id IS NOT NULL) AND created_at >= a AND created_at < b)
    WHEN 'coupons_revealed' THEN (SELECT jsonb_build_object('count', count(*), 'amount', coalesce(sum(value), 0)) FROM public.coupons WHERE revealed_at >= a AND revealed_at < b AND status::text <> 'void')
    WHEN 'coupons_used' THEN (SELECT jsonb_build_object('count', count(*), 'amount', coalesce(sum(value), 0)) FROM public.coupons WHERE used_at >= a AND used_at < b AND status::text <> 'void')
    WHEN 'coupons_waiting' THEN (SELECT jsonb_build_object('count', count(*), 'amount', coalesce(sum(value), 0)) FROM public.coupons
      WHERE has_credential AND revealed_at IS NULL AND status::text IN ('claimed', 'reserved', 'redeemed') AND (donation_id IS NOT NULL OR source_id IS NOT NULL))
    WHEN 'emails' THEN (SELECT jsonb_build_object('count', count(*), 'delivered', count(*) FILTER (WHERE last_event IN ('delivered', 'opened', 'clicked')),
        'opened', count(*) FILTER (WHERE last_event IN ('opened', 'clicked')), 'bounced', count(*) FILTER (WHERE last_event IN ('bounced', 'complained', 'suppressed', 'failed')))
      FROM public.email_log WHERE category <> 'outreach' AND sent_at >= a AND sent_at < b)
    WHEN 'outreach_emails' THEN (SELECT jsonb_build_object('count', count(*), 'delivered', count(*) FILTER (WHERE last_event IN ('delivered', 'opened', 'clicked')),
        'bounced', count(*) FILTER (WHERE last_event IN ('bounced', 'complained', 'suppressed', 'failed')))
      FROM public.email_log WHERE category = 'outreach' AND sent_at >= a AND sent_at < b)
    WHEN 'new_people' THEN (SELECT jsonb_build_object('count', count(*)) FROM public.profiles WHERE created_at >= a AND created_at < b)
    WHEN 'card_donations' THEN (SELECT jsonb_build_object('count', count(*), 'by_status', coalesce(jsonb_object_agg(s, k), '{}'::jsonb))
      FROM (SELECT status s, count(*) k FROM public.card_donations WHERE created_at >= a AND created_at < b GROUP BY 1) z)
    WHEN 'monthly_gifts' THEN (SELECT jsonb_build_object('count', count(*), 'monthly_amount', round(coalesce(sum(gift_cents), 0) / 100.0, 2))
      FROM public.recurring_donations WHERE status = 'active')
    WHEN 'contact_messages' THEN (SELECT jsonb_build_object('count', count(*), 'by_status', coalesce(jsonb_object_agg(s, k), '{}'::jsonb))
      FROM (SELECT status s, count(*) k FROM public.contact_messages WHERE created_at >= a AND created_at < b GROUP BY 1) z)
    WHEN 'open_tasks' THEN (SELECT jsonb_build_object('count', count(*)) FROM public.admin_tasks WHERE status NOT IN ('done', 'completed', 'cancelled', 'canceled'))
    ELSE NULL END;
  IF r IS NULL THEN RAISE EXCEPTION 'Unknown metric'; END IF;
  RETURN r || jsonb_build_object('metric', _metric, 'from', a, 'to', b);
END $$;

-- ---------------------------------------------------------------- grants
REVOKE ALL ON FUNCTION public.coupon_fundraiser(uuid), public.queue_outside_gift_events(interval), public.email_status(text),
  public.admin_coupon_followups(text, text, int, int), public.admin_ask_metric(text, timestamptz, timestamptz, text),
  public.admin_email_log(text, text, text, uuid, uuid, int, int, text, int) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.coupon_fundraiser(uuid), public.queue_outside_gift_events(interval), public.email_status(text) TO service_role;
GRANT EXECUTE ON FUNCTION public.admin_coupon_followups(text, text, int, int), public.admin_ask_metric(text, timestamptz, timestamptz, text),
  public.admin_email_log(text, text, text, uuid, uuid, int, int, text, int) TO authenticated, service_role;