-- Test Email Function - Run this in your Supabase SQL Editor
-- This will help verify if the send-email edge function is working

-- 1. Check if the function exists
SELECT 
    routine_name,
    routine_type,
    data_type
FROM information_schema.routines 
WHERE routine_name = 'send-email';

-- 2. Check edge functions status (if available)
-- Note: This might not work in all Supabase plans
SELECT 
    name,
    status,
    created_at,
    updated_at
FROM supabase_functions.hooks 
WHERE name = 'send-email';

-- 3. Test the function directly (if you have access)
-- Replace 'your-email@example.com' with your actual email
SELECT 
    supabase_functions.invoke(
        'send-email',
        '{"body": {"to": "your-email@example.com", "subject": "Test Email", "body": "This is a test email", "video_link": "https://test.com"}}'
    ) as function_result;

-- 4. Check function logs (if available)
-- This might not work in all Supabase plans
SELECT 
    timestamp,
    level,
    message
FROM supabase_functions.logs 
WHERE function_name = 'send-email'
ORDER BY timestamp DESC 
LIMIT 10;
