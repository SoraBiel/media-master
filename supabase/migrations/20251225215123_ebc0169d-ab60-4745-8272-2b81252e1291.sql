-- Add whatsapp_enabled setting to admin_settings
INSERT INTO public.admin_settings (setting_key, setting_value)
VALUES ('whatsapp_enabled', true)
ON CONFLICT (setting_key) DO NOTHING;