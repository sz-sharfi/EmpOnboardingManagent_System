-- Set Admin Role for User
-- Run this script to set a user as admin
-- Replace 'admin@example.com' with your actual admin email

-- Check current admin users
SELECT user_id, email, role, full_name 
FROM public.profiles 
WHERE role = 'admin';

-- To set a user as admin, replace the email below with your admin email:
-- UPDATE public.profiles 
-- SET role = 'admin' 
-- WHERE email = 'admin@example.com';

-- Or if you know the user_id:
-- UPDATE public.profiles 
-- SET role = 'admin' 
-- WHERE user_id = 'your-user-id-here';

-- Verify the change
-- SELECT user_id, email, role, full_name 
-- FROM public.profiles 
-- WHERE email = 'admin@example.com';

-- Test admin check function
-- SELECT * FROM check_admin_status();
