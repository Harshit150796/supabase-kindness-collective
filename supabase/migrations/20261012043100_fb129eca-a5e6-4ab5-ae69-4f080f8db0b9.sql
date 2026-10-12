ALTER TABLE public.donations
  ADD COLUMN IF NOT EXISTS amount_paid numeric,
  ADD COLUMN IF NOT EXISTS tip_amount numeric NOT NULL DEFAULT 0 CHECK (tip_amount >= 0),
  ADD COLUMN IF NOT EXISTS fee_covered_amount numeric NOT NULL DEFAULT 0 CHECK (fee_covered_amount >= 0);
COMMENT ON COLUMN public.donations.amount IS 'The gift: 100% goes to families as coupons.';
COMMENT ON COLUMN public.donations.amount_paid IS 'Everything charged: gift + optional tip + card fee the donor covered.';
COMMENT ON COLUMN public.donations.tip_amount IS 'Optional tip to CouponDonation for operating costs.';
COMMENT ON COLUMN public.donations.fee_covered_amount IS 'Card processing fee the donor chose to cover (0 if they did not).';