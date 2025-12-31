-- Fix Admin Role for Current User
-- Run this in Supabase SQL Editor to make your current user an admin

-- OPTION 1: Set admin role by email (RECOMMENDED)
-- Replace 'your-email@example.com' with your actual login email
UPDATE public.profiles 
SET role = 'admin' 
WHERE email = 'your-email@example.com';

-- OPTION 2: Set admin role for the most recent user (if you just created your account)
-- Uncomment the line below if you want to use this approach instead
-- UPDATE public.profiles SET role = 'admin' WHERE user_id = (SELECT id FROM auth.users ORDER BY created_at DESC LIMIT 1);

-- OPTION 3: View all users and their roles first
SELECT 
  user_id,
  email,
  role,
  full_name,
  created_at
FROM public.profiles
ORDER BY created_at DESC;

-- After updating, verify the change:
SELECT email, role FROM public.profiles WHERE role = 'admin';
