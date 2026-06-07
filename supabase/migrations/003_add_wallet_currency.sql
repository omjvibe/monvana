-- Migration: Add currency support to wallets
-- This allows users to have multiple wallets (USD, BTC, ETH, USDT, etc.)

-- Add currency column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'wallets' AND column_name = 'currency') THEN
        ALTER TABLE wallets ADD COLUMN currency TEXT NOT NULL DEFAULT 'USD';
    END IF;
END $$;

-- Add account_number column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'wallets' AND column_name = 'account_number') THEN
        ALTER TABLE wallets ADD COLUMN account_number TEXT;
    END IF;
END $$;

-- Update existing wallets to have account numbers if missing
UPDATE wallets 
SET account_number = 'USD' || LPAD(FLOOR(RANDOM() * 10000000000)::TEXT, 10, '0')
WHERE account_number IS NULL;

-- Create index for faster wallet lookups by user and currency
CREATE INDEX IF NOT EXISTS idx_wallets_user_currency ON wallets(user_id, currency);

-- Add comment
COMMENT ON COLUMN wallets.currency IS 'Wallet currency (USD, BTC, ETH, USDT, etc.)';
