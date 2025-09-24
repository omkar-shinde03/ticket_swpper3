-- Add buyer_id and sold_at columns to tickets table
-- This allows tracking who bought each ticket and when it was sold

-- Add buyer_id column to tickets table
ALTER TABLE public.tickets 
ADD COLUMN IF NOT EXISTS buyer_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- Add sold_at column to track when the ticket was sold
ALTER TABLE public.tickets 
ADD COLUMN IF NOT EXISTS sold_at TIMESTAMPTZ;

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_tickets_buyer_id ON public.tickets(buyer_id);

-- Add index for sold tickets
CREATE INDEX IF NOT EXISTS idx_tickets_sold_at ON public.tickets(sold_at) WHERE sold_at IS NOT NULL;
