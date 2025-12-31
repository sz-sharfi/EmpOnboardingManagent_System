# 🚨 URGENT: Fix Admin Login Error

## Problem
**Error**: "Failed to fetch user profile"  
**Cause**: Circular RLS (Row Level Security) dependency on the `profiles` table

## Solution Steps

### 1. Open Supabase SQL Editor
1. Go to https://flrpwxsibbocwiawllyu.supabase.co
2. Click on **SQL Editor** in the left sidebar
3. Click **New Query**

### 2. Run the Fix
1. Open the file: `FIX_ADMIN_LOGIN.sql`
2. Copy ALL the SQL code
3. Paste it into the Supabase SQL Editor
4. Click **Run** (or press Ctrl+Enter)

### 3. Verify
You should see a success message and a table showing 2 policies:
- `admins_read_all_profiles`
- `users_read_own_profile`

### 4. Test Login
1. Refresh your browser
2. Try logging in as admin again
3. You should now be able to login successfully ✅

## What This Fix Does

**Before (Broken):**
- Admin policy tried to check `profiles.role = 'admin'` 
- But RLS blocked reading from `profiles` to check if user is admin
- **Infinite loop** = Login fails

**After (Fixed):**
- Created `is_admin()` function with `SECURITY DEFINER`
- This function bypasses RLS to safely check admin role
- No more circular dependency = Login works ✅

## If You Still Have Issues

1. Check that your admin user has `role = 'admin'` in the profiles table
2. Run this query in SQL Editor to verify:
   ```sql
   SELECT id, email, role FROM profiles WHERE role = 'admin';
   ```
3. If no admin exists, create one:
   ```sql
   -- Replace with your actual user ID and email
   UPDATE profiles 
   SET role = 'admin' 
   WHERE email = 'admin@example.com';
   ```
