-- Add 'charge' to transaction types check constraint
-- 1. Drop existing constraint if it exists (usually named based on the table and column)
-- Given the table definition: 
-- type VARCHAR(50) NOT NULL CHECK (type IN ('deposit', 'withdrawal', 'transfer', 'loan', 'investment', 'donation', 'bonus', 'fee', 'refund'))

DO $$
BEGIN
    -- Attempt to find and drop the constraint
    -- Constraint names can vary, but usually it's 'transactions_type_check'
    ALTER TABLE transactions DROP CONSTRAINT IF EXISTS transactions_type_check;
    
    -- Add the new constraint with 'charge' included
    ALTER TABLE transactions ADD CONSTRAINT transactions_type_check 
        CHECK (type IN ('deposit', 'withdrawal', 'transfer', 'loan', 'investment', 'donation', 'bonus', 'fee', 'refund', 'charge'));
END $$;
