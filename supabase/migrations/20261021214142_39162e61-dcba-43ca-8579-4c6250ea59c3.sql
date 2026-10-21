CREATE OR REPLACE FUNCTION public.get_landing_stats()
 RETURNS json LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $function$
WITH flag AS (SELECT coalesce((SELECT include_trial_stats FROM public.admin_settings WHERE id=1), false) AS on_),
completed AS (SELECT id, amount FROM public.donations WHERE status='completed'),
exd AS (SELECT e.id, e.amount FROM public.example_donations e JOIN public.fundraisers f ON f.id=e.fundraiser_id, flag WHERE flag.on_ AND f.is_example),
eligible AS (SELECT c.* FROM public.coupons c JOIN completed d ON d.id=c.donation_id WHERE c.status::text <> 'void'),
issued AS (SELECT * FROM eligible WHERE coalesce(has_credential,false)),
trial AS (SELECT t.brand_name, t.value, t.issued_at, t.received_at, t.used_at FROM public.trial_coupons t, flag WHERE flag.on_
  UNION ALL SELECT c.brand_name, c.value, c.issued_at, c.received_at, c.used_at FROM public.example_coupons c JOIN exd ON exd.id=c.example_donation_id),
brand_totals AS (
  SELECT name, round(sum(total)::numeric,2) AS total FROM (
    SELECT db.brand_name AS name, db.allocated_amount AS total FROM public.donation_brands db JOIN completed d ON d.id=db.donation_id, flag WHERE NOT flag.on_
    UNION ALL SELECT i.issued_brand, coalesce(i.value,i.expected_value,0) FROM issued i, flag WHERE flag.on_
    UNION ALL SELECT t.brand_name, t.value FROM trial t
  ) x WHERE name IS NOT NULL GROUP BY name HAVING sum(total)>0),
iv AS (SELECT (SELECT coalesce(sum(coalesce(value,expected_value,0)),0) FROM issued)+(SELECT coalesce(sum(value),0) FROM trial) AS v)
SELECT json_build_object(
'donations_count',(SELECT count(*) FROM completed)+(SELECT count(*) FROM exd),
'total_raised',(SELECT coalesce(sum(amount),0) FROM completed)+(SELECT coalesce(sum(amount),0) FROM exd),
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
'active_fundraisers',(SELECT count(*) FROM public.fundraisers WHERE status='active' AND NOT is_example),
'brands',coalesce((SELECT json_agg(b ORDER BY total DESC) FROM brand_totals b),'[]'::json));
$function$;