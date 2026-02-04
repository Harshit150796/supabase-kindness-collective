-- Create fundraiser_images table for multi-image support
CREATE TABLE public.fundraiser_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fundraiser_id UUID NOT NULL REFERENCES public.fundraisers(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  display_order INTEGER NOT NULL DEFAULT 0,
  is_primary BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Index for fast lookups
CREATE INDEX idx_fundraiser_images_fundraiser_id ON public.fundraiser_images(fundraiser_id);

-- RLS policies
ALTER TABLE public.fundraiser_images ENABLE ROW LEVEL SECURITY;

-- Anyone can view images (for public fundraiser pages)
CREATE POLICY "Public can view fundraiser images"
ON public.fundraiser_images FOR SELECT USING (true);

-- Owners can insert images for their fundraisers
CREATE POLICY "Owners can insert images"
ON public.fundraiser_images FOR INSERT
WITH CHECK (
  EXISTS (SELECT 1 FROM public.fundraisers WHERE id = fundraiser_id AND user_id = auth.uid())
);

-- Owners can update their images (for reordering, setting primary)
CREATE POLICY "Owners can update images"
ON public.fundraiser_images FOR UPDATE
USING (
  EXISTS (SELECT 1 FROM public.fundraisers WHERE id = fundraiser_id AND user_id = auth.uid())
);

-- Owners can delete their images
CREATE POLICY "Owners can delete images"
ON public.fundraiser_images FOR DELETE
USING (
  EXISTS (SELECT 1 FROM public.fundraisers WHERE id = fundraiser_id AND user_id = auth.uid())
);