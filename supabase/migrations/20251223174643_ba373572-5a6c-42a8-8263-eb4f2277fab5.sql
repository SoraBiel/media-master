-- Add updated_by column to admin_settings if not exists
ALTER TABLE public.admin_settings 
ADD COLUMN IF NOT EXISTS updated_by uuid REFERENCES auth.users(id);