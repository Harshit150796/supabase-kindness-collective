-- Create app_role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'donor', 'recipient');

-- Create verification_status enum
CREATE TYPE public.verification_status AS ENUM ('pending', 'approved', 'rejected');

-- Create coupon_status enum
CREATE TYPE public.coupon_status AS ENUM ('available', 'reserved', 'redeemed', 'expired');

-- User roles table (separate from profiles for security)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

-- Profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  full_name TEXT,
  email TEXT,
  phone TEXT,
  avatar_url TEXT,
  address TEXT,
  city TEXT,
  country TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Recipient verifications table
CREATE TABLE public.recipient_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  income_document_url TEXT,
  government_id_url TEXT,
  organization_name TEXT,
  organization_contact TEXT,
  annual_income NUMERIC,
  household_size INTEGER,
  status verification_status NOT NULL DEFAULT 'pending',
  admin_notes TEXT,
  verified_at TIMESTAMP WITH TIME ZONE,
  verified_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Categories table
CREATE TABLE public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Partners/Brands table
CREATE TABLE public.partners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  logo_url TEXT,
  description TEXT,
  website TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Coupons table
CREATE TABLE public.coupons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id UUID REFERENCES public.partners(id) ON DELETE SET NULL,
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  code TEXT NOT NULL,
  value NUMERIC NOT NULL,
  discount_percent INTEGER,
  min_purchase NUMERIC DEFAULT 0,
  expiry_date TIMESTAMP WITH TIME ZONE,
  status coupon_status NOT NULL DEFAULT 'available',
  reserved_by UUID REFERENCES auth.users(id),
  reserved_at TIMESTAMP WITH TIME ZONE,
  redeemed_by UUID REFERENCES auth.users(id),
  redeemed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Donations table
CREATE TABLE public.donations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  donor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL NOT NULL,
  amount NUMERIC NOT NULL,
  category_id UUID REFERENCES public.categories(id),
  region TEXT,
  message TEXT,
  is_anonymous BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Loyalty cards table
CREATE TABLE public.loyalty_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  card_number TEXT NOT NULL UNIQUE,
  points_balance INTEGER DEFAULT 0,
  total_savings NUMERIC DEFAULT 0,
  coupons_redeemed INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Redemption history table
CREATE TABLE public.redemption_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  coupon_id UUID REFERENCES public.coupons(id) ON DELETE SET NULL,
  points_earned INTEGER DEFAULT 0,
  savings_amount NUMERIC DEFAULT 0,
  redeemed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recipient_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.donations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loyalty_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.redemption_history ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, email)
  VALUES (NEW.id, NEW.raw_user_meta_data ->> 'full_name', NEW.email);
  RETURN NEW;
END;
$$;

-- Trigger for new user
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_verifications_updated_at
  BEFORE UPDATE ON public.recipient_verifications
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_loyalty_cards_updated_at
  BEFORE UPDATE ON public.loyalty_cards
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- RLS Policies

-- User roles: users can read their own roles, admins can manage all
CREATE POLICY "Users can view own roles" ON public.user_roles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage roles" ON public.user_roles
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Profiles: users can manage their own, admins can view all
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all profiles" ON public.profiles
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

-- Verifications: recipients can manage own, admins can manage all
CREATE POLICY "Users can view own verification" ON public.recipient_verifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own verification" ON public.recipient_verifications
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can manage verifications" ON public.recipient_verifications
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Categories: public read
CREATE POLICY "Anyone can view categories" ON public.categories
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage categories" ON public.categories
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Partners: public read
CREATE POLICY "Anyone can view partners" ON public.partners
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage partners" ON public.partners
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Coupons: verified recipients can view available, admins manage all
CREATE POLICY "Verified recipients can view available coupons" ON public.coupons
  FOR SELECT USING (
    status = 'available' OR 
    reserved_by = auth.uid() OR 
    redeemed_by = auth.uid() OR
    public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Admins can manage coupons" ON public.coupons
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Recipients can reserve coupons" ON public.coupons
  FOR UPDATE USING (
    public.has_role(auth.uid(), 'recipient') AND 
    (status = 'available' OR reserved_by = auth.uid())
  );

-- Donations: donors can view own, admins can view all
CREATE POLICY "Donors can view own donations" ON public.donations
  FOR SELECT USING (auth.uid() = donor_id);

CREATE POLICY "Donors can insert donations" ON public.donations
  FOR INSERT WITH CHECK (auth.uid() = donor_id);

CREATE POLICY "Admins can view all donations" ON public.donations
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

-- Loyalty cards: users can view own
CREATE POLICY "Users can view own loyalty card" ON public.loyalty_cards
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can manage loyalty cards" ON public.loyalty_cards
  FOR ALL USING (public.has_role(auth.uid(), 'admin') OR auth.uid() = user_id);

-- Redemption history: users can view own
CREATE POLICY "Users can view own redemption history" ON public.redemption_history
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can insert redemption history" ON public.redemption_history
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Insert initial categories
INSERT INTO public.categories (name, description, icon) VALUES
  ('Food & Groceries', 'Essential food items and grocery shopping', 'ShoppingCart'),
  ('Healthcare', 'Medical services and pharmacy discounts', 'Heart'),
  ('Education', 'Books, courses, and educational materials', 'BookOpen'),
  ('Clothing', 'Apparel and fashion essentials', 'Shirt'),
  ('Transportation', 'Public transit and fuel discounts', 'Car'),
  ('Utilities', 'Electricity, water, and internet bills', 'Zap');

-- Insert sample partners
INSERT INTO public.partners (name, description, logo_url, website) VALUES
  ('FreshMart', 'Premium grocery chain with fresh produce', NULL, 'https://freshmart.com'),
  ('HealthPlus', 'Pharmacy and wellness products', NULL, 'https://healthplus.com'),
  ('EduBooks', 'Educational materials and supplies', NULL, 'https://edubooks.com'),
  ('StyleWear', 'Affordable quality clothing', NULL, 'https://stylewear.com');