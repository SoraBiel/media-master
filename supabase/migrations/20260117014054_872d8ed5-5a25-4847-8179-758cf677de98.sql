-- =====================
-- CLOAKER TABLES
-- =====================

-- Table for cloaker links
CREATE TABLE public.cloaker_links (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  safe_url TEXT NOT NULL,
  offer_url TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  block_vpn BOOLEAN DEFAULT true,
  block_bots BOOLEAN DEFAULT true,
  allowed_countries TEXT[] DEFAULT ARRAY['BR'],
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table for cloaker click logs
CREATE TABLE public.cloaker_clicks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  link_id UUID NOT NULL REFERENCES public.cloaker_links(id) ON DELETE CASCADE,
  ip_address TEXT,
  user_agent TEXT,
  country TEXT,
  city TEXT,
  device_type TEXT,
  browser TEXT,
  os TEXT,
  is_bot BOOLEAN DEFAULT false,
  is_vpn BOOLEAN DEFAULT false,
  was_blocked BOOLEAN DEFAULT false,
  redirect_target TEXT,
  referrer TEXT,
  clicked_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- =====================
-- UTM TRACKING TABLES
-- =====================

-- Table for user's UTM tracking pixel settings
CREATE TABLE public.utm_pixels (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  pixel_id TEXT NOT NULL UNIQUE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table for UTM tracking events (page views, conversions, etc.)
CREATE TABLE public.utm_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  pixel_id TEXT NOT NULL,
  event_type TEXT NOT NULL DEFAULT 'pageview',
  page_url TEXT,
  referrer TEXT,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  utm_content TEXT,
  utm_term TEXT,
  fbclid TEXT,
  gclid TEXT,
  ip_address TEXT,
  user_agent TEXT,
  country TEXT,
  device_type TEXT,
  browser TEXT,
  os TEXT,
  session_id TEXT,
  event_value NUMERIC,
  event_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- =====================
-- INDEXES
-- =====================

CREATE INDEX idx_cloaker_links_user_id ON public.cloaker_links(user_id);
CREATE INDEX idx_cloaker_links_slug ON public.cloaker_links(slug);
CREATE INDEX idx_cloaker_clicks_link_id ON public.cloaker_clicks(link_id);
CREATE INDEX idx_cloaker_clicks_clicked_at ON public.cloaker_clicks(clicked_at);
CREATE INDEX idx_utm_events_pixel_id ON public.utm_events(pixel_id);
CREATE INDEX idx_utm_events_created_at ON public.utm_events(created_at);
CREATE INDEX idx_utm_events_utm_source ON public.utm_events(utm_source);

-- =====================
-- RLS POLICIES
-- =====================

ALTER TABLE public.cloaker_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cloaker_clicks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.utm_pixels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.utm_events ENABLE ROW LEVEL SECURITY;

-- Cloaker Links: users can manage their own links
CREATE POLICY "Users can view their own cloaker links"
  ON public.cloaker_links FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own cloaker links"
  ON public.cloaker_links FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own cloaker links"
  ON public.cloaker_links FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own cloaker links"
  ON public.cloaker_links FOR DELETE
  USING (auth.uid() = user_id);

-- Cloaker Clicks: users can view clicks on their own links
CREATE POLICY "Users can view clicks on their own links"
  ON public.cloaker_clicks FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.cloaker_links
      WHERE id = cloaker_clicks.link_id AND user_id = auth.uid()
    )
  );

-- Allow public insert for click tracking (anonymous)
CREATE POLICY "Public can insert cloaker clicks"
  ON public.cloaker_clicks FOR INSERT
  WITH CHECK (true);

-- UTM Pixels: users can manage their own pixel
CREATE POLICY "Users can view their own utm pixels"
  ON public.utm_pixels FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own utm pixel"
  ON public.utm_pixels FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own utm pixel"
  ON public.utm_pixels FOR UPDATE
  USING (auth.uid() = user_id);

-- UTM Events: users can view events for their pixel
CREATE POLICY "Users can view their own utm events"
  ON public.utm_events FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.utm_pixels
      WHERE pixel_id = utm_events.pixel_id AND user_id = auth.uid()
    )
  );

-- Allow public insert for event tracking (anonymous from pixel)
CREATE POLICY "Public can insert utm events"
  ON public.utm_events FOR INSERT
  WITH CHECK (true);

-- =====================
-- ADMIN SETTINGS
-- =====================

INSERT INTO public.admin_settings (setting_key, setting_value)
VALUES 
  ('cloaker_enabled', true),
  ('utm_tracking_enabled', true)
ON CONFLICT (setting_key) DO NOTHING;

-- =====================
-- TRIGGERS
-- =====================

CREATE TRIGGER update_cloaker_links_updated_at
  BEFORE UPDATE ON public.cloaker_links
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_utm_pixels_updated_at
  BEFORE UPDATE ON public.utm_pixels
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();