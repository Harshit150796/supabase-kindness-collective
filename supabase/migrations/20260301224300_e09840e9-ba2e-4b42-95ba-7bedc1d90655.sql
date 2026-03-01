
-- Create featured_stories table for database-driven featured story rotation
CREATE TABLE public.featured_stories (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  story_key text NOT NULL UNIQUE,
  name text NOT NULL,
  location text NOT NULL DEFAULT '',
  headline text NOT NULL DEFAULT '',
  short_story text NOT NULL DEFAULT '',
  full_story text,
  impact text,
  category text NOT NULL DEFAULT 'family',
  amount_raised numeric NOT NULL DEFAULT 0,
  goal numeric NOT NULL DEFAULT 1,
  donors_count integer NOT NULL DEFAULT 0,
  brand_partners text[] DEFAULT '{}',
  display_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.featured_stories ENABLE ROW LEVEL SECURITY;

-- Anyone can read (public data)
CREATE POLICY "Anyone can view featured stories"
ON public.featured_stories
FOR SELECT
USING (true);

-- Admins can manage
CREATE POLICY "Admins can manage featured stories"
ON public.featured_stories
FOR ALL
USING (has_role(auth.uid(), 'admin'::user_role));

-- Auto-update timestamp
CREATE TRIGGER update_featured_stories_updated_at
BEFORE UPDATE ON public.featured_stories
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
