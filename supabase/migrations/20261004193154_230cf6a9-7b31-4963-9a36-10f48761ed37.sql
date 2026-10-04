CREATE OR REPLACE FUNCTION public.admin_import_profile_subscribers()
 RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE n integer;
BEGIN
  IF NOT public.is_admin_staff(auth.uid()) THEN RAISE EXCEPTION 'Staff access required'; END IF;
  INSERT INTO public.email_subscribers(email, name, source, subscribed_at)
  SELECT DISTINCT ON (lower(p.email)) lower(p.email), p.full_name, 'website_user', p.created_at FROM profiles p
  WHERE p.email IS NOT NULL AND NOT EXISTS (SELECT 1 FROM email_subscribers s WHERE lower(s.email)=lower(p.email))
  ORDER BY lower(p.email), p.created_at;
  GET DIAGNOSTICS n = ROW_COUNT;
  PERFORM public.log_admin_action('subscribers.import_users','email_subscribers',NULL,NULL,jsonb_build_object('imported',n));
  RETURN n;
END $function$;