-- ============================================================================
-- FIX ADMIN LOGIN - Remove Circular RLS Dependencies
-- ============================================================================

-- Drop existing SELECT policies on profiles table that cause infinite recursion
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Candidates can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "users_read_own_profile" ON public.profiles;
DROP POLICY IF EXISTS "admins_read_all_profiles" ON public.profiles;

-- Create a SECURITY DEFINER function to check if current user is admin
-- This bypasses RLS and prevents infinite recursion
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = auth.uid()
      AND role = 'admin'
  );
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;

-- Policy 1: Users can read their own profile (no circular dependency)
CREATE POLICY "users_read_own_profile"
  ON public.profiles
  FOR SELECT
  USING (id = auth.uid());

-- Policy 2: Admins can read all profiles (using SECURITY DEFINER function)
CREATE POLICY "admins_read_all_profiles"
  ON public.profiles
  FOR SELECT
  USING (public.is_admin());

-- Add comment for documentation
COMMENT ON FUNCTION public.is_admin() IS 'Check if current user has admin role. Uses SECURITY DEFINER to bypass RLS and prevent infinite recursion during login.';
