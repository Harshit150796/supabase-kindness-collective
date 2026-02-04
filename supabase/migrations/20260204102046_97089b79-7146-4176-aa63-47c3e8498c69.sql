-- Activate all pending fundraisers (retroactive fix)
UPDATE fundraisers 
SET status = 'active', updated_at = now() 
WHERE status = 'pending';