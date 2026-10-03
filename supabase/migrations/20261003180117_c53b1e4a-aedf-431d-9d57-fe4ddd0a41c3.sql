CREATE OR REPLACE FUNCTION public.admin_fundraiser_coupons(_fundraiser_id uuid)
RETURNS TABLE(id uuid, donation_id uuid, donation_at timestamptz, store_name text, value numeric, status text, has_code boolean, code_hint text, redemption_url text, updated_at timestamptz)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.is_admin_any(auth.uid()) THEN RAISE EXCEPTION 'Admin access required'; END IF;
  RETURN QUERY
  SELECT c.id, c.donation_id, d.created_at, c.store_name, COALESCE(c.value, c.expected_value), c.status::text,
         (c.code IS NOT NULL AND c.code <> ''), CASE WHEN c.code IS NULL OR c.code = '' THEN NULL ELSE '••••' || right(c.code, 4) END,
         c.redemption_url, c.updated_at
  FROM public.coupons c JOIN public.donations d ON d.id = c.donation_id
  WHERE d.fundraiser_id = _fundraiser_id AND d.status = 'completed'
  ORDER BY d.created_at DESC, c.created_at;
END $$;

CREATE OR REPLACE FUNCTION public.admin_set_coupon_code(_coupon_id uuid, _code text, _redemption_url text DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE c record; f record; v_code text := btrim(coalesce(_code,'')); v_url text := nullif(btrim(coalesce(_redemption_url,'')),''); v_prof uuid; v_val numeric;
BEGIN
  IF NOT public.is_admin_staff(auth.uid()) THEN RAISE EXCEPTION 'Staff access required'; END IF;
  IF length(v_code) < 3 OR length(v_code) > 200 THEN RAISE EXCEPTION 'Code must be 3–200 characters'; END IF;
  IF v_url IS NOT NULL AND (v_url !~* '^https://' OR length(v_url) > 1000) THEN RAISE EXCEPTION 'Redemption link must start with https://'; END IF;
  SELECT * INTO c FROM public.coupons WHERE id = _coupon_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Coupon not found'; END IF;
  IF c.status = 'redeemed' THEN RAISE EXCEPTION 'Coupon already redeemed'; END IF;
  SELECT fr.id, fr.user_id, fr.title INTO f FROM public.donations d JOIN public.fundraisers fr ON fr.id = d.fundraiser_id
   WHERE d.id = c.donation_id AND d.status = 'completed';
  IF NOT FOUND THEN RAISE EXCEPTION 'Coupon is not linked to a completed fundraiser donation'; END IF;
  v_val := COALESCE(c.value, c.expected_value);
  UPDATE public.coupons SET code = v_code, redemption_url = v_url, value = v_val,
    status = 'claimed', reserved_by = f.user_id, reserved_at = COALESCE(reserved_at, now()), claimed_at = COALESCE(claimed_at, now()),
    last_procurement_error = NULL
  WHERE id = _coupon_id;
  PERFORM public.log_admin_action('coupon_code_set', 'coupons', _coupon_id::text,
    jsonb_build_object('status', c.status, 'had_code', c.code IS NOT NULL),
    jsonb_build_object('status', 'claimed', 'fundraiser_id', f.id, 'owner', f.user_id));
  SELECT id INTO v_prof FROM public.profiles WHERE user_id = f.user_id;
  IF v_prof IS NOT NULL THEN
    INSERT INTO public.notifications(user_id, title, message)
    VALUES (v_prof, 'You received a coupon', 'A $' || v_val::text || ' ' || c.store_name || ' coupon from a donation to "' || f.title || '" is ready on your fundraiser page.');
  END IF;
  RETURN jsonb_build_object('fundraiser_id', f.id, 'value', v_val, 'store_name', c.store_name, 'replaced', c.code IS NOT NULL);
END $$;

CREATE OR REPLACE FUNCTION public.get_my_fundraiser_coupons(_fundraiser_id uuid)
RETURNS TABLE(id uuid, donation_id uuid, store_name text, value numeric, status text, code text, redemption_url text)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF auth.uid() IS NULL OR NOT public.is_fundraiser_team(_fundraiser_id, auth.uid()) THEN RAISE EXCEPTION 'Not allowed'; END IF;
  RETURN QUERY
  SELECT c.id, c.donation_id, c.store_name, COALESCE(c.value, c.expected_value), c.status::text,
         CASE WHEN c.status IN ('claimed','reserved','redeemed') THEN c.code ELSE NULL END, c.redemption_url
  FROM public.coupons c JOIN public.donations d ON d.id = c.donation_id
  WHERE d.fundraiser_id = _fundraiser_id AND d.status = 'completed'
  ORDER BY c.created_at;
END $$;

REVOKE ALL ON FUNCTION public.admin_fundraiser_coupons(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.admin_set_coupon_code(uuid, text, text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.get_my_fundraiser_coupons(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_fundraiser_coupons(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_set_coupon_code(uuid, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_my_fundraiser_coupons(uuid) TO authenticated;