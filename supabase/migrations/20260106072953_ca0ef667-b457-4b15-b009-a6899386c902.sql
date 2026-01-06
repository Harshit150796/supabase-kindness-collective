-- Create recipient_applications table for the application wizard
CREATE TABLE public.recipient_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Personal Info
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  city TEXT,
  country TEXT,
  household_size INTEGER,
  
  -- Story
  assistance_type TEXT NOT NULL,
  story TEXT NOT NULL,
  photo_url TEXT,
  referral_source TEXT,
  
  -- Application Type
  application_type TEXT NOT NULL CHECK (application_type IN ('coupons', 'fundraiser')),
  
  -- Fundraiser Details (nullable for coupon-only)
  campaign_title TEXT,
  funding_goal NUMERIC,
  campaign_photos TEXT[],
  
  -- Status & Tracking
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'more_info_needed')),
  admin_notes TEXT,
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES auth.users(id),
  
  -- User Account (linked after approval)
  user_id UUID REFERENCES auth.users(id),
  
  -- Password hash (stored temporarily until approval)
  password_hash TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.recipient_applications ENABLE ROW LEVEL SECURITY;

-- Policies

-- Anyone can submit an application (no auth required)
CREATE POLICY "Anyone can submit applications"
ON public.recipient_applications
FOR INSERT
WITH CHECK (true);

-- Applicants can view their own application by email (before account creation)
CREATE POLICY "Users can view own application by user_id"
ON public.recipient_applications
FOR SELECT
USING (auth.uid() = user_id);

-- Admins can view all applications
CREATE POLICY "Admins can view all applications"
ON public.recipient_applications
FOR SELECT
USING (has_role(auth.uid(), 'admin'::user_role));

-- Admins can update applications (for review)
CREATE POLICY "Admins can update applications"
ON public.recipient_applications
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::user_role));

-- Create updated_at trigger
CREATE TRIGGER update_recipient_applications_updated_at
BEFORE UPDATE ON public.recipient_applications
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for faster lookups
CREATE INDEX idx_recipient_applications_status ON public.recipient_applications(status);
CREATE INDEX idx_recipient_applications_email ON public.recipient_applications(email);