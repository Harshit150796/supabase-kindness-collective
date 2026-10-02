
CREATE TABLE public.partner_inquiries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_name text NOT NULL, org_type text NOT NULL, contact_name text NOT NULL, email text NOT NULL,
  city_state text, families_count integer, message text,
  status text NOT NULL DEFAULT 'new', created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, UPDATE ON public.partner_inquiries TO authenticated;
GRANT ALL ON public.partner_inquiries TO service_role;
ALTER TABLE public.partner_inquiries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Team reads partner inquiries" ON public.partner_inquiries FOR SELECT TO authenticated USING (public.is_admin_any(auth.uid()));
CREATE POLICY "Staff update partner inquiries" ON public.partner_inquiries FOR UPDATE TO authenticated USING (public.is_admin_staff(auth.uid())) WITH CHECK (public.is_admin_staff(auth.uid()));

CREATE TABLE public.partner_rate_limits (id bigserial PRIMARY KEY, ip_hash text NOT NULL, created_at timestamptz NOT NULL DEFAULT now());
CREATE INDEX ON public.partner_rate_limits(ip_hash, created_at);
GRANT ALL ON public.partner_rate_limits TO service_role;
ALTER TABLE public.partner_rate_limits ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.cms_testimonials
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'approved',
  ADD COLUMN IF NOT EXISTS submitted_by uuid,
  ADD COLUMN IF NOT EXISTS is_anonymous boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS consent_at timestamptz,
  ADD COLUMN IF NOT EXISTS submitter_role text;

CREATE TABLE public.gold_coin_ledger (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  donation_id uuid NOT NULL,
  entry_type text NOT NULL DEFAULT 'credit',
  user_id uuid, donor_email text,
  coins integer NOT NULL,
  status text NOT NULL DEFAULT 'credited',
  needs_review boolean NOT NULL DEFAULT false,
  note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  credited_at timestamptz,
  UNIQUE (donation_id, entry_type)
);
CREATE INDEX ON public.gold_coin_ledger(user_id);
CREATE INDEX ON public.gold_coin_ledger(lower(donor_email)) WHERE status = 'pending';
GRANT SELECT ON public.gold_coin_ledger TO authenticated;
GRANT ALL ON public.gold_coin_ledger TO service_role;
ALTER TABLE public.gold_coin_ledger ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own coin rows" ON public.gold_coin_ledger FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.is_admin_any(auth.uid()));

CREATE OR REPLACE FUNCTION public._gc_apply(_uid uuid, _delta integer) RETURNS integer
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE bal integer;
BEGIN
  INSERT INTO loyalty_cards(user_id, card_number, points_balance)
  SELECT _uid, generate_card_number(), 0 WHERE NOT EXISTS (SELECT 1 FROM loyalty_cards WHERE user_id = _uid);
  UPDATE loyalty_cards SET points_balance = COALESCE(points_balance,0) + _delta, updated_at = now() WHERE user_id = _uid RETURNING points_balance INTO bal;
  RETURN bal;
END $$;
REVOKE ALL ON FUNCTION public._gc_apply(uuid, integer) FROM PUBLIC, anon, authenticated;

-- Exactly-once crediting + reversals. Reads donations only.
CREATE OR REPLACE FUNCTION public.credit_gold_coins() RETURNS json
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE r record; credited int := 0; pending int := 0; coins_total int := 0; reversed int := 0; bal int;
BEGIN
  FOR r IN
    INSERT INTO gold_coin_ledger(donation_id, entry_type, user_id, donor_email, coins, status, credited_at)
    SELECT d.id, 'credit', d.donor_id, lower(d.donor_email), floor(d.amount * 10)::int,
           CASE WHEN d.donor_id IS NULL THEN 'pending' ELSE 'credited' END,
           CASE WHEN d.donor_id IS NULL THEN NULL ELSE now() END
    FROM donations d
    WHERE d.status IN ('completed','succeeded') AND floor(d.amount*10) > 0
      AND (d.donor_id IS NOT NULL OR d.donor_email IS NOT NULL)
    ON CONFLICT (donation_id, entry_type) DO NOTHING
    RETURNING user_id, coins, status
  LOOP
    IF r.status = 'credited' THEN PERFORM _gc_apply(r.user_id, r.coins); credited := credited + 1; coins_total := coins_total + r.coins;
    ELSE pending := pending + 1; END IF;
  END LOOP;

  FOR r IN
    SELECT l.* FROM gold_coin_ledger l JOIN donations d ON d.id = l.donation_id
    WHERE l.entry_type = 'credit' AND d.status IN ('refunded','disputed','chargeback','dispute_lost')
      AND NOT EXISTS (SELECT 1 FROM gold_coin_ledger x WHERE x.donation_id = l.donation_id AND x.entry_type = 'reversal')
  LOOP
    IF r.status = 'credited' THEN
      bal := _gc_apply(r.user_id, -r.coins);
      INSERT INTO gold_coin_ledger(donation_id, entry_type, user_id, coins, status, credited_at, needs_review, note)
      VALUES (r.donation_id, 'reversal', r.user_id, -r.coins, 'credited', now(), bal < 0, CASE WHEN bal < 0 THEN 'Balance went negative after reversal' END)
      ON CONFLICT DO NOTHING;
    ELSE
      UPDATE gold_coin_ledger SET status = 'void' WHERE id = r.id AND status = 'pending';
      INSERT INTO gold_coin_ledger(donation_id, entry_type, coins, status, note)
      VALUES (r.donation_id, 'reversal', 0, 'void', 'Pending guest credit voided by refund') ON CONFLICT DO NOTHING;
    END IF;
    reversed := reversed + 1;
  END LOOP;
  RETURN json_build_object('credited', credited, 'coins', coins_total, 'pending', pending, 'reversed', reversed);
END $$;
REVOKE ALL ON FUNCTION public.credit_gold_coins() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.credit_gold_coins() TO service_role;

-- Guest claim: only verified emails.
CREATE OR REPLACE FUNCTION public.claim_gold_coins() RETURNS integer
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE em text; total int := 0; r record;
BEGIN
  SELECT lower(email) INTO em FROM auth.users WHERE id = auth.uid() AND email_confirmed_at IS NOT NULL;
  IF em IS NULL THEN RETURN 0; END IF;
  FOR r IN UPDATE gold_coin_ledger SET user_id = auth.uid(), status = 'credited', credited_at = now()
           WHERE entry_type = 'credit' AND status = 'pending' AND user_id IS NULL AND lower(donor_email) = em
           RETURNING coins LOOP
    total := total + r.coins;
  END LOOP;
  IF total > 0 THEN PERFORM _gc_apply(auth.uid(), total); END IF;
  RETURN total;
END $$;
REVOKE ALL ON FUNCTION public.claim_gold_coins() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.claim_gold_coins() TO authenticated;

CREATE OR REPLACE FUNCTION public.get_completed_fundraisers() RETURNS TABLE(id uuid, title text, unique_slug text, category text, cover_photo_url text, goal numeric, raised numeric, coupons_issued bigint, coupons_redeemed bigint)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  WITH t AS (
    SELECT f.id, f.title, f.unique_slug, f.category, f.cover_photo_url, f.monthly_goal, f.status,
      COALESCE((SELECT sum(d.amount) FROM donations d WHERE d.fundraiser_id = f.id AND d.status IN ('completed','succeeded')),0) raised
    FROM fundraisers f WHERE f.archived_at IS NULL AND f.status IN ('active','completed','paused'))
  SELECT t.id, t.title, t.unique_slug, t.category, t.cover_photo_url, t.monthly_goal, t.raised,
    (SELECT count(*) FROM coupons c JOIN donations d ON d.id = c.donation_id WHERE d.fundraiser_id = t.id),
    (SELECT count(*) FROM coupons c JOIN donations d ON d.id = c.donation_id WHERE d.fundraiser_id = t.id AND (c.redeemed_at IS NOT NULL OR c.status = 'redeemed'))
  FROM t WHERE t.status = 'completed' OR (t.monthly_goal > 0 AND t.raised >= t.monthly_goal)
$$;
GRANT EXECUTE ON FUNCTION public.get_completed_fundraisers() TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.get_proof_stats() RETURNS json
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT json_build_object(
    'issued_month', (SELECT count(*) FROM coupons WHERE created_at >= date_trunc('month', now()) AND donation_id IS NOT NULL),
    'redeemed_month', (SELECT count(*) FROM coupons WHERE redeemed_at >= date_trunc('month', now())),
    'issued_total', (SELECT count(*) FROM coupons WHERE donation_id IS NOT NULL),
    'redeemed_total', (SELECT count(*) FROM coupons WHERE redeemed_at IS NOT NULL OR status = 'redeemed'))
$$;
GRANT EXECUTE ON FUNCTION public.get_proof_stats() TO anon, authenticated;
