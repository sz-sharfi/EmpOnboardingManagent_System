-- ============================================================================
-- URGENT FIX: Admin Login Issue - Run this in Supabase SQL Editor
-- ============================================================================
-- Problem 1: Profile record doesn't exist for user
-- Problem 2: Circular RLS dependency prevents admin login
-- Solution: Create missing profile + fix RLS policies
-- ============================================================================

-- Step 1: Check if profile exists and create if missing
DO $$
DECLARE
  user_exists BOOLEAN;
BEGIN
  -- Check if profile exists for admin@example.com
  SELECT EXISTS (
    SELECT 1 FROM auth.users WHERE email = 'admin@example.com'
  ) INTO user_exists;

  IF user_exists THEN
    -- Insert or update profile for the admin user
    INSERT INTO public.profiles (id, email, full_name, role, created_at, updated_at)
    SELECT 
      id,
      email,
      'Admin User',
      'admin',
      NOW(),
      NOW()
    FROM auth.users 
    WHERE email = 'admin@example.com'
    ON CONFLICT (id) 
    DO UPDATE SET 
      role = 'admin',
      updated_at = NOW();
    
    RAISE NOTICE 'Admin profile created/updated successfully';
  ELSE
    RAISE NOTICE 'No user found with email admin@example.com';
  END IF;
END $$;

-- Step 2: Drop problematic policies
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Candidates can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "users_read_own_profile" ON public.profiles;
DROP POLICY IF EXISTS "admins_read_all_profiles" ON public.profiles;

-- Step 3: Create SECURITY DEFINER function (bypasses RLS to prevent infinite recursion)
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

-- Step 4: Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;

-- Step 5: Create new RLS policies (no circular dependency)
CREATE POLICY "users_read_own_profile"
  ON public.profiles
  FOR SELECT
  USING (id = auth.uid());

CREATE POLICY "admins_read_all_profiles"
  ON public.profiles
  FOR SELECT
  USING (public.is_admin());

-- Step 6: Ensure users can insert their own profile
DROP POLICY IF EXISTS "users_insert_own_profile" ON public.profiles;
CREATE POLICY "users_insert_own_profile"
  ON public.profiles
  FOR INSERT
  WITH CHECK (id = auth.uid());

-- Step 7: Ensure users can update their own profile
DROP POLICY IF EXISTS "users_update_own_profile" ON public.profiles;
CREATE POLICY "users_update_own_profile"
  ON public.profiles
  FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- Step 8: Verify the admin profile was created
SELECT 
  id,
  email,
  full_name,
  role,
  created_at
FROM public.profiles 
WHERE email = 'admin@example.com';
