-- =====================================================
-- ADD CRYPTO WALLETS TO EXISTING USERS
-- Run this in Supabase SQL Editor to add crypto wallets
-- to users who only have USD wallets
-- =====================================================

-- Generate a random 10-digit account number
CREATE OR REPLACE FUNCTION temp_generate_account_number()
RETURNS TEXT AS $$
DECLARE
    new_number TEXT;
    exists_count INTEGER;
BEGIN
    LOOP
        new_number := LPAD(FLOOR(RANDOM() * 10000000000)::TEXT, 10, '0');
        SELECT COUNT(*) INTO exists_count FROM wallets WHERE account_number = new_number;
        EXIT WHEN exists_count = 0;
    END LOOP;
    RETURN new_number;
END;
$$ LANGUAGE plpgsql;

-- Add crypto wallets (BTC, ETH, USDT) to all users who don't have them
DO $$
DECLARE
    user_record RECORD;
    user_name TEXT;
BEGIN
    -- Loop through all users
    FOR user_record IN 
        SELECT u.id, u.first_name, u.last_name, u.email
        FROM users u
    LOOP
        user_name := COALESCE(TRIM(CONCAT(user_record.first_name, ' ', user_record.last_name)), user_record.email);
        
        -- Add BTC wallet if not exists
        IF NOT EXISTS (SELECT 1 FROM wallets WHERE user_id = user_record.id AND currency = 'BTC') THEN
            INSERT INTO wallets (user_id, currency, balance, account_type, account_number, account_name, is_primary)
            VALUES (user_record.id, 'BTC', 0, 'crypto', temp_generate_account_number(), user_name || ' - BTC', false);
            RAISE NOTICE 'Created BTC wallet for user %', user_record.email;
        END IF;
        
        -- Add ETH wallet if not exists
        IF NOT EXISTS (SELECT 1 FROM wallets WHERE user_id = user_record.id AND currency = 'ETH') THEN
            INSERT INTO wallets (user_id, currency, balance, account_type, account_number, account_name, is_primary)
            VALUES (user_record.id, 'ETH', 0, 'crypto', temp_generate_account_number(), user_name || ' - ETH', false);
            RAISE NOTICE 'Created ETH wallet for user %', user_record.email;
        END IF;
        
        -- Add USDT wallet if not exists
        IF NOT EXISTS (SELECT 1 FROM wallets WHERE user_id = user_record.id AND currency = 'USDT') THEN
            INSERT INTO wallets (user_id, currency, balance, account_type, account_number, account_name, is_primary)
            VALUES (user_record.id, 'USDT', 0, 'crypto', temp_generate_account_number(), user_name || ' - USDT', false);
            RAISE NOTICE 'Created USDT wallet for user %', user_record.email;
        END IF;
    END LOOP;
END $$;

-- Clean up temporary function
DROP FUNCTION IF EXISTS temp_generate_account_number();

-- Verify wallets created
SELECT 
    u.email,
    w.currency,
    w.balance,
    w.account_type,
    w.is_primary
FROM users u
JOIN wallets w ON w.user_id = u.id
ORDER BY u.email, w.is_primary DESC, w.currency;
