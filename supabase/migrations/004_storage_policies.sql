-- Migration 004: Storage Bucket Policies for Documents
-- Sets up proper RLS policies for the documents storage bucket

-- ============================================================================
-- CREATE STORAGE BUCKET (if not exists)
-- ============================================================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'documents',
  'documents',
  false,
  5242880, -- 5MB in bytes
  ARRAY['application/pdf', 'image/jpeg', 'image/jpg', 'image/png']
)
ON CONFLICT (id) DO UPDATE SET
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];

-- ============================================================================
-- STORAGE RLS POLICIES
-- ============================================================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Authenticated users can upload documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can view own documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own documents" ON storage.objects;

-- Allow authenticated users to upload documents to their application folder
CREATE POLICY "Authenticated users can upload documents"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'documents' AND
  (storage.foldername(name))[1] IN (
    SELECT id::text FROM public.applications WHERE user_id = auth.uid()
  )
);

-- Allow users to view documents in their applications
CREATE POLICY "Users can view own documents"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'documents' AND
  (
    -- User owns the application
    (storage.foldername(name))[1] IN (
      SELECT id::text FROM public.applications WHERE user_id = auth.uid()
    )
    OR
    -- User is admin
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  )
);

-- Allow users to update documents in their applications
CREATE POLICY "Users can update own documents"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'documents' AND
  (storage.foldername(name))[1] IN (
    SELECT id::text FROM public.applications WHERE user_id = auth.uid()
  )
)
WITH CHECK (
  bucket_id = 'documents' AND
  (storage.foldername(name))[1] IN (
    SELECT id::text FROM public.applications WHERE user_id = auth.uid()
  )
);

-- Allow users to delete documents in their applications (optional)
CREATE POLICY "Users can delete own documents"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'documents' AND
  (storage.foldername(name))[1] IN (
    SELECT id::text FROM public.applications WHERE user_id = auth.uid()
  )
);

-- ============================================================================
-- GRANT PERMISSIONS
-- ============================================================================
-- Ensure authenticated users can access storage
GRANT ALL ON storage.objects TO authenticated;
GRANT ALL ON storage.buckets TO authenticated;
