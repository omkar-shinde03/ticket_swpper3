import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Textarea } from '@/components/ui/textarea';
import { 
  Database, 
  Copy, 
  ExternalLink, 
  CheckCircle, 
  AlertTriangle,
  FileText,
  Play,
  Download
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export const DatabaseMigrationHelper = () => {
  const [selectedMigration, setSelectedMigration] = useState('complete_schema');
  const { toast } = useToast();

  const migrations = {
    complete_schema: {
      name: 'Complete Schema Setup',
      description: 'Creates all required tables, functions, and policies',
      priority: 'high',
      sql: `
-- Complete TicketSwapper Database Schema
-- Run this in Supabase SQL Editor

-- 1. Create profiles table (extends auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  phone TEXT,
  email TEXT,
  user_type TEXT DEFAULT 'user' CHECK (user_type IN ('user', 'admin')),
  kyc_status TEXT CHECK (kyc_status IN ('pending', 'verified', 'rejected')),
  email_verified BOOLEAN DEFAULT false,
  phone_verified BOOLEAN DEFAULT false,
  avatar_url TEXT,
  upi_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Create tickets table
CREATE TABLE IF NOT EXISTS public.tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  pnr_number TEXT NOT NULL,
  bus_operator TEXT,
  departure_date DATE NOT NULL,
  departure_time TIME NOT NULL,
  from_location TEXT NOT NULL,
  to_location TEXT NOT NULL,
  passenger_name TEXT NOT NULL,
  seat_number TEXT NOT NULL,
  ticket_price DECIMAL(10,2) NOT NULL,
  selling_price DECIMAL(10,2),
  status TEXT DEFAULT 'available' CHECK (status IN ('available', 'sold', 'cancelled')),
  verification_status TEXT DEFAULT 'pending' CHECK (verification_status IN ('pending', 'verified', 'rejected')),
  transport_mode VARCHAR(20) DEFAULT 'bus' CHECK (transport_mode IN ('bus', 'train', 'plane')),
  api_verified BOOLEAN DEFAULT false,
  api_provider TEXT,
  verification_confidence INTEGER DEFAULT 0,
  verified_at TIMESTAMPTZ,
  -- Train specific fields
  train_number TEXT,
  railway_operator TEXT,
  platform_number TEXT,
  coach_class VARCHAR(50),
  berth_type VARCHAR(50),
  railway_zone VARCHAR(100),
  is_tatkal BOOLEAN DEFAULT FALSE,
  -- Plane specific fields
  flight_number TEXT,
  airline_operator TEXT,
  cabin_class VARCHAR(50),
  airport_terminal TEXT,
  baggage_allowance TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Create messages table
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL REFERENCES public.tickets(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  message_type TEXT DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'file')),
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. Create transactions table
CREATE TABLE IF NOT EXISTS public.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL REFERENCES public.tickets(id) ON DELETE CASCADE,
  buyer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  seller_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL,
  platform_fee DECIMAL(10,2) DEFAULT 0,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
  payment_method TEXT DEFAULT 'razorpay',
  razorpay_order_id TEXT,
  razorpay_payment_id TEXT,
  escrow_status TEXT DEFAULT 'held' CHECK (escrow_status IN ('held', 'released', 'refunded')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ
);

-- 5. Create notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT DEFAULT 'general' CHECK (type IN ('general', 'ticket', 'payment', 'kyc', 'message')),
  is_read BOOLEAN DEFAULT false,
  data JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 6. Create email verification tables
CREATE TABLE IF NOT EXISTS public.email_verification_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.email_verification_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('sent', 'verified', 'failed', 'resent')),
  ip_address INET,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 7. Create phone verification tables
CREATE TABLE IF NOT EXISTS public.phone_verification_otps (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  phone VARCHAR(15) NOT NULL,
  email TEXT NOT NULL,
  otp VARCHAR(6) NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  is_used BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.phone_verification_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  phone VARCHAR(15) NOT NULL,
  email TEXT NOT NULL,
  action VARCHAR(50) NOT NULL,
  ip_address TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. Create user documents table
CREATE TABLE IF NOT EXISTS public.user_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_type TEXT,
  file_size BIGINT,
  file_url TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  document_type TEXT DEFAULT 'aadhar',
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 9. Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_verification_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_verification_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.phone_verification_otps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.phone_verification_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_documents ENABLE ROW LEVEL SECURITY;

-- 10. Create RLS Policies
-- Profiles policies
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Public profile access for tickets" ON public.profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.tickets 
      WHERE seller_id = profiles.id AND status = 'available'
    ) OR id = auth.uid()
  );

-- Tickets policies
CREATE POLICY "Anyone can view available tickets" ON public.tickets
  FOR SELECT USING (status = 'available' OR seller_id = auth.uid());

CREATE POLICY "Users can insert own tickets" ON public.tickets
  FOR INSERT WITH CHECK (auth.uid() = seller_id);

CREATE POLICY "Users can update own tickets" ON public.tickets
  FOR UPDATE USING (auth.uid() = seller_id);

-- Messages policies
CREATE POLICY "Users can view own messages" ON public.messages
  FOR SELECT USING (sender_id = auth.uid() OR receiver_id = auth.uid());

CREATE POLICY "Users can send messages" ON public.messages
  FOR INSERT WITH CHECK (auth.uid() = sender_id);

-- Transactions policies
CREATE POLICY "Users can view own transactions" ON public.transactions
  FOR SELECT USING (buyer_id = auth.uid() OR seller_id = auth.uid());

-- Notifications policies
CREATE POLICY "Users can view own notifications" ON public.notifications
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can update own notifications" ON public.notifications
  FOR UPDATE USING (user_id = auth.uid());

-- Email verification policies
CREATE POLICY "Users can view own verification tokens" ON public.email_verification_tokens
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "System can manage verification tokens" ON public.email_verification_tokens
  FOR ALL USING (true);

-- User documents policies
CREATE POLICY "Users can view own documents" ON public.user_documents
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert own documents" ON public.user_documents
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- 11. Create essential functions
CREATE OR REPLACE FUNCTION public.get_available_tickets()
RETURNS TABLE (
  id UUID,
  seller_id UUID,
  pnr_number TEXT,
  bus_operator TEXT,
  departure_date DATE,
  departure_time TIME,
  from_location TEXT,
  to_location TEXT,
  passenger_name TEXT,
  seat_number TEXT,
  ticket_price DECIMAL(10,2),
  selling_price DECIMAL(10,2),
  status TEXT,
  verification_status TEXT,
  transport_mode VARCHAR(20),
  created_at TIMESTAMPTZ,
  seller_name TEXT,
  seller_phone TEXT
) LANGUAGE sql SECURITY DEFINER AS $$
  SELECT 
    t.id, t.seller_id, t.pnr_number, t.bus_operator,
    t.departure_date, t.departure_time, t.from_location, t.to_location,
    t.passenger_name, t.seat_number, t.ticket_price, t.selling_price,
    t.status, t.verification_status, t.transport_mode, t.created_at,
    COALESCE(p.full_name, 'Anonymous') as seller_name,
    COALESCE(p.phone, '') as seller_phone
  FROM public.tickets t
  LEFT JOIN public.profiles p ON t.seller_id = p.id
  WHERE t.status = 'available'
  ORDER BY t.created_at DESC;
$$;

CREATE OR REPLACE FUNCTION public.get_user_tickets()
RETURNS TABLE (
  id UUID,
  seller_id UUID,
  pnr_number TEXT,
  bus_operator TEXT,
  departure_date DATE,
  departure_time TIME,
  from_location TEXT,
  to_location TEXT,
  passenger_name TEXT,
  seat_number TEXT,
  ticket_price DECIMAL(10,2),
  selling_price DECIMAL(10,2),
  status TEXT,
  verification_status TEXT,
  transport_mode VARCHAR(20),
  created_at TIMESTAMPTZ
) LANGUAGE sql SECURITY DEFINER AS $$
  SELECT 
    t.id, t.seller_id, t.pnr_number, t.bus_operator,
    t.departure_date, t.departure_time, t.from_location, t.to_location,
    t.passenger_name, t.seat_number, t.ticket_price, t.selling_price,
    t.status, t.verification_status, t.transport_mode, t.created_at
  FROM public.tickets t
  WHERE t.seller_id = auth.uid()
  ORDER BY t.created_at DESC;
$$;

-- Email verification functions
CREATE OR REPLACE FUNCTION generate_verification_token(user_email TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  token_value TEXT;
  user_record RECORD;
BEGIN
  SELECT id, email INTO user_record
  FROM auth.users WHERE email = user_email;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'User not found';
  END IF;
  
  token_value := LPAD(FLOOR(RANDOM() * 1000000)::TEXT, 6, '0');
  
  UPDATE email_verification_tokens
  SET used_at = now()
  WHERE user_id = user_record.id AND used_at IS NULL;
  
  INSERT INTO email_verification_tokens (user_id, token, expires_at)
  VALUES (user_record.id, token_value, now() + interval '10 minutes');
  
  INSERT INTO email_verification_logs (user_id, email, action)
  VALUES (user_record.id, user_email, 'sent');
  
  RETURN token_value;
END;
$$;

CREATE OR REPLACE FUNCTION verify_email_token(user_email TEXT, token_value TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_record RECORD;
  token_record RECORD;
BEGIN
  SELECT id, email, email_confirmed_at INTO user_record
  FROM auth.users WHERE email = user_email;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'User not found';
  END IF;
  
  IF user_record.email_confirmed_at IS NOT NULL THEN
    RAISE EXCEPTION 'Email already verified';
  END IF;
  
  SELECT * INTO token_record
  FROM email_verification_tokens
  WHERE user_id = user_record.id 
    AND token = token_value 
    AND expires_at > now() 
    AND used_at IS NULL;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invalid or expired token';
  END IF;
  
  UPDATE email_verification_tokens
  SET used_at = now()
  WHERE id = token_record.id;
  
  UPDATE auth.users
  SET email_confirmed_at = now()
  WHERE id = user_record.id;
  
  UPDATE profiles
  SET email_verified = true, updated_at = now()
  WHERE id = user_record.id;
  
  INSERT INTO email_verification_logs (user_id, email, action)
  VALUES (user_record.id, user_email, 'verified');
  
  RETURN true;
END;
$$;

CREATE OR REPLACE FUNCTION can_send_verification_email(user_email TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_record RECORD;
  recent_attempts INTEGER;
BEGIN
  SELECT id INTO user_record
  FROM auth.users WHERE email = user_email;
  
  IF NOT FOUND THEN
    RETURN false;
  END IF;
  
  SELECT COUNT(*) INTO recent_attempts
  FROM email_verification_logs
  WHERE user_id = user_record.id 
    AND action IN ('sent', 'resent')
    AND created_at > now() - interval '1 hour';
  
  RETURN recent_attempts < 3;
END;
$$;

-- 12. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_tickets_seller_id ON public.tickets(seller_id);
CREATE INDEX IF NOT EXISTS idx_tickets_status ON public.tickets(status);
CREATE INDEX IF NOT EXISTS idx_tickets_transport_mode ON public.tickets(transport_mode);
CREATE INDEX IF NOT EXISTS idx_messages_ticket_id ON public.messages(ticket_id);
CREATE INDEX IF NOT EXISTS idx_transactions_buyer_id ON public.transactions(buyer_id);
CREATE INDEX IF NOT EXISTS idx_transactions_seller_id ON public.transactions(seller_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);

-- 13. Grant permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- 14. Create trigger for profile creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, phone, user_type)
  VALUES (
    new.id,
    new.raw_user_meta_data ->> 'full_name',
    new.email,
    new.raw_user_meta_data ->> 'phone',
    COALESCE(new.raw_user_meta_data ->> 'user_type', 'user')
  );
  RETURN new;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
      `
    },

    rls_fixes: {
      name: 'RLS Policy Fixes',
      description: 'Fix common Row Level Security policy issues',
      priority: 'medium',
      sql: `
-- Fix RLS Policies for TicketSwapper

-- Drop problematic policies
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Public profile access for tickets" ON public.profiles;
DROP POLICY IF EXISTS "Anyone can view available tickets" ON public.tickets;

-- Recreate with proper logic
CREATE POLICY "profiles_select_policy" ON public.profiles
  FOR SELECT USING (
    auth.uid() = id OR
    EXISTS (
      SELECT 1 FROM public.tickets 
      WHERE seller_id = profiles.id AND status = 'available'
    )
  );

CREATE POLICY "tickets_select_policy" ON public.tickets
  FOR SELECT USING (
    status = 'available' OR 
    seller_id = auth.uid()
  );

CREATE POLICY "tickets_insert_policy" ON public.tickets
  FOR INSERT WITH CHECK (seller_id = auth.uid());

CREATE POLICY "tickets_update_policy" ON public.tickets
  FOR UPDATE USING (seller_id = auth.uid());

-- Fix messages policies
DROP POLICY IF EXISTS "Users can view own messages" ON public.messages;
CREATE POLICY "messages_select_policy" ON public.messages
  FOR SELECT USING (sender_id = auth.uid() OR receiver_id = auth.uid());

CREATE POLICY "messages_insert_policy" ON public.messages
  FOR INSERT WITH CHECK (sender_id = auth.uid());

-- Fix notifications policies
DROP POLICY IF EXISTS "Users can view own notifications" ON public.notifications;
CREATE POLICY "notifications_select_policy" ON public.notifications
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "notifications_update_policy" ON public.notifications
  FOR UPDATE USING (user_id = auth.uid());
      `
    },

    storage_setup: {
      name: 'Storage Buckets Setup',
      description: 'Instructions for creating storage buckets',
      priority: 'medium',
      instructions: [
        '1. Go to Supabase Dashboard → Storage',
        '2. Create the following buckets:',
        '   - kyc-documents (Private)',
        '   - ticket-images (Private)', 
        '   - avatars (Public)',
        '   - message-attachments (Private)',
        '3. Set up storage policies for each bucket',
        '4. Test file upload functionality'
      ]
    },

    performance_indexes: {
      name: 'Performance Indexes',
      description: 'Add indexes for better query performance',
      priority: 'low',
      sql: `
-- Performance Indexes for TicketSwapper

-- Tickets table indexes
CREATE INDEX IF NOT EXISTS idx_tickets_status_verification ON public.tickets(status, verification_status);
CREATE INDEX IF NOT EXISTS idx_tickets_departure_date ON public.tickets(departure_date);
CREATE INDEX IF NOT EXISTS idx_tickets_from_to_location ON public.tickets(from_location, to_location);
CREATE INDEX IF NOT EXISTS idx_tickets_transport_mode_status ON public.tickets(transport_mode, status);

-- Messages table indexes
CREATE INDEX IF NOT EXISTS idx_messages_sender_receiver ON public.messages(sender_id, receiver_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON public.messages(created_at DESC);

-- Transactions table indexes
CREATE INDEX IF NOT EXISTS idx_transactions_status ON public.transactions(status);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON public.transactions(created_at DESC);

-- Notifications table indexes
CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON public.notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at DESC);

-- Verification tables indexes
CREATE INDEX IF NOT EXISTS idx_email_tokens_user_expires ON public.email_verification_tokens(user_id, expires_at);
CREATE INDEX IF NOT EXISTS idx_phone_otps_phone_expires ON public.phone_verification_otps(phone, expires_at);
      `
    }
  };

  const copySQL = (sql) => {
    navigator.clipboard.writeText(sql);
    toast({
      title: 'SQL Copied',
      description: 'Migration SQL has been copied to your clipboard'
    });
  };

  const downloadSQL = (sql, filename) => {
    const blob = new Blob([sql], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}.sql`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({
      title: 'SQL Downloaded',
      description: `${filename}.sql has been downloaded`
    });
  };

  const migration = migrations[selectedMigration];

  return (
    <div className="space-y-6 max-w-4xl mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Database Migration Helper
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Select and apply database migrations to fix common issues
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Migration Selection */}
          <div className="grid gap-3">
            {Object.entries(migrations).map(([key, mig]) => (
              <div
                key={key}
                className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                  selectedMigration === key 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => setSelectedMigration(key)}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">{mig.name}</h4>
                    <p className="text-sm text-gray-600">{mig.description}</p>
                  </div>
                  <Badge variant={
                    mig.priority === 'high' ? 'destructive' :
                    mig.priority === 'medium' ? 'default' : 'secondary'
                  }>
                    {mig.priority}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Selected Migration Details */}
      {migration && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                {migration.name}
              </div>
              <Badge variant={
                migration.priority === 'high' ? 'destructive' :
                migration.priority === 'medium' ? 'default' : 'secondary'
              }>
                {migration.priority} Priority
              </Badge>
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              {migration.description}
            </p>
          </CardHeader>
          
          <CardContent className="space-y-4">
            {migration.sql && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium">SQL Migration</h4>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copySQL(migration.sql)}
                    >
                      <Copy className="h-3 w-3 mr-1" />
                      Copy SQL
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => downloadSQL(migration.sql, selectedMigration)}
                    >
                      <Download className="h-3 w-3 mr-1" />
                      Download
                    </Button>
                  </div>
                </div>
                
                <Textarea
                  value={migration.sql}
                  readOnly
                  className="font-mono text-xs h-64 resize-none"
                />
              </div>
            )}

            {migration.instructions && (
              <div>
                <h4 className="font-medium mb-3">Manual Steps Required</h4>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <ol className="text-sm text-blue-800 space-y-1">
                    {migration.instructions.map((instruction, index) => (
                      <li key={index}>{instruction}</li>
                    ))}
                  </ol>
                </div>
              </div>
            )}

            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>Important:</strong> Always backup your database before running migrations. 
                Test in a development environment first.
              </AlertDescription>
            </Alert>

            <div className="flex gap-2">
              <Button
                onClick={() => window.open('https://supabase.com/dashboard', '_blank')}
                className="flex-1"
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Open Supabase Dashboard
              </Button>
              
              <Button
                variant="outline"
                onClick={() => window.open('https://supabase.com/docs/guides/database/overview', '_blank')}
                className="flex-1"
              >
                <FileText className="h-4 w-4 mr-2" />
                Database Docs
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Play className="h-5 w-5" />
            Quick Actions
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid gap-3 md:grid-cols-2">
            <Button
              variant="outline"
              onClick={() => copySQL(migrations.complete_schema.sql)}
              className="justify-start h-auto p-4"
            >
              <div className="text-left">
                <div className="font-medium">Copy Complete Schema</div>
                <div className="text-sm text-muted-foreground">
                  Get the full database setup SQL
                </div>
              </div>
            </Button>
            
            <Button
              variant="outline"
              onClick={() => copySQL(migrations.rls_fixes.sql)}
              className="justify-start h-auto p-4"
            >
              <div className="text-left">
                <div className="font-medium">Copy RLS Fixes</div>
                <div className="text-sm text-muted-foreground">
                  Fix Row Level Security issues
                </div>
              </div>
            </Button>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h4 className="font-medium text-green-900 mb-2">Recommended Migration Order:</h4>
            <ol className="text-sm text-green-800 space-y-1 ml-4 list-decimal">
              <li>Run "Complete Schema Setup" first</li>
              <li>Create storage buckets manually in dashboard</li>
              <li>Apply "RLS Policy Fixes" if needed</li>
              <li>Add "Performance Indexes" for optimization</li>
              <li>Test your application functionality</li>
            </ol>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};