-- ============================================================================
-- FIX: Rename 'applications' table to 'candidate_applications'
-- This matches the code expectation
-- ============================================================================

-- Rename the table
ALTER TABLE IF EXISTS public.applications 
RENAME TO candidate_applications;

-- Verify the rename
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name = 'candidate_applications';

-- Expected: Should return 'candidate_applications'
