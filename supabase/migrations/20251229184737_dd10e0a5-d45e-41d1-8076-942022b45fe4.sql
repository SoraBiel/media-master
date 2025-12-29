-- Add auto remarketing fields to funnels table
ALTER TABLE public.funnels 
ADD COLUMN IF NOT EXISTS auto_remarketing_enabled boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS auto_remarketing_message text DEFAULT NULL;