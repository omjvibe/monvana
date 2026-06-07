-- 030_populate_account_numbers.sql

DO $$ 
DECLARE
    wallet_record RECORD;
BEGIN
    FOR wallet_record IN 
        SELECT id FROM wallets WHERE account_number IS NULL OR account_number = ''
    LOOP
        UPDATE wallets 
        SET account_number = generate_account_number() 
        WHERE id = wallet_record.id;
    END LOOP;
END $$;
