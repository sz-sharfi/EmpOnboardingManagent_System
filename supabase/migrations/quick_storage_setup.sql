-- ============================================================================
-- QUICK STORAGE SETUP - Simplified for immediate use
-- ============================================================================

-- Create candidate-documents bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('candidate-documents', 'candidate-documents', false)
ON CONFLICT (id) DO NOTHING;

-- Create profile-photos bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('profile-photos', 'profile-photos', false)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- STORAGE POLICIES - Simplified
-- ============================================================================

-- Allow authenticated users to upload to candidate-documents
CREATE POLICY "Allow authenticated uploads to candidate-documents"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'candidate-documents');

-- Allow authenticated users to read from candidate-documents
CREATE POLICY "Allow authenticated reads from candidate-documents"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'candidate-documents');

-- Allow authenticated users to delete from candidate-documents
CREATE POLICY "Allow authenticated deletes from candidate-documents"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'candidate-documents');

-- Allow authenticated users to upload profile photos
CREATE POLICY "Allow authenticated uploads to profile-photos"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'profile-photos');

-- Allow authenticated users to read profile photos
CREATE POLICY "Allow authenticated reads from profile-photos"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'profile-photos');

-- Verify buckets created
SELECT id, name, public FROM storage.buckets;
