-- ===== Column-level lockdown =====
REVOKE ALL ON public.coupons FROM anon;
REVOKE ALL ON public.coupons FROM authenticated;
GRANT SELECT (id, title, description, store_name, category, expiry_date, status, created_at, updated_at, partner_id, category_id, value, discount_percent, min_purchase, reserved_by, reserved_at, redeemed_by, redeemed_at, donation_id, donor_id, claimed_at, expected_value, tremendous_order_id, tremendous_reward_id, procurement_attempts, last_procurement_error, last_procurement_at, batch_id, returned_from_coupon_id, returned_from_fundraiser_id, returned_at, voided_at, void_reason, code_hint) ON public.coupons TO authenticated;
GRANT ALL ON public.coupons TO service_role;

DROP POLICY IF EXISTS "Users can view available coupons" ON public.coupons;
DROP POLICY IF EXISTS "Recipients can reserve coupons" ON public.coupons;
CREATE POLICY "Users view coupons reserved to them" ON public.coupons FOR SELECT TO authenticated
  USING (reserved_by = auth.uid() OR redeemed_by = auth.uid());

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname='supabase_realtime' AND schemaname='public' AND tablename='coupons') THEN
    ALTER PUBLICATION supabase_realtime DROP TABLE public.coupons;
  END IF;
END $$;

-- ===== Owner-only code readers =====
CREATE OR REPLACE FUNCTION public.get_coupon_code(_coupon_id uuid) RETURNS text
LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
  SELECT c.code FROM public.coupons c
  WHERE c.id = _coupon_id AND auth.uid() IS NOT NULL
    AND c.status::text NOT IN ('void','returned','in_stock')
    AND (c.reserved_by = auth.uid() OR c.redeemed_by = auth.uid());
$$;

CREATE OR REPLACE FUNCTION public.get_coupon_secret(_coupon_id uuid) RETURNS TABLE(code text, redemption_url text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
  SELECT c.code, c.redemption_url FROM public.coupons c
  WHERE c.id = _coupon_id AND auth.uid() IS NOT NULL
    AND c.status::text NOT IN ('void','returned','in_stock')
    AND (c.reserved_by = auth.uid() OR c.redeemed_by = auth.uid());
$$;
REVOKE EXECUTE ON FUNCTION public.get_coupon_secret(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_coupon_secret(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.get_my_fundraiser_coupons(_fundraiser_id uuid)
 RETURNS TABLE(id uuid, donation_id uuid, store_name text, value numeric, status text, code text, redemption_url text)
 LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE _owner boolean;
BEGIN
  IF auth.uid() IS NULL OR NOT public.is_fundraiser_team(_fundraiser_id, auth.uid()) THEN RAISE EXCEPTION 'Not allowed'; END IF;
  _owner := EXISTS (SELECT 1 FROM public.fundraisers WHERE fundraisers.id = _fundraiser_id AND user_id = auth.uid());
  RETURN QUERY
  SELECT c.id, c.donation_id, c.store_name, COALESCE(c.value, c.expected_value), c.status::text,
         CASE WHEN _owner AND c.status IN ('claimed','reserved','redeemed') AND (c.reserved_by = auth.uid() OR c.redeemed_by = auth.uid()) THEN c.code ELSE NULL END,
         CASE WHEN _owner AND c.status IN ('claimed','reserved','redeemed') AND (c.reserved_by = auth.uid() OR c.redeemed_by = auth.uid()) THEN c.redemption_url ELSE NULL END
  FROM public.coupons c JOIN public.donations d ON d.id = c.donation_id
  WHERE d.fundraiser_id = _fundraiser_id AND d.status = 'completed' AND c.status::text <> 'void'
  ORDER BY c.created_at;
END $$;

-- ===== Available-coupon claim flow (no codes exposed) =====
CREATE OR REPLACE FUNCTION public.list_available_coupons()
 RETURNS TABLE(id uuid, title text, store_name text, description text, value numeric, expiry_date date, status text, created_at timestamptz)
 LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
  SELECT c.id, c.title, c.store_name, c.description, c.value, c.expiry_date, c.status::text, c.created_at
  FROM public.coupons c
  WHERE auth.uid() IS NOT NULL AND c.status = 'available' AND c.reserved_by IS NULL AND c.donation_id IS NULL
  ORDER BY c.created_at DESC LIMIT 200;
$$;
CREATE OR REPLACE FUNCTION public.claim_available_coupon(_coupon_id uuid) RETURNS void
 LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  IF auth.uid() IS NULL OR NOT public.has_role(auth.uid(), 'recipient') THEN RAISE EXCEPTION 'Not allowed'; END IF;
  UPDATE public.coupons SET status = 'reserved', reserved_by = auth.uid(), reserved_at = now(), updated_at = now()
   WHERE id = _coupon_id AND status = 'available' AND reserved_by IS NULL AND donation_id IS NULL;
  IF NOT FOUND THEN RAISE EXCEPTION 'That coupon is no longer available'; END IF;
END $$;
REVOKE EXECUTE ON FUNCTION public.list_available_coupons() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.claim_available_coupon(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.list_available_coupons() TO authenticated;
GRANT EXECUTE ON FUNCTION public.claim_available_coupon(uuid) TO authenticated;

-- ===== Preserve a code as 'returned' (internal) =====
CREATE OR REPLACE FUNCTION public._preserve_code(_cid uuid, _reason text) RETURNS uuid
 LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE c record; _fid uuid; _new uuid;
BEGIN
  SELECT * INTO c FROM coupons WHERE id = _cid;
  IF NOT FOUND OR c.code IS NULL OR btrim(c.code) = '' THEN RETURN NULL; END IF;
  SELECT d.fundraiser_id INTO _fid FROM donations d WHERE d.id = c.donation_id;
  INSERT INTO coupons (title, store_name, value, expected_value, code, redemption_url, expiry_date, status, batch_id,
                       returned_from_coupon_id, returned_from_fundraiser_id, returned_at, void_reason)
  VALUES ('$' || coalesce(c.value, c.expected_value) || ' ' || c.store_name || ' coupon (returned)', c.store_name,
          coalesce(c.value, c.expected_value), coalesce(c.value, c.expected_value), c.code, c.redemption_url, c.expiry_date,
          'returned', c.batch_id, c.id, _fid, now(), _reason)
  RETURNING id INTO _new;
  PERFORM log_admin_action('coupon.code_returned', 'coupons', _new::text,
    jsonb_build_object('from_coupon', c.id, 'fundraiser_id', _fid, 'code', _mask_code(c.code), 'value', coalesce(c.value, c.expected_value)),
    jsonb_build_object('status', 'returned', 'reason', _reason));
  RETURN _new;
END $$;
REVOKE EXECUTE ON FUNCTION public._preserve_code(uuid, text) FROM PUBLIC, anon, authenticated;

-- ===== Stock move: void the stock row instead of deleting it =====
CREATE OR REPLACE FUNCTION public._give_stock(_target uuid, _stock uuid) RETURNS uuid
 LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE t record; s record; _owner uuid; _fid uuid;
BEGIN
  SELECT * INTO t FROM coupons WHERE id = _target FOR UPDATE;
  IF NOT FOUND OR t.donation_id IS NULL OR t.code IS NOT NULL OR t.status::text NOT IN ('pending_procurement','procurement_failed') THEN RAISE EXCEPTION 'That coupon is not waiting for a code'; END IF;
  SELECT * INTO s FROM coupons WHERE id = _stock AND status::text = 'in_stock' AND donation_id IS NULL FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Stock code not available'; END IF;
  IF s.store_name <> t.store_name OR coalesce(s.value,0) <> coalesce(t.value, t.expected_value, 0) THEN RAISE EXCEPTION 'Brand and amount must match'; END IF;
  SELECT fr.user_id, fr.id INTO _owner, _fid FROM donations d JOIN fundraisers fr ON fr.id = d.fundraiser_id WHERE d.id = t.donation_id;
  IF _owner IS NULL THEN RAISE EXCEPTION 'Donation has no fundraiser owner'; END IF;
  UPDATE coupons SET code = s.code, redemption_url = s.redemption_url, expiry_date = coalesce(s.expiry_date, t.expiry_date),
    batch_id = s.batch_id, value = s.value, status = 'claimed', reserved_by = _owner, reserved_at = now(), claimed_at = now(), updated_at = now()
   WHERE id = _target;
  -- the code now lives on the target coupon; keep the stock row as a void record pointing at it
  UPDATE coupons SET status = 'void', code = NULL, redemption_url = NULL, voided_at = now(), void_reason = 'moved to coupon ' || _target, updated_at = now()
   WHERE id = _stock;
  PERFORM log_admin_action('coupon.give_stock', 'coupons', _target::text,
    jsonb_build_object('stock_id', _stock, 'code', _mask_code(s.code)), jsonb_build_object('fundraiser_id', _fid, 'status', 'claimed'));
  RETURN _fid;
END $$;

CREATE OR REPLACE FUNCTION public.admin_delete_stock_code(_id uuid) RETURNS void
 LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE s record;
BEGIN
  IF NOT is_admin_staff(auth.uid()) THEN RAISE EXCEPTION 'Staff access required'; END IF;
  SELECT * INTO s FROM coupons WHERE id = _id AND status::text = 'in_stock' AND donation_id IS NULL FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Only unused stock codes can be removed'; END IF;
  UPDATE coupons SET status = 'void', voided_at = now(), void_reason = 'removed from stock', updated_at = now() WHERE id = _id;
  PERFORM log_admin_action('coupon.stock_void', 'coupons', _id::text,
    jsonb_build_object('status','in_stock','brand', s.store_name, 'value', s.value, 'code', _mask_code(s.code)), jsonb_build_object('status','void'));
END $$;

CREATE OR REPLACE FUNCTION public.admin_returned_code_action(_id uuid, _action text) RETURNS void
 LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE s record;
BEGIN
  IF NOT is_admin_staff(auth.uid()) THEN RAISE EXCEPTION 'Staff access required'; END IF;
  IF _action NOT IN ('restock','void') THEN RAISE EXCEPTION 'Unknown action'; END IF;
  SELECT * INTO s FROM coupons WHERE id = _id AND status::text = 'returned' AND donation_id IS NULL FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Only returned codes can be changed here'; END IF;
  IF _action = 'restock' THEN
    UPDATE coupons SET status = 'in_stock', title = '$' || coalesce(value, expected_value) || ' ' || store_name || ' coupon', updated_at = now() WHERE id = _id;
  ELSE
    UPDATE coupons SET status = 'void', voided_at = now(), void_reason = 'returned code voided', updated_at = now() WHERE id = _id;
  END IF;
  PERFORM log_admin_action(CASE WHEN _action = 'restock' THEN 'coupon.returned_restock' ELSE 'coupon.returned_void' END, 'coupons', _id::text,
    jsonb_build_object('status','returned','code',_mask_code(s.code),'value',s.value,'from_coupon',s.returned_from_coupon_id),
    jsonb_build_object('status', CASE WHEN _action = 'restock' THEN 'in_stock' ELSE 'void' END));
END $$;
REVOKE EXECUTE ON FUNCTION public.admin_returned_code_action(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_returned_code_action(uuid, text) TO authenticated;

-- ===== admin_set_coupon_code: keep a replaced code =====
CREATE OR REPLACE FUNCTION public.admin_set_coupon_code(_coupon_id uuid, _code text, _redemption_url text DEFAULT NULL::text) RETURNS jsonb
 LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE c record; f record; v_code text := btrim(coalesce(_code,'')); v_url text := nullif(btrim(coalesce(_redemption_url,'')),''); v_prof uuid; v_val numeric;
BEGIN
  IF NOT public.is_admin_staff(auth.uid()) THEN RAISE EXCEPTION 'Staff access required'; END IF;
  IF length(v_code) < 3 OR length(v_code) > 200 THEN RAISE EXCEPTION 'Code must be 3–200 characters'; END IF;
  IF v_url IS NOT NULL AND (v_url !~* '^https://' OR length(v_url) > 1000) THEN RAISE EXCEPTION 'Redemption link must start with https://'; END IF;
  SELECT * INTO c FROM public.coupons WHERE id = _coupon_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Coupon not found'; END IF;
  IF c.status = 'redeemed' THEN RAISE EXCEPTION 'Coupon already redeemed'; END IF;
  IF c.status::text IN ('void','returned','in_stock') THEN RAISE EXCEPTION 'Not a donation coupon'; END IF;
  SELECT fr.id, fr.user_id, fr.title INTO f FROM public.donations d JOIN public.fundraisers fr ON fr.id = d.fundraiser_id
   WHERE d.id = c.donation_id AND d.status = 'completed';
  IF NOT FOUND THEN RAISE EXCEPTION 'Coupon is not linked to a completed fundraiser donation'; END IF;
  IF c.code IS NOT NULL AND c.code IS DISTINCT FROM v_code THEN PERFORM public._preserve_code(c.id, 'code replaced'); END IF;
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

-- ===== Re-split without deleting =====
CREATE OR REPLACE FUNCTION public.admin_resplit_coupons(_donation_id uuid, _brand text, _values numeric[]) RETURNS integer
 LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE _old numeric; _n int; _locked int; _v numeric; _donor uuid; _exp date; _title text; _before jsonb; _ids uuid[]; i int; _after numeric;
BEGIN
  IF NOT public.is_admin_staff(auth.uid()) THEN RAISE EXCEPTION 'Staff access required'; END IF;
  IF _values IS NULL OR array_length(_values,1) IS NULL OR array_length(_values,1) > 50 THEN RAISE EXCEPTION 'Give between 1 and 50 coupon amounts'; END IF;
  FOREACH _v IN ARRAY _values LOOP
    IF _v IS NULL OR _v < 1 OR _v > 500 OR _v <> round(_v,2) THEN RAISE EXCEPTION 'Each coupon must be between $1 and $500'; END IF;
  END LOOP;
  IF NOT EXISTS (SELECT 1 FROM donations WHERE id = _donation_id AND fundraiser_id IS NOT NULL) THEN RAISE EXCEPTION 'Donation not linked to a fundraiser'; END IF;
  SELECT count(*) INTO _locked FROM coupons WHERE donation_id = _donation_id AND store_name = _brand AND status::text <> 'void'
    AND (code IS NOT NULL OR status NOT IN ('pending_procurement','procurement_failed'));
  IF _locked > 0 THEN RAISE EXCEPTION 'Some % coupons already have codes; use the coupon editor instead', _brand; END IF;
  SELECT coalesce(sum(coalesce(value, expected_value, 0)),0), count(*), max(donor_id::text)::uuid, max(expiry_date), max(title),
         jsonb_agg(jsonb_build_object('id',id,'value',coalesce(value,expected_value))), array_agg(id ORDER BY created_at, id)
    INTO _old, _n, _donor, _exp, _title, _before, _ids
    FROM coupons WHERE donation_id = _donation_id AND store_name = _brand AND status::text <> 'void';
  IF _n = 0 THEN RAISE EXCEPTION 'No coupons for that brand on this donation'; END IF;
  IF (SELECT sum(x) FROM unnest(_values) x) <> _old THEN RAISE EXCEPTION 'Amounts must add up to exactly $%', _old; END IF;
  FOR i IN 1..array_length(_values,1) LOOP
    IF i <= _n THEN
      UPDATE coupons SET value = _values[i], expected_value = _values[i], title = coalesce(_title, _brand || ' Gift'), updated_at = now() WHERE id = _ids[i];
    ELSE
      INSERT INTO coupons (donation_id, donor_id, title, store_name, value, expected_value, code, status, expiry_date)
      VALUES (_donation_id, _donor, coalesce(_title, _brand || ' Gift'), _brand, _values[i], _values[i], NULL, 'pending_procurement', _exp);
    END IF;
  END LOOP;
  IF _n > array_length(_values,1) THEN
    UPDATE coupons SET status = 'void', voided_at = now(), void_reason = 're-split', updated_at = now()
     WHERE id = ANY(_ids[array_length(_values,1)+1 : _n]);
  END IF;
  SELECT coalesce(sum(coalesce(value, expected_value, 0)),0) INTO _after FROM coupons WHERE donation_id = _donation_id AND store_name = _brand AND status::text <> 'void';
  IF _after <> _old THEN RAISE EXCEPTION 'Coupon total would change (% vs %)', _after, _old; END IF;
  PERFORM public.log_admin_action('resplit_coupons', 'coupons', _donation_id::text, jsonb_build_object('brand',_brand,'coupons',_before), jsonb_build_object('brand',_brand,'values',to_jsonb(_values)));
  RETURN array_length(_values,1);
END $$;

-- ===== Coupon group editor without deleting or destroying codes =====
CREATE OR REPLACE FUNCTION public.admin_save_coupon_group(_donation_id uuid, _brand text, _items jsonb) RETURNS uuid[]
 LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE f record; it jsonb; c record; _old numeric; _new numeric := 0; _n int; _donor uuid; _exp date; _title text; _after numeric;
  _before jsonb; _v numeric; _id uuid; _code text; _url text; _keep_ids uuid[] := '{}'; _changed uuid[] := '{}'; _prof uuid; _new_id uuid;
BEGIN
  IF NOT public.is_admin_staff(auth.uid()) THEN RAISE EXCEPTION 'Staff access required'; END IF;
  IF _items IS NULL OR jsonb_typeof(_items) <> 'array' OR jsonb_array_length(_items) < 1 OR jsonb_array_length(_items) > 50 THEN
    RAISE EXCEPTION 'Give between 1 and 50 coupons'; END IF;
  SELECT fr.id, fr.user_id, fr.title INTO f FROM donations d JOIN fundraisers fr ON fr.id = d.fundraiser_id
   WHERE d.id = _donation_id AND d.status = 'completed';
  IF NOT FOUND THEN RAISE EXCEPTION 'Donation is not a completed fundraiser donation'; END IF;
  SELECT coalesce(sum(coalesce(value, expected_value, 0)),0), count(*), max(donor_id::text)::uuid, max(expiry_date), max(title),
         jsonb_agg(jsonb_build_object('id',id,'value',coalesce(value,expected_value),'status',status,'had_code',code IS NOT NULL))
    INTO _old, _n, _donor, _exp, _title, _before
    FROM coupons WHERE donation_id = _donation_id AND store_name = _brand AND status::text <> 'void';
  IF _n = 0 THEN RAISE EXCEPTION 'No coupons for that brand on this donation'; END IF;

  FOR it IN SELECT * FROM jsonb_array_elements(_items) LOOP
    _v := (it->>'value')::numeric;
    IF _v IS NULL OR _v < 1 OR _v > 500 OR _v <> round(_v,2) THEN RAISE EXCEPTION 'Each coupon must be between $1 and $500'; END IF;
    IF it ? 'code' THEN _code := btrim(coalesce(it->>'code',''));
      IF _code <> '' AND (length(_code) < 3 OR length(_code) > 200) THEN RAISE EXCEPTION 'Code must be 3–200 characters'; END IF; END IF;
    IF it ? 'redemption_url' THEN _url := nullif(btrim(coalesce(it->>'redemption_url','')),'');
      IF _url IS NOT NULL AND (_url !~* '^https://' OR length(_url) > 1000) THEN RAISE EXCEPTION 'Redemption link must start with https://'; END IF; END IF;
    _new := _new + _v;
  END LOOP;
  IF _new <> _old THEN RAISE EXCEPTION 'Amounts must add up to exactly $%', _old; END IF;

  FOR c IN SELECT * FROM coupons WHERE donation_id = _donation_id AND store_name = _brand AND status = 'redeemed' LOOP
    IF NOT EXISTS (SELECT 1 FROM jsonb_array_elements(_items) x WHERE nullif(x->>'id','')::uuid = c.id AND (x->>'value')::numeric = coalesce(c.value,c.expected_value)) THEN
      RAISE EXCEPTION 'Used coupons cannot be changed or removed'; END IF;
  END LOOP;

  FOR it IN SELECT * FROM jsonb_array_elements(_items) LOOP
    _v := (it->>'value')::numeric;
    _id := nullif(it->>'id','')::uuid;
    IF _id IS NOT NULL THEN
      SELECT * INTO c FROM coupons WHERE id = _id AND donation_id = _donation_id AND store_name = _brand AND status::text <> 'void' FOR UPDATE;
      IF NOT FOUND THEN RAISE EXCEPTION 'Coupon does not belong to this donation'; END IF;
      IF _id = ANY(_keep_ids) THEN RAISE EXCEPTION 'Duplicate coupon in request'; END IF;
      _keep_ids := _keep_ids || _id;
      CONTINUE WHEN c.status = 'redeemed';
      _code := CASE WHEN it ? 'code' THEN nullif(btrim(coalesce(it->>'code','')),'')
                    WHEN _v = coalesce(c.value,c.expected_value) THEN c.code ELSE NULL END;
      _url := CASE WHEN it ? 'redemption_url' THEN nullif(btrim(coalesce(it->>'redemption_url','')),'')
                   WHEN _code IS NULL THEN NULL ELSE c.redemption_url END;
      IF c.code IS NOT NULL AND (_code IS DISTINCT FROM c.code OR _v <> coalesce(c.value,c.expected_value)) THEN
        PERFORM public._preserve_code(c.id, CASE WHEN _code IS NULL AND _v = coalesce(c.value,c.expected_value) THEN 'code cleared'
                                                 WHEN _v <> coalesce(c.value,c.expected_value) THEN 'amount changed' ELSE 'code replaced' END);
        IF _v <> coalesce(c.value,c.expected_value) AND _code IS NOT DISTINCT FROM c.code THEN _code := NULL; _url := NULL; END IF;
      END IF;
      IF _code IS NOT NULL AND _code IS DISTINCT FROM c.code THEN _changed := _changed || _id; END IF;
      UPDATE coupons SET value = _v, expected_value = _v, code = _code, redemption_url = _url,
        status = CASE WHEN _code IS NULL THEN 'pending_procurement'::coupon_status ELSE 'claimed'::coupon_status END,
        reserved_by = CASE WHEN _code IS NULL THEN NULL ELSE f.user_id END,
        reserved_at = CASE WHEN _code IS NULL THEN NULL ELSE coalesce(reserved_at, now()) END,
        claimed_at = CASE WHEN _code IS NULL THEN NULL ELSE coalesce(claimed_at, now()) END,
        last_procurement_error = NULL, updated_at = now()
      WHERE id = _id;
    ELSE
      _code := nullif(btrim(coalesce(it->>'code','')),'');
      _url := CASE WHEN _code IS NULL THEN NULL ELSE nullif(btrim(coalesce(it->>'redemption_url','')),'') END;
      INSERT INTO coupons (donation_id, donor_id, title, store_name, value, expected_value, code, redemption_url, status, expiry_date, reserved_by, reserved_at, claimed_at)
      VALUES (_donation_id, _donor, coalesce(_title, _brand || ' Gift'), _brand, _v, _v, _code, _url,
        CASE WHEN _code IS NULL THEN 'pending_procurement'::coupon_status ELSE 'claimed'::coupon_status END, _exp,
        CASE WHEN _code IS NULL THEN NULL ELSE f.user_id END, CASE WHEN _code IS NULL THEN NULL ELSE now() END, CASE WHEN _code IS NULL THEN NULL ELSE now() END)
      RETURNING id INTO _new_id;
      _keep_ids := _keep_ids || _new_id;
      IF _code IS NOT NULL THEN _changed := _changed || _new_id; END IF;
    END IF;
  END LOOP;

  -- rows no longer needed: keep any code as 'returned', then void (never delete)
  FOR c IN SELECT * FROM coupons WHERE donation_id = _donation_id AND store_name = _brand AND status::text NOT IN ('redeemed','void') AND NOT (id = ANY(_keep_ids)) FOR UPDATE LOOP
    PERFORM public._preserve_code(c.id, 'coupon removed');
    UPDATE coupons SET status = 'void', code = NULL, redemption_url = NULL, reserved_by = NULL, voided_at = now(), void_reason = 'removed in coupon editor', updated_at = now() WHERE id = c.id;
  END LOOP;

  SELECT coalesce(sum(coalesce(value, expected_value, 0)),0) INTO _after FROM coupons WHERE donation_id = _donation_id AND store_name = _brand AND status::text <> 'void';
  IF _after <> _old THEN RAISE EXCEPTION 'Coupon total would change (% vs %)', _after, _old; END IF;

  PERFORM public.log_admin_action('save_coupon_group', 'coupons', _donation_id::text,
    jsonb_build_object('brand',_brand,'coupons',_before),
    jsonb_build_object('brand',_brand,'coupons',(SELECT jsonb_agg(jsonb_build_object('id',id,'value',value,'status',status,'has_code',code IS NOT NULL)) FROM coupons WHERE donation_id=_donation_id AND store_name=_brand)));

  IF array_length(_changed,1) > 0 THEN
    SELECT id INTO _prof FROM profiles WHERE user_id = f.user_id;
    IF _prof IS NOT NULL THEN
      INSERT INTO notifications(user_id, title, message)
      VALUES (_prof, 'You received a coupon', _brand || ' coupon code(s) from a donation to "' || f.title || '" are ready on your fundraiser page.');
    END IF;
  END IF;
  RETURN _changed;
END $$;

-- ===== Reads exclude void =====
CREATE OR REPLACE FUNCTION public.admin_fundraiser_coupons(_fundraiser_id uuid)
 RETURNS TABLE(id uuid, donation_id uuid, donation_at timestamp with time zone, store_name text, value numeric, status text, has_code boolean, code_hint text, redemption_url text, updated_at timestamp with time zone)
 LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  IF NOT public.is_admin_any(auth.uid()) THEN RAISE EXCEPTION 'Admin access required'; END IF;
  RETURN QUERY
  SELECT c.id, c.donation_id, d.created_at, c.store_name, COALESCE(c.value, c.expected_value), c.status::text,
         (c.code IS NOT NULL AND c.code <> ''), _mask_code(nullif(c.code,'')), c.redemption_url, c.updated_at
  FROM public.coupons c JOIN public.donations d ON d.id = c.donation_id
  WHERE d.fundraiser_id = _fundraiser_id AND d.status = 'completed' AND c.status::text <> 'void'
  ORDER BY d.created_at DESC, c.created_at;
END $$;

DROP FUNCTION IF EXISTS public.admin_inventory_summary();
CREATE FUNCTION public.admin_inventory_summary()
 RETURNS TABLE(store_name text, value numeric, in_stock bigint, waiting bigint, given bigint, used bigint, expired bigint, returned bigint)
 LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  IF NOT is_admin_any(auth.uid()) THEN RAISE EXCEPTION 'Team access required'; END IF;
  RETURN QUERY SELECT c.store_name, coalesce(c.value, c.expected_value) v,
    count(*) FILTER (WHERE c.status::text = 'in_stock' AND (c.expiry_date IS NULL OR c.expiry_date >= current_date)),
    count(*) FILTER (WHERE c.donation_id IS NOT NULL AND c.code IS NULL AND c.status::text IN ('pending_procurement','procurement_failed')),
    count(*) FILTER (WHERE c.donation_id IS NOT NULL AND c.code IS NOT NULL AND c.status::text NOT IN ('redeemed','expired')),
    count(*) FILTER (WHERE c.status::text = 'redeemed'),
    count(*) FILTER (WHERE c.status::text = 'expired' OR (c.status::text = 'in_stock' AND c.expiry_date < current_date)),
    count(*) FILTER (WHERE c.status::text = 'returned')
  FROM coupons c WHERE c.status::text <> 'void' GROUP BY 1, 2 ORDER BY 1, 2;
END $$;
REVOKE EXECUTE ON FUNCTION public.admin_inventory_summary() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_inventory_summary() TO authenticated;

CREATE OR REPLACE FUNCTION public.admin_code_usage(_state text DEFAULT 'all'::text, _search text DEFAULT NULL::text, _limit integer DEFAULT 25, _offset integer DEFAULT 0)
 RETURNS TABLE(id uuid, store_name text, value numeric, state text, code_hint text, redemption_url text, expiry_date date, batch_name text, fundraiser_id uuid, fundraiser_title text, donation_id uuid, given_at timestamp with time zone, used_at timestamp with time zone, created_at timestamp with time zone, total_count bigint)
 LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  IF NOT is_admin_any(auth.uid()) THEN RAISE EXCEPTION 'Team access required'; END IF;
  RETURN QUERY WITH x AS (
    SELECT c.id, c.store_name, coalesce(c.value, c.expected_value) value,
      CASE WHEN c.status::text = 'void' THEN 'void'
           WHEN c.status::text = 'returned' THEN 'returned'
           WHEN c.status::text = 'redeemed' THEN 'used'
           WHEN c.status::text = 'expired' OR (c.expiry_date < current_date AND c.status::text <> 'redeemed') THEN 'expired'
           WHEN c.status::text = 'in_stock' THEN 'in_stock'
           WHEN c.donation_id IS NOT NULL AND c.code IS NULL THEN 'waiting'
           ELSE 'given' END state,
      _mask_code(c.code) code_hint, c.redemption_url, c.expiry_date, b.name batch_name,
      coalesce(fr.id, c.returned_from_fundraiser_id) fid, coalesce(fr.title, rf.title) ftitle, c.donation_id,
      coalesce(c.claimed_at, c.reserved_at, c.returned_at) given_at, c.redeemed_at, c.created_at
    FROM coupons c LEFT JOIN coupon_procurement_batches b ON b.id = c.batch_id
    LEFT JOIN donations d ON d.id = c.donation_id LEFT JOIN fundraisers fr ON fr.id = d.fundraiser_id
    LEFT JOIN fundraisers rf ON rf.id = c.returned_from_fundraiser_id)
  SELECT x.*, count(*) OVER () FROM x
   WHERE ((_state = 'all' AND x.state <> 'void') OR x.state = _state)
     AND (_search IS NULL OR _search = '' OR x.store_name ILIKE '%'||_search||'%' OR x.ftitle ILIKE '%'||_search||'%' OR x.batch_name ILIKE '%'||_search||'%')
   ORDER BY x.created_at DESC LIMIT least(greatest(_limit,1),200) OFFSET greatest(_offset,0);
END $$;

CREATE OR REPLACE FUNCTION public.get_landing_stats() RETURNS json
 LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
  select json_build_object(
    'donations_count', (select count(*) from donations where status='completed'),
    'total_raised', (select coalesce(sum(amount),0) from donations where status='completed'),
    'coupons_created', (select count(*) from coupons where donation_id is not null and status::text <> 'void'),
    'coupons_claimed', (select count(*) from coupons where donation_id is not null and status in ('claimed','redeemed')),
    'active_fundraisers', (select count(*) from fundraisers where status='active'),
    'brands', coalesce((select json_agg(t order by t.total desc) from (
        select db.brand_name as name, round(sum(db.allocated_amount)::numeric,2) as total
        from donation_brands db join donations d on d.id=db.donation_id
        where d.status='completed' group by db.brand_name having sum(db.allocated_amount)>0) t), '[]'::json)
  );
$$;

CREATE OR REPLACE FUNCTION public.get_proof_stats() RETURNS json
 LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
  SELECT json_build_object(
    'issued_value_month', (SELECT coalesce(sum(coalesce(value, expected_value, 0)),0) FROM coupons WHERE created_at >= date_trunc('month', now()) AND donation_id IS NOT NULL AND status::text <> 'void'),
    'redeemed_month', (SELECT count(*) FROM coupons WHERE redeemed_at >= date_trunc('month', now()) AND donation_id IS NOT NULL AND status::text <> 'void'),
    'issued_value_total', (SELECT coalesce(sum(coalesce(value, expected_value, 0)),0) FROM coupons WHERE donation_id IS NOT NULL AND status::text <> 'void'),
    'redeemed_total', (SELECT count(*) FROM coupons WHERE donation_id IS NOT NULL AND status::text <> 'void' AND (redeemed_at IS NOT NULL OR status = 'redeemed')))
$$;

CREATE OR REPLACE FUNCTION public.get_completed_fundraisers()
 RETURNS TABLE(id uuid, title text, unique_slug text, category text, cover_photo_url text, goal numeric, raised numeric, coupons_issued bigint, coupons_redeemed bigint)
 LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
  WITH t AS (
    SELECT f.id, f.title, f.unique_slug, f.category, f.cover_photo_url, f.monthly_goal, f.status,
      COALESCE((SELECT sum(d.amount) FROM donations d WHERE d.fundraiser_id = f.id AND d.status IN ('completed','succeeded')),0) raised
    FROM fundraisers f WHERE f.archived_at IS NULL AND f.status IN ('active','completed','paused'))
  SELECT t.id, t.title, t.unique_slug, t.category, t.cover_photo_url, t.monthly_goal, t.raised,
    (SELECT count(*) FROM coupons c JOIN donations d ON d.id = c.donation_id WHERE d.fundraiser_id = t.id AND c.status::text <> 'void'),
    (SELECT count(*) FROM coupons c JOIN donations d ON d.id = c.donation_id WHERE d.fundraiser_id = t.id AND c.status::text <> 'void' AND (c.redeemed_at IS NOT NULL OR c.status = 'redeemed'))
  FROM t WHERE t.status = 'completed' OR (t.monthly_goal > 0 AND t.raised >= t.monthly_goal)
$$;

CREATE OR REPLACE FUNCTION public.get_fundraiser_coupon_trail(_fundraiser_id uuid)
 RETURNS TABLE(converted numeric, redeemed numeric, coupons_count bigint)
 LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
  SELECT COALESCE(SUM(COALESCE(c.value,c.expected_value,0)),0),
         COALESCE(SUM(CASE WHEN c.status='redeemed' THEN COALESCE(c.value,c.expected_value,0) ELSE 0 END),0),
         COUNT(c.id)
  FROM public.coupons c JOIN public.donations d ON d.id = c.donation_id
  WHERE d.fundraiser_id = _fundraiser_id AND d.status IN ('completed','succeeded') AND c.status::text <> 'void'
$$;

CREATE OR REPLACE FUNCTION public.get_impact_stats()
 RETURNS TABLE(total_raised numeric, total_donations bigint, total_coupons bigint, active_fundraisers bigint, raised_today numeric, donations_today bigint)
 LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
  SELECT
    COALESCE((SELECT SUM(amount) FROM public.donations WHERE status IN ('completed','succeeded')), 0)::numeric,
    COALESCE((SELECT COUNT(*) FROM public.donations WHERE status IN ('completed','succeeded')), 0)::bigint,
    COALESCE((SELECT COUNT(*) FROM public.coupons WHERE donation_id IS NOT NULL AND status::text <> 'void'), 0)::bigint,
    COALESCE((SELECT COUNT(*) FROM public.fundraisers WHERE status = 'active'), 0)::bigint,
    COALESCE((SELECT SUM(amount) FROM public.donations WHERE status IN ('completed','succeeded') AND created_at > now() - interval '1 day'), 0)::numeric,
    COALESCE((SELECT COUNT(*) FROM public.donations WHERE status IN ('completed','succeeded') AND created_at > now() - interval '1 day'), 0)::bigint;
$$;

CREATE OR REPLACE FUNCTION public.admin_analytics(_days integer DEFAULT 30) RETURNS json
 LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE since timestamptz := CASE WHEN _days IS NULL OR _days <= 0 THEN '-infinity'::timestamptz ELSE now() - make_interval(days => _days) END;
BEGIN
  IF NOT public.is_admin_any(auth.uid()) THEN RAISE EXCEPTION 'Team access required'; END IF;
  RETURN json_build_object(
    'users_total',(SELECT COUNT(*) FROM profiles),
    'users_in_range',(SELECT COUNT(*) FROM profiles WHERE created_at>=since),
    'raised_in_range',(SELECT COALESCE(SUM(amount),0) FROM donations WHERE status IN ('completed','succeeded') AND created_at>=since),
    'donations_in_range',(SELECT COUNT(*) FROM donations WHERE status IN ('completed','succeeded') AND created_at>=since),
    'coupons_total',(SELECT COUNT(*) FROM coupons WHERE donation_id IS NOT NULL AND status::text <> 'void'),
    'coupons_redeemed',(SELECT COUNT(*) FROM coupons WHERE status='redeemed'),
    'signups',(SELECT COALESCE(json_agg(t ORDER BY t.d),'[]') FROM (SELECT to_char(created_at::date,'YYYY-MM-DD') d, COUNT(*) n FROM profiles WHERE created_at>=since GROUP BY 1) t),
    'donations',(SELECT COALESCE(json_agg(t ORDER BY t.d),'[]') FROM (SELECT to_char(created_at::date,'YYYY-MM-DD') d, SUM(amount) amount FROM donations WHERE status IN ('completed','succeeded') AND created_at>=since GROUP BY 1) t),
    'roles',(SELECT COALESCE(json_agg(t),'[]') FROM (SELECT role::text name, COUNT(*) value FROM user_roles GROUP BY 1) t),
    'coupon_status',(SELECT COALESCE(json_agg(t),'[]') FROM (SELECT status::text name, COUNT(*) value FROM coupons WHERE status::text <> 'void' GROUP BY 1) t),
    'brands',(SELECT COALESCE(json_agg(t ORDER BY t.amount DESC),'[]') FROM (SELECT brand_name name, ROUND(SUM(allocated_amount)::numeric,2) amount FROM donation_brands db JOIN donations d ON d.id=db.donation_id WHERE d.status IN ('completed','succeeded') GROUP BY 1 ORDER BY 2 DESC LIMIT 8) t),
    'recent_users',(SELECT COALESCE(json_agg(t),'[]') FROM (SELECT email, full_name, created_at FROM profiles ORDER BY created_at DESC LIMIT 10) t));
END $$;

-- ===== Fix 4 data fix (audited): any 'available' coded coupons =====
DO $$ DECLARE r record; _owner uuid; BEGIN
  FOR r IN SELECT c.* FROM coupons c WHERE c.status = 'available' AND c.code IS NOT NULL LOOP
    SELECT fr.user_id INTO _owner FROM donations d JOIN fundraisers fr ON fr.id = d.fundraiser_id WHERE d.id = r.donation_id;
    IF _owner IS NOT NULL THEN
      UPDATE coupons SET status = 'claimed', reserved_by = _owner, reserved_at = coalesce(reserved_at, now()), claimed_at = coalesce(claimed_at, now()) WHERE id = r.id;
    ELSIF r.donation_id IS NULL THEN
      UPDATE coupons SET status = 'in_stock' WHERE id = r.id;
    END IF;
    INSERT INTO admin_audit_log(actor_id, action, table_name, record_id, before, after)
    VALUES (NULL, 'coupon.available_fix', 'coupons', r.id::text, jsonb_build_object('status','available'), jsonb_build_object('owner', _owner));
  END LOOP;
END $$;