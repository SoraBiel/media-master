-- Create funnel_templates table for pre-made templates
CREATE TABLE IF NOT EXISTS public.funnel_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL DEFAULT 'general',
  schema_version INTEGER NOT NULL DEFAULT 1,
  template_version INTEGER NOT NULL DEFAULT 1,
  nodes JSONB NOT NULL DEFAULT '[]'::jsonb,
  edges JSONB NOT NULL DEFAULT '[]'::jsonb,
  variables JSONB DEFAULT '[]'::jsonb,
  is_free BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on funnel_templates
ALTER TABLE public.funnel_templates ENABLE ROW LEVEL SECURITY;

-- Anyone can view active templates
CREATE POLICY "Anyone can view active templates"
  ON public.funnel_templates
  FOR SELECT
  USING (is_active = true);

-- Admins can manage templates
CREATE POLICY "Admins can manage templates"
  ON public.funnel_templates
  FOR ALL
  USING (is_admin());

-- Create telegram_sessions table for funnel execution
CREATE TABLE IF NOT EXISTS public.telegram_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  funnel_id UUID NOT NULL REFERENCES public.funnels(id) ON DELETE CASCADE,
  chat_id TEXT NOT NULL,
  telegram_user_id TEXT,
  current_node_id TEXT,
  variables JSONB DEFAULT '{}'::jsonb,
  history JSONB DEFAULT '[]'::jsonb,
  is_finished BOOLEAN DEFAULT false,
  last_message_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on telegram_sessions
ALTER TABLE public.telegram_sessions ENABLE ROW LEVEL SECURITY;

-- Admins can manage all sessions
CREATE POLICY "Admins can manage all sessions"
  ON public.telegram_sessions
  FOR ALL
  USING (is_admin());

-- Users can view sessions for their funnels
CREATE POLICY "Users can view their funnel sessions"
  ON public.telegram_sessions
  FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.funnels
    WHERE funnels.id = telegram_sessions.funnel_id
    AND funnels.user_id = auth.uid()
  ));

-- Create telegram_logs table for execution logging
CREATE TABLE IF NOT EXISTS public.telegram_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES public.telegram_sessions(id) ON DELETE CASCADE,
  funnel_id UUID REFERENCES public.funnels(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  node_id TEXT,
  payload JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on telegram_logs
ALTER TABLE public.telegram_logs ENABLE ROW LEVEL SECURITY;

-- Admins can manage all logs
CREATE POLICY "Admins can manage all logs"
  ON public.telegram_logs
  FOR ALL
  USING (is_admin());

-- Users can view logs for their funnels
CREATE POLICY "Users can view their funnel logs"
  ON public.telegram_logs
  FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.funnels
    WHERE funnels.id = telegram_logs.funnel_id
    AND funnels.user_id = auth.uid()
  ));

-- Add schema_version and trigger_keywords to funnels table
ALTER TABLE public.funnels 
ADD COLUMN IF NOT EXISTS schema_version INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS trigger_keywords TEXT[] DEFAULT ARRAY['/start']::TEXT[],
ADD COLUMN IF NOT EXISTS webhook_registered BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS webhook_url TEXT;

-- Create updated_at trigger function if not exists
CREATE OR REPLACE FUNCTION public.trigger_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Add updated_at triggers
CREATE TRIGGER set_telegram_sessions_updated_at
  BEFORE UPDATE ON public.telegram_sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_set_updated_at();

-- Enable realtime for telegram_sessions and telegram_logs
ALTER PUBLICATION supabase_realtime ADD TABLE public.telegram_sessions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.telegram_logs;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_telegram_sessions_funnel_id ON public.telegram_sessions(funnel_id);
CREATE INDEX IF NOT EXISTS idx_telegram_sessions_chat_id ON public.telegram_sessions(chat_id);
CREATE INDEX IF NOT EXISTS idx_telegram_logs_session_id ON public.telegram_logs(session_id);
CREATE INDEX IF NOT EXISTS idx_telegram_logs_funnel_id ON public.telegram_logs(funnel_id);