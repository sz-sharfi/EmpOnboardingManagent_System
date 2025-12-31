-- ============================================================================
-- FIX: Allow admins to view all documents
-- ============================================================================

-- Add admin SELECT policy for documents table
CREATE POLICY "Admins can view all documents"
  ON public.documents
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() 
        AND profiles.role = 'admin'
    )
  );

-- Verify policies
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
