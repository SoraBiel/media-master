-- Add more feature toggles
INSERT INTO public.admin_settings (setting_key, setting_value) VALUES
  ('campaigns_enabled', true),
  ('destinations_enabled', true),
  ('funnels_enabled', true),
  ('media_library_enabled', true)
ON CONFLICT (setting_key) DO NOTHING;