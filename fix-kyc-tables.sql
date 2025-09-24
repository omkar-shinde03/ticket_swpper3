-- Fix KYC tables - Run this in your Supabase SQL Editor
-- This script will fix existing tables and add missing columns

-- 1. First, let's check what tables exist
SELECT table_name, column_name, data_type 
FROM information_schema.columns 
WHERE table_name IN ('video_calls', 'user_documents')
ORDER BY table_name, ordinal_position;

-- 2. Drop existing tables if they exist (to recreate with correct schema)
DROP TABLE IF EXISTS public.video_calls CASCADE;
DROP TABLE IF EXISTS public.user_documents CASCADE;

-- 3. Create video_calls table with correct schema
CREATE TABLE public.video_calls (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  admin_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  status VARCHAR(20) DEFAULT 'waiting_admin' CHECK (status IN ('waiting_admin', 'admin_connected', 'in_call', 'completed', 'cancelled')),
  call_type VARCHAR(50) DEFAULT 'kyc_verification',
  call_start_time TIMESTAMP WITH TIME ZONE,
  call_end_time TIMESTAMP WITH TIME ZONE,
  verification_notes TEXT,
  verification_result VARCHAR(20) CHECK (verification_result IN ('approved', 'rejected', 'pending')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Create user_documents table with correct schema
CREATE TABLE public.user_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_type TEXT,
  file_size BIGINT,
  file_url TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  document_type TEXT DEFAULT 'aadhar',
  verification_status TEXT DEFAULT 'pending',
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. Enable RLS on both tables
ALTER TABLE public.video_calls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_documents ENABLE ROW LEVEL SECURITY;

-- 6. Create RLS policies for video_calls
CREATE POLICY "Users can view own video calls" ON public.video_calls
  FOR SELECT USING (user_id = auth.uid() OR admin_id = auth.uid());

CREATE POLICY "Users can insert own video calls" ON public.video_calls
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own video calls" ON public.video_calls
  FOR UPDATE USING (user_id = auth.uid() OR admin_id = auth.uid());

CREATE POLICY "Admins can manage all video calls" ON public.video_calls
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() AND profiles.user_type = 'admin'
    )
  );

-- 7. Create RLS policies for user_documents
CREATE POLICY "Users can view own documents" ON public.user_documents
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert own documents" ON public.user_documents
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own documents" ON public.user_documents
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Admins can view all documents" ON public.user_documents
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() AND profiles.user_type = 'admin'
    )
  );

-- 8. Create indexes for better performance
CREATE INDEX idx_video_calls_user_id ON public.video_calls(user_id);
CREATE INDEX idx_video_calls_status ON public.video_calls(status);
CREATE INDEX idx_user_documents_user_id ON public.user_documents(user_id);
CREATE INDEX idx_user_documents_verification_status ON public.user_documents(verification_status);

-- 9. Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_video_calls_updated_at 
    BEFORE UPDATE ON public.video_calls 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_documents_updated_at 
    BEFORE UPDATE ON public.user_documents 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 10. Verify tables were created successfully
SELECT 'video_calls table created successfully' as status, COUNT(*) as row_count FROM public.video_calls
UNION ALL
SELECT 'user_documents table created successfully' as status, COUNT(*) as row_count FROM public.user_documents;

-- 11. Show table structure
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name IN ('video_calls', 'user_documents')
ORDER BY table_name, ordinal_position;
