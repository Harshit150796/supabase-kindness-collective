CREATE OR REPLACE FUNCTION public.get_top_donors_week()
RETURNS TABLE (
  display_name text,
  is_anonymous boolean,
  total numeric,
  donations_count bigint
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    CASE WHEN COALESCE(d.is_anonymous, false) THEN 'Anonymous'
         ELSE COALESCE(NULLIF(trim(d.donor_name), ''), 'Anonymous')
    END AS display_name,
    COALESCE(d.is_anonymous, false) AS is_anonymous,
    SUM(d.amount)::numeric AS total,
    COUNT(*)::bigint AS donations_count
  FROM public.donations d
  WHERE d.status IN ('completed', 'succeeded')
    AND d.created_at > now() - interval '7 days'
  GROUP BY 1, 2
  ORDER BY total DESC
  LIMIT 5;
$$;

GRANT EXECUTE ON FUNCTION public.get_top_donors_week() TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.get_impact_stats()
RETURNS TABLE (
  total_raised numeric,
  total_donations bigint,
  total_coupons bigint,
  active_fundraisers bigint,
  raised_today numeric,
  donations_today bigint
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    COALESCE((SELECT SUM(amount) FROM public.donations WHERE status IN ('completed','succeeded')), 0)::numeric,
    COALESCE((SELECT COUNT(*) FROM public.donations WHERE status IN ('completed','succeeded')), 0)::bigint,
    COALESCE((SELECT COUNT(*) FROM public.coupons), 0)::bigint,
    COALESCE((SELECT COUNT(*) FROM public.fundraisers WHERE status = 'active'), 0)::bigint,
    COALESCE((SELECT SUM(amount) FROM public.donations WHERE status IN ('completed','succeeded') AND created_at > now() - interval '1 day'), 0)::numeric,
    COALESCE((SELECT COUNT(*) FROM public.donations WHERE status IN ('completed','succeeded') AND created_at > now() - interval '1 day'), 0)::bigint;
$$;

GRANT EXECUTE ON FUNCTION public.get_impact_stats() TO anon, authenticated;