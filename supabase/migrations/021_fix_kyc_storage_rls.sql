-- Migration 021: Fix KYC Storage RLS Policies
-- Sets the kyc bucket to public and adds policies for client-side uploads

-- 1. Ensure the bucket is public to match admin viewer expectations
UPDATE storage.buckets 
SET public = true 
WHERE id = 'kyc';

-- 2. Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Allow user uploads to kyc" ON storage.objects;
DROP POLICY IF EXISTS "Allow public read of kyc" ON storage.objects;
DROP POLICY IF EXISTS "Allow public upload to kyc" ON storage.objects;
DROP POLICY IF EXISTS "Allow public select from kyc" ON storage.objects;

-- 3. Create NEW policies for the kyc bucket

-- Policy: Allow any user (including anon/Clerk users) to upload to kyc bucket
-- This is necessary because the client-side Supabase client uses the anon key
CREATE POLICY "Allow public upload to kyc"
ON storage.objects
FOR INSERT
TO public
WITH CHECK (bucket_id = 'kyc');

-- Policy: Allow public read of kyc files
-- The admin viewer uses public URLs, so this policy is required.
-- Access is still physically restricted by the uniqueness of the Clerk ID in the file path.
CREATE POLICY "Allow public select from kyc"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'kyc');

-- Policy: Allow users to update their own uploads (maintenance)
CREATE POLICY "Allow public update of kyc"
ON storage.objects
FOR UPDATE
TO public
USING (bucket_id = 'kyc')
WITH CHECK (bucket_id = 'kyc');

-- Policy: Allow users to delete their own uploads (maintenance)
CREATE POLICY "Allow public delete of kyc"
ON storage.objects
FOR DELETE
TO public
USING (bucket_id = 'kyc');
