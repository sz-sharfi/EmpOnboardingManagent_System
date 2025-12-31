-- ============================================================================
-- CLEAN FIX - Remove ALL old policies and create fresh ones
-- ============================================================================

-- Step 1: Drop EVERY policy on profiles (using exact names from your screenshot)
DROP POLICY IF EXISTS "Admins can read all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Profiles self read" ON public.profiles;
DROP POLICY IF EXISTS "Users can read own profile" ON public.profiles;
DROP POLICY IF EXISTS "allow_admin_read_all" ON public.profiles;
DROP POLICY IF EXISTS "allow_insert_own_profile" ON public.profiles;
DROP POLICY IF EXISTS "allow_read_own_profile" ON public.profiles;
DROP POLICY IF EXISTS "allow_update_own_profile" ON public.profiles;

-- Step 2: Keep the function (don't drop it, just replace it)
-- Other tables depend on is_admin() so we can't drop it
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

-- Step 3: Create ONLY these 3 simple policies
CREATE POLICY "read_own_profile"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "insert_own_profile"
  ON public.profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "update_own_profile"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Step 4: Verify ONLY 3 policies exist now
SELECT 
  policyname,
  cmd
FROM pg_policies 
WHERE tablename = 'profiles' 
  AND schemaname = 'public'
ORDER BY policyname;
