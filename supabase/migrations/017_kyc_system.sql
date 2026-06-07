-- 0. Create storage bucket for KYC (Private)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('kyc', 'kyc', false) 
ON CONFLICT DO NOTHING;

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
-- 1. Update Users table with initial/mild KYC fields
ALTER TABLE users ADD COLUMN IF NOT EXISTS kyc_id_type VARCHAR(50);
ALTER TABLE users ADD COLUMN IF NOT EXISTS kyc_id_number VARCHAR(100);
ALTER TABLE users ADD COLUMN IF NOT EXISTS kyc_details JSONB DEFAULT '{}';

-- Modernize KYC status to include 'unverified'
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_kyc_status_check;
ALTER TABLE users ALTER COLUMN kyc_status SET DEFAULT 'unverified';
ALTER TABLE users ADD CONSTRAINT users_kyc_status_check CHECK (kyc_status IN ('unverified', 'pending', 'approved', 'rejected', 'expired'));

-- Sync existing NULL or 'pending' (if they haven't submitted anything) to 'unverified'
-- This ensures new users are correctly identified as needing verification
UPDATE users SET kyc_status = 'unverified' WHERE kyc_status IS NULL;

-- 2. Create KYC Submissions table for full verification
CREATE TABLE IF NOT EXISTS kyc_submissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    id_type VARCHAR(50) NOT NULL,
    id_number VARCHAR(100) NOT NULL,
    id_front_url TEXT,
    id_back_url TEXT,
    selfie_url TEXT,
    address_proof_url TEXT,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'expired')),
    admin_note TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Add KYC toggle to bank_info features
-- Assuming bank_info row exists, we update the features JSONB
UPDATE bank_info 
SET features = features || '{"kyc_mandatory": false}'::jsonb
WHERE id = (SELECT id FROM bank_info LIMIT 1);

-- 4. Enable RLS on kyc_submissions
ALTER TABLE kyc_submissions ENABLE ROW LEVEL SECURITY;

-- 5. Policies for kyc_submissions
CREATE POLICY "Users can view own kyc submissions" ON kyc_submissions
    FOR SELECT USING (user_id IN (SELECT id FROM users WHERE clerk_id = auth.uid()::text) OR (SELECT role FROM users WHERE clerk_id = auth.uid()::text) = 'admin');

CREATE POLICY "Users can create kyc submissions" ON kyc_submissions
    FOR INSERT WITH CHECK (user_id IN (SELECT id FROM users WHERE clerk_id = auth.uid()::text));

-- Admin can manage all KYC
CREATE POLICY "Admins can manage all kyc" ON kyc_submissions
    FOR ALL TO service_role USING (true);

-- 6. Trigger for updated_at
CREATE TRIGGER update_kyc_submissions_updated_at BEFORE UPDATE ON kyc_submissions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 7. Add Index
CREATE INDEX IF NOT EXISTS idx_kyc_submissions_user ON kyc_submissions(user_id);
CREATE INDEX IF NOT EXISTS idx_kyc_submissions_status ON kyc_submissions(status);
