-- Fix RLS for kyc_submissions to explicitly allow service_role
-- Even though service_role should bypass RLS, this ensures it's explicitly allowed 
-- if FORCE ROW LEVEL SECURITY was accidentally enabled.

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'kyc_submissions' 
        AND policyname = 'Service Role Full Access'
    ) THEN
        CREATE POLICY "Service Role Full Access" ON kyc_submissions
            FOR ALL TO service_role USING (true) WITH CHECK (true);
    END IF;
END $$;

-- Also ensure the bucket is handled correctly
-- Bucket was already made public in 021, but let's re-verify the policies
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'objects' 
        AND schemaname = 'storage'
        AND policyname = 'Service role storage access'
    ) THEN
        CREATE POLICY "Service role storage access" ON storage.objects
            FOR ALL TO service_role USING (true) WITH CHECK (true);
    END IF;
END $$;
