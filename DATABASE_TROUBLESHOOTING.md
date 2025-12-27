# Database Insertion Troubleshooting Guide

## Changes Made

I've completely rewritten the database interaction code to use **direct Supabase table operations** instead of RPC functions. This provides better error handling and clearer debugging.

### What Was Changed:

1. **ApplicationFormPage.tsx**
   - Removed all RPC function calls (`save_application_draft`, `submit_application`)
   - Implemented direct `.insert()` and `.update()` operations on the `applications` table
   - Added comprehensive error handling and console logging
   - Added authentication check on component mount
   - Better state management for application ID

2. **supabaseClient.ts**
   - Added detailed logging for missing environment variables
   - Added authentication state change logging
   - Enhanced client configuration

3. **New Files Created**
   - `supabaseDebug.ts` - Debugging utilities to test your setup
   - `SUPABASE_SETUP.md` - Complete setup guide
   - `.env.example` - Environment variable template

## How to Fix Your Issue

### Step 1: Check Environment Variables

1. Create a `.env` file in your project root (if not exists):
   ```env
   VITE_SUPABASE_URL=https://your-project-id.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key-here
   ```

2. Get your credentials from: https://supabase.com/dashboard
   - Go to your project > Settings > API
   - Copy "Project URL" and "anon/public" key

3. **IMPORTANT**: Restart your development server after creating/modifying `.env`

### Step 2: Run Database Migration

1. Go to your Supabase dashboard
2. Navigate to SQL Editor
3. Copy and paste the contents of `supabase/migrations/001_init.sql`
4. Run the script
5. Verify all tables were created in Table Editor

### Step 3: Test Authentication

1. Sign up or log in to your application
2. Open browser Developer Tools (F12)
3. Check Console for authentication messages
4. You should see: `✓ User authenticated: your@email.com`

### Step 4: Test Database Connection

Run these in your browser console:

```javascript
// Test complete setup
testSupabase()

// List your applications
listApps()

// Check specific application
checkApp('your-app-id')
```

These functions are automatically available in the console (defined in `supabaseDebug.ts`).

### Step 5: Try Saving a Draft

1. Fill in some form fields
2. Click "Save Draft"
3. Check the console for detailed logs:
   - User ID
   - Form data being saved
   - Success/error messages
   - Application ID

## Common Issues & Solutions

### Issue: "Missing Supabase URL or Anon Key"

**Solution:**
- Create `.env` file in project root
- Add correct credentials
- Restart dev server with `npm run dev`

### Issue: "relation 'applications' does not exist"

**Solution:**
- Run the migration script in Supabase SQL Editor
- Verify tables exist in Table Editor

### Issue: "row-level security policy violation"

**Solution:**
1. Make sure you're logged in
2. Check that the migration script ran completely
3. Verify RLS policies in Supabase dashboard > Authentication > Policies

### Issue: "Please sign in to save your application"

**Solution:**
- Navigate to `/candidate/login`
- Sign up or log in
- Return to application form

### Issue: Data saves but doesn't persist

**Solution:**
1. Check Supabase Table Editor > `applications` table
2. Look for your user_id in the records
3. Check if `form_data` column has your data
4. Verify the application status is 'draft' or 'submitted'

### Issue: Submit button doesn't work

**Solution:**
1. Complete all required fields (marked with *)
2. Check the declaration checkbox on Step 3
3. Watch console for specific error messages

## Debugging Tips

### Enable Detailed Logging

The code now includes extensive console logging. Watch for:

- `✓` (green check) - Success messages
- `⚠` (warning) - Non-critical issues
- `✗` (red X) - Errors
- `🔍` - Debug information

### Check Network Tab

1. Open DevTools > Network tab
2. Filter by "supabase"
3. Look for failed requests (red)
4. Click on failed requests to see error details

### Verify Data Structure

The form data structure sent to database:

```json
{
  "postAppliedFor": "string",
  "fullName": "string",
  "fatherOrHusbandName": "string",
  "photo": "filename.jpg",
  "permanentAddress": "string",
  "communicationAddress": "string",
  "sameAsPermAddress": boolean,
  "dateOfBirth": "YYYY-MM-DD",
  "sex": "Male|Female|Other",
  "nationality": "string",
  "maritalStatus": "Single|Married",
  "religion": "string",
  "mobileNo": "string",
  "email": "string",
  "bankName": "string",
  "accountNo": "string",
  "ifscCode": "string",
  "branch": "string",
  "panNo": "string",
  "aadharNo": "string",
  "education": [
    {
      "level": "string",
      "yearOfPassing": "string",
      "percentage": "string"
    }
  ],
  "declaration": boolean,
  "place": "string",
  "date": "YYYY-MM-DD"
}
```

## Testing Checklist

- [ ] `.env` file exists with correct credentials
- [ ] Development server restarted after `.env` creation
- [ ] Migration script ran successfully in Supabase
- [ ] User can sign up/login
- [ ] Console shows "User authenticated" message
- [ ] `testSupabase()` passes all tests
- [ ] Save Draft creates a record in `applications` table
- [ ] Submit changes status to 'submitted'
- [ ] Data visible in Supabase Table Editor

## Quick SQL Verification

Run these in Supabase SQL Editor:

```sql
-- Check if user profile exists
SELECT * FROM public.profiles 
WHERE email = 'your@email.com';

-- Check applications
SELECT id, status, created_at, submitted_at 
FROM public.applications 
ORDER BY created_at DESC;

-- Check form data
SELECT id, status, form_data->>'fullName' as name, 
       form_data->>'email' as email
FROM public.applications 
ORDER BY created_at DESC;
```

## Still Having Issues?

If you're still experiencing problems:

1. **Check Browser Console** - Look for specific error messages
2. **Check Supabase Logs** - Dashboard > Logs > API Logs
3. **Verify RLS Policies** - Make sure policies allow insert/update
4. **Test with Admin Disable RLS** - Temporarily to isolate the issue
5. **Check User Session** - Run `supabase.auth.getSession()` in console

## Need More Help?

Share these details:

1. Complete error message from console
2. Network tab request/response details
3. Your Supabase table structure
4. Whether migration script ran successfully
5. Results from `testSupabase()` function
