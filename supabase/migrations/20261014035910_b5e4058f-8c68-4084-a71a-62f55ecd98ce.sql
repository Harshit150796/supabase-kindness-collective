CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE
  v_name text := COALESCE(NULLIF(NEW.raw_user_meta_data->>'full_name',''), NULLIF(NEW.raw_user_meta_data->>'name',''), '');
  v_src text := CASE WHEN NEW.raw_app_meta_data->>'provider' = 'google' THEN 'google' ELSE 'website_user' END;
BEGIN
  BEGIN
    INSERT INTO public.profiles (user_id, email, full_name)
    VALUES (NEW.id, NEW.email, v_name)
    ON CONFLICT (user_id) DO NOTHING;
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'handle_new_user profile insert failed for %: %', NEW.id, SQLERRM;
  END;
  BEGIN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'donor') ON CONFLICT (user_id, role) DO NOTHING;
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'recipient') ON CONFLICT (user_id, role) DO NOTHING;
  EXCEPTION WHEN OTHERS THEN NULL;
  END;
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