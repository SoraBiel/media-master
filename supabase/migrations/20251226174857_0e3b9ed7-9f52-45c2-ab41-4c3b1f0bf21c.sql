-- Add reminded_at column to funnel_payments for tracking payment reminders
ALTER TABLE public.funnel_payments 
ADD COLUMN IF NOT EXISTS reminded_at timestamp with time zone DEFAULT NULL;