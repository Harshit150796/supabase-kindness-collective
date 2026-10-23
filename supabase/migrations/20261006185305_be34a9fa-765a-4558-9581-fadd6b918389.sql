CREATE OR REPLACE FUNCTION public.get_landing_stats() RETURNS json LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
WITH completed AS (SELECT id, amount FROM public.donations WHERE status='completed'), eligible AS (SELECT c.* FROM public.coupons c JOIN completed d ON d.id=c.donation_id WHERE c.status::text <> 'void'), brand_totals AS (SELECT db.brand_name AS name, round(sum(db.allocated_amount)::numeric,2) AS total FROM public.donation_brands db JOIN completed d ON d.id=db.donation_id GROUP BY db.brand_name HAVING sum(db.allocated_amount)>0)
SELECT json_build_object(
'donations_count',(SELECT count(*) FROM completed),
'total_raised',(SELECT coalesce(sum(amount),0) FROM completed),
'coupons_created',(SELECT count(*) FROM eligible),
'coupons_claimed',(SELECT count(*) FROM eligible WHERE revealed_at IS NOT NULL OR used_at IS NOT NULL OR redeemed_at IS NOT NULL OR status::text='redeemed'),
'coupons_received',(SELECT count(*) FROM eligible WHERE revealed_at IS NOT NULL OR used_at IS NOT NULL OR redeemed_at IS NOT NULL OR status::text='redeemed'),
'coupons_used',(SELECT count(*) FROM eligible WHERE used_at IS NOT NULL OR redeemed_at IS NOT NULL OR status::text='redeemed'),
'issued_value_total',(SELECT coalesce(sum(coalesce(value,expected_value,0)),0) FROM eligible WHERE has_credential),
'issued_value_month',(SELECT coalesce(sum(coalesce(value,expected_value,0)),0) FROM eligible WHERE has_credential AND created_at >= date_trunc('month',now())),
'used_month',(SELECT count(*) FROM eligible WHERE coalesce(used_at,redeemed_at) >= date_trunc('month',now())),
'allocated_total',(SELECT coalesce(sum(total),0) FROM brand_totals),
'active_fundraisers',(SELECT count(*) FROM public.fundraisers WHERE status='active'),
'brands',coalesce((SELECT json_agg(b ORDER BY total DESC) FROM brand_totals b),'[]'::json));
$$;
REVOKE ALL ON FUNCTION public.get_landing_stats() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_landing_stats() TO anon, authenticated, service_role;