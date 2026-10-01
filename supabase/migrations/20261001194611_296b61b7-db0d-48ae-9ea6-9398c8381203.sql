REVOKE EXECUTE ON FUNCTION public.add_fundraiser_owner_to_team() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.create_loyalty_card_for_recipient() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.ensure_dual_roles() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.get_coupon_code(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_coupon_code(uuid) TO authenticated;
CREATE POLICY "No client access" ON public.admin_dispatch_state FOR SELECT TO authenticated USING (false);
CREATE POLICY "No client access" ON public.notification_queue FOR SELECT TO authenticated USING (false);