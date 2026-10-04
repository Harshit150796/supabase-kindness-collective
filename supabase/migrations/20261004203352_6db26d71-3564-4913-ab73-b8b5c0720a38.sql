CREATE OR REPLACE FUNCTION public._preserve_code(_cid uuid, _reason text)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE c public.coupons; _fid uuid; _new uuid;
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

CREATE OR REPLACE FUNCTION public.admin_returned_code_action(_id uuid, _action text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE s public.coupons;
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