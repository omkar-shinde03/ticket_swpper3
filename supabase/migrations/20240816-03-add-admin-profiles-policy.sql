-- Add admin policy for profiles table to allow KYC verification
-- This policy allows admins to update any user's profile for KYC verification

-- First, create a function to check if the current user is an admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND user_type = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add admin policy for updating profiles (KYC verification)
CREATE POLICY "Admins can update any profile" ON public.profiles
  FOR UPDATE USING (is_admin());

-- Add admin policy for viewing all profiles
CREATE POLICY "Admins can view all profiles" ON public.profiles
  FOR SELECT USING (is_admin());

-- Add admin policy for user_documents table
CREATE POLICY "Admins can view all user documents" ON public.user_documents
  FOR SELECT USING (is_admin());

CREATE POLICY "Admins can update user documents" ON public.user_documents
  FOR UPDATE USING (is_admin());

-- Add admin policy for video_calls table
CREATE POLICY "Admins can view all video calls" ON public.video_calls
  FOR SELECT USING (is_admin());

CREATE POLICY "Admins can update video calls" ON public.video_calls
  FOR UPDATE USING (is_admin());
