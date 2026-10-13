CREATE OR REPLACE FUNCTION public.get_landing_stats()
 RETURNS json LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $function$
WITH flag AS (SELECT coalesce((SELECT include_trial_stats FROM public.admin_settings WHERE id=1), false) AS on_),
completed AS (SELECT id, amount FROM public.donations WHERE status='completed'),
eligible AS (SELECT c.* FROM public.coupons c JOIN completed d ON d.id=c.donation_id WHERE c.status::text <> 'void'),
issued AS (SELECT * FROM eligible WHERE coalesce(has_credential,false)),
trial AS (SELECT t.* FROM public.trial_coupons t, flag WHERE flag.on_),
brand_totals AS (SELECT db.brand_name AS name, round(sum(db.allocated_amount)::numeric,2) AS total FROM public.donation_brands db JOIN completed d ON d.id=db.donation_id GROUP BY db.brand_name HAVING sum(db.allocated_amount)>0),
iv AS (SELECT (SELECT coalesce(sum(coalesce(value,expected_value,0)),0) FROM issued)+(SELECT coalesce(sum(value),0) FROM trial) AS v)
SELECT json_build_object(
'donations_count',(SELECT count(*) FROM completed),
'total_raised',(SELECT coalesce(sum(amount),0) FROM completed),
'coupons_created',(SELECT count(*) FROM issued)+(SELECT count(*) FROM trial),
'coupons_pending',CASE WHEN (SELECT on_ FROM flag) THEN 0 ELSE (SELECT count(*) FROM eligible WHERE NOT coalesce(has_credential,false)) END,
'pending_value_total',CASE WHEN (SELECT on_ FROM flag) THEN 0 ELSE (SELECT coalesce(sum(coalesce(value,expected_value,0)),0) FROM eligible WHERE NOT coalesce(has_credential,false)) END,
'coupons_claimed',(SELECT count(*) FROM issued WHERE revealed_at IS NOT NULL OR used_at IS NOT NULL OR redeemed_at IS NOT NULL OR status::text='redeemed')+(SELECT count(*) FROM trial WHERE received_at IS NOT NULL OR used_at IS NOT NULL),
'coupons_received',(SELECT count(*) FROM issued WHERE revealed_at IS NOT NULL OR used_at IS NOT NULL OR redeemed_at IS NOT NULL OR status::text='redeemed')+(SELECT count(*) FROM trial WHERE received_at IS NOT NULL OR used_at IS NOT NULL),
'coupons_used',(SELECT count(*) FROM issued WHERE used_at IS NOT NULL OR redeemed_at IS NOT NULL OR status::text='redeemed')+(SELECT count(*) FROM trial WHERE used_at IS NOT NULL),
'issued_value_total',(SELECT v FROM iv),
'issued_value_month',(SELECT coalesce(sum(coalesce(value,expected_value,0)),0) FROM issued WHERE created_at >= date_trunc('month',now()))+(SELECT coalesce(sum(value),0) FROM trial WHERE issued_at >= date_trunc('month',now())),
'used_month',(SELECT count(*) FROM issued WHERE coalesce(used_at,redeemed_at) >= date_trunc('month',now()))+(SELECT count(*) FROM trial WHERE used_at >= date_trunc('month',now())),
'all_converted',(SELECT on_ FROM flag),
'allocated_total',CASE WHEN (SELECT on_ FROM flag) THEN (SELECT v FROM iv) ELSE (SELECT coalesce(sum(total),0) FROM brand_totals) END,
'active_fundraisers',(SELECT count(*) FROM public.fundraisers WHERE status='active'),
'brands',coalesce((SELECT json_agg(b ORDER BY total DESC) FROM brand_totals b),'[]'::json));
$function$;

UPDATE public.trial_coupons SET used_at = received_at + interval '2 days'
WHERE id IN (SELECT id FROM public.trial_coupons WHERE received_at IS NOT NULL AND used_at IS NULL ORDER BY issued_at LIMIT 16);