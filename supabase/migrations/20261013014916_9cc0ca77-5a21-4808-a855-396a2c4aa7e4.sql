ALTER TABLE public.recurring_donations ALTER COLUMN user_id DROP NOT NULL;
ALTER TABLE public.recurring_donations
  ADD COLUMN IF NOT EXISTS square_customer_id text,
  ADD COLUMN IF NOT EXISTS last_charge_at timestamptz,
  ADD COLUMN IF NOT EXISTS next_charge_on date,
  ADD COLUMN IF NOT EXISTS charges_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_charged_cents integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS failure_reason text,
  ADD COLUMN IF NOT EXISTS paused_at timestamptz;

CREATE TABLE public.recurring_charges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recurring_id uuid NOT NULL REFERENCES public.recurring_donations(id) ON DELETE CASCADE,
  square_invoice_id text UNIQUE,
  square_order_id text,
  donation_id uuid,
  amount_cents integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'paid',
  charged_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.recurring_charges TO authenticated;
GRANT ALL ON public.recurring_charges TO service_role;
ALTER TABLE public.recurring_charges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owners and staff view monthly charges" ON public.recurring_charges FOR SELECT TO authenticated
USING (public.has_role(auth.uid(),'admin') OR EXISTS (SELECT 1 FROM public.recurring_donations r WHERE r.id = recurring_id AND r.user_id = auth.uid()));

CREATE OR REPLACE FUNCTION public.admin_recurring_list(_search text DEFAULT NULL, _status text DEFAULT NULL, _limit int DEFAULT 25, _offset int DEFAULT 0)
RETURNS TABLE(id uuid, donor_email text, donor_name text, user_id uuid, gift_cents int, tip_cents int, fee_cents int, brand_name text, brand_allocations text, fundraiser_id uuid, fundraiser_title text, status text, created_at timestamptz, last_charge_at timestamptz, next_charge_on date, charges_count int, total_charged_cents int, failure_reason text, square_subscription_id text, total_count bigint)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT has_role(auth.uid(),'admin') THEN RAISE EXCEPTION 'Admin access required'; END IF;
  RETURN QUERY
  SELECT r.id, r.donor_email, p.full_name, r.user_id, r.gift_cents, r.tip_cents, r.fee_cents, r.brand_name, r.brand_allocations, r.fundraiser_id, f.title,
         r.status, r.created_at, r.last_charge_at, r.next_charge_on, r.charges_count, r.total_charged_cents, r.failure_reason, r.square_subscription_id,
         count(*) OVER()
  FROM recurring_donations r
  LEFT JOIN profiles p ON p.user_id = r.user_id
  LEFT JOIN fundraisers f ON f.id = r.fundraiser_id
  WHERE (_status IS NULL OR _status = '' OR r.status = _status)
    AND (_search IS NULL OR _search = '' OR r.donor_email ILIKE '%'||_search||'%' OR p.full_name ILIKE '%'||_search||'%' OR r.brand_name ILIKE '%'||_search||'%')
  ORDER BY r.created_at DESC
  LIMIT least(greatest(_limit,1),500) OFFSET greatest(_offset,0);
END $$;
REVOKE ALL ON FUNCTION public.admin_recurring_list(text,text,int,int) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.admin_recurring_list(text,text,int,int) TO authenticated;