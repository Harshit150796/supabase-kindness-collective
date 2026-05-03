
-- Extensions
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- email_templates
CREATE TABLE IF NOT EXISTS public.email_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  subject text NOT NULL,
  preview_text text,
  html_content text NOT NULL DEFAULT '',
  tokens text[] DEFAULT '{}',
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage templates" ON public.email_templates
  FOR ALL USING (has_role(auth.uid(),'admin'::user_role)) WITH CHECK (has_role(auth.uid(),'admin'::user_role));
CREATE TRIGGER trg_email_templates_updated BEFORE UPDATE ON public.email_templates
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- email_segments
CREATE TABLE IF NOT EXISTS public.email_segments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  filter_spec jsonb NOT NULL DEFAULT '{}',
  last_count integer DEFAULT 0,
  last_resolved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.email_segments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage segments" ON public.email_segments
  FOR ALL USING (has_role(auth.uid(),'admin'::user_role)) WITH CHECK (has_role(auth.uid(),'admin'::user_role));
CREATE TRIGGER trg_email_segments_updated BEFORE UPDATE ON public.email_segments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- email_events
CREATE TABLE IF NOT EXISTS public.email_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid,
  subscriber_id uuid,
  recipient_email text,
  event_type text NOT NULL,
  url text,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_email_events_campaign ON public.email_events(campaign_id);
CREATE INDEX IF NOT EXISTS idx_email_events_subscriber ON public.email_events(subscriber_id);
CREATE INDEX IF NOT EXISTS idx_email_events_type_created ON public.email_events(event_type, created_at DESC);
ALTER TABLE public.email_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins view events" ON public.email_events
  FOR SELECT USING (has_role(auth.uid(),'admin'::user_role));
CREATE POLICY "Service role inserts events" ON public.email_events
  FOR INSERT TO service_role WITH CHECK (true);

-- Extend email_campaigns
ALTER TABLE public.email_campaigns
  ADD COLUMN IF NOT EXISTS template_id uuid REFERENCES public.email_templates(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS scheduled_for timestamptz,
  ADD COLUMN IF NOT EXISTS audience_type text NOT NULL DEFAULT 'all',
  ADD COLUMN IF NOT EXISTS segment_id uuid REFERENCES public.email_segments(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS test_recipients text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS reply_to text,
  ADD COLUMN IF NOT EXISTS tracking_enabled boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

DROP TRIGGER IF EXISTS trg_email_campaigns_updated ON public.email_campaigns;
CREATE TRIGGER trg_email_campaigns_updated BEFORE UPDATE ON public.email_campaigns
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Extend email_subscribers
ALTER TABLE public.email_subscribers
  ADD COLUMN IF NOT EXISTS tags text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS last_open_at timestamptz,
  ADD COLUMN IF NOT EXISTS last_click_at timestamptz,
  ADD COLUMN IF NOT EXISTS engagement_score integer DEFAULT 0;

-- Storage bucket for email assets
INSERT INTO storage.buckets (id, name, public) VALUES ('email-assets','email-assets',true)
  ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public can view email assets" ON storage.objects
  FOR SELECT USING (bucket_id = 'email-assets');
CREATE POLICY "Admins upload email assets" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'email-assets' AND has_role(auth.uid(),'admin'::user_role));
CREATE POLICY "Admins update email assets" ON storage.objects
  FOR UPDATE USING (bucket_id = 'email-assets' AND has_role(auth.uid(),'admin'::user_role));
CREATE POLICY "Admins delete email assets" ON storage.objects
  FOR DELETE USING (bucket_id = 'email-assets' AND has_role(auth.uid(),'admin'::user_role));
