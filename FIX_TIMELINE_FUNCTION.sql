-- Fix get_application_timeline function
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
  LEFT JOIN public.profiles p ON al.performed_by = p.id
  WHERE al.app_id = p_app_id
  ORDER BY al.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
