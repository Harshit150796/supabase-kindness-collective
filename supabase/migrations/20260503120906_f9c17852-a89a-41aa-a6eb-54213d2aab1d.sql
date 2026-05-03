
-- 1. Remove password_hash column from recipient_applications
ALTER TABLE public.recipient_applications DROP COLUMN IF EXISTS password_hash;

-- 2. Restrict donation_brands write policies
DROP POLICY IF EXISTS "Service role can insert donation brands" ON public.donation_brands;
DROP POLICY IF EXISTS "Service role can update donation brands" ON public.donation_brands;

CREATE POLICY "Admins can insert donation brands"
ON public.donation_brands
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'::user_role));

CREATE POLICY "Admins can update donation brands"
ON public.donation_brands
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::user_role));
-- Note: edge functions use the service_role key which bypasses RLS, so inserts from stripe-webhook still work.

-- 3. Prevent privilege escalation via user_roles self-insert
DROP POLICY IF EXISTS "Users can insert their own roles" ON public.user_roles;

CREATE POLICY "Users can self-assign donor role only"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id AND role = 'donor'::user_role);

-- Admins can manage any role assignments
CREATE POLICY "Admins can manage user roles"
ON public.user_roles
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::user_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::user_role));

-- 4. Revoke EXECUTE on internal SECURITY DEFINER functions from anon/authenticated.
-- Keep has_role (used in RLS) and confirm_coupon_redemption (called by recipients) accessible.
REVOKE EXECUTE ON FUNCTION public.cleanup_expired_otps() FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.cleanup_expired_password_reset_tokens() FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.apply_donation_to_fundraiser(uuid, numeric, text, uuid) FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.generate_card_number() FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.attach_procured_codes(text, numeric, text[]) FROM anon, PUBLIC;
-- attach_procured_codes still needs authenticated admin execution, keep authenticated grant
GRANT EXECUTE ON FUNCTION public.attach_procured_codes(text, numeric, text[]) TO authenticated;
