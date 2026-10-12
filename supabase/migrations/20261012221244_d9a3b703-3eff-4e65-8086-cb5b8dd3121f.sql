DO $$ DECLARE def text; BEGIN SELECT pg_get_functiondef(p.oid) INTO def FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname='public' AND p.proname='admin_record_history'; EXECUTE replace(def,'ae.kind=''donation''','ae.kind=''donation_confirmation'''); END $$;
REVOKE ALL ON FUNCTION public.admin_note_stamp() FROM PUBLIC,anon,authenticated;
DO $$ DECLARE uid uuid:=gen_random_uuid(); other_uid uuid:=gen_random_uuid(); note_id uuid; view_id uuid; fixture_notification uuid; result jsonb; denied boolean; BEGIN
  BEGIN
    PERFORM set_config('request.jwt.claim.sub',uid::text,true);
    denied:=false; BEGIN PERFORM public.admin_add_record_note('fundraiser','fixture','test'); EXCEPTION WHEN OTHERS THEN IF SQLERRM='Staff access required' THEN denied:=true; ELSE RAISE; END IF; END; IF NOT denied THEN RAISE EXCEPTION 'Ordinary user created a note'; END IF;
    denied:=false; BEGIN PERFORM public.admin_moderation_list('reports'); EXCEPTION WHEN OTHERS THEN IF SQLERRM='Admin access required' THEN denied:=true; ELSE RAISE; END IF; END; IF NOT denied THEN RAISE EXCEPTION 'Ordinary user read moderation'; END IF;
    denied:=false; BEGIN PERFORM public.admin_task_save(NULL,'{"title":"test"}'::jsonb); EXCEPTION WHEN OTHERS THEN IF SQLERRM='Staff access required' THEN denied:=true; ELSE RAISE; END IF; END; IF NOT denied THEN RAISE EXCEPTION 'Ordinary user created task'; END IF;
    -- These are deliberately isolated role fixtures with no auth account references; rolled back below.
    -- Use an existing team member only for role context, never modify their data permanently.
    SELECT user_id INTO uid FROM public.user_roles WHERE role='admin' LIMIT 1;
    IF uid IS NULL THEN RAISE EXCEPTION 'No admin context for proof'; END IF;
    PERFORM set_config('request.jwt.claim.sub',uid::text,true);
    note_id:=public.admin_add_record_note('fundraiser','fixture-admin-proof','Private fixture note');
    IF NOT EXISTS(SELECT 1 FROM public.admin_record_notes WHERE id=note_id AND author_id=uid) THEN RAISE EXCEPTION 'Note ownership wrong'; END IF;
    result:=public.admin_personal_view('save','fixture-admin-proof','Fixture','{"params":"scope=mine"}'::jsonb); view_id:=(result->>'id')::uuid;
    IF result->>'user_id' <> uid::text THEN RAISE EXCEPTION 'View owner wrong'; END IF;
    INSERT INTO public.admin_notifications(kind,title,source_key) VALUES('fixture','Fixture','fixture-proof-'||gen_random_uuid()) RETURNING id INTO fixture_notification;
    result:=public.admin_notification_state('page',ARRAY[fixture_notification]);
    IF NOT EXISTS(SELECT 1 FROM public.admin_notification_reads r WHERE r.notification_id=fixture_notification AND r.user_id=uid) THEN RAISE EXCEPTION 'Page read failed'; END IF;
    RAISE EXCEPTION USING ERRCODE='P0002', MESSAGE='proof rollback';
  EXCEPTION WHEN SQLSTATE 'P0002' THEN NULL; END;
END $$;