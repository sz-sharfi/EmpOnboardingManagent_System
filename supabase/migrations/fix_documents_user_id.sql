-- ============================================================================
-- FIX: Add missing user_id column to documents table
-- ============================================================================

-- Check current columns in documents table
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'documents'
ORDER BY ordinal_position;

-- Add the missing user_id column
ALTER TABLE public.documents 
ADD COLUMN IF NOT EXISTS user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE;

-- Verify the column was added
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'documents'
ORDER BY ordinal_position;
