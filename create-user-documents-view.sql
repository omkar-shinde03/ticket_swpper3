-- Create Missing View - Run this in your Supabase SQL Editor
-- This creates the user_documents_with_profile view that the admin component needs

-- 1. Create the view that joins user_documents with profiles
CREATE OR REPLACE VIEW public.user_documents_with_profile AS
SELECT 
    ud.id,
    ud.user_id,
    ud.file_name,
    ud.file_type,
    ud.file_size,
    ud.file_url,
    ud.storage_path,
    ud.document_type,
    ud.verification_status,
    ud.uploaded_at,
    p.full_name,
    p.email,
    p.phone,
    p.user_type,
    p.kyc_status,
    p.created_at as profile_created_at
FROM public.user_documents ud
LEFT JOIN public.profiles p ON ud.user_id = p.id
ORDER BY ud.uploaded_at DESC;

-- 2. Grant access to the view
GRANT SELECT ON public.user_documents_with_profile TO authenticated;
GRANT SELECT ON public.user_documents_with_profile TO anon;

-- 3. The view will inherit security from the underlying tables
-- No need to set RLS on views - they inherit from the base tables

-- 5. Test the view
SELECT 
    'View created successfully' as status,
    COUNT(*) as total_records
FROM public.user_documents_with_profile;

-- 6. Show view structure
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'user_documents_with_profile'
ORDER BY ordinal_position;

-- 7. Show sample data (first 3 records)
SELECT 
    id,
    file_name,
    document_type,
    verification_status,
    full_name,
    email,
    uploaded_at
FROM public.user_documents_with_profile 
LIMIT 3;
