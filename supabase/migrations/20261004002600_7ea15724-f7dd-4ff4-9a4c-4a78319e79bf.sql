
ALTER TABLE public.coupons
  ADD COLUMN IF NOT EXISTS revealed_at timestamptz,
  ADD COLUMN IF NOT EXISTS revealed_by uuid,
  ADD COLUMN IF NOT EXISTS used_at timestamptz,
  ADD COLUMN IF NOT EXISTS used_source text,
  ADD COLUMN IF NOT EXISTS used_category text,
  ADD COLUMN IF NOT EXISTS used_note text,
  ADD COLUMN IF NOT EXISTS reveal_reminder_sent_at timestamptz;

ALTER TABLE public.messages
  ADD COLUMN IF NOT EXISTS ref_coupon_id uuid,
  ADD COLUMN IF NOT EXISTS ref_donation_id uuid,
  ADD COLUMN IF NOT EXISTS ref_label text;

CREATE TABLE public.coupon_reveal_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  coupon_id uuid NOT NULL REFERENCES public.coupons(id),
  user_id uuid NOT NULL,
  first_reveal boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now());
GRANT SELECT ON public.coupon_reveal_log TO authenticated;
GRANT ALL ON public.coupon_reveal_log TO service_role;
ALTER TABLE public.coupon_reveal_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins read reveal log" ON public.coupon_reveal_log FOR SELECT TO authenticated USING (public.is_admin_any(auth.uid()));

CREATE TABLE public.coupon_receipts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  coupon_id uuid NOT NULL REFERENCES public.coupons(id),
  uploaded_by uuid NOT NULL,
  storage_path text NOT NULL UNIQUE,
  width integer, height integer, bytes integer,
  hidden_at timestamptz, hidden_by uuid,
  created_at timestamptz NOT NULL DEFAULT now());
CREATE INDEX ON public.coupon_receipts(coupon_id);
GRANT SELECT ON public.coupon_receipts TO authenticated;
GRANT ALL ON public.coupon_receipts TO service_role;
ALTER TABLE public.coupon_receipts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins read receipts" ON public.coupon_receipts FOR SELECT TO authenticated USING (public.is_admin_any(auth.uid()));

CREATE TABLE public.donor_impact_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  donation_id uuid NOT NULL REFERENCES public.donations(id),
  coupon_id uuid NOT NULL REFERENCES public.coupons(id),
  kind text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  emailed_at timestamptz,
  skipped_reason text,
  resend_id text,
  last_error text,
  UNIQUE (coupon_id, kind));
CREATE INDEX ON public.donor_impact_events(donation_id) WHERE emailed_at IS NULL;
GRANT SELECT ON public.donor_impact_events TO authenticated;
GRANT ALL ON public.donor_impact_events TO service_role;
ALTER TABLE public.donor_impact_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins read impact events" ON public.donor_impact_events FOR SELECT TO authenticated USING (public.is_admin_any(auth.uid()));

CREATE TABLE public.donation_impact_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  donation_id uuid NOT NULL REFERENCES public.donations(id),
  token_hash text NOT NULL UNIQUE,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now());
GRANT ALL ON public.donation_impact_tokens TO service_role;
ALTER TABLE public.donation_impact_tokens ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.receipt_requests (
  coupon_id uuid PRIMARY KEY REFERENCES public.coupons(id),
  donation_id uuid NOT NULL REFERENCES public.donations(id),
  requested_by uuid NOT NULL,
  conversation_id uuid,
  created_at timestamptz NOT NULL DEFAULT now());
GRANT SELECT ON public.receipt_requests TO authenticated;
GRANT ALL ON public.receipt_requests TO service_role;
ALTER TABLE public.receipt_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Requester reads own receipt requests" ON public.receipt_requests FOR SELECT TO authenticated USING (requested_by = auth.uid() OR public.is_admin_any(auth.uid()));

CREATE TABLE public.impact_email_optouts (
  email text PRIMARY KEY,
  created_at timestamptz NOT NULL DEFAULT now());
GRANT ALL ON public.impact_email_optouts TO service_role;
ALTER TABLE public.impact_email_optouts ENABLE ROW LEVEL SECURITY;

-- Owner coupon list: never returns codes; reveal is a separate audited action.
DROP FUNCTION IF EXISTS public.get_my_fundraiser_coupons(uuid);
CREATE FUNCTION public.get_my_fundraiser_coupons(_fundraiser_id uuid)
RETURNS TABLE(id uuid, donation_id uuid, store_name text, value numeric, status text, code text, redemption_url text,
  revealed_at timestamptz, used_at timestamptz, used_category text, used_note text, receipt_count integer, can_reveal boolean)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE _owner boolean;
BEGIN
  IF auth.uid() IS NULL OR NOT public.is_fundraiser_team(_fundraiser_id, auth.uid()) THEN RAISE EXCEPTION 'Not allowed'; END IF;
  _owner := EXISTS (SELECT 1 FROM public.fundraisers f WHERE f.id = _fundraiser_id AND f.user_id = auth.uid());
  RETURN QUERY
  SELECT c.id, c.donation_id, c.store_name, COALESCE(c.value, c.expected_value), c.status::text, NULL::text, NULL::text,
    c.revealed_at, c.used_at, c.used_category, c.used_note,
    (SELECT count(*)::int FROM public.coupon_receipts r WHERE r.coupon_id = c.id AND r.hidden_at IS NULL),
    (_owner AND c.code IS NOT NULL AND c.status::text IN ('claimed','reserved','redeemed') AND (c.reserved_by = auth.uid() OR c.redeemed_by = auth.uid()))
  FROM public.coupons c JOIN public.donations d ON d.id = c.donation_id
  WHERE d.fundraiser_id = _fundraiser_id AND d.status = 'completed' AND c.status::text NOT IN ('void','returned')
  ORDER BY c.store_name, c.created_at;
END $$;
REVOKE ALL ON FUNCTION public.get_my_fundraiser_coupons(uuid) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.get_my_fundraiser_coupons(uuid) TO authenticated;

-- Owner-only reveal. First reveal recorded exactly once and queues donor email #1.
CREATE OR REPLACE FUNCTION public.owner_reveal_coupon(_coupon_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE c record; f record; v_first boolean := false;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Not allowed'; END IF;
  SELECT * INTO c FROM public.coupons WHERE id = _coupon_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Not allowed'; END IF;
  SELECT fr.id, fr.user_id INTO f FROM public.donations d JOIN public.fundraisers fr ON fr.id = d.fundraiser_id
   WHERE d.id = c.donation_id AND d.status = 'completed';
  IF NOT FOUND OR f.user_id <> auth.uid() THEN RAISE EXCEPTION 'Not allowed'; END IF;
  IF c.status::text NOT IN ('claimed','reserved','redeemed') OR c.code IS NULL
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
  RETURN jsonb_build_object('code', c.code, 'redemption_url', c.redemption_url,
    'revealed_at', COALESCE(c.revealed_at, now()), 'first', v_first);
END $$;
REVOKE ALL ON FUNCTION public.owner_reveal_coupon(uuid) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.owner_reveal_coupon(uuid) TO authenticated;

-- Mark used: server-only (called by impact-actions after note moderation).
CREATE OR REPLACE FUNCTION public._owner_mark_coupon_used(_uid uuid, _coupon_id uuid, _category text, _note text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE c record; f record;
BEGIN
  IF _category IS NOT NULL AND _category NOT IN ('Groceries','Meals','Baby supplies','Household','Transportation','Health','Other') THEN RAISE EXCEPTION 'Invalid category'; END IF;
  IF _note IS NOT NULL AND length(_note) > 140 THEN RAISE EXCEPTION 'Note too long'; END IF;
  SELECT * INTO c FROM public.coupons WHERE id = _coupon_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Not allowed'; END IF;
  SELECT fr.id, fr.user_id INTO f FROM public.donations d JOIN public.fundraisers fr ON fr.id = d.fundraiser_id WHERE d.id = c.donation_id;
  IF NOT FOUND OR f.user_id <> _uid THEN RAISE EXCEPTION 'Not allowed'; END IF;
  IF c.revealed_at IS NULL THEN RAISE EXCEPTION 'Reveal the code first'; END IF;
  IF c.status::text IN ('void','returned') THEN RAISE EXCEPTION 'Not allowed'; END IF;
  UPDATE public.coupons SET used_at = COALESCE(used_at, now()), used_source = COALESCE(used_source, 'owner'),
    used_category = COALESCE(_category, used_category), used_note = COALESCE(nullif(btrim(_note),''), used_note)
  WHERE id = _coupon_id;
  INSERT INTO public.donor_impact_events(donation_id, coupon_id, kind) VALUES (c.donation_id, c.id, 'used') ON CONFLICT DO NOTHING;
  INSERT INTO public.admin_audit_log(actor_id, action, table_name, record_id, before, after)
  VALUES (_uid, 'coupon_marked_used', 'coupons', c.id::text, jsonb_build_object('used_at', c.used_at), jsonb_build_object('category', _category, 'has_note', _note IS NOT NULL));
  RETURN jsonb_build_object('ok', true, 'donation_id', c.donation_id, 'fundraiser_id', f.id);
END $$;
REVOKE ALL ON FUNCTION public._owner_mark_coupon_used(uuid,uuid,text,text) FROM public, anon, authenticated;

-- Receipt access rule: donor of the funding donation, fundraiser owner, or admin/staff. Never co-organizers.
CREATE OR REPLACE FUNCTION public.can_view_coupon_receipts(_coupon_id uuid, _uid uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
  SELECT _uid IS NOT NULL AND (
    public.is_admin_staff(_uid)
    OR EXISTS (SELECT 1 FROM public.coupons c JOIN public.donations d ON d.id = c.donation_id
               JOIN public.fundraisers f ON f.id = d.fundraiser_id
               WHERE c.id = _coupon_id AND (f.user_id = _uid OR d.donor_id = _uid
                 OR (d.donor_email IS NOT NULL AND lower(d.donor_email) = (SELECT lower(email) FROM auth.users WHERE id = _uid AND email_confirmed_at IS NOT NULL)))))
$$;
REVOKE ALL ON FUNCTION public.can_view_coupon_receipts(uuid,uuid) FROM public, anon, authenticated;

-- Is _uid the donor of _donation_id (account or verified email)?
CREATE OR REPLACE FUNCTION public._is_donation_donor(_donation_id uuid, _uid uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
  SELECT _uid IS NOT NULL AND EXISTS (SELECT 1 FROM public.donations d WHERE d.id = _donation_id AND (d.donor_id = _uid
    OR (d.donor_email IS NOT NULL AND lower(d.donor_email) = (SELECT lower(email) FROM auth.users WHERE id = _uid AND email_confirmed_at IS NOT NULL))))
$$;
REVOKE ALL ON FUNCTION public._is_donation_donor(uuid,uuid) FROM public, anon, authenticated;

-- Shared impact payload for one donation (no codes, no recipient personal details).
CREATE OR REPLACE FUNCTION public._donation_impact(_donation_id uuid)
RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
  SELECT jsonb_build_object(
    'donation_id', d.id, 'amount', d.amount, 'created_at', d.created_at,
    'fundraiser_id', f.id, 'fundraiser_title', f.title, 'fundraiser_slug', f.unique_slug,
    'organizer', (SELECT o.display_name FROM public.get_fundraiser_organizer(f.id) o LIMIT 1),
    'coupons', COALESCE((SELECT jsonb_agg(jsonb_build_object(
        'id', c.id, 'store_name', c.store_name, 'value', COALESCE(c.value, c.expected_value), 'status', c.status,
        'created_at', c.created_at, 'revealed_at', c.revealed_at, 'used_at', c.used_at,
        'used_category', c.used_category, 'used_note', c.used_note,
        'receipt_count', (SELECT count(*) FROM public.coupon_receipts r WHERE r.coupon_id = c.id AND r.hidden_at IS NULL),
        'receipt_requested', EXISTS (SELECT 1 FROM public.receipt_requests q WHERE q.coupon_id = c.id)
      ) ORDER BY c.store_name, c.created_at) FROM public.coupons c WHERE c.donation_id = d.id AND c.status::text NOT IN ('void','returned')), '[]'::jsonb))
  FROM public.donations d LEFT JOIN public.fundraisers f ON f.id = d.fundraiser_id
  WHERE d.id = _donation_id AND d.status = 'completed'
$$;
REVOKE ALL ON FUNCTION public._donation_impact(uuid) FROM public, anon, authenticated;

CREATE OR REPLACE FUNCTION public.get_donation_impact(_donation_id uuid)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  IF NOT (public._is_donation_donor(_donation_id, auth.uid()) OR public.is_admin_staff(auth.uid())) THEN RAISE EXCEPTION 'Not allowed'; END IF;
  RETURN public._donation_impact(_donation_id);
END $$;
REVOKE ALL ON FUNCTION public.get_donation_impact(uuid) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.get_donation_impact(uuid) TO authenticated;

-- Guest token -> donation (only while unexpired). Server-only.
CREATE OR REPLACE FUNCTION public._impact_token_donation(_hash text)
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
  SELECT donation_id FROM public.donation_impact_tokens WHERE token_hash = _hash AND expires_at > now() LIMIT 1
$$;
REVOKE ALL ON FUNCTION public._impact_token_donation(text) FROM public, anon, authenticated;

CREATE OR REPLACE FUNCTION public.admin_hide_receipt(_receipt_id uuid, _hidden boolean DEFAULT true)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE r record;
BEGIN
  IF NOT public.is_admin_staff(auth.uid()) THEN RAISE EXCEPTION 'Staff access required'; END IF;
  SELECT * INTO r FROM public.coupon_receipts WHERE id = _receipt_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Receipt not found'; END IF;
  UPDATE public.coupon_receipts SET hidden_at = CASE WHEN _hidden THEN now() END, hidden_by = CASE WHEN _hidden THEN auth.uid() END WHERE id = _receipt_id;
  PERFORM public.log_admin_action(CASE WHEN _hidden THEN 'receipt_hidden' ELSE 'receipt_unhidden' END, 'coupon_receipts', _receipt_id::text,
    jsonb_build_object('hidden_at', r.hidden_at), jsonb_build_object('hidden', _hidden, 'coupon_id', r.coupon_id));
END $$;
REVOKE ALL ON FUNCTION public.admin_hide_receipt(uuid, boolean) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.admin_hide_receipt(uuid, boolean) TO authenticated;
