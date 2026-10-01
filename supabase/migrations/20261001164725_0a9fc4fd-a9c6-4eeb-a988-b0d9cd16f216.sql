ALTER TABLE public.fundraisers
  ADD COLUMN IF NOT EXISTS allow_messages boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS show_full_name boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS beneficiary_display_name text,
  ADD COLUMN IF NOT EXISTS show_beneficiary_name boolean NOT NULL DEFAULT false;

-- TEAM
CREATE TABLE public.fundraiser_team (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  fundraiser_id uuid NOT NULL REFERENCES public.fundraisers(id) ON DELETE CASCADE,
  user_id uuid,
  invite_email text,
  role text NOT NULL DEFAULT 'co_organizer' CHECK (role IN ('organizer','co_organizer')),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','accepted','revoked')),
  invited_by uuid,
  invite_token_hash text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX fundraiser_team_member_uq ON public.fundraiser_team(fundraiser_id, user_id) WHERE user_id IS NOT NULL;
CREATE INDEX ON public.fundraiser_team(user_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.fundraiser_team TO authenticated;
GRANT ALL ON public.fundraiser_team TO service_role;
ALTER TABLE public.fundraiser_team ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.is_fundraiser_team(_fid uuid, _uid uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
  SELECT EXISTS (SELECT 1 FROM public.fundraisers WHERE id=_fid AND user_id=_uid)
      OR EXISTS (SELECT 1 FROM public.fundraiser_team WHERE fundraiser_id=_fid AND user_id=_uid AND status='accepted')
$$;
CREATE OR REPLACE FUNCTION public.is_fundraiser_organizer(_fid uuid, _uid uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
  SELECT EXISTS (SELECT 1 FROM public.fundraisers WHERE id=_fid AND user_id=_uid)
$$;
CREATE OR REPLACE FUNCTION public.has_completed_donation(_fid uuid, _uid uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
  SELECT EXISTS (SELECT 1 FROM public.donations WHERE fundraiser_id=_fid AND donor_id=_uid AND status IN ('completed','succeeded'))
$$;

CREATE POLICY "Team members view team" ON public.fundraiser_team FOR SELECT TO authenticated
  USING (public.is_fundraiser_team(fundraiser_id, auth.uid()) OR user_id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "Organizer invites" ON public.fundraiser_team FOR INSERT TO authenticated
  WITH CHECK (public.is_fundraiser_organizer(fundraiser_id, auth.uid()) AND role='co_organizer');
CREATE POLICY "Organizer manages co-organizers" ON public.fundraiser_team FOR UPDATE TO authenticated
  USING (public.is_fundraiser_organizer(fundraiser_id, auth.uid()) AND role='co_organizer')
  WITH CHECK (role='co_organizer');
CREATE POLICY "Co-organizer leaves" ON public.fundraiser_team FOR UPDATE TO authenticated
  USING (user_id = auth.uid() AND role='co_organizer')
  WITH CHECK (user_id = auth.uid() AND role='co_organizer' AND status IN ('accepted','revoked'));
CREATE POLICY "Organizer removes co-organizers" ON public.fundraiser_team FOR DELETE TO authenticated
  USING (public.is_fundraiser_organizer(fundraiser_id, auth.uid()) AND role='co_organizer');

CREATE TRIGGER trg_fundraiser_team_updated BEFORE UPDATE ON public.fundraiser_team FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.add_fundraiser_owner_to_team()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
  INSERT INTO public.fundraiser_team(fundraiser_id,user_id,role,status,invited_by)
  VALUES (NEW.id, NEW.user_id, 'organizer','accepted', NEW.user_id) ON CONFLICT DO NOTHING;
  RETURN NEW;
END $$;
CREATE TRIGGER trg_fundraiser_owner_team AFTER INSERT ON public.fundraisers FOR EACH ROW EXECUTE FUNCTION public.add_fundraiser_owner_to_team();
INSERT INTO public.fundraiser_team(fundraiser_id,user_id,role,status,invited_by)
  SELECT id,user_id,'organizer','accepted',user_id FROM public.fundraisers ON CONFLICT DO NOTHING;

-- CONVERSATIONS
CREATE TABLE public.conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  fundraiser_id uuid NOT NULL REFERENCES public.fundraisers(id) ON DELETE CASCADE,
  supporter_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open','blocked')),
  blocked_by uuid,
  last_message_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (fundraiser_id, supporter_id)
);
GRANT SELECT ON public.conversations TO authenticated;
GRANT ALL ON public.conversations TO service_role;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
CREATE OR REPLACE FUNCTION public.can_access_conversation(_cid uuid, _uid uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
  SELECT EXISTS (SELECT 1 FROM public.conversations c WHERE c.id=_cid
    AND (c.supporter_id=_uid OR public.is_fundraiser_team(c.fundraiser_id,_uid) OR public.has_role(_uid,'admin')))
$$;
CREATE POLICY "Participants view conversations" ON public.conversations FOR SELECT TO authenticated
  USING (supporter_id = auth.uid() OR public.is_fundraiser_team(fundraiser_id, auth.uid()) OR public.has_role(auth.uid(),'admin'));
CREATE TRIGGER trg_conversations_updated BEFORE UPDATE ON public.conversations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL,
  body text NOT NULL,
  flags text[] NOT NULL DEFAULT '{}',
  status text NOT NULL DEFAULT 'delivered' CHECK (status IN ('delivered','redacted')),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ON public.messages(conversation_id, created_at);
GRANT SELECT ON public.messages TO authenticated;
GRANT ALL ON public.messages TO service_role;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Participants view messages" ON public.messages FOR SELECT TO authenticated
  USING (public.can_access_conversation(conversation_id, auth.uid()));

CREATE TABLE public.conversation_reads (
  conversation_id uuid NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  last_read_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (conversation_id, user_id)
);
GRANT SELECT, INSERT, UPDATE ON public.conversation_reads TO authenticated;
GRANT ALL ON public.conversation_reads TO service_role;
ALTER TABLE public.conversation_reads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own read state" ON public.conversation_reads FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid() AND public.can_access_conversation(conversation_id, auth.uid()));

CREATE TABLE public.blocked_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id uuid NOT NULL,
  fundraiser_id uuid,
  conversation_id uuid,
  context text NOT NULL DEFAULT 'message',
  matched_rules text[] NOT NULL DEFAULT '{}',
  masked_excerpt text,
  status text NOT NULL DEFAULT 'open',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, UPDATE ON public.blocked_attempts TO authenticated;
GRANT ALL ON public.blocked_attempts TO service_role;
ALTER TABLE public.blocked_attempts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins view blocked attempts" ON public.blocked_attempts FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins update blocked attempts" ON public.blocked_attempts FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'admin'));

-- COMMENTS
CREATE TABLE public.fundraiser_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  fundraiser_id uuid NOT NULL REFERENCES public.fundraisers(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  display_name text NOT NULL,
  body text NOT NULL CHECK (char_length(body) BETWEEN 1 AND 1000),
  is_hidden boolean NOT NULL DEFAULT false,
  hidden_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ON public.fundraiser_comments(fundraiser_id, created_at DESC);
GRANT SELECT ON public.fundraiser_comments TO anon;
GRANT SELECT, INSERT, DELETE ON public.fundraiser_comments TO authenticated;
GRANT ALL ON public.fundraiser_comments TO service_role;
ALTER TABLE public.fundraiser_comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public reads visible comments" ON public.fundraiser_comments FOR SELECT
  USING (is_hidden = false OR public.is_fundraiser_team(fundraiser_id, auth.uid()) OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "Authors delete own comments" ON public.fundraiser_comments FOR DELETE TO authenticated USING (user_id = auth.uid());

CREATE OR REPLACE FUNCTION public.set_comment_hidden(_comment_id uuid, _hidden boolean)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE fid uuid;
BEGIN
  SELECT fundraiser_id INTO fid FROM public.fundraiser_comments WHERE id=_comment_id;
  IF fid IS NULL OR NOT (public.is_fundraiser_team(fid, auth.uid()) OR public.has_role(auth.uid(),'admin')) THEN
    RAISE EXCEPTION 'Not allowed';
  END IF;
  UPDATE public.fundraiser_comments SET is_hidden=_hidden, hidden_by=CASE WHEN _hidden THEN auth.uid() END WHERE id=_comment_id;
END $$;
REVOKE EXECUTE ON FUNCTION public.set_comment_hidden(uuid,boolean) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.set_comment_hidden(uuid,boolean) TO authenticated;

CREATE TABLE public.comment_likes (
  comment_id uuid NOT NULL REFERENCES public.fundraiser_comments(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (comment_id, user_id)
);
GRANT SELECT ON public.comment_likes TO anon;
GRANT SELECT, INSERT, DELETE ON public.comment_likes TO authenticated;
GRANT ALL ON public.comment_likes TO service_role;
ALTER TABLE public.comment_likes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public reads likes" ON public.comment_likes FOR SELECT USING (true);
CREATE POLICY "Users like" ON public.comment_likes FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users unlike" ON public.comment_likes FOR DELETE TO authenticated USING (user_id = auth.uid());

-- UPDATES
CREATE TABLE public.fundraiser_updates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  fundraiser_id uuid NOT NULL REFERENCES public.fundraisers(id) ON DELETE CASCADE,
  author_id uuid NOT NULL,
  title text NOT NULL CHECK (char_length(title) BETWEEN 1 AND 160),
  body text NOT NULL CHECK (char_length(body) BETWEEN 1 AND 5000),
  image_url text,
  notify_donors boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ON public.fundraiser_updates(fundraiser_id, created_at DESC);
GRANT SELECT ON public.fundraiser_updates TO anon;
GRANT SELECT, UPDATE, DELETE ON public.fundraiser_updates TO authenticated;
GRANT ALL ON public.fundraiser_updates TO service_role;
ALTER TABLE public.fundraiser_updates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public reads updates" ON public.fundraiser_updates FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.fundraisers f WHERE f.id=fundraiser_id AND f.status IN ('active','pending')) OR public.is_fundraiser_team(fundraiser_id, auth.uid()));
CREATE POLICY "Team edits updates" ON public.fundraiser_updates FOR UPDATE TO authenticated
  USING (public.is_fundraiser_team(fundraiser_id, auth.uid())) WITH CHECK (public.is_fundraiser_team(fundraiser_id, auth.uid()));
CREATE POLICY "Team deletes updates" ON public.fundraiser_updates FOR DELETE TO authenticated USING (public.is_fundraiser_team(fundraiser_id, auth.uid()));
CREATE TRIGGER trg_fundraiser_updates_updated BEFORE UPDATE ON public.fundraiser_updates FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- REPORTS
CREATE TABLE public.content_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id uuid NOT NULL,
  target_type text NOT NULL CHECK (target_type IN ('fundraiser','comment','message','conversation')),
  target_id uuid NOT NULL,
  fundraiser_id uuid,
  reason text NOT NULL CHECK (char_length(reason) BETWEEN 1 AND 80),
  details text CHECK (details IS NULL OR char_length(details) <= 2000),
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open','reviewing','resolved','dismissed')),
  admin_notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.content_reports TO authenticated;
GRANT ALL ON public.content_reports TO service_role;
ALTER TABLE public.content_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users file reports" ON public.content_reports FOR INSERT TO authenticated WITH CHECK (reporter_id = auth.uid() AND status='open' AND admin_notes IS NULL);
CREATE POLICY "Users view own reports" ON public.content_reports FOR SELECT TO authenticated USING (reporter_id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins manage reports" ON public.content_reports FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER trg_content_reports_updated BEFORE UPDATE ON public.content_reports FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- NOTIFICATIONS
CREATE TABLE public.notification_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_user_id uuid NOT NULL,
  kind text NOT NULL,
  ref_id uuid,
  fundraiser_id uuid,
  scheduled_for timestamptz NOT NULL DEFAULT now() + interval '10 minutes',
  sent_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ON public.notification_queue(sent_at, scheduled_for);
GRANT ALL ON public.notification_queue TO service_role;
ALTER TABLE public.notification_queue ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.messaging_preferences (
  user_id uuid PRIMARY KEY,
  email_notifications boolean NOT NULL DEFAULT true,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.messaging_preferences TO authenticated;
GRANT ALL ON public.messaging_preferences TO service_role;
ALTER TABLE public.messaging_preferences ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own preferences" ON public.messaging_preferences FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- Organizer public display respects full-name opt-in
CREATE OR REPLACE FUNCTION public.get_fundraiser_team_public(_fundraiser_id uuid)
RETURNS TABLE(display_name text, role text, city text, country text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
  SELECT CASE WHEN f.show_full_name AND t.role='organizer' THEN NULLIF(btrim(p.full_name),'') ELSE public.short_display_name(p.full_name) END,
         t.role, p.city, p.country
  FROM public.fundraiser_team t
  JOIN public.fundraisers f ON f.id=t.fundraiser_id AND f.status IN ('active','pending')
  JOIN public.profiles p ON p.user_id=t.user_id
  WHERE t.fundraiser_id=_fundraiser_id AND t.status='accepted'
  ORDER BY (t.role='organizer') DESC, t.created_at
$$;
GRANT EXECUTE ON FUNCTION public.get_fundraiser_team_public(uuid) TO anon, authenticated;

ALTER PUBLICATION supabase_realtime ADD TABLE public.messages, public.conversations, public.fundraiser_comments;