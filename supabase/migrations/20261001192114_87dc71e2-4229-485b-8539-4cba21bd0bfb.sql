CREATE OR REPLACE FUNCTION public.dispatch_secret_ok(_s text) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public, vault AS $$
  SELECT _s IS NOT NULL AND length(_s) >= 32 AND EXISTS (SELECT 1 FROM vault.decrypted_secrets WHERE name='admin_dispatch_secret' AND decrypted_secret=_s) $$;
REVOKE EXECUTE ON FUNCTION public.dispatch_secret_ok(text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.dispatch_secret_ok(text), public.admin_auto_task(text,text,text,text,text,text), public.log_admin_action(text,text,text,jsonb,jsonb) TO service_role;