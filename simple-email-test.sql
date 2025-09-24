-- Simple Email Function Test - Run this in your Supabase SQL Editor
-- This will help verify if the send-email edge function is working

-- 1. Check if the send-email function exists
SELECT 
    'send-email function check' as test_type,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.routines 
            WHERE routine_name = 'send-email'
        ) THEN 'Function exists in database'
        ELSE 'Function NOT found in database'
    END as status;

-- 2. Show all available functions in public schema
SELECT 
    routine_name,
    routine_type,
    data_type
FROM information_schema.routines 
WHERE routine_schema = 'public'
ORDER BY routine_name;

-- 3. Check if this is a Supabase project
SELECT 
    'Supabase check' as test_type,
    CASE 
        WHEN current_setting('app.settings.supabase_url', true) IS NOT NULL 
        THEN 'This is a Supabase project'
        ELSE 'This might not be a Supabase project'
    END as status;
