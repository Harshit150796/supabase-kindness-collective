
-- =========================
-- coupons: hide `code` column from general reads
-- =========================
REVOKE SELECT (code) ON public.coupons FROM anon, authenticated;

CREATE OR REPLACE FUNCTION public.get_coupon_code(_coupon_id uuid)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT c.code
  FROM public.coupons c
  WHERE c.id = _coupon_id
    AND (
      c.reserved_by = auth.uid()
      OR c.redeemed_by = auth.uid()
      OR public.has_role(auth.uid(), 'admin'::user_role)
    );
$$;

GRANT EXECUTE ON FUNCTION public.get_coupon_code(uuid) TO authenticated;

-- =========================
-- gift_codes: lock down to service role only
-- =========================
DROP POLICY IF EXISTS "Anyone can view gift codes by code" ON public.gift_codes;
DROP POLICY IF EXISTS "Service role can manage gift codes" ON public.gift_codes;

REVOKE ALL ON public.gift_codes FROM anon, authenticated;
GRANT ALL ON public.gift_codes TO service_role;

CREATE POLICY "Service role manages gift codes"
ON public.gift_codes
AS PERMISSIVE
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- =========================
-- notifications: only service role can insert
-- =========================
DROP POLICY IF EXISTS "Service role can insert notifications" ON public.notifications;

CREATE POLICY "Service role can insert notifications"
ON public.notifications
AS PERMISSIVE
FOR INSERT
TO service_role
WITH CHECK (true);

-- =========================
-- donations: explicit non-null donor on owner-read policy
-- =========================
DROP POLICY IF EXISTS "Donors can view own donations" ON public.donations;
CREATE POLICY "Donors can view own donations"
ON public.donations
FOR SELECT
TO authenticated
USING (donor_id IS NOT NULL AND auth.uid() = donor_id);

-- =========================
-- fundraisers: hide zip_code from anonymous visitors
-- =========================
REVOKE SELECT (zip_code) ON public.fundraisers FROM anon;

-- =========================
-- recipient_verifications: hide admin_notes from clients
-- =========================
REVOKE SELECT (admin_notes) ON public.recipient_verifications FROM anon, authenticated;
