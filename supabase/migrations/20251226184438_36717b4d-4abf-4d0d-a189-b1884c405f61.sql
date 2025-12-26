-- Add UTM tracking fields to telegram_sessions
ALTER TABLE public.telegram_sessions 
ADD COLUMN IF NOT EXISTS utm_source text,
ADD COLUMN IF NOT EXISTS utm_medium text,
ADD COLUMN IF NOT EXISTS utm_campaign text,
ADD COLUMN IF NOT EXISTS utm_content text,
ADD COLUMN IF NOT EXISTS utm_term text,
ADD COLUMN IF NOT EXISTS fbclid text,
ADD COLUMN IF NOT EXISTS gclid text;

-- Add UTM tracking fields to funnel_payments for persistence
ALTER TABLE public.funnel_payments
ADD COLUMN IF NOT EXISTS utm_source text,
ADD COLUMN IF NOT EXISTS utm_medium text,
ADD COLUMN IF NOT EXISTS utm_campaign text,
ADD COLUMN IF NOT EXISTS utm_content text,
ADD COLUMN IF NOT EXISTS utm_term text,
ADD COLUMN IF NOT EXISTS fbclid text,
ADD COLUMN IF NOT EXISTS gclid text;

-- Add tracking_enabled and api_token fields to integrations for UTMify
ALTER TABLE public.integrations
ADD COLUMN IF NOT EXISTS tracking_enabled boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS api_token text;

-- Create index for faster UTMify integration lookup
CREATE INDEX IF NOT EXISTS idx_integrations_provider_tracking 
ON public.integrations (user_id, provider) 
WHERE provider = 'utmify' AND tracking_enabled = true;