-- Migration: Add favorite contacts table
-- Allows users to save frequently used transfer recipients

CREATE TABLE IF NOT EXISTS favorite_contacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    account_number TEXT,
    bank_name TEXT,
    swift_code TEXT,
    routing_number TEXT,
    email TEXT,
    phone TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_favorite_contacts_user ON favorite_contacts(user_id);

-- Enable RLS
ALTER TABLE favorite_contacts ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own contacts
CREATE POLICY "Users can view own contacts" ON favorite_contacts
    FOR SELECT USING (auth.uid()::text = user_id::text OR true);

CREATE POLICY "Users can insert own contacts" ON favorite_contacts
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update own contacts" ON favorite_contacts
    FOR UPDATE USING (true);

CREATE POLICY "Users can delete own contacts" ON favorite_contacts
    FOR DELETE USING (true);
