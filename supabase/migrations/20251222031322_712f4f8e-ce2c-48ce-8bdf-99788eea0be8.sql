-- Create role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

-- Create plan enum
CREATE TYPE public.plan_type AS ENUM ('free', 'basic', 'pro', 'agency');

-- Create subscription status enum
CREATE TYPE public.subscription_status AS ENUM ('active', 'pending', 'cancelled', 'expired');

-- Create transaction status enum
CREATE TYPE public.transaction_status AS ENUM ('pending', 'paid', 'failed', 'refunded');

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  phone TEXT,
  avatar_url TEXT,
  current_plan plan_type DEFAULT 'free',
  onboarding_completed BOOLEAN DEFAULT false,
  last_seen_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  is_online BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create user roles table (separate from profiles for security)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL DEFAULT 'user',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, role)
);

-- Create plans table
CREATE TABLE public.plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug plan_type NOT NULL UNIQUE,
  price_cents INTEGER NOT NULL DEFAULT 0,
  description TEXT,
  features JSONB DEFAULT '[]',
  max_destinations INTEGER DEFAULT 1,
  max_media_per_month INTEGER DEFAULT 100,
  has_scheduling BOOLEAN DEFAULT false,
  has_ai_models BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create subscriptions table
CREATE TABLE public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_id UUID NOT NULL REFERENCES public.plans(id),
  status subscription_status DEFAULT 'pending',
  started_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create transactions table
CREATE TABLE public.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  external_id TEXT NOT NULL UNIQUE,
  buckpay_id TEXT,
  amount_cents INTEGER NOT NULL,
  net_amount_cents INTEGER,
  status transaction_status DEFAULT 'pending',
  payment_method TEXT DEFAULT 'pix',
  pix_code TEXT,
  pix_qrcode_base64 TEXT,
  product_type TEXT, -- 'subscription', 'tiktok_account', 'model'
  product_id UUID,
  buyer_name TEXT,
  buyer_email TEXT,
  buyer_phone TEXT,
  buyer_document TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create TikTok accounts for sale table
CREATE TABLE public.tiktok_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username TEXT NOT NULL,
  followers INTEGER DEFAULT 0,
  likes INTEGER DEFAULT 0,
  description TEXT,
  niche TEXT,
  price_cents INTEGER NOT NULL,
  is_verified BOOLEAN DEFAULT false,
  is_sold BOOLEAN DEFAULT false,
  sold_to_user_id UUID REFERENCES auth.users(id),
  sold_at TIMESTAMP WITH TIME ZONE,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- Create models for sale table
CREATE TABLE public.models_for_sale (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  bio TEXT,
  niche TEXT,
  category TEXT DEFAULT 'ia', -- 'ia' or 'black'
  price_cents INTEGER NOT NULL,
  image_url TEXT,
  assets JSONB DEFAULT '[]',
  scripts JSONB DEFAULT '[]',
  is_sold BOOLEAN DEFAULT false,
  sold_to_user_id UUID REFERENCES auth.users(id),
  sold_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- Create user activity log (for admin dashboard)
CREATE TABLE public.user_activity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  details JSONB,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create checkout sessions table
CREATE TABLE public.checkout_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_type TEXT NOT NULL,
  product_id UUID,
  amount_cents INTEGER NOT NULL,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT now() + INTERVAL '30 minutes'
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tiktok_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.models_for_sale ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_activity ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.checkout_sessions ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Create function to check if current user is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_role(auth.uid(), 'admin')
$$;

-- RLS Policies for profiles
CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all profiles" ON public.profiles
  FOR SELECT USING (public.is_admin());

CREATE POLICY "Admins can update all profiles" ON public.profiles
  FOR UPDATE USING (public.is_admin());

-- RLS Policies for user_roles
CREATE POLICY "Users can view their own roles" ON public.user_roles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all roles" ON public.user_roles
  FOR ALL USING (public.is_admin());

-- RLS Policies for plans (public read)
CREATE POLICY "Anyone can view active plans" ON public.plans
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage plans" ON public.plans
  FOR ALL USING (public.is_admin());

-- RLS Policies for subscriptions
CREATE POLICY "Users can view their own subscriptions" ON public.subscriptions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all subscriptions" ON public.subscriptions
  FOR SELECT USING (public.is_admin());

CREATE POLICY "Admins can manage subscriptions" ON public.subscriptions
  FOR ALL USING (public.is_admin());

-- RLS Policies for transactions
CREATE POLICY "Users can view their own transactions" ON public.transactions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own transactions" ON public.transactions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all transactions" ON public.transactions
  FOR SELECT USING (public.is_admin());

CREATE POLICY "Admins can manage transactions" ON public.transactions
  FOR ALL USING (public.is_admin());

-- RLS Policies for tiktok_accounts (public read for available)
CREATE POLICY "Anyone can view available accounts" ON public.tiktok_accounts
  FOR SELECT USING (is_sold = false);

CREATE POLICY "Users can view their purchased accounts" ON public.tiktok_accounts
  FOR SELECT USING (sold_to_user_id = auth.uid());

CREATE POLICY "Admins can manage all accounts" ON public.tiktok_accounts
  FOR ALL USING (public.is_admin());

-- RLS Policies for models_for_sale (public read for available)
CREATE POLICY "Anyone can view available models" ON public.models_for_sale
  FOR SELECT USING (is_sold = false);

CREATE POLICY "Users can view their purchased models" ON public.models_for_sale
  FOR SELECT USING (sold_to_user_id = auth.uid());

CREATE POLICY "Admins can manage all models" ON public.models_for_sale
  FOR ALL USING (public.is_admin());

-- RLS Policies for user_activity
CREATE POLICY "Users can view their own activity" ON public.user_activity
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all activity" ON public.user_activity
  FOR SELECT USING (public.is_admin());

-- RLS Policies for checkout_sessions
CREATE POLICY "Users can view their own checkouts" ON public.checkout_sessions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own checkouts" ON public.checkout_sessions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can manage checkouts" ON public.checkout_sessions
  FOR ALL USING (public.is_admin());

-- Function to create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', '')
  );
  
  -- Add default user role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');
  
  RETURN NEW;
END;
$$;

-- Trigger to create profile on signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Add update triggers
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_subscriptions_updated_at
  BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_transactions_updated_at
  BEFORE UPDATE ON public.transactions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- Insert default plans
INSERT INTO public.plans (name, slug, price_cents, description, features, max_destinations, max_media_per_month, has_scheduling, has_ai_models) VALUES
('Free', 'free', 0, 'Teste grátis por 7 dias', '["1 destino", "100 mídias/mês", "Suporte por email"]', 1, 100, false, false),
('Basic', 'basic', 4990, 'Para criadores iniciantes', '["3 destinos", "500 mídias/mês", "Agendamento básico", "Suporte prioritário"]', 3, 500, true, false),
('Pro', 'pro', 9990, 'Para profissionais', '["10 destinos", "2000 mídias/mês", "Agendamento avançado", "Modelos IA", "Suporte 24/7"]', 10, 2000, true, true),
('Agency', 'agency', 29990, 'Para agências', '["Destinos ilimitados", "Mídias ilimitadas", "Todos os recursos", "API access", "Gerente dedicado"]', -1, -1, true, true);

-- Enable realtime for online status
ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;