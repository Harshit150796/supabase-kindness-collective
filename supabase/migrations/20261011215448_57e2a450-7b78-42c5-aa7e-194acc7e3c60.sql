-- Contact form messages from the closing section of the website footer (US only).
-- Written only by the public-submit edge function (service role); the team reads them in
-- /admin/contact and changes their status through admin_set_contact_message_status (audited).
CREATE TABLE IF NOT EXISTS public.contact_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  name text NOT NULL CHECK (char_length(name) BETWEEN 2 AND 120),
  email text NOT NULL CHECK (char_length(email) BETWEEN 3 AND 255),
  phone text CHECK (phone IS NULL OR phone ~ '^\+1[2-9][0-9]{2}[2-9][0-9]{6}$'),
  state text NOT NULL CHECK (state ~ '^[A-Z]{2}$'),
  topic text NOT NULL CHECK (topic IN ('donation', 'fundraiser', 'recipient', 'account', 'feedback', 'other')),
  message text NOT NULL CHECK (char_length(message) BETWEEN 10 AND 2000),
  page text CHECK (page IS NULL OR char_length(page) <= 300),
  user_id uuid,
  status text NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'read', 'replied', 'archived')),
  handled_by uuid,
  handled_at timestamptz,
  support_email_status text NOT NULL DEFAULT 'pending' CHECK (support_email_status IN ('pending', 'sent', 'failed', 'skipped')),
  confirmation_email_status text NOT NULL DEFAULT 'pending' CHECK (confirmation_email_status IN ('pending', 'sent', 'failed', 'skipped'))
);
CREATE INDEX IF NOT EXISTS contact_messages_created_idx ON public.contact_messages (created_at DESC);
CREATE INDEX IF NOT EXISTS contact_messages_status_idx ON public.contact_messages (status, created_at DESC);
CREATE INDEX IF NOT EXISTS contact_messages_email_idx ON public.contact_messages (email, created_at DESC);

GRANT SELECT ON public.contact_messages TO authenticated;
GRANT ALL ON public.contact_messages TO service_role;
ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Team reads contact messages" ON public.contact_messages;
CREATE POLICY "Team reads contact messages" ON public.contact_messages FOR SELECT TO authenticated USING (public.is_admin_any(auth.uid()));

-- Per-IP send limit for the contact form (hashed IPs only).
CREATE TABLE IF NOT EXISTS public.contact_rate_limits (id bigserial PRIMARY KEY, ip_hash text NOT NULL, created_at timestamptz NOT NULL DEFAULT now());
CREATE INDEX IF NOT EXISTS contact_rate_limits_ip_idx ON public.contact_rate_limits (ip_hash, created_at);
GRANT ALL ON public.contact_rate_limits TO service_role;
GRANT USAGE, SELECT ON SEQUENCE public.contact_rate_limits_id_seq TO service_role;
ALTER TABLE public.contact_rate_limits ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.admin_set_contact_message_status(_id uuid, _status text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE r record;
BEGIN
  IF NOT public.is_admin_staff(auth.uid()) THEN RAISE EXCEPTION 'Staff access required'; END IF;
  IF _status NOT IN ('new', 'read', 'replied', 'archived') THEN RAISE EXCEPTION 'Unknown status'; END IF;
  SELECT id, status, handled_by, handled_at INTO r FROM public.contact_messages WHERE id = _id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Message not found'; END IF;
  IF r.status = _status THEN RETURN; END IF;
  UPDATE public.contact_messages
     SET status = _status,
         handled_by = CASE WHEN _status = 'new' THEN NULL ELSE auth.uid() END,
         handled_at = CASE WHEN _status = 'new' THEN NULL ELSE now() END
   WHERE id = _id;
  PERFORM public.log_admin_action('contact_message_status', 'contact_messages', _id::text,
    jsonb_build_object('status', r.status), jsonb_build_object('status', _status));
END $$;
REVOKE ALL ON FUNCTION public.admin_set_contact_message_status(uuid, text) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.admin_set_contact_message_status(uuid, text) TO authenticated;
