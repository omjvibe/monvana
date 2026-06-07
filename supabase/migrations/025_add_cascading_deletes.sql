-- Migration: Add cascading deletes for hard user deletion
-- Description: Ensures related data is handled correctly when a user is permanently deleted.

-- 1. Transactions: set processed_by to NULL if the admin is deleted
ALTER TABLE transactions 
    DROP CONSTRAINT IF EXISTS transactions_processed_by_fkey,
    ADD CONSTRAINT transactions_processed_by_fkey 
    FOREIGN KEY (processed_by) REFERENCES users(id) ON DELETE SET NULL;

-- 2. Loans: set approved_by to NULL if the admin is deleted
ALTER TABLE loans 
    DROP CONSTRAINT IF EXISTS loans_approved_by_fkey,
    ADD CONSTRAINT loans_approved_by_fkey 
    FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE SET NULL;

-- 3. Investment Plans: set created_by to NULL if the admin is deleted
ALTER TABLE investment_plans 
    DROP CONSTRAINT IF EXISTS investment_plans_created_by_fkey,
    ADD CONSTRAINT investment_plans_created_by_fkey 
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL;

-- 4. Charities: set created_by to NULL if the admin is deleted
ALTER TABLE charities 
    DROP CONSTRAINT IF EXISTS charities_created_by_fkey,
    ADD CONSTRAINT charities_created_by_fkey 
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL;

-- 5. Referrals: delete referral records if either referrer or referred user is deleted
ALTER TABLE referrals 
    DROP CONSTRAINT IF EXISTS referrals_referrer_id_fkey,
    ADD CONSTRAINT referrals_referrer_id_fkey 
    FOREIGN KEY (referrer_id) REFERENCES users(id) ON DELETE CASCADE,
    DROP CONSTRAINT IF EXISTS referrals_referred_id_fkey,
    ADD CONSTRAINT referrals_referred_id_fkey 
    FOREIGN KEY (referred_id) REFERENCES users(id) ON DELETE CASCADE;

-- 6. Users: referred_by should be SET NULL if the referrer is deleted
ALTER TABLE users 
    DROP CONSTRAINT IF EXISTS users_referred_by_fkey,
    ADD CONSTRAINT users_referred_by_fkey 
    FOREIGN KEY (referred_by) REFERENCES users(id) ON DELETE SET NULL;

-- 7. Audit Logs: target_user_id already has SET NULL in Migration 011,
-- but let's ensure actor_id (from older schema) or admin_id is handled.
-- Migration 011 recreated audit_logs with admin_id ON DELETE CASCADE.
-- This is fine because if an admin is deleted, their action logs may be less relevant,
-- but usually we'd prefer SET NULL. However, we'll stick to CASCADE for admin_id as per Migration 011.
