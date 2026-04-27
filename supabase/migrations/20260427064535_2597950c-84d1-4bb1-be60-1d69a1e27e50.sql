
-- 1. Expand coupon_status enum (safe to add new values)
ALTER TYPE public.coupon_status ADD VALUE IF NOT EXISTS 'pending_procurement';
ALTER TYPE public.coupon_status ADD VALUE IF NOT EXISTS 'claimed';
ALTER TYPE public.coupon_status ADD VALUE IF NOT EXISTS 'expired';

-- 2. Coupons: new columns for lifecycle + donor attribution
ALTER TABLE public.coupons
  ADD COLUMN IF NOT EXISTS donor_id uuid,
  ADD COLUMN IF NOT EXISTS claimed_at timestamp with time zone,
  ADD COLUMN IF NOT EXISTS expected_value numeric;

-- Make code nullable (slots can exist before procurement)
ALTER TABLE public.coupons ALTER COLUMN code DROP NOT NULL;

-- Backfill expected_value and donor_id from donations
UPDATE public.coupons c
SET expected_value = COALESCE(c.expected_value, c.value),
    donor_id = COALESCE(c.donor_id, d.donor_id)
FROM public.donations d
WHERE c.donation_id = d.id;

-- Index for donor "My Coupons" lookup
CREATE INDEX IF NOT EXISTS idx_coupons_donor_id ON public.coupons(donor_id);
CREATE INDEX IF NOT EXISTS idx_coupons_status_brand ON public.coupons(status, store_name);

-- 3. Procurement batches table
CREATE TABLE IF NOT EXISTS public.coupon_procurement_batches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_name text NOT NULL,
  coupon_value numeric NOT NULL,
  total_count integer NOT NULL,
  total_cost numeric,
  vendor text,
  notes text,
  uploaded_by uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.coupon_procurement_batches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage procurement batches"
  ON public.coupon_procurement_batches
  FOR ALL
  USING (public.has_role(auth.uid(), 'admin'::user_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::user_role));

-- 4. Notifications: allow service role + triggers to insert
DROP POLICY IF EXISTS "Service role can insert notifications" ON public.notifications;
CREATE POLICY "Service role can insert notifications"
  ON public.notifications
  FOR INSERT
  WITH CHECK (true);

-- 5. Trigger: notify donor on coupon lifecycle changes
CREATE OR REPLACE FUNCTION public.notify_donor_on_coupon_status_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  notif_title text;
  notif_message text;
  brand text;
  val numeric;
BEGIN
  -- Only act on real status transitions and only when a donor is attributed
  IF NEW.donor_id IS NULL THEN RETURN NEW; END IF;
  IF TG_OP = 'UPDATE' AND OLD.status = NEW.status THEN RETURN NEW; END IF;

  brand := COALESCE(NEW.store_name, 'a partner brand');
  val := COALESCE(NEW.value, NEW.expected_value, 0);

  IF NEW.status = 'available' AND (TG_OP = 'INSERT' OR OLD.status = 'pending_procurement') THEN
    notif_title := 'Your coupon is live';
    notif_message := 'Your $' || val::text || ' ' || brand || ' coupon is now available for a verified family.';
  ELSIF NEW.status = 'claimed' OR NEW.status = 'reserved' THEN
    notif_title := 'A family claimed your coupon';
    notif_message := 'A verified family just claimed your $' || val::text || ' ' || brand || ' coupon.';
  ELSIF NEW.status = 'redeemed' THEN
    notif_title := 'Your coupon was redeemed';
    notif_message := 'Your $' || val::text || ' ' || brand || ' coupon was used today. Thank you for making this possible.';
  ELSE
    RETURN NEW;
  END IF;

  INSERT INTO public.notifications (user_id, title, message)
  VALUES (NEW.donor_id, notif_title, notif_message);

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_donor_coupon_status ON public.coupons;
CREATE TRIGGER trg_notify_donor_coupon_status
  AFTER INSERT OR UPDATE OF status ON public.coupons
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_donor_on_coupon_status_change();

-- 6. RPC: recipient confirms redemption (atomic, secure)
CREATE OR REPLACE FUNCTION public.confirm_coupon_redemption(_coupon_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.coupons
  SET status = 'redeemed',
      redeemed_at = now(),
      redeemed_by = auth.uid()
  WHERE id = _coupon_id
    AND (reserved_by = auth.uid() OR redeemed_by = auth.uid())
    AND status IN ('reserved', 'claimed');

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Coupon not found or not eligible for redemption';
  END IF;
END;
$$;

-- 7. RPC: admin attaches real codes to pending coupons (FIFO by brand+value)
CREATE OR REPLACE FUNCTION public.attach_procured_codes(
  _brand text,
  _value numeric,
  _codes text[]
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  attached integer := 0;
  pending_id uuid;
  code_text text;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::user_role) THEN
    RAISE EXCEPTION 'Admin access required';
  END IF;

  FOREACH code_text IN ARRAY _codes LOOP
    SELECT id INTO pending_id
    FROM public.coupons
    WHERE status = 'pending_procurement'
      AND store_name = _brand
      AND value = _value
    ORDER BY created_at ASC
    LIMIT 1
    FOR UPDATE SKIP LOCKED;

    EXIT WHEN pending_id IS NULL;

    UPDATE public.coupons
    SET code = code_text,
        status = 'available'
    WHERE id = pending_id;

    attached := attached + 1;
    pending_id := NULL;
  END LOOP;

  RETURN attached;
END;
$$;
