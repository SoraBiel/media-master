-- Create dashboard_banners table for promotional carousel
CREATE TABLE public.dashboard_banners (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT,
  description TEXT,
  image_url TEXT NOT NULL,
  link_url TEXT,
  link_text TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  priority INTEGER NOT NULL DEFAULT 0,
  starts_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.dashboard_banners ENABLE ROW LEVEL SECURITY;

-- Anyone can read active banners
CREATE POLICY "Anyone can read active banners"
ON public.dashboard_banners
FOR SELECT
USING (is_active = true AND (starts_at IS NULL OR starts_at <= now()) AND (expires_at IS NULL OR expires_at > now()));

-- Only admins can manage banners
CREATE POLICY "Admins can manage banners"
ON public.dashboard_banners
FOR ALL
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- Add updated_at trigger
CREATE TRIGGER update_dashboard_banners_updated_at
BEFORE UPDATE ON public.dashboard_banners
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at();