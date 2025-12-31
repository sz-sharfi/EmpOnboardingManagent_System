-- ============================================================================
-- ADMIN RLS POLICIES - Allow admins to view all applications and documents
-- ============================================================================

-- 1. Allow admins to view ALL candidate applications
CREATE POLICY "Admins can view all applications"
  ON public.candidate_applications
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() 
        AND profiles.role = 'admin'
    )
  );

-- 2. Verify the policies
SELECT 
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE tablename IN ('candidate_applications', 'documents')
ORDER BY tablename, policyname;
