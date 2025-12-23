-- Enable realtime for destinations table
ALTER PUBLICATION supabase_realtime ADD TABLE public.destinations;

-- Enable realtime for admin_settings table
ALTER PUBLICATION supabase_realtime ADD TABLE public.admin_settings;