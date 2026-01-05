-- Make donor_id nullable to support anonymous/guest donations
ALTER TABLE donations ALTER COLUMN donor_id DROP NOT NULL;