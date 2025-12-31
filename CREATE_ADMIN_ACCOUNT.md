# Create Admin Account - Complete Guide

## Overview
This guide provides two methods to create an admin account for testing the application.

---

## METHOD 1: Via Supabase Dashboard (Recommended for Beginners)

### Step 1: Create User in Authentication

1. **Navigate to Authentication**
   - Open your Supabase project dashboard
   - Click **Authentication** in the left sidebar
   - Click **Users** tab

2. **Add New User**
   - Click **Add User** (or **Invite** button)
   - Select **Create new user** option

3. **Fill in User Details**
   ```
   Email: admin@jrminfosystems.com
   Password: Admin@JRM2024!Secure
   ```
   - ✅ Check **Auto Confirm User** (skip email verification)
   - Click **Create User**

4. **Copy User ID**
   - After user is created, you'll see a list of users
   - Find `admin@jrminfosystems.com` in the list
   - **COPY THE USER ID** (UUID format: e.g., `550e8400-e29b-41d4-a716-446655440000`)
   - You'll need this for the next step

### Step 2: Update Role to Admin in Profiles Table

1. **Navigate to Table Editor**
   - Click **Table Editor** in the left sidebar
   - Select the **profiles** table

2. **Find or Create Admin Profile**

   **Option A: If profile already exists (auto-created by trigger)**
   - Look for a row with your admin user ID
   - Click on the row to edit
   - Change the `role` field from `candidate` to `admin`
   - Update `full_name` to `Admin User` or your preferred name
   - Click **Save**

   **Option B: If profile doesn't exist (create manually)**
   - Click **Insert** → **Insert row**
   - Fill in the fields:
     ```
     id: [paste the User ID you copied]
     role: admin
     full_name: Admin User
     email: admin@jrminfosystems.com
     ```
   - Click **Save**

### Step 3: Verify Admin Account

1. Go to **SQL Editor** in Supabase dashboard
2. Run this verification query:
   ```sql
   SELECT 
     u.id,
     u.email,
     u.email_confirmed_at,
     p.role,
     p.full_name,
     p.created_at
   FROM auth.users u
   LEFT JOIN profiles p ON u.id = p.id
   WHERE u.email = 'admin@jrminfosystems.com';
   ```

3. **Expected Result:**
   ```
   id: [UUID]
   email: admin@jrminfosystems.com
   email_confirmed_at: [timestamp]
   role: admin
   full_name: Admin User
   created_at: [timestamp]
   ```

✅ **Done!** You can now login with:
- Email: `admin@jrminfosystems.com`
- Password: `Admin@JRM2024!Secure`

---

## METHOD 2: Via SQL Script (Advanced - One Command)

### Complete SQL Script

Run this entire script in **Supabase SQL Editor**:

```sql
-- =====================================================
-- CREATE ADMIN ACCOUNT - COMPLETE SCRIPT
-- =====================================================

-- STEP 1: Create admin user in auth.users
-- Note: This uses the auth.users table directly
DO $$
DECLARE
  admin_user_id UUID;
BEGIN
  -- Generate a new UUID for the admin user
  admin_user_id := gen_random_uuid();
  
  -- Insert into auth.users (bypassing normal signup flow)
  INSERT INTO auth.users (
    id,
    instance_id,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    recovery_token,
    email_change_token_new,
    email_change
  ) VALUES (
    admin_user_id,
    '00000000-0000-0000-0000-000000000000', -- Default instance ID
    'admin@jrminfosystems.com',
    crypt('Admin@JRM2024!Secure', gen_salt('bf')), -- Hashed password
    NOW(), -- Auto-confirm email
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Admin User"}',
    NOW(),
    NOW(),
    '',
    '',
    '',
    ''
  )
  ON CONFLICT (email) DO NOTHING;
  
  -- STEP 2: Create or update profile with admin role
  INSERT INTO public.profiles (
    id,
    role,
    full_name,
    email,
    created_at,
    updated_at
  ) VALUES (
    admin_user_id,
    'admin',
    'Admin User',
    'admin@jrminfosystems.com',
    NOW(),
    NOW()
  )
  ON CONFLICT (id) 
  DO UPDATE SET
    role = 'admin',
    full_name = 'Admin User',
    email = 'admin@jrminfosystems.com',
    updated_at = NOW();
  
  -- Output success message
  RAISE NOTICE 'Admin account created successfully!';
  RAISE NOTICE 'Email: admin@jrminfosystems.com';
  RAISE NOTICE 'Password: Admin@JRM2024!Secure';
  RAISE NOTICE 'User ID: %', admin_user_id;
END $$;
```

### Verification Query

After running the script, verify with:

```sql
-- Verify admin account was created correctly
SELECT 
  u.id,
  u.email,
  u.email_confirmed_at,
  u.created_at as user_created_at,
  p.role,
  p.full_name,
  p.email as profile_email,
  p.created_at as profile_created_at,
  CASE 
    WHEN u.email_confirmed_at IS NOT NULL THEN '✅ Email Confirmed'
    ELSE '❌ Email Not Confirmed'
  END as email_status,
  CASE 
    WHEN p.role = 'admin' THEN '✅ Admin Role'
    ELSE '❌ Not Admin'
  END as role_status
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
WHERE u.email = 'admin@jrminfosystems.com';
```

**Expected Output:**
```
id                  | [UUID]
email               | admin@jrminfosystems.com
email_confirmed_at  | 2024-12-29 [timestamp]
user_created_at     | 2024-12-29 [timestamp]
role                | admin
full_name           | Admin User
profile_email       | admin@jrminfosystems.com
profile_created_at  | 2024-12-29 [timestamp]
email_status        | ✅ Email Confirmed
role_status         | ✅ Admin Role
```

---

## METHOD 3: Alternative SQL (Simpler, Using Supabase Auth Functions)

If the above SQL doesn't work due to permissions, use this simpler approach:

```sql
-- Step 1: Create a temporary function to create admin
CREATE OR REPLACE FUNCTION create_admin_account()
RETURNS void AS $$
DECLARE
  new_user_id uuid;
BEGIN
  -- Create user via auth schema (if you have access)
  -- Note: This assumes you can access auth.users
  
  -- Alternative: Just create the profile and add user manually via dashboard
  new_user_id := gen_random_uuid();
  
  -- Insert into profiles first
  INSERT INTO public.profiles (id, role, full_name, email)
  VALUES (
    new_user_id,
    'admin',
    'Admin User',
    'admin@jrminfosystems.com'
  );
  
  RAISE NOTICE 'Profile created with ID: %', new_user_id;
  RAISE NOTICE 'Now create user in Dashboard with this exact UUID';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 2: Execute the function
SELECT create_admin_account();

-- Step 3: Drop the function (cleanup)
DROP FUNCTION create_admin_account();
```

---

## Testing the Admin Account

### Test Login Flow

1. **Open your application**
   ```
   http://localhost:5173/admin/login
   ```

2. **Login Credentials**
   ```
   Email: admin@jrminfosystems.com
   Password: Admin@JRM2024!Secure
   ```

3. **Verify Access**
   - Should redirect to `/admin/dashboard`
   - Should see admin navigation
   - Should be able to view applications
   - Should be able to approve/reject applications

### Test Permissions

Run this query to verify admin has correct permissions:

```sql
-- Test RLS policies for admin
SET request.jwt.claims = json_build_object(
  'sub', (SELECT id FROM auth.users WHERE email = 'admin@jrminfosystems.com')::text,
  'role', 'admin'
);

-- Test: Can admin see all applications?
SELECT count(*) as total_applications 
FROM candidate_applications;

-- Test: Can admin see all profiles?
SELECT count(*) as total_profiles 
FROM profiles;
```

---

## Troubleshooting

### Issue 1: "Email already exists"

**Solution:**
```sql
-- Delete existing user
DELETE FROM auth.users WHERE email = 'admin@jrminfosystems.com';
DELETE FROM public.profiles WHERE email = 'admin@jrminfosystems.com';

-- Try again with the SQL script
```

### Issue 2: "Cannot access auth.users table"

**Solution:** Use METHOD 1 (Dashboard) instead. The auth schema might have restricted access.

### Issue 3: Profile not auto-created

**Cause:** The trigger might not have fired.

**Solution:**
```sql
-- Manually create profile for existing user
INSERT INTO public.profiles (id, role, full_name, email)
SELECT 
  id,
  'admin' as role,
  'Admin User' as full_name,
  email
FROM auth.users
WHERE email = 'admin@jrminfosystems.com'
ON CONFLICT (id) DO UPDATE
SET role = 'admin';
```

### Issue 4: Login works but redirects to candidate dashboard

**Cause:** Role is not set to 'admin' in profiles table.

**Solution:**
```sql
-- Update role to admin
UPDATE public.profiles
SET role = 'admin'
WHERE email = 'admin@jrminfosystems.com';
```

### Issue 5: "Invalid login credentials"

**Possible Causes:**
1. Email not confirmed
2. Password incorrect
3. User doesn't exist

**Solution:**
```sql
-- Check user status
SELECT 
  email,
  email_confirmed_at,
  CASE 
    WHEN email_confirmed_at IS NULL THEN 'Email not confirmed - PROBLEM!'
    ELSE 'Email confirmed - OK'
  END as status
FROM auth.users
WHERE email = 'admin@jrminfosystems.com';

-- Fix: Confirm email
UPDATE auth.users
SET email_confirmed_at = NOW()
WHERE email = 'admin@jrminfosystems.com';
```

---

## Creating Multiple Admin Accounts

If you need multiple admin accounts:

```sql
-- Function to create admin account with custom details
CREATE OR REPLACE FUNCTION create_admin_user(
  p_email TEXT,
  p_password TEXT,
  p_full_name TEXT
)
RETURNS void AS $$
DECLARE
  new_user_id UUID;
BEGIN
  new_user_id := gen_random_uuid();
  
  -- Insert user
  INSERT INTO auth.users (
    id, instance_id, email, encrypted_password,
    email_confirmed_at, raw_app_meta_data,
    raw_user_meta_data, created_at, updated_at,
    confirmation_token, recovery_token,
    email_change_token_new, email_change
  ) VALUES (
    new_user_id,
    '00000000-0000-0000-0000-000000000000',
    p_email,
    crypt(p_password, gen_salt('bf')),
    NOW(),
    '{"provider":"email","providers":["email"]}',
    json_build_object('full_name', p_full_name),
    NOW(), NOW(), '', '', '', ''
  );
  
  -- Insert profile
  INSERT INTO public.profiles (id, role, full_name, email)
  VALUES (new_user_id, 'admin', p_full_name, p_email);
  
  RAISE NOTICE 'Admin created: % (ID: %)', p_email, new_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Usage examples:
SELECT create_admin_user('admin1@jrminfosystems.com', 'SecurePass123!', 'Primary Admin');
SELECT create_admin_user('admin2@jrminfosystems.com', 'SecurePass456!', 'Secondary Admin');

-- Cleanup
DROP FUNCTION create_admin_user(TEXT, TEXT, TEXT);
```

---

## Security Best Practices

1. **Change Default Password Immediately**
   ```sql
   -- User should change password on first login
   -- Or set a temporary password and force change
   ```

2. **Use Strong Passwords**
   - Minimum 12 characters
   - Mix of uppercase, lowercase, numbers, symbols
   - Don't use common words

3. **Limit Admin Accounts**
   - Create only necessary admin accounts
   - Regularly audit admin access

4. **Enable MFA (Future Enhancement)**
   - Supabase supports MFA
   - Recommend enabling for production

---

## Quick Reference

### Login Credentials
```
Email: admin@jrminfosystems.com
Password: Admin@JRM2024!Secure
URL: http://localhost:5173/admin/login
```

### Verification Query
```sql
SELECT email, role FROM profiles 
WHERE email = 'admin@jrminfosystems.com';
```

### Reset Admin Password
```sql
UPDATE auth.users
SET encrypted_password = crypt('NewPassword123!', gen_salt('bf'))
WHERE email = 'admin@jrminfosystems.com';
```

---

**✅ Admin account creation complete!**

You can now:
- Login to admin portal
- View all applications
- Approve/reject applications
- Manage candidates
- View reports and analytics
