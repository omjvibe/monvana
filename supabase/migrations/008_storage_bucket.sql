-- Migration: Create storage bucket for loan documents
-- This needs to be run via Supabase Dashboard -> Storage or SQL Editor

-- Note: Storage buckets are typically created via the Supabase Dashboard
-- or using the Supabase client library from a server-side API.
-- 
-- The bucket "loan-documents" should be created with:
-- - Private access (not public by default)
-- - File size limit: 10MB
-- - Allowed MIME types: image/*, application/pdf, application/msword, 
--   application/vnd.openxmlformats-officedocument.wordprocessingml.document

-- Create a function to handle document metadata (if needed)
CREATE OR REPLACE FUNCTION get_user_documents(user_uuid UUID)
RETURNS TABLE (
    id UUID,
    application_id UUID,
    document_type TEXT,
    file_name TEXT,
    file_path TEXT,
    file_size INTEGER,
    created_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ld.id,
        ld.application_id,
        ld.document_type,
        ld.file_name,
        ld.file_path,
        ld.file_size,
        ld.created_at
    FROM loan_documents ld
    JOIN loan_applications la ON la.id = ld.application_id
    WHERE la.user_id = user_uuid
    ORDER BY ld.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Storage policies for loan-documents bucket
-- These need to be created via the Supabase Dashboard -> Storage -> Policies
-- 
-- Policy 1: Allow authenticated users to upload their own files
-- Name: "Users can upload their own documents"
-- Operation: INSERT
-- Policy: (bucket_id = 'loan-documents' AND auth.uid()::text = (storage.foldername(name))[1])
--
-- Policy 2: Allow authenticated users to read their own files  
-- Name: "Users can read their own documents"
-- Operation: SELECT
-- Policy: (bucket_id = 'loan-documents' AND auth.uid()::text = (storage.foldername(name))[1])
--
-- Policy 3: Allow service role full access
-- Name: "Service role has full access"
-- Operation: ALL
-- Policy: true (for service role only)

-- Instructions for manual bucket creation:
-- 1. Go to Supabase Dashboard -> Storage
-- 2. Click "New bucket"
-- 3. Name: loan-documents
-- 4. Public bucket: OFF (unchecked)
-- 5. File size limit: 10485760 (10MB)
-- 6. Allowed MIME types: image/jpeg,image/png,image/gif,image/webp,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document
-- 7. Click "Create bucket"
-- 8. After creation, click on the bucket and go to "Policies"
-- 9. Create the policies as described above

COMMENT ON TABLE loan_documents IS 'Stores metadata for uploaded loan application documents. Files are stored in Supabase Storage bucket loan-documents.';
