-- Debug Video Calls Insert - Run this in your Supabase SQL Editor
-- This script will help identify exactly what's causing the 400 Bad Request error

-- 1. First, let's see the exact table structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default,
    character_maximum_length
FROM information_schema.columns 
WHERE table_name = 'video_calls'
ORDER BY ordinal_position;

-- 2. Check if there are any constraints that might be failing
SELECT 
    conname as constraint_name,
    contype as constraint_type,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'public.video_calls'::regclass;

-- 3. Check if the user_id being used actually exists in auth.users
-- Replace 'YOUR_USER_ID_HERE' with the actual user ID from the error
-- You can find this in your browser's console or network tab
SELECT 
    id,
    email,
    created_at,
    last_sign_in_at
FROM auth.users 
WHERE id = '87205b2c-b4db-4bd2-9f04-c4fa56453f77'; -- Replace this with actual user ID

-- 4. Check if there are any foreign key constraints that might be failing
SELECT 
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM 
    information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
    AND tc.table_name='video_calls';

-- 5. Test inserting a minimal record to see what the exact error is
-- WARNING: This will create a test record - you can delete it after
-- Replace 'TEST_USER_ID' with a valid UUID from your auth.users table
/*
INSERT INTO public.video_calls (
    user_id, 
    status, 
    call_type
) VALUES (
    'TEST_USER_ID', -- Replace with actual user ID from step 3
    'waiting_admin', 
    'kyc_verification'
) RETURNING *;
*/

-- 6. Check if there are any RLS policies blocking the insert
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
WHERE tablename = 'video_calls';

-- 7. Check the current user's authentication status
-- This will show if the current session user can insert
SELECT 
    current_user,
    session_user,
    current_setting('role'),
    current_setting('request.jwt.claims', true) as jwt_claims;

-- 8. Show current database activity (if available)
-- Note: This might not work in all Supabase plans
SELECT 
    pid,
    usename,
    application_name,
    client_addr,
    state,
    query_start,
    state_change
FROM pg_stat_activity 
WHERE state = 'active' 
ORDER BY query_start DESC 
LIMIT 10;
