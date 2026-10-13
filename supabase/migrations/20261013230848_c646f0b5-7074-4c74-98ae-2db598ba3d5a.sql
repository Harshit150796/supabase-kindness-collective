CREATE TABLE IF NOT EXISTS public.email_suppressions (
  email text PRIMARY KEY,
  source text NOT NULL DEFAULT 'unsubscribe',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.email_suppressions TO service_role;
ALTER TABLE public.email_suppressions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins read suppressions" ON public.email_suppressions FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
GRANT SELECT ON public.email_suppressions TO authenticated;

CREATE TABLE IF NOT EXISTS public.unsubscribe_requests (
  token uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  used_at timestamptz
);
GRANT ALL ON public.unsubscribe_requests TO service_role;
ALTER TABLE public.unsubscribe_requests ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS unsubscribe_requests_email_idx ON public.unsubscribe_requests(email, created_at);

INSERT INTO public.email_suppressions(email, source, created_at)
SELECT lower(email), 'newsletter', coalesce(unsubscribed_at, now()) FROM public.email_subscribers WHERE subscribed = false
ON CONFLICT (email) DO NOTHING;
INSERT INTO public.email_suppressions(email, source, created_at)
SELECT lower(email), 'followup', coalesce(opted_out_at, now()) FROM public.visitor_consents WHERE consent_status = 'opted_out' OR opted_out_at IS NOT NULL
ON CONFLICT (email) DO NOTHING;
INSERT INTO public.email_suppressions(email, source)
SELECT lower(email), 'impact' FROM public.impact_email_optouts
ON CONFLICT (email) DO NOTHING;