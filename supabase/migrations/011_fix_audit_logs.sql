-- Migration 011: Fix audit_logs table and add missing columns
-- Run this in your Supabase SQL Editor

-- First, check if audit_logs table exists and drop it to recreate properly
DROP TABLE IF EXISTS audit_logs CASCADE;

-- Create audit_logs table fresh
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    action VARCHAR(100) NOT NULL,
    target_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    details TEXT,
    ip_address VARCHAR(50),
    user_agent TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_audit_logs_admin ON audit_logs(admin_id);
CREATE INDEX idx_audit_logs_target ON audit_logs(target_user_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_created ON audit_logs(created_at DESC);

-- Enable RLS
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- RLS policies
DROP POLICY IF EXISTS "Admins can view audit logs" ON audit_logs;
CREATE POLICY "Admins can view audit logs" ON audit_logs
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "System can insert audit logs" ON audit_logs;
CREATE POLICY "System can insert audit logs" ON audit_logs
    FOR INSERT WITH CHECK (true);

-- Add missing columns to other tables (safe - IF NOT EXISTS)
ALTER TABLE billing_codes ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;
ALTER TABLE wallets ADD COLUMN IF NOT EXISTS deposit_address TEXT;

-- Add columns to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS suspended_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS suspended_by UUID REFERENCES users(id);
ALTER TABLE users ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS deleted_by UUID REFERENCES users(id);
ALTER TABLE users ADD COLUMN IF NOT EXISTS account_type VARCHAR(50) DEFAULT 'standard';
ALTER TABLE users ADD COLUMN IF NOT EXISTS daily_limit DECIMAL(20, 2) DEFAULT 10000;
ALTER TABLE users ADD COLUMN IF NOT EXISTS monthly_limit DECIMAL(20, 2) DEFAULT 100000;

-- Add routing_number and swift_code to transactions if not exists
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS routing_number VARCHAR(50);
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS swift_code VARCHAR(20);
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS processed_by UUID REFERENCES users(id);
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS processed_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS admin_note TEXT;

-- Add wallet_id to transactions if not exists
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS wallet_id UUID REFERENCES wallets(id);

-- Create favorite_contacts table if not exists
CREATE TABLE IF NOT EXISTS favorite_contacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(200) NOT NULL,
    account_number VARCHAR(50),
    bank_name VARCHAR(200),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on favorite_contacts
ALTER TABLE favorite_contacts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own contacts" ON favorite_contacts;
CREATE POLICY "Users can manage own contacts" ON favorite_contacts
    FOR ALL USING (true);

-- Verify the audit_logs table was created correctly
SELECT column_name, data_type FROM information_schema.columns 
WHERE table_name = 'audit_logs' ORDER BY ordinal_position;

-- Add goal_amount to charities table
ALTER TABLE charities ADD COLUMN IF NOT EXISTS goal_amount DECIMAL(20, 2);

-- Create deposit_methods table for admin-managed deposit options
CREATE TABLE IF NOT EXISTS deposit_methods (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    method_type VARCHAR(50) NOT NULL, -- 'crypto', 'bank_transfer', 'p2p', 'mobile_money'
    title VARCHAR(200) NOT NULL,
    description TEXT,
    wallet_address TEXT,
    bank_name VARCHAR(200),
    account_number VARCHAR(100),
    account_name VARCHAR(200),
    routing_number VARCHAR(50),
    swift_code VARCHAR(20),
    additional_info TEXT,
    qr_code_url TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    priority INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_deposit_methods_user ON deposit_methods(user_id);
CREATE INDEX IF NOT EXISTS idx_deposit_methods_active ON deposit_methods(is_active);

-- Enable RLS
ALTER TABLE deposit_methods ENABLE ROW LEVEL SECURITY;

-- Policies
DROP POLICY IF EXISTS "Users can view own deposit methods" ON deposit_methods;
CREATE POLICY "Users can view own deposit methods" ON deposit_methods
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Service role can manage deposit methods" ON deposit_methods;
CREATE POLICY "Service role can manage deposit methods" ON deposit_methods
    FOR ALL USING (true);

COMMENT ON TABLE deposit_methods IS 'Admin-managed deposit methods assigned to each user';
