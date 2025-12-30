-- =============================================
-- COUPON DONATION - COMPLETE DATABASE MIGRATION
-- Drop dependent policies first, then modify schema
-- =============================================

-- 0. DROP ALL DEPENDENT POLICIES FIRST
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;

DROP POLICY IF EXISTS "Recipients can claim coupons" ON public.coupon_claims;
DROP POLICY IF EXISTS "Recipients can view their own claims" ON public.coupon_claims;
DROP POLICY IF EXISTS "Donors can view claims on their coupons" ON public.coupon_claims;

DROP POLICY IF EXISTS "Anyone can view available coupons" ON public.coupons;
DROP POLICY IF EXISTS "Donors can view their own coupons" ON public.coupons;
DROP POLICY IF EXISTS "Donors can insert coupons" ON public.coupons;
DROP POLICY IF EXISTS "Donors can update their own coupons" ON public.coupons;
DROP POLICY IF EXISTS "Donors can delete their own coupons" ON public.coupons;

-- 1. CREATE NEW ENUMS (if they don't exist)
DO $$ BEGIN
  CREATE TYPE public.app_role AS ENUM ('admin', 'donor', 'recipient');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE public.verification_status AS ENUM ('pending', 'approved', 'rejected');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Update coupon_status enum to include all values
ALTER TABLE public.coupons ALTER COLUMN status DROP DEFAULT;
ALTER TABLE public.coupons ALTER COLUMN status TYPE TEXT USING status::TEXT;

DROP TYPE IF EXISTS public.coupon_status CASCADE;
CREATE TYPE public.coupon_status AS ENUM ('available', 'reserved', 'redeemed', 'expired');

ALTER TABLE public.coupons ALTER COLUMN status TYPE public.coupon_status USING 
  CASE 
    WHEN status = 'claimed' THEN 'reserved'::public.coupon_status
    WHEN status = 'used' THEN 'redeemed'::public.coupon_status
    ELSE status::public.coupon_status
  END;
ALTER TABLE public.coupons ALTER COLUMN status SET DEFAULT 'available'::public.coupon_status;

-- 2. CREATE MISSING TABLES

CREATE TABLE IF NOT EXISTS public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.partners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  logo_url TEXT,
  description TEXT,
  website TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.donations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  donor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL NOT NULL,
  amount NUMERIC NOT NULL,
  category_id UUID REFERENCES public.categories(id),
  region TEXT,
  message TEXT,
  is_anonymous BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.redemption_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  coupon_id UUID REFERENCES public.coupons(id) ON DELETE SET NULL,
  points_earned INTEGER DEFAULT 0,
  savings_amount NUMERIC DEFAULT 0,
  redeemed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 3. MODIFY EXISTING TABLES

-- Add missing columns to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS city TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS country TEXT;

-- Drop old columns from profiles
ALTER TABLE public.profiles DROP COLUMN IF EXISTS role;
ALTER TABLE public.profiles DROP COLUMN IF EXISTS is_verified;

-- Add missing columns to coupons
ALTER TABLE public.coupons ADD COLUMN IF NOT EXISTS partner_id UUID REFERENCES public.partners(id) ON DELETE SET NULL;
ALTER TABLE public.coupons ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL;
ALTER TABLE public.coupons ADD COLUMN IF NOT EXISTS value NUMERIC DEFAULT 0;
ALTER TABLE public.coupons ADD COLUMN IF NOT EXISTS discount_percent INTEGER;
ALTER TABLE public.coupons ADD COLUMN IF NOT EXISTS min_purchase NUMERIC DEFAULT 0;
ALTER TABLE public.coupons ADD COLUMN IF NOT EXISTS reserved_by UUID REFERENCES auth.users(id);
ALTER TABLE public.coupons ADD COLUMN IF NOT EXISTS reserved_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.coupons ADD COLUMN IF NOT EXISTS redeemed_by UUID REFERENCES auth.users(id);
ALTER TABLE public.coupons ADD COLUMN IF NOT EXISTS redeemed_at TIMESTAMP WITH TIME ZONE;

-- Drop old columns from coupons (keep store_name as fallback)
ALTER TABLE public.coupons DROP COLUMN IF EXISTS donor_id;
ALTER TABLE public.coupons DROP COLUMN IF EXISTS discount_value;
ALTER TABLE public.coupons DROP COLUMN IF EXISTS is_active;

-- Add missing columns to recipient_verifications
ALTER TABLE public.recipient_verifications ADD COLUMN IF NOT EXISTS income_document_url TEXT;
ALTER TABLE public.recipient_verifications ADD COLUMN IF NOT EXISTS government_id_url TEXT;
ALTER TABLE public.recipient_verifications ADD COLUMN IF NOT EXISTS organization_name TEXT;
ALTER TABLE public.recipient_verifications ADD COLUMN IF NOT EXISTS organization_contact TEXT;
ALTER TABLE public.recipient_verifications ADD COLUMN IF NOT EXISTS annual_income NUMERIC;
ALTER TABLE public.recipient_verifications ADD COLUMN IF NOT EXISTS household_size INTEGER;
ALTER TABLE public.recipient_verifications ADD COLUMN IF NOT EXISTS admin_notes TEXT;
ALTER TABLE public.recipient_verifications ADD COLUMN IF NOT EXISTS verified_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.recipient_verifications ADD COLUMN IF NOT EXISTS verified_by UUID REFERENCES auth.users(id);

-- 4. ENABLE RLS ON NEW TABLES
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.donations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.redemption_history ENABLE ROW LEVEL SECURITY;

-- 5. CREATE INDEXES
CREATE INDEX IF NOT EXISTS idx_donations_donor_id ON public.donations(donor_id);
CREATE INDEX IF NOT EXISTS idx_donations_category_id ON public.donations(category_id);
CREATE INDEX IF NOT EXISTS idx_coupons_partner_id ON public.coupons(partner_id);
CREATE INDEX IF NOT EXISTS idx_coupons_category_id ON public.coupons(category_id);
CREATE INDEX IF NOT EXISTS idx_coupons_status ON public.coupons(status);
CREATE INDEX IF NOT EXISTS idx_redemption_history_user_id ON public.redemption_history(user_id);

-- 6. CREATE/UPDATE FUNCTIONS
CREATE OR REPLACE FUNCTION public.cleanup_expired_otps()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.otp_codes WHERE expires_at < now();
END;
$$;

-- 7. CREATE TRIGGERS
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
DROP TRIGGER IF EXISTS update_verifications_updated_at ON public.recipient_verifications;
DROP TRIGGER IF EXISTS update_loyalty_cards_updated_at ON public.loyalty_cards;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_verifications_updated_at
  BEFORE UPDATE ON public.recipient_verifications
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_loyalty_cards_updated_at
  BEFORE UPDATE ON public.loyalty_cards
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 8. CREATE RLS POLICIES

-- Profiles policies
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all profiles" ON public.profiles
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

-- Categories policies (public read)
CREATE POLICY "Anyone can view categories" ON public.categories
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage categories" ON public.categories
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Partners policies (public read)
CREATE POLICY "Anyone can view partners" ON public.partners
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage partners" ON public.partners
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Coupons policies
CREATE POLICY "Users can view available coupons" ON public.coupons
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

-- Coupon claims policies
CREATE POLICY "Recipients can claim coupons" ON public.coupon_claims
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'recipient'
    )
  );

CREATE POLICY "Recipients can view own claims" ON public.coupon_claims
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
    )
  );

-- Donations policies
CREATE POLICY "Donors can view own donations" ON public.donations
  FOR SELECT USING (auth.uid() = donor_id);

CREATE POLICY "Donors can insert donations" ON public.donations
  FOR INSERT WITH CHECK (auth.uid() = donor_id);

CREATE POLICY "Admins can view all donations" ON public.donations
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

-- Redemption history policies
CREATE POLICY "Users can view own redemption history" ON public.redemption_history
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can insert redemption history" ON public.redemption_history
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Update recipient_verifications policies
DROP POLICY IF EXISTS "Admins can view all verifications" ON public.recipient_verifications;
DROP POLICY IF EXISTS "Admins can update all verifications" ON public.recipient_verifications;

CREATE POLICY "Admins can view all verifications" ON public.recipient_verifications
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update all verifications" ON public.recipient_verifications
  FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));

-- 9. INSERT SEED DATA (only if tables are empty)

INSERT INTO public.categories (name, description, icon)
SELECT * FROM (VALUES
  ('Food & Groceries', 'Essential food items and grocery shopping', 'ShoppingCart'),
  ('Healthcare', 'Medical services and pharmacy discounts', 'Heart'),
  ('Education', 'Books, courses, and educational materials', 'BookOpen'),
  ('Clothing', 'Apparel and fashion essentials', 'Shirt'),
  ('Transportation', 'Public transit and fuel discounts', 'Car'),
  ('Utilities', 'Electricity, water, and internet bills', 'Zap')
) AS v(name, description, icon)
WHERE NOT EXISTS (SELECT 1 FROM public.categories LIMIT 1);

INSERT INTO public.partners (name, description, logo_url, website)
SELECT * FROM (VALUES
  ('FreshMart', 'Premium grocery chain with fresh produce', NULL, 'https://freshmart.com'),
  ('HealthPlus', 'Pharmacy and wellness products', NULL, 'https://healthplus.com'),
  ('EduBooks', 'Educational materials and supplies', NULL, 'https://edubooks.com'),
  ('StyleWear', 'Affordable quality clothing', NULL, 'https://stylewear.com')
) AS v(name, description, logo_url, website)
WHERE NOT EXISTS (SELECT 1 FROM public.partners LIMIT 1);