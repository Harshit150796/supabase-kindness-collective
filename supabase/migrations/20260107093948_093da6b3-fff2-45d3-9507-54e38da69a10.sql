-- Create fundraisers table to store user fundraising campaigns
CREATE TABLE public.fundraisers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  story TEXT NOT NULL,
  category TEXT NOT NULL,
  beneficiary_type TEXT NOT NULL,
  monthly_goal NUMERIC NOT NULL,
  cover_photo_url TEXT,
  is_long_term BOOLEAN DEFAULT false,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'paused', 'completed')),
  amount_raised NUMERIC DEFAULT 0,
  donors_count INTEGER DEFAULT 0,
  unique_slug TEXT UNIQUE,
  country TEXT,
  zip_code TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add fundraiser_id to donations table for linking
ALTER TABLE public.donations ADD COLUMN fundraiser_id UUID REFERENCES public.fundraisers(id);

-- Enable RLS
ALTER TABLE public.fundraisers ENABLE ROW LEVEL SECURITY;

-- Users can view their own fundraisers
CREATE POLICY "Users can view own fundraisers" ON public.fundraisers
  FOR SELECT USING (auth.uid() = user_id);

-- Users can update their own fundraisers
CREATE POLICY "Users can update own fundraisers" ON public.fundraisers
  FOR UPDATE USING (auth.uid() = user_id);

-- Users can insert their own fundraisers
CREATE POLICY "Users can insert own fundraisers" ON public.fundraisers
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Public can view active fundraisers (for donation pages)
CREATE POLICY "Public can view active fundraisers" ON public.fundraisers
  FOR SELECT USING (status = 'active');

-- Admins can view all fundraisers
CREATE POLICY "Admins can view all fundraisers" ON public.fundraisers
  FOR SELECT USING (has_role(auth.uid(), 'admin'::user_role));

-- Admins can update all fundraisers
CREATE POLICY "Admins can update all fundraisers" ON public.fundraisers
  FOR UPDATE USING (has_role(auth.uid(), 'admin'::user_role));

-- Create trigger for updated_at
CREATE TRIGGER update_fundraisers_updated_at
  BEFORE UPDATE ON public.fundraisers
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();