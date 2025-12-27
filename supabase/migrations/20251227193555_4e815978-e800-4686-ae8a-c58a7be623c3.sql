-- ========================================
-- Tabela: Contas Sociais Conectadas
-- ========================================
CREATE TABLE public.social_accounts (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    platform TEXT NOT NULL CHECK (platform IN ('twitter', 'instagram', 'facebook', 'threads')),
    account_name TEXT,
    account_username TEXT,
    account_avatar_url TEXT,
    access_token TEXT,
    refresh_token TEXT,
    token_expires_at TIMESTAMP WITH TIME ZONE,
    platform_user_id TEXT,
    is_connected BOOLEAN DEFAULT false,
    last_used_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(user_id, platform, platform_user_id)
);

-- ========================================
-- Tabela: Posts Agendados
-- ========================================
CREATE TABLE public.scheduled_posts (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    content TEXT NOT NULL,
    media_urls JSONB DEFAULT '[]'::jsonb,
    platforms TEXT[] NOT NULL,
    scheduled_at TIMESTAMP WITH TIME ZONE,
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'processing', 'completed', 'failed', 'partial')),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- ========================================
-- Tabela: Logs de Publicação por Plataforma
-- ========================================
CREATE TABLE public.post_platform_logs (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    post_id UUID NOT NULL REFERENCES public.scheduled_posts(id) ON DELETE CASCADE,
    platform TEXT NOT NULL CHECK (platform IN ('twitter', 'instagram', 'facebook', 'threads')),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'success', 'failed', 'skipped')),
    platform_post_id TEXT,
    error_message TEXT,
    posted_at TIMESTAMP WITH TIME ZONE,
    retry_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- ========================================
-- Enable RLS
-- ========================================
ALTER TABLE public.social_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scheduled_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_platform_logs ENABLE ROW LEVEL SECURITY;

-- ========================================
-- RLS Policies: social_accounts
-- ========================================
CREATE POLICY "Users can view their own social accounts"
ON public.social_accounts FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own social accounts"
ON public.social_accounts FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own social accounts"
ON public.social_accounts FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own social accounts"
ON public.social_accounts FOR DELETE
USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all social accounts"
ON public.social_accounts FOR ALL
USING (is_admin());

-- ========================================
-- RLS Policies: scheduled_posts
-- ========================================
CREATE POLICY "Users can view their own posts"
ON public.scheduled_posts FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own posts"
ON public.scheduled_posts FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own posts"
ON public.scheduled_posts FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own posts"
ON public.scheduled_posts FOR DELETE
USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all posts"
ON public.scheduled_posts FOR ALL
USING (is_admin());

-- ========================================
-- RLS Policies: post_platform_logs
-- ========================================
CREATE POLICY "Users can view logs of their posts"
ON public.post_platform_logs FOR SELECT
USING (EXISTS (
    SELECT 1 FROM public.scheduled_posts
    WHERE scheduled_posts.id = post_platform_logs.post_id
    AND scheduled_posts.user_id = auth.uid()
));

CREATE POLICY "Admins can manage all logs"
ON public.post_platform_logs FOR ALL
USING (is_admin());

-- ========================================
-- Admin settings para automação
-- ========================================
INSERT INTO public.admin_settings (setting_key, setting_value)
VALUES 
    ('automation_module_enabled', true),
    ('automation_free_plan_access', false),
    ('automation_basic_plan_access', false),
    ('automation_pro_plan_access', true),
    ('automation_agency_plan_access', true)
ON CONFLICT (setting_key) DO NOTHING;

-- ========================================
-- Triggers para updated_at
-- ========================================
CREATE TRIGGER update_social_accounts_updated_at
BEFORE UPDATE ON public.social_accounts
FOR EACH ROW
EXECUTE FUNCTION public.trigger_set_updated_at();

CREATE TRIGGER update_scheduled_posts_updated_at
BEFORE UPDATE ON public.scheduled_posts
FOR EACH ROW
EXECUTE FUNCTION public.trigger_set_updated_at();

CREATE TRIGGER update_post_platform_logs_updated_at
BEFORE UPDATE ON public.post_platform_logs
FOR EACH ROW
EXECUTE FUNCTION public.trigger_set_updated_at();