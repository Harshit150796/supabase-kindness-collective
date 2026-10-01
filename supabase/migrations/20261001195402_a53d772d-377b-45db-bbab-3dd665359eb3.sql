DROP FUNCTION IF EXISTS public.admin_analytics();
CREATE OR REPLACE FUNCTION public.admin_analytics(_days int DEFAULT 30)
RETURNS json LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE since timestamptz := CASE WHEN _days IS NULL OR _days <= 0 THEN '-infinity'::timestamptz ELSE now() - make_interval(days => _days) END;
BEGIN
  IF NOT public.is_admin_any(auth.uid()) THEN RAISE EXCEPTION 'Team access required'; END IF;
  RETURN json_build_object(
    'users_total',(SELECT COUNT(*) FROM profiles),
    'users_in_range',(SELECT COUNT(*) FROM profiles WHERE created_at>=since),
    'raised_in_range',(SELECT COALESCE(SUM(amount),0) FROM donations WHERE status IN ('completed','succeeded') AND created_at>=since),
    'donations_in_range',(SELECT COUNT(*) FROM donations WHERE status IN ('completed','succeeded') AND created_at>=since),
    'coupons_total',(SELECT COUNT(*) FROM coupons),
    'coupons_redeemed',(SELECT COUNT(*) FROM coupons WHERE status='redeemed'),
    'signups',(SELECT COALESCE(json_agg(t ORDER BY t.d),'[]') FROM (SELECT to_char(created_at::date,'YYYY-MM-DD') d, COUNT(*) n FROM profiles WHERE created_at>=since GROUP BY 1) t),
    'donations',(SELECT COALESCE(json_agg(t ORDER BY t.d),'[]') FROM (SELECT to_char(created_at::date,'YYYY-MM-DD') d, SUM(amount) amount FROM donations WHERE status IN ('completed','succeeded') AND created_at>=since GROUP BY 1) t),
    'roles',(SELECT COALESCE(json_agg(t),'[]') FROM (SELECT role::text name, COUNT(*) value FROM user_roles GROUP BY 1) t),
    'coupon_status',(SELECT COALESCE(json_agg(t),'[]') FROM (SELECT status::text name, COUNT(*) value FROM coupons GROUP BY 1) t),
    'brands',(SELECT COALESCE(json_agg(t ORDER BY t.amount DESC),'[]') FROM (SELECT brand_name name, ROUND(SUM(allocated_amount)::numeric,2) amount FROM donation_brands db JOIN donations d ON d.id=db.donation_id WHERE d.status IN ('completed','succeeded') GROUP BY 1 ORDER BY 2 DESC LIMIT 8) t),
    'recent_users',(SELECT COALESCE(json_agg(t),'[]') FROM (SELECT email, full_name, created_at FROM profiles ORDER BY created_at DESC LIMIT 10) t));
END $$;
REVOKE EXECUTE ON FUNCTION public.admin_analytics(int) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_analytics(int) TO authenticated;