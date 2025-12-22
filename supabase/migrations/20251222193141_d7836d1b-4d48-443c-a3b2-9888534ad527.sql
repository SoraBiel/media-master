-- Remove the unique constraint on user_id to allow multiple bots per user
ALTER TABLE public.telegram_integrations DROP CONSTRAINT IF EXISTS telegram_integrations_user_id_key;

-- Create an index for better performance on user_id lookups
CREATE INDEX IF NOT EXISTS idx_telegram_integrations_user_id ON public.telegram_integrations(user_id);