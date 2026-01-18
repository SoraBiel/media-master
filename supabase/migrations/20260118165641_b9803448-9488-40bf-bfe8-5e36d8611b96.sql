-- Create table to link account managers to sellers they manage
CREATE TABLE public.account_manager_sellers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  manager_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  seller_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(manager_id, seller_id)
);

-- Enable RLS
ALTER TABLE public.account_manager_sellers ENABLE ROW LEVEL SECURITY;

-- Policy: Admins can do everything
CREATE POLICY "Admins can manage all account_manager_sellers"
ON public.account_manager_sellers
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Policy: Account managers can view their own assignments
CREATE POLICY "Account managers can view their sellers"
ON public.account_manager_sellers
FOR SELECT
TO authenticated
USING (
  manager_id = auth.uid() AND 
  public.has_role(auth.uid(), 'gerente_contas')
);

-- Policy: Account managers can update notes on their assignments
CREATE POLICY "Account managers can update their seller notes"
ON public.account_manager_sellers
FOR UPDATE
TO authenticated
USING (
  manager_id = auth.uid() AND 
  public.has_role(auth.uid(), 'gerente_contas')
)
WITH CHECK (
  manager_id = auth.uid() AND 
  public.has_role(auth.uid(), 'gerente_contas')
);

-- Create account_manager_logs table for audit trail
CREATE TABLE public.account_manager_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  manager_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  target_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  action_type TEXT NOT NULL,
  details JSONB,
  ip_address TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on logs
ALTER TABLE public.account_manager_logs ENABLE ROW LEVEL SECURITY;

-- Policy: Admins can view all logs
CREATE POLICY "Admins can view all account_manager_logs"
ON public.account_manager_logs
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Policy: Account managers can view their own logs
CREATE POLICY "Account managers can view their own logs"
ON public.account_manager_logs
FOR SELECT
TO authenticated
USING (
  manager_id = auth.uid() AND 
  public.has_role(auth.uid(), 'gerente_contas')
);

-- Policy: Account managers can insert their own logs
CREATE POLICY "Account managers can insert logs"
ON public.account_manager_logs
FOR INSERT
TO authenticated
WITH CHECK (
  manager_id = auth.uid() AND 
  public.has_role(auth.uid(), 'gerente_contas')
);

-- Admins can also insert logs
CREATE POLICY "Admins can insert account_manager_logs"
ON public.account_manager_logs
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Create indexes for performance
CREATE INDEX idx_account_manager_sellers_manager ON public.account_manager_sellers(manager_id);
CREATE INDEX idx_account_manager_sellers_seller ON public.account_manager_sellers(seller_id);
CREATE INDEX idx_account_manager_logs_manager ON public.account_manager_logs(manager_id);
CREATE INDEX idx_account_manager_logs_target ON public.account_manager_logs(target_user_id);
CREATE INDEX idx_account_manager_logs_created ON public.account_manager_logs(created_at DESC);

-- Create trigger for updated_at
CREATE TRIGGER update_account_manager_sellers_updated_at
BEFORE UPDATE ON public.account_manager_sellers
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();