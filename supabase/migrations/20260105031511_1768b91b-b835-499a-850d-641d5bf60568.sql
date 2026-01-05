-- Add new columns to donations table for Stripe webhook data
ALTER TABLE public.donations
ADD COLUMN IF NOT EXISTS stripe_session_id text UNIQUE,
ADD COLUMN IF NOT EXISTS stripe_payment_intent_id text,
ADD COLUMN IF NOT EXISTS payment_method text,
ADD COLUMN IF NOT EXISTS stripe_fee numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS net_amount numeric,
ADD COLUMN IF NOT EXISTS currency text DEFAULT 'usd',
ADD COLUMN IF NOT EXISTS receipt_url text,
ADD COLUMN IF NOT EXISTS donor_email text,
ADD COLUMN IF NOT EXISTS brand_partner text,
ADD COLUMN IF NOT EXISTS status text DEFAULT 'completed';

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_donations_stripe_session_id ON public.donations(stripe_session_id);
CREATE INDEX IF NOT EXISTS idx_donations_status ON public.donations(status);

-- Add policy for service role to insert donations (for webhook)
CREATE POLICY "Service role can insert donations"
ON public.donations
FOR INSERT
TO service_role
WITH CHECK (true);

-- Add policy for service role to update donations (for refunds)
CREATE POLICY "Service role can update donations"
ON public.donations
FOR UPDATE
TO service_role
USING (true);