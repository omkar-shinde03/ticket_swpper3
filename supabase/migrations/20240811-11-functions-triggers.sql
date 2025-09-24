-- 12. Create essential functions
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
