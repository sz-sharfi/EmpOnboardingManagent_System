-- ============================================================================
-- DATABASE REVIEW QUERIES
-- Run these in Supabase SQL Editor to review current database structure
-- ============================================================================

-- QUERY 1: List all existing tables in public schema
-- ============================================================================
SELECT 
  table_schema,
  table_name,
  table_type
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;


-- QUERY 2: Show detailed structure of each table
-- ============================================================================

-- Profiles table structure
SELECT 
  column_name,
  data_type,
  character_maximum_length,
  column_default,
  is_nullable,
  udt_name
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'profiles'
ORDER BY ordinal_position;

-- Applications table structure
SELECT 
  column_name,
  data_type,
  character_maximum_length,
  column_default,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'applications'
ORDER BY ordinal_position;

-- Documents table structure
SELECT 
  column_name,
  data_type,
  character_maximum_length,
  column_default,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'documents'
ORDER BY ordinal_position;


-- QUERY 3: Check Row Level Security (RLS) status
-- ============================================================================
SELECT 
  schemaname,
  tablename,
  rowsecurity AS rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;


-- QUERY 4: List all RLS policies
-- ============================================================================
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;


-- QUERY 5: Show foreign key relationships
-- ============================================================================
SELECT
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name,
  tc.constraint_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND tc.table_schema = 'public'
ORDER BY tc.table_name;


-- QUERY 6: List all indexes for performance
-- ============================================================================
SELECT
  schemaname,
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;


-- QUERY 7: Show all custom functions
-- ============================================================================
SELECT 
  n.nspname as schema,
  p.proname as function_name,
  pg_get_function_result(p.oid) as return_type,
  pg_get_function_arguments(p.oid) as arguments
FROM pg_proc p
LEFT JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
ORDER BY function_name;


-- QUERY 8: Show all triggers
-- ============================================================================
SELECT 
  trigger_schema,
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement,
  action_timing
FROM information_schema.triggers
WHERE trigger_schema = 'public'
ORDER BY event_object_table, trigger_name;


-- QUERY 9: Check storage buckets
-- ============================================================================
SELECT 
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types,
  created_at
FROM storage.buckets
ORDER BY name;


-- QUERY 10: Show storage bucket policies
-- ============================================================================
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE schemaname = 'storage' AND tablename = 'objects'
ORDER BY policyname;


-- QUERY 11: Count records in each table
-- ============================================================================
SELECT 
  'profiles' as table_name,
  COUNT(*) as record_count
FROM public.profiles
UNION ALL
SELECT 
  'applications',
  COUNT(*)
FROM public.applications
UNION ALL
SELECT 
  'documents',
  COUNT(*)
FROM public.documents
UNION ALL
SELECT 
  'messages',
  COUNT(*)
FROM public.messages
UNION ALL
SELECT 
  'audit_logs',
  COUNT(*)
FROM public.audit_logs;


-- QUERY 12: Check if required columns exist in applications table
-- ============================================================================
SELECT 
  column_name,
  CASE 
    WHEN column_name IN (
      'post_applied_for', 'name', 'father_or_husband_name', 
      'permanent_address', 'communication_address',
      'date_of_birth', 'sex', 'nationality', 'marital_status',
      'mobile_no', 'email', 'bank_name', 'account_no',
      'ifsc_code', 'pan_no', 'aadhar_no', 'education'
    ) THEN 'REQUIRED'
    ELSE 'EXTRA'
  END as column_status
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'applications'
ORDER BY column_status, column_name;
