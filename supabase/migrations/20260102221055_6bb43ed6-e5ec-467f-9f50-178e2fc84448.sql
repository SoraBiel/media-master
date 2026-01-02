-- Create table for user-specific referral commissions
CREATE TABLE public.user_referral_commissions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL UNIQUE,
    commission_percent numeric NOT NULL DEFAULT 20.00,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    created_by uuid,
    notes text
);

-- Enable RLS
ALTER TABLE public.user_referral_commissions ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Admins can manage user commissions"
ON public.user_referral_commissions
FOR ALL
USING (is_admin());

CREATE POLICY "Users can view their own commission"
ON public.user_referral_commissions
FOR SELECT
USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_user_referral_commissions_updated_at
BEFORE UPDATE ON public.user_referral_commissions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at();