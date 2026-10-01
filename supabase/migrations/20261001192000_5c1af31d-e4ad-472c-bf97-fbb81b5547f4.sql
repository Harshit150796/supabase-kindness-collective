
-- Role helpers
CREATE OR REPLACE FUNCTION public.is_admin_staff(_uid uuid) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id=_uid AND role IN ('admin','staff')) $$;
CREATE OR REPLACE FUNCTION public.is_admin_any(_uid uuid) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id=_uid AND role IN ('admin','staff','viewer')) $$;

-- Fundraisers: additive columns + widened status set
ALTER TABLE public.fundraisers ADD COLUMN IF NOT EXISTS archived_at timestamptz, ADD COLUMN IF NOT EXISTS archived_by uuid,
  ADD COLUMN IF NOT EXISTS rejection_reason text, ADD COLUMN IF NOT EXISTS featured_order integer;
ALTER TABLE public.fundraisers DROP CONSTRAINT IF EXISTS fundraisers_status_check;
ALTER TABLE public.fundraisers ADD CONSTRAINT fundraisers_status_check CHECK (status = ANY (ARRAY['pending','active','paused','completed','rejected','archived']));

-- Audit log (append-only)
CREATE TABLE public.admin_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), actor_id uuid, action text NOT NULL, table_name text, record_id text,
  before jsonb, after jsonb, created_at timestamptz NOT NULL DEFAULT now());
GRANT SELECT ON public.admin_audit_log TO authenticated; GRANT ALL ON public.admin_audit_log TO service_role;
ALTER TABLE public.admin_audit_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins read audit log" ON public.admin_audit_log FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE INDEX ON public.admin_audit_log (created_at DESC);
CREATE INDEX ON public.admin_audit_log (table_name, record_id);

CREATE OR REPLACE FUNCTION public.log_admin_action(_action text, _table text, _record text, _before jsonb, _after jsonb)
RETURNS void LANGUAGE sql SECURITY DEFINER SET search_path=public AS $$
  INSERT INTO public.admin_audit_log(actor_id,action,table_name,record_id,before,after) VALUES (auth.uid(),_action,_table,_record,_before,_after) $$;
REVOKE EXECUTE ON FUNCTION public.log_admin_action(text,text,text,jsonb,jsonb) FROM PUBLIC, anon, authenticated;

-- Settings (singleton)
CREATE TABLE public.admin_settings (
  id integer PRIMARY KEY DEFAULT 1 CHECK (id=1),
  require_fundraiser_approval boolean NOT NULL DEFAULT false,
  notification_recipients text[] NOT NULL DEFAULT ARRAY['connect.coupondonation@gmail.com'],
  email_new_fundraiser boolean NOT NULL DEFAULT true,
  email_new_donation boolean NOT NULL DEFAULT true,
  updated_at timestamptz NOT NULL DEFAULT now(), updated_by uuid);
GRANT SELECT ON public.admin_settings TO authenticated; GRANT ALL ON public.admin_settings TO service_role;
ALTER TABLE public.admin_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Team reads settings" ON public.admin_settings FOR SELECT TO authenticated USING (public.is_admin_any(auth.uid()));
INSERT INTO public.admin_settings(id) VALUES (1) ON CONFLICT DO NOTHING;

-- Dispatcher state + exactly-once email markers
CREATE TABLE public.admin_dispatch_state (id integer PRIMARY KEY DEFAULT 1 CHECK (id=1), fundraiser_watermark timestamptz NOT NULL DEFAULT now(), donation_watermark timestamptz NOT NULL DEFAULT now(), last_run_at timestamptz);
GRANT ALL ON public.admin_dispatch_state TO service_role;
ALTER TABLE public.admin_dispatch_state ENABLE ROW LEVEL SECURITY;
INSERT INTO public.admin_dispatch_state(id) VALUES (1) ON CONFLICT DO NOTHING;

CREATE TABLE public.admin_email_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), kind text NOT NULL, source_id text NOT NULL,
  payload jsonb, created_at timestamptz NOT NULL DEFAULT now(), sent_at timestamptz, resend_id text, last_error text,
  UNIQUE(kind, source_id));
GRANT SELECT ON public.admin_email_events TO authenticated; GRANT ALL ON public.admin_email_events TO service_role;
ALTER TABLE public.admin_email_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins read email events" ON public.admin_email_events FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));

-- Tasks
CREATE TABLE public.admin_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), title text NOT NULL, description text,
  priority text NOT NULL DEFAULT 'medium' CHECK (priority IN ('urgent','high','medium','low')),
  status text NOT NULL DEFAULT 'todo' CHECK (status IN ('todo','in_progress','blocked','done')),
  due_date date, assignee_id uuid, created_by uuid, linked_type text, linked_id text, source_key text UNIQUE,
  completed_at timestamptz, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now());
GRANT SELECT, INSERT, UPDATE, DELETE ON public.admin_tasks TO authenticated; GRANT ALL ON public.admin_tasks TO service_role;
ALTER TABLE public.admin_tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Team reads tasks" ON public.admin_tasks FOR SELECT TO authenticated USING (public.is_admin_any(auth.uid()));
CREATE POLICY "Staff create tasks" ON public.admin_tasks FOR INSERT TO authenticated WITH CHECK (public.is_admin_staff(auth.uid()));
CREATE POLICY "Staff update tasks" ON public.admin_tasks FOR UPDATE TO authenticated USING (public.is_admin_staff(auth.uid())) WITH CHECK (public.is_admin_staff(auth.uid()));
CREATE POLICY "Admins delete tasks" ON public.admin_tasks FOR DELETE TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER trg_admin_tasks_updated BEFORE UPDATE ON public.admin_tasks FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE INDEX ON public.admin_tasks (status, due_date);

CREATE TABLE public.admin_task_comments (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), task_id uuid NOT NULL REFERENCES public.admin_tasks(id) ON DELETE CASCADE, author_id uuid NOT NULL DEFAULT auth.uid(), body text NOT NULL CHECK (char_length(body) <= 4000), created_at timestamptz NOT NULL DEFAULT now());
GRANT SELECT, INSERT ON public.admin_task_comments TO authenticated; GRANT ALL ON public.admin_task_comments TO service_role;
ALTER TABLE public.admin_task_comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Team reads task comments" ON public.admin_task_comments FOR SELECT TO authenticated USING (public.is_admin_any(auth.uid()));
CREATE POLICY "Staff add task comments" ON public.admin_task_comments FOR INSERT TO authenticated WITH CHECK (public.is_admin_staff(auth.uid()) AND author_id = auth.uid());

-- Task audit trigger (admin table, not payment)
CREATE OR REPLACE FUNCTION public.audit_admin_tasks() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
  IF auth.uid() IS NULL THEN RETURN COALESCE(NEW,OLD); END IF;
  INSERT INTO public.admin_audit_log(actor_id,action,table_name,record_id,before,after)
  VALUES (auth.uid(), 'task.'||lower(TG_OP), 'admin_tasks', COALESCE(NEW.id,OLD.id)::text,
    CASE WHEN TG_OP<>'INSERT' THEN to_jsonb(OLD) END, CASE WHEN TG_OP<>'DELETE' THEN to_jsonb(NEW) END);
  RETURN COALESCE(NEW,OLD);
END $$;
CREATE TRIGGER trg_audit_admin_tasks AFTER INSERT OR UPDATE OR DELETE ON public.admin_tasks FOR EACH ROW EXECUTE FUNCTION public.audit_admin_tasks();

-- Admin notifications
CREATE TABLE public.admin_notifications (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), kind text NOT NULL, title text NOT NULL, body text, link text, source_key text UNIQUE, created_at timestamptz NOT NULL DEFAULT now());
GRANT SELECT ON public.admin_notifications TO authenticated; GRANT ALL ON public.admin_notifications TO service_role;
ALTER TABLE public.admin_notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Team reads admin notifications" ON public.admin_notifications FOR SELECT TO authenticated USING (public.is_admin_any(auth.uid()));
CREATE TABLE public.admin_notification_reads (notification_id uuid NOT NULL REFERENCES public.admin_notifications(id) ON DELETE CASCADE, user_id uuid NOT NULL DEFAULT auth.uid(), read_at timestamptz NOT NULL DEFAULT now(), PRIMARY KEY (notification_id,user_id));
GRANT SELECT, INSERT ON public.admin_notification_reads TO authenticated; GRANT ALL ON public.admin_notification_reads TO service_role;
ALTER TABLE public.admin_notification_reads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own reads" ON public.admin_notification_reads FOR SELECT TO authenticated USING (user_id=auth.uid());
CREATE POLICY "Mark own read" ON public.admin_notification_reads FOR INSERT TO authenticated WITH CHECK (user_id=auth.uid() AND public.is_admin_any(auth.uid()));

-- Saved views
CREATE TABLE public.admin_saved_views (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL DEFAULT auth.uid(), module text NOT NULL, name text NOT NULL, state jsonb NOT NULL, created_at timestamptz NOT NULL DEFAULT now());
GRANT SELECT, INSERT, DELETE ON public.admin_saved_views TO authenticated; GRANT ALL ON public.admin_saved_views TO service_role;
ALTER TABLE public.admin_saved_views ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own views" ON public.admin_saved_views FOR ALL TO authenticated USING (user_id=auth.uid() AND public.is_admin_any(auth.uid())) WITH CHECK (user_id=auth.uid() AND public.is_admin_any(auth.uid()));

-- Auto-task + notification helper
CREATE OR REPLACE FUNCTION public.admin_auto_task(_key text, _title text, _priority text, _type text, _id text, _link text) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
  INSERT INTO public.admin_tasks(title,priority,linked_type,linked_id,source_key) VALUES (_title,_priority,_type,_id,_key) ON CONFLICT (source_key) DO NOTHING;
  INSERT INTO public.admin_notifications(kind,title,link,source_key) VALUES (_type,_title,_link,_key) ON CONFLICT (source_key) DO NOTHING;
END $$;
REVOKE EXECUTE ON FUNCTION public.admin_auto_task(text,text,text,text,text,text) FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.trg_report_auto_task() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN PERFORM public.admin_auto_task('report:'||NEW.id, 'Review report: '||NEW.reason, 'high', 'report', NEW.id::text, '/admin/moderation'); RETURN NEW; END $$;
CREATE TRIGGER trg_content_reports_auto_task AFTER INSERT ON public.content_reports FOR EACH ROW EXECUTE FUNCTION public.trg_report_auto_task();

CREATE OR REPLACE FUNCTION public.trg_application_auto_task() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN PERFORM public.admin_auto_task('application:'||NEW.id, 'Review application: '||COALESCE(NEW.full_name,'applicant'), 'medium', 'application', NEW.id::text, '/admin/verifications'); RETURN NEW; END $$;
CREATE TRIGGER trg_applications_auto_task AFTER INSERT ON public.recipient_applications FOR EACH ROW EXECUTE FUNCTION public.trg_application_auto_task();

CREATE OR REPLACE FUNCTION public.trg_verification_auto_task() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN IF COALESCE(NEW.status,'pending')='pending' THEN PERFORM public.admin_auto_task('verification:'||NEW.id, 'Review verification submission', 'medium', 'verification', NEW.id::text, '/admin/verifications'); END IF; RETURN NEW; END $$;
CREATE TRIGGER trg_verifications_auto_task AFTER INSERT ON public.recipient_verifications FOR EACH ROW EXECUTE FUNCTION public.trg_verification_auto_task();

-- Approval gate: INSERT-only on fundraisers (payment paths never insert fundraisers)
CREATE OR REPLACE FUNCTION public.trg_fundraiser_approval_gate() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
  IF (SELECT require_fundraiser_approval FROM public.admin_settings WHERE id=1) AND NOT public.is_admin_staff(auth.uid()) THEN NEW.status := 'pending'; END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER trg_fundraisers_approval_gate BEFORE INSERT ON public.fundraisers FOR EACH ROW EXECUTE FUNCTION public.trg_fundraiser_approval_gate();

-- Team read access (additive)
CREATE POLICY "Team views donations" ON public.donations FOR SELECT TO authenticated USING (public.is_admin_any(auth.uid()));
CREATE POLICY "Team views fundraisers" ON public.fundraisers FOR SELECT TO authenticated USING (public.is_admin_any(auth.uid()));
CREATE POLICY "Team views profiles" ON public.profiles FOR SELECT TO authenticated USING (public.is_admin_any(auth.uid()));
CREATE POLICY "Team views reports" ON public.content_reports FOR SELECT TO authenticated USING (public.is_admin_any(auth.uid()));
CREATE POLICY "Team views applications" ON public.recipient_applications FOR SELECT TO authenticated USING (public.is_admin_any(auth.uid()));
CREATE POLICY "Team views verifications" ON public.recipient_verifications FOR SELECT TO authenticated USING (public.is_admin_any(auth.uid()));
CREATE POLICY "Team views roles" ON public.user_roles FOR SELECT TO authenticated USING (public.is_admin_any(auth.uid()));

-- Fundraiser actions
CREATE OR REPLACE FUNCTION public.admin_fundraiser_action(_id uuid, _action text, _reason text DEFAULT NULL, _order integer DEFAULT NULL)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE b jsonb; a jsonb;
BEGIN
  IF NOT public.is_admin_staff(auth.uid()) THEN RAISE EXCEPTION 'Staff access required'; END IF;
  SELECT to_jsonb(f) INTO b FROM public.fundraisers f WHERE id=_id;
  IF b IS NULL THEN RAISE EXCEPTION 'Fundraiser not found'; END IF;
  IF _action='approve' OR _action='resume' THEN UPDATE public.fundraisers SET status='active', rejection_reason=NULL WHERE id=_id;
  ELSIF _action='reject' THEN
    IF COALESCE(btrim(_reason),'')='' THEN RAISE EXCEPTION 'A reason is required'; END IF;
    UPDATE public.fundraisers SET status='rejected', rejection_reason=left(_reason,1000) WHERE id=_id;
  ELSIF _action='pause' THEN UPDATE public.fundraisers SET status='paused' WHERE id=_id;
  ELSIF _action='archive' THEN UPDATE public.fundraisers SET status='archived', archived_at=now(), archived_by=auth.uid() WHERE id=_id;
  ELSIF _action='restore' THEN UPDATE public.fundraisers SET status='paused', archived_at=NULL, archived_by=NULL WHERE id=_id;
  ELSIF _action='feature' THEN UPDATE public.fundraisers SET featured_order=_order WHERE id=_id;
  ELSE RAISE EXCEPTION 'Unknown action'; END IF;
  SELECT to_jsonb(f) INTO a FROM public.fundraisers f WHERE id=_id;
  PERFORM public.log_admin_action('fundraiser.'||_action,'fundraisers',_id::text,b,a);
END $$;

CREATE OR REPLACE FUNCTION public.admin_update_fundraiser(_id uuid, _patch jsonb) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE b jsonb; a jsonb;
BEGIN
  IF NOT public.is_admin_staff(auth.uid()) THEN RAISE EXCEPTION 'Staff access required'; END IF;
  SELECT to_jsonb(f) INTO b FROM public.fundraisers f WHERE id=_id;
  IF b IS NULL THEN RAISE EXCEPTION 'Fundraiser not found'; END IF;
  UPDATE public.fundraisers SET
    title = COALESCE(_patch->>'title', title), story = COALESCE(_patch->>'story', story),
    category = COALESCE(_patch->>'category', category),
    monthly_goal = COALESCE((_patch->>'monthly_goal')::numeric, monthly_goal),
    country = COALESCE(_patch->>'country', country), zip_code = COALESCE(_patch->>'zip_code', zip_code),
    cover_photo_url = CASE WHEN _patch ? 'cover_photo_url' THEN _patch->>'cover_photo_url' ELSE cover_photo_url END
  WHERE id=_id;
  SELECT to_jsonb(f) INTO a FROM public.fundraisers f WHERE id=_id;
  PERFORM public.log_admin_action('fundraiser.edit','fundraisers',_id::text,b,a);
END $$;

CREATE OR REPLACE FUNCTION public.admin_hard_delete_fundraiser(_id uuid, _confirm text) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE b jsonb; s text;
BEGIN
  IF NOT public.has_role(auth.uid(),'admin') THEN RAISE EXCEPTION 'Admin access required'; END IF;
  SELECT to_jsonb(f), unique_slug INTO b, s FROM public.fundraisers f WHERE id=_id;
  IF b IS NULL THEN RAISE EXCEPTION 'Fundraiser not found'; END IF;
  IF _confirm IS DISTINCT FROM COALESCE(s,_id::text) THEN RAISE EXCEPTION 'Confirmation text does not match'; END IF;
  IF EXISTS (SELECT 1 FROM public.donations WHERE fundraiser_id=_id) THEN RAISE EXCEPTION 'Has donation records — archive instead'; END IF;
  IF EXISTS (SELECT 1 FROM public.coupons c JOIN public.donations d ON d.id=c.donation_id WHERE d.fundraiser_id=_id) THEN RAISE EXCEPTION 'Has coupons — archive instead'; END IF;
  PERFORM public.log_admin_action('fundraiser.hard_delete','fundraisers',_id::text,b,NULL);
  DELETE FROM public.fundraisers WHERE id=_id;
END $$;

-- Roles and settings (admin only)
CREATE OR REPLACE FUNCTION public.admin_set_role(_user uuid, _role user_role, _grant boolean) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
  IF NOT public.has_role(auth.uid(),'admin') THEN RAISE EXCEPTION 'Admin access required'; END IF;
  IF _role NOT IN ('admin','staff','viewer') THEN RAISE EXCEPTION 'Only team roles can be managed here'; END IF;
  IF NOT _grant AND _user=auth.uid() AND _role='admin' THEN RAISE EXCEPTION 'You cannot remove your own admin role'; END IF;
  IF _grant THEN INSERT INTO public.user_roles(user_id,role) VALUES (_user,_role) ON CONFLICT (user_id,role) DO NOTHING;
  ELSE DELETE FROM public.user_roles WHERE user_id=_user AND role=_role; END IF;
  PERFORM public.log_admin_action(CASE WHEN _grant THEN 'role.grant' ELSE 'role.revoke' END,'user_roles',_user::text,NULL,jsonb_build_object('role',_role));
END $$;

CREATE OR REPLACE FUNCTION public.admin_update_settings(_patch jsonb) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE b jsonb; a jsonb;
BEGIN
  IF NOT public.has_role(auth.uid(),'admin') THEN RAISE EXCEPTION 'Admin access required'; END IF;
  SELECT to_jsonb(s) INTO b FROM public.admin_settings s WHERE id=1;
  UPDATE public.admin_settings SET
    require_fundraiser_approval = COALESCE((_patch->>'require_fundraiser_approval')::boolean, require_fundraiser_approval),
    email_new_fundraiser = COALESCE((_patch->>'email_new_fundraiser')::boolean, email_new_fundraiser),
    email_new_donation = COALESCE((_patch->>'email_new_donation')::boolean, email_new_donation),
    notification_recipients = CASE WHEN _patch ? 'notification_recipients' THEN ARRAY(SELECT lower(btrim(x)) FROM jsonb_array_elements_text(_patch->'notification_recipients') x WHERE x ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$') ELSE notification_recipients END,
    updated_at=now(), updated_by=auth.uid() WHERE id=1;
  SELECT to_jsonb(s) INTO a FROM public.admin_settings s WHERE id=1;
  PERFORM public.log_admin_action('settings.update','admin_settings','1',b,a);
END $$;

-- Donor CRM (aggregated from completed donations)
CREATE OR REPLACE FUNCTION public.admin_list_donors(_search text DEFAULT NULL, _limit integer DEFAULT 25, _offset integer DEFAULT 0, _sort text DEFAULT 'total')
RETURNS TABLE(donor_key text, donor_id uuid, display_name text, email text, total numeric, donations_count bigint, first_at timestamptz, last_at timestamptz, fundraisers_supported bigint, any_anonymous boolean, total_count bigint)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public AS $$
BEGIN
  IF NOT public.is_admin_any(auth.uid()) THEN RAISE EXCEPTION 'Team access required'; END IF;
  RETURN QUERY
  WITH g AS (
    SELECT COALESCE(d.donor_id::text, lower(d.donor_email), 'guest:'||d.id::text) k, (array_agg(d.donor_id) FILTER (WHERE d.donor_id IS NOT NULL))[1] did,
      (array_agg(d.donor_name ORDER BY d.created_at DESC) FILTER (WHERE COALESCE(btrim(d.donor_name),'')<>''))[1] nm,
      (array_agg(lower(d.donor_email)) FILTER (WHERE d.donor_email IS NOT NULL))[1] em,
      SUM(d.amount) tot, COUNT(*) cnt, MIN(d.created_at) fa, MAX(d.created_at) la,
      COUNT(DISTINCT d.fundraiser_id) fs, bool_or(COALESCE(d.is_anonymous,false)) anon
    FROM public.donations d WHERE d.status IN ('completed','succeeded') GROUP BY 1),
  f AS (SELECT * FROM g WHERE _search IS NULL OR _search='' OR g.nm ILIKE '%'||_search||'%' OR g.em ILIKE '%'||_search||'%')
  SELECT f.k, f.did, f.nm, f.em, f.tot, f.cnt, f.fa, f.la, f.fs, f.anon, COUNT(*) OVER()
  FROM f ORDER BY CASE WHEN _sort='recent' THEN extract(epoch FROM f.la) WHEN _sort='count' THEN f.cnt ELSE f.tot END DESC
  LIMIT LEAST(GREATEST(_limit,1),200) OFFSET GREATEST(_offset,0);
END $$;

-- Overview KPIs
CREATE OR REPLACE FUNCTION public.admin_overview_kpis() RETURNS json LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public AS $$
BEGIN
  IF NOT public.is_admin_any(auth.uid()) THEN RAISE EXCEPTION 'Team access required'; END IF;
  RETURN json_build_object(
    'raised_today',(SELECT COALESCE(SUM(amount),0) FROM donations WHERE status IN ('completed','succeeded') AND created_at>=date_trunc('day',now())),
    'raised_week',(SELECT COALESCE(SUM(amount),0) FROM donations WHERE status IN ('completed','succeeded') AND created_at>=now()-interval '7 days'),
    'raised_month',(SELECT COALESCE(SUM(amount),0) FROM donations WHERE status IN ('completed','succeeded') AND created_at>=now()-interval '30 days'),
    'donations_month',(SELECT COUNT(*) FROM donations WHERE status IN ('completed','succeeded') AND created_at>=now()-interval '30 days'),
    'active_fundraisers',(SELECT COUNT(*) FROM fundraisers WHERE status='active'),
    'pending_fundraisers',(SELECT COUNT(*) FROM fundraisers WHERE status='pending'),
    'open_reports',(SELECT COUNT(*) FROM content_reports WHERE status NOT IN ('resolved','dismissed')),
    'pending_verifications',(SELECT COUNT(*) FROM recipient_verifications WHERE status='pending'),
    'open_tasks',(SELECT COUNT(*) FROM admin_tasks WHERE status<>'done'),
    'overdue_tasks',(SELECT COUNT(*) FROM admin_tasks WHERE status<>'done' AND due_date<current_date),
    'available_coupons',(SELECT COUNT(*) FROM coupons WHERE status='available'),
    'total_users',(SELECT COUNT(*) FROM profiles),
    'trend',(SELECT COALESCE(json_agg(t ORDER BY t.d),'[]'::json) FROM (
      SELECT to_char(gs::date,'YYYY-MM-DD') AS d, COALESCE((SELECT SUM(amount) FROM donations WHERE status IN ('completed','succeeded') AND created_at::date=gs::date),0) AS raised
      FROM generate_series(current_date-29, current_date, interval '1 day') gs) t));
END $$;

-- Global search
CREATE OR REPLACE FUNCTION public.admin_search(_q text) RETURNS TABLE(kind text, id text, label text, sub text, link text)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public AS $$
BEGIN
  IF NOT public.is_admin_any(auth.uid()) THEN RAISE EXCEPTION 'Team access required'; END IF;
  IF length(COALESCE(btrim(_q),''))<2 THEN RETURN; END IF;
  RETURN QUERY
  (SELECT 'fundraiser', f.id::text, f.title, f.status, '/admin/fundraisers?id='||f.id FROM fundraisers f WHERE f.title ILIKE '%'||_q||'%' OR f.unique_slug ILIKE '%'||_q||'%' LIMIT 6)
  UNION ALL (SELECT 'user', p.user_id::text, COALESCE(p.full_name,p.email), p.email, '/admin/users?q='||p.email FROM profiles p WHERE p.email ILIKE '%'||_q||'%' OR p.full_name ILIKE '%'||_q||'%' LIMIT 6)
  UNION ALL (SELECT 'donation', d.id::text, '$'||d.amount||' · '||COALESCE(d.donor_name,'Guest'), d.status, '/admin/donations?id='||d.id FROM donations d WHERE d.donor_name ILIKE '%'||_q||'%' OR d.donor_email ILIKE '%'||_q||'%' OR d.id::text ILIKE _q||'%' LIMIT 6)
  UNION ALL (SELECT 'task', t.id::text, t.title, t.status, '/admin/tasks?id='||t.id FROM admin_tasks t WHERE t.title ILIKE '%'||_q||'%' LIMIT 6);
END $$;

-- Audited message view (admin only)
CREATE OR REPLACE FUNCTION public.admin_view_conversation(_cid uuid) RETURNS TABLE(id uuid, sender_id uuid, body text, status text, created_at timestamptz)
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
  IF NOT public.has_role(auth.uid(),'admin') THEN RAISE EXCEPTION 'Admin access required'; END IF;
  PERFORM public.log_admin_action('conversation.view','conversations',_cid::text,NULL,NULL);
  RETURN QUERY SELECT m.id,m.sender_id,m.body,m.status,m.created_at FROM messages m WHERE m.conversation_id=_cid ORDER BY m.created_at;
END $$;

-- Team list
CREATE OR REPLACE FUNCTION public.admin_list_team() RETURNS TABLE(user_id uuid, email text, full_name text, roles text[])
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public AS $$
BEGIN
  IF NOT public.is_admin_any(auth.uid()) THEN RAISE EXCEPTION 'Team access required'; END IF;
  RETURN QUERY SELECT p.user_id, p.email, p.full_name, array_agg(r.role::text ORDER BY r.role::text)
  FROM user_roles r JOIN profiles p ON p.user_id=r.user_id WHERE r.role IN ('admin','staff','viewer') GROUP BY 1,2,3;
END $$;

REVOKE EXECUTE ON FUNCTION public.admin_fundraiser_action(uuid,text,text,integer), public.admin_update_fundraiser(uuid,jsonb), public.admin_hard_delete_fundraiser(uuid,text),
  public.admin_set_role(uuid,user_role,boolean), public.admin_update_settings(jsonb), public.admin_list_donors(text,integer,integer,text), public.admin_overview_kpis(),
  public.admin_search(text), public.admin_view_conversation(uuid), public.admin_list_team() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_fundraiser_action(uuid,text,text,integer), public.admin_update_fundraiser(uuid,jsonb), public.admin_hard_delete_fundraiser(uuid,text),
  public.admin_set_role(uuid,user_role,boolean), public.admin_update_settings(jsonb), public.admin_list_donors(text,integer,integer,text), public.admin_overview_kpis(),
  public.admin_search(text), public.admin_view_conversation(uuid), public.admin_list_team() TO authenticated;
