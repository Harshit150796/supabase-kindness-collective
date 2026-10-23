UPDATE public.example_coupons SET used_at = COALESCE(used_at, now()) WHERE status = 'used';
UPDATE public.example_coupons SET used_at = NULL WHERE status <> 'used';

CREATE OR REPLACE FUNCTION public.get_fundraiser_coupons_by_store(_fundraiser_id uuid)
RETURNS TABLE(brand_name text, total_value numeric, coupons_count bigint, used_count bigint)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
  SELECT COALESCE(c.issued_brand,'Store'), SUM(COALESCE(c.value,c.expected_value,0)), COUNT(*),
         COUNT(*) FILTER (WHERE c.status='redeemed')
  FROM public.coupons c JOIN public.donations d ON d.id=c.donation_id
  WHERE d.fundraiser_id=_fundraiser_id AND d.status IN ('completed','succeeded') AND c.status::text<>'void'
    AND NOT public.is_example_fundraiser(_fundraiser_id)
  GROUP BY 1
  UNION ALL
  SELECT c.brand_name, SUM(c.value), COUNT(*), COUNT(*) FILTER (WHERE c.used_at IS NOT NULL)
  FROM public.example_coupons c JOIN public.example_donations e ON e.id=c.example_donation_id
  WHERE e.fundraiser_id=_fundraiser_id AND public.is_example_fundraiser(_fundraiser_id)
  GROUP BY 1
  ORDER BY 2 DESC
$$;
REVOKE ALL ON FUNCTION public.get_fundraiser_coupons_by_store(uuid) FROM public;
GRANT EXECUTE ON FUNCTION public.get_fundraiser_coupons_by_store(uuid) TO anon, authenticated, service_role;