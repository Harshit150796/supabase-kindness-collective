CREATE TABLE public.recurring_donations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  donor_email text,
  square_plan_variation_id text UNIQUE,
  square_subscription_id text UNIQUE,
  gift_cents integer NOT NULL CHECK (gift_cents > 0),
  tip_cents integer NOT NULL DEFAULT 0,
  fee_cents integer NOT NULL DEFAULT 0,
  brand_allocations text,
  brand_name text,
  fundraiser_id uuid,
  status text NOT NULL DEFAULT 'pending',
  consent_text text NOT NULL,
  consent_at timestamptz NOT NULL DEFAULT now(),
  canceled_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.recurring_donations TO authenticated;
GRANT ALL ON public.recurring_donations TO service_role;
ALTER TABLE public.recurring_donations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Donors view own monthly gifts" ON public.recurring_donations FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE TRIGGER recurring_donations_updated_at BEFORE UPDATE ON public.recurring_donations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();