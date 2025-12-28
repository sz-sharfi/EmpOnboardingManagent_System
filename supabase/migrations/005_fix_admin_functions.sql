-- Fix Admin Functions - Better error handling and debugging
-- This migration improves the approve/reject functions with better error messages

-- ============================================================================
-- FUNCTION: approve_application - Admin approves application (Enhanced)
-- ============================================================================
CREATE OR REPLACE FUNCTION public.approve_application(
  p_app_id UUID,
  p_admin_notes TEXT DEFAULT NULL
)
RETURNS TABLE (id UUID, status TEXT, reviewed_at TIMESTAMP WITH TIME ZONE) AS $$
DECLARE
  v_user_id UUID;
  v_admin_id UUID;
  v_is_admin BOOLEAN;
BEGIN
  v_admin_id := auth.uid();
  
  -- Better admin check with informative error
  SELECT is_admin() INTO v_is_admin;
  
  IF v_admin_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required. Please log in.';
  END IF;
  
  IF NOT v_is_admin THEN
    RAISE EXCEPTION 'Access denied. Only administrators can approve applications. User role check failed.';
  END IF;
  
  -- Check if application exists
  SELECT user_id INTO v_user_id 
  FROM public.applications 
  WHERE applications.id = p_app_id;
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Application not found with ID: %', p_app_id;
  END IF;
  
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
-- FUNCTION: reject_application - Admin rejects application (Enhanced)
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
  v_is_admin BOOLEAN;
BEGIN
  v_admin_id := auth.uid();
  
  -- Better admin check with informative error
  SELECT is_admin() INTO v_is_admin;
  
  IF v_admin_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required. Please log in.';
  END IF;
  
  IF NOT v_is_admin THEN
    RAISE EXCEPTION 'Access denied. Only administrators can reject applications. User role check failed.';
  END IF;
  
  IF p_rejection_reason IS NULL OR trim(p_rejection_reason) = '' THEN
    RAISE EXCEPTION 'Rejection reason is required';
  END IF;
  
  -- Check if application exists
  SELECT user_id INTO v_user_id 
  FROM public.applications 
  WHERE applications.id = p_app_id;
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Application not found with ID: %', p_app_id;
  END IF;
  
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
-- HELPER: Check if current user is admin (for debugging)
-- ============================================================================
CREATE OR REPLACE FUNCTION public.check_admin_status()
RETURNS TABLE (
  user_id UUID,
  email TEXT,
  role TEXT,
  is_admin BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.user_id,
    p.email,
    p.role,
    (p.role = 'admin') as is_admin
  FROM public.profiles p
  WHERE p.user_id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
