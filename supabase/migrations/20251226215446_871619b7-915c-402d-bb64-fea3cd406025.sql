-- Add new vendor role types
-- First, we need to add new roles to the app_role enum
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'vendor_instagram';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'vendor_tiktok';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'vendor_model';

-- Note: The existing 'vendor' role will be the general vendor role