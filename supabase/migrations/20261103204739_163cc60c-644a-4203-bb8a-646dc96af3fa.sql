UPDATE public.coupon_sources SET public_credit = 'company' WHERE id = '9cbf522e-e4c8-44fb-a618-bbfab5337ccc' AND public_credit = 'hidden';
SELECT public.recompute_fundraiser_totals(fundraiser_id) FROM public.coupon_sources WHERE id = '9cbf522e-e4c8-44fb-a618-bbfab5337ccc';
INSERT INTO public.admin_audit_log(actor_id, action, table_name, record_id, before, after)
VALUES (NULL, 'coupon_source.credit', 'coupon_sources', '9cbf522e-e4c8-44fb-a618-bbfab5337ccc', jsonb_build_object('public_credit', 'hidden'),
  jsonb_build_object('public_credit', 'company', 'reason', 'Company-bought coupon; founder asked for it to show (Nov 3, 2026)'));