-- Create telegram_groups table for selling Telegram groups/channels
CREATE TABLE public.telegram_groups (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  group_name TEXT NOT NULL,
  group_username TEXT,
  members_count INTEGER DEFAULT 0,
  description TEXT,
  niche TEXT,
  price_cents INTEGER NOT NULL,
  is_verified BOOLEAN DEFAULT false,
  is_sold BOOLEAN DEFAULT false,
  image_url TEXT,
  group_type TEXT DEFAULT 'group', -- 'group' or 'channel'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_by UUID,
  sold_at TIMESTAMP WITH TIME ZONE,
  sold_to_user_id UUID,
  -- Deliverable info (admin fills after sale)
  deliverable_info TEXT,
  deliverable_notes TEXT,
  deliverable_invite_link TEXT
);

-- Enable RLS
ALTER TABLE public.telegram_groups ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Admins can manage all telegram groups"
  ON public.telegram_groups
  FOR ALL
  USING (is_admin());

CREATE POLICY "Anyone can view available telegram groups"
  ON public.telegram_groups
  FOR SELECT
  USING (is_sold = false);

CREATE POLICY "Users can view their purchased telegram groups"
  ON public.telegram_groups
  FOR SELECT
  USING (sold_to_user_id = auth.uid());

-- Add telegram_groups_enabled to admin_settings
INSERT INTO public.admin_settings (setting_key, setting_value)
VALUES ('telegram_groups_enabled', true)
ON CONFLICT (setting_key) DO NOTHING;