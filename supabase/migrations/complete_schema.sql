-- ============================================================================
-- COMPLETE DATABASE SCHEMA FOR EMPLOYEE ONBOARDING SYSTEM
-- JRM Infosystems - Candidate Application Management
-- 
-- Run this complete script in Supabase SQL Editor
-- This will setup all tables, policies, functions, triggers, and indexes
-- ============================================================================

-- ============================================================================
-- STEP 1: CLEANUP - Drop existing objects
-- ============================================================================

-- Drop triggers
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users CASCADE;
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles CASCADE;
DROP TRIGGER IF EXISTS update_applications_updated_at ON public.candidate_applications CASCADE;
DROP TRIGGER IF EXISTS update_documents_updated_at ON public.documents CASCADE;

-- Drop functions
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.update_updated_at_column() CASCADE;
DROP FUNCTION IF EXISTS public.is_admin() CASCADE;

-- Drop tables (in correct order due to foreign keys)
DROP TABLE IF EXISTS public.admin_actions_log CASCADE;
DROP TABLE IF EXISTS public.documents CASCADE;
DROP TABLE IF EXISTS public.candidate_applications CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;


-- ============================================================================
-- STEP 2: CREATE EXTENSION (if needed)
-- ============================================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";


-- ============================================================================
-- STEP 3: HELPER FUNCTIONS
-- ============================================================================

-- Function to check if current user is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;


-- ============================================================================
-- STEP 4: CREATE TABLES
-- ============================================================================

-- Table: profiles
-- Stores user profile information for both candidates and admins
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  role TEXT NOT NULL DEFAULT 'candidate' CHECK (role IN ('candidate', 'admin')),
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE public.profiles IS 'User profiles for candidates and administrators';
COMMENT ON COLUMN public.profiles.role IS 'User role: candidate or admin';


-- Table: candidate_applications
-- Stores complete application form data as per JRM Infosystems format
CREATE TABLE public.candidate_applications (
  -- Primary identification
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Personal Information
  post_applied_for TEXT NOT NULL,
  name TEXT NOT NULL,
  father_or_husband_name TEXT NOT NULL,
  photo_url TEXT,
  
  -- Address Information
  permanent_address TEXT NOT NULL,
  communication_address TEXT NOT NULL,
  
  -- Personal Details
  date_of_birth DATE NOT NULL,
  sex TEXT NOT NULL CHECK (sex IN ('Male', 'Female', 'Other')),
  nationality TEXT NOT NULL DEFAULT 'Indian',
  marital_status TEXT NOT NULL CHECK (marital_status IN ('Single', 'Married', 'Divorced', 'Widowed')),
  religion TEXT,
  
  -- Contact Information
  mobile_no TEXT NOT NULL,
  email TEXT NOT NULL,
  
  -- Bank Details
  bank_name TEXT NOT NULL,
  account_no TEXT NOT NULL,
  ifsc_code TEXT NOT NULL,
  branch TEXT NOT NULL,
  
  -- Government IDs
  pan_no TEXT NOT NULL,
  aadhar_no TEXT NOT NULL,
  
  -- Education (stored as JSONB array)
  -- Format: [{"level": "10th", "year": "2010", "percentage": "85", "board": "CBSE"}, ...]
  education JSONB DEFAULT '[]'::JSONB,
  
  -- Declaration
  declaration_place TEXT,
  declaration_date DATE,
  declaration_accepted BOOLEAN DEFAULT false,
  
  -- Application Status & Workflow
  status TEXT NOT NULL DEFAULT 'draft' 
    CHECK (status IN ('draft', 'submitted', 'under_review', 'approved', 'rejected', 'documents_pending', 'completed')),
  
  -- Admin Review Fields
  reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  rejection_reason TEXT,
  admin_notes TEXT,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  submitted_at TIMESTAMP WITH TIME ZONE,
  
  -- Constraints
  CONSTRAINT valid_email CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}$'),
  CONSTRAINT valid_mobile CHECK (mobile_no ~ '^\d{10}$'),
  CONSTRAINT valid_pan CHECK (pan_no ~ '^[A-Z]{5}[0-9]{4}[A-Z]{1}$'),
  CONSTRAINT valid_aadhar CHECK (aadhar_no ~ '^\d{12}$'),
  CONSTRAINT valid_ifsc CHECK (ifsc_code ~ '^[A-Z]{4}0[A-Z0-9]{6}$')
);

COMMENT ON TABLE public.candidate_applications IS 'Complete employee onboarding application forms';
COMMENT ON COLUMN public.candidate_applications.education IS 'JSONB array of education qualifications';
COMMENT ON COLUMN public.candidate_applications.status IS 'Application workflow status';


-- Table: documents
-- Stores uploaded document metadata
CREATE TABLE public.documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  application_id UUID NOT NULL REFERENCES public.candidate_applications(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Document Information
  document_type TEXT NOT NULL CHECK (document_type IN (
    'pan_card', 
    'aadhar_card', 
    'passport', 
    'tenth_certificate', 
    'twelfth_certificate', 
    'bachelors_degree', 
    'masters_degree', 
    'police_clearance',
    'photo',
    'signature',
    'other'
  )),
  
  -- File Information
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  file_type TEXT NOT NULL,
  
  -- Verification Status
  status TEXT NOT NULL DEFAULT 'uploaded' CHECK (status IN ('uploaded', 'verified', 'rejected')),
  verified_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  verified_at TIMESTAMP WITH TIME ZONE,
  rejection_reason TEXT,
  
  -- Metadata
  is_required BOOLEAN DEFAULT true,
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  
  -- Unique constraint: one document type per application
  CONSTRAINT unique_document_per_application UNIQUE (application_id, document_type)
);

COMMENT ON TABLE public.documents IS 'Uploaded documents for candidate applications';
COMMENT ON COLUMN public.documents.document_type IS 'Type of document uploaded';


-- Table: admin_actions_log
-- Audit trail for admin actions
CREATE TABLE public.admin_actions_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  admin_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  application_id UUID REFERENCES public.candidate_applications(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  details JSONB DEFAULT '{}'::JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE public.admin_actions_log IS 'Audit log of all admin actions on applications';


-- ============================================================================
-- STEP 5: CREATE INDEXES FOR PERFORMANCE
-- ============================================================================

-- Profiles indexes
CREATE INDEX idx_profiles_email ON public.profiles(email);
CREATE INDEX idx_profiles_role ON public.profiles(role);

-- Applications indexes
CREATE INDEX idx_applications_user_id ON public.candidate_applications(user_id);
CREATE INDEX idx_applications_status ON public.candidate_applications(status);
CREATE INDEX idx_applications_submitted_at ON public.candidate_applications(submitted_at);
CREATE INDEX idx_applications_reviewed_by ON public.candidate_applications(reviewed_by);
CREATE INDEX idx_applications_created_at ON public.candidate_applications(created_at DESC);

-- Documents indexes
CREATE INDEX idx_documents_application_id ON public.documents(application_id);
CREATE INDEX idx_documents_user_id ON public.documents(user_id);
CREATE INDEX idx_documents_type ON public.documents(document_type);
CREATE INDEX idx_documents_status ON public.documents(status);

-- Admin actions log indexes
CREATE INDEX idx_admin_actions_admin_id ON public.admin_actions_log(admin_id);
CREATE INDEX idx_admin_actions_application_id ON public.admin_actions_log(application_id);
CREATE INDEX idx_admin_actions_created_at ON public.admin_actions_log(created_at DESC);


-- ============================================================================
-- STEP 6: ENABLE ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.candidate_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_actions_log ENABLE ROW LEVEL SECURITY;


-- ============================================================================
-- STEP 7: CREATE RLS POLICIES
-- ============================================================================

-- PROFILES POLICIES
-- -----------------

-- Users can view their own profile
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

-- Admins can view all profiles
CREATE POLICY "Admins can view all profiles"
  ON public.profiles FOR SELECT
  USING (is_admin());

-- Users can insert their own profile
CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);


-- CANDIDATE APPLICATIONS POLICIES
-- --------------------------------

-- Candidates can view their own applications
CREATE POLICY "Candidates can view own applications"
  ON public.candidate_applications FOR SELECT
  USING (auth.uid() = user_id);

-- Admins can view all applications
CREATE POLICY "Admins can view all applications"
  ON public.candidate_applications FOR SELECT
  USING (is_admin());

-- Candidates can create applications
CREATE POLICY "Candidates can create applications"
  ON public.candidate_applications FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Candidates can update own applications (only if draft or submitted status)
CREATE POLICY "Candidates can update own draft applications"
  ON public.candidate_applications FOR UPDATE
  USING (
    auth.uid() = user_id 
    AND status IN ('draft', 'submitted')
  )
  WITH CHECK (
    auth.uid() = user_id 
    AND status IN ('draft', 'submitted')
  );

-- Admins can update any application
CREATE POLICY "Admins can update all applications"
  ON public.candidate_applications FOR UPDATE
  USING (is_admin())
  WITH CHECK (is_admin());


-- DOCUMENTS POLICIES
-- ------------------

-- Candidates can view their own documents
CREATE POLICY "Candidates can view own documents"
  ON public.documents FOR SELECT
  USING (auth.uid() = user_id);

-- Admins can view all documents
CREATE POLICY "Admins can view all documents"
  ON public.documents FOR SELECT
  USING (is_admin());

-- Candidates can upload documents to their applications
CREATE POLICY "Candidates can upload documents"
  ON public.documents FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM public.candidate_applications
      WHERE id = application_id AND user_id = auth.uid()
    )
  );

-- Candidates can update their own documents (if not verified)
CREATE POLICY "Candidates can update own documents"
  ON public.documents FOR UPDATE
  USING (
    auth.uid() = user_id 
    AND status != 'verified'
  )
  WITH CHECK (
    auth.uid() = user_id 
    AND status != 'verified'
  );

-- Admins can update any document
CREATE POLICY "Admins can update all documents"
  ON public.documents FOR UPDATE
  USING (is_admin())
  WITH CHECK (is_admin());

-- Candidates can delete their own unverified documents
CREATE POLICY "Candidates can delete own documents"
  ON public.documents FOR DELETE
  USING (
    auth.uid() = user_id 
    AND status != 'verified'
  );


-- ADMIN ACTIONS LOG POLICIES
-- ---------------------------

-- Only admins can view audit logs
CREATE POLICY "Admins can view audit logs"
  ON public.admin_actions_log FOR SELECT
  USING (is_admin());

-- Only admins can insert audit logs
CREATE POLICY "Admins can insert audit logs"
  ON public.admin_actions_log FOR INSERT
  WITH CHECK (is_admin());


-- ============================================================================
-- STEP 8: CREATE TRIGGERS
-- ============================================================================

-- Auto-create profile when new user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    'candidate'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();


-- Auto-update updated_at on profiles
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-update updated_at on applications
CREATE TRIGGER update_applications_updated_at
  BEFORE UPDATE ON public.candidate_applications
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();


-- ============================================================================
-- STEP 9: GRANT PERMISSIONS
-- ============================================================================

-- Grant usage on schema
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO anon;

-- Grant table permissions to authenticated users (RLS will handle fine-grained access)
GRANT ALL ON public.profiles TO authenticated;
GRANT ALL ON public.candidate_applications TO authenticated;
GRANT ALL ON public.documents TO authenticated;
GRANT ALL ON public.admin_actions_log TO authenticated;


-- ============================================================================
-- STEP 10: CREATE STORAGE BUCKET (Run separately if needed)
-- ============================================================================
-- Note: Run this section separately or ensure storage schema exists

/*
-- Create documents bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'application-documents',
  'application-documents',
  false,
  10485760, -- 10MB limit
  ARRAY[
    'application/pdf',
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp'
  ]
)
ON CONFLICT (id) DO UPDATE SET
  file_size_limit = 10485760,
  allowed_mime_types = ARRAY[
    'application/pdf',
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp'
  ];

-- Storage bucket policies
CREATE POLICY "Authenticated users can upload documents"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'application-documents'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can view own documents in storage"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'application-documents'
    AND (
      (storage.foldername(name))[1] = auth.uid()::text
      OR is_admin()
    )
  );

CREATE POLICY "Users can update own documents in storage"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'application-documents'
    AND (storage.foldername(name))[1] = auth.uid()::text
  )
  WITH CHECK (
    bucket_id = 'application-documents'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can delete own documents in storage"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'application-documents'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
*/


-- ============================================================================
-- VERIFICATION QUERIES
-- Run these to verify the setup
-- ============================================================================

-- Check if all tables were created
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('profiles', 'candidate_applications', 'documents', 'admin_actions_log');

-- Check if RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public';

-- Check indexes
SELECT tablename, indexname 
FROM pg_indexes 
WHERE schemaname = 'public' 
ORDER BY tablename;

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Database setup complete!';
  RAISE NOTICE 'Tables created: profiles, candidate_applications, documents, admin_actions_log';
  RAISE NOTICE 'RLS enabled and policies configured';
  RAISE NOTICE 'Triggers and functions created';
  RAISE NOTICE 'Indexes created for performance';
END $$;
