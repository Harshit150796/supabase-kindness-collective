CREATE TABLE public.followup_nonces (
  nonce text PRIMARY KEY,
  send_id uuid NOT NULL REFERENCES public.followup_sends(id) ON DELETE CASCADE,
  email text NOT NULL,
  content_hash text NOT NULL,
  expires_at timestamptz NOT NULL,
  used_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.followup_nonces TO service_role;
ALTER TABLE public.followup_nonces ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.followup_sends
  ADD COLUMN IF NOT EXISTS due_at timestamptz,
  ADD COLUMN IF NOT EXISTS last_activity_at timestamptz,
  ADD COLUMN IF NOT EXISTS attempt_id uuid,
  ADD COLUMN IF NOT EXISTS provider_receipt text;

ALTER TABLE public.admin_settings ADD COLUMN IF NOT EXISTS followup_ai_writing boolean NOT NULL DEFAULT true;

INSERT INTO public.followup_personas (persona_key, label, evidence, signals, subject, body, approved)
VALUES ('unknown', 'Unknown (never emailed)', '{"note":"Visitors who match no type. They never get an email."}'::jsonb, '[]'::jsonb, NULL, NULL, false)
ON CONFLICT (persona_key) DO NOTHING;

-- One active reservation per person across all visitor types. Returns true only for the caller that wins.
CREATE OR REPLACE FUNCTION public.followup_reserve(_consent uuid, _persona uuid, _version int, _attempt uuid, _pages jsonb, _last_activity timestamptz)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE won boolean := false;
BEGIN
  PERFORM 1 FROM public.visitor_consents WHERE id = _consent FOR UPDATE;
  IF EXISTS (SELECT 1 FROM public.followup_sends WHERE consent_id = _consent AND status IN ('reserved','queued','uncertain')) THEN RETURN false; END IF;
  INSERT INTO public.followup_sends (consent_id, persona_id, persona_version, status, attempt_id, pages, last_activity_at, updated_at)
  VALUES (_consent, _persona, _version, 'reserved', _attempt, _pages, _last_activity, now())
  ON CONFLICT (consent_id, persona_id) DO UPDATE
    SET status = 'reserved', attempt_id = _attempt, reason = NULL, pages = _pages, persona_version = _version, last_activity_at = _last_activity, updated_at = now()
    WHERE public.followup_sends.status NOT IN ('sent','reserved','queued','uncertain')
  RETURNING true INTO won;
  RETURN coalesce(won, false);
END $$;
REVOKE ALL ON FUNCTION public.followup_reserve(uuid, uuid, int, uuid, jsonb, timestamptz) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.followup_reserve(uuid, uuid, int, uuid, jsonb, timestamptz) TO service_role;

-- Uses a nonce once. Returns the send id when valid.
CREATE OR REPLACE FUNCTION public.followup_use_nonce(_nonce text, _email text, _hash text)
RETURNS uuid LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  UPDATE public.followup_nonces SET used_at = now()
  WHERE nonce = _nonce AND used_at IS NULL AND expires_at > now() AND lower(email) = lower(_email) AND content_hash = _hash
  RETURNING send_id;
$$;
REVOKE ALL ON FUNCTION public.followup_use_nonce(text, text, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.followup_use_nonce(text, text, text) TO service_role;