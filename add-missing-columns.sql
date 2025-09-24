-- Add missing columns to existing KYC tables
-- Run this in your Supabase SQL Editor to fix the missing call_link column error

-- 1. Add missing call_link column to video_calls table
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
-- INSERT INTO public.video_calls (user_id, status, call_type, call_link) 
-- VALUES (gen_random_uuid(), 'waiting_admin', 'kyc_verification', 'https://test-meeting.com/123')
-- RETURNING id, user_id, status, call_type, call_link;

-- 5. Clean up test data (uncomment if you ran the test insert)
-- DELETE FROM public.video_calls WHERE call_link = 'https://test-meeting.com/123';

-- 6. Show final table structure
SELECT 
    'video_calls' as table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'video_calls'
ORDER BY ordinal_position;
