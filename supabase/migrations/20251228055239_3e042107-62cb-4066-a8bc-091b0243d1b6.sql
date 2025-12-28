-- Add a policy for otp_codes - edge functions use service role which bypasses RLS
-- But we need at least one policy to satisfy the linter
-- Users should never access otp_codes directly, only via edge functions
CREATE POLICY "Service role only" ON public.otp_codes
  FOR ALL USING (false);