-- Add 'gerente_contas' role to the app_role enum
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'gerente_contas';