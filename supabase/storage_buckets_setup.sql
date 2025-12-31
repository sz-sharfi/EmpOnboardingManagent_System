-- ============================================================================
-- SUPABASE STORAGE BUCKETS SETUP
-- Employee Onboarding System - Document and Photo Storage
-- 
-- Run this in Supabase SQL Editor after setting up database tables
-- ============================================================================

-- ============================================================================
-- STEP 1: CREATE STORAGE BUCKETS
-- ============================================================================

-- Bucket 1: candidate-documents (for application documents)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'candidate-documents',
  'candidate-documents',
  false,  -- Private bucket
  5242880,  -- 5MB in bytes
  ARRAY[
    'application/pdf',
    'image/jpeg',
    'image/jpg',
    'image/png'
  ]
)
ON CONFLICT (id) DO UPDATE SET
  public = false,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY[
    'application/pdf',
    'image/jpeg',
    'image/jpg',
    'image/png'
  ];

-- Bucket 2: profile-photos (for user profile pictures)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'profile-photos',
  'profile-photos',
  false,  -- Private bucket
  2097152,  -- 2MB in bytes
  ARRAY[
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp'
  ]
)
ON CONFLICT (id) DO UPDATE SET
  public = false,
  file_size_limit = 2097152,
  allowed_mime_types = ARRAY[
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp'
  ];


-- ============================================================================
-- STEP 2: DROP EXISTING STORAGE POLICIES (if any)
-- ============================================================================

-- Drop candidate-documents policies
DROP POLICY IF EXISTS "Candidates upload own documents" ON storage.objects;
DROP POLICY IF EXISTS "Candidates view own documents" ON storage.objects;
DROP POLICY IF EXISTS "Candidates delete own documents" ON storage.objects;
DROP POLICY IF EXISTS "Admins view all candidate documents" ON storage.objects;

-- Drop profile-photos policies
DROP POLICY IF EXISTS "Users upload own profile photo" ON storage.objects;
DROP POLICY IF EXISTS "Users view own profile photo" ON storage.objects;
DROP POLICY IF EXISTS "Users update own profile photo" ON storage.objects;
DROP POLICY IF EXISTS "Users delete own profile photo" ON storage.objects;
DROP POLICY IF EXISTS "Admins view all profile photos" ON storage.objects;


-- ============================================================================
-- STEP 3: CREATE STORAGE POLICIES - CANDIDATE DOCUMENTS
-- ============================================================================

-- Policy: Candidates can upload documents to their own user_id folder
-- Folder structure: {user_id}/{application_id}/{document_type}/{filename}
CREATE POLICY "Candidates upload own documents"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'candidate-documents'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Policy: Candidates can view their own documents
CREATE POLICY "Candidates view own documents"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'candidate-documents'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Policy: Candidates can delete their own documents
CREATE POLICY "Candidates delete own documents"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'candidate-documents'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Policy: Admins can view all candidate documents
CREATE POLICY "Admins view all candidate documents"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'candidate-documents'
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND role = 'admin'
    )
  );


-- ============================================================================
-- STEP 4: CREATE STORAGE POLICIES - PROFILE PHOTOS
-- ============================================================================

-- Policy: Users can upload their own profile photo
-- Folder structure: {user_id}/{filename}
CREATE POLICY "Users upload own profile photo"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'profile-photos'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Policy: Users can view their own profile photo
CREATE POLICY "Users view own profile photo"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'profile-photos'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Policy: Users can update their own profile photo
CREATE POLICY "Users update own profile photo"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'profile-photos'
    AND (storage.foldername(name))[1] = auth.uid()::text
  )
  WITH CHECK (
    bucket_id = 'profile-photos'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Policy: Users can delete their own profile photo
CREATE POLICY "Users delete own profile photo"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'profile-photos'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Policy: Admins can view all profile photos
CREATE POLICY "Admins view all profile photos"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'profile-photos'
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND role = 'admin'
    )
  );


-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Check if buckets were created
SELECT 
  id,
  name,
  public,
  file_size_limit,
  file_size_limit / 1024 / 1024 AS size_limit_mb,
  allowed_mime_types,
  created_at
FROM storage.buckets
WHERE id IN ('candidate-documents', 'profile-photos')
ORDER BY name;

-- Check storage policies
SELECT 
  policyname,
  tablename,
  cmd,
  CASE 
    WHEN policyname LIKE '%candidate%' THEN 'candidate-documents'
    WHEN policyname LIKE '%profile%' THEN 'profile-photos'
    ELSE 'unknown'
  END as bucket_type
FROM pg_policies
WHERE schemaname = 'storage' 
  AND tablename = 'objects'
  AND policyname IN (
    'Candidates upload own documents',
    'Candidates view own documents',
    'Candidates delete own documents',
    'Admins view all candidate documents',
    'Users upload own profile photo',
    'Users view own profile photo',
    'Users update own profile photo',
    'Users delete own profile photo',
    'Admins view all profile photos'
  )
ORDER BY bucket_type, policyname;

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Storage buckets setup complete!';
  RAISE NOTICE 'Created buckets: candidate-documents (5MB), profile-photos (2MB)';
  RAISE NOTICE 'Storage policies configured for secure access';
END $$;
