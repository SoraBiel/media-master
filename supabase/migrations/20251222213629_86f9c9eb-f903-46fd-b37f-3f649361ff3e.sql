-- Add statistics columns to campaigns table
ALTER TABLE public.campaigns 
ADD COLUMN IF NOT EXISTS success_count integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS error_count integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS errors_log jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS avg_send_time_ms integer DEFAULT 0;

-- Enable realtime for campaigns
ALTER PUBLICATION supabase_realtime ADD TABLE public.campaigns;