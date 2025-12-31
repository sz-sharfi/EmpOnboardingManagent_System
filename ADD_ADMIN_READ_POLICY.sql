-- ============================================================================
-- Allow Admins to Read All Profiles
-- ============================================================================

-- Add policy: Admins can read all profiles
CREATE POLICY "admin_read_all_profiles"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (public.is_admin());

-- Verify all 4 policies now exist
SELECT 
  policyname,
  cmd
FROM pg_policies 
WHERE tablename = 'profiles' 
  AND schemaname = 'public'
ORDER BY policyname;
