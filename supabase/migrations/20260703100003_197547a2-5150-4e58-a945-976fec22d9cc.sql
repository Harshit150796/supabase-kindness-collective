
ALTER TABLE public.coupons
  ADD COLUMN IF NOT EXISTS tremendous_order_id TEXT,
  ADD COLUMN IF NOT EXISTS tremendous_reward_id TEXT,
  ADD COLUMN IF NOT EXISTS procurement_attempts INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_procurement_error TEXT,
  ADD COLUMN IF NOT EXISTS last_procurement_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS redemption_url TEXT;

CREATE INDEX IF NOT EXISTS coupons_status_created_idx ON public.coupons(status, created_at);

CREATE TABLE IF NOT EXISTS public.brand_procurement_map (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_name TEXT NOT NULL UNIQUE,
  tremendous_product_id TEXT NOT NULL,
  provider TEXT NOT NULL DEFAULT 'tremendous',
  is_active BOOLEAN NOT NULL DEFAULT true,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.brand_procurement_map TO authenticated;
GRANT ALL ON public.brand_procurement_map TO service_role;

ALTER TABLE public.brand_procurement_map ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins manage brand map" ON public.brand_procurement_map;
CREATE POLICY "Admins manage brand map"
  ON public.brand_procurement_map FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::user_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::user_role));

DROP TRIGGER IF EXISTS brand_procurement_map_updated_at ON public.brand_procurement_map;
CREATE TRIGGER brand_procurement_map_updated_at
  BEFORE UPDATE ON public.brand_procurement_map
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP POLICY IF EXISTS "Recipients can preview pending coupons" ON public.coupons;
CREATE POLICY "Recipients can preview pending coupons"
  ON public.coupons FOR SELECT
  TO authenticated
  USING (
    status IN ('pending_procurement'::coupon_status, 'procurement_failed'::coupon_status)
    AND public.has_role(auth.uid(), 'recipient'::user_role)
  );

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'coupons'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.coupons;
  END IF;
END $$;

INSERT INTO public.brand_procurement_map (brand_name, tremendous_product_id, notes) VALUES
  ('Walmart', 'OKMPGN7Y4XR3', 'Sandbox test product - replace with live SKU'),
  ('Amazon', 'OKMPGN7Y4XR3', 'Sandbox test product - replace with live SKU'),
  ('Target', 'OKMPGN7Y4XR3', 'Sandbox test product - replace with live SKU'),
  ('Kroger', 'OKMPGN7Y4XR3', 'Sandbox test product - replace with live SKU'),
  ('Costco', 'OKMPGN7Y4XR3', 'Sandbox test product - replace with live SKU')
ON CONFLICT (brand_name) DO NOTHING;
