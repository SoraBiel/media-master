-- Add runner_lock_expires_at column to campaigns table for atomic locking
ALTER TABLE public.campaigns 
ADD COLUMN IF NOT EXISTS runner_lock_expires_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;