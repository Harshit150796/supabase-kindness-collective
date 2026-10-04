ALTER TABLE public.coupons ADD COLUMN IF NOT EXISTS code_pin text;
REVOKE ALL (code_pin) ON public.coupons FROM anon, authenticated;
UPDATE public.admin_settings SET allow_manual_prepaid = false WHERE id = 1;

CREATE OR REPLACE FUNCTION public._preserve_code(_cid uuid, _reason text)
 RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE c public.coupons; _fid uuid; _new uuid;
BEGIN
  SELECT * INTO c FROM coupons WHERE id = _cid;
  IF NOT FOUND OR NOT c.has_credential THEN RETURN NULL; END IF;
  SELECT d.fundraiser_id INTO _fid FROM donations d WHERE d.id = c.donation_id;
  INSERT INTO coupons (title, store_name, value, expected_value, code, code_pin, redemption_url, expiry_date, status, batch_id,
                       returned_from_coupon_id, returned_from_fundraiser_id, returned_at, void_reason,
                       credential_type, secret_cipher, card_last4, card_exp, value_expires_on, recipient_instructions, issued_brand)
  VALUES ('$' || coalesce(c.value, c.expected_value) || ' ' || c.store_name || ' coupon (returned)', c.store_name,
          coalesce(c.value, c.expected_value), coalesce(c.value, c.expected_value), c.code, c.code_pin, c.redemption_url, c.expiry_date,
          'returned', c.batch_id, c.id, _fid, now(), _reason,
          c.credential_type, c.secret_cipher, c.card_last4, c.card_exp, c.value_expires_on, c.recipient_instructions, c.issued_brand)
  RETURNING id INTO _new;
  PERFORM log_admin_action('coupon.code_returned', 'coupons', _new::text,
    jsonb_build_object('from_coupon', c.id, 'fundraiser_id', _fid, 'code', _cred_mask(c), 'type', coalesce(c.credential_type,'code'), 'value', coalesce(c.value, c.expected_value)),
    jsonb_build_object('status', 'returned', 'reason', _reason));
  RETURN _new;
END $function$;

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
    notification_recipients = CASE WHEN _patch ? 'notification_recipients' THEN ARRAY(SELECT lower(btrim(x)) FROM jsonb_array_elements_text(_patch->'notification_recipients') x WHERE x ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$') ELSE notification_recipients END,
    updated_at=now(), updated_by=auth.uid() WHERE id=1;
  SELECT to_jsonb(s) INTO a FROM public.admin_settings s WHERE id=1;
  PERFORM public.log_admin_action('settings.update','admin_settings','1',b,a);
END $function$;

CREATE OR REPLACE FUNCTION public.owner_reveal_coupon(_coupon_id uuid)
 RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE c record; f record; v_first boolean := false;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Not allowed'; END IF;
  SELECT * INTO c FROM public.coupons WHERE id = _coupon_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Not allowed'; END IF;
  SELECT fr.id, fr.user_id INTO f FROM public.donations d JOIN public.fundraisers fr ON fr.id = d.fundraiser_id WHERE d.id = c.donation_id AND d.status = 'completed';
  IF NOT FOUND OR f.user_id <> auth.uid() THEN RAISE EXCEPTION 'Not allowed'; END IF;
  IF c.status::text NOT IN ('claimed','reserved','redeemed') OR NOT c.has_credential
     OR NOT (c.reserved_by = auth.uid() OR c.redeemed_by = auth.uid()) THEN RAISE EXCEPTION 'Coupon being prepared'; END IF;
  IF c.revealed_at IS NULL THEN
    UPDATE public.coupons SET revealed_at = now(), revealed_by = auth.uid() WHERE id = _coupon_id AND revealed_at IS NULL;
    v_first := FOUND;
  END IF;
  IF v_first THEN
    INSERT INTO public.donor_impact_events(donation_id, coupon_id, kind) VALUES (c.donation_id, c.id, 'received') ON CONFLICT DO NOTHING;
  END IF;
  INSERT INTO public.coupon_reveal_log(coupon_id, user_id, first_reveal) VALUES (c.id, auth.uid(), v_first);
  PERFORM public.log_admin_action(CASE WHEN v_first THEN 'coupon_first_reveal' ELSE 'coupon_reveal' END, 'coupons', c.id::text, NULL,
    jsonb_build_object('fundraiser_id', f.id, 'by', 'owner'));
  RETURN jsonb_build_object('code', c.code, 'pin', c.code_pin, 'redemption_url', c.redemption_url, 'revealed_at', COALESCE(c.revealed_at, now()), 'first', v_first,
    'type', coalesce(c.credential_type, 'code'), 'card_last4', c.card_last4, 'value_expires_on', c.value_expires_on,
    'instructions', c.recipient_instructions, 'issued_brand', coalesce(c.issued_brand, c.store_name));
END $function$;

CREATE OR REPLACE FUNCTION public.admin_save_coupon_group_v2(_actor uuid, _donation_id uuid, _brand text, _items jsonb, _topup jsonb DEFAULT NULL::jsonb)
 RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE f record; it jsonb; c record; _n int; _donor uuid; _exp date; _title text; _before jsonb;
  _v numeric; _id uuid; _keep_ids uuid[] := '{}'; _changed uuid[] := '{}'; _new_id uuid;
  _t jsonb; _base numeric; _issued numeric := 0; _over numeric; _tu numeric; _tr text;
  _type text; _sec jsonb; _url text; _vexp date; _instr text; _ib text; _br text; _last4 text; _keep boolean;
  _has_new boolean; _k text; _code text; _pin text;
BEGIN
  PERFORM _svc_as(_actor);
  IF _actor IS NULL OR NOT public.is_admin_staff(_actor) THEN RAISE EXCEPTION 'Staff access required'; END IF;
  IF _items IS NULL OR jsonb_typeof(_items) <> 'array' OR jsonb_array_length(_items) < 1 OR jsonb_array_length(_items) > 50 THEN
    RAISE EXCEPTION 'Give between 1 and 50 coupons'; END IF;
  SELECT fr.id, fr.user_id, fr.title INTO f FROM donations d JOIN fundraisers fr ON fr.id = d.fundraiser_id WHERE d.id = _donation_id AND d.status = 'completed';
  IF NOT FOUND THEN RAISE EXCEPTION 'Donation is not a completed fundraiser donation'; END IF;
  SELECT count(*), max(donor_id::text)::uuid, max(expiry_date), max(title),
         jsonb_agg(jsonb_build_object('id',id,'value',coalesce(value,expected_value),'status',status,'type',credential_type,'credential',_cred_mask(coupons.*),'issued_brand',issued_brand))
    INTO _n, _donor, _exp, _title, _before
    FROM coupons WHERE donation_id = _donation_id AND store_name = _brand AND status::text NOT IN ('void','returned');
  IF _n = 0 THEN RAISE EXCEPTION 'No coupons for that brand on this donation'; END IF;
  _t := _brand_target(_donation_id, _brand);
  _base := (_t->>'allocated')::numeric + (_t->>'topup')::numeric;

  FOR it IN SELECT * FROM jsonb_array_elements(_items) LOOP
    _v := (it->>'value')::numeric;
    IF _v IS NULL OR _v <= 0 OR _v <> round(_v, 2) OR _v > 100000 THEN RAISE EXCEPTION 'Each coupon needs a positive amount in dollars and cents'; END IF;
    _issued := _issued + _v;
    _type := coalesce(it->>'type', 'code');
    IF _type = 'prepaid_card' THEN RAISE EXCEPTION 'Prepaid card numbers and CVVs are not accepted. Use "Prepaid card — hosted link".'; END IF;
    IF _type NOT IN ('code','gift_card','prepaid_link') THEN RAISE EXCEPTION 'Unknown coupon type'; END IF;
    _sec := CASE WHEN jsonb_typeof(it->'secret') = 'object' THEN it->'secret' ELSE '{}'::jsonb END;
    FOR _k IN SELECT jsonb_object_keys(_sec) LOOP
      IF _k IN ('cvv','name','zip','card_exp') THEN RAISE EXCEPTION 'Prepaid card numbers and CVVs are not accepted. Use "Prepaid card — hosted link".'; END IF;
      IF _k NOT IN ('code','pin','number') THEN RAISE EXCEPTION 'Unknown field %', _k; END IF;
      IF jsonb_typeof(_sec->_k) <> 'string' OR length(_sec->>_k) > 200 THEN RAISE EXCEPTION 'Field % is too long', _k; END IF;
    END LOOP;
    IF it ? 'card_exp' AND nullif(it->>'card_exp','') IS NOT NULL THEN RAISE EXCEPTION 'Prepaid card numbers and CVVs are not accepted. Use "Prepaid card — hosted link".'; END IF;
    IF _sec ? 'number' AND _type <> 'gift_card' THEN RAISE EXCEPTION 'Card number is only for gift cards'; END IF;
    _url := nullif(btrim(coalesce(it->>'redemption_url','')), '');
    IF _url IS NOT NULL AND (_url !~* '^https://' OR length(_url) > 1000) THEN RAISE EXCEPTION 'Redemption link must start with https://'; END IF;
    IF NOT coalesce((it->>'keep_secret')::boolean, false) AND (_sec <> '{}'::jsonb OR _url IS NOT NULL) THEN
      IF _type = 'code' AND length(btrim(coalesce(_sec->>'code',''))) NOT BETWEEN 3 AND 200 THEN RAISE EXCEPTION 'A code needs 3–200 characters'; END IF;
      IF _type = 'gift_card' AND btrim(coalesce(_sec->>'number','')) !~ '^[0-9A-Za-z -]{8,30}$' THEN RAISE EXCEPTION 'Gift card number needs 8–30 characters'; END IF;
      IF _type = 'gift_card' AND btrim(coalesce(_sec->>'pin','')) !~ '^[0-9A-Za-z-]{3,16}$' THEN RAISE EXCEPTION 'Gift card PIN needs 3–16 letters or digits'; END IF;
      IF _type = 'code' AND _sec ? 'pin' AND btrim(_sec->>'pin') <> '' AND btrim(_sec->>'pin') !~ '^[0-9A-Za-z-]{3,16}$' THEN RAISE EXCEPTION 'PIN needs 3–16 letters or digits'; END IF;
      IF _type = 'prepaid_link' AND (_url IS NULL OR _sec <> '{}'::jsonb) THEN RAISE EXCEPTION 'A hosted prepaid card stores only its https link'; END IF;
    END IF;
    IF it->>'value_expires_on' IS NOT NULL AND (it->>'value_expires_on')::date < current_date AND NOT coalesce((it->>'keep_secret')::boolean,false) THEN RAISE EXCEPTION 'Value expiry date is in the past'; END IF;
    IF length(coalesce(it->>'instructions','')) > 500 THEN RAISE EXCEPTION 'Instructions can be at most 500 characters'; END IF;
    _ib := coalesce(nullif(btrim(it->>'issued_brand'),''), _brand);
    IF length(_ib) > 60 THEN RAISE EXCEPTION 'Brand name too long'; END IF;
    IF lower(_ib) <> lower(_brand) AND length(btrim(coalesce(it->>'brand_reason',''))) NOT BETWEEN 5 AND 200 THEN
      RAISE EXCEPTION 'Issuing as % instead of % needs a short reason (5–200 characters)', _ib, _brand; END IF;
  END LOOP;

  _over := round(_issued - _base, 2);
  IF _over > 0 THEN
    _tu := (_topup->>'amount')::numeric; _tr := btrim(coalesce(_topup->>'reason',''));
    IF _tu IS NULL OR _tu <> _over THEN RAISE EXCEPTION 'Issuing $% is $% over the donated amount; add a Platform top-up of exactly $% with a reason', _issued, _over, _over; END IF;
    IF length(_tr) NOT BETWEEN 5 AND 300 THEN RAISE EXCEPTION 'A Platform top-up needs a reason (5–300 characters)'; END IF;
    INSERT INTO donation_brand_topups(donation_id, brand, amount, reason, created_by) VALUES (_donation_id, _brand, _tu, _tr, _actor);
  ELSIF _topup IS NOT NULL AND (_topup->>'amount') IS NOT NULL THEN
    RAISE EXCEPTION 'No top-up needed: the coupons are within the donated amount';
  END IF;

  FOR c IN SELECT * FROM coupons WHERE donation_id = _donation_id AND store_name = _brand AND status = 'redeemed' LOOP
    IF NOT EXISTS (SELECT 1 FROM jsonb_array_elements(_items) x WHERE nullif(x->>'id','')::uuid = c.id AND (x->>'value')::numeric = coalesce(c.value,c.expected_value)) THEN
      RAISE EXCEPTION 'Used coupons cannot be changed or removed'; END IF;
  END LOOP;

  FOR it IN SELECT * FROM jsonb_array_elements(_items) LOOP
    _v := (it->>'value')::numeric;
    _id := nullif(it->>'id','')::uuid;
    _type := coalesce(it->>'type','code');
    _sec := CASE WHEN jsonb_typeof(it->'secret') = 'object' THEN it->'secret' ELSE '{}'::jsonb END;
    _url := nullif(btrim(coalesce(it->>'redemption_url','')), '');
    _keep := coalesce((it->>'keep_secret')::boolean, false);
    _vexp := (it->>'value_expires_on')::date;
    _instr := nullif(btrim(coalesce(it->>'instructions','')), '');
    _ib := coalesce(nullif(btrim(it->>'issued_brand'),''), _brand);
    _br := CASE WHEN lower(_ib) <> lower(_brand) THEN btrim(it->>'brand_reason') END;
    _code := CASE WHEN _type = 'code' THEN nullif(btrim(coalesce(_sec->>'code','')),'')
                  WHEN _type = 'gift_card' THEN nullif(regexp_replace(coalesce(_sec->>'number',''), '[\s-]', '', 'g'),'') END;
    _pin := CASE WHEN _type IN ('code','gift_card') THEN nullif(btrim(coalesce(_sec->>'pin','')),'') END;
    _last4 := CASE WHEN _code IS NOT NULL THEN nullif(right(regexp_replace(_code, '[^0-9A-Za-z]', '', 'g'), 4),'') END;
    _has_new := NOT _keep AND (_code IS NOT NULL OR (_type = 'prepaid_link' AND _url IS NOT NULL));
    IF _id IS NOT NULL THEN
      SELECT * INTO c FROM coupons WHERE id = _id AND donation_id = _donation_id AND store_name = _brand AND status::text NOT IN ('void','returned') FOR UPDATE;
      IF NOT FOUND THEN RAISE EXCEPTION 'Coupon does not belong to this donation'; END IF;
      IF _id = ANY(_keep_ids) THEN RAISE EXCEPTION 'Duplicate coupon in request'; END IF;
      _keep_ids := _keep_ids || _id;
      CONTINUE WHEN c.status = 'redeemed';
      IF _keep AND _v = coalesce(c.value, c.expected_value) THEN
        UPDATE coupons SET value_expires_on = _vexp, recipient_instructions = _instr, issued_brand = _ib, brand_change_reason = _br, updated_at = now() WHERE id = _id;
        CONTINUE;
      END IF;
      IF c.has_credential THEN
        PERFORM _preserve_code(c.id, CASE WHEN _v <> coalesce(c.value,c.expected_value) THEN 'amount changed' WHEN _has_new THEN 'code replaced' ELSE 'code cleared' END);
      END IF;
      UPDATE coupons SET value = _v, expected_value = _v,
        code = CASE WHEN _has_new THEN _code END, code_pin = CASE WHEN _has_new THEN _pin END,
        redemption_url = CASE WHEN _has_new THEN _url END,
        secret_cipher = NULL, credential_type = CASE WHEN _has_new THEN _type END,
        card_last4 = CASE WHEN _has_new THEN _last4 END, card_exp = NULL, cvv_purged_at = NULL,
        value_expires_on = _vexp, recipient_instructions = _instr, issued_brand = _ib, brand_change_reason = _br,
        credential_version = credential_version + CASE WHEN _has_new THEN 1 ELSE 0 END,
        revealed_at = CASE WHEN _has_new OR c.has_credential THEN NULL ELSE revealed_at END,
        revealed_by = CASE WHEN _has_new OR c.has_credential THEN NULL ELSE revealed_by END,
        status = CASE WHEN _has_new THEN 'claimed'::coupon_status ELSE 'pending_procurement'::coupon_status END,
        reserved_by = CASE WHEN _has_new THEN f.user_id END,
        reserved_at = CASE WHEN _has_new THEN coalesce(reserved_at, now()) END,
        claimed_at = CASE WHEN _has_new THEN coalesce(claimed_at, now()) END,
        last_procurement_error = NULL, updated_at = now()
      WHERE id = _id;
      IF _has_new THEN _changed := _changed || _id; END IF;
    ELSE
      INSERT INTO coupons (donation_id, donor_id, title, store_name, value, expected_value, code, code_pin, redemption_url, status, expiry_date, reserved_by, reserved_at, claimed_at,
                           credential_type, card_last4, value_expires_on, recipient_instructions, issued_brand, brand_change_reason, credential_version)
      VALUES (_donation_id, _donor, coalesce(_title, _brand || ' Gift'), _brand, _v, _v,
        CASE WHEN _has_new THEN _code END, CASE WHEN _has_new THEN _pin END, CASE WHEN _has_new THEN _url END,
        CASE WHEN _has_new THEN 'claimed'::coupon_status ELSE 'pending_procurement'::coupon_status END, _exp,
        CASE WHEN _has_new THEN f.user_id END, CASE WHEN _has_new THEN now() END, CASE WHEN _has_new THEN now() END,
        CASE WHEN _has_new THEN _type END, CASE WHEN _has_new THEN _last4 END,
        _vexp, _instr, _ib, _br, CASE WHEN _has_new THEN 1 ELSE 0 END)
      RETURNING id INTO _new_id;
      _keep_ids := _keep_ids || _new_id;
      IF _has_new THEN _changed := _changed || _new_id; END IF;
    END IF;
  END LOOP;

  FOR c IN SELECT * FROM coupons WHERE donation_id = _donation_id AND store_name = _brand AND status::text NOT IN ('redeemed','void','returned') AND NOT (id = ANY(_keep_ids)) FOR UPDATE LOOP
    PERFORM _preserve_code(c.id, 'coupon removed');
    UPDATE coupons SET status = 'void', code = NULL, code_pin = NULL, redemption_url = NULL, secret_cipher = NULL, reserved_by = NULL, voided_at = now(), void_reason = 'removed in coupon editor', updated_at = now() WHERE id = c.id;
  END LOOP;

  INSERT INTO coupon_owner_alerts(coupon_id, credential_version, fundraiser_id)
  SELECT id, credential_version, f.id FROM coupons WHERE id = ANY(_changed) ON CONFLICT DO NOTHING;

  _t := _brand_target(_donation_id, _brand);
  PERFORM log_admin_action('save_coupon_group', 'coupons', _donation_id::text,
    jsonb_build_object('brand',_brand,'coupons',_before),
    jsonb_build_object('brand',_brand,'target',_t,'topup',_topup,
      'coupons',(SELECT jsonb_agg(jsonb_build_object('id',id,'value',value,'status',status,'type',credential_type,'credential',_cred_mask(coupons.*),'issued_brand',issued_brand,'brand_reason',brand_change_reason))
                 FROM coupons WHERE donation_id=_donation_id AND store_name=_brand AND status::text <> 'void')));
  RETURN jsonb_build_object('changed', to_jsonb(_changed), 'fundraiser_id', f.id, 'target', _t);
END $function$;