ALTER TYPE public.coupon_status ADD VALUE IF NOT EXISTS 'in_stock';
ALTER TABLE public.coupons ADD COLUMN IF NOT EXISTS batch_id uuid REFERENCES public.coupon_procurement_batches(id) ON DELETE SET NULL;
ALTER TABLE public.coupon_procurement_batches ADD COLUMN IF NOT EXISTS name text;
CREATE INDEX IF NOT EXISTS coupons_stock_idx ON public.coupons (store_name, value, created_at) WHERE donation_id IS NULL;

CREATE OR REPLACE FUNCTION public._mask_code(_c text) RETURNS text LANGUAGE sql IMMUTABLE SET search_path = public AS
$$ SELECT CASE WHEN _c IS NULL THEN NULL WHEN length(_c) <= 4 THEN '••••' ELSE '••••' || right(_c, 4) END $$;

CREATE OR REPLACE FUNCTION public._check_code(_code text, _url text) RETURNS void LANGUAGE plpgsql IMMUTABLE SET search_path = public AS $$
BEGIN
  IF _code IS NULL OR length(btrim(_code)) < 3 OR length(btrim(_code)) > 200 THEN RAISE EXCEPTION 'Code must be 3–200 characters'; END IF;
  IF _url IS NOT NULL AND (_url !~* '^https://' OR length(_url) > 1000) THEN RAISE EXCEPTION 'Redemption link must start with https://'; END IF;
END $$;

-- Give a stock code to a waiting donation coupon (internal)
CREATE OR REPLACE FUNCTION public._give_stock(_target uuid, _stock uuid) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
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
  DELETE FROM coupons WHERE id = _stock;
  PERFORM log_admin_action('coupon.give_stock', 'coupons', _target::text,
    jsonb_build_object('stock_id', _stock, 'code', _mask_code(s.code)), jsonb_build_object('fundraiser_id', _fid, 'status', 'claimed'));
  RETURN _fid;
END $$;
REVOKE ALL ON FUNCTION public._give_stock(uuid, uuid) FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.admin_add_stock_codes(_brand text, _value numeric, _codes text[], _url text DEFAULT NULL, _expiry date DEFAULT NULL, _batch jsonb DEFAULT '{}'::jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _bid uuid; c text; _n int := 0; _dup int := 0; _clean text[] := '{}';
BEGIN
  IF NOT is_admin_staff(auth.uid()) THEN RAISE EXCEPTION 'Staff access required'; END IF;
  _brand := btrim(coalesce(_brand,'')); _url := nullif(btrim(coalesce(_url,'')),'');
  IF length(_brand) < 2 OR length(_brand) > 80 THEN RAISE EXCEPTION 'Choose a brand'; END IF;
  IF _value IS NULL OR _value < 1 OR _value > 500 OR _value <> round(_value,2) THEN RAISE EXCEPTION 'Amount must be between $1 and $500'; END IF;
  IF _codes IS NULL OR array_length(_codes,1) IS NULL OR array_length(_codes,1) > 500 THEN RAISE EXCEPTION 'Add between 1 and 500 codes'; END IF;
  FOREACH c IN ARRAY _codes LOOP c := btrim(c); IF c <> '' AND NOT c = ANY(_clean) THEN PERFORM _check_code(c, _url); _clean := _clean || c; END IF; END LOOP;
  IF array_length(_clean,1) IS NULL THEN RAISE EXCEPTION 'Add at least one code'; END IF;
  INSERT INTO coupon_procurement_batches (brand_name, coupon_value, total_count, total_cost, vendor, notes, name, uploaded_by)
  VALUES (_brand, _value, 0, nullif(_batch->>'total_cost','')::numeric, nullif(btrim(coalesce(_batch->>'vendor','')),''),
          nullif(btrim(coalesce(_batch->>'notes','')),''), coalesce(nullif(btrim(coalesce(_batch->>'name','')),''), _brand || ' $' || _value || ' — ' || to_char(now(),'Mon DD')), auth.uid())
  RETURNING id INTO _bid;
  FOREACH c IN ARRAY _clean LOOP
    IF EXISTS (SELECT 1 FROM coupons WHERE store_name = _brand AND code = c) THEN _dup := _dup + 1; CONTINUE; END IF;
    INSERT INTO coupons (title, store_name, value, code, redemption_url, expiry_date, status, batch_id)
    VALUES ('$' || _value || ' ' || _brand || ' coupon', _brand, _value, c, _url, _expiry, 'in_stock', _bid);
    _n := _n + 1;
  END LOOP;
  UPDATE coupon_procurement_batches SET total_count = _n WHERE id = _bid;
  PERFORM log_admin_action('coupon.stock_add', 'coupon_procurement_batches', _bid::text, NULL, jsonb_build_object('brand',_brand,'value',_value,'added',_n,'duplicates',_dup));
  RETURN jsonb_build_object('batch_id', _bid, 'added', _n, 'duplicates', _dup);
END $$;

CREATE OR REPLACE FUNCTION public.admin_edit_stock_code(_id uuid, _patch jsonb) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE s record; _code text; _url text; _v numeric; _exp date;
BEGIN
  IF NOT is_admin_staff(auth.uid()) THEN RAISE EXCEPTION 'Staff access required'; END IF;
  SELECT * INTO s FROM coupons WHERE id = _id AND status::text = 'in_stock' AND donation_id IS NULL FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Only unused stock codes can be edited'; END IF;
  _code := CASE WHEN _patch ? 'code' THEN btrim(_patch->>'code') ELSE s.code END;
  _url := CASE WHEN _patch ? 'redemption_url' THEN nullif(btrim(coalesce(_patch->>'redemption_url','')),'') ELSE s.redemption_url END;
  _v := CASE WHEN _patch ? 'value' THEN (_patch->>'value')::numeric ELSE s.value END;
  _exp := CASE WHEN _patch ? 'expiry_date' THEN nullif(_patch->>'expiry_date','')::date ELSE s.expiry_date END;
  PERFORM _check_code(_code, _url);
  IF _v IS NULL OR _v < 1 OR _v > 500 OR _v <> round(_v,2) THEN RAISE EXCEPTION 'Amount must be between $1 and $500'; END IF;
  UPDATE coupons SET code = _code, redemption_url = _url, value = _v, expiry_date = _exp, title = '$' || _v || ' ' || store_name || ' coupon', updated_at = now() WHERE id = _id;
  PERFORM log_admin_action('coupon.stock_edit', 'coupons', _id::text,
    jsonb_build_object('code', _mask_code(s.code), 'value', s.value, 'url', s.redemption_url, 'expiry', s.expiry_date),
    jsonb_build_object('code', _mask_code(_code), 'value', _v, 'url', _url, 'expiry', _exp));
END $$;

CREATE OR REPLACE FUNCTION public.admin_delete_stock_code(_id uuid) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE s record;
BEGIN
  IF NOT is_admin_staff(auth.uid()) THEN RAISE EXCEPTION 'Staff access required'; END IF;
  DELETE FROM coupons WHERE id = _id AND status::text = 'in_stock' AND donation_id IS NULL RETURNING * INTO s;
  IF NOT FOUND THEN RAISE EXCEPTION 'Only unused stock codes can be removed'; END IF;
  PERFORM log_admin_action('coupon.stock_delete', 'coupons', _id::text, jsonb_build_object('brand', s.store_name, 'value', s.value, 'code', _mask_code(s.code)), NULL);
END $$;

CREATE OR REPLACE FUNCTION public.admin_assign_stock_code(_target uuid, _stock uuid) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT is_admin_staff(auth.uid()) THEN RAISE EXCEPTION 'Staff access required'; END IF;
  RETURN _give_stock(_target, _stock);
END $$;

CREATE OR REPLACE FUNCTION public.admin_fill_from_stock(_brand text, _value numeric, _limit int DEFAULT 50)
RETURNS TABLE(fundraiser_id uuid, coupon_ids uuid[]) LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE t record; s uuid; _fid uuid; _res jsonb := '{}'::jsonb; _done int := 0;
BEGIN
  IF NOT is_admin_staff(auth.uid()) THEN RAISE EXCEPTION 'Staff access required'; END IF;
  FOR t IN SELECT c.id FROM coupons c JOIN donations d ON d.id = c.donation_id JOIN fundraisers fr ON fr.id = d.fundraiser_id
           WHERE c.store_name = _brand AND coalesce(c.value, c.expected_value) = _value AND c.code IS NULL
             AND c.status::text IN ('pending_procurement','procurement_failed')
           ORDER BY c.created_at LIMIT least(greatest(coalesce(_limit,50),1),200) LOOP
    SELECT id INTO s FROM coupons WHERE status::text = 'in_stock' AND donation_id IS NULL AND store_name = _brand AND value = _value
      AND (expiry_date IS NULL OR expiry_date >= current_date) ORDER BY created_at LIMIT 1 FOR UPDATE SKIP LOCKED;
    EXIT WHEN s IS NULL;
    _fid := _give_stock(t.id, s); s := NULL; _done := _done + 1;
    _res := jsonb_set(_res, ARRAY[_fid::text], coalesce(_res->_fid::text, '[]'::jsonb) || to_jsonb(t.id));
  END LOOP;
  RETURN QUERY SELECT k::uuid, ARRAY(SELECT jsonb_array_elements_text(v)::uuid) FROM jsonb_each(_res) AS e(k, v);
END $$;

CREATE OR REPLACE FUNCTION public.admin_mark_coupon_used(_id uuid, _used boolean) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE s record;
BEGIN
  IF NOT is_admin_staff(auth.uid()) THEN RAISE EXCEPTION 'Staff access required'; END IF;
  SELECT * INTO s FROM coupons WHERE id = _id FOR UPDATE;
  IF NOT FOUND OR s.donation_id IS NULL OR s.code IS NULL THEN RAISE EXCEPTION 'Only coupons given to a fundraiser can be marked'; END IF;
  IF _used THEN
    UPDATE coupons SET status = 'redeemed', redeemed_at = coalesce(redeemed_at, now()), redeemed_by = coalesce(redeemed_by, reserved_by), updated_at = now() WHERE id = _id;
  ELSE
    UPDATE coupons SET status = 'claimed', redeemed_at = NULL, redeemed_by = NULL, updated_at = now() WHERE id = _id;
  END IF;
  PERFORM log_admin_action(CASE WHEN _used THEN 'coupon.mark_used' ELSE 'coupon.mark_unused' END, 'coupons', _id::text, jsonb_build_object('status', s.status), jsonb_build_object('status', CASE WHEN _used THEN 'redeemed' ELSE 'claimed' END));
END $$;

CREATE OR REPLACE FUNCTION public.admin_reveal_code(_id uuid) RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _c text;
BEGIN
  IF NOT is_admin_staff(auth.uid()) THEN RAISE EXCEPTION 'Staff access required'; END IF;
  SELECT code INTO _c FROM coupons WHERE id = _id;
  PERFORM log_admin_action('coupon.reveal', 'coupons', _id::text, NULL, NULL);
  RETURN _c;
END $$;

CREATE OR REPLACE FUNCTION public.admin_inventory_summary()
RETURNS TABLE(store_name text, value numeric, in_stock bigint, waiting bigint, given bigint, used bigint, expired bigint)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT is_admin_any(auth.uid()) THEN RAISE EXCEPTION 'Team access required'; END IF;
  RETURN QUERY SELECT c.store_name, coalesce(c.value, c.expected_value) v,
    count(*) FILTER (WHERE c.status::text = 'in_stock' AND (c.expiry_date IS NULL OR c.expiry_date >= current_date)),
    count(*) FILTER (WHERE c.donation_id IS NOT NULL AND c.code IS NULL AND c.status::text IN ('pending_procurement','procurement_failed')),
    count(*) FILTER (WHERE c.donation_id IS NOT NULL AND c.code IS NOT NULL AND c.status::text NOT IN ('redeemed','expired')),
    count(*) FILTER (WHERE c.status::text = 'redeemed'),
    count(*) FILTER (WHERE c.status::text = 'expired' OR (c.status::text = 'in_stock' AND c.expiry_date < current_date))
  FROM coupons c GROUP BY 1, 2 ORDER BY 1, 2;
END $$;

-- Usage tracker: every coded coupon with where it went (codes masked)
CREATE OR REPLACE FUNCTION public.admin_code_usage(_state text DEFAULT 'all', _search text DEFAULT NULL, _limit int DEFAULT 25, _offset int DEFAULT 0)
RETURNS TABLE(id uuid, store_name text, value numeric, state text, code_hint text, redemption_url text, expiry_date date, batch_name text,
  fundraiser_id uuid, fundraiser_title text, donation_id uuid, given_at timestamptz, used_at timestamptz, created_at timestamptz, total_count bigint)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT is_admin_any(auth.uid()) THEN RAISE EXCEPTION 'Team access required'; END IF;
  RETURN QUERY WITH x AS (
    SELECT c.id, c.store_name, coalesce(c.value, c.expected_value) value,
      CASE WHEN c.status::text = 'redeemed' THEN 'used'
           WHEN c.status::text = 'expired' OR (c.expiry_date < current_date AND c.status::text <> 'redeemed') THEN 'expired'
           WHEN c.status::text = 'in_stock' THEN 'in_stock'
           WHEN c.donation_id IS NOT NULL AND c.code IS NULL THEN 'waiting'
           ELSE 'given' END state,
      _mask_code(c.code) code_hint, c.redemption_url, c.expiry_date, b.name batch_name, fr.id fid, fr.title ftitle, c.donation_id,
      coalesce(c.claimed_at, c.reserved_at) given_at, c.redeemed_at, c.created_at
    FROM coupons c LEFT JOIN coupon_procurement_batches b ON b.id = c.batch_id
    LEFT JOIN donations d ON d.id = c.donation_id LEFT JOIN fundraisers fr ON fr.id = d.fundraiser_id)
  SELECT x.*, count(*) OVER () FROM x
   WHERE (_state = 'all' OR x.state = _state)
     AND (_search IS NULL OR _search = '' OR x.store_name ILIKE '%'||_search||'%' OR x.ftitle ILIKE '%'||_search||'%' OR x.batch_name ILIKE '%'||_search||'%')
   ORDER BY x.created_at DESC LIMIT least(greatest(_limit,1),200) OFFSET greatest(_offset,0);
END $$;

-- Fix: uploaded codes went to status 'available' (visible to every signed-in user). Now given to the owner; extras kept in stock.
CREATE OR REPLACE FUNCTION public.attach_procured_codes(_brand text, _value numeric, _codes text[]) RETURNS integer
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE r jsonb; _n int := 0; t record; s record;
BEGIN
  IF NOT is_admin_staff(auth.uid()) THEN RAISE EXCEPTION 'Staff access required'; END IF;
  r := admin_add_stock_codes(_brand, _value, _codes, NULL, NULL, '{}'::jsonb);
  SELECT count(*) INTO _n FROM admin_fill_from_stock(_brand, _value, 200);
  SELECT count(*) INTO _n FROM coupons WHERE batch_id = (r->>'batch_id')::uuid AND donation_id IS NOT NULL;
  RETURN _n;
END $$;

DO $$ DECLARE f text; BEGIN
  FOREACH f IN ARRAY ARRAY['admin_add_stock_codes(text,numeric,text[],text,date,jsonb)','admin_edit_stock_code(uuid,jsonb)','admin_delete_stock_code(uuid)',
    'admin_assign_stock_code(uuid,uuid)','admin_fill_from_stock(text,numeric,integer)','admin_mark_coupon_used(uuid,boolean)','admin_reveal_code(uuid)',
    'admin_inventory_summary()','admin_code_usage(text,text,integer,integer)','attach_procured_codes(text,numeric,text[])'] LOOP
    EXECUTE format('REVOKE ALL ON FUNCTION public.%s FROM PUBLIC, anon', f);
    EXECUTE format('GRANT EXECUTE ON FUNCTION public.%s TO authenticated', f);
  END LOOP;
END $$;