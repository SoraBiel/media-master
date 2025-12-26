-- Add group delivery columns to funnel_products
ALTER TABLE public.funnel_products 
ADD COLUMN IF NOT EXISTS group_chat_id text DEFAULT NULL,
ADD COLUMN IF NOT EXISTS group_invite_link text DEFAULT NULL;