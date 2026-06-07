-- Migration: Add attachments support to admin_emails
-- This adds the attachments column and provides a guide for the storage bucket.

-- Add attachments column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'admin_emails' AND COLUMN_NAME = 'attachments') THEN
        ALTER TABLE admin_emails ADD COLUMN attachments JSONB DEFAULT '[]';
    END IF;
END $$;

-- Enable RLS for storage (This part is usually done via Supabase UI or another migration for storage schema)
-- But we'll add the policy hint here.

-- The bucket "email-attachments" should be created with:
-- - Private access
-- - File size limit: 20MB
-- - Allowed MIME types: *

-- Example policy for the bucket (if using Supabase Storage):
-- CREATE POLICY "Admins can manage email attachments" ON storage.objects
--     FOR ALL USING (
--         bucket_id = 'email-attachments' AND 
--         EXISTS (
--             SELECT 1 FROM public.users
--             WHERE users.clerk_id = auth.uid()::text AND users.role = 'admin'
--         )
--     );
