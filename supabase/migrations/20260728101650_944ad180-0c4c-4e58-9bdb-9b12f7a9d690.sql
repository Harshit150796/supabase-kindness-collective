-- Real, privacy-safe donation stats for the public homepage.
CREATE OR REPLACE FUNCTION public.get_public_donation_stats()
RETURNS TABLE (donations_count bigint, total_raised numeric)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COUNT(*)::bigint, COALESCE(SUM(amount), 0)::numeric
  FROM public.donations
  WHERE status = 'completed';
$$;

CREATE OR REPLACE FUNCTION public.get_recent_public_donations(_limit int DEFAULT 8)
RETURNS TABLE (
  id uuid,
  display_name text,
  amount numeric,
  brand_partner text,
  created_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    d.id,
    CASE
      WHEN d.is_anonymous OR d.donor_name IS NULL OR btrim(d.donor_name) = '' THEN 'Anonymous'
      ELSE split_part(btrim(d.donor_name), ' ', 1)
           || CASE
                WHEN split_part(btrim(d.donor_name), ' ', 2) <> ''
                  THEN ' ' || upper(left(split_part(btrim(d.donor_name), ' ', 2), 1)) || '.'
                ELSE ''
              END
    END AS display_name,
    d.amount,
    d.brand_partner,
    d.created_at
  FROM public.donations d
  WHERE d.status = 'completed'
  ORDER BY d.created_at DESC
  LIMIT GREATEST(1, LEAST(_limit, 20));
$$;

GRANT EXECUTE ON FUNCTION public.get_public_donation_stats() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_recent_public_donations(int) TO anon, authenticated;