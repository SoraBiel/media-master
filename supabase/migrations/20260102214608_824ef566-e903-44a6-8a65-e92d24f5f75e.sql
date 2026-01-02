
-- Tabela de configurações do sistema de indicação
CREATE TABLE public.referral_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  is_enabled boolean NOT NULL DEFAULT true,
  default_commission_percent numeric(5,2) NOT NULL DEFAULT 20.00,
  commission_type text NOT NULL DEFAULT 'first_only' CHECK (commission_type IN ('first_only', 'recurring')),
  cookie_duration_days integer NOT NULL DEFAULT 30,
  min_payout_cents integer NOT NULL DEFAULT 5000,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Tabela de comissões por role (usando text ao invés de enum)
CREATE TABLE public.referral_role_commissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  role_name text NOT NULL UNIQUE,
  commission_percent numeric(5,2) NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Tabela de roles que têm acesso ao sistema de indicação
CREATE TABLE public.referral_allowed_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  role_name text NOT NULL UNIQUE,
  created_at timestamp with time zone DEFAULT now()
);

-- Tabela de indicações
CREATE TABLE public.referrals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id uuid NOT NULL,
  referred_id uuid NOT NULL UNIQUE,
  referral_code text NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'cancelled')),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT referrals_no_self_referral CHECK (referrer_id != referred_id)
);

-- Tabela de comissões
CREATE TABLE public.commissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  referral_id uuid NOT NULL REFERENCES public.referrals(id) ON DELETE CASCADE,
  referrer_id uuid NOT NULL,
  referred_id uuid NOT NULL,
  transaction_id uuid REFERENCES public.transactions(id),
  amount_cents integer NOT NULL,
  commission_percent numeric(5,2) NOT NULL,
  commission_cents integer NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'cancelled')),
  paid_at timestamp with time zone,
  paid_by uuid,
  notes text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Tabela de logs de auditoria do sistema de indicação
CREATE TABLE public.referral_audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  action text NOT NULL,
  entity_type text NOT NULL,
  entity_id uuid,
  user_id uuid,
  old_data jsonb,
  new_data jsonb,
  ip_address text,
  created_at timestamp with time zone DEFAULT now()
);

-- Inserir configuração padrão
INSERT INTO public.referral_settings (id, is_enabled, default_commission_percent, commission_type)
VALUES (gen_random_uuid(), true, 20.00, 'first_only');

-- Inserir role admin como permitido por padrão
INSERT INTO public.referral_allowed_roles (role_name) VALUES ('admin');

-- Enable RLS
ALTER TABLE public.referral_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referral_role_commissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referral_allowed_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.commissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referral_audit_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for referral_settings
CREATE POLICY "Anyone can read referral settings"
ON public.referral_settings FOR SELECT
USING (true);

CREATE POLICY "Admins can manage referral settings"
ON public.referral_settings FOR ALL
USING (is_admin());

-- RLS Policies for referral_role_commissions
CREATE POLICY "Anyone can read role commissions"
ON public.referral_role_commissions FOR SELECT
USING (true);

CREATE POLICY "Admins can manage role commissions"
ON public.referral_role_commissions FOR ALL
USING (is_admin());

-- RLS Policies for referral_allowed_roles
CREATE POLICY "Anyone can read allowed roles"
ON public.referral_allowed_roles FOR SELECT
USING (true);

CREATE POLICY "Admins can manage allowed roles"
ON public.referral_allowed_roles FOR ALL
USING (is_admin());

-- RLS Policies for referrals
CREATE POLICY "Users can view their own referrals as referrer"
ON public.referrals FOR SELECT
USING (auth.uid() = referrer_id);

CREATE POLICY "Admins can manage all referrals"
ON public.referrals FOR ALL
USING (is_admin());

CREATE POLICY "System can insert referrals"
ON public.referrals FOR INSERT
WITH CHECK (true);

-- RLS Policies for commissions
CREATE POLICY "Users can view their own commissions"
ON public.commissions FOR SELECT
USING (auth.uid() = referrer_id);

CREATE POLICY "Admins can manage all commissions"
ON public.commissions FOR ALL
USING (is_admin());

CREATE POLICY "System can insert commissions"
ON public.commissions FOR INSERT
WITH CHECK (true);

-- RLS Policies for audit logs
CREATE POLICY "Admins can view audit logs"
ON public.referral_audit_logs FOR SELECT
USING (is_admin());

CREATE POLICY "System can insert audit logs"
ON public.referral_audit_logs FOR INSERT
WITH CHECK (true);

-- Create indexes
CREATE INDEX idx_referrals_referrer ON public.referrals(referrer_id);
CREATE INDEX idx_referrals_referred ON public.referrals(referred_id);
CREATE INDEX idx_referrals_code ON public.referrals(referral_code);
CREATE INDEX idx_commissions_referrer ON public.commissions(referrer_id);
CREATE INDEX idx_commissions_status ON public.commissions(status);

-- Function to generate unique referral code
CREATE OR REPLACE FUNCTION public.generate_referral_code(p_user_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  code text;
BEGIN
  code := UPPER(SUBSTRING(p_user_id::text, 1, 8));
  RETURN code;
END;
$$;

-- Function to check if user can access referral system
CREATE OR REPLACE FUNCTION public.can_access_referrals(p_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if user has any of the allowed roles or is admin
  RETURN EXISTS (
    SELECT 1
    FROM public.user_roles ur
    JOIN public.referral_allowed_roles rar ON ur.role::text = rar.role_name
    WHERE ur.user_id = p_user_id
  ) OR public.has_role(p_user_id, 'admin');
END;
$$;

-- Enable realtime for relevant tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.referrals;
ALTER PUBLICATION supabase_realtime ADD TABLE public.commissions;
