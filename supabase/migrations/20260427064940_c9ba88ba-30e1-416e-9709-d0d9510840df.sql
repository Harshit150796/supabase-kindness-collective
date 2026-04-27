
UPDATE public.coupons
SET status = 'pending_procurement',
    code = NULL,
    expected_value = COALESCE(expected_value, value)
WHERE status = 'available'
  AND donation_id IS NOT NULL
  AND reserved_by IS NULL
  AND redeemed_by IS NULL;
