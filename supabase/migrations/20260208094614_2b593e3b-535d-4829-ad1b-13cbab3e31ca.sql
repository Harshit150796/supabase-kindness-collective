-- Create junction table for multi-brand donations
CREATE TABLE public.donation_brands (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  donation_id UUID NOT NULL REFERENCES public.donations(id) ON DELETE CASCADE,
  brand_name TEXT NOT NULL,
  allocation_percent INTEGER NOT NULL CHECK (allocation_percent > 0 AND allocation_percent <= 100),
  allocated_amount NUMERIC NOT NULL CHECK (allocated_amount >= 0),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for efficient lookups by donation
CREATE INDEX idx_donation_brands_donation_id ON public.donation_brands(donation_id);

-- Enable Row Level Security
ALTER TABLE public.donation_brands ENABLE ROW LEVEL SECURITY;

-- Donors can view their own donation brand allocations
CREATE POLICY "Donors can view own donation brands"
ON public.donation_brands
FOR SELECT
USING (
  donation_id IN (
    SELECT id FROM public.donations WHERE donor_id = auth.uid()
  )
);

-- Service role can insert donation brands (from webhook)
CREATE POLICY "Service role can insert donation brands"
ON public.donation_brands
FOR INSERT
WITH CHECK (true);

-- Service role can update donation brands
CREATE POLICY "Service role can update donation brands"
ON public.donation_brands
FOR UPDATE
USING (true);

-- Admins can view all donation brands
CREATE POLICY "Admins can view all donation brands"
ON public.donation_brands
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);