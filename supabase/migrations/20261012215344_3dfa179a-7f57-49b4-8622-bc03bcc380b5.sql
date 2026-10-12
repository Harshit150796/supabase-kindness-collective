CREATE TABLE public.coupon_sources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  fundraiser_id uuid NOT NULL REFERENCES public.fundraisers(id) ON DELETE CASCADE,
  source_label text,
  donor_name text,
  donor_email text,
  donor_user_id uuid,
  is_anonymous boolean NOT NULL DEFAULT false,
  confirmation_sent_at timestamptz,
  confirmation_count integer NOT NULL DEFAULT 0,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.coupon_sources TO authenticated;
GRANT ALL ON public.coupon_sources TO service_role;
ALTER TABLE public.coupon_sources ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Staff read coupon sources" ON public.coupon_sources FOR SELECT TO authenticated USING (public.is_admin_any(auth.uid()));
CREATE INDEX coupon_sources_fundraiser_idx ON public.coupon_sources(fundraiser_id);

ALTER TABLE public.coupons ADD COLUMN IF NOT EXISTS source_id uuid REFERENCES public.coupon_sources(id);
CREATE INDEX IF NOT EXISTS coupons_source_idx ON public.coupons(source_id) WHERE source_id IS NOT NULL;

CREATE OR REPLACE FUNCTION public.admin_add_outside_coupon(_actor uuid, _fundraiser uuid, _brand text, _value numeric, _stock uuid,
  _code text, _pin text, _url text, _expiry date, _instructions text, _source_label text,
  _donor_name text, _donor_email text, _donor_user uuid, _anon boolean)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE f record; s record; _src uuid; _cid uuid; _b text := nullif(btrim(_brand), ''); _v numeric;
BEGIN
  IF NOT is_admin_staff(_actor) THEN RAISE EXCEPTION 'Staff access required'; END IF;
  SELECT id, user_id, title INTO f FROM fundraisers WHERE id = _fundraiser;
  IF NOT FOUND THEN RAISE EXCEPTION 'Fundraiser not found'; END IF;
  IF _donor_email IS NOT NULL AND _donor_email !~* '^[^@\s]+@[^@\s]+\.[^@\s]+$' THEN RAISE EXCEPTION 'Please enter a valid donor email'; END IF;
  INSERT INTO coupon_sources(fundraiser_id, source_label, donor_name, donor_email, donor_user_id, is_anonymous, created_by)
  VALUES (_fundraiser, nullif(btrim(_source_label), ''), nullif(btrim(_donor_name), ''), lower(nullif(btrim(_donor_email), '')), _donor_user, coalesce(_anon, false), _actor)
  RETURNING id INTO _src;
  IF _stock IS NOT NULL THEN
    SELECT * INTO s FROM coupons WHERE id = _stock AND status::text = 'in_stock' AND donation_id IS NULL FOR UPDATE;
    IF NOT FOUND THEN RAISE EXCEPTION 'Stock code not available'; END IF;
    UPDATE coupons SET source_id = _src, status = 'claimed', reserved_by = f.user_id, reserved_at = now(), claimed_at = now(),
      issued_brand = coalesce(_b, issued_brand, store_name), updated_at = now() WHERE id = _stock;
    _cid := _stock; _b := coalesce(_b, s.store_name); _v := s.value;
  ELSE
    IF _b IS NULL THEN RAISE EXCEPTION 'Choose a brand'; END IF;
    IF _value IS NULL OR _value <= 0 OR _value > 100000 THEN RAISE EXCEPTION 'Enter an amount'; END IF;
    IF nullif(btrim(_code), '') IS NULL AND nullif(btrim(_url), '') IS NULL THEN RAISE EXCEPTION 'Enter a code or a redemption link'; END IF;
    INSERT INTO coupons(title, store_name, issued_brand, value, code, code_pin, redemption_url, value_expires_on, recipient_instructions,
      credential_type, status, reserved_by, reserved_at, claimed_at, source_id)
    VALUES ('$' || round(_value, 2) || ' ' || _b, _b, _b, round(_value, 2), nullif(btrim(_code), ''), nullif(btrim(_pin), ''), nullif(btrim(_url), ''), _expiry,
      nullif(btrim(_instructions), ''), CASE WHEN nullif(btrim(_code), '') IS NULL THEN 'prepaid_link' ELSE 'code' END,
      'claimed', f.user_id, now(), now(), _src)
    RETURNING id INTO _cid;
    _v := round(_value, 2);
  END IF;
  INSERT INTO coupon_owner_alerts(coupon_id, credential_version, fundraiser_id)
  SELECT _cid, credential_version, _fundraiser FROM coupons WHERE id = _cid ON CONFLICT DO NOTHING;
  INSERT INTO admin_audit_log(actor_id, action, table_name, record_id, after)
  VALUES (_actor, 'coupon.add_outside', 'coupons', _cid::text, jsonb_build_object('fundraiser_id', _fundraiser, 'brand', _b, 'value', _v,
    'from_stock', _stock IS NOT NULL, 'source', _source_label, 'has_donor_email', _donor_email IS NOT NULL));
  RETURN jsonb_build_object('coupon_id', _cid, 'source_id', _src, 'fundraiser_id', _fundraiser, 'brand', _b, 'value', _v);
END $$;
REVOKE ALL ON FUNCTION public.admin_add_outside_coupon(uuid,uuid,text,numeric,uuid,text,text,text,date,text,text,text,text,uuid,boolean) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_add_outside_coupon(uuid,uuid,text,numeric,uuid,text,text,text,date,text,text,text,text,uuid,boolean) TO service_role;

CREATE OR REPLACE FUNCTION public.admin_outside_coupons(_fundraiser_id uuid)
RETURNS TABLE(id uuid, source_id uuid, store_name text, value numeric, status text, code_hint text, revealed_at timestamptz, used_at timestamptz,
  source_label text, donor_name text, donor_email text, is_anonymous boolean, confirmation_sent_at timestamptz, confirmation_count integer, created_at timestamptz)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  IF NOT public.is_admin_any(auth.uid()) THEN RAISE EXCEPTION 'Admin access required'; END IF;
  RETURN QUERY SELECT c.id, s.id, coalesce(c.issued_brand, c.store_name), c.value, c.status::text, _cred_mask(c), c.revealed_at, c.used_at,
    s.source_label, s.donor_name, s.donor_email, s.is_anonymous, s.confirmation_sent_at, s.confirmation_count, s.created_at
  FROM coupon_sources s JOIN coupons c ON c.source_id = s.id
  WHERE s.fundraiser_id = _fundraiser_id AND c.status::text NOT IN ('void','returned')
  ORDER BY s.created_at DESC;
END $$;
REVOKE ALL ON FUNCTION public.admin_outside_coupons(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_outside_coupons(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.get_my_fundraiser_coupons(_fundraiser_id uuid)
 RETURNS TABLE(id uuid, donation_id uuid, store_name text, value numeric, status text, code text, redemption_url text, revealed_at timestamp with time zone, used_at timestamp with time zone, used_category text, used_note text, receipt_count integer, can_reveal boolean, issued_brand text, credential_type text, card_last4 text, value_expires_on date)
 LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $function$
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
  FROM public.coupons c
  LEFT JOIN public.donations d ON d.id = c.donation_id
  LEFT JOIN public.coupon_sources s ON s.id = c.source_id
  WHERE ((d.fundraiser_id = _fundraiser_id AND d.status = 'completed') OR (c.donation_id IS NULL AND s.fundraiser_id = _fundraiser_id))
    AND c.status::text NOT IN ('void','returned')
  ORDER BY c.store_name, c.created_at;
END $function$;

CREATE OR REPLACE FUNCTION public.owner_reveal_coupon(_coupon_id uuid)
 RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE c record; f record; v_first boolean := false;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Not allowed'; END IF;
  SELECT * INTO c FROM public.coupons WHERE id = _coupon_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Not allowed'; END IF;
  SELECT fr.id, fr.user_id INTO f FROM public.fundraisers fr WHERE fr.id = coalesce(
    (SELECT d.fundraiser_id FROM public.donations d WHERE d.id = c.donation_id AND d.status = 'completed'),
    (SELECT s.fundraiser_id FROM public.coupon_sources s WHERE s.id = c.source_id AND c.donation_id IS NULL));
  IF NOT FOUND OR f.user_id <> auth.uid() THEN RAISE EXCEPTION 'Not allowed'; END IF;
  IF c.status::text NOT IN ('claimed','reserved','redeemed') OR NOT c.has_credential
     OR NOT (c.reserved_by = auth.uid() OR c.redeemed_by = auth.uid()) THEN RAISE EXCEPTION 'Coupon being prepared'; END IF;
  IF c.revealed_at IS NULL THEN
    UPDATE public.coupons SET revealed_at = now(), revealed_by = auth.uid() WHERE id = _coupon_id AND revealed_at IS NULL;
    v_first := FOUND;
  END IF;
  IF v_first AND c.donation_id IS NOT NULL THEN
    INSERT INTO public.donor_impact_events(donation_id, coupon_id, kind) VALUES (c.donation_id, c.id, 'received') ON CONFLICT DO NOTHING;
  END IF;
  INSERT INTO public.coupon_reveal_log(coupon_id, user_id, first_reveal) VALUES (c.id, auth.uid(), v_first);
  PERFORM public.log_admin_action(CASE WHEN v_first THEN 'coupon_first_reveal' ELSE 'coupon_reveal' END, 'coupons', c.id::text, NULL,
    jsonb_build_object('fundraiser_id', f.id, 'by', 'owner'));
  RETURN jsonb_build_object('code', c.code, 'pin', c.code_pin, 'redemption_url', c.redemption_url, 'revealed_at', COALESCE(c.revealed_at, now()), 'first', v_first,
    'type', coalesce(c.credential_type, 'code'), 'card_last4', c.card_last4, 'value_expires_on', c.value_expires_on,
    'instructions', c.recipient_instructions, 'issued_brand', coalesce(c.issued_brand, c.store_name));
END $function$;

CREATE OR REPLACE FUNCTION public._owner_mark_coupon_used(_uid uuid, _coupon_id uuid, _category text, _note text)
 RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE c record; f record;
BEGIN
  IF _category IS NOT NULL AND _category NOT IN ('Groceries','Meals','Baby supplies','Household','Transportation','Health','Other') THEN RAISE EXCEPTION 'Invalid category'; END IF;
  IF _note IS NOT NULL AND length(_note) > 140 THEN RAISE EXCEPTION 'Note too long'; END IF;
  SELECT * INTO c FROM public.coupons WHERE id = _coupon_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Not allowed'; END IF;
  SELECT fr.id, fr.user_id INTO f FROM public.fundraisers fr WHERE fr.id = coalesce(
    (SELECT d.fundraiser_id FROM public.donations d WHERE d.id = c.donation_id),
    (SELECT s.fundraiser_id FROM public.coupon_sources s WHERE s.id = c.source_id AND c.donation_id IS NULL));
  IF NOT FOUND OR f.user_id <> _uid THEN RAISE EXCEPTION 'Not allowed'; END IF;
  IF c.revealed_at IS NULL THEN RAISE EXCEPTION 'Reveal the code first'; END IF;
  IF c.status::text IN ('void','returned') THEN RAISE EXCEPTION 'Not allowed'; END IF;
  UPDATE public.coupons SET used_at = COALESCE(used_at, now()), used_source = COALESCE(used_source, 'owner'),
    used_category = COALESCE(_category, used_category), used_note = COALESCE(nullif(btrim(_note),''), used_note)
  WHERE id = _coupon_id;
  IF c.donation_id IS NOT NULL THEN
    INSERT INTO public.donor_impact_events(donation_id, coupon_id, kind) VALUES (c.donation_id, c.id, 'used') ON CONFLICT DO NOTHING;
  END IF;
  INSERT INTO public.admin_audit_log(actor_id, action, table_name, record_id, before, after)
  VALUES (_uid, 'coupon_marked_used', 'coupons', c.id::text, jsonb_build_object('used_at', c.used_at), jsonb_build_object('category', _category, 'has_note', _note IS NOT NULL));
  RETURN jsonb_build_object('ok', true, 'donation_id', c.donation_id, 'fundraiser_id', f.id);
END $function$;