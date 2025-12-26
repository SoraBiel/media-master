-- Create instagram_accounts table similar to tiktok_accounts
CREATE TABLE public.instagram_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  username text NOT NULL,
  followers integer DEFAULT 0,
  following integer DEFAULT 0,
  posts_count integer DEFAULT 0,
  engagement_rate numeric(5,2) DEFAULT 0,
  niche text,
  description text,
  image_url text,
  price_cents integer NOT NULL,
  is_verified boolean DEFAULT false,
  is_sold boolean DEFAULT false,
  sold_at timestamp with time zone,
  sold_to_user_id uuid,
  created_by uuid,
  created_at timestamp with time zone DEFAULT now(),
  -- Deliverable info
  deliverable_info text,
  deliverable_login text,
  deliverable_password text,
  deliverable_email text,
  deliverable_notes text
);

-- Enable RLS
ALTER TABLE public.instagram_accounts ENABLE ROW LEVEL SECURITY;

-- RLS Policies for instagram_accounts
CREATE POLICY "Admins can manage all instagram accounts"
ON public.instagram_accounts FOR ALL
USING (is_admin());

CREATE POLICY "Vendors can manage their own instagram accounts"
ON public.instagram_accounts FOR ALL
USING (has_role(auth.uid(), 'vendor') AND created_by = auth.uid());

CREATE POLICY "Anyone can view available instagram accounts"
ON public.instagram_accounts FOR SELECT
USING (is_sold = false);

CREATE POLICY "Users can view their purchased instagram accounts"
ON public.instagram_accounts FOR SELECT
USING (sold_to_user_id = auth.uid());

-- Add vendor_id to tiktok_accounts to track who created it (already has created_by)
-- Add vendor_commission_percent to track commission for vendors

-- Create vendor_sales table to track vendor earnings
CREATE TABLE public.vendor_sales (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id uuid NOT NULL,
  item_type text NOT NULL, -- 'instagram' or 'tiktok'
  item_id uuid NOT NULL,
  buyer_id uuid NOT NULL,
  sale_amount_cents integer NOT NULL,
  vendor_commission_cents integer NOT NULL,
  platform_fee_cents integer NOT NULL,
  status text DEFAULT 'pending', -- pending, paid, failed
  paid_at timestamp with time zone,
  transaction_id uuid,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.vendor_sales ENABLE ROW LEVEL SECURITY;

-- RLS Policies for vendor_sales
CREATE POLICY "Admins can manage all vendor sales"
ON public.vendor_sales FOR ALL
USING (is_admin());

CREATE POLICY "Vendors can view their own sales"
ON public.vendor_sales FOR SELECT
USING (vendor_id = auth.uid());

-- Update trigger for updated_at
CREATE TRIGGER update_vendor_sales_updated_at
BEFORE UPDATE ON public.vendor_sales
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at();