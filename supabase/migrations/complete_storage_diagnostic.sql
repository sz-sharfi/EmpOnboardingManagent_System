-- ============================================================================
-- COMPLETE DIAGNOSTIC: Check Storage and Documents Setup
-- ============================================================================

-- 1. Check if storage buckets exist
SELECT id, name, public, created_at 
FROM storage.buckets 
ORDER BY created_at;

-- 2. Check if documents table exists
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name = 'documents';

-- 3. Check storage policies
SELECT policyname, cmd, qual 
FROM pg_policies 
WHERE schemaname = 'storage' 
  AND tablename = 'objects';

-- 4. If documents table doesn't exist, create it
CREATE TABLE IF NOT EXISTS public.documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  application_id UUID REFERENCES public.candidate_applications(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  mime_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'verified', 'rejected')),
  verified_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  verified_at TIMESTAMP WITH TIME ZONE,
  rejection_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. Enable RLS on documents
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

-- 6. Create policies for documents table
DROP POLICY IF EXISTS "Users can view own documents" ON public.documents;
CREATE POLICY "Users can view own documents"
  ON public.documents FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own documents" ON public.documents;
CREATE POLICY "Users can insert own documents"
  ON public.documents FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own documents" ON public.documents;
CREATE POLICY "Users can update own documents"
  ON public.documents FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own documents" ON public.documents;
CREATE POLICY "Users can delete own documents"
  ON public.documents FOR DELETE
  USING (auth.uid() = user_id);

-- 7. Grant permissions
GRANT ALL ON public.documents TO authenticated;

-- 8. Verify everything
SELECT 'Buckets:' as check_type, COUNT(*)::text as count FROM storage.buckets
UNION ALL
SELECT 'Documents table:', COUNT(*)::text FROM information_schema.tables WHERE table_name = 'documents'
UNION ALL
SELECT 'Storage policies:', COUNT(*)::text FROM pg_policies WHERE schemaname = 'storage'
UNION ALL
SELECT 'Documents policies:', COUNT(*)::text FROM pg_policies WHERE tablename = 'documents';
