-- Add pack_size column to campaigns table for sending media in batches
ALTER TABLE public.campaigns 
ADD COLUMN IF NOT EXISTS pack_size integer DEFAULT 1;

-- Add comment for clarity
COMMENT ON COLUMN public.campaigns.pack_size IS 'Number of media items to send per batch (1, 2, or 5)';