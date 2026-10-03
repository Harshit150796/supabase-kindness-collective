CREATE OR REPLACE FUNCTION public.admin_resplit_coupons(_donation_id uuid, _brand text, _values numeric[])
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _old numeric; _n int; _locked int; _v numeric; _donor uuid; _exp date; _title text; _before jsonb;
BEGIN
  IF NOT public.is_admin_staff(auth.uid()) THEN RAISE EXCEPTION 'Staff access required'; END IF;
  IF _values IS NULL OR array_length(_values,1) IS NULL OR array_length(_values,1) > 50 THEN RAISE EXCEPTION 'Give between 1 and 50 coupon amounts'; END IF;
  FOREACH _v IN ARRAY _values LOOP
    IF _v < 1 OR _v > 500 OR _v <> round(_v,2) THEN RAISE EXCEPTION 'Each coupon must be between $1 and $500'; END IF;
  END LOOP;
  IF NOT EXISTS (SELECT 1 FROM donations WHERE id = _donation_id AND fundraiser_id IS NOT NULL) THEN RAISE EXCEPTION 'Donation not linked to a fundraiser'; END IF;
  SELECT count(*) INTO _locked FROM coupons WHERE donation_id = _donation_id AND store_name = _brand
    AND (code IS NOT NULL OR status NOT IN ('pending_procurement','procurement_failed'));
  IF _locked > 0 THEN RAISE EXCEPTION 'Some % coupons already have codes; remove nothing and re-split only uncoded ones is not allowed', _brand; END IF;
  SELECT coalesce(sum(coalesce(value,0)),0), count(*), max(donor_id::text)::uuid, max(expiry_date), max(title),
         jsonb_agg(jsonb_build_object('id',id,'value',value))
    INTO _old, _n, _donor, _exp, _title, _before
    FROM coupons WHERE donation_id = _donation_id AND store_name = _brand;
  IF _n = 0 THEN RAISE EXCEPTION 'No coupons for that brand on this donation'; END IF;
  IF (SELECT sum(x) FROM unnest(_values) x) <> _old THEN RAISE EXCEPTION 'Amounts must add up to exactly $%', _old; END IF;
  DELETE FROM coupons WHERE donation_id = _donation_id AND store_name = _brand;
  INSERT INTO coupons (donation_id, donor_id, title, store_name, value, expected_value, code, status, expiry_date)
    SELECT _donation_id, _donor, coalesce(_title, _brand || ' Gift'), _brand, x, x, NULL, 'pending_procurement', _exp FROM unnest(_values) x;
  PERFORM public.log_admin_action('resplit_coupons', 'coupons', _donation_id::text, jsonb_build_object('brand',_brand,'coupons',_before), jsonb_build_object('brand',_brand,'values',to_jsonb(_values)));
  RETURN array_length(_values,1);
END $$;
REVOKE ALL ON FUNCTION public.admin_resplit_coupons(uuid,text,numeric[]) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_resplit_coupons(uuid,text,numeric[]) TO authenticated;