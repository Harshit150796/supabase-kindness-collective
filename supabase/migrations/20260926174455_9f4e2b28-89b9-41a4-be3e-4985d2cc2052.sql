CREATE TABLE public.payment_settings (
  id integer PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  square_enabled boolean NOT NULL DEFAULT true,
  stripe_enabled boolean NOT NULL DEFAULT true,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.payment_settings TO anon;
GRANT SELECT, UPDATE ON public.payment_settings TO authenticated;
GRANT ALL ON public.payment_settings TO service_role;
ALTER TABLE public.payment_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read payment settings" ON public.payment_settings FOR SELECT USING (true);
CREATE POLICY "Admins can update payment settings" ON public.payment_settings FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::user_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::user_role));
CREATE TRIGGER payment_settings_updated_at BEFORE UPDATE ON public.payment_settings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
INSERT INTO public.payment_settings (id) VALUES (1) ON CONFLICT DO NOTHING;
ALTER TABLE public.donations ADD COLUMN IF NOT EXISTS payment_provider text;
UPDATE public.donations SET payment_provider = 'stripe' WHERE payment_provider IS NULL;