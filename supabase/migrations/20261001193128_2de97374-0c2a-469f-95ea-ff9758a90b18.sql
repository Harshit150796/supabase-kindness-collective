GRANT EXECUTE ON FUNCTION public.is_admin_staff(uuid), public.is_admin_any(uuid) TO service_role;
CREATE POLICY "Team views coupons" ON public.coupons FOR SELECT TO authenticated USING (public.is_admin_any(auth.uid()));
CREATE POLICY "Team views donation brands" ON public.donation_brands FOR SELECT TO authenticated USING (public.is_admin_any(auth.uid()));
CREATE POLICY "Team views fundraiser team" ON public.fundraiser_team FOR SELECT TO authenticated USING (public.is_admin_any(auth.uid()));
CREATE POLICY "Team views fundraiser comments" ON public.fundraiser_comments FOR SELECT TO authenticated USING (public.is_admin_any(auth.uid()));
CREATE POLICY "Team views fundraiser updates" ON public.fundraiser_updates FOR SELECT TO authenticated USING (public.is_admin_any(auth.uid()));
CREATE POLICY "Team views conversation metadata" ON public.conversations FOR SELECT TO authenticated USING (public.is_admin_any(auth.uid()));