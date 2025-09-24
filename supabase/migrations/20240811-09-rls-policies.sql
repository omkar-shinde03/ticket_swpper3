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
