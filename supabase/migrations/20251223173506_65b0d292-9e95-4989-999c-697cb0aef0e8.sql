-- Create table to store admin settings/toggles
CREATE TABLE public.admin_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key text UNIQUE NOT NULL,
  setting_value boolean NOT NULL DEFAULT true,
  updated_at timestamp with time zone DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.admin_settings ENABLE ROW LEVEL SECURITY;

-- Everyone can read settings (needed for UI to know what's enabled)
CREATE POLICY "Anyone can read settings"
ON public.admin_settings
FOR SELECT
USING (true);

-- Only admins can update settings
CREATE POLICY "Admins can update settings"
ON public.admin_settings
FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));

-- Only admins can insert settings
CREATE POLICY "Admins can insert settings"
ON public.admin_settings
FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Insert default settings
INSERT INTO public.admin_settings (setting_key, setting_value) VALUES
  ('tiktok_enabled', true),
  ('models_enabled', true)
ON CONFLICT (setting_key) DO NOTHING;