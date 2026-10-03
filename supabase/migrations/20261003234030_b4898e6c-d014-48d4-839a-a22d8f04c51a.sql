ALTER TYPE public.coupon_status ADD VALUE IF NOT EXISTS 'returned';
ALTER TYPE public.coupon_status ADD VALUE IF NOT EXISTS 'void';
ALTER TABLE public.coupons
  ADD COLUMN IF NOT EXISTS returned_from_coupon_id uuid,
  ADD COLUMN IF NOT EXISTS returned_from_fundraiser_id uuid,
  ADD COLUMN IF NOT EXISTS returned_at timestamptz,
  ADD COLUMN IF NOT EXISTS voided_at timestamptz,
  ADD COLUMN IF NOT EXISTS void_reason text,
  ADD COLUMN IF NOT EXISTS code_hint text GENERATED ALWAYS AS (public._mask_code(code)) STORED;