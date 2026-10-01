CREATE OR REPLACE FUNCTION public.get_fundraiser_totals(_fundraiser_id uuid)
RETURNS TABLE(total_raised numeric, donations_count bigint, retailers text[])
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT coalesce(sum(d.amount),0)::numeric, count(*)::bigint,
    coalesce((SELECT array_agg(DISTINCT trim(b)) FROM donations d2, unnest(string_to_array(coalesce(d2.brand_partner,''), ',')) b
      WHERE d2.fundraiser_id=_fundraiser_id AND d2.status IN ('completed','succeeded') AND trim(b)<>''), '{}')
  FROM donations d
  JOIN fundraisers f ON f.id=d.fundraiser_id AND f.status IN ('active','paused','completed')
  WHERE d.fundraiser_id=_fundraiser_id AND d.status IN ('completed','succeeded');
$$;
GRANT EXECUTE ON FUNCTION public.get_fundraiser_totals(uuid) TO anon, authenticated;