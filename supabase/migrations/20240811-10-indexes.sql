-- 11. Create indexes for performance
-- Tickets table indexes
CREATE INDEX IF NOT EXISTS idx_tickets_seller_id ON public.tickets(seller_id);
CREATE INDEX IF NOT EXISTS idx_tickets_status ON public.tickets(status);
CREATE INDEX IF NOT EXISTS idx_tickets_transport_mode ON public.tickets(transport_mode);
CREATE INDEX IF NOT EXISTS idx_tickets_status_verification ON public.tickets(status, verification_status);
CREATE INDEX IF NOT EXISTS idx_tickets_departure_date ON public.tickets(departure_date);
CREATE INDEX IF NOT EXISTS idx_tickets_from_to_location ON public.tickets(from_location, to_location);
CREATE INDEX IF NOT EXISTS idx_tickets_transport_mode_status ON public.tickets(transport_mode, status);

-- Messages table indexes
CREATE INDEX IF NOT EXISTS idx_messages_ticket_id ON public.messages(ticket_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_receiver ON public.messages(sender_id, receiver_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON public.messages(created_at DESC);

-- Transactions table indexes
CREATE INDEX IF NOT EXISTS idx_transactions_buyer_id ON public.transactions(buyer_id);
CREATE INDEX IF NOT EXISTS idx_transactions_seller_id ON public.transactions(seller_id);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON public.transactions(status);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON public.transactions(created_at DESC);

-- Notifications table indexes
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON public.notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at DESC);

-- Verification tables indexes
CREATE INDEX IF NOT EXISTS idx_email_tokens_user_expires ON public.email_verification_tokens(user_id, expires_at);
CREATE INDEX IF NOT EXISTS idx_phone_otps_phone_expires ON public.phone_verification_otps(phone, expires_at);
