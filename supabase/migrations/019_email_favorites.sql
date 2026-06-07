-- Migration: Add is_favorite to admin_emails
-- This allows admins to bookmark important emails.

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'admin_emails' AND COLUMN_NAME = 'is_favorite') THEN
        ALTER TABLE admin_emails ADD COLUMN is_favorite BOOLEAN DEFAULT FALSE;
    END IF;
END $$;
