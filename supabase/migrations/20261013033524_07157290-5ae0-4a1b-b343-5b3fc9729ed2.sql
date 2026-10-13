CREATE TABLE public.visitor_consents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE,
  user_id uuid,
  posthog_distinct_id text,
  email_source text NOT NULL,
  consent_status text NOT NULL DEFAULT 'unknown',
  consent_time timestamptz,
  hubspot_contact_id text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.visitor_consents TO authenticated;
GRANT ALL ON public.visitor_consents TO service_role;
ALTER TABLE public.visitor_consents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins read consents" ON public.visitor_consents FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.followup_personas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  persona_key text NOT NULL UNIQUE,
  label text NOT NULL,
  evidence jsonb NOT NULL DEFAULT '{}'::jsonb,
  visitor_count integer NOT NULL DEFAULT 0,
  signals jsonb NOT NULL DEFAULT '[]'::jsonb,
  subject text,
  body text,
  version integer NOT NULL DEFAULT 1,
  approved boolean NOT NULL DEFAULT false,
  approved_by uuid,
  approved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.followup_personas TO authenticated;
GRANT ALL ON public.followup_personas TO service_role;
ALTER TABLE public.followup_personas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins read personas" ON public.followup_personas FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.followup_sends (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  consent_id uuid NOT NULL REFERENCES public.visitor_consents(id) ON DELETE CASCADE,
  persona_id uuid NOT NULL REFERENCES public.followup_personas(id) ON DELETE CASCADE,
  persona_version integer NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  reason text,
  sent_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (consent_id, persona_id)
);
GRANT SELECT ON public.followup_sends TO authenticated;
GRANT ALL ON public.followup_sends TO service_role;
ALTER TABLE public.followup_sends ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins read sends" ON public.followup_sends FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

ALTER TABLE public.admin_settings ADD COLUMN IF NOT EXISTS followup_live_sending boolean NOT NULL DEFAULT false;