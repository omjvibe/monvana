-- Migration: Add sender details to transactions table
-- Description: Adds columns to store depositor information for admin-initiated deposits.

ALTER TABLE transactions ADD COLUMN IF NOT EXISTS sender_name VARCHAR(200);
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS sender_account VARCHAR(100);
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS sender_bank VARCHAR(200);

-- Update comment for clarity
COMMENT ON COLUMN transactions.sender_name IS 'Name of the person/entity who initiated the deposit';
COMMENT ON COLUMN transactions.sender_account IS 'Account number/details of the sender';
COMMENT ON COLUMN transactions.sender_bank IS 'Bank name of the sender';
