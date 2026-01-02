-- Add custom domain for referral links
ALTER TABLE public.referral_settings
ADD COLUMN IF NOT EXISTS referral_base_url text DEFAULT NULL;

-- Add comment
COMMENT ON COLUMN public.referral_settings.referral_base_url IS 'Custom base URL for referral links (e.g., https://nexo.com.br/r)';