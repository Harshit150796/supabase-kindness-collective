CREATE TABLE public.admin_record_notes (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), record_type text NOT NULL, record_key text NOT NULL, author_id uuid NOT NULL DEFAULT auth.uid(), body text NOT NULL, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now());
GRANT SELECT ON public.admin_record_notes TO authenticated;
GRANT ALL ON public.admin_record_notes TO service_role;
ALTER TABLE public.admin_record_notes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Team reads private notes" ON public.admin_record_notes FOR SELECT TO authenticated USING (public.is_admin_any(auth.uid()));
CREATE INDEX admin_record_notes_record ON public.admin_record_notes(record_type,record_key,created_at DESC);
CREATE OR REPLACE FUNCTION public.admin_note_stamp() RETURNS trigger LANGUAGE plpgsql SET search_path=public AS $$ BEGIN NEW.updated_at=now(); RETURN NEW; END $$;
CREATE TRIGGER admin_note_updated BEFORE UPDATE ON public.admin_record_notes FOR EACH ROW EXECUTE FUNCTION public.admin_note_stamp();
GRANT SELECT ON public.admin_saved_views, public.admin_notification_reads TO authenticated;
GRANT ALL ON public.admin_saved_views, public.admin_notification_reads TO service_role;
CREATE OR REPLACE FUNCTION public.admin_add_record_note(_type text,_key text,_body text) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$ DECLARE n uuid; BEGIN
 IF NOT is_admin_staff(auth.uid()) THEN RAISE EXCEPTION 'Staff access required'; END IF;
 IF _type NOT IN ('fundraiser','donor','user','contact','partner') OR length(btrim(coalesce(_key,''))) NOT BETWEEN 1 AND 254 OR length(btrim(coalesce(_body,''))) NOT BETWEEN 1 AND 4000 THEN RAISE EXCEPTION 'Invalid note'; END IF;
 INSERT INTO admin_record_notes(record_type,record_key,body) VALUES(_type,_key,btrim(_body)) RETURNING id INTO n;
 PERFORM log_admin_action('note.add','admin_record_notes',n::text,NULL,jsonb_build_object('record_type',_type,'record_key',_key)); RETURN n; END $$;
CREATE OR REPLACE FUNCTION public.admin_personal_view(_op text,_module text,_name text DEFAULT NULL,_state jsonb DEFAULT '{}'::jsonb,_id uuid DEFAULT NULL) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$ DECLARE r jsonb; BEGIN
 IF NOT is_admin_any(auth.uid()) THEN RAISE EXCEPTION 'Team access required'; END IF;
 IF _op='list' THEN SELECT coalesce(jsonb_agg(to_jsonb(v) ORDER BY created_at DESC),'[]'::jsonb) INTO r FROM admin_saved_views v WHERE user_id=auth.uid() AND module=_module; RETURN r;
 ELSIF _op='save' THEN
 IF length(btrim(coalesce(_name,''))) NOT BETWEEN 1 AND 80 OR length(_module)>100 OR pg_column_size(_state)>16000 THEN RAISE EXCEPTION 'Invalid view'; END IF;
 INSERT INTO admin_saved_views(user_id,module,name,state) VALUES(auth.uid(),_module,btrim(_name),_state) RETURNING to_jsonb(admin_saved_views.*) INTO r;
 ELSIF _op='delete' THEN DELETE FROM admin_saved_views WHERE id=_id AND user_id=auth.uid() AND module=_module RETURNING to_jsonb(admin_saved_views.*) INTO r;
 ELSE RAISE EXCEPTION 'Invalid action'; END IF;
 RETURN r; END $$;
CREATE OR REPLACE FUNCTION public.admin_notification_state(_mark text DEFAULT NULL,_ids uuid[] DEFAULT NULL) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$ DECLARE n bigint; BEGIN
 IF NOT is_admin_any(auth.uid()) THEN RAISE EXCEPTION 'Team access required'; END IF;
 IF _mark IS NOT NULL AND _mark NOT IN ('all','page') THEN RAISE EXCEPTION 'Invalid action'; END IF;
 IF _mark IS NOT NULL THEN INSERT INTO admin_notification_reads(notification_id,user_id) SELECT id,auth.uid() FROM admin_notifications WHERE (_mark='all' OR id=ANY(coalesce(_ids,'{}'::uuid[]))) ON CONFLICT DO NOTHING; END IF;
 SELECT count(*) INTO n FROM admin_notifications a WHERE NOT EXISTS(SELECT 1 FROM admin_notification_reads r WHERE r.notification_id=a.id AND r.user_id=auth.uid()); RETURN jsonb_build_object('unread',n); END $$;
CREATE OR REPLACE FUNCTION public.admin_moderation_list(_kind text,_status text DEFAULT 'all',_search text DEFAULT '',_limit int DEFAULT 25,_offset int DEFAULT 0,_fundraiser uuid DEFAULT NULL) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$ DECLARE r jsonb; n bigint; BEGIN
 IF NOT has_role(auth.uid(),'admin') THEN RAISE EXCEPTION 'Admin access required'; END IF;
 IF _kind='reports' THEN
 SELECT count(*) INTO n FROM content_reports WHERE (_status='all' OR status=_status) AND (_fundraiser IS NULL OR fundraiser_id=_fundraiser) AND (reason ILIKE '%'||_search||'%' OR coalesce(details,'') ILIKE '%'||_search||'%');
 SELECT coalesce(jsonb_agg(to_jsonb(t)),'[]'::jsonb) INTO r FROM (SELECT id,target_type,target_id,fundraiser_id,reason,details,status,created_at FROM content_reports WHERE (_status='all' OR status=_status) AND (_fundraiser IS NULL OR fundraiser_id=_fundraiser) AND (reason ILIKE '%'||_search||'%' OR coalesce(details,'') ILIKE '%'||_search||'%') ORDER BY created_at DESC,id LIMIT least(greatest(_limit,1),100) OFFSET greatest(_offset,0)) t;
 ELSIF _kind='blocked' THEN
 SELECT count(*) INTO n FROM blocked_attempts WHERE (_status='all' OR status=_status) AND (context ILIKE '%'||_search||'%' OR coalesce(masked_excerpt,'') ILIKE '%'||_search||'%');
 SELECT coalesce(jsonb_agg(to_jsonb(t)),'[]'::jsonb) INTO r FROM (SELECT id,context,matched_rules,masked_excerpt,status,created_at,fundraiser_id FROM blocked_attempts WHERE (_status='all' OR status=_status) AND (context ILIKE '%'||_search||'%' OR coalesce(masked_excerpt,'') ILIKE '%'||_search||'%') ORDER BY created_at DESC,id LIMIT least(greatest(_limit,1),100) OFFSET greatest(_offset,0)) t;
 ELSIF _kind='flagged' THEN
 SELECT count(*) INTO n FROM messages WHERE status='redacted';
 SELECT coalesce(jsonb_agg(to_jsonb(t)),'[]'::jsonb) INTO r FROM (SELECT id,conversation_id,flags,status,created_at FROM messages WHERE status='redacted' ORDER BY created_at DESC,id LIMIT least(greatest(_limit,1),100) OFFSET greatest(_offset,0)) t;
 ELSE RAISE EXCEPTION 'Invalid list'; END IF; RETURN jsonb_build_object('rows',r,'total',n); END $$;
CREATE OR REPLACE FUNCTION public.admin_moderation_action(_kind text,_id uuid,_status text) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$ DECLARE b jsonb; BEGIN
 IF NOT has_role(auth.uid(),'admin') THEN RAISE EXCEPTION 'Admin access required'; END IF;
 IF _kind='reports' AND _status IN ('reviewing','resolved','dismissed') THEN SELECT jsonb_build_object('status',status) INTO b FROM content_reports WHERE id=_id FOR UPDATE; IF b IS NULL THEN RAISE EXCEPTION 'Report not found'; END IF; UPDATE content_reports SET status=_status,updated_at=now() WHERE id=_id;
 ELSIF _kind='blocked' AND _status='reviewed' THEN SELECT jsonb_build_object('status',status) INTO b FROM blocked_attempts WHERE id=_id FOR UPDATE; IF b IS NULL THEN RAISE EXCEPTION 'Attempt not found'; END IF; UPDATE blocked_attempts SET status=_status WHERE id=_id;
 ELSE RAISE EXCEPTION 'Invalid transition'; END IF;
 PERFORM log_admin_action('moderation.'||_status,CASE WHEN _kind='reports' THEN 'content_reports' ELSE 'blocked_attempts' END,_id::text,b,jsonb_build_object('status',_status)); END $$;
CREATE OR REPLACE FUNCTION public.admin_task_save(_id uuid DEFAULT NULL,_patch jsonb DEFAULT '{}'::jsonb) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$ DECLARE n uuid; t admin_tasks; BEGIN
 IF NOT is_admin_staff(auth.uid()) THEN RAISE EXCEPTION 'Staff access required'; END IF;
 IF _id IS NOT NULL THEN SELECT * INTO t FROM admin_tasks WHERE id=_id FOR UPDATE; IF NOT FOUND THEN RAISE EXCEPTION 'Task not found'; END IF; ELSE t.title='';t.priority='medium';t.status='todo'; END IF;
 IF _patch ? 'title' THEN t.title=btrim(_patch->>'title'); END IF;
 IF _patch ? 'description' THEN t.description=nullif(_patch->>'description',''); END IF;
 IF _patch ? 'priority' THEN t.priority=_patch->>'priority'; END IF;
 IF _patch ? 'status' THEN t.status=_patch->>'status'; END IF;
 IF _patch ? 'due_date' THEN t.due_date=nullif(_patch->>'due_date','')::date; END IF;
 IF _patch ? 'assignee_id' THEN t.assignee_id=nullif(_patch->>'assignee_id','')::uuid; END IF;
 IF _patch ? 'linked_type' THEN t.linked_type=nullif(_patch->>'linked_type',''); END IF;
 IF _patch ? 'linked_id' THEN t.linked_id=nullif(_patch->>'linked_id',''); END IF;
 IF length(coalesce(t.title,'')) NOT BETWEEN 1 AND 200 OR t.priority NOT IN ('urgent','high','medium','low') OR t.status NOT IN ('todo','in_progress','blocked','done') THEN RAISE EXCEPTION 'Invalid task'; END IF;
 IF t.assignee_id IS NOT NULL AND NOT is_admin_any(t.assignee_id) THEN RAISE EXCEPTION 'Choose a team member'; END IF;
 IF _id IS NULL THEN INSERT INTO admin_tasks(title,description,priority,status,due_date,assignee_id,linked_type,linked_id,created_by,completed_at) VALUES(t.title,t.description,t.priority,t.status,t.due_date,t.assignee_id,t.linked_type,t.linked_id,auth.uid(),CASE WHEN t.status='done' THEN now() END) RETURNING id INTO n;
 ELSE UPDATE admin_tasks SET title=t.title,description=t.description,priority=t.priority,status=t.status,due_date=t.due_date,assignee_id=t.assignee_id,linked_type=t.linked_type,linked_id=t.linked_id,completed_at=CASE WHEN t.status='done' THEN coalesce(completed_at,now()) END,updated_at=now() WHERE id=_id; n=_id; END IF;
 PERFORM log_admin_action('task.save','admin_tasks',n::text,NULL,jsonb_build_object('status',t.status,'assignee_id',t.assignee_id)); RETURN n; END $$;
CREATE OR REPLACE FUNCTION public.admin_task_comment(_id uuid,_body text) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$ BEGIN
 IF NOT is_admin_staff(auth.uid()) THEN RAISE EXCEPTION 'Staff access required'; END IF;
 IF length(btrim(coalesce(_body,''))) NOT BETWEEN 1 AND 4000 THEN RAISE EXCEPTION 'Invalid comment'; END IF;
 INSERT INTO admin_task_comments(task_id,body) VALUES(_id,btrim(_body)); PERFORM log_admin_action('task.comment','admin_tasks',_id::text,NULL,NULL); END $$;
CREATE OR REPLACE FUNCTION public.admin_source_donors(_fundraiser uuid,_search text DEFAULT '',_limit int DEFAULT 25,_offset int DEFAULT 0) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$ DECLARE r jsonb; BEGIN
 IF NOT is_admin_staff(auth.uid()) THEN RAISE EXCEPTION 'Staff access required'; END IF;
 WITH x AS (SELECT coalesce(donor_id::text,lower(donor_email),'guest:'||id::text) key,donor_name name,lower(donor_email) email,donor_id user_id,created_at FROM donations WHERE fundraiser_id=_fundraiser AND status='completed' UNION ALL SELECT coalesce(donor_user_id::text,lower(donor_email),'source:'||id::text),donor_name,lower(donor_email),donor_user_id,created_at FROM coupon_sources WHERE fundraiser_id=_fundraiser), dedup AS (SELECT DISTINCT ON (key) * FROM x ORDER BY key,created_at DESC), f AS (SELECT * FROM dedup WHERE coalesce(name,'') ILIKE '%'||_search||'%' OR coalesce(email,'') ILIKE '%'||_search||'%') SELECT jsonb_build_object('total',(SELECT count(*) FROM f),'rows',coalesce((SELECT jsonb_agg(to_jsonb(t)) FROM (SELECT key,name,email,user_id FROM f ORDER BY coalesce(name,email,key),key LIMIT least(greatest(_limit,1),100) OFFSET greatest(_offset,0)) t),'[]'::jsonb)) INTO r; RETURN r; END $$;
CREATE OR REPLACE FUNCTION public.admin_stock_picker(_search text DEFAULT '',_brand text DEFAULT '',_limit int DEFAULT 25,_offset int DEFAULT 0) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$ DECLARE r jsonb; BEGIN
 IF NOT is_admin_staff(auth.uid()) THEN RAISE EXCEPTION 'Staff access required'; END IF;
 WITH f AS (SELECT id,store_name,value,code_hint,value_expires_on FROM coupons WHERE status='in_stock' AND donation_id IS NULL AND source_id IS NULL AND (_brand='' OR store_name ILIKE _brand) AND (store_name ILIKE '%'||_search||'%' OR coalesce(code_hint,'') ILIKE '%'||_search||'%')) SELECT jsonb_build_object('total',(SELECT count(*) FROM f),'rows',coalesce((SELECT jsonb_agg(to_jsonb(t)) FROM (SELECT * FROM f ORDER BY store_name,id LIMIT least(greatest(_limit,1),100) OFFSET greatest(_offset,0)) t),'[]'::jsonb)) INTO r; RETURN r; END $$;
CREATE OR REPLACE FUNCTION public.admin_record_history(_type text,_key text,_kind text DEFAULT 'donations',_limit int DEFAULT 25,_offset int DEFAULT 0) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$ DECLARE r jsonb; BEGIN
 IF NOT is_admin_any(auth.uid()) THEN RAISE EXCEPTION 'Team access required'; END IF;
 IF _type NOT IN ('donor','user') OR _kind NOT IN ('donations','sources','fundraisers') THEN RAISE EXCEPTION 'Invalid record'; END IF;
 PERFORM log_admin_action('record.view',_type,_key,NULL,jsonb_build_object('kind',_kind));
 IF _kind='donations' THEN WITH f AS (SELECT d.id,d.amount,d.status,d.created_at,d.fundraiser_id,fr.title fundraiser_title,ae.status email_status,ae.sent_at FROM donations d LEFT JOIN fundraisers fr ON fr.id=d.fundraiser_id LEFT JOIN account_emails ae ON ae.source_id=d.id AND ae.kind='donation' WHERE CASE WHEN _type='user' THEN d.donor_id::text=_key ELSE coalesce(d.donor_id::text,lower(d.donor_email),'guest:'||d.id::text)=_key END) SELECT jsonb_build_object('total',(SELECT count(*) FROM f),'rows',coalesce((SELECT jsonb_agg(to_jsonb(t)) FROM (SELECT * FROM f ORDER BY created_at DESC,id LIMIT least(greatest(_limit,1),100) OFFSET greatest(_offset,0)) t),'[]'::jsonb)) INTO r;
 ELSIF _kind='sources' THEN WITH f AS (SELECT s.id,s.source_label,s.created_at,s.fundraiser_id,fr.title fundraiser_title,s.confirmation_sent_at,s.confirmation_count,(SELECT sum(c.value) FROM coupons c WHERE c.source_id=s.id AND c.status::text NOT IN ('void','returned')) coupon_value FROM coupon_sources s LEFT JOIN fundraisers fr ON fr.id=s.fundraiser_id WHERE CASE WHEN _type='user' THEN s.donor_user_id::text=_key ELSE coalesce(s.donor_user_id::text,lower(s.donor_email),'source:'||s.id::text)=_key END) SELECT jsonb_build_object('total',(SELECT count(*) FROM f),'rows',coalesce((SELECT jsonb_agg(to_jsonb(t)) FROM (SELECT * FROM f ORDER BY created_at DESC,id LIMIT least(greatest(_limit,1),100) OFFSET greatest(_offset,0)) t),'[]'::jsonb)) INTO r;
 ELSE WITH f AS (SELECT id,title,status,created_at FROM fundraisers WHERE user_id::text=_key) SELECT jsonb_build_object('total',(SELECT count(*) FROM f),'rows',coalesce((SELECT jsonb_agg(to_jsonb(t)) FROM (SELECT * FROM f ORDER BY created_at DESC,id LIMIT least(greatest(_limit,1),100) OFFSET greatest(_offset,0)) t),'[]'::jsonb)) INTO r; END IF; RETURN r; END $$;
REVOKE ALL ON FUNCTION public.admin_add_record_note(text,text,text),public.admin_personal_view(text,text,text,jsonb,uuid),public.admin_notification_state(text,uuid[]),public.admin_moderation_list(text,text,text,int,int,uuid),public.admin_moderation_action(text,uuid,text),public.admin_task_save(uuid,jsonb),public.admin_task_comment(uuid,text),public.admin_source_donors(uuid,text,int,int),public.admin_stock_picker(text,text,int,int),public.admin_record_history(text,text,text,int,int) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.admin_add_record_note(text,text,text),public.admin_personal_view(text,text,text,jsonb,uuid),public.admin_notification_state(text,uuid[]),public.admin_moderation_list(text,text,text,int,int,uuid),public.admin_moderation_action(text,uuid,text),public.admin_task_save(uuid,jsonb),public.admin_task_comment(uuid,text),public.admin_source_donors(uuid,text,int,int),public.admin_stock_picker(text,text,int,int),public.admin_record_history(text,text,text,int,int) TO authenticated,service_role;