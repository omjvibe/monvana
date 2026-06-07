-- 🏦 Monvana Bank - Universal Deposit Methods & Logo Support
-- 
-- This migration enhances the deposit_methods table to support:
-- 1. Universal methods (NULL user_id)
-- 2. Custom logos for each method

-- 1. Modify the table schema
ALTER TABLE deposit_methods ALTER COLUMN user_id DROP NOT NULL;
ALTER TABLE deposit_methods ADD COLUMN IF NOT EXISTS is_universal BOOLEAN DEFAULT FALSE;
ALTER TABLE deposit_methods ADD COLUMN IF NOT EXISTS logo_url TEXT;

-- 2. Update RLS policies - permissive read since auth is Clerk-based (not Supabase Auth)
-- All write-access is controlled at the API layer via service role key
DROP POLICY IF EXISTS "Users can view own deposit methods" ON deposit_methods;
DROP POLICY IF EXISTS "Users can view universal or own deposit methods" ON deposit_methods;
CREATE POLICY "Users can view deposit methods" ON deposit_methods
FOR SELECT USING (true);

-- 3. Ensure admins can continue to manage everything
DROP POLICY IF EXISTS "Service role can manage deposit methods" ON deposit_methods;
CREATE POLICY "Service role can manage deposit methods" ON deposit_methods
FOR ALL USING (true) WITH CHECK (true);

-- 4. Indexing for performance
CREATE INDEX IF NOT EXISTS idx_deposit_methods_universal ON deposit_methods(is_universal);
