CREATE OR REPLACE FUNCTION public.get_hero_donations(_limit integer DEFAULT 20)
RETURNS TABLE(id uuid, display_name text, amount numeric)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT d.id,
    CASE WHEN d.is_anonymous OR nullif(btrim(d.donor_name), '') IS NULL THEN 'Anonymous Donor'
      ELSE split_part(btrim(d.donor_name), ' ', 1) || CASE WHEN split_part(btrim(d.donor_name), ' ', 2) <> '' THEN ' ' || upper(left(split_part(btrim(d.donor_name), ' ', 2), 1)) || '.' ELSE '' END
    END,
    d.amount
  FROM public.donations d
  WHERE d.status = 'completed' AND d.amount > 0
    AND NOT EXISTS (SELECT 1 FROM public.fundraisers f WHERE f.id = d.fundraiser_id AND f.is_example)
  ORDER BY d.created_at DESC
  LIMIT greatest(1, least(coalesce(_limit, 20), 20));
$$;
REVOKE ALL ON FUNCTION public.get_hero_donations(integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_hero_donations(integer) TO anon, authenticated, service_role;