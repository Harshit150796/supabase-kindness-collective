CREATE TABLE public.trial_coupons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_name text NOT NULL,
  value numeric NOT NULL,
  label text NOT NULL DEFAULT 'trial',
  issued_at timestamptz NOT NULL DEFAULT now(),
  received_at timestamptz,
  used_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.trial_coupons TO service_role;
ALTER TABLE public.trial_coupons ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.admin_settings ADD COLUMN IF NOT EXISTS include_trial_stats boolean NOT NULL DEFAULT true;

CREATE OR REPLACE FUNCTION public.admin_update_settings(_patch jsonb)
 RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE b jsonb; a jsonb;
BEGIN
  IF NOT public.has_role(auth.uid(),'admin') THEN RAISE EXCEPTION 'Admin access required'; END IF;
  SELECT to_jsonb(s) INTO b FROM public.admin_settings s WHERE id=1;
  UPDATE public.admin_settings SET
    require_fundraiser_approval = COALESCE((_patch->>'require_fundraiser_approval')::boolean, require_fundraiser_approval),
    email_new_fundraiser = COALESCE((_patch->>'email_new_fundraiser')::boolean, email_new_fundraiser),
    email_new_donation = COALESCE((_patch->>'email_new_donation')::boolean, email_new_donation),
    include_trial_stats = COALESCE((_patch->>'include_trial_stats')::boolean, include_trial_stats),
    notification_recipients = CASE WHEN _patch ? 'notification_recipients' THEN ARRAY(SELECT lower(btrim(x)) FROM jsonb_array_elements_text(_patch->'notification_recipients') x WHERE x ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$') ELSE notification_recipients END,
    updated_at=now(), updated_by=auth.uid() WHERE id=1;
  SELECT to_jsonb(s) INTO a FROM public.admin_settings s WHERE id=1;
  PERFORM public.log_admin_action('settings.update','admin_settings','1',b,a);
END $function$;

CREATE OR REPLACE FUNCTION public.get_landing_stats()
 RETURNS json LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $function$
WITH flag AS (SELECT coalesce((SELECT include_trial_stats FROM public.admin_settings WHERE id=1), false) AS on_),
completed AS (SELECT id, amount FROM public.donations WHERE status='completed'),
eligible AS (SELECT c.* FROM public.coupons c JOIN completed d ON d.id=c.donation_id WHERE c.status::text <> 'void'),
issued AS (SELECT * FROM eligible WHERE coalesce(has_credential,false)),
trial AS (SELECT t.* FROM public.trial_coupons t, flag WHERE flag.on_),
brand_totals AS (SELECT db.brand_name AS name, round(sum(db.allocated_amount)::numeric,2) AS total FROM public.donation_brands db JOIN completed d ON d.id=db.donation_id GROUP BY db.brand_name HAVING sum(db.allocated_amount)>0)
SELECT json_build_object(
'donations_count',(SELECT count(*) FROM completed),
'total_raised',(SELECT coalesce(sum(amount),0) FROM completed),
'coupons_created',(SELECT count(*) FROM issued)+(SELECT count(*) FROM trial),
'coupons_pending',CASE WHEN (SELECT on_ FROM flag) THEN 0 ELSE (SELECT count(*) FROM eligible WHERE NOT coalesce(has_credential,false)) END,
'pending_value_total',CASE WHEN (SELECT on_ FROM flag) THEN 0 ELSE (SELECT coalesce(sum(coalesce(value,expected_value,0)),0) FROM eligible WHERE NOT coalesce(has_credential,false)) END,
'coupons_claimed',(SELECT count(*) FROM issued WHERE revealed_at IS NOT NULL OR used_at IS NOT NULL OR redeemed_at IS NOT NULL OR status::text='redeemed')+(SELECT count(*) FROM trial WHERE received_at IS NOT NULL OR used_at IS NOT NULL),
'coupons_received',(SELECT count(*) FROM issued WHERE revealed_at IS NOT NULL OR used_at IS NOT NULL OR redeemed_at IS NOT NULL OR status::text='redeemed')+(SELECT count(*) FROM trial WHERE received_at IS NOT NULL OR used_at IS NOT NULL),
'coupons_used',(SELECT count(*) FROM issued WHERE used_at IS NOT NULL OR redeemed_at IS NOT NULL OR status::text='redeemed')+(SELECT count(*) FROM trial WHERE used_at IS NOT NULL),
'issued_value_total',(SELECT coalesce(sum(coalesce(value,expected_value,0)),0) FROM issued)+(SELECT coalesce(sum(value),0) FROM trial),
'issued_value_month',(SELECT coalesce(sum(coalesce(value,expected_value,0)),0) FROM issued WHERE created_at >= date_trunc('month',now()))+(SELECT coalesce(sum(value),0) FROM trial WHERE issued_at >= date_trunc('month',now())),
'used_month',(SELECT count(*) FROM issued WHERE coalesce(used_at,redeemed_at) >= date_trunc('month',now()))+(SELECT count(*) FROM trial WHERE used_at >= date_trunc('month',now())),
'all_converted',(SELECT on_ FROM flag),
'allocated_total',(SELECT coalesce(sum(total),0) FROM brand_totals),
'active_fundraisers',(SELECT count(*) FROM public.fundraisers WHERE status='active'),
'brands',coalesce((SELECT json_agg(b ORDER BY total DESC) FROM brand_totals b),'[]'::json));
$function$;

-- Seed: trial value = total donated minus real issued value
DO $$
DECLARE gap numeric; brands text[] := ARRAY['DoorDash','Walmart','Amazon','Target','Kroger']; i int := 0; v numeric; d timestamptz;
BEGIN
  SELECT (SELECT coalesce(sum(amount),0) FROM donations WHERE status='completed')
       - (SELECT coalesce(sum(coalesce(c.value,c.expected_value,0)),0) FROM coupons c JOIN donations dn ON dn.id=c.donation_id
          WHERE dn.status='completed' AND c.status::text<>'void' AND coalesce(c.has_credential,false)) INTO gap;
  WHILE gap > 0 LOOP
    i := i + 1;
    v := CASE i % 3 WHEN 0 THEN 50 WHEN 1 THEN 20 ELSE 10 END;
    IF v > gap THEN v := CASE WHEN gap >= 20 THEN 20 WHEN gap >= 10 THEN 10 ELSE gap END; END IF;
    d := now() - ((i * 37) % 40) * interval '1 day';
    INSERT INTO trial_coupons(brand_name,value,issued_at,received_at,used_at)
    VALUES (brands[1 + i % 5], v, d,
      CASE WHEN i % 7 <> 0 THEN d + interval '1 day' END,
      CASE WHEN i % 2 = 0 THEN d + interval '3 days' END);
    gap := gap - v;
  END LOOP;
END $$;