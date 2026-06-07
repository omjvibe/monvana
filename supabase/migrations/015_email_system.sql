-- =====================================================
-- ADMIN EMAIL SYSTEM
-- =====================================================

-- Table for both inbound and outbound emails
CREATE TABLE IF NOT EXISTS admin_emails (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    resend_id VARCHAR(255) UNIQUE,
    from_email VARCHAR(255) NOT NULL,
    to_email VARCHAR(255) NOT NULL,
    subject TEXT,
    content_html TEXT,
    content_text TEXT,
    type VARCHAR(20) NOT NULL CHECK (type IN ('inbound', 'outbound')),
    status VARCHAR(50) DEFAULT 'sent', -- sent, delivered, failed, received
    user_id UUID REFERENCES users(id) ON DELETE SET NULL, -- optional link to a user
    is_read BOOLEAN DEFAULT FALSE,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_admin_emails_from ON admin_emails(from_email);
CREATE INDEX IF NOT EXISTS idx_admin_emails_to ON admin_emails(to_email);
CREATE INDEX IF NOT EXISTS idx_admin_emails_type ON admin_emails(type);
CREATE INDEX IF NOT EXISTS idx_admin_emails_resend_id ON admin_emails(resend_id);

-- Enable RLS
ALTER TABLE admin_emails ENABLE ROW LEVEL SECURITY;

-- Only admins can see admin emails
CREATE POLICY "Admins can view admin emails" ON admin_emails
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.clerk_id = auth.uid()::text AND users.role = 'admin'
        )
    );

-- Trigger for updated_at
CREATE TRIGGER update_admin_emails_updated_at BEFORE UPDATE ON admin_emails
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
