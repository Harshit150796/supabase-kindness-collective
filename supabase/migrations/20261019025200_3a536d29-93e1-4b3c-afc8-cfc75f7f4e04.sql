CREATE OR REPLACE FUNCTION public.get_fundraiser_totals(_fundraiser_id uuid)
 RETURNS TABLE(total_raised numeric, donations_count bigint, retailers text[])
 LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $function$
 SELECT coalesce(sum(d.amount),0)::numeric, count(DISTINCT coalesce(d.donor_id::text,lower(d.donor_email),d.id::text))::bigint,
 coalesce((SELECT array_agg(DISTINCT trim(b)) FROM public.donations d2, unnest(string_to_array(coalesce(d2.brand_partner,''),',')) b WHERE d2.fundraiser_id=_fundraiser_id AND d2.status='completed' AND trim(b)<>''),'{}')
 FROM public.donations d JOIN public.fundraisers f ON f.id=d.fundraiser_id AND f.status IN ('active','paused','completed')
 WHERE d.fundraiser_id=_fundraiser_id AND d.status='completed'
 HAVING NOT public.is_example_fundraiser(_fundraiser_id)
 UNION ALL
 SELECT coalesce(sum(e.amount),0)::numeric, count(DISTINCT e.donor_name)::bigint,
   coalesce((SELECT array_agg(DISTINCT e2.brand_name) FROM public.example_donations e2 WHERE e2.fundraiser_id=_fundraiser_id),'{}')
 FROM public.example_donations e JOIN public.fundraisers f ON f.id=e.fundraiser_id AND f.status IN ('active','paused','completed')
 WHERE e.fundraiser_id=_fundraiser_id
 HAVING public.is_example_fundraiser(_fundraiser_id);
$function$;

CREATE OR REPLACE FUNCTION public.get_fundraiser_coupon_trail(_fundraiser_id uuid)
 RETURNS TABLE(converted numeric, redeemed numeric, coupons_count bigint)
 LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $function$
  SELECT COALESCE(SUM(COALESCE(c.value,c.expected_value,0)),0),
         COALESCE(SUM(CASE WHEN c.status='redeemed' THEN COALESCE(c.value,c.expected_value,0) ELSE 0 END),0),
         COUNT(c.id)
  FROM public.coupons c JOIN public.donations d ON d.id = c.donation_id
  WHERE d.fundraiser_id = _fundraiser_id AND d.status IN ('completed','succeeded') AND c.status::text <> 'void'
  HAVING NOT public.is_example_fundraiser(_fundraiser_id)
  UNION ALL
  SELECT COALESCE(SUM(c.value),0), COALESCE(SUM(CASE WHEN c.used_at IS NOT NULL THEN c.value ELSE 0 END),0), COUNT(c.id)
  FROM public.example_coupons c JOIN public.example_donations e ON e.id=c.example_donation_id
  WHERE e.fundraiser_id=_fundraiser_id
  HAVING public.is_example_fundraiser(_fundraiser_id)
$function$;