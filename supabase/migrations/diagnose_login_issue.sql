-- ============================================================================
-- DIAGNOSTIC: Check Login Issue
-- Run this to diagnose why login is failing
-- ============================================================================

-- STEP 1: Check if user exists in auth.users
-- ============================================================================
SELECT 
  'AUTH USERS CHECK' as check_type,
  id,
  email,
  created_at,
  email_confirmed_at,
  CASE 
    WHEN email_confirmed_at IS NULL THEN '⚠️ Email not confirmed'
    ELSE '✅ Email confirmed'
  END as email_status,
  raw_user_meta_data
FROM auth.users
WHERE email = 'sz.sharfi8541@gmail.com';

-- Expected: Should return 1 row with your email


-- STEP 2: Check if profile exists in public.profiles
-- ============================================================================
SELECT 
  'PROFILE CHECK' as check_type,
  p.id,
  p.email,
  p.full_name,
  p.role,
  p.created_at,
  CASE 
    WHEN p.id IS NULL THEN '❌ NO PROFILE FOUND'
    ELSE '✅ Profile exists'
  END as status
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
WHERE u.email = 'sz.sharfi8541@gmail.com';

-- Expected: Should return 1 row with "✅ Profile exists"


-- STEP 3: Check RLS policies on profiles table
-- ============================================================================
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'profiles';

-- Expected: Should see policies for SELECT, UPDATE


-- STEP 4: Check if profiles table exists and has correct structure
-- ============================================================================
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'profiles'
ORDER BY ordinal_position;

-- Expected: Should show id, email, full_name, role, avatar_url, created_at, updated_at


-- ============================================================================
-- FIX: If profile doesn't exist, create it manually
-- ============================================================================

-- If STEP 2 shows "❌ NO PROFILE FOUND", run this:
INSERT INTO public.profiles (id, email, full_name, role)
SELECT 
  id,
  email,
  COALESCE(raw_user_meta_data->>'full_name', ''),
  COALESCE(raw_user_meta_data->>'role', 'candidate')
FROM auth.users
WHERE email = 'sz.sharfi8541@gmail.com'
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  full_name = EXCLUDED.full_name,
  role = EXCLUDED.role;

-- Expected: Should create 1 profile


-- ============================================================================
-- VERIFY: Check again after manual creation
-- ============================================================================
SELECT 
  'FINAL VERIFICATION' as check_type,
  u.email,
  p.full_name,
  p.role,
  CASE 
    WHEN p.id IS NULL THEN '❌ Still no profile - ESCALATE ISSUE'
    ELSE '✅ Profile created - Try login now!'
  END as final_status
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
WHERE u.email = 'sz.sharfi8541@gmail.com';

-- Expected: "✅ Profile created - Try login now!"


-- ============================================================================
-- BONUS: Check if the trigger is working
-- ============================================================================
SELECT 
  n.nspname as schema,
  t.tgname as trigger_name,
  c.relname as table_name,
  p.proname as function_name,
  pg_get_triggerdef(t.oid) as trigger_definition
FROM pg_trigger t
JOIN pg_class c ON t.tgrelid = c.oid
JOIN pg_namespace n ON c.relnamespace = n.oid
JOIN pg_proc p ON t.tgfoid = p.oid
WHERE t.tgname = 'on_auth_user_created';

-- Expected: Should show the trigger exists on auth.users table
