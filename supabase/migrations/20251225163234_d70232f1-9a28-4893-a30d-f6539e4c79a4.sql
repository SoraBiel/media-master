-- WhatsApp Integration Tables

-- 1. WPP Accounts (credenciais por tenant)
CREATE TABLE public.wpp_accounts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  waba_id TEXT NOT NULL,
  phone_number_id TEXT NOT NULL,
  access_token TEXT NOT NULL,
  webhook_verify_token TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  phone_display TEXT,
  business_name TEXT,
  status TEXT DEFAULT 'pending',
  is_connected BOOLEAN DEFAULT false,
  last_validated_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 2. WPP Contacts
CREATE TABLE public.wpp_contacts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  wa_id TEXT NOT NULL,
  phone TEXT NOT NULL,
  name TEXT,
  profile_name TEXT,
  last_seen_at TIMESTAMP WITH TIME ZONE,
  opt_in_status TEXT DEFAULT 'unknown',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, wa_id)
);

-- 3. WPP Conversations
CREATE TABLE public.wpp_conversations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  wa_id TEXT NOT NULL,
  wpp_account_id UUID REFERENCES public.wpp_accounts(id) ON DELETE CASCADE,
  conversation_id TEXT,
  last_message_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  window_open_until TIMESTAMP WITH TIME ZONE,
  pricing_category TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 4. WPP Messages
CREATE TABLE public.wpp_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  wpp_account_id UUID REFERENCES public.wpp_accounts(id) ON DELETE CASCADE,
  wa_id TEXT NOT NULL,
  direction TEXT NOT NULL DEFAULT 'outbound',
  message_id TEXT,
  message_type TEXT DEFAULT 'text',
  status TEXT DEFAULT 'pending',
  payload JSONB DEFAULT '{}',
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 5. WPP Templates
CREATE TABLE public.wpp_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  wpp_account_id UUID REFERENCES public.wpp_accounts(id) ON DELETE CASCADE,
  template_name TEXT NOT NULL,
  template_id TEXT,
  language TEXT DEFAULT 'pt_BR',
  category TEXT DEFAULT 'UTILITY',
  status TEXT DEFAULT 'draft',
  components JSONB DEFAULT '[]',
  variables JSONB DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 6. WPP Sessions (para funis)
CREATE TABLE public.wpp_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  wpp_account_id UUID REFERENCES public.wpp_accounts(id) ON DELETE CASCADE,
  funnel_id UUID REFERENCES public.funnels(id) ON DELETE CASCADE,
  wa_id TEXT NOT NULL,
  chat_id TEXT NOT NULL,
  current_node_id TEXT,
  variables JSONB DEFAULT '{}',
  history JSONB DEFAULT '[]',
  is_finished BOOLEAN DEFAULT false,
  last_message_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 7. WPP Logs
CREATE TABLE public.wpp_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  wpp_account_id UUID,
  funnel_id UUID,
  session_id UUID,
  node_id TEXT,
  event_type TEXT NOT NULL,
  payload JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add channel column to funnels table
ALTER TABLE public.funnels 
ADD COLUMN IF NOT EXISTS channel TEXT DEFAULT 'telegram';

-- Add updated_at triggers
CREATE TRIGGER update_wpp_accounts_updated_at
  BEFORE UPDATE ON public.wpp_accounts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_wpp_contacts_updated_at
  BEFORE UPDATE ON public.wpp_contacts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_wpp_conversations_updated_at
  BEFORE UPDATE ON public.wpp_conversations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_wpp_messages_updated_at
  BEFORE UPDATE ON public.wpp_messages
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_wpp_templates_updated_at
  BEFORE UPDATE ON public.wpp_templates
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_wpp_sessions_updated_at
  BEFORE UPDATE ON public.wpp_sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

-- RLS Policies
ALTER TABLE public.wpp_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wpp_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wpp_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wpp_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wpp_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wpp_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wpp_logs ENABLE ROW LEVEL SECURITY;

-- WPP Accounts Policies
CREATE POLICY "Users can view their own wpp accounts" ON public.wpp_accounts
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own wpp accounts" ON public.wpp_accounts
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own wpp accounts" ON public.wpp_accounts
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own wpp accounts" ON public.wpp_accounts
  FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage all wpp accounts" ON public.wpp_accounts
  FOR ALL USING (is_admin());

-- WPP Contacts Policies
CREATE POLICY "Users can view their own wpp contacts" ON public.wpp_contacts
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own wpp contacts" ON public.wpp_contacts
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own wpp contacts" ON public.wpp_contacts
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own wpp contacts" ON public.wpp_contacts
  FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage all wpp contacts" ON public.wpp_contacts
  FOR ALL USING (is_admin());

-- WPP Conversations Policies
CREATE POLICY "Users can view their own wpp conversations" ON public.wpp_conversations
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own wpp conversations" ON public.wpp_conversations
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own wpp conversations" ON public.wpp_conversations
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own wpp conversations" ON public.wpp_conversations
  FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage all wpp conversations" ON public.wpp_conversations
  FOR ALL USING (is_admin());

-- WPP Messages Policies
CREATE POLICY "Users can view their own wpp messages" ON public.wpp_messages
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own wpp messages" ON public.wpp_messages
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own wpp messages" ON public.wpp_messages
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage all wpp messages" ON public.wpp_messages
  FOR ALL USING (is_admin());

-- WPP Templates Policies
CREATE POLICY "Users can view their own wpp templates" ON public.wpp_templates
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own wpp templates" ON public.wpp_templates
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own wpp templates" ON public.wpp_templates
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own wpp templates" ON public.wpp_templates
  FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage all wpp templates" ON public.wpp_templates
  FOR ALL USING (is_admin());

-- WPP Sessions Policies
CREATE POLICY "Users can view their wpp sessions" ON public.wpp_sessions
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage all wpp sessions" ON public.wpp_sessions
  FOR ALL USING (is_admin());

-- WPP Logs Policies
CREATE POLICY "Users can view their wpp logs" ON public.wpp_logs
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage all wpp logs" ON public.wpp_logs
  FOR ALL USING (is_admin());