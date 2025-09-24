-- Test KYC Access - Run this in your Supabase SQL Editor
-- This script will help diagnose the 406 error issue

-- 1. Check if tables exist and their structure
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name IN ('video_calls', 'user_documents')
ORDER BY table_name, ordinal_position;

-- 2. Check if RLS is enabled
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename IN ('video_calls', 'user_documents');

-- 3. Check existing RLS policies
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename IN ('video_calls', 'user_documents');

-- 4. Check if the user exists in auth.users
-- Replace '87205b2c-b4db-4bd2-9f04-c4fa56453f77' with your actual user ID
SELECT 
    id,
    email,
    created_at,
    last_sign_in_at
FROM auth.users 
WHERE id = '87205b2c-b4db-4bd2-9f04-c4fa56453f77';

-- 5. Check if the user has a profile
SELECT 
    id,
    email,
    full_name,
    user_type,
    kyc_status
FROM public.profiles 
WHERE id = '87205b2c-b4db-4bd2-9f04-c4fa56453f77';

-- 6. Test RLS policies by temporarily disabling them (for testing only)
-- WARNING: Only run this in development/testing environment
-- ALTER TABLE public.video_calls DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.user_documents DISABLE ROW LEVEL SECURITY;

-- 7. Test basic queries without RLS
-- SELECT COUNT(*) FROM public.video_calls;
-- SELECT COUNT(*) FROM public.user_documents;

-- 8. Re-enable RLS after testing
-- ALTER TABLE public.video_calls ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.user_documents ENABLE ROW LEVEL SECURITY;
