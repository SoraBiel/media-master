-- Create function for updating timestamps if not exists
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create table for pixel warming configurations
CREATE TABLE public.pixel_warming_configs (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    platform TEXT NOT NULL CHECK (platform IN ('facebook', 'tiktok', 'kwai')),
    pixel_id TEXT NOT NULL,
    access_token TEXT,
    is_active BOOLEAN DEFAULT false,
    events_sent INTEGER DEFAULT 0,
    last_warmed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(user_id, platform)
);

-- Create table for warming event logs
CREATE TABLE public.pixel_warming_logs (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    config_id UUID REFERENCES public.pixel_warming_configs(id) ON DELETE CASCADE NOT NULL,
    user_id UUID NOT NULL,
    event_type TEXT NOT NULL,
    event_data JSONB,
    status TEXT DEFAULT 'pending',
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.pixel_warming_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pixel_warming_logs ENABLE ROW LEVEL SECURITY;

-- RLS policies for pixel_warming_configs
CREATE POLICY "Users can view their own warming configs" 
ON public.pixel_warming_configs 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own warming configs" 
ON public.pixel_warming_configs 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own warming configs" 
ON public.pixel_warming_configs 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own warming configs" 
ON public.pixel_warming_configs 
FOR DELETE 
USING (auth.uid() = user_id);

-- RLS policies for pixel_warming_logs
CREATE POLICY "Users can view their own warming logs" 
ON public.pixel_warming_logs 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own warming logs" 
ON public.pixel_warming_logs 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Create trigger for updated_at
CREATE TRIGGER update_pixel_warming_configs_updated_at
BEFORE UPDATE ON public.pixel_warming_configs
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();