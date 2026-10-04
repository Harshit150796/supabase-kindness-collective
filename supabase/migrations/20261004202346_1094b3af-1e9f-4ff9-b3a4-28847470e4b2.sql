
-- 1. Additive columns
ALTER TABLE public.coupons
  ADD COLUMN IF NOT EXISTS credential_type text,
  ADD COLUMN IF NOT EXISTS secret_cipher jsonb,
  ADD COLUMN IF NOT EXISTS card_last4 text,
  ADD COLUMN IF NOT EXISTS card_exp text,
  ADD COLUMN IF NOT EXISTS value_expires_on date,
  ADD COLUMN IF NOT EXISTS recipient_instructions text,
  ADD COLUMN IF NOT EXISTS issued_brand text,
  ADD COLUMN IF NOT EXISTS brand_change_reason text,
  ADD COLUMN IF NOT EXISTS credential_version integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS cvv_purged_at timestamptz;
ALTER TABLE public.coupons ADD COLUMN IF NOT EXISTS has_credential boolean
  GENERATED ALWAYS AS ((code IS NOT NULL AND code <> '') OR secret_cipher IS NOT NULL OR (credential_type = 'prepaid_link' AND redemption_url IS NOT NULL)) STORED;

REVOKE ALL (secret_cipher, card_exp, recipient_instructions) ON public.coupons FROM anon, authenticated;
GRANT SELECT (credential_type, card_last4, value_expires_on, issued_brand, brand_change_reason, credential_version, has_credential) ON public.coupons TO authenticated;

ALTER TABLE public.admin_settings ADD COLUMN IF NOT EXISTS allow_manual_prepaid boolean NOT NULL DEFAULT false;

-- 2. New tables
CREATE TABLE IF NOT EXISTS public.donation_brand_topups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  donation_id uuid NOT NULL REFERENCES public.donations(id),
  brand text NOT NULL,
  amount numeric NOT NULL,
  reason text NOT NULL,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.donation_brand_topups TO authenticated;
GRANT ALL ON public.donation_brand_topups TO service_role;
ALTER TABLE public.donation_brand_topups ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins view top-ups" ON public.donation_brand_topups FOR SELECT TO authenticated USING (public.is_admin_any(auth.uid()));

CREATE TABLE IF NOT EXISTS public.coupon_owner_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  coupon_id uuid NOT NULL REFERENCES public.coupons(id),
  credential_version integer NOT NULL,
  fundraiser_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  sent_at timestamptz,
  resend_id text,
  last_error text,
  UNIQUE (coupon_id, credential_version)
);
GRANT SELECT ON public.coupon_owner_alerts TO authenticated;
GRANT ALL ON public.coupon_owner_alerts TO service_role;
ALTER TABLE public.coupon_owner_alerts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins view owner alerts" ON public.coupon_owner_alerts FOR SELECT TO authenticated USING (public.is_admin_any(auth.uid()));

-- 3. Helpers
CREATE OR REPLACE FUNCTION public._svc_as(_actor uuid) RETURNS void LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  PERFORM set_config('request.jwt.claim.sub', coalesce(_actor::text,''), true);
  PERFORM set_config('request.jwt.claims', json_build_object('sub', _actor, 'role', 'authenticated')::text, true);
END $$;
REVOKE ALL ON FUNCTION public._svc_as(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public._svc_as(uuid) TO service_role;

CREATE OR REPLACE FUNCTION public.svc_admin_log(_actor uuid, _action text, _table text, _record text, _after jsonb)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO admin_audit_log(actor_id, action, table_name, record_id, before, after) VALUES (_actor, _action, _table, _record, NULL, _after);
END $$;
REVOKE ALL ON FUNCTION public.svc_admin_log(uuid,text,text,text,jsonb) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.svc_admin_log(uuid,text,text,text,jsonb) TO service_role;

CREATE OR REPLACE FUNCTION public._cred_mask(c public.coupons) RETURNS text LANGUAGE sql STABLE SET search_path = public AS $$
  SELECT CASE WHEN c.code IS NOT NULL AND c.code <> '' THEN _mask_code(c.code)
              WHEN c.card_last4 IS NOT NULL THEN '•••• ' || c.card_last4
              WHEN c.credential_type = 'prepaid_link' AND c.redemption_url IS NOT NULL THEN 'hosted link'
              WHEN c.secret_cipher IS NOT NULL THEN '••••' END
$$;

-- group target = donated amount for the brand (fallback: current sum) + platform top-ups
CREATE OR REPLACE FUNCTION public._brand_target(_donation_id uuid, _brand text) RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT jsonb_build_object(
    'allocated', coalesce((SELECT sum(allocated_amount) FROM donation_brands WHERE donation_id = _donation_id AND brand_name = _brand),
                          (SELECT sum(coalesce(value, expected_value, 0)) FROM coupons WHERE donation_id = _donation_id AND store_name = _brand AND status::text NOT IN ('void','returned')), 0),
    'topup', coalesce((SELECT sum(amount) FROM donation_brand_topups WHERE donation_id = _donation_id AND brand = _brand), 0),
    'topup_reasons', coalesce((SELECT jsonb_agg(jsonb_build_object('amount', amount, 'reason', reason) ORDER BY created_at) FROM donation_brand_topups WHERE donation_id = _donation_id AND brand = _brand), '[]'::jsonb),
    'issued', coalesce((SELECT sum(coalesce(value, expected_value, 0)) FROM coupons WHERE donation_id = _donation_id AND store_name = _brand AND status::text NOT IN ('void','returned')), 0))
$$;
REVOKE ALL ON FUNCTION public._brand_target(uuid,text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public._brand_target(uuid,text) TO service_role;

-- 4. Preserve any credential (plaintext or encrypted) as a 'returned' row
CREATE OR REPLACE FUNCTION public._preserve_code(_cid uuid, _reason text)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE c record; _fid uuid; _new uuid;
BEGIN
  SELECT * INTO c FROM coupons WHERE id = _cid;
  IF NOT FOUND OR NOT c.has_credential THEN RETURN NULL; END IF;
  SELECT d.fundraiser_id INTO _fid FROM donations d WHERE d.id = c.donation_id;
  INSERT INTO coupons (title, store_name, value, expected_value, code, redemption_url, expiry_date, status, batch_id,
                       returned_from_coupon_id, returned_from_fundraiser_id, returned_at, void_reason,
                       credential_type, secret_cipher, card_last4, card_exp, value_expires_on, recipient_instructions, issued_brand)
  VALUES ('$' || coalesce(c.value, c.expected_value) || ' ' || c.store_name || ' coupon (returned)', c.store_name,
          coalesce(c.value, c.expected_value), coalesce(c.value, c.expected_value), c.code, c.redemption_url, c.expiry_date,
          'returned', c.batch_id, c.id, _fid, now(), _reason,
          c.credential_type, c.secret_cipher, c.card_last4, c.card_exp, c.value_expires_on, c.recipient_instructions, c.issued_brand)
  RETURNING id INTO _new;
  PERFORM log_admin_action('coupon.code_returned', 'coupons', _new::text,
    jsonb_build_object('from_coupon', c.id, 'fundraiser_id', _fid, 'code', _cred_mask(c), 'type', coalesce(c.credential_type,'code'), 'value', coalesce(c.value, c.expected_value)),
    jsonb_build_object('status', 'returned', 'reason', _reason));
  RETURN _new;
END $$;

-- encrypted returned credentials cannot go back into plaintext stock
CREATE OR REPLACE FUNCTION public.admin_returned_code_action(_id uuid, _action text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE s record;
BEGIN
  IF NOT is_admin_staff(auth.uid()) THEN RAISE EXCEPTION 'Staff access required'; END IF;
  IF _action NOT IN ('restock','void') THEN RAISE EXCEPTION 'Unknown action'; END IF;
  SELECT * INTO s FROM coupons WHERE id = _id AND status::text = 'returned' AND donation_id IS NULL FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Only returned codes can be changed here'; END IF;
  IF _action = 'restock' AND (s.code IS NULL OR s.code = '') THEN RAISE EXCEPTION 'Encrypted cards and hosted links cannot go back to stock; re-enter them on a coupon or void them'; END IF;
  IF _action = 'restock' THEN
    UPDATE coupons SET status = 'in_stock', title = '$' || coalesce(value, expected_value) || ' ' || store_name || ' coupon', updated_at = now() WHERE id = _id;
  ELSE
    UPDATE coupons SET status = 'void', voided_at = now(), void_reason = 'returned code voided', updated_at = now() WHERE id = _id;
  END IF;
  PERFORM log_admin_action(CASE WHEN _action = 'restock' THEN 'coupon.returned_restock' ELSE 'coupon.returned_void' END, 'coupons', _id::text,
    jsonb_build_object('status','returned','code',_cred_mask(s),'value',s.value,'from_coupon',s.returned_from_coupon_id),
    jsonb_build_object('status', CASE WHEN _action = 'restock' THEN 'in_stock' ELSE 'void' END));
END $$;

-- 5. The new save (service role only; called by the coupon-secrets function after it encrypts)
CREATE OR REPLACE FUNCTION public.admin_save_coupon_group_v2(_actor uuid, _donation_id uuid, _brand text, _items jsonb, _topup jsonb DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE f record; it jsonb; c record; _n int; _donor uuid; _exp date; _title text; _before jsonb;
  _v numeric; _id uuid; _keep_ids uuid[] := '{}'; _changed uuid[] := '{}'; _new_id uuid;
  _t jsonb; _base numeric; _issued numeric := 0; _over numeric; _tu numeric; _tr text; _manual boolean;
  _type text; _sec jsonb; _url text; _cexp text; _vexp date; _instr text; _ib text; _br text; _last4 text; _keep boolean;
  _has_new boolean; _k text; _mm int; _yy int;
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
  SELECT allow_manual_prepaid INTO _manual FROM admin_settings WHERE id = 1;
  _t := _brand_target(_donation_id, _brand);
  _base := (_t->>'allocated')::numeric + (_t->>'topup')::numeric;

  -- validate every line first
  FOR it IN SELECT * FROM jsonb_array_elements(_items) LOOP
    _v := (it->>'value')::numeric;
    IF _v IS NULL OR _v <= 0 OR _v <> round(_v, 2) OR _v > 100000 THEN RAISE EXCEPTION 'Each coupon needs a positive amount in dollars and cents'; END IF;
    _issued := _issued + _v;
    _type := coalesce(it->>'type', 'code');
    IF _type NOT IN ('code','gift_card','prepaid_link','prepaid_card') THEN RAISE EXCEPTION 'Unknown coupon type'; END IF;
    _sec := CASE WHEN jsonb_typeof(it->'secret') = 'object' THEN it->'secret' ELSE '{}'::jsonb END;
    FOR _k IN SELECT jsonb_object_keys(_sec) LOOP
      IF _k NOT IN ('code','pin','number','cvv','name','zip') THEN RAISE EXCEPTION 'Unknown secret field %', _k; END IF;
      IF (_sec->>_k) !~ '^v1:k[0-9]+:[A-Za-z0-9_-]{16}:[A-Za-z0-9_-]{20,}$' THEN RAISE EXCEPTION 'Secrets must be encrypted before saving'; END IF;
    END LOOP;
    IF (_sec ? 'cvv' OR (_type = 'prepaid_card')) AND NOT coalesce(_manual, false) AND NOT coalesce((it->>'keep_secret')::boolean, false) THEN
      RAISE EXCEPTION 'Manual prepaid card entry is turned off (PCI scope). Use a hosted link instead.'; END IF;
    IF _sec ? 'cvv' AND _type <> 'prepaid_card' THEN RAISE EXCEPTION 'CVV is only for prepaid cards'; END IF;
    IF _sec ? 'number' AND _type NOT IN ('gift_card','prepaid_card') THEN RAISE EXCEPTION 'Card number is only for gift and prepaid cards'; END IF;
    _url := nullif(btrim(coalesce(it->>'redemption_url','')), '');
    IF _url IS NOT NULL AND (_url !~* '^https://' OR length(_url) > 1000) THEN RAISE EXCEPTION 'Redemption link must start with https://'; END IF;
    IF NOT coalesce((it->>'keep_secret')::boolean, false) AND (_sec <> '{}'::jsonb OR _url IS NOT NULL) THEN
      IF _type = 'code' AND NOT _sec ? 'code' THEN RAISE EXCEPTION 'A code line needs a code'; END IF;
      IF _type = 'gift_card' AND NOT (_sec ? 'number' AND _sec ? 'pin') THEN RAISE EXCEPTION 'A gift card needs a card number and PIN'; END IF;
      IF _type = 'prepaid_link' AND (_url IS NULL OR _sec <> '{}'::jsonb) THEN RAISE EXCEPTION 'A hosted prepaid card stores only its https link'; END IF;
      IF _type = 'prepaid_card' THEN
        IF NOT (_sec ? 'number' AND _sec ? 'cvv') THEN RAISE EXCEPTION 'A prepaid card needs a number and CVV'; END IF;
        _cexp := it->>'card_exp';
        IF _cexp IS NULL OR _cexp !~ '^(0[1-9]|1[0-2])/[0-9]{2}$' THEN RAISE EXCEPTION 'Card expiry must be MM/YY'; END IF;
        _mm := split_part(_cexp,'/',1)::int; _yy := 2000 + split_part(_cexp,'/',2)::int;
        IF (make_date(_yy, _mm, 1) + interval '1 month')::date <= current_date THEN RAISE EXCEPTION 'Card expiry is in the past'; END IF;
      END IF;
      IF coalesce(it->>'last4','') !~ '^[0-9A-Za-z]{1,4}$' AND _type <> 'prepaid_link' THEN RAISE EXCEPTION 'Missing last 4'; END IF;
    END IF;
    IF it->>'value_expires_on' IS NOT NULL AND (it->>'value_expires_on')::date < current_date AND NOT coalesce((it->>'keep_secret')::boolean,false) THEN RAISE EXCEPTION 'Value expiry date is in the past'; END IF;
    IF length(coalesce(it->>'instructions','')) > 500 THEN RAISE EXCEPTION 'Instructions can be at most 500 characters'; END IF;
    _ib := coalesce(nullif(btrim(it->>'issued_brand'),''), _brand);
    IF length(_ib) > 60 THEN RAISE EXCEPTION 'Brand name too long'; END IF;
    IF lower(_ib) <> lower(_brand) AND length(btrim(coalesce(it->>'brand_reason',''))) NOT BETWEEN 5 AND 200 THEN
      RAISE EXCEPTION 'Issuing as % instead of % needs a short reason (5–200 characters)', _ib, _brand; END IF;
  END LOOP;

  -- money trail: up to the donated amount; over only with an exact, reasoned top-up
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
    _sec := CASE WHEN jsonb_typeof(it->'secret') = 'object' AND it->'secret' <> '{}'::jsonb THEN it->'secret' END;
    _url := nullif(btrim(coalesce(it->>'redemption_url','')), '');
    _keep := coalesce((it->>'keep_secret')::boolean, false);
    _cexp := CASE WHEN _type = 'prepaid_card' THEN it->>'card_exp' END;
    _vexp := (it->>'value_expires_on')::date;
    _instr := nullif(btrim(coalesce(it->>'instructions','')), '');
    _ib := coalesce(nullif(btrim(it->>'issued_brand'),''), _brand);
    _br := CASE WHEN lower(_ib) <> lower(_brand) THEN btrim(it->>'brand_reason') END;
    _last4 := CASE WHEN _type = 'prepaid_link' THEN NULL ELSE it->>'last4' END;
    _has_new := NOT _keep AND (_sec IS NOT NULL OR (_type = 'prepaid_link' AND _url IS NOT NULL));
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
        code = NULL, redemption_url = CASE WHEN _has_new THEN _url END,
        secret_cipher = CASE WHEN _has_new THEN _sec END, credential_type = CASE WHEN _has_new THEN _type END,
        card_last4 = CASE WHEN _has_new THEN _last4 END, card_exp = CASE WHEN _has_new THEN _cexp END, cvv_purged_at = NULL,
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
      INSERT INTO coupons (donation_id, donor_id, title, store_name, value, expected_value, redemption_url, status, expiry_date, reserved_by, reserved_at, claimed_at,
                           secret_cipher, credential_type, card_last4, card_exp, value_expires_on, recipient_instructions, issued_brand, brand_change_reason, credential_version)
      VALUES (_donation_id, _donor, coalesce(_title, _brand || ' Gift'), _brand, _v, _v, CASE WHEN _has_new THEN _url END,
        CASE WHEN _has_new THEN 'claimed'::coupon_status ELSE 'pending_procurement'::coupon_status END, _exp,
        CASE WHEN _has_new THEN f.user_id END, CASE WHEN _has_new THEN now() END, CASE WHEN _has_new THEN now() END,
        CASE WHEN _has_new THEN _sec END, CASE WHEN _has_new THEN _type END, CASE WHEN _has_new THEN _last4 END, CASE WHEN _has_new THEN _cexp END,
        _vexp, _instr, _ib, _br, CASE WHEN _has_new THEN 1 ELSE 0 END)
      RETURNING id INTO _new_id;
      _keep_ids := _keep_ids || _new_id;
      IF _has_new THEN _changed := _changed || _new_id; END IF;
    END IF;
  END LOOP;

  FOR c IN SELECT * FROM coupons WHERE donation_id = _donation_id AND store_name = _brand AND status::text NOT IN ('redeemed','void','returned') AND NOT (id = ANY(_keep_ids)) FOR UPDATE LOOP
    PERFORM _preserve_code(c.id, 'coupon removed');
    UPDATE coupons SET status = 'void', code = NULL, redemption_url = NULL, secret_cipher = NULL, reserved_by = NULL, voided_at = now(), void_reason = 'removed in coupon editor', updated_at = now() WHERE id = c.id;
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
END $$;
REVOKE ALL ON FUNCTION public.admin_save_coupon_group_v2(uuid,uuid,text,jsonb,jsonb) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_save_coupon_group_v2(uuid,uuid,text,jsonb,jsonb) TO service_role;

-- 6. Legacy alert path joins the same queue
CREATE OR REPLACE FUNCTION public.svc_enqueue_owner_alerts(_fundraiser_id uuid, _ids uuid[])
RETURNS int LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE n int;
BEGIN
  INSERT INTO coupon_owner_alerts(coupon_id, credential_version, fundraiser_id)
  SELECT c.id, c.credential_version, fr.id FROM coupons c JOIN donations d ON d.id = c.donation_id JOIN fundraisers fr ON fr.id = d.fundraiser_id
   WHERE c.id = ANY(_ids) AND fr.id = _fundraiser_id AND c.has_credential AND c.reserved_by = fr.user_id AND c.status::text NOT IN ('void','returned')
  ON CONFLICT DO NOTHING;
  GET DIAGNOSTICS n = ROW_COUNT; RETURN n;
END $$;
REVOKE ALL ON FUNCTION public.svc_enqueue_owner_alerts(uuid,uuid[]) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.svc_enqueue_owner_alerts(uuid,uuid[]) TO service_role;

-- 7. CVV purge 30 days after first reveal (dispatcher, audited)
CREATE OR REPLACE FUNCTION public.svc_purge_cvv() RETURNS int LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE r record; n int := 0;
BEGIN
  FOR r IN SELECT id, card_last4 FROM coupons WHERE secret_cipher ? 'cvv'
      AND ((revealed_at IS NOT NULL AND revealed_at < now() - interval '30 days') OR (status::text = 'returned' AND returned_at < now() - interval '30 days')) FOR UPDATE LOOP
    UPDATE coupons SET secret_cipher = secret_cipher - 'cvv', cvv_purged_at = now() WHERE id = r.id;
    INSERT INTO admin_audit_log(actor_id, action, table_name, record_id, after) VALUES (NULL, 'coupon.cvv_purged', 'coupons', r.id::text, jsonb_build_object('card', '•••• ' || r.card_last4));
    n := n + 1;
  END LOOP;
  RETURN n;
END $$;
REVOKE ALL ON FUNCTION public.svc_purge_cvv() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.svc_purge_cvv() TO service_role;

-- 8. Reveal works for every credential type (secrets decrypted only in the edge function)
CREATE OR REPLACE FUNCTION public.owner_reveal_coupon(_coupon_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
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
  RETURN jsonb_build_object('code', c.code, 'redemption_url', c.redemption_url, 'revealed_at', COALESCE(c.revealed_at, now()), 'first', v_first,
    'type', coalesce(c.credential_type, 'code'), 'card_exp', c.card_exp, 'card_last4', c.card_last4, 'value_expires_on', c.value_expires_on,
    'instructions', c.recipient_instructions, 'issued_brand', coalesce(c.issued_brand, c.store_name), 'encrypted', c.secret_cipher IS NOT NULL, 'cvv_purged', c.cvv_purged_at IS NOT NULL);
END $$;

DROP FUNCTION IF EXISTS public.get_my_fundraiser_coupons(uuid);
CREATE FUNCTION public.get_my_fundraiser_coupons(_fundraiser_id uuid)
RETURNS TABLE(id uuid, donation_id uuid, store_name text, value numeric, status text, code text, redemption_url text, revealed_at timestamptz, used_at timestamptz,
  used_category text, used_note text, receipt_count integer, can_reveal boolean, issued_brand text, credential_type text, card_last4 text, value_expires_on date)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE _owner boolean;
BEGIN
  IF auth.uid() IS NULL OR NOT public.is_fundraiser_team(_fundraiser_id, auth.uid()) THEN RAISE EXCEPTION 'Not allowed'; END IF;
  _owner := EXISTS (SELECT 1 FROM public.fundraisers f WHERE f.id = _fundraiser_id AND f.user_id = auth.uid());
  RETURN QUERY
  SELECT c.id, c.donation_id, c.store_name, COALESCE(c.value, c.expected_value), c.status::text, NULL::text, NULL::text,
    c.revealed_at, c.used_at, c.used_category, c.used_note,
    (SELECT count(*)::int FROM public.coupon_receipts r WHERE r.coupon_id = c.id AND r.hidden_at IS NULL),
    (_owner AND c.has_credential AND c.status::text IN ('claimed','reserved','redeemed') AND (c.reserved_by = auth.uid() OR c.redeemed_by = auth.uid())),
    coalesce(c.issued_brand, c.store_name), CASE WHEN c.has_credential THEN coalesce(c.credential_type, 'code') END,
    CASE WHEN _owner THEN c.card_last4 END, c.value_expires_on
  FROM public.coupons c JOIN public.donations d ON d.id = c.donation_id
  WHERE d.fundraiser_id = _fundraiser_id AND d.status = 'completed' AND c.status::text NOT IN ('void','returned')
  ORDER BY c.store_name, c.created_at;
END $$;
REVOKE ALL ON FUNCTION public.get_my_fundraiser_coupons(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_my_fundraiser_coupons(uuid) TO authenticated;

DROP FUNCTION IF EXISTS public.admin_fundraiser_coupons(uuid);
CREATE FUNCTION public.admin_fundraiser_coupons(_fundraiser_id uuid)
RETURNS TABLE(id uuid, donation_id uuid, donation_at timestamptz, store_name text, value numeric, status text, has_code boolean, code_hint text, redemption_url text,
  updated_at timestamptz, credential_type text, card_exp text, value_expires_on date, instructions text, issued_brand text, brand_change_reason text,
  encrypted boolean, group_target jsonb)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.is_admin_any(auth.uid()) THEN RAISE EXCEPTION 'Admin access required'; END IF;
  RETURN QUERY
  SELECT c.id, c.donation_id, d.created_at, c.store_name, COALESCE(c.value, c.expected_value), c.status::text,
         c.has_credential, _cred_mask(c), CASE WHEN c.credential_type = 'prepaid_link' OR c.secret_cipher IS NULL THEN c.redemption_url END, c.updated_at,
         CASE WHEN c.has_credential THEN coalesce(c.credential_type,'code') END,
         CASE WHEN c.card_exp IS NOT NULL THEN c.card_exp END, c.value_expires_on, c.recipient_instructions,
         coalesce(c.issued_brand, c.store_name), c.brand_change_reason, c.secret_cipher IS NOT NULL,
         _brand_target(c.donation_id, c.store_name)
  FROM public.coupons c JOIN public.donations d ON d.id = c.donation_id
  WHERE d.fundraiser_id = _fundraiser_id AND d.status = 'completed' AND c.status::text NOT IN ('void','returned')
  ORDER BY d.created_at DESC, c.created_at;
END $$;
REVOKE ALL ON FUNCTION public.admin_fundraiser_coupons(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_fundraiser_coupons(uuid) TO authenticated;

-- 9. Donor impact: issued brand, disclosure, pending balance, top-ups
CREATE OR REPLACE FUNCTION public._donation_impact(_donation_id uuid)
RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT jsonb_build_object(
    'donation_id', d.id, 'amount', d.amount, 'created_at', d.created_at,
    'fundraiser_id', f.id, 'fundraiser_title', f.title, 'fundraiser_slug', f.unique_slug,
    'organizer', (SELECT o.display_name FROM public.get_fundraiser_organizer(f.id) o LIMIT 1),
    'coupons', COALESCE((SELECT jsonb_agg(jsonb_build_object(
        'id', c.id, 'store_name', c.store_name, 'value', COALESCE(c.value, c.expected_value), 'status', c.status,
        'created_at', c.created_at, 'revealed_at', c.revealed_at, 'used_at', c.used_at,
        'used_category', c.used_category, 'used_note', c.used_note,
        'issued_brand', coalesce(c.issued_brand, c.store_name), 'brand_change_reason', c.brand_change_reason,
        'credential_type', CASE WHEN c.has_credential THEN coalesce(c.credential_type,'code') END,
        'receipt_count', (SELECT count(*) FROM public.coupon_receipts r WHERE r.coupon_id = c.id AND r.hidden_at IS NULL),
        'receipt_requested', EXISTS (SELECT 1 FROM public.receipt_requests q WHERE q.coupon_id = c.id)
      ) ORDER BY c.store_name, c.created_at) FROM public.coupons c WHERE c.donation_id = d.id AND c.status::text NOT IN ('void','returned')), '[]'::jsonb),
    'brands', COALESCE((SELECT jsonb_agg(jsonb_build_object('brand', b.brand) || public._brand_target(d.id, b.brand) ORDER BY b.brand)
       FROM (SELECT DISTINCT brand_name AS brand FROM public.donation_brands WHERE donation_id = d.id
             UNION SELECT DISTINCT store_name FROM public.coupons WHERE donation_id = d.id AND status::text NOT IN ('void','returned')) b), '[]'::jsonb))
  FROM public.donations d LEFT JOIN public.fundraisers f ON f.id = d.fundraiser_id
  WHERE d.id = _donation_id AND d.status = 'completed'
$$;

-- 10. Admin setting for manual prepaid entry (admin only, audited)
CREATE OR REPLACE FUNCTION public.admin_update_settings(_patch jsonb)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE b jsonb; a jsonb;
BEGIN
  IF NOT public.has_role(auth.uid(),'admin') THEN RAISE EXCEPTION 'Admin access required'; END IF;
  SELECT to_jsonb(s) INTO b FROM public.admin_settings s WHERE id=1;
  UPDATE public.admin_settings SET
    require_fundraiser_approval = COALESCE((_patch->>'require_fundraiser_approval')::boolean, require_fundraiser_approval),
    email_new_fundraiser = COALESCE((_patch->>'email_new_fundraiser')::boolean, email_new_fundraiser),
    email_new_donation = COALESCE((_patch->>'email_new_donation')::boolean, email_new_donation),
    allow_manual_prepaid = COALESCE((_patch->>'allow_manual_prepaid')::boolean, allow_manual_prepaid),
    notification_recipients = CASE WHEN _patch ? 'notification_recipients' THEN ARRAY(SELECT lower(btrim(x)) FROM jsonb_array_elements_text(_patch->'notification_recipients') x WHERE x ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$') ELSE notification_recipients END,
    updated_at=now(), updated_by=auth.uid() WHERE id=1;
  SELECT to_jsonb(s) INTO a FROM public.admin_settings s WHERE id=1;
  PERFORM public.log_admin_action('settings.update','admin_settings','1',b,a);
END $$;
