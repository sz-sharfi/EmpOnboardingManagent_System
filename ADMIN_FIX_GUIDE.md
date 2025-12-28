# Fix for Approval/Rejection Failure

## Problem
The approve/reject functions are failing because the admin user doesn't have the correct role set in the database.

## Root Cause
The `approve_application` and `reject_application` RPC functions check if the current user has `role = 'admin'` in the profiles table. If the role is not set correctly, the functions will fail.

## Solution

### Step 1: Run the Enhanced Migration
The migration file `005_fix_admin_functions.sql` has been created with better error handling. Run it in your Supabase SQL Editor:

```bash
# Navigate to Supabase dashboard -> SQL Editor
# Copy and paste the contents of: supabase/migrations/005_fix_admin_functions.sql
# Execute the query
```

### Step 2: Set Admin Role for Your User

Run this SQL in your Supabase SQL Editor (replace with your actual admin email):

```sql
-- Check which email you're logged in with
SELECT auth.uid(), email FROM auth.users WHERE id = auth.uid();

-- Set the role to admin (replace with your email)
UPDATE public.profiles 
SET role = 'admin' 
WHERE email = 'your-admin-email@example.com';

-- Verify the change
SELECT user_id, email, role, full_name 
FROM public.profiles 
WHERE email = 'your-admin-email@example.com';
```

### Step 3: Test Admin Status
You can now test if you have admin privileges:

```sql
SELECT * FROM check_admin_status();
```

This should return:
- your user_id
- your email
- role = 'admin'
- is_admin = true

### Step 4: Try Approving/Rejecting Again
After setting the admin role:
1. Refresh your browser (or log out and log back in)
2. Try approving or rejecting an application
3. If it still fails, check the browser console for the specific error message

## Alternative: Quick Fix Using Supabase Dashboard

1. Go to Supabase Dashboard
2. Navigate to: **Table Editor** -> **profiles**
3. Find your user row (by email)
4. Click to edit the **role** column
5. Change the value to: `admin`
6. Save the change
7. Log out and log back in to the admin portal

## Debugging

If you're still having issues, check:

1. **Browser Console**: Open Developer Tools (F12) and check the Console tab for detailed error messages
2. **Supabase Logs**: Go to Supabase Dashboard -> Logs -> API to see server-side errors
3. **Run this SQL** to verify admin status:
   ```sql
   SELECT 
     p.user_id,
     p.email,
     p.role,
     is_admin() as has_admin_access
   FROM public.profiles p
   WHERE p.user_id = auth.uid();
   ```

## Error Messages You Might See

- **"Only admins can approve applications"** → Your role is not set to 'admin'
- **"Authentication required"** → You're not logged in
- **"Application not found"** → The application ID doesn't exist
- **"Access denied"** → RLS policies are blocking access

## Files Modified

1. `supabase/migrations/005_fix_admin_functions.sql` - Enhanced RPC functions
2. `src/pages/admin/ApplicationDetailPage.tsx` - Better error handling
3. `supabase/set_admin_role.sql` - Helper script to set admin role
