-- Create telegram_integrations table for storing user bot tokens
CREATE TABLE public.telegram_integrations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  bot_token TEXT NOT NULL,
  bot_username TEXT,
  bot_name TEXT,
  chat_id TEXT,
  chat_title TEXT,
  is_connected BOOLEAN DEFAULT false,
  is_validated BOOLEAN DEFAULT false,
  last_validated_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.telegram_integrations ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own telegram integrations"
ON public.telegram_integrations FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own telegram integrations"
ON public.telegram_integrations FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own telegram integrations"
ON public.telegram_integrations FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own telegram integrations"
ON public.telegram_integrations FOR DELETE
USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all telegram integrations"
ON public.telegram_integrations FOR ALL
USING (is_admin());

-- Create user_events table for activity logging
CREATE TABLE public.user_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  event_type TEXT NOT NULL,
  event_data JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_events ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_events
CREATE POLICY "Users can view their own events"
ON public.user_events FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own events"
ON public.user_events FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all events"
ON public.user_events FOR SELECT
USING (is_admin());

-- Create catalog_purchases table
CREATE TABLE public.catalog_purchases (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  item_type TEXT NOT NULL, -- 'tiktok_account' or 'model'
  item_id UUID NOT NULL,
  amount_cents INTEGER NOT NULL,
  status TEXT DEFAULT 'pending', -- pending, paid, refunded
  payment_id TEXT,
  transaction_id UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.catalog_purchases ENABLE ROW LEVEL SECURITY;

-- RLS Policies for catalog_purchases
CREATE POLICY "Users can view their own purchases"
ON public.catalog_purchases FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own purchases"
ON public.catalog_purchases FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can manage all purchases"
ON public.catalog_purchases FOR ALL
USING (is_admin());

-- Create user_metrics table for dashboard stats
CREATE TABLE public.user_metrics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  total_actions INTEGER DEFAULT 0,
  telegram_integrations_active INTEGER DEFAULT 0,
  media_sent INTEGER DEFAULT 0,
  last_activity_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_metrics ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_metrics
CREATE POLICY "Users can view their own metrics"
ON public.user_metrics FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own metrics"
ON public.user_metrics FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own metrics"
ON public.user_metrics FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all metrics"
ON public.user_metrics FOR SELECT
USING (is_admin());

-- Create trigger to auto-create user_metrics on profile creation
CREATE OR REPLACE FUNCTION public.handle_new_profile_metrics()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_metrics (user_id)
  VALUES (NEW.user_id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_profile_created_metrics
  AFTER INSERT ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_profile_metrics();

-- Add realtime for telegram integrations and user metrics
ALTER PUBLICATION supabase_realtime ADD TABLE public.telegram_integrations;
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_metrics;