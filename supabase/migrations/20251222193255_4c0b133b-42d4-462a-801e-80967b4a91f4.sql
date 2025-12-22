-- Add media_pack_id to campaigns table
ALTER TABLE public.campaigns 
ADD COLUMN IF NOT EXISTS media_pack_id uuid REFERENCES public.admin_media(id);

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_campaigns_media_pack_id ON public.campaigns(media_pack_id);