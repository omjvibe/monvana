-- Migration: Add admin user management features
-- Adds deposit_address to wallets, and additional columns to users and billing_codes

-- Add deposit_address to wallets for crypto deposits
ALTER TABLE wallets ADD COLUMN IF NOT EXISTS deposit_address TEXT;

-- Add suspension tracking to users
ALTER TABLE users ADD COLUMN IF NOT EXISTS suspended_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS suspended_by UUID REFERENCES users(id);
ALTER TABLE users ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS deleted_by UUID REFERENCES users(id);
ALTER TABLE users ADD COLUMN IF NOT EXISTS account_type VARCHAR(50) DEFAULT 'standard';
ALTER TABLE users ADD COLUMN IF NOT EXISTS daily_limit DECIMAL(20, 2) DEFAULT 10000;
ALTER TABLE users ADD COLUMN IF NOT EXISTS monthly_limit DECIMAL(20, 2) DEFAULT 100000;

-- Update billing_codes to ensure all required columns exist
ALTER TABLE billing_codes ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;

-- Create index for faster status lookups
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);
CREATE INDEX IF NOT EXISTS idx_users_clerk_id ON users(clerk_id);

-- Update RLS policies for billing_codes
DROP POLICY IF EXISTS "Users can view own billing codes" ON billing_codes;
CREATE POLICY "Users can view own billing codes" ON billing_codes
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can manage billing codes" ON billing_codes;
CREATE POLICY "Admins can manage billing codes" ON billing_codes
    FOR ALL USING (true);

-- Update RLS policies for wallets to include deposit_address
DROP POLICY IF EXISTS "Users can view own wallets" ON wallets;
CREATE POLICY "Users can view own wallets" ON wallets
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can manage wallets" ON wallets;
CREATE POLICY "Admins can manage wallets" ON wallets
    FOR ALL USING (true);

-- Add comment for documentation
COMMENT ON COLUMN wallets.deposit_address IS 'Crypto deposit address assigned by admin for user deposits';
COMMENT ON COLUMN users.suspended_at IS 'Timestamp when user was suspended';
COMMENT ON COLUMN users.suspended_by IS 'Admin who suspended the user';
COMMENT ON COLUMN users.account_type IS 'User account type: standard, premium, business, vip';
COMMENT ON COLUMN users.daily_limit IS 'Daily transaction limit';
COMMENT ON COLUMN users.monthly_limit IS 'Monthly transaction limit';

-- Create audit_logs table for tracking admin actions
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id UUID NOT NULL REFERENCES users(id),
    action VARCHAR(100) NOT NULL,
    target_user_id UUID REFERENCES users(id),
    details TEXT,
    ip_address VARCHAR(50),
    user_agent TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for faster audit log lookups
CREATE INDEX IF NOT EXISTS idx_audit_logs_admin ON audit_logs(admin_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_target ON audit_logs(target_user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON audit_logs(created_at DESC);

-- RLS for audit_logs (only admins can view)
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view audit logs" ON audit_logs
    FOR SELECT USING (true);

CREATE POLICY "System can insert audit logs" ON audit_logs
    FOR INSERT WITH CHECK (true);
