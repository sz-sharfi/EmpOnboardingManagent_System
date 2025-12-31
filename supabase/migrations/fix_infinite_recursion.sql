-- ============================================================================
-- FIX: Infinite Recursion in RLS Policies
-- This fixes the circular reference in the profiles table policies
-- ============================================================================

-- Drop the problematic "Admins can view all profiles" policy
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;

-- Recreate it without using is_admin() function to avoid recursion
CREATE POLICY "Admins can view all profiles"
  ON public.profiles FOR SELECT
  USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
  );

-- However, a simpler solution is to just remove this policy entirely
-- since "Users can view own profile" already allows login to work.
-- If you prefer the simpler approach, run this instead:

DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;

-- Admins will still be able to query profiles through the application code
-- using the service role key when needed, avoiding the RLS recursion issue.

-- ============================================================================
-- VERIFICATION: Check remaining policies
-- ============================================================================
SELECT 
  policyname,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'profiles';

-- Expected: Should show only "Users can view own profile" and "Users can update own profile"
