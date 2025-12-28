-- Migration 003: Enhanced Progress Calculation
-- Adds improved progress calculation based on form completion and documents

-- ============================================================================
-- FUNCTION: calculate_application_progress
-- Calculates progress based on form completeness and document uploads
-- ============================================================================
CREATE OR REPLACE FUNCTION public.calculate_application_progress(p_app_id UUID)
RETURNS INTEGER AS $$
DECLARE
  v_form_data JSONB;
  v_doc_count INTEGER;
  v_required_docs INTEGER := 5; -- PAN, Aadhar, 10th, 12th, Bachelor's
  v_form_progress INTEGER := 0;
  v_doc_progress INTEGER := 0;
  v_total_progress INTEGER;
  v_required_fields TEXT[] := ARRAY[
    'postAppliedFor', 'fullName', 'fatherOrHusbandName', 'permanentAddress',
    'communicationAddress', 'dateOfBirth', 'sex', 'maritalStatus', 'mobileNo',
    'email', 'bankName', 'declaration'
  ];
  v_filled_fields INTEGER := 0;
  v_field TEXT;
BEGIN
  -- Get form data
  SELECT form_data INTO v_form_data
  FROM public.applications
  WHERE id = p_app_id;
  
  IF v_form_data IS NULL THEN
    RETURN 0;
  END IF;
  
  -- Count filled required fields
  FOREACH v_field IN ARRAY v_required_fields
  LOOP
    IF v_form_data ? v_field AND 
       v_form_data->>v_field IS NOT NULL AND 
       v_form_data->>v_field != '' THEN
      v_filled_fields := v_filled_fields + 1;
    END IF;
  END LOOP;
  
  -- Calculate form progress (60% weight)
  v_form_progress := (v_filled_fields * 60) / array_length(v_required_fields, 1);
  
  -- Count uploaded documents
  SELECT COUNT(*) INTO v_doc_count
  FROM public.documents
  WHERE app_id = p_app_id;
  
  -- Calculate document progress (40% weight)
  v_doc_progress := LEAST(40, (v_doc_count * 40) / v_required_docs);
  
  -- Total progress
  v_total_progress := v_form_progress + v_doc_progress;
  
  -- Update the application
  UPDATE public.applications
  SET progress_percent = v_total_progress, updated_at = now()
  WHERE id = p_app_id;
  
  RETURN v_total_progress;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- TRIGGER: Auto-update progress when form or documents change
-- ============================================================================
CREATE OR REPLACE FUNCTION public.trigger_update_progress()
RETURNS TRIGGER AS $$
BEGIN
  -- Update progress for the application
  PERFORM calculate_application_progress(NEW.app_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS trigger_document_progress_update ON public.documents;

-- Create trigger for document changes
CREATE TRIGGER trigger_document_progress_update
AFTER INSERT OR UPDATE OR DELETE ON public.documents
FOR EACH ROW
EXECUTE FUNCTION public.trigger_update_progress();

-- ============================================================================
-- Update existing compute_progress to use new calculation
-- ============================================================================
CREATE OR REPLACE FUNCTION public.compute_progress(p_app_id UUID)
RETURNS INTEGER AS $$
BEGIN
  RETURN calculate_application_progress(p_app_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- Enhanced submit_application to calculate progress
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
  
  -- Calculate progress
  PERFORM calculate_application_progress(p_app_id);
  
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
