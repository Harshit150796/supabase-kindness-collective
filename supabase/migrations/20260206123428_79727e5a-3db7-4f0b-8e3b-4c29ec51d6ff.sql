-- Drop the broken trigger that references non-existent updated_at column
DROP TRIGGER IF EXISTS update_verifications_updated_at ON recipient_verifications;

-- Approve all pending verifications
UPDATE recipient_verifications
SET 
  status = 'approved',
  reviewed_at = NOW(),
  admin_notes = 'Bulk approved during system setup'
WHERE status = 'pending';