-- ============================================================================
-- FIX: Add missing columns to candidate_applications table
-- ============================================================================

-- Check current columns
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'candidate_applications'
ORDER BY ordinal_position;

-- If the table is missing columns, we need to recreate it or add them
-- First, let's add the missing columns one by one

-- Add post_applied_for if it doesn't exist
ALTER TABLE public.candidate_applications 
ADD COLUMN IF NOT EXISTS post_applied_for TEXT NOT NULL DEFAULT '';

-- Add other potentially missing columns
ALTER TABLE public.candidate_applications 
ADD COLUMN IF NOT EXISTS name TEXT NOT NULL DEFAULT '';

ALTER TABLE public.candidate_applications 
ADD COLUMN IF NOT EXISTS father_or_husband_name TEXT NOT NULL DEFAULT '';

ALTER TABLE public.candidate_applications 
ADD COLUMN IF NOT EXISTS photo_url TEXT;

ALTER TABLE public.candidate_applications 
ADD COLUMN IF NOT EXISTS permanent_address TEXT NOT NULL DEFAULT '';

ALTER TABLE public.candidate_applications 
ADD COLUMN IF NOT EXISTS communication_address TEXT NOT NULL DEFAULT '';

ALTER TABLE public.candidate_applications 
ADD COLUMN IF NOT EXISTS date_of_birth DATE;

ALTER TABLE public.candidate_applications 
ADD COLUMN IF NOT EXISTS sex TEXT CHECK (sex IN ('Male', 'Female', 'Other'));

ALTER TABLE public.candidate_applications 
ADD COLUMN IF NOT EXISTS nationality TEXT NOT NULL DEFAULT 'Indian';

ALTER TABLE public.candidate_applications 
ADD COLUMN IF NOT EXISTS marital_status TEXT CHECK (marital_status IN ('Single', 'Married', 'Divorced', 'Widowed'));

ALTER TABLE public.candidate_applications 
ADD COLUMN IF NOT EXISTS religion TEXT;

ALTER TABLE public.candidate_applications 
ADD COLUMN IF NOT EXISTS mobile_no TEXT;

ALTER TABLE public.candidate_applications 
ADD COLUMN IF NOT EXISTS email TEXT;

ALTER TABLE public.candidate_applications 
ADD COLUMN IF NOT EXISTS bank_name TEXT NOT NULL DEFAULT '';

ALTER TABLE public.candidate_applications 
ADD COLUMN IF NOT EXISTS account_no TEXT NOT NULL DEFAULT '';

ALTER TABLE public.candidate_applications 
ADD COLUMN IF NOT EXISTS ifsc_code TEXT;

ALTER TABLE public.candidate_applications 
ADD COLUMN IF NOT EXISTS branch TEXT NOT NULL DEFAULT '';

ALTER TABLE public.candidate_applications 
ADD COLUMN IF NOT EXISTS pan_no TEXT;

ALTER TABLE public.candidate_applications 
ADD COLUMN IF NOT EXISTS aadhar_no TEXT;

ALTER TABLE public.candidate_applications 
ADD COLUMN IF NOT EXISTS education JSONB DEFAULT '[]'::JSONB;

ALTER TABLE public.candidate_applications 
ADD COLUMN IF NOT EXISTS declaration_place TEXT;

ALTER TABLE public.candidate_applications 
ADD COLUMN IF NOT EXISTS declaration_date DATE;

ALTER TABLE public.candidate_applications 
ADD COLUMN IF NOT EXISTS declaration_accepted BOOLEAN DEFAULT false;

ALTER TABLE public.candidate_applications 
ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'draft' 
  CHECK (status IN ('draft', 'submitted', 'under_review', 'approved', 'rejected', 'documents_pending', 'completed'));

ALTER TABLE public.candidate_applications 
ADD COLUMN IF NOT EXISTS reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE public.candidate_applications 
ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMP WITH TIME ZONE;

ALTER TABLE public.candidate_applications 
ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

ALTER TABLE public.candidate_applications 
ADD COLUMN IF NOT EXISTS admin_notes TEXT;

ALTER TABLE public.candidate_applications 
ADD COLUMN IF NOT EXISTS submitted_at TIMESTAMP WITH TIME ZONE;

-- Verify all columns exist now
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'candidate_applications'
ORDER BY ordinal_position;
