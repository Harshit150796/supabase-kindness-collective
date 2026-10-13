CREATE TABLE public.donor_payment_profiles (
  user_id uuid PRIMARY KEY,
  square_customer_id text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.donor_payment_profiles TO authenticated;
GRANT ALL ON public.donor_payment_profiles TO service_role;
ALTER TABLE public.donor_payment_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Donors view own payment profile" ON public.donor_payment_profiles FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE TABLE public.saved_cards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  square_card_id text NOT NULL UNIQUE,
  brand text,
  last4 text CHECK (last4 ~ '^[0-9]{4}$'),
  exp_month int,
  exp_year int,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.saved_cards TO authenticated;
GRANT ALL ON public.saved_cards TO service_role;
ALTER TABLE public.saved_cards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Donors view own cards" ON public.saved_cards FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE INDEX saved_cards_user_idx ON public.saved_cards(user_id);

ALTER TABLE public.recurring_donations ADD COLUMN IF NOT EXISTS square_card_id text;