DO $$ DECLARE t text; BEGIN
FOREACH t IN ARRAY ARRAY['cms_content','cms_faq','cms_posts','cms_stories','cms_testimonials','email_campaigns','email_subscribers','email_templates','email_segments','email_events','coupon_procurement_batches','fundraiser_images'] LOOP
  EXECUTE format('CREATE POLICY "Team can read" ON public.%I FOR SELECT TO authenticated USING (public.is_admin_any(auth.uid()))', t);
END LOOP; END $$;