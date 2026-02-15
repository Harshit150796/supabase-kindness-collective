
-- CMS Content table (editable site text)
CREATE TABLE public.cms_content (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  content_key text NOT NULL UNIQUE,
  content_value text NOT NULL DEFAULT '',
  content_type text NOT NULL DEFAULT 'text',
  section text NOT NULL DEFAULT 'general',
  updated_by uuid,
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.cms_content ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read cms content" ON public.cms_content FOR SELECT USING (true);
CREATE POLICY "Admins can manage cms content" ON public.cms_content FOR ALL USING (has_role(auth.uid(), 'admin'::user_role)) WITH CHECK (has_role(auth.uid(), 'admin'::user_role));

-- CMS Stories table
CREATE TABLE public.cms_stories (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  location text,
  image_url text,
  short_story text NOT NULL,
  full_story text,
  impact text,
  category text NOT NULL DEFAULT 'family',
  donors_count integer NOT NULL DEFAULT 0,
  amount_raised numeric NOT NULL DEFAULT 0,
  goal numeric NOT NULL DEFAULT 0,
  is_published boolean NOT NULL DEFAULT false,
  display_order integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.cms_stories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read published stories" ON public.cms_stories FOR SELECT USING (is_published = true OR has_role(auth.uid(), 'admin'::user_role));
CREATE POLICY "Admins can manage stories" ON public.cms_stories FOR ALL USING (has_role(auth.uid(), 'admin'::user_role)) WITH CHECK (has_role(auth.uid(), 'admin'::user_role));

-- CMS Testimonials table
CREATE TABLE public.cms_testimonials (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  quote text NOT NULL,
  name text NOT NULL,
  role text NOT NULL DEFAULT 'donor',
  role_label text NOT NULL DEFAULT 'Verified Donor',
  location text,
  image_url text,
  verified boolean NOT NULL DEFAULT true,
  is_published boolean NOT NULL DEFAULT false,
  display_order integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.cms_testimonials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read published testimonials" ON public.cms_testimonials FOR SELECT USING (is_published = true OR has_role(auth.uid(), 'admin'::user_role));
CREATE POLICY "Admins can manage testimonials" ON public.cms_testimonials FOR ALL USING (has_role(auth.uid(), 'admin'::user_role)) WITH CHECK (has_role(auth.uid(), 'admin'::user_role));

-- CMS Posts (blog) table
CREATE TABLE public.cms_posts (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  slug text NOT NULL UNIQUE,
  excerpt text,
  content text NOT NULL DEFAULT '',
  cover_image_url text,
  author_id uuid,
  category text NOT NULL DEFAULT 'news',
  tags text[] DEFAULT '{}',
  is_published boolean NOT NULL DEFAULT false,
  published_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.cms_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read published posts" ON public.cms_posts FOR SELECT USING (is_published = true OR has_role(auth.uid(), 'admin'::user_role));
CREATE POLICY "Admins can manage posts" ON public.cms_posts FOR ALL USING (has_role(auth.uid(), 'admin'::user_role)) WITH CHECK (has_role(auth.uid(), 'admin'::user_role));

-- CMS FAQ table
CREATE TABLE public.cms_faq (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  question text NOT NULL,
  answer text NOT NULL,
  category text NOT NULL DEFAULT 'general',
  display_order integer NOT NULL DEFAULT 0,
  is_published boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.cms_faq ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read published faq" ON public.cms_faq FOR SELECT USING (is_published = true OR has_role(auth.uid(), 'admin'::user_role));
CREATE POLICY "Admins can manage faq" ON public.cms_faq FOR ALL USING (has_role(auth.uid(), 'admin'::user_role)) WITH CHECK (has_role(auth.uid(), 'admin'::user_role));

-- Updated at triggers
CREATE TRIGGER update_cms_content_updated_at BEFORE UPDATE ON public.cms_content FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_cms_stories_updated_at BEFORE UPDATE ON public.cms_stories FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_cms_posts_updated_at BEFORE UPDATE ON public.cms_posts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Storage bucket for CMS images
INSERT INTO storage.buckets (id, name, public) VALUES ('cms-images', 'cms-images', true);

CREATE POLICY "Anyone can view cms images" ON storage.objects FOR SELECT USING (bucket_id = 'cms-images');
CREATE POLICY "Admins can upload cms images" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'cms-images' AND has_role(auth.uid(), 'admin'::user_role));
CREATE POLICY "Admins can update cms images" ON storage.objects FOR UPDATE USING (bucket_id = 'cms-images' AND has_role(auth.uid(), 'admin'::user_role));
CREATE POLICY "Admins can delete cms images" ON storage.objects FOR DELETE USING (bucket_id = 'cms-images' AND has_role(auth.uid(), 'admin'::user_role));
