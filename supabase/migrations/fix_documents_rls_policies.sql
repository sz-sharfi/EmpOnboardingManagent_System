-- ============================================================================
-- FIX: Row Level Security Policies for Documents Table
-- ============================================================================

-- Drop existing policies if any
DROP POLICY IF EXISTS "Users can insert own documents" ON public.documents;
DROP POLICY IF EXISTS "Users can view own documents" ON public.documents;
DROP POLICY IF EXISTS "Users can update own documents" ON public.documents;
DROP POLICY IF EXISTS "Users can delete own documents" ON public.documents;

-- Policy: Allow users to INSERT documents for their own applications
CREATE POLICY "Users can insert documents for own applications"
  ON public.documents
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 
      FROM public.candidate_applications 
      WHERE id = app_id 
        AND user_id = auth.uid()
    )
  );

-- Policy: Allow users to SELECT documents from their own applications
CREATE POLICY "Users can view documents for own applications"
  ON public.documents
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 
      FROM public.candidate_applications 
      WHERE id = app_id 
        AND user_id = auth.uid()
    )
  );

-- Policy: Allow users to UPDATE documents from their own applications
CREATE POLICY "Users can update documents for own applications"
  ON public.documents
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 
      FROM public.candidate_applications 
      WHERE id = app_id 
        AND user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 
      FROM public.candidate_applications 
      WHERE id = app_id 
        AND user_id = auth.uid()
    )
  );

-- Policy: Allow users to DELETE documents from their own applications
CREATE POLICY "Users can delete documents for own applications"
  ON public.documents
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 
      FROM public.candidate_applications 
      WHERE id = app_id 
        AND user_id = auth.uid()
    )
  );

-- ============================================================================
-- VERIFICATION: Check policies are created
-- ============================================================================

SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'documents'
ORDER BY policyname;

-- Expected output: 4 policies (INSERT, SELECT, UPDATE, DELETE)
-- All should reference candidate_applications for ownership check
