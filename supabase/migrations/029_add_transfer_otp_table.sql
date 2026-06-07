-- =====================================================
-- MONVANA BANK - OTP SYSTEM
-- Migration: 029_add_transfer_otp_table.sql
-- Description: Add OTP system for secure transfers
-- =====================================================

-- Add transfer_otp to bank_settings if it doesn't exist
INSERT INTO bank_settings (key, value)
VALUES ('transfer_otp', 'false')
ON CONFLICT (key) DO NOTHING;

-- Create OTPS table
CREATE TABLE IF NOT EXISTS otps (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    code VARCHAR(10) NOT NULL,
    type VARCHAR(50) DEFAULT 'transfer' CHECK (type IN ('transfer', 'withdrawal', 'security', 'login')),
    is_verified BOOLEAN DEFAULT FALSE,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_otps_user_id ON otps(user_id);
CREATE INDEX IF NOT EXISTS idx_otps_code ON otps(code);
CREATE INDEX IF NOT EXISTS idx_otps_expires_at ON otps(expires_at);

-- Enable RLS
ALTER TABLE otps ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own otps" ON otps
    FOR SELECT USING (
        user_id IN (SELECT id FROM users WHERE clerk_id = auth.uid()::text)
    );

CREATE POLICY "Service role has full access to otps" ON otps
    FOR ALL USING (true) WITH CHECK (true);

-- Grant permissions
GRANT SELECT, INSERT, UPDATE ON otps TO authenticated;
GRANT ALL ON otps TO service_role;
