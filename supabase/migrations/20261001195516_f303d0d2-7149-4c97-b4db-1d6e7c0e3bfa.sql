CREATE OR REPLACE FUNCTION public.admin_email_stats()
RETURNS json LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  IF NOT public.is_admin_any(auth.uid()) THEN RAISE EXCEPTION 'Team access required'; END IF;
  RETURN json_build_object(
    'active_subscribers',(SELECT COUNT(*) FROM email_subscribers WHERE subscribed),
    'subscribers',(SELECT COUNT(*) FROM email_subscribers),
    'campaigns',(SELECT COUNT(*) FROM email_campaigns),
    'sent',(SELECT COUNT(*) FROM email_events WHERE event_type='sent'),
    'opened',(SELECT COUNT(*) FROM email_events WHERE event_type='opened'),
    'clicked',(SELECT COUNT(*) FROM email_events WHERE event_type='clicked'),
    'per_campaign',(SELECT COALESCE(json_object_agg(campaign_id, json_build_object('sent',s,'opens',o,'clicks',c)),'{}') FROM (
      SELECT campaign_id, COUNT(*) FILTER (WHERE event_type='sent') s, COUNT(*) FILTER (WHERE event_type='opened') o, COUNT(*) FILTER (WHERE event_type='clicked') c
      FROM email_events WHERE campaign_id IS NOT NULL GROUP BY 1) t));
END $$;
REVOKE EXECUTE ON FUNCTION public.admin_email_stats() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_email_stats() TO authenticated;

CREATE OR REPLACE FUNCTION public.admin_import_profile_subscribers()
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE n integer;
BEGIN
  IF NOT public.is_admin_staff(auth.uid()) THEN RAISE EXCEPTION 'Staff access required'; END IF;
  INSERT INTO public.email_subscribers(email, name, source)
  SELECT DISTINCT ON (lower(p.email)) lower(p.email), p.full_name, 'import' FROM profiles p
  WHERE p.email IS NOT NULL AND NOT EXISTS (SELECT 1 FROM email_subscribers s WHERE lower(s.email)=lower(p.email));
  GET DIAGNOSTICS n = ROW_COUNT;
  PERFORM public.log_admin_action('subscribers.import_users','email_subscribers',NULL,NULL,jsonb_build_object('imported',n));
  RETURN n;
END $$;
REVOKE EXECUTE ON FUNCTION public.admin_import_profile_subscribers() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_import_profile_subscribers() TO authenticated;