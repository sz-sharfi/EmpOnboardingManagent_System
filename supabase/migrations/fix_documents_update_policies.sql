-- Fix documents table RLS policies for admin updates

-- Drop existing UPDATE policies
DROP POLICY IF EXISTS "Candidates can update own documents" ON public.documents;
DROP POLICY IF EXISTS "Admins can update all documents" ON public.documents;
DROP POLICY IF EXISTS "Users update documents for own applications" ON public.documents;

-- Admins can update any document (simplified - no user_id check needed)
CREATE POLICY "Admins can update all documents"
  ON public.documents FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

