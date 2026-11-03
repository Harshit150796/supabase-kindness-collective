-- Company and other outside gifts on fundraiser pages (founder request, Nov 2026).
-- Coupons the team adds from the admin portal (coupon_sources: bought by CouponDonation, a donated card,
-- a gift handed over in person) used to stay off the public page. The team now chooses, per gift, how it
-- shows: as CouponDonation (the company), under the donor's name, as Anonymous, or not at all. Shown gifts
-- count toward the raised amount, the donor count and the coupon trail everywhere the page reads them.

ALTER TABLE public.coupon_sources ADD COLUMN IF NOT EXISTS public_credit text NOT NULL DEFAULT 'hidden';
ALTER TABLE public.coupon_sources DROP CONSTRAINT IF EXISTS coupon_sources_public_credit_check;
ALTER TABLE public.coupon_sources ADD CONSTRAINT coupon_sources_public_credit_check
  CHECK (public_credit IN ('hidden', 'company', 'donor', 'anonymous'));

-- One row per shown gift: what the public page lists and adds to the totals.
CREATE OR REPLACE FUNCTION public.public_outside_gifts(_fid uuid)
RETURNS TABLE(id uuid, credit text, display_name text, donor_key text, amount numeric, brands text[], created_at timestamptz)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT s.id, s.public_credit,
    CASE s.public_credit WHEN 'company' THEN 'CouponDonation' WHEN 'anonymous' THEN 'Anonymous'
      ELSE coalesce(public.short_display_name(s.donor_name), 'Supporter') END,
    CASE s.public_credit WHEN 'company' THEN 'company:coupondonation'
      ELSE coalesce(s.donor_user_id::text, lower(s.donor_email), 'source:' || s.id::text) END,
    sum(coalesce(c.value, c.expected_value, 0)),
    array_agg(DISTINCT coalesce(c.issued_brand, c.store_name)),
    s.created_at
  FROM public.coupon_sources s
  JOIN public.coupons c ON c.source_id = s.id AND c.donation_id IS NULL AND c.status::text NOT IN ('void', 'returned')
  JOIN public.fundraisers f ON f.id = s.fundraiser_id AND NOT f.is_example
  WHERE s.fundraiser_id = _fid AND s.public_credit <> 'hidden'
  GROUP BY s.id
$$;

-- Stored counters (organizer lists, overlays) follow the same rule as the public page.
CREATE OR REPLACE FUNCTION public.recompute_fundraiser_totals(_fundraiser_id uuid) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF _fundraiser_id IS NULL THEN RETURN; END IF;
  PERFORM 1 FROM public.fundraisers WHERE id = _fundraiser_id FOR UPDATE;
  UPDATE public.fundraisers f SET amount_raised = t.raised, donors_count = t.donors, updated_at = now()
  FROM (
    SELECT coalesce(sum(g.amount), 0) raised, count(DISTINCT g.who)::integer donors FROM (
      SELECT d.amount, coalesce(d.donor_id::text, lower(d.donor_email), d.id::text) who
      FROM public.donations d WHERE d.fundraiser_id = _fundraiser_id AND d.status = 'completed'
      UNION ALL
      SELECT o.amount, o.donor_key FROM public.public_outside_gifts(_fundraiser_id) o) g) t
  WHERE f.id = _fundraiser_id;
END $$;

CREATE OR REPLACE FUNCTION public.get_fundraiser_totals(_fundraiser_id uuid)
 RETURNS TABLE(total_raised numeric, donations_count bigint, retailers text[])
 LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $function$
 SELECT coalesce(sum(g.amount), 0)::numeric, count(DISTINCT g.who)::bigint,
   coalesce((SELECT array_agg(DISTINCT x) FROM (
       SELECT trim(b) x FROM public.donations d2, unnest(string_to_array(coalesce(d2.brand_partner, ''), ',')) b
       WHERE d2.fundraiser_id = _fundraiser_id AND d2.status = 'completed' AND trim(b) <> ''
       UNION SELECT unnest(o.brands) FROM public.public_outside_gifts(_fundraiser_id) o) r WHERE x IS NOT NULL), '{}')
 FROM (
   SELECT d.amount, coalesce(d.donor_id::text, lower(d.donor_email), d.id::text) who
   FROM public.donations d JOIN public.fundraisers f ON f.id = d.fundraiser_id AND f.status IN ('active', 'paused', 'completed')
   WHERE d.fundraiser_id = _fundraiser_id AND d.status = 'completed'
   UNION ALL
   SELECT o.amount, o.donor_key FROM public.public_outside_gifts(_fundraiser_id) o
   JOIN public.fundraisers f ON f.id = _fundraiser_id AND f.status IN ('active', 'paused', 'completed')) g
 HAVING NOT public.is_example_fundraiser(_fundraiser_id)
 UNION ALL
 SELECT coalesce(sum(e.amount), 0)::numeric, count(DISTINCT e.donor_name)::bigint,
   coalesce((SELECT array_agg(DISTINCT e2.brand_name) FROM public.example_donations e2 WHERE e2.fundraiser_id = _fundraiser_id), '{}')
 FROM public.example_donations e JOIN public.fundraisers f ON f.id = e.fundraiser_id AND f.status IN ('active', 'paused', 'completed')
 WHERE e.fundraiser_id = _fundraiser_id
 HAVING public.is_example_fundraiser(_fundraiser_id);
$function$;

-- The supporters list gains a "source" column: donation, company or outside.
DROP FUNCTION IF EXISTS public.get_fundraiser_donations(uuid, integer, text);
CREATE FUNCTION public.get_fundraiser_donations(_fundraiser_id uuid, _limit integer DEFAULT 10, _order text DEFAULT 'recent'::text)
 RETURNS TABLE(id uuid, display_name text, is_anonymous boolean, amount numeric, message text, created_at timestamp with time zone, source text)
 LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $function$
  SELECT * FROM (
  SELECT d.id,
    CASE WHEN COALESCE(d.is_anonymous, false) THEN 'Anonymous'
         ELSE COALESCE(public.short_display_name(d.donor_name), 'Supporter') END,
    COALESCE(d.is_anonymous, false), d.amount, d.message, d.created_at, 'donation'::text
  FROM public.donations d
  JOIN public.fundraisers f ON f.id = d.fundraiser_id AND f.status IN ('active', 'pending') AND NOT f.is_example
  WHERE d.fundraiser_id = _fundraiser_id AND d.status IN ('completed', 'succeeded')
  UNION ALL
  SELECT o.id, o.display_name, o.credit = 'anonymous', o.amount, NULL::text, o.created_at,
    CASE WHEN o.credit = 'company' THEN 'company' ELSE 'outside' END
  FROM public.public_outside_gifts(_fundraiser_id) o
  JOIN public.fundraisers f ON f.id = _fundraiser_id AND f.status IN ('active', 'pending')
  UNION ALL
  SELECT e.id, CASE WHEN e.is_anonymous THEN 'Anonymous' ELSE public.short_display_name(e.donor_name) END,
    e.is_anonymous, e.amount, e.message, e.created_at, 'donation'::text
  FROM public.example_donations e
  JOIN public.fundraisers f ON f.id = e.fundraiser_id AND f.status IN ('active', 'pending') AND f.is_example
  WHERE e.fundraiser_id = _fundraiser_id) r
  ORDER BY CASE WHEN _order = 'top' THEN r.amount END DESC NULLS LAST, r.created_at DESC
  LIMIT GREATEST(1, LEAST(_limit, 100))
$function$;

-- Coupons from shown gifts count in the coupon trail and the per-store list.
CREATE OR REPLACE FUNCTION public.public_fundraiser_coupons(_fid uuid)
RETURNS SETOF public.coupons LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT c.* FROM public.coupons c JOIN public.donations d ON d.id = c.donation_id
  WHERE d.fundraiser_id = _fid AND d.status IN ('completed', 'succeeded') AND c.status::text <> 'void'
  UNION ALL
  SELECT c.* FROM public.coupons c JOIN public.coupon_sources s ON s.id = c.source_id
  JOIN public.fundraisers f ON f.id = s.fundraiser_id AND NOT f.is_example
  WHERE s.fundraiser_id = _fid AND s.public_credit <> 'hidden' AND c.donation_id IS NULL AND c.status::text NOT IN ('void', 'returned')
$$;

CREATE OR REPLACE FUNCTION public.get_fundraiser_coupon_trail(_fundraiser_id uuid)
 RETURNS TABLE(converted numeric, redeemed numeric, coupons_count bigint)
 LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $function$
  SELECT COALESCE(SUM(COALESCE(c.value, c.expected_value, 0)), 0),
         COALESCE(SUM(CASE WHEN c.status = 'redeemed' THEN COALESCE(c.value, c.expected_value, 0) ELSE 0 END), 0),
         COUNT(c.id)
  FROM public.public_fundraiser_coupons(_fundraiser_id) c
  HAVING NOT public.is_example_fundraiser(_fundraiser_id)
  UNION ALL
  SELECT COALESCE(SUM(c.value), 0), COALESCE(SUM(CASE WHEN c.used_at IS NOT NULL THEN c.value ELSE 0 END), 0), COUNT(c.id)
  FROM public.example_coupons c JOIN public.example_donations e ON e.id = c.example_donation_id
  WHERE e.fundraiser_id = _fundraiser_id
  HAVING public.is_example_fundraiser(_fundraiser_id)
$function$;

CREATE OR REPLACE FUNCTION public.get_fundraiser_coupons_by_store(_fundraiser_id uuid)
RETURNS TABLE(brand_name text, total_value numeric, coupons_count bigint, used_count bigint)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
  SELECT COALESCE(c.issued_brand, c.store_name, 'Store'), SUM(COALESCE(c.value, c.expected_value, 0)), COUNT(*),
         COUNT(*) FILTER (WHERE c.status = 'redeemed')
  FROM public.public_fundraiser_coupons(_fundraiser_id) c
  WHERE NOT public.is_example_fundraiser(_fundraiser_id)
  GROUP BY 1
  UNION ALL
  SELECT c.brand_name, SUM(c.value), COUNT(*), COUNT(*) FILTER (WHERE c.used_at IS NOT NULL)
  FROM public.example_coupons c JOIN public.example_donations e ON e.id = c.example_donation_id
  WHERE e.fundraiser_id = _fundraiser_id AND public.is_example_fundraiser(_fundraiser_id)
  GROUP BY 1
  ORDER BY 2 DESC
$$;

CREATE OR REPLACE FUNCTION public.get_completed_fundraisers()
 RETURNS TABLE(id uuid, title text, unique_slug text, category text, cover_photo_url text, goal numeric, raised numeric, coupons_issued bigint, coupons_redeemed bigint)
 LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
  WITH t AS (
    SELECT f.id, f.title, f.unique_slug, f.category, f.cover_photo_url, f.monthly_goal, f.status,
      COALESCE((SELECT sum(d.amount) FROM donations d WHERE d.fundraiser_id = f.id AND d.status IN ('completed', 'succeeded')), 0)
        + COALESCE((SELECT sum(o.amount) FROM public_outside_gifts(f.id) o), 0) raised
    FROM fundraisers f WHERE f.archived_at IS NULL AND f.status IN ('active', 'completed', 'paused'))
  SELECT t.id, t.title, t.unique_slug, t.category, t.cover_photo_url, t.monthly_goal, t.raised,
    (SELECT count(*) FROM public_fundraiser_coupons(t.id) c),
    (SELECT count(*) FROM public_fundraiser_coupons(t.id) c WHERE c.redeemed_at IS NOT NULL OR c.status = 'redeemed')
  FROM t WHERE t.status = 'completed' OR (t.monthly_goal > 0 AND t.raised >= t.monthly_goal)
$$;

-- The organizer's own total, donor count and list include shown gifts too.
CREATE OR REPLACE FUNCTION public.get_my_fundraiser_donations(_fundraiser_id uuid)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE r jsonb;
BEGIN
  IF auth.uid() IS NULL OR NOT public.is_fundraiser_team(_fundraiser_id, auth.uid()) THEN
    RAISE EXCEPTION 'Not allowed' USING ERRCODE = '42501';
  END IF;
  SELECT jsonb_build_object(
    'total', COALESCE(sum(q.amount), 0),
    'count', count(*),
    'donations', COALESCE(jsonb_agg(jsonb_build_object('id', q.id, 'amount', q.amount, 'donor_display', q.donor_display,
      'message', q.message, 'created_at', q.created_at, 'source', q.source) ORDER BY q.created_at DESC), '[]'::jsonb))
  INTO r
  FROM (
    SELECT d.id, d.amount, d.message, d.created_at, 'donation'::text AS source,
      CASE
        WHEN COALESCE(d.is_anonymous, false) THEN 'Anonymous'
        WHEN NULLIF(btrim(p.full_name), '') IS NULL THEN 'Donor'
        ELSE concat_ws(' ', split_part(btrim(p.full_name), ' ', 1),
          CASE WHEN array_length(regexp_split_to_array(btrim(p.full_name), '\s+'), 1) > 1
            THEN left((regexp_split_to_array(btrim(p.full_name), '\s+'))[array_length(regexp_split_to_array(btrim(p.full_name), '\s+'), 1)], 1) || '.'
            ELSE NULL END)
      END AS donor_display
    FROM public.donations d
    LEFT JOIN public.profiles p ON p.user_id = d.donor_id
    WHERE d.fundraiser_id = _fundraiser_id AND d.status = 'completed'
    UNION ALL
    SELECT o.id, o.amount, NULL, o.created_at, CASE WHEN o.credit = 'company' THEN 'company' ELSE 'outside' END, o.display_name
    FROM public.public_outside_gifts(_fundraiser_id) o
  ) q;
  RETURN r;
END $$;

-- ---------------------------------------------------------------- the team's choice
-- _actor comes from the token in the coupon-secrets function, or from auth.uid() in the admin wrapper.
CREATE OR REPLACE FUNCTION public._set_coupon_source_credit(_actor uuid, _source uuid, _credit text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE s public.coupon_sources;
BEGIN
  IF _actor IS NULL OR NOT public.is_admin_staff(_actor) THEN RAISE EXCEPTION 'Staff access required'; END IF;
  IF _credit NOT IN ('hidden', 'company', 'donor', 'anonymous') THEN RAISE EXCEPTION 'Choose how the gift shows'; END IF;
  SELECT * INTO s FROM public.coupon_sources WHERE id = _source FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Gift not found'; END IF;
  IF _credit = 'donor' AND nullif(btrim(coalesce(s.donor_name, '')), '') IS NULL THEN RAISE EXCEPTION 'This gift has no donor name to show'; END IF;
  IF _credit = 'donor' AND s.is_anonymous THEN RAISE EXCEPTION 'The donor asked to stay anonymous'; END IF;
  IF s.public_credit = _credit THEN RETURN jsonb_build_object('source_id', s.id, 'public_credit', _credit); END IF;
  UPDATE public.coupon_sources SET public_credit = _credit WHERE id = _source;
  PERFORM public.recompute_fundraiser_totals(s.fundraiser_id);
  INSERT INTO public.admin_audit_log(actor_id, action, table_name, record_id, before, after)
  VALUES (_actor, 'coupon_source.credit', 'coupon_sources', s.id::text, jsonb_build_object('public_credit', s.public_credit),
    jsonb_build_object('public_credit', _credit, 'fundraiser_id', s.fundraiser_id));
  RETURN jsonb_build_object('source_id', s.id, 'public_credit', _credit);
END $$;

CREATE OR REPLACE FUNCTION public.admin_set_coupon_source_credit(_source uuid, _credit text)
RETURNS jsonb LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  SELECT public._set_coupon_source_credit(auth.uid(), _source, _credit)
$$;

DROP FUNCTION IF EXISTS public.admin_outside_coupons(uuid);
CREATE FUNCTION public.admin_outside_coupons(_fundraiser_id uuid)
RETURNS TABLE(id uuid, source_id uuid, store_name text, value numeric, status text, code_hint text, revealed_at timestamptz, used_at timestamptz,
  source_label text, donor_name text, donor_email text, is_anonymous boolean, confirmation_sent_at timestamptz, confirmation_count integer,
  created_at timestamptz, public_credit text)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  IF NOT public.is_admin_any(auth.uid()) THEN RAISE EXCEPTION 'Admin access required'; END IF;
  RETURN QUERY SELECT c.id, s.id, coalesce(c.issued_brand, c.store_name), c.value, c.status::text, _cred_mask(c), c.revealed_at, c.used_at,
    s.source_label, s.donor_name, s.donor_email, s.is_anonymous, s.confirmation_sent_at, s.confirmation_count::integer, s.created_at, s.public_credit
  FROM coupon_sources s JOIN coupons c ON c.source_id = s.id
  WHERE s.fundraiser_id = _fundraiser_id AND c.status::text NOT IN ('void', 'returned')
  ORDER BY s.created_at DESC;
END $$;

-- ---------------------------------------------------------------- grants
REVOKE ALL ON FUNCTION public.public_outside_gifts(uuid), public.public_fundraiser_coupons(uuid), public._set_coupon_source_credit(uuid, uuid, text),
  public.admin_set_coupon_source_credit(uuid, text), public.admin_outside_coupons(uuid), public.get_fundraiser_donations(uuid, integer, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.public_outside_gifts(uuid), public.public_fundraiser_coupons(uuid), public._set_coupon_source_credit(uuid, uuid, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.admin_set_coupon_source_credit(uuid, text), public.admin_outside_coupons(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_fundraiser_donations(uuid, integer, text) TO anon, authenticated, service_role;
