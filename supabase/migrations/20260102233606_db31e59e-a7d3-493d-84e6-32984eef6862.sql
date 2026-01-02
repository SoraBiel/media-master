-- Create a table to store text-based admin settings (like URLs, messages, etc.)
CREATE TABLE IF NOT EXISTS public.admin_text_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  setting_key TEXT NOT NULL UNIQUE,
  setting_value TEXT NOT NULL DEFAULT '',
  description TEXT,
  updated_by UUID,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.admin_text_settings ENABLE ROW LEVEL SECURITY;

-- Admins can manage text settings
CREATE POLICY "Admins can manage text settings"
  ON public.admin_text_settings
  FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

-- Anyone can read text settings
CREATE POLICY "Anyone can read text settings"
  ON public.admin_text_settings
  FOR SELECT
  USING (true);

-- Insert the smart link base URL setting
INSERT INTO public.admin_text_settings (setting_key, setting_value, description)
VALUES ('smart_link_base_url', '', 'URL base para os Smart Links que os leads recebem')
ON CONFLICT (setting_key) DO NOTHING;