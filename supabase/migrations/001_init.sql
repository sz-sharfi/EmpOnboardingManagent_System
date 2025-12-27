-- Onboarding Application Backend - Supabase Migration
-- Tables: profiles, applications, documents, messages, audit_logs
-- RLS: Row-level security with admin role checking
-- RPCs: save_application_draft, submit_application, post_message, compute_progress
-- Triggers: notify_new_document, trigger_set_updated_at

-- ============================================================================
-- CLEAN UP: Drop all existing objects
-- ============================================================================

-- Drop triggers first
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS trigger_notify_new_document ON public.documents;
DROP TRIGGER IF EXISTS trigger_set_updated_at_profiles ON public.profiles;
DROP TRIGGER IF EXISTS trigger_set_updated_at_applications ON public.applications;

-- Drop functions
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.notify_new_document() CASCADE;
DROP FUNCTION IF EXISTS public.trigger_set_updated_at() CASCADE;
DROP FUNCTION IF EXISTS public.post_message(UUID, TEXT, UUID) CASCADE;
DROP FUNCTION IF EXISTS public.submit_application(UUID, UUID) CASCADE;
DROP FUNCTION IF EXISTS public.save_application_draft(UUID, UUID, JSONB, JSONB) CASCADE;
DROP FUNCTION IF EXISTS public.compute_progress(UUID) CASCADE;
DROP FUNCTION IF EXISTS public.is_admin() CASCADE;

-- Drop tables (in correct order due to foreign key constraints)
DROP TABLE IF EXISTS public.audit_logs CASCADE;
DROP TABLE IF EXISTS public.messages CASCADE;
DROP TABLE IF EXISTS public.documents CASCADE;
DROP TABLE IF EXISTS public.applications CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

-- ============================================================================
-- HELPER FUNCTION: is_admin()
-- ============================================================================
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE user_id = auth.uid()
    AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- TABLE: profiles
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL DEFAULT 'candidate' CHECK (role IN ('candidate', 'admin')),
  full_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = user_id OR is_admin());

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- TABLE: applications
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'under_review', 'accepted', 'rejected')),
  form_data JSONB NOT NULL DEFAULT '{}',
  preview_data JSONB NOT NULL DEFAULT '{}',
  progress_percent INTEGER DEFAULT 0,
  submitted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Candidates view own applications"
  ON public.applications FOR SELECT
  USING (auth.uid() = user_id OR is_admin());

CREATE POLICY "Candidates create and update own applications"
  ON public.applications FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Candidates update own draft applications"
  ON public.applications FOR UPDATE
  USING (auth.uid() = user_id OR is_admin());

-- ============================================================================
-- TABLE: documents
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  app_id UUID NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  file_size_bytes INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view documents for own applications"
  ON public.documents FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.applications
      WHERE applications.id = documents.app_id
      AND (applications.user_id = auth.uid() OR is_admin())
    )
  );

CREATE POLICY "Users insert documents for own applications"
  ON public.documents FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.applications
      WHERE applications.id = documents.app_id
      AND applications.user_id = auth.uid()
    )
  );

-- ============================================================================
-- TABLE: messages
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  app_id UUID NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  message_text TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view messages for their applications"
  ON public.messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.applications
      WHERE applications.id = messages.app_id
      AND (applications.user_id = auth.uid() OR is_admin())
    )
  );

CREATE POLICY "Authenticated users can post messages"
  ON public.messages FOR INSERT
  WITH CHECK (auth.uid() = sender_id);

-- ============================================================================
-- TABLE: audit_logs
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action TEXT NOT NULL,
  table_name TEXT,
  record_id UUID,
  user_id UUID REFERENCES public.profiles(user_id),
  old_values JSONB,
  new_values JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins view audit logs"
  ON public.audit_logs FOR SELECT
  USING (is_admin());

-- ============================================================================
-- FUNCTION: compute_progress(p_app_id UUID) -> INTEGER
-- ============================================================================
-- Calculates application progress (0-100) based on documents uploaded
CREATE OR REPLACE FUNCTION public.compute_progress(p_app_id UUID)
RETURNS INTEGER AS $$
DECLARE
  doc_count INTEGER;
  progress_pct INTEGER;
BEGIN
  SELECT COUNT(*) INTO doc_count
  FROM public.documents
  WHERE app_id = p_app_id;

  -- Simple rule: 0 docs = 0%, 1-2 docs = 50%, 3+ docs = 100%
  -- Customize based on your business logic
  IF doc_count = 0 THEN
    progress_pct := 0;
  ELSIF doc_count <= 2 THEN
    progress_pct := 50;
  ELSE
    progress_pct := 100;
  END IF;

  UPDATE public.applications
  SET progress_percent = progress_pct
  WHERE id = p_app_id;

  RETURN progress_pct;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- RPC: save_application_draft(p_app_id, p_user_id, p_form, p_preview)
-- ============================================================================
CREATE OR REPLACE FUNCTION public.save_application_draft(
  p_app_id UUID DEFAULT NULL,
  p_user_id UUID DEFAULT NULL,
  p_form JSONB DEFAULT '{}'::JSONB,
  p_preview JSONB DEFAULT '{}'::JSONB
)
RETURNS TABLE (id UUID, status TEXT, form_data JSONB, preview_data JSONB, progress_percent INTEGER) AS $$
DECLARE
  v_app_id UUID;
BEGIN
  p_user_id := COALESCE(p_user_id, auth.uid());

  -- If no app_id provided, create a new draft application
  IF p_app_id IS NULL THEN
    INSERT INTO public.applications (user_id, status, form_data, preview_data)
    VALUES (p_user_id, 'draft', p_form, p_preview)
    RETURNING applications.id INTO v_app_id;
  ELSE
    v_app_id := p_app_id;
    -- Update existing application
    UPDATE public.applications
    SET form_data = p_form, preview_data = p_preview, updated_at = now()
    WHERE applications.id = v_app_id AND applications.user_id = p_user_id;
  END IF;

  RETURN QUERY
  SELECT applications.id, applications.status, applications.form_data, applications.preview_data, applications.progress_percent
  FROM public.applications
  WHERE applications.id = v_app_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- RPC: submit_application(p_app_id UUID, p_user_id UUID)
-- ============================================================================
CREATE OR REPLACE FUNCTION public.submit_application(
  p_app_id UUID,
  p_user_id UUID DEFAULT NULL
)
RETURNS TABLE (id UUID, status TEXT, submitted_at TIMESTAMP WITH TIME ZONE) AS $$
BEGIN
  p_user_id := COALESCE(p_user_id, auth.uid());

  UPDATE public.applications
  SET status = 'submitted', submitted_at = now(), updated_at = now()
  WHERE applications.id = p_app_id AND applications.user_id = p_user_id;

  RETURN QUERY
  SELECT applications.id, applications.status, applications.submitted_at
  FROM public.applications
  WHERE applications.id = p_app_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- RPC: post_message(p_app_id UUID, p_message_text TEXT, p_sender_id UUID)
-- ============================================================================
CREATE OR REPLACE FUNCTION public.post_message(
  p_app_id UUID,
  p_message_text TEXT,
  p_sender_id UUID DEFAULT NULL
)
RETURNS TABLE (id UUID, app_id UUID, sender_id UUID, message_text TEXT, created_at TIMESTAMP WITH TIME ZONE) AS $$
BEGIN
  p_sender_id := COALESCE(p_sender_id, auth.uid());

  INSERT INTO public.messages (app_id, sender_id, message_text)
  VALUES (p_app_id, p_sender_id, p_message_text);

  RETURN QUERY
  SELECT messages.id, messages.app_id, messages.sender_id, messages.message_text, messages.created_at
  FROM public.messages
  WHERE app_id = p_app_id
  ORDER BY created_at DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- TRIGGER: trigger_set_updated_at
-- ============================================================================
CREATE OR REPLACE FUNCTION public.trigger_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_updated_at_applications
BEFORE UPDATE ON public.applications
FOR EACH ROW
EXECUTE FUNCTION public.trigger_set_updated_at();

CREATE TRIGGER trigger_set_updated_at_profiles
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.trigger_set_updated_at();

-- ============================================================================
-- TRIGGER: notify_new_document
-- ============================================================================
CREATE OR REPLACE FUNCTION public.notify_new_document()
RETURNS TRIGGER AS $$
BEGIN
  -- Publish a realtime notification when a document is created
  PERFORM pg_notify(
    'new_document',
    json_build_object(
      'app_id', NEW.app_id,
      'document_type', NEW.document_type,
      'storage_path', NEW.storage_path
    )::text
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_notify_new_document
AFTER INSERT ON public.documents
FOR EACH ROW
EXECUTE FUNCTION public.notify_new_document();

-- ============================================================================
-- TRIGGER: auto_create_profile
-- ============================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, role, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    'candidate',
    COALESCE(NEW.raw_user_meta_data->>'full_name', '')
  )
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ============================================================================
-- INDEXES (for performance)
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_applications_user_id ON public.applications(user_id);
CREATE INDEX IF NOT EXISTS idx_applications_status ON public.applications(status);
CREATE INDEX IF NOT EXISTS idx_documents_app_id ON public.documents(app_id);
CREATE INDEX IF NOT EXISTS idx_messages_app_id ON public.messages(app_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON public.audit_logs(user_id);

-- ============================================================================
-- STORAGE BUCKET POLICY (documents bucket)
-- Run in Supabase SQL Editor after creating the "documents" bucket
-- ============================================================================
/*
INSERT INTO storage.buckets (id, name, public) VALUES ('documents', 'documents', false);

CREATE POLICY "Users can upload documents"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view own documents"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete own documents"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]);
*/
