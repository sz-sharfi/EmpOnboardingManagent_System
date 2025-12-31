-- ============================================================================
-- FIX: Add missing application_id column to documents table
-- ============================================================================

-- Check current structure
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'documents'
ORDER BY ordinal_position;

-- Add application_id column
ALTER TABLE public.documents 
ADD COLUMN IF NOT EXISTS application_id UUID REFERENCES public.candidate_applications(id) ON DELETE CASCADE;

-- Update existing documents to link to their application via user_id
UPDATE public.documents d
SET application_id = (
  SELECT a.id 
  FROM public.candidate_applications a 
  WHERE a.user_id = d.user_id 
  LIMIT 1
)
WHERE application_id IS NULL;

-- Verify the column was added
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'documents'
ORDER BY ordinal_position;
