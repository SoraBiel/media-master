-- Add destination_url column to cloaker_media table
ALTER TABLE public.cloaker_media 
ADD COLUMN IF NOT EXISTS destination_url TEXT DEFAULT NULL;

-- Add comment
COMMENT ON COLUMN public.cloaker_media.destination_url IS 'URL da página de destino do seller para redirecionamento de usuários reais';