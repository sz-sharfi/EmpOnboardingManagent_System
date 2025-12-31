-- Complete Login Diagnosis
-- ============================================================================

SELECT 
  u.email,
  u.email_confirmed_at,
  CASE 
    WHEN u.email_confirmed_at IS NULL THEN '❌ EMAIL NOT CONFIRMED - This is likely the issue!'
    ELSE '✅ Email confirmed'
  END as email_status,
  p.full_name,
  p.role,
  CASE 
    WHEN p.id IS NULL THEN '❌ No profile'
    ELSE '✅ Profile exists'
  END as profile_status,
  u.created_at as account_created,
  u.last_sign_in_at as last_login
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
WHERE u.email = 'sz.sharfi8541@gmail.com';

-- ============================================================================
-- If email_status shows "❌ EMAIL NOT CONFIRMED", run this to confirm it:
-- ============================================================================

-- UPDATE auth.users 
-- SET email_confirmed_at = NOW()
-- WHERE email = 'sz.sharfi8541@gmail.com';
