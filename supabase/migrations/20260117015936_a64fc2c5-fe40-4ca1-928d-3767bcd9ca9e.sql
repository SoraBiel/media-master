-- Table for media cloaker links
CREATE TABLE public.cloaker_media (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  media_type TEXT NOT NULL DEFAULT 'image', -- 'image' or 'video'
  
  -- Safe media (shown to bots/reviewers)
  safe_url TEXT,
  safe_file_path TEXT,
  
  -- Offer media (shown to real users)
  offer_url TEXT,
  offer_file_path TEXT,
  
  -- Blocking options
  is_active BOOLEAN DEFAULT true,
  block_bots BOOLEAN DEFAULT true,
  block_vpn BOOLEAN DEFAULT false,
  allowed_countries TEXT[] DEFAULT NULL,
  
  -- Stats
  total_views INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Table for media cloaker views/analytics
CREATE TABLE public.cloaker_media_views (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  media_id UUID NOT NULL REFERENCES public.cloaker_media(id) ON DELETE CASCADE,
  
  -- Visitor info
  ip_address TEXT,
  user_agent TEXT,
  country TEXT,
  city TEXT,
  device_type TEXT,
  browser TEXT,
  os TEXT,
  
  -- Detection
  is_bot BOOLEAN DEFAULT false,
  is_vpn BOOLEAN DEFAULT false,
  was_blocked BOOLEAN DEFAULT false,
  served_type TEXT, -- 'safe' or 'offer'
  
  -- Referrer
  referrer TEXT,
  
  viewed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for performance
CREATE INDEX idx_cloaker_media_user_id ON public.cloaker_media(user_id);
CREATE INDEX idx_cloaker_media_slug ON public.cloaker_media(slug);
CREATE INDEX idx_cloaker_media_views_media_id ON public.cloaker_media_views(media_id);
CREATE INDEX idx_cloaker_media_views_viewed_at ON public.cloaker_media_views(viewed_at);

-- Enable RLS
ALTER TABLE public.cloaker_media ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cloaker_media_views ENABLE ROW LEVEL SECURITY;

-- RLS Policies for cloaker_media
CREATE POLICY "Users can view their own media cloaker entries"
ON public.cloaker_media FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own media cloaker entries"
ON public.cloaker_media FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own media cloaker entries"
ON public.cloaker_media FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own media cloaker entries"
ON public.cloaker_media FOR DELETE
USING (auth.uid() = user_id);

-- Public can view media by slug (for serving)
CREATE POLICY "Public can view active media by slug"
ON public.cloaker_media FOR SELECT
USING (is_active = true);

-- RLS Policies for cloaker_media_views
CREATE POLICY "Users can view their own media views"
ON public.cloaker_media_views FOR SELECT
USING (
  media_id IN (SELECT id FROM public.cloaker_media WHERE user_id = auth.uid())
);

-- Public can insert views (anonymous tracking)
CREATE POLICY "Public can insert media views"
ON public.cloaker_media_views FOR INSERT
WITH CHECK (true);

-- Updated_at trigger
CREATE TRIGGER update_cloaker_media_updated_at
  BEFORE UPDATE ON public.cloaker_media
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

-- Storage bucket for cloaker media files
INSERT INTO storage.buckets (id, name, public)
VALUES ('cloaker-media', 'cloaker-media', true)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS policies
CREATE POLICY "Users can upload their own cloaker media"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'cloaker-media' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update their own cloaker media"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'cloaker-media' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own cloaker media"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'cloaker-media' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Public can view cloaker media"
ON storage.objects FOR SELECT
USING (bucket_id = 'cloaker-media');