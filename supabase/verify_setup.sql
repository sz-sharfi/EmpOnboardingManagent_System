-- Verification Script for Onboarding Application Database
-- Run this in Supabase SQL Editor after running 001_init.sql

-- ============================================================================
-- 1. VERIFY TABLES EXIST
-- ============================================================================
SELECT 
  'Tables Check' as check_type,
  COUNT(*) as count,
  CASE 
    WHEN COUNT(*) >= 5 THEN '✓ PASS - All tables exist'
    ELSE '✗ FAIL - Missing tables'
  END as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('profiles', 'applications', 'documents', 'messages', 'audit_logs');

-- List all public tables
SELECT table_name, 
       pg_size_pretty(pg_total_relation_size(quote_ident(table_name)::regclass)) as size
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- ============================================================================
-- 2. VERIFY RLS IS ENABLED
-- ============================================================================
SELECT 
  tablename,
  rowsecurity as rls_enabled,
  CASE 
    WHEN rowsecurity THEN '✓ Enabled'
    ELSE '✗ Disabled'
  END as status
FROM pg_tables 
WHERE schemaname = 'public'
  AND tablename IN ('profiles', 'applications', 'documents', 'messages', 'audit_logs')
ORDER BY tablename;

-- ============================================================================
-- 3. VERIFY POLICIES EXIST
-- ============================================================================
SELECT 
  'Policies Check' as check_type,
  COUNT(*) as policy_count,
  CASE 
    WHEN COUNT(*) >= 8 THEN '✓ PASS - Policies configured'
    ELSE '⚠ WARNING - Some policies may be missing'
  END as status
FROM pg_policies 
WHERE schemaname = 'public';

-- List all policies
SELECT 
  tablename,
  policyname,
  cmd as operation,
  CASE 
    WHEN qual IS NOT NULL THEN '✓ Has USING'
    ELSE ''
  END as has_using,
  CASE 
    WHEN with_check IS NOT NULL THEN '✓ Has CHECK'
    ELSE ''
  END as has_check
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- ============================================================================
-- 4. VERIFY FUNCTIONS EXIST
-- ============================================================================
SELECT 
  'Functions Check' as check_type,
  COUNT(*) as function_count,
  CASE 
    WHEN COUNT(*) >= 5 THEN '✓ PASS - All functions exist'
    ELSE '⚠ WARNING - Some functions may be missing'
  END as status
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND p.proname IN ('is_admin', 'compute_progress', 'save_application_draft', 
                    'submit_application', 'post_message');

-- List all functions
SELECT 
  p.proname as function_name,
  pg_get_function_arguments(p.oid) as arguments,
  pg_get_function_result(p.oid) as return_type
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
ORDER BY p.proname;

-- ============================================================================
-- 5. VERIFY TRIGGERS EXIST
-- ============================================================================
SELECT 
  'Triggers Check' as check_type,
  COUNT(*) as trigger_count,
  CASE 
    WHEN COUNT(*) >= 3 THEN '✓ PASS - All triggers configured'
    ELSE '⚠ WARNING - Some triggers may be missing'
  END as status
FROM pg_trigger
WHERE tgrelid IN (
  SELECT oid FROM pg_class 
  WHERE relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
);

-- List all triggers
SELECT 
  c.relname as table_name,
  t.tgname as trigger_name,
  CASE t.tgtype & 1
    WHEN 1 THEN 'ROW'
    ELSE 'STATEMENT'
  END as level,
  CASE t.tgtype & 66
    WHEN 2 THEN 'BEFORE'
    WHEN 64 THEN 'INSTEAD OF'
    ELSE 'AFTER'
  END as timing,
  CASE t.tgtype & 28
    WHEN 4 THEN 'INSERT'
    WHEN 8 THEN 'DELETE'
    WHEN 16 THEN 'UPDATE'
    WHEN 12 THEN 'INSERT or DELETE'
    WHEN 20 THEN 'INSERT or UPDATE'
    WHEN 24 THEN 'DELETE or UPDATE'
    WHEN 28 THEN 'INSERT or DELETE or UPDATE'
  END as events
FROM pg_trigger t
JOIN pg_class c ON t.tgrelid = c.oid
WHERE c.relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
  AND NOT t.tgisinternal
ORDER BY c.relname, t.tgname;

-- ============================================================================
-- 6. VERIFY INDEXES
-- ============================================================================
SELECT 
  'Indexes Check' as check_type,
  COUNT(*) as index_count,
  CASE 
    WHEN COUNT(*) >= 5 THEN '✓ PASS - Indexes created'
    ELSE '⚠ WARNING - Some indexes may be missing'
  END as status
FROM pg_indexes 
WHERE schemaname = 'public'
  AND indexname LIKE 'idx_%';

-- List all indexes
SELECT 
  tablename,
  indexname,
  indexdef
FROM pg_indexes 
WHERE schemaname = 'public'
  AND indexname NOT LIKE 'pg_%'
ORDER BY tablename, indexname;

-- ============================================================================
-- 7. TEST DATA OPERATIONS (Run only if you want to test)
-- ============================================================================
-- This section is commented out by default
-- Uncomment to test insert/update operations

/*
-- Test: Check if current user can insert into profiles
-- INSERT INTO public.profiles (user_id, email, role, full_name)
-- VALUES (auth.uid(), 'test@example.com', 'candidate', 'Test User')
-- ON CONFLICT (user_id) DO UPDATE SET email = EXCLUDED.email
-- RETURNING *;

-- Test: Check if user can create an application
-- INSERT INTO public.applications (user_id, status, form_data)
-- VALUES (auth.uid(), 'draft', '{"test": "data"}'::jsonb)
-- RETURNING *;
*/

-- ============================================================================
-- 8. SUMMARY
-- ============================================================================
SELECT '
==============================================
DATABASE SETUP VERIFICATION COMPLETE
==============================================

Review the results above:

✓ PASS     - Everything is working correctly
⚠ WARNING  - Check if this is expected
✗ FAIL     - Action required

Next steps:
1. If all checks pass, your database is ready!
2. If any checks fail, review the migration script
3. Ensure all SQL statements executed without errors
4. Check Supabase Dashboard > Table Editor for tables
5. Test authentication and RLS policies

==============================================
' as summary;
