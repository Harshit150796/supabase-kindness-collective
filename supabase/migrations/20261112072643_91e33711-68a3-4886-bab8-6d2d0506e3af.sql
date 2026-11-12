-- Admin > Fundraisers list (founder request, Nov 12, 2026): one row per fundraiser with its photo,
-- organizer, money raised (the public page's rule), gifts, coupons, reports and homepage place, so the
-- list can show, filter and sort all of it server-side. Team-only; read-only.

-- Every fundraiser with what the team needs to see beside it. Internal: only the two functions below call it.
CREATE OR REPLACE FUNCTION public._admin_fundraiser_rows()
RETURNS TABLE(
  id uuid, title text, unique_slug text, status text, category text, help_categories text[], preferred_brands text[],
  city text, state_code text, beneficiary_type text, monthly_goal numeric, created_at timestamptz, updated_at timestamptz,
  is_example boolean, featured_order integer, photo_url text, photo_count integer, story_length integer,
  organizer_id uuid, organizer_name text, organizer_email text,
  raised numeric, gifts bigint, last_gift_at timestamptz,
  coupons_waiting bigint, coupons_ready bigint, coupons_used bigint, open_reports bigint,
  homepage_position integer, homepage_hidden boolean, homepage_pinned boolean)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  WITH real_gifts AS (
    SELECT d.fundraiser_id fid, sum(d.amount) amt, count(*) n, max(d.created_at) last_at
    FROM public.donations d WHERE d.status IN ('completed', 'succeeded') AND d.fundraiser_id IS NOT NULL GROUP BY 1),
  outside AS (
    SELECT s.fundraiser_id fid, sum(coalesce(c.value, c.expected_value, 0)) amt, count(DISTINCT s.id) n, max(s.created_at) last_at
    FROM public.coupon_sources s
    JOIN public.coupons c ON c.source_id = s.id AND c.donation_id IS NULL AND c.status::text NOT IN ('void', 'returned')
    WHERE s.public_credit <> 'hidden' GROUP BY 1),
  example_gifts AS (
    SELECT e.fundraiser_id fid, sum(e.amount) amt, count(*) n, max(e.created_at) last_at FROM public.example_donations e GROUP BY 1),
  coupon_rows AS (
    SELECT d.fundraiser_id fid, c.code, c.status::text st
    FROM public.coupons c JOIN public.donations d ON d.id = c.donation_id AND d.status IN ('completed', 'succeeded')
    UNION ALL
    SELECT s.fundraiser_id, c.code, c.status::text
    FROM public.coupons c JOIN public.coupon_sources s ON s.id = c.source_id WHERE c.donation_id IS NULL),
  coupon_counts AS (
    SELECT r.fid,
      count(*) FILTER (WHERE coalesce(r.code, '') = '' AND r.st IN ('pending_procurement', 'procurement_failed')) waiting,
      count(*) FILTER (WHERE coalesce(r.code, '') <> '' AND r.st NOT IN ('redeemed', 'expired')) ready,
      count(*) FILTER (WHERE r.st = 'redeemed') used
    FROM coupon_rows r WHERE r.st NOT IN ('void', 'returned') GROUP BY 1),
  photos AS (
    SELECT i.fundraiser_id fid, count(*)::integer n,
      (array_agg(i.image_url ORDER BY coalesce(i.is_primary, false) DESC, i.display_order NULLS LAST, i.created_at))[1] first_url
    FROM public.fundraiser_images i GROUP BY 1),
  reports AS (
    SELECT r.fundraiser_id fid, count(*) n FROM public.content_reports r
    WHERE r.fundraiser_id IS NOT NULL AND r.status NOT IN ('resolved', 'dismissed') GROUP BY 1)
  SELECT f.id, f.title, f.unique_slug, coalesce(f.status, 'pending'), f.category, coalesce(f.help_categories, '{}'), coalesce(f.preferred_brands, '{}'),
    f.city, f.state_code, f.beneficiary_type, f.monthly_goal::numeric, f.created_at, f.updated_at,
    f.is_example, f.featured_order, coalesce(ph.first_url, nullif(f.cover_photo_url, '')),
    coalesce(ph.n, 0) + CASE WHEN ph.n IS NULL AND coalesce(f.cover_photo_url, '') <> '' THEN 1 ELSE 0 END,
    length(coalesce(f.story, ''))::integer,
    f.user_id, p.full_name, p.email,
    CASE WHEN f.is_example THEN coalesce(eg.amt, 0) ELSE coalesce(g.amt, 0) + coalesce(o.amt, 0) END,
    CASE WHEN f.is_example THEN coalesce(eg.n, 0) ELSE coalesce(g.n, 0) + coalesce(o.n, 0) END,
    CASE WHEN f.is_example THEN eg.last_at ELSE greatest(g.last_at, o.last_at) END,
    coalesce(cc.waiting, 0), coalesce(cc.ready, 0), coalesce(cc.used, 0), coalesce(rp.n, 0),
    hp.position, coalesce(hp.hidden, false), coalesce(hp.pinned, false)
  FROM public.fundraisers f
  LEFT JOIN public.profiles p ON p.user_id = f.user_id
  LEFT JOIN real_gifts g ON g.fid = f.id
  LEFT JOIN outside o ON o.fid = f.id
  LEFT JOIN example_gifts eg ON eg.fid = f.id
  LEFT JOIN coupon_counts cc ON cc.fid = f.id
  LEFT JOIN photos ph ON ph.fid = f.id
  LEFT JOIN reports rp ON rp.fid = f.id
  LEFT JOIN public.homepage_placements hp ON hp.fundraiser_id = f.id
$$;
REVOKE ALL ON FUNCTION public._admin_fundraiser_rows() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public._admin_fundraiser_rows() TO service_role;

-- Whether a row belongs to a quick view ("Needs attention" and the rest).
CREATE OR REPLACE FUNCTION public._admin_fundraiser_in_view(_view text, _status text, _photo text, _gifts bigint, _raised numeric, _goal numeric,
  _waiting bigint, _reports bigint, _position integer, _hidden boolean, _example boolean, _story integer)
RETURNS boolean LANGUAGE sql IMMUTABLE SET search_path = public AS $$
  SELECT CASE coalesce(_view, 'all')
    WHEN 'all' THEN true
    WHEN 'review' THEN _status = 'pending'
    WHEN 'coupons' THEN _waiting > 0
    WHEN 'reports' THEN _reports > 0
    WHEN 'no_photo' THEN _photo IS NULL AND _status IN ('pending', 'active', 'paused')
    WHEN 'short_story' THEN _story < 200 AND _status IN ('pending', 'active', 'paused')
    WHEN 'no_gifts' THEN _status = 'active' AND _gifts = 0 AND NOT _example
    WHEN 'close' THEN _status = 'active' AND _goal > 0 AND _raised >= _goal * 0.75 AND _raised < _goal
    WHEN 'funded' THEN _goal > 0 AND _raised >= _goal
    WHEN 'homepage' THEN _position IS NOT NULL AND NOT _hidden
    WHEN 'hidden' THEN _hidden
    WHEN 'examples' THEN _example
    WHEN 'real' THEN NOT _example
    ELSE true END
$$;
REVOKE ALL ON FUNCTION public._admin_fundraiser_in_view(text, text, text, bigint, numeric, numeric, bigint, bigint, integer, boolean, boolean, integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public._admin_fundraiser_in_view(text, text, text, bigint, numeric, numeric, bigint, bigint, integer, boolean, boolean, integer) TO service_role;

-- One page of the list, filtered and sorted on the server.
CREATE OR REPLACE FUNCTION public.admin_fundraiser_list(
  _status text DEFAULT 'all', _search text DEFAULT NULL, _view text DEFAULT 'all', _need text DEFAULT NULL,
  _sort text DEFAULT 'created', _dir text DEFAULT 'desc', _limit integer DEFAULT 25, _offset integer DEFAULT 0, _ids uuid[] DEFAULT NULL)
RETURNS TABLE(
  id uuid, title text, unique_slug text, status text, category text, help_categories text[], preferred_brands text[],
  city text, state_code text, beneficiary_type text, monthly_goal numeric, created_at timestamptz, updated_at timestamptz,
  is_example boolean, featured_order integer, photo_url text, photo_count integer, story_length integer,
  organizer_id uuid, organizer_name text, organizer_email text,
  raised numeric, gifts bigint, last_gift_at timestamptz,
  coupons_waiting bigint, coupons_ready bigint, coupons_used bigint, open_reports bigint,
  homepage_position integer, homepage_hidden boolean, homepage_pinned boolean, total_count bigint)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE
  q text := nullif(btrim(coalesce(_search, '')), '');
  asc_order boolean := lower(coalesce(_dir, 'desc')) = 'asc';
BEGIN
  IF NOT public.is_admin_any(auth.uid()) THEN RAISE EXCEPTION 'Team access required'; END IF;
  RETURN QUERY
  SELECT r.*, count(*) OVER ()
  FROM public._admin_fundraiser_rows() r
  WHERE (_ids IS NULL OR r.id = ANY (_ids))
    AND (_status IS NULL OR _status = 'all' OR r.status = _status)
    AND (_need IS NULL OR _need = '' OR r.category = _need OR _need = ANY (r.help_categories))
    AND public._admin_fundraiser_in_view(_view, r.status, r.photo_url, r.gifts, r.raised, r.monthly_goal,
      r.coupons_waiting, r.open_reports, r.homepage_position, r.homepage_hidden, r.is_example, r.story_length)
    AND (q IS NULL
      OR r.title ILIKE '%' || q || '%' OR r.unique_slug ILIKE '%' || q || '%'
      OR r.organizer_name ILIKE '%' || q || '%' OR r.organizer_email ILIKE '%' || q || '%'
      OR r.city ILIKE '%' || q || '%' OR upper(r.state_code) = upper(q)
      OR r.id::text LIKE lower(q) || '%')
  ORDER BY
    CASE WHEN asc_order THEN CASE _sort WHEN 'title' THEN lower(r.title) WHEN 'status' THEN r.status WHEN 'organizer' THEN lower(r.organizer_name) END END ASC NULLS LAST,
    CASE WHEN NOT asc_order THEN CASE _sort WHEN 'title' THEN lower(r.title) WHEN 'status' THEN r.status WHEN 'organizer' THEN lower(r.organizer_name) END END DESC NULLS LAST,
    CASE WHEN asc_order THEN CASE _sort
      WHEN 'goal' THEN r.monthly_goal WHEN 'raised' THEN r.raised WHEN 'progress' THEN r.raised / nullif(r.monthly_goal, 0)
      WHEN 'gifts' THEN r.gifts WHEN 'waiting' THEN r.coupons_waiting WHEN 'last_gift' THEN extract(epoch FROM r.last_gift_at)
      WHEN 'updated' THEN extract(epoch FROM r.updated_at) WHEN 'created' THEN extract(epoch FROM r.created_at) END END ASC NULLS LAST,
    CASE WHEN NOT asc_order THEN CASE _sort
      WHEN 'goal' THEN r.monthly_goal WHEN 'raised' THEN r.raised WHEN 'progress' THEN r.raised / nullif(r.monthly_goal, 0)
      WHEN 'gifts' THEN r.gifts WHEN 'waiting' THEN r.coupons_waiting WHEN 'last_gift' THEN extract(epoch FROM r.last_gift_at)
      WHEN 'updated' THEN extract(epoch FROM r.updated_at) WHEN 'created' THEN extract(epoch FROM r.created_at) END END DESC NULLS LAST,
    r.created_at DESC, r.id
  LIMIT LEAST(GREATEST(coalesce(_limit, 25), 1), 1000) OFFSET GREATEST(coalesce(_offset, 0), 0);
END $$;
REVOKE ALL ON FUNCTION public.admin_fundraiser_list(text, text, text, text, text, text, integer, integer, uuid[]) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_fundraiser_list(text, text, text, text, text, text, integer, integer, uuid[]) TO authenticated;

-- How many fundraisers sit in each status and each quick view, for the tabs and chips.
CREATE OR REPLACE FUNCTION public.admin_fundraiser_counts(_need text DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE out jsonb;
BEGIN
  IF NOT public.is_admin_any(auth.uid()) THEN RAISE EXCEPTION 'Team access required'; END IF;
  WITH r AS (
    SELECT * FROM public._admin_fundraiser_rows() x
    WHERE _need IS NULL OR _need = '' OR x.category = _need OR _need = ANY (x.help_categories)),
  views AS (SELECT unnest(ARRAY['review', 'coupons', 'reports', 'no_photo', 'short_story', 'no_gifts', 'close', 'funded', 'homepage', 'hidden', 'examples', 'real']) v)
  SELECT jsonb_build_object(
    'total', (SELECT count(*) FROM r),
    'status', coalesce((SELECT jsonb_object_agg(s.status, s.n) FROM (SELECT r.status, count(*) n FROM r GROUP BY 1) s), '{}'::jsonb),
    'views', (SELECT jsonb_object_agg(views.v, (SELECT count(*) FROM r WHERE public._admin_fundraiser_in_view(views.v, r.status, r.photo_url, r.gifts, r.raised,
      r.monthly_goal, r.coupons_waiting, r.open_reports, r.homepage_position, r.homepage_hidden, r.is_example, r.story_length))) FROM views),
    'raised', (SELECT coalesce(sum(r.raised), 0) FROM r WHERE NOT r.is_example),
    'waiting', (SELECT coalesce(sum(r.coupons_waiting), 0) FROM r))
  INTO out;
  RETURN out;
END $$;
REVOKE ALL ON FUNCTION public.admin_fundraiser_counts(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_fundraiser_counts(text) TO authenticated;
