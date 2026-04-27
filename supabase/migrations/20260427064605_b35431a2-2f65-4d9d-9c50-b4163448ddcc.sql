
REVOKE EXECUTE ON FUNCTION public.confirm_coupon_redemption(uuid) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.attach_procured_codes(text, numeric, text[]) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.notify_donor_on_coupon_status_change() FROM anon, public;

GRANT EXECUTE ON FUNCTION public.confirm_coupon_redemption(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.attach_procured_codes(text, numeric, text[]) TO authenticated;
