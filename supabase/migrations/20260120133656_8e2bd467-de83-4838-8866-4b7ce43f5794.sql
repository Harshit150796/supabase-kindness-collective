-- Add column to track why payments failed for analytics
ALTER TABLE donations ADD COLUMN IF NOT EXISTS decline_reason TEXT;

-- Add index for faster queries on donation status
CREATE INDEX IF NOT EXISTS idx_donations_status ON donations(status);