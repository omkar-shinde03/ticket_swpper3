-- Fix missing 'terminal' column issue
-- The error suggests code is looking for 'terminal' column but the actual column is 'airport_terminal'

-- Option 1: Add a 'terminal' column as an alias to 'airport_terminal'
ALTER TABLE public.tickets 
ADD COLUMN IF NOT EXISTS terminal TEXT;

-- Update the terminal column to match airport_terminal for existing records
UPDATE public.tickets 
SET terminal = airport_terminal 
WHERE airport_terminal IS NOT NULL AND terminal IS NULL;

-- Create a trigger to keep terminal and airport_terminal in sync
CREATE OR REPLACE FUNCTION sync_terminal_columns()
RETURNS TRIGGER AS $$
BEGIN
  -- If terminal is updated, update airport_terminal
  IF TG_OP = 'UPDATE' AND NEW.terminal IS DISTINCT FROM OLD.terminal THEN
    NEW.airport_terminal = NEW.terminal;
  -- If airport_terminal is updated, update terminal
  ELSIF TG_OP = 'UPDATE' AND NEW.airport_terminal IS DISTINCT FROM OLD.airport_terminal THEN
    NEW.terminal = NEW.airport_terminal;
  -- For inserts, sync both columns
  ELSIF TG_OP = 'INSERT' THEN
    IF NEW.terminal IS NOT NULL AND NEW.airport_terminal IS NULL THEN
      NEW.airport_terminal = NEW.terminal;
    ELSIF NEW.airport_terminal IS NOT NULL AND NEW.terminal IS NULL THEN
      NEW.terminal = NEW.airport_terminal;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to keep columns in sync
DROP TRIGGER IF EXISTS sync_terminal_trigger ON public.tickets;
CREATE TRIGGER sync_terminal_trigger
  BEFORE INSERT OR UPDATE ON public.tickets
  FOR EACH ROW EXECUTE FUNCTION sync_terminal_columns();

-- Add comment to document the relationship
COMMENT ON COLUMN public.tickets.terminal IS 'Alias for airport_terminal - kept in sync via trigger';
COMMENT ON COLUMN public.tickets.airport_terminal IS 'Airport terminal information - kept in sync with terminal column via trigger';


