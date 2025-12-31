-- Quick diagnostic for your specific user
-- ============================================================================

-- Check 1: Does user exist?
SELECT 
  '1️⃣ USER EXISTS' as step,
  email,
  email_confirmed_at IS NOT NULL as email_confirmed
FROM auth.users
WHERE email = 'sz.sharfi8541@gmail.com';

-- Check 2: Does profile exist?
SELECT 
  '2️⃣ PROFILE EXISTS' as step,
  p.email,
  p.full_name,
  p.role
FROM public.profiles p
WHERE p.email = 'sz.sharfi8541@gmail.com';

-- If Check 2 returns 0 rows, run this to create the profile:
-- INSERT INTO public.profiles (id, email, full_name, role)
-- SELECT id, email, COALESCE(raw_user_meta_data->>'full_name', ''), 'candidate'
-- FROM auth.users WHERE email = 'sz.sharfi8541@gmail.com'
-- ON CONFLICT (id) DO NOTHING;
