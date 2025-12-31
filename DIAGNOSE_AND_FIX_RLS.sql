-- ============================================================================
-- DIAGNOSE AND FIX RLS - Run this in Supabase SQL Editor
-- ============================================================================

-- Step 1: Check current RLS status
SELECT 
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename = 'profiles';

-- Step 2: Check current policies
SELECT 
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'profiles' 
  AND schemaname = 'public';

-- Step 3: DISABLE RLS temporarily to allow profile creation
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

-- Step 4: Verify admin profile exists
SELECT id, email, full_name, role 
FROM public.profiles 
WHERE email = 'admin@example.com';

-- Step 5: If profile doesn't exist, create it
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
ON CONFLICT (id) DO UPDATE 
SET role = 'admin', updated_at = NOW();

-- Step 6: RE-ENABLE RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Step 7: Drop ALL existing policies
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Candidates can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "users_read_own_profile" ON public.profiles;
DROP POLICY IF EXISTS "admins_read_all_profiles" ON public.profiles;
DROP POLICY IF EXISTS "users_insert_own_profile" ON public.profiles;
DROP POLICY IF EXISTS "users_update_own_profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

-- Step 8: Create helper function (SECURITY DEFINER to bypass RLS)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = auth.uid()
      AND role = 'admin'
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;

-- Step 9: Create SIMPLE policies that work
-- Policy 1: Everyone can read their own profile
CREATE POLICY "allow_read_own_profile"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Policy 2: Admins can read ALL profiles  
CREATE POLICY "allow_admin_read_all"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

-- Policy 3: Users can insert their own profile
CREATE POLICY "allow_insert_own_profile"
  ON public.profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Policy 4: Users can update their own profile
CREATE POLICY "allow_update_own_profile"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Step 10: Verify policies are active
SELECT 
  schemaname,
  tablename,
  policyname,
  cmd,
  qual
FROM pg_policies 
WHERE tablename = 'profiles' 
  AND schemaname = 'public'
ORDER BY policyname;

-- Step 11: Test as the admin user
SELECT 
  'Test Query: Can fetch own profile' as test,
  id, 
  email, 
  role 
FROM public.profiles 
WHERE id = auth.uid();
