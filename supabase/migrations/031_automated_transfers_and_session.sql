-- =====================================================
-- MONVANA BANK - AUTOMATION & SECURITY SETTINGS
-- Migration: 031_automated_transfers_and_session.sql
-- Description: Add settings for automated transfer approvals and updated session timeout
-- =====================================================

-- Add automated transfer approval settings
INSERT INTO bank_settings (key, value)
VALUES 
    ('auto_transfer_approval', 'true'),
    ('auto_transfer_threshold', '100000')
ON CONFLICT (key) DO UPDATE SET value = 'true' WHERE bank_settings.key = 'auto_transfer_approval';


-- Update session timeout to 40 minutes as requested
UPDATE bank_settings 
SET value = '40' 
WHERE key = 'session_timeout';

-- Ensure the session_timeout exists if it didn't
INSERT INTO bank_settings (key, value)
VALUES ('session_timeout', '40')
ON CONFLICT (key) DO NOTHING;
