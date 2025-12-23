-- Create table to store admin settings change history
CREATE TABLE public.admin_settings_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key text NOT NULL,
  old_value boolean,
  new_value boolean NOT NULL,
  changed_by uuid REFERENCES auth.users(id),
  changed_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.admin_settings_history ENABLE ROW LEVEL SECURITY;

-- Only admins can view the history
CREATE POLICY "Admins can view settings history"
ON public.admin_settings_history
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- Only admins can insert (logged automatically)
CREATE POLICY "Admins can insert settings history"
ON public.admin_settings_history
FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Create index for faster queries
CREATE INDEX idx_admin_settings_history_changed_at ON public.admin_settings_history(changed_at DESC);