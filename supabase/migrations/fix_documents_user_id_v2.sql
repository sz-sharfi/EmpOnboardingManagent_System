-- ============================================================================
-- FIX: Add user_id column to documents table (handles existing data)
-- ============================================================================

-- Step 1: Add user_id as NULLABLE first
ALTER TABLE public.documents 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Step 2: Delete any existing documents that don't have an application_id
-- (these are orphaned and can't be linked to a user)
DELETE FROM public.documents WHERE application_id IS NULL;

-- Step 3: Update existing documents to set user_id from their application
UPDATE public.documents d
SET user_id = a.user_id
FROM public.candidate_applications a
WHERE d.application_id = a.id
  AND d.user_id IS NULL;

-- Step 4: Delete any remaining documents that still don't have a user_id
-- (these are orphaned and can't be fixed)
DELETE FROM public.documents WHERE user_id IS NULL;

-- Step 5: Now make user_id NOT NULL
ALTER TABLE public.documents 
ALTER COLUMN user_id SET NOT NULL;

-- Verify
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'documents'
  AND column_name = 'user_id';
