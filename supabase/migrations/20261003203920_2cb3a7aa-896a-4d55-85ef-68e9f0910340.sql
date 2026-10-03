CREATE OR REPLACE FUNCTION public.admin_save_coupon_group(_donation_id uuid, _brand text, _items jsonb)
RETURNS uuid[] LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE f record; it jsonb; c record; _old numeric; _new numeric := 0; _n int; _donor uuid; _exp date; _title text;
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
    FROM coupons WHERE donation_id = _donation_id AND store_name = _brand;
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

  -- redeemed coupons must be included unchanged
  FOR c IN SELECT * FROM coupons WHERE donation_id = _donation_id AND store_name = _brand AND status = 'redeemed' LOOP
    IF NOT EXISTS (SELECT 1 FROM jsonb_array_elements(_items) x WHERE (x->>'id')::uuid = c.id AND (x->>'value')::numeric = coalesce(c.value,c.expected_value)) THEN
      RAISE EXCEPTION 'Used coupons cannot be changed or removed'; END IF;
  END LOOP;

  FOR it IN SELECT * FROM jsonb_array_elements(_items) LOOP
    _v := (it->>'value')::numeric;
    _id := nullif(it->>'id','')::uuid;
    IF _id IS NOT NULL THEN
      SELECT * INTO c FROM coupons WHERE id = _id AND donation_id = _donation_id AND store_name = _brand FOR UPDATE;
      IF NOT FOUND THEN RAISE EXCEPTION 'Coupon does not belong to this donation'; END IF;
      _keep_ids := _keep_ids || _id;
      CONTINUE WHEN c.status = 'redeemed';
      _code := CASE WHEN it ? 'code' THEN nullif(btrim(coalesce(it->>'code','')),'')
                    WHEN _v = coalesce(c.value,c.expected_value) THEN c.code ELSE NULL END;
      _url := CASE WHEN it ? 'redemption_url' THEN nullif(btrim(coalesce(it->>'redemption_url','')),'')
                   WHEN _code IS NULL THEN NULL ELSE c.redemption_url END;
      IF _code IS NOT NULL AND _code IS DISTINCT FROM c.code THEN _changed := _changed || _id; END IF;
      UPDATE coupons SET value = _v, expected_value = _v, code = _code, redemption_url = _url,
        status = CASE WHEN _code IS NULL THEN 'pending_procurement'::coupon_status ELSE 'claimed'::coupon_status END,
        reserved_by = CASE WHEN _code IS NULL THEN NULL ELSE f.user_id END,
        reserved_at = CASE WHEN _code IS NULL THEN NULL ELSE coalesce(reserved_at, now()) END,
        claimed_at = CASE WHEN _code IS NULL THEN NULL ELSE coalesce(claimed_at, now()) END,
        last_procurement_error = NULL
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

  DELETE FROM coupons WHERE donation_id = _donation_id AND store_name = _brand AND status <> 'redeemed' AND NOT (id = ANY(_keep_ids));

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
REVOKE ALL ON FUNCTION public.admin_save_coupon_group(uuid,text,jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_save_coupon_group(uuid,text,jsonb) TO authenticated;