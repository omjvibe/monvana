-- Migration 012: Add deposit proof functionality
-- Run this in your Supabase SQL Editor

-- Add proof_url column to transactions table
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS proof_url TEXT;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_transactions_proof ON transactions(proof_url) WHERE proof_url IS NOT NULL;

-- ============================================
-- STORAGE BUCKET SETUP FOR DEPOSIT PROOFS
-- ============================================

-- First, manually create the bucket in Supabase Dashboard:
-- 1. Go to Storage -> New bucket
-- 2. Name: deposit-proofs
-- 3. Public bucket: ON
-- 4. File size limit: 5242880 (5MB)
-- 5. Allowed MIME types: image/jpeg,image/png,image/gif,image/webp,image/jpg

-- Then run these policies (replace 'deposit-proofs' if you used a different name):

-- Policy: Allow authenticated users to upload to their own folder
INSERT INTO storage.objects (bucket_id, name)
SELECT 'deposit-proofs', '.keep'
WHERE NOT EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'deposit-proofs');

-- Note: The actual bucket must be created via Supabase Dashboard UI
-- After creating the bucket, run the following in SQL Editor:

-- DROP EXISTING POLICIES (if any)
DROP POLICY IF EXISTS "Allow authenticated uploads" ON storage.objects;
DROP POLICY IF EXISTS "Allow public read" ON storage.objects;
DROP POLICY IF EXISTS "Allow user uploads to deposit-proofs" ON storage.objects;
DROP POLICY IF EXISTS "Allow public read of deposit-proofs" ON storage.objects;

-- CREATE NEW POLICIES

-- Policy 1: Allow any authenticated user to upload to deposit-proofs bucket
CREATE POLICY "Allow user uploads to deposit-proofs"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'deposit-proofs');

-- Policy 2: Allow anyone to read from deposit-proofs (public access for admins)
CREATE POLICY "Allow public read of deposit-proofs"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'deposit-proofs');

-- Policy 3: Allow users to update their own uploads
CREATE POLICY "Allow users to update own deposit proofs"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'deposit-proofs')
WITH CHECK (bucket_id = 'deposit-proofs');

-- Policy 4: Allow users to delete their own uploads
CREATE POLICY "Allow users to delete own deposit proofs"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'deposit-proofs');

COMMENT ON COLUMN transactions.proof_url IS 'URL to proof of payment image stored in Supabase Storage';

-- ============================================
-- ALTERNATIVE: If the above doesn't work, try this simpler approach in Supabase Dashboard:
-- ============================================
-- 1. Go to Storage -> deposit-proofs bucket -> Policies
-- 2. Click "New Policy"
-- 3. Select "For full customization"
-- 4. Policy name: "Allow authenticated uploads"
-- 5. Target roles: authenticated
-- 6. Operations: INSERT
-- 7. USING expression: true
-- 8. WITH CHECK expression: true
-- 9. Save
-- 
-- Repeat for SELECT with public role
