DROP POLICY IF EXISTS "Recipients can view own claims" ON public.coupon_claims;
CREATE POLICY "Recipients can view own claims"
ON public.coupon_claims
FOR SELECT
USING (recipient_id = auth.uid() OR has_role(auth.uid(), 'admin'::user_role));