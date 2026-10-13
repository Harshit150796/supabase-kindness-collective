CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE
  v_name text := COALESCE(NULLIF(NEW.raw_user_meta_data->>'full_name',''), NULLIF(NEW.raw_user_meta_data->>'name',''), '');
  v_src text := CASE WHEN NEW.raw_app_meta_data->>'provider' = 'google' THEN 'google' ELSE 'website_user' END;
BEGIN
  INSERT INTO public.profiles (user_id, email, full_name)
  VALUES (NEW.id, NEW.email, v_name);

  -- One generic account: every signup (email or Google) gets both roles.
  BEGIN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'donor') ON CONFLICT (user_id, role) DO NOTHING;
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'recipient') ON CONFLICT (user_id, role) DO NOTHING;
  EXCEPTION WHEN OTHERS THEN NULL;
  END;

  -- Mailing list: add the account email unless already there or unsubscribed. Never blocks signup.
  BEGIN
    IF NEW.email IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.email_suppressions s WHERE s.email = lower(NEW.email)) THEN
      INSERT INTO public.email_subscribers (email, name, source)
      VALUES (lower(NEW.email), NULLIF(v_name,''), v_src)
      ON CONFLICT (email) DO NOTHING;
    END IF;
  EXCEPTION WHEN OTHERS THEN NULL;
  END;
  RETURN NEW;
END;
$function$;

REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;

-- One-time backfill of existing account emails.
INSERT INTO public.email_subscribers (email, name, source, subscribed_at)
SELECT DISTINCT ON (lower(u.email)) lower(u.email),
  NULLIF(COALESCE(u.raw_user_meta_data->>'full_name', u.raw_user_meta_data->>'name'),''),
  CASE WHEN u.raw_app_meta_data->>'provider'='google' THEN 'google' ELSE 'website_user' END,
  u.created_at
FROM auth.users u
WHERE u.email IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM public.email_subscribers s WHERE lower(s.email)=lower(u.email))
  AND NOT EXISTS (SELECT 1 FROM public.email_suppressions x WHERE x.email=lower(u.email))
ORDER BY lower(u.email), u.created_at
ON CONFLICT (email) DO NOTHING;