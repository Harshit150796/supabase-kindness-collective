-- Add donation_id column to coupons table to link coupons to their funding donation
ALTER TABLE coupons ADD COLUMN IF NOT EXISTS donation_id uuid REFERENCES donations(id);

-- Create index for efficient lookup of coupons by donation
CREATE INDEX IF NOT EXISTS idx_coupons_donation_id ON coupons(donation_id);

-- RLS Policy: Donors can view coupons created from their donations
CREATE POLICY "Donors can view coupons from their donations"
ON coupons FOR SELECT
USING (
  donation_id IN (
    SELECT id FROM donations WHERE donor_id = auth.uid()
  )
);