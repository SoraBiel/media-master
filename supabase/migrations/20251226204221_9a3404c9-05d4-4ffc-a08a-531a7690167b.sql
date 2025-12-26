-- Adicionar coluna para armazenar o funil JSON junto com o modelo
ALTER TABLE public.models_for_sale
ADD COLUMN funnel_json jsonb DEFAULT NULL;

-- Comentário para documentação
COMMENT ON COLUMN public.models_for_sale.funnel_json IS 'JSON do funil que será importado para a conta do comprador';