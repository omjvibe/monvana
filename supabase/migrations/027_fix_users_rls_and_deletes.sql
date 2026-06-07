-- Migration: Fix Users RLS and Blocking Foreign Keys
-- Description: Re-enables RLS securely and adds a DELETE policy for admins.

-- 1. Re-enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- 2. Add DELETE policy for admins
-- This ensures that only users with 'admin' role can delete user records.
-- Using clerk_id = auth.uid()::text to identify the active admin.
DROP POLICY IF EXISTS "Admins can delete users" ON users;
CREATE POLICY "Admins can delete users" ON users
    FOR DELETE USING (
        (SELECT role FROM users WHERE clerk_id = auth.uid()::text) = 'admin'
    );

-- 3. Fix internal references that might block self-deletion or admin-deletion
-- Handling 'suspended_by' and 'deleted_by' columns which currently lack ON DELETE clauses.
ALTER TABLE users 
    DROP CONSTRAINT IF EXISTS users_suspended_by_fkey,
    ADD CONSTRAINT users_suspended_by_fkey 
    FOREIGN KEY (suspended_by) REFERENCES users(id) ON DELETE SET NULL,
    DROP CONSTRAINT IF EXISTS users_deleted_by_fkey,
    ADD CONSTRAINT users_deleted_by_fkey 
    FOREIGN KEY (deleted_by) REFERENCES users(id) ON DELETE SET NULL;

-- 4. Ensure service role always has full access
GRANT ALL ON users TO service_role;
