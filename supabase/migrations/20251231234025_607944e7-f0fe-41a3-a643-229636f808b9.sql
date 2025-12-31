-- Smart Links module tables

-- Table for user's smart link pages
CREATE TABLE public.smart_link_pages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  description TEXT,
  avatar_url TEXT,
  background_color TEXT DEFAULT '#1a1a2e',
  text_color TEXT DEFAULT '#ffffff',
  button_style TEXT DEFAULT 'rounded',
  is_active BOOLEAN DEFAULT true,
  
  -- Pixels
  meta_pixel_id TEXT,
  google_analytics_id TEXT,
  tiktok_pixel_id TEXT,
  
  -- Stats
  total_views INTEGER DEFAULT 0,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table for buttons/links on each page
CREATE TABLE public.smart_link_buttons (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  page_id UUID NOT NULL REFERENCES public.smart_link_pages(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  
  title TEXT NOT NULL,
  url TEXT,
  icon TEXT,
  position INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  
  -- Integration with funnels
  funnel_id UUID REFERENCES public.funnels(id) ON DELETE SET NULL,
  funnel_tag TEXT,
  
  -- Event tracking
  event_name TEXT,
  
  -- Stats
  click_count INTEGER DEFAULT 0,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table for tracking clicks with UTM data
CREATE TABLE public.smart_link_clicks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  button_id UUID NOT NULL REFERENCES public.smart_link_buttons(id) ON DELETE CASCADE,
  page_id UUID NOT NULL REFERENCES public.smart_link_pages(id) ON DELETE CASCADE,
  
  -- UTM tracking
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  utm_content TEXT,
  utm_term TEXT,
  
  -- Additional tracking
  referrer TEXT,
  user_agent TEXT,
  ip_address TEXT,
  country TEXT,
  
  clicked_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table for page views
CREATE TABLE public.smart_link_views (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  page_id UUID NOT NULL REFERENCES public.smart_link_pages(id) ON DELETE CASCADE,
  
  -- UTM tracking
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  utm_content TEXT,
  utm_term TEXT,
  
  referrer TEXT,
  user_agent TEXT,
  
  viewed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.smart_link_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.smart_link_buttons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.smart_link_clicks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.smart_link_views ENABLE ROW LEVEL SECURITY;

-- Policies for smart_link_pages
CREATE POLICY "Users can view their own pages"
ON public.smart_link_pages FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own pages"
ON public.smart_link_pages FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own pages"
ON public.smart_link_pages FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own pages"
ON public.smart_link_pages FOR DELETE
USING (auth.uid() = user_id);

CREATE POLICY "Anyone can view active pages by slug"
ON public.smart_link_pages FOR SELECT
USING (is_active = true);

CREATE POLICY "Admins can manage all pages"
ON public.smart_link_pages FOR ALL
USING (is_admin());

-- Policies for smart_link_buttons
CREATE POLICY "Users can view their own buttons"
ON public.smart_link_buttons FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own buttons"
ON public.smart_link_buttons FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own buttons"
ON public.smart_link_buttons FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own buttons"
ON public.smart_link_buttons FOR DELETE
USING (auth.uid() = user_id);

CREATE POLICY "Anyone can view active buttons of active pages"
ON public.smart_link_buttons FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.smart_link_pages 
  WHERE id = page_id AND is_active = true
) AND is_active = true);

CREATE POLICY "Admins can manage all buttons"
ON public.smart_link_buttons FOR ALL
USING (is_admin());

-- Policies for smart_link_clicks (public insert, owner select)
CREATE POLICY "Anyone can insert clicks"
ON public.smart_link_clicks FOR INSERT
WITH CHECK (true);

CREATE POLICY "Users can view clicks on their pages"
ON public.smart_link_clicks FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.smart_link_pages 
  WHERE id = page_id AND user_id = auth.uid()
));

CREATE POLICY "Admins can manage all clicks"
ON public.smart_link_clicks FOR ALL
USING (is_admin());

-- Policies for smart_link_views (public insert, owner select)
CREATE POLICY "Anyone can insert views"
ON public.smart_link_views FOR INSERT
WITH CHECK (true);

CREATE POLICY "Users can view their page views"
ON public.smart_link_views FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.smart_link_pages 
  WHERE id = page_id AND user_id = auth.uid()
));

CREATE POLICY "Admins can manage all views"
ON public.smart_link_views FOR ALL
USING (is_admin());

-- Trigger for updated_at
CREATE TRIGGER update_smart_link_pages_updated_at
BEFORE UPDATE ON public.smart_link_pages
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_smart_link_buttons_updated_at
BEFORE UPDATE ON public.smart_link_buttons
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- Add smart_links_enabled to admin_settings
INSERT INTO public.admin_settings (setting_key, setting_value)
VALUES ('smart_links_enabled', true)
ON CONFLICT (setting_key) DO NOTHING;

-- Enable realtime for clicks tracking
ALTER PUBLICATION supabase_realtime ADD TABLE public.smart_link_clicks;
ALTER PUBLICATION supabase_realtime ADD TABLE public.smart_link_views;