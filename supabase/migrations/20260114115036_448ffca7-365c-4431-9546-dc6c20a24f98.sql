-- Tabela de contas Google conectadas
CREATE TABLE public.multilogin_google_accounts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  display_name TEXT,
  avatar_url TEXT,
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  token_expires_at TIMESTAMPTZ,
  scopes TEXT[],
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'expired', 'revoked', 'error')),
  proxy_id UUID,
  context_id UUID DEFAULT gen_random_uuid(),
  last_used_at TIMESTAMPTZ,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, email)
);

-- Tabela de contas Facebook conectadas
CREATE TABLE public.multilogin_facebook_accounts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  facebook_user_id TEXT NOT NULL,
  email TEXT,
  display_name TEXT,
  avatar_url TEXT,
  access_token TEXT NOT NULL,
  token_expires_at TIMESTAMPTZ,
  business_manager_id TEXT,
  business_manager_name TEXT,
  permissions TEXT[],
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'expired', 'revoked', 'error')),
  proxy_id UUID,
  context_id UUID DEFAULT gen_random_uuid(),
  last_used_at TIMESTAMPTZ,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, facebook_user_id)
);

-- Tabela de contas Instagram Business vinculadas
CREATE TABLE public.multilogin_instagram_accounts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  facebook_account_id UUID REFERENCES public.multilogin_facebook_accounts(id) ON DELETE CASCADE,
  instagram_id TEXT NOT NULL,
  username TEXT NOT NULL,
  display_name TEXT,
  avatar_url TEXT,
  page_id TEXT,
  page_name TEXT,
  access_token TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'expired', 'revoked', 'error')),
  proxy_id UUID,
  context_id UUID DEFAULT gen_random_uuid(),
  last_used_at TIMESTAMPTZ,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, instagram_id)
);

-- Tabela de Proxies
CREATE TABLE public.multilogin_proxies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  protocol TEXT NOT NULL CHECK (protocol IN ('http', 'https', 'socks5')),
  host TEXT NOT NULL,
  port INTEGER NOT NULL,
  username TEXT,
  password TEXT,
  country TEXT,
  detected_ip TEXT,
  is_active BOOLEAN DEFAULT true,
  last_tested_at TIMESTAMPTZ,
  last_test_success BOOLEAN,
  test_error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabela de Workers/Tasks
CREATE TABLE public.multilogin_workers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  task_type TEXT NOT NULL CHECK (task_type IN ('publish', 'sync_metrics', 'webhook', 'automation', 'custom')),
  account_type TEXT NOT NULL CHECK (account_type IN ('google', 'facebook', 'instagram')),
  account_id UUID NOT NULL,
  proxy_id UUID REFERENCES public.multilogin_proxies(id) ON DELETE SET NULL,
  config JSONB DEFAULT '{}',
  schedule_cron TEXT,
  is_active BOOLEAN DEFAULT true,
  status TEXT DEFAULT 'idle' CHECK (status IN ('idle', 'running', 'error', 'paused')),
  last_run_at TIMESTAMPTZ,
  next_run_at TIMESTAMPTZ,
  run_count INTEGER DEFAULT 0,
  error_count INTEGER DEFAULT 0,
  last_error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabela de Logs de Multilogin
CREATE TABLE public.multilogin_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  account_type TEXT,
  account_id UUID,
  worker_id UUID REFERENCES public.multilogin_workers(id) ON DELETE SET NULL,
  proxy_id UUID REFERENCES public.multilogin_proxies(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL,
  action TEXT NOT NULL,
  ip_used TEXT,
  country TEXT,
  status TEXT CHECK (status IN ('success', 'error', 'warning', 'info')),
  message TEXT,
  details JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Adicionar foreign keys de proxy nas tabelas de contas
ALTER TABLE public.multilogin_google_accounts 
ADD CONSTRAINT fk_google_proxy FOREIGN KEY (proxy_id) REFERENCES public.multilogin_proxies(id) ON DELETE SET NULL;

ALTER TABLE public.multilogin_facebook_accounts 
ADD CONSTRAINT fk_facebook_proxy FOREIGN KEY (proxy_id) REFERENCES public.multilogin_proxies(id) ON DELETE SET NULL;

ALTER TABLE public.multilogin_instagram_accounts 
ADD CONSTRAINT fk_instagram_proxy FOREIGN KEY (proxy_id) REFERENCES public.multilogin_proxies(id) ON DELETE SET NULL;

-- Índices para performance
CREATE INDEX idx_multilogin_google_user ON public.multilogin_google_accounts(user_id);
CREATE INDEX idx_multilogin_facebook_user ON public.multilogin_facebook_accounts(user_id);
CREATE INDEX idx_multilogin_instagram_user ON public.multilogin_instagram_accounts(user_id);
CREATE INDEX idx_multilogin_proxies_user ON public.multilogin_proxies(user_id);
CREATE INDEX idx_multilogin_workers_user ON public.multilogin_workers(user_id);
CREATE INDEX idx_multilogin_logs_user ON public.multilogin_logs(user_id);
CREATE INDEX idx_multilogin_logs_created ON public.multilogin_logs(created_at DESC);

-- Enable RLS
ALTER TABLE public.multilogin_google_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.multilogin_facebook_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.multilogin_instagram_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.multilogin_proxies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.multilogin_workers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.multilogin_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies - Usuários podem ver/editar apenas seus próprios dados
CREATE POLICY "Users can manage own google accounts" ON public.multilogin_google_accounts
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own facebook accounts" ON public.multilogin_facebook_accounts
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own instagram accounts" ON public.multilogin_instagram_accounts
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own proxies" ON public.multilogin_proxies
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own workers" ON public.multilogin_workers
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view own logs" ON public.multilogin_logs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own logs" ON public.multilogin_logs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Admin policies
CREATE POLICY "Admins can view all google accounts" ON public.multilogin_google_accounts
  FOR SELECT USING (public.is_admin());

CREATE POLICY "Admins can view all facebook accounts" ON public.multilogin_facebook_accounts
  FOR SELECT USING (public.is_admin());

CREATE POLICY "Admins can view all instagram accounts" ON public.multilogin_instagram_accounts
  FOR SELECT USING (public.is_admin());

CREATE POLICY "Admins can view all proxies" ON public.multilogin_proxies
  FOR SELECT USING (public.is_admin());

CREATE POLICY "Admins can view all workers" ON public.multilogin_workers
  FOR SELECT USING (public.is_admin());

CREATE POLICY "Admins can view all logs" ON public.multilogin_logs
  FOR SELECT USING (public.is_admin());

-- Triggers para updated_at
CREATE TRIGGER update_multilogin_google_accounts_updated_at
  BEFORE UPDATE ON public.multilogin_google_accounts
  FOR EACH ROW EXECUTE FUNCTION public.trigger_set_updated_at();

CREATE TRIGGER update_multilogin_facebook_accounts_updated_at
  BEFORE UPDATE ON public.multilogin_facebook_accounts
  FOR EACH ROW EXECUTE FUNCTION public.trigger_set_updated_at();

CREATE TRIGGER update_multilogin_instagram_accounts_updated_at
  BEFORE UPDATE ON public.multilogin_instagram_accounts
  FOR EACH ROW EXECUTE FUNCTION public.trigger_set_updated_at();

CREATE TRIGGER update_multilogin_proxies_updated_at
  BEFORE UPDATE ON public.multilogin_proxies
  FOR EACH ROW EXECUTE FUNCTION public.trigger_set_updated_at();

CREATE TRIGGER update_multilogin_workers_updated_at
  BEFORE UPDATE ON public.multilogin_workers
  FOR EACH ROW EXECUTE FUNCTION public.trigger_set_updated_at();