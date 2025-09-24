-- Fix Missing call_link Column - Run this in your Supabase SQL Editor
-- This will add the missing call_link column that your code needs

-- 1. Add the missing call_link column
ALTER TABLE public.video_calls 
ADD COLUMN IF NOT EXISTS call_link TEXT;

-- 2. Add any other missing columns that might be needed
ALTER TABLE public.video_calls 
ADD COLUMN IF NOT EXISTS meeting_id TEXT;

ALTER TABLE public.video_calls 
ADD COLUMN IF NOT EXISTS meeting_password TEXT;

-- 3. Verify the table structure now includes all needed columns
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'video_calls'
ORDER BY ordinal_position;

-- 4. Test inserting a record to make sure it works
-- (This will help verify the table structure is correct)
-- Replace '87205b2c-b4db-4bd2-9f04-c4fa56453f77' with your actual user ID
INSERT INTO public.video_calls (
    user_id, 
    status, 
    call_type, 
    call_link
) VALUES (
    '87205b2c-b4db-4bd2-9f04-c4fa56453f77', -- Your user ID
    'waiting_admin', 
    'kyc_verification',
    'https://test-meeting.com/123'
) RETURNING id, user_id, status, call_type, call_link;

-- 5. Clean up test data
DELETE FROM public.video_calls WHERE call_link = 'https://test-meeting.com/123';

-- 6. Show final table structure
SELECT 
    'video_calls table fixed successfully' as status,
    COUNT(*) as total_columns
FROM information_schema.columns 
WHERE table_name = 'video_calls';
