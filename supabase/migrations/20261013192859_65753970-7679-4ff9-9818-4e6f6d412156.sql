ALTER TABLE public.visitor_consents
  ADD COLUMN IF NOT EXISTS unsubscribe_token uuid NOT NULL DEFAULT gen_random_uuid(),
  ADD COLUMN IF NOT EXISTS opted_out_at timestamptz,
  ADD COLUMN IF NOT EXISTS last_emailed_at timestamptz;
CREATE UNIQUE INDEX IF NOT EXISTS visitor_consents_unsub_idx ON public.visitor_consents(unsubscribe_token);

ALTER TABLE public.followup_sends
  ADD COLUMN IF NOT EXISTS pages jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS hubspot_note_id text,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

ALTER TABLE public.admin_settings ADD COLUMN IF NOT EXISTS followup_last_run_at timestamptz;

DROP POLICY IF EXISTS "Admins read consents" ON public.visitor_consents;
DROP POLICY IF EXISTS "Admins read personas" ON public.followup_personas;
DROP POLICY IF EXISTS "Admins read sends" ON public.followup_sends;
CREATE POLICY "Team reads consents" ON public.visitor_consents FOR SELECT TO authenticated USING (public.is_admin_staff(auth.uid()));
CREATE POLICY "Team reads personas" ON public.followup_personas FOR SELECT TO authenticated USING (public.is_admin_staff(auth.uid()));
CREATE POLICY "Team reads sends" ON public.followup_sends FOR SELECT TO authenticated USING (public.is_admin_staff(auth.uid()));

CREATE OR REPLACE FUNCTION public.admin_followup_save_persona(_id uuid, _label text, _subject text, _body text, _approved boolean)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE r record;
BEGIN
  IF NOT public.is_admin_staff(auth.uid()) THEN RAISE EXCEPTION 'Staff access required'; END IF;
  SELECT * INTO r FROM public.followup_personas WHERE id = _id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Visitor type not found'; END IF;
  IF _approved AND (coalesce(trim(_subject),'') = '' OR coalesce(trim(_body),'') = '') THEN RAISE EXCEPTION 'Add a subject and message before approving'; END IF;
  UPDATE public.followup_personas SET
    label = coalesce(nullif(trim(_label),''), label), subject = _subject, body = _body,
    version = CASE WHEN subject IS DISTINCT FROM _subject OR body IS DISTINCT FROM _body THEN version + 1 ELSE version END,
    approved = _approved,
    approved_by = CASE WHEN _approved THEN auth.uid() ELSE NULL END,
    approved_at = CASE WHEN _approved THEN now() ELSE NULL END,
    updated_at = now()
  WHERE id = _id;
  PERFORM public.log_admin_action('followup_persona_save', 'followup_personas', _id::text,
    jsonb_build_object('approved', r.approved, 'version', r.version), jsonb_build_object('approved', _approved));
END $$;

CREATE OR REPLACE FUNCTION public.admin_followup_set_live(_on boolean)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE old boolean;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'Admin access required'; END IF;
  SELECT followup_live_sending INTO old FROM public.admin_settings WHERE id = 1;
  UPDATE public.admin_settings SET followup_live_sending = _on WHERE id = 1;
  PERFORM public.log_admin_action('followup_live_sending', 'admin_settings', '1',
    jsonb_build_object('on', old), jsonb_build_object('on', _on));
END $$;

REVOKE ALL ON FUNCTION public.admin_followup_save_persona(uuid,text,text,text,boolean) FROM public, anon;
REVOKE ALL ON FUNCTION public.admin_followup_set_live(boolean) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.admin_followup_save_persona(uuid,text,text,text,boolean) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_followup_set_live(boolean) TO authenticated;