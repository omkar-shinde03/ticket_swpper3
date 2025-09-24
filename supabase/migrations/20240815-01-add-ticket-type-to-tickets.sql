-- Migration: Add ticket_type to tickets table
ALTER TABLE public.tickets
ADD COLUMN ticket_type VARCHAR(20) NOT NULL DEFAULT 'bus' CHECK (ticket_type IN ('bus', 'train', 'plane'));

-- Optionally, backfill existing rows if needed (not required if NOT NULL with DEFAULT is used)
-- UPDATE public.tickets SET ticket_type = 'bus' WHERE ticket_type IS NULL;
