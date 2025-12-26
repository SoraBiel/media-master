-- Add payment reminder configuration to funnels
ALTER TABLE public.funnels 
ADD COLUMN IF NOT EXISTS payment_reminder_minutes integer DEFAULT 5;