-- Create gift_codes table for shareable redemption codes
CREATE TABLE public.gift_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  donation_id UUID REFERENCES public.donations(id),
  donor_id UUID,
  donor_name TEXT DEFAULT 'A generous friend',
  amount NUMERIC NOT NULL,
  message TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'claimed', 'expired')),
  recipient_email TEXT,
  claimed_by UUID,
  claimed_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.gift_codes ENABLE ROW LEVEL SECURITY;

-- Anyone can view gift codes by code (for public redemption page)
CREATE POLICY "Anyone can view gift codes by code"
ON public.gift_codes
FOR SELECT
USING (true);

-- Service role can manage gift codes
CREATE POLICY "Service role can manage gift codes"
ON public.gift_codes
FOR ALL
USING (true)
WITH CHECK (true);

-- Create index for fast code lookups
CREATE INDEX idx_gift_codes_code ON public.gift_codes(code);

-- Insert sample test data for development
INSERT INTO public.gift_codes (code, donor_name, amount, message, status)
VALUES 
  ('GIFT-DEMO', 'Alice', 10.00, 'Hope this brightens your day! 💚', 'pending'),
  ('GIFT-TEST', 'A generous friend', 25.00, NULL, 'pending'),
  ('GIFT-CLAIMED', 'Bob', 15.00, 'Pay it forward!', 'claimed');