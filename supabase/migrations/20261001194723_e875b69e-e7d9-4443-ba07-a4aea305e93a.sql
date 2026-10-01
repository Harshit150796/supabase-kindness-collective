CREATE OR REPLACE FUNCTION public.admin_write(_table text, _op text, _ids uuid[] DEFAULT NULL, _patch jsonb DEFAULT '{}'::jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE
  staff_tables text[] := ARRAY['cms_content','cms_faq','cms_posts','cms_stories','cms_testimonials','email_campaigns','email_subscribers','email_templates','email_segments','fundraiser_images','recipient_verifications','recipient_applications','coupon_procurement_batches'];
  admin_tables text[] := ARRAY['coupons'];
  cols text; b jsonb; a jsonb; res jsonb;
BEGIN
  IF NOT (_table = ANY(staff_tables) OR _table = ANY(admin_tables)) THEN RAISE EXCEPTION 'Table not allowed'; END IF;
  IF _op NOT IN ('insert','update','delete') THEN RAISE EXCEPTION 'Unknown operation'; END IF;
  IF _table = ANY(admin_tables) OR _op='delete' THEN
    IF NOT public.has_role(auth.uid(),'admin') THEN RAISE EXCEPTION 'Admin access required'; END IF;
  ELSIF NOT public.is_admin_staff(auth.uid()) THEN RAISE EXCEPTION 'Staff access required'; END IF;
  IF _table='coupons' AND _op='insert' THEN RAISE EXCEPTION 'Coupons are issued only by the payment system'; END IF;
  IF _op <> 'insert' AND (_ids IS NULL OR cardinality(_ids)=0) THEN RAISE EXCEPTION 'No records given'; END IF;
  IF _op <> 'delete' THEN
    SELECT string_agg(quote_ident(k), ',') INTO cols FROM jsonb_object_keys(_patch) k
    WHERE k NOT IN ('id','created_at') AND EXISTS (SELECT 1 FROM information_schema.columns c WHERE c.table_schema='public' AND c.table_name=_table AND c.column_name=k);
    IF cols IS NULL THEN RAISE EXCEPTION 'Nothing to save'; END IF;
  END IF;
  IF _op <> 'insert' THEN
    EXECUTE format('SELECT jsonb_agg(to_jsonb(t)) FROM public.%I t WHERE id = ANY($1)', _table) INTO b USING _ids;
  END IF;
  IF _op='insert' THEN
    EXECUTE format('INSERT INTO public.%1$I (%2$s) SELECT %2$s FROM jsonb_populate_record(NULL::public.%1$I, $1) RETURNING to_jsonb(%1$I.*)', _table, cols) INTO a USING _patch;
    res := a; a := jsonb_build_array(a);
  ELSIF _op='update' THEN
    EXECUTE format('UPDATE public.%1$I SET (%2$s) = (SELECT %2$s FROM jsonb_populate_record(NULL::public.%1$I, $1)) WHERE id = ANY($2)', _table, cols) USING _patch, _ids;
    EXECUTE format('SELECT jsonb_agg(to_jsonb(t)) FROM public.%I t WHERE id = ANY($1)', _table) INTO a USING _ids;
    res := a;
  ELSE
    EXECUTE format('DELETE FROM public.%I WHERE id = ANY($1)', _table) USING _ids;
  END IF;
  PERFORM public.log_admin_action(_table||'.'||_op, _table, array_to_string(COALESCE(_ids, ARRAY[(res->>'id')::uuid]), ','), b, a);
  RETURN res;
END $$;
REVOKE EXECUTE ON FUNCTION public.admin_write(text,text,uuid[],jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_write(text,text,uuid[],jsonb) TO authenticated;

CREATE OR REPLACE FUNCTION public.admin_list_users(_search text DEFAULT NULL, _role text DEFAULT NULL, _limit int DEFAULT 25, _offset int DEFAULT 0)
RETURNS TABLE(user_id uuid, email text, full_name text, city text, country text, created_at timestamptz, roles text[], total_count bigint)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  IF NOT public.is_admin_any(auth.uid()) THEN RAISE EXCEPTION 'Team access required'; END IF;
  RETURN QUERY
  WITH r AS (SELECT ur.user_id uid, array_agg(ur.role::text ORDER BY ur.role::text) rl FROM user_roles ur GROUP BY 1),
  f AS (SELECT p.user_id, p.email, p.full_name, p.city, p.country, p.created_at, COALESCE(r.rl,'{}') rl FROM profiles p LEFT JOIN r ON r.uid=p.user_id
        WHERE (_search IS NULL OR _search='' OR p.email ILIKE '%'||_search||'%' OR p.full_name ILIKE '%'||_search||'%')
          AND (_role IS NULL OR _role='' OR _role = ANY(COALESCE(r.rl,'{}'))))
  SELECT f.user_id,f.email,f.full_name,f.city,f.country,f.created_at,f.rl,COUNT(*) OVER() FROM f
  ORDER BY f.created_at DESC LIMIT LEAST(GREATEST(_limit,1),200) OFFSET GREATEST(_offset,0);
END $$;
REVOKE EXECUTE ON FUNCTION public.admin_list_users(text,text,int,int) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_list_users(text,text,int,int) TO authenticated;

CREATE OR REPLACE FUNCTION public.admin_analytics()
RETURNS json LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  IF NOT public.is_admin_any(auth.uid()) THEN RAISE EXCEPTION 'Team access required'; END IF;
  RETURN json_build_object(
    'users_total',(SELECT COUNT(*) FROM profiles),
    'users_by_month',(SELECT COALESCE(json_agg(t ORDER BY t.m),'[]') FROM (SELECT to_char(date_trunc('month',created_at),'YYYY-MM') m, COUNT(*) n FROM profiles GROUP BY 1) t),
    'roles',(SELECT COALESCE(json_object_agg(role, n),'{}') FROM (SELECT role::text role, COUNT(*) n FROM user_roles GROUP BY 1) t),
    'donations_by_status',(SELECT COALESCE(json_object_agg(s, json_build_object('n',n,'amount',a)),'{}') FROM (SELECT COALESCE(status,'unknown') s, COUNT(*) n, SUM(amount) a FROM donations GROUP BY 1) t),
    'donations_by_month',(SELECT COALESCE(json_agg(t ORDER BY t.m),'[]') FROM (SELECT to_char(date_trunc('month',created_at),'YYYY-MM') m, COUNT(*) n, SUM(amount) amount FROM donations WHERE status IN ('completed','succeeded') GROUP BY 1) t),
    'coupons_by_status',(SELECT COALESCE(json_object_agg(s, n),'{}') FROM (SELECT status::text s, COUNT(*) n FROM coupons GROUP BY 1) t),
    'brands',(SELECT COALESCE(json_agg(t ORDER BY t.amount DESC),'[]') FROM (SELECT brand_name, SUM(allocated_amount) amount FROM donation_brands GROUP BY 1) t));
END $$;
REVOKE EXECUTE ON FUNCTION public.admin_analytics() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_analytics() TO authenticated;

CREATE OR REPLACE FUNCTION public.admin_procurement_groups()
RETURNS TABLE(store_name text, value numeric, n bigint, oldest timestamptz)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  IF NOT public.is_admin_any(auth.uid()) THEN RAISE EXCEPTION 'Team access required'; END IF;
  RETURN QUERY SELECT c.store_name, COALESCE(c.value,c.expected_value), COUNT(*), MIN(c.created_at) FROM coupons c WHERE c.status='pending_procurement' GROUP BY 1,2 ORDER BY 3 DESC;
END $$;
REVOKE EXECUTE ON FUNCTION public.admin_procurement_groups() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_procurement_groups() TO authenticated;