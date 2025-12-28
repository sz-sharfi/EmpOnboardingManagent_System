-- Enhanced Features Migration
-- Adds missing features: document verification, status tracking, activity logs, notifications

-- ============================================================================
-- ENHANCE documents table - Add verification fields
-- ============================================================================
ALTER TABLE public.documents ADD COLUMN IF NOT EXISTS verification_status TEXT DEFAULT 'pending' CHECK (verification_status IN ('pending', 'verified', 'rejected'));
ALTER TABLE public.documents ADD COLUMN IF NOT EXISTS verified_by UUID REFERENCES public.profiles(user_id);
ALTER TABLE public.documents ADD COLUMN IF NOT EXISTS verified_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.documents ADD COLUMN IF NOT EXISTS rejection_reason TEXT;
ALTER TABLE public.documents ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT now();

-- Add trigger for documents updated_at
DROP TRIGGER IF EXISTS trigger_set_updated_at_documents ON public.documents;
CREATE TRIGGER trigger_set_updated_at_documents
BEFORE UPDATE ON public.documents
FOR EACH ROW
EXECUTE FUNCTION public.trigger_set_updated_at();

-- ============================================================================
-- TABLE: activity_logs - Timeline of all application activities
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  app_id UUID NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL, -- 'submitted', 'status_changed', 'document_uploaded', 'document_verified', 'comment_added', etc.
  description TEXT NOT NULL,
  performed_by UUID REFERENCES public.profiles(user_id),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_activity_logs_app_id ON public.activity_logs(app_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON public.activity_logs(created_at DESC);

ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view activity logs for their applications"
  ON public.activity_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.applications
      WHERE applications.id = activity_logs.app_id
      AND (applications.user_id = auth.uid() OR is_admin())
    )
  );

CREATE POLICY "System can insert activity logs"
  ON public.activity_logs FOR INSERT
  WITH CHECK (true);

-- ============================================================================
-- TABLE: notifications - User notifications
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT DEFAULT 'info' CHECK (type IN ('info', 'success', 'warning', 'error')),
  read BOOLEAN DEFAULT false,
  link TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON public.notifications(read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at DESC);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own notifications"
  ON public.notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users update own notifications"
  ON public.notifications FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "System can insert notifications"
  ON public.notifications FOR INSERT
  WITH CHECK (true);

-- ============================================================================
-- ENHANCE applications table - Add review and rejection fields
-- ============================================================================
ALTER TABLE public.applications ADD COLUMN IF NOT EXISTS reviewed_by UUID REFERENCES public.profiles(user_id);
ALTER TABLE public.applications ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.applications ADD COLUMN IF NOT EXISTS rejection_reason TEXT;
ALTER TABLE public.applications ADD COLUMN IF NOT EXISTS admin_notes TEXT;

-- ============================================================================
-- FUNCTION: log_activity - Helper to create activity logs
-- ============================================================================
CREATE OR REPLACE FUNCTION public.log_activity(
  p_app_id UUID,
  p_activity_type TEXT,
  p_description TEXT,
  p_performed_by UUID DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'::JSONB
)
RETURNS UUID AS $$
DECLARE
  v_log_id UUID;
BEGIN
  p_performed_by := COALESCE(p_performed_by, auth.uid());
  
  INSERT INTO public.activity_logs (app_id, activity_type, description, performed_by, metadata)
  VALUES (p_app_id, p_activity_type, p_description, p_performed_by, p_metadata)
  RETURNING id INTO v_log_id;
  
  RETURN v_log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- FUNCTION: create_notification - Helper to create notifications
-- ============================================================================
CREATE OR REPLACE FUNCTION public.create_notification(
  p_user_id UUID,
  p_title TEXT,
  p_message TEXT,
  p_type TEXT DEFAULT 'info',
  p_link TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_notif_id UUID;
BEGIN
  INSERT INTO public.notifications (user_id, title, message, type, link)
  VALUES (p_user_id, p_title, p_message, p_type, p_link)
  RETURNING id INTO v_notif_id;
  
  RETURN v_notif_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- FUNCTION: approve_application - Admin approves application
-- ============================================================================
CREATE OR REPLACE FUNCTION public.approve_application(
  p_app_id UUID,
  p_admin_notes TEXT DEFAULT NULL
)
RETURNS TABLE (id UUID, status TEXT, reviewed_at TIMESTAMP WITH TIME ZONE) AS $$
DECLARE
  v_user_id UUID;
  v_admin_id UUID;
BEGIN
  v_admin_id := auth.uid();
  
  -- Check if user is admin
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Only admins can approve applications';
  END IF;
  
  -- Get application user_id
  SELECT user_id INTO v_user_id FROM public.applications WHERE applications.id = p_app_id;
  
  -- Update application
  UPDATE public.applications
  SET 
    status = 'accepted',
    reviewed_by = v_admin_id,
    reviewed_at = now(),
    admin_notes = p_admin_notes,
    updated_at = now()
  WHERE applications.id = p_app_id;
  
  -- Log activity
  PERFORM log_activity(
    p_app_id,
    'status_changed',
    'Application approved by admin',
    v_admin_id,
    jsonb_build_object('new_status', 'accepted', 'admin_notes', p_admin_notes)
  );
  
  -- Create notification
  PERFORM create_notification(
    v_user_id,
    'Application Approved! 🎉',
    'Your application has been approved. Please upload your documents to proceed.',
    'success',
    '/candidate/documents'
  );
  
  RETURN QUERY
  SELECT applications.id, applications.status, applications.reviewed_at
  FROM public.applications
  WHERE applications.id = p_app_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- FUNCTION: reject_application - Admin rejects application
-- ============================================================================
CREATE OR REPLACE FUNCTION public.reject_application(
  p_app_id UUID,
  p_rejection_reason TEXT,
  p_admin_notes TEXT DEFAULT NULL
)
RETURNS TABLE (id UUID, status TEXT, rejection_reason TEXT) AS $$
DECLARE
  v_user_id UUID;
  v_admin_id UUID;
BEGIN
  v_admin_id := auth.uid();
  
  -- Check if user is admin
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Only admins can reject applications';
  END IF;
  
  -- Get application user_id
  SELECT user_id INTO v_user_id FROM public.applications WHERE applications.id = p_app_id;
  
  -- Update application
  UPDATE public.applications
  SET 
    status = 'rejected',
    reviewed_by = v_admin_id,
    reviewed_at = now(),
    rejection_reason = p_rejection_reason,
    admin_notes = p_admin_notes,
    updated_at = now()
  WHERE applications.id = p_app_id;
  
  -- Log activity
  PERFORM log_activity(
    p_app_id,
    'status_changed',
    'Application rejected by admin',
    v_admin_id,
    jsonb_build_object('new_status', 'rejected', 'rejection_reason', p_rejection_reason)
  );
  
  -- Create notification
  PERFORM create_notification(
    v_user_id,
    'Application Status Update',
    'Your application status has been updated. Please check your dashboard for details.',
    'warning',
    '/candidate/dashboard'
  );
  
  RETURN QUERY
  SELECT applications.id, applications.status, applications.rejection_reason
  FROM public.applications
  WHERE applications.id = p_app_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- FUNCTION: verify_document - Admin verifies a document
-- ============================================================================
CREATE OR REPLACE FUNCTION public.verify_document(
  p_doc_id UUID,
  p_verified BOOLEAN DEFAULT true,
  p_rejection_reason TEXT DEFAULT NULL
)
RETURNS TABLE (id UUID, verification_status TEXT, verified_at TIMESTAMP WITH TIME ZONE) AS $$
DECLARE
  v_admin_id UUID;
  v_app_id UUID;
  v_doc_type TEXT;
  v_user_id UUID;
BEGIN
  v_admin_id := auth.uid();
  
  -- Check if user is admin
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Only admins can verify documents';
  END IF;
  
  -- Get document details
  SELECT app_id, document_type INTO v_app_id, v_doc_type
  FROM public.documents WHERE documents.id = p_doc_id;
  
  -- Get user_id
  SELECT user_id INTO v_user_id FROM public.applications WHERE applications.id = v_app_id;
  
  -- Update document
  UPDATE public.documents
  SET 
    verification_status = CASE WHEN p_verified THEN 'verified' ELSE 'rejected' END,
    verified_by = v_admin_id,
    verified_at = now(),
    rejection_reason = p_rejection_reason,
    updated_at = now()
  WHERE documents.id = p_doc_id;
  
  -- Log activity
  PERFORM log_activity(
    v_app_id,
    'document_verified',
    CASE 
      WHEN p_verified THEN 'Document verified: ' || v_doc_type
      ELSE 'Document rejected: ' || v_doc_type
    END,
    v_admin_id,
    jsonb_build_object('document_id', p_doc_id, 'document_type', v_doc_type, 'verified', p_verified)
  );
  
  -- Create notification
  IF p_verified THEN
    PERFORM create_notification(
      v_user_id,
      'Document Verified ✓',
      'Your ' || v_doc_type || ' has been verified.',
      'success',
      '/candidate/documents'
    );
  ELSE
    PERFORM create_notification(
      v_user_id,
      'Document Needs Attention',
      'Your ' || v_doc_type || ' requires resubmission. Reason: ' || COALESCE(p_rejection_reason, 'N/A'),
      'warning',
      '/candidate/documents'
    );
  END IF;
  
  RETURN QUERY
  SELECT documents.id, documents.verification_status, documents.verified_at
  FROM public.documents
  WHERE documents.id = p_doc_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- FUNCTION: get_application_timeline - Get activity timeline for application
-- ============================================================================
CREATE OR REPLACE FUNCTION public.get_application_timeline(p_app_id UUID)
RETURNS TABLE (
  id UUID,
  activity_type TEXT,
  description TEXT,
  performed_by_name TEXT,
  performed_by_role TEXT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    al.id,
    al.activity_type,
    al.description,
    COALESCE(p.full_name, p.email) as performed_by_name,
    p.role as performed_by_role,
    al.metadata,
    al.created_at
  FROM public.activity_logs al
  LEFT JOIN public.profiles p ON al.performed_by = p.user_id
  WHERE al.app_id = p_app_id
  ORDER BY al.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- FUNCTION: get_admin_statistics - Get dashboard statistics
-- ============================================================================
CREATE OR REPLACE FUNCTION public.get_admin_statistics()
RETURNS TABLE (
  total_applications BIGINT,
  pending_review BIGINT,
  approved BIGINT,
  rejected BIGINT,
  documents_pending BIGINT,
  completed BIGINT
) AS $$
BEGIN
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Only admins can view statistics';
  END IF;
  
  RETURN QUERY
  SELECT
    COUNT(*) FILTER (WHERE status != 'draft') as total_applications,
    COUNT(*) FILTER (WHERE status IN ('submitted', 'under_review')) as pending_review,
    COUNT(*) FILTER (WHERE status = 'accepted') as approved,
    COUNT(*) FILTER (WHERE status = 'rejected') as rejected,
    COUNT(*) FILTER (WHERE status = 'accepted' AND progress_percent < 100) as documents_pending,
    COUNT(*) FILTER (WHERE status = 'accepted' AND progress_percent = 100) as completed
  FROM public.applications;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- TRIGGER: Log application status changes automatically
-- ============================================================================
CREATE OR REPLACE FUNCTION public.log_application_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    PERFORM log_activity(
      NEW.id,
      'status_changed',
      'Application status changed from ' || OLD.status || ' to ' || NEW.status,
      auth.uid(),
      jsonb_build_object('old_status', OLD.status, 'new_status', NEW.status)
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_log_status_change ON public.applications;
CREATE TRIGGER trigger_log_status_change
AFTER UPDATE ON public.applications
FOR EACH ROW
WHEN (OLD.status IS DISTINCT FROM NEW.status)
EXECUTE FUNCTION public.log_application_status_change();

-- ============================================================================
-- TRIGGER: Log document uploads automatically
-- ============================================================================
CREATE OR REPLACE FUNCTION public.log_document_upload()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM log_activity(
    NEW.app_id,
    'document_uploaded',
    'Document uploaded: ' || NEW.document_type,
    auth.uid(),
    jsonb_build_object('document_id', NEW.id, 'document_type', NEW.document_type)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_log_document_upload ON public.documents;
CREATE TRIGGER trigger_log_document_upload
AFTER INSERT ON public.documents
FOR EACH ROW
EXECUTE FUNCTION public.log_document_upload();

-- ============================================================================
-- ENHANCED RPC: Update submit_application to log activity
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
  
  -- Log activity
  PERFORM log_activity(
    p_app_id,
    'submitted',
    'Application submitted for review',
    p_user_id,
    '{}'::jsonb
  );
  
  -- Create notification
  PERFORM create_notification(
    p_user_id,
    'Application Submitted Successfully',
    'Your application has been submitted and is under review.',
    'success',
    '/candidate/dashboard'
  );

  RETURN QUERY
  SELECT applications.id, applications.status, applications.submitted_at
  FROM public.applications
  WHERE applications.id = p_app_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- FUNCTION: mark_notification_as_read
-- ============================================================================
CREATE OR REPLACE FUNCTION public.mark_notification_as_read(p_notif_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE public.notifications
  SET read = true
  WHERE id = p_notif_id AND user_id = auth.uid();
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- FUNCTION: mark_all_notifications_as_read
-- ============================================================================
CREATE OR REPLACE FUNCTION public.mark_all_notifications_as_read()
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER;
BEGIN
  UPDATE public.notifications
  SET read = true
  WHERE user_id = auth.uid() AND read = false;
  
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
