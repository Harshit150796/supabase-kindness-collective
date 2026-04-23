
-- Add donor_name and ensure fundraiser_id is usable for attribution
ALTER TABLE public.donations 
  ADD COLUMN IF NOT EXISTS donor_name text;

CREATE INDEX IF NOT EXISTS idx_donations_fundraiser_id ON public.donations(fundraiser_id);
CREATE INDEX IF NOT EXISTS idx_donations_donor_email ON public.donations(donor_email);

-- Allow admins to view all donations (currently only donor + service role can)
DROP POLICY IF EXISTS "Admins can update donations" ON public.donations;
CREATE POLICY "Admins can update donations"
ON public.donations
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::user_role));

-- Allow admins to view donation_brands (already exists, idempotent guard)

-- Function to atomically apply a donation to a fundraiser's totals
CREATE OR REPLACE FUNCTION public.apply_donation_to_fundraiser(
  _fundraiser_id uuid,
  _amount numeric,
  _donor_email text,
  _donor_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  is_new_donor boolean;
BEGIN
  IF _fundraiser_id IS NULL THEN
    RETURN;
  END IF;

  -- A donor is "new" to this fundraiser if they have no PRIOR completed donation to it
  SELECT NOT EXISTS (
    SELECT 1 FROM public.donations d
    WHERE d.fundraiser_id = _fundraiser_id
      AND d.status = 'completed'
      AND (
        (_donor_id IS NOT NULL AND d.donor_id = _donor_id)
        OR (_donor_id IS NULL AND _donor_email IS NOT NULL AND d.donor_email = _donor_email)
      )
  ) INTO is_new_donor;

  UPDATE public.fundraisers
  SET 
    amount_raised = COALESCE(amount_raised, 0) + _amount,
    donors_count = COALESCE(donors_count, 0) + (CASE WHEN is_new_donor THEN 1 ELSE 0 END),
    updated_at = now()
  WHERE id = _fundraiser_id;
END;
$$;
