-- Table for user destinations (groups/channels for spam)
CREATE TABLE public.destinations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  telegram_integration_id UUID REFERENCES public.telegram_integrations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  chat_id TEXT NOT NULL,
  chat_title TEXT,
  chat_type TEXT DEFAULT 'group',
  status TEXT DEFAULT 'pending',
  members_count INTEGER DEFAULT 0,
  last_sent_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.destinations ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own destinations" ON public.destinations FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own destinations" ON public.destinations FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own destinations" ON public.destinations FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own destinations" ON public.destinations FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage all destinations" ON public.destinations FOR ALL USING (is_admin());

-- Table for user campaigns  
CREATE TABLE public.campaigns (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  destination_id UUID REFERENCES public.destinations(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  status TEXT DEFAULT 'queued',
  progress INTEGER DEFAULT 0,
  sent_count INTEGER DEFAULT 0,
  total_count INTEGER DEFAULT 0,
  delay_seconds INTEGER DEFAULT 10,
  send_mode TEXT DEFAULT 'media',
  caption TEXT,
  error_message TEXT,
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  scheduled_start TIMESTAMP WITH TIME ZONE,
  scheduled_end TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;

-- RLS Policies  
CREATE POLICY "Users can view their own campaigns" ON public.campaigns FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own campaigns" ON public.campaigns FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own campaigns" ON public.campaigns FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own campaigns" ON public.campaigns FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage all campaigns" ON public.campaigns FOR ALL USING (is_admin());

-- Table for admin media (packs available by plan)
CREATE TABLE public.admin_media (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  pack_type TEXT NOT NULL DEFAULT '10k',
  min_plan TEXT NOT NULL DEFAULT 'basic',
  file_count INTEGER DEFAULT 0,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.admin_media ENABLE ROW LEVEL SECURITY;

-- RLS Policies - Anyone can view, only admins can manage
CREATE POLICY "Anyone can view admin media" ON public.admin_media FOR SELECT USING (true);
CREATE POLICY "Admins can manage admin media" ON public.admin_media FOR ALL USING (is_admin());

-- Trigger for updated_at
CREATE TRIGGER update_destinations_updated_at BEFORE UPDATE ON public.destinations FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_campaigns_updated_at BEFORE UPDATE ON public.campaigns FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_admin_media_updated_at BEFORE UPDATE ON public.admin_media FOR EACH ROW EXECUTE FUNCTION update_updated_at();