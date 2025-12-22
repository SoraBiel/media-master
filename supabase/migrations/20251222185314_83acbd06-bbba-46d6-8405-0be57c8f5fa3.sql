-- Atualizar app_role para incluir vendor
DROP TYPE IF EXISTS public.app_role CASCADE;
CREATE TYPE public.app_role AS ENUM ('admin', 'user', 'vendor');

-- Recriar tabela user_roles com o novo enum
DROP TABLE IF EXISTS public.user_roles CASCADE;
CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL DEFAULT 'user',
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE (user_id, role)
);

-- Habilitar RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Users can view their own roles" ON public.user_roles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all roles" ON public.user_roles
  FOR ALL USING (public.is_admin());

-- Adicionar campo is_suspended em profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_suspended boolean DEFAULT false;

-- Adicionar campos de entregável nas tabelas de produtos
ALTER TABLE public.tiktok_accounts ADD COLUMN IF NOT EXISTS deliverable_info text;
ALTER TABLE public.tiktok_accounts ADD COLUMN IF NOT EXISTS deliverable_login text;
ALTER TABLE public.tiktok_accounts ADD COLUMN IF NOT EXISTS deliverable_password text;
ALTER TABLE public.tiktok_accounts ADD COLUMN IF NOT EXISTS deliverable_email text;
ALTER TABLE public.tiktok_accounts ADD COLUMN IF NOT EXISTS deliverable_notes text;

ALTER TABLE public.models_for_sale ADD COLUMN IF NOT EXISTS deliverable_info text;
ALTER TABLE public.models_for_sale ADD COLUMN IF NOT EXISTS deliverable_link text;
ALTER TABLE public.models_for_sale ADD COLUMN IF NOT EXISTS deliverable_notes text;

-- Criar tabela de entregas (para registrar as entregas feitas após pagamento)
CREATE TABLE IF NOT EXISTS public.deliveries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  transaction_id uuid REFERENCES public.transactions(id),
  product_type text NOT NULL,
  product_id uuid NOT NULL,
  delivered_at timestamp with time zone DEFAULT now(),
  delivery_data jsonb,
  viewed_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.deliveries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own deliveries" ON public.deliveries
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all deliveries" ON public.deliveries
  FOR ALL USING (public.is_admin());

-- Criar storage buckets
INSERT INTO storage.buckets (id, name, public)
VALUES 
  ('media-packs', 'media-packs', true),
  ('product-images', 'product-images', true)
ON CONFLICT (id) DO NOTHING;

-- Políticas de storage para media-packs
CREATE POLICY "Anyone can view media-packs" ON storage.objects
  FOR SELECT USING (bucket_id = 'media-packs');

CREATE POLICY "Admins can upload to media-packs" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'media-packs' AND public.is_admin());

CREATE POLICY "Admins can update media-packs" ON storage.objects
  FOR UPDATE USING (bucket_id = 'media-packs' AND public.is_admin());

CREATE POLICY "Admins can delete from media-packs" ON storage.objects
  FOR DELETE USING (bucket_id = 'media-packs' AND public.is_admin());

-- Políticas de storage para product-images
CREATE POLICY "Anyone can view product-images" ON storage.objects
  FOR SELECT USING (bucket_id = 'product-images');

CREATE POLICY "Admins can upload to product-images" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'product-images' AND public.is_admin());

CREATE POLICY "Admins can update product-images" ON storage.objects
  FOR UPDATE USING (bucket_id = 'product-images' AND public.is_admin());

CREATE POLICY "Admins can delete from product-images" ON storage.objects
  FOR DELETE USING (bucket_id = 'product-images' AND public.is_admin());

-- Adicionar campo media_files na tabela admin_media (para armazenar URLs dos arquivos)
ALTER TABLE public.admin_media ADD COLUMN IF NOT EXISTS media_files jsonb DEFAULT '[]'::jsonb;

-- Re-inserir o admin que já existia
INSERT INTO public.user_roles (user_id, role)
SELECT 'e9d725fc-392b-4fe1-ba25-4710ecfa83ae', 'admin'
ON CONFLICT (user_id, role) DO NOTHING;