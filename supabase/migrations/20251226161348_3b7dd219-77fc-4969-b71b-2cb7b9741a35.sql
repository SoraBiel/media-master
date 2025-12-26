-- Tabela de integrações (Mercado Pago e futuras)
CREATE TABLE public.integrations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  provider TEXT NOT NULL DEFAULT 'mercadopago',
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  token_expires_at TIMESTAMP WITH TIME ZONE,
  provider_user_id TEXT,
  provider_email TEXT,
  provider_name TEXT,
  environment TEXT NOT NULL DEFAULT 'sandbox',
  status TEXT NOT NULL DEFAULT 'active',
  last_sync_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de produtos do funil
CREATE TABLE public.funnel_products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  funnel_id UUID NOT NULL REFERENCES public.funnels(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  price_cents INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'BRL',
  product_type TEXT NOT NULL DEFAULT 'digital',
  payment_method TEXT NOT NULL DEFAULT 'pix',
  delivery_type TEXT NOT NULL DEFAULT 'link',
  delivery_content TEXT,
  delivery_message TEXT,
  provider TEXT NOT NULL DEFAULT 'mercadopago',
  provider_product_id TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de pagamentos
CREATE TABLE public.funnel_payments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  funnel_id UUID NOT NULL REFERENCES public.funnels(id) ON DELETE SET NULL,
  product_id UUID REFERENCES public.funnel_products(id) ON DELETE SET NULL,
  user_id UUID NOT NULL,
  lead_chat_id TEXT,
  lead_name TEXT,
  provider TEXT NOT NULL DEFAULT 'mercadopago',
  provider_payment_id TEXT,
  amount_cents INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'BRL',
  status TEXT NOT NULL DEFAULT 'pending',
  pix_qrcode TEXT,
  pix_code TEXT,
  pix_expiration TIMESTAMP WITH TIME ZONE,
  paid_at TIMESTAMP WITH TIME ZONE,
  delivered_at TIMESTAMP WITH TIME ZONE,
  delivery_status TEXT DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Índices
CREATE INDEX idx_integrations_user_id ON public.integrations(user_id);
CREATE INDEX idx_integrations_provider ON public.integrations(provider);
CREATE UNIQUE INDEX idx_integrations_user_provider ON public.integrations(user_id, provider);

CREATE INDEX idx_funnel_products_funnel_id ON public.funnel_products(funnel_id);
CREATE INDEX idx_funnel_products_user_id ON public.funnel_products(user_id);

CREATE INDEX idx_funnel_payments_funnel_id ON public.funnel_payments(funnel_id);
CREATE INDEX idx_funnel_payments_product_id ON public.funnel_payments(product_id);
CREATE INDEX idx_funnel_payments_user_id ON public.funnel_payments(user_id);
CREATE INDEX idx_funnel_payments_status ON public.funnel_payments(status);
CREATE INDEX idx_funnel_payments_provider_id ON public.funnel_payments(provider_payment_id);

-- RLS para integrations
ALTER TABLE public.integrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own integrations"
ON public.integrations FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own integrations"
ON public.integrations FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own integrations"
ON public.integrations FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own integrations"
ON public.integrations FOR DELETE
USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all integrations"
ON public.integrations FOR ALL
USING (is_admin());

-- RLS para funnel_products
ALTER TABLE public.funnel_products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own products"
ON public.funnel_products FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own products"
ON public.funnel_products FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own products"
ON public.funnel_products FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own products"
ON public.funnel_products FOR DELETE
USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all products"
ON public.funnel_products FOR ALL
USING (is_admin());

-- RLS para funnel_payments
ALTER TABLE public.funnel_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own payments"
ON public.funnel_payments FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own payments"
ON public.funnel_payments FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own payments"
ON public.funnel_payments FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all payments"
ON public.funnel_payments FOR ALL
USING (is_admin());

-- Trigger para updated_at
CREATE TRIGGER update_integrations_updated_at
BEFORE UPDATE ON public.integrations
FOR EACH ROW
EXECUTE FUNCTION public.trigger_set_updated_at();

CREATE TRIGGER update_funnel_products_updated_at
BEFORE UPDATE ON public.funnel_products
FOR EACH ROW
EXECUTE FUNCTION public.trigger_set_updated_at();

CREATE TRIGGER update_funnel_payments_updated_at
BEFORE UPDATE ON public.funnel_payments
FOR EACH ROW
EXECUTE FUNCTION public.trigger_set_updated_at();