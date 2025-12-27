# Supabase Setup Guide

## Prerequisites
1. Create a Supabase account at https://supabase.com
2. Create a new project in your Supabase dashboard

## Configuration Steps

### 1. Get Your Supabase Credentials
- Go to your Supabase project dashboard
- Navigate to Settings > API
- Copy your Project URL and anon/public key

### 2. Create `.env` File
Create a `.env` file in the root directory with:

```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

### 3. Run Database Migration
- In your Supabase dashboard, go to SQL Editor
- Copy the contents of `supabase/migrations/001_init.sql`
- Paste and run the SQL script

### 4. Enable Email Authentication
- Go to Authentication > Settings
- Enable Email provider
- Configure email templates if needed
- For testing, you can disable email confirmation

### 5. Test Database Connection
Run the application and check the browser console for any connection errors.

## Common Issues

### "Missing Supabase URL or Anon Key"
- Make sure your `.env` file exists in the root directory
- Restart your development server after creating/modifying `.env`

### "relation 'applications' does not exist"
- Run the migration script in Supabase SQL Editor
- Check that all tables were created successfully

### "row-level security policy violation"
- Make sure you're logged in as a user
- Check that the RLS policies are correctly set up

### Data not inserting
- Check browser console for detailed error messages
- Verify your user is authenticated: `await supabase.auth.getUser()`
- Ensure the user has a profile in the `profiles` table

## Testing the Setup

1. Start the dev server: `npm run dev`
2. Go to the login page
3. Sign up with a test email
4. Try to save a draft application
5. Check the browser console for any errors
6. Verify data in Supabase dashboard > Table Editor

## Verification Queries

Run these in Supabase SQL Editor to verify your setup:

```sql
-- Check if tables exist
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public';

-- Check profiles
SELECT * FROM public.profiles;

-- Check applications
SELECT * FROM public.applications;

-- Check RLS policies
SELECT schemaname, tablename, policyname 
FROM pg_policies 
WHERE schemaname = 'public';
```
