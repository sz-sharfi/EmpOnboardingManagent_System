-- ============================================================================
-- FIX: calculate_application_progress function
-- 
-- ROOT CAUSE:
--   1. Function references old table name 'applications' (renamed to 'candidate_applications')
--   2. Documents table uses 'application_id' but function expects 'app_id'
--   3. Function signature must be calculate_application_progress(p_app_id UUID)
--
-- SOLUTION:
--   1. DROP all variants of the function
--   2. CREATE with correct signature (p_app_id UUID)
--   3. Update to reference 'candidate_applications' table
--   4. Fix document counting to use correct column name
--   5. Return void (updates in place)
-- ============================================================================

-- Step 1: Drop trigger FIRST (must be dropped before the function)
DROP TRIGGER IF EXISTS trigger_document_progress_update ON public.documents;

-- Step 2: Drop ALL existing function variants
DROP FUNCTION IF EXISTS public.calculate_application_progress(UUID);
DROP FUNCTION IF EXISTS public.calculate_application_progress(p_app_id UUID);
DROP FUNCTION IF EXISTS public.calculate_application_progress();
DROP FUNCTION IF EXISTS public.compute_progress(UUID);
DROP FUNCTION IF EXISTS public.submit_application(UUID, UUID);
DROP FUNCTION IF EXISTS public.trigger_update_progress();

-- Step 3: CREATE the canonical function with correct signature
CREATE OR REPLACE FUNCTION public.calculate_application_progress(p_app_id UUID)
RETURNS VOID AS $$
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
  -- Guard: Ensure p_app_id is not null
  IF p_app_id IS NULL THEN
    RAISE EXCEPTION 'calculate_application_progress: p_app_id cannot be NULL';
  END IF;

  -- Get form data from CANDIDATE_APPLICATIONS table (not 'applications')
  SELECT form_data INTO v_form_data
  FROM public.candidate_applications
  WHERE id = p_app_id;
  
  -- If no application found, exit silently (don't fail the upload)
  IF NOT FOUND THEN
    RETURN;
  END IF;
  
  -- If form_data is null, set progress to 0 and return
  IF v_form_data IS NULL THEN
    UPDATE public.candidate_applications
    SET progress_percent = 0, updated_at = now()
    WHERE id = p_app_id;
    RETURN;
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
  
  -- Count uploaded documents from documents table
  -- IMPORTANT: Use 'app_id' column (frontend inserts using app_id)
  SELECT COUNT(*) INTO v_doc_count
  FROM public.documents
  WHERE app_id = p_app_id;
  
  -- Calculate document progress (40% weight)
  v_doc_progress := LEAST(40, (v_doc_count * 40) / v_required_docs);
  
  -- Total progress
  v_total_progress := v_form_progress + v_doc_progress;
  
  -- Update the CANDIDATE_APPLICATIONS table (not 'applications')
  UPDATE public.candidate_applications
  SET progress_percent = v_total_progress, updated_at = now()
  WHERE id = p_app_id;
  
  -- No return value (RETURNS VOID)
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 4: Recreate compute_progress wrapper
CREATE OR REPLACE FUNCTION public.compute_progress(p_app_id UUID)
RETURNS INTEGER AS $$
DECLARE
  v_progress INTEGER;
BEGIN
  -- Call the main function
  PERFORM calculate_application_progress(p_app_id);
  
  -- Retrieve the updated progress
  SELECT progress_percent INTO v_progress
  FROM public.candidate_applications
  WHERE id = p_app_id;
  
  RETURN COALESCE(v_progress, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 5: Recreate trigger function (documents table uses app_id)
CREATE OR REPLACE FUNCTION public.trigger_update_progress()
RETURNS TRIGGER AS $$
BEGIN
  -- Guard: Only update if app_id exists
  IF NEW.app_id IS NOT NULL THEN
    PERFORM calculate_application_progress(NEW.app_id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 6: Recreate trigger
CREATE TRIGGER trigger_document_progress_update
AFTER INSERT OR UPDATE ON public.documents
FOR EACH ROW
EXECUTE FUNCTION public.trigger_update_progress();

-- Step 7: Grant execute permissions
GRANT EXECUTE ON FUNCTION public.calculate_application_progress(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.compute_progress(UUID) TO authenticated;

-- ============================================================================
-- VERIFICATION
-- ============================================================================
-- Check function signature
SELECT 
  proname as function_name,
  pg_get_function_identity_arguments(oid) as arguments,
  prorettype::regtype as return_type
FROM pg_proc
WHERE proname IN ('calculate_application_progress', 'compute_progress')
AND pronamespace = 'public'::regnamespace;

-- Expected output:
-- calculate_application_progress | p_app_id uuid | void
-- compute_progress               | p_app_id uuid | integer
