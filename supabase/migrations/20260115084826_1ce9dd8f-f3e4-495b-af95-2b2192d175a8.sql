-- Add vendor management policies for tiktok_accounts
CREATE POLICY "Vendors can manage their own tiktok accounts"
ON public.tiktok_accounts
FOR ALL
USING (has_role(auth.uid(), 'vendor') AND created_by = auth.uid())
WITH CHECK (has_role(auth.uid(), 'vendor') AND created_by = auth.uid());

-- Add vendor management policies for telegram_groups
CREATE POLICY "Vendors can manage their own telegram groups"
ON public.telegram_groups
FOR ALL
USING (has_role(auth.uid(), 'vendor') AND created_by = auth.uid())
WITH CHECK (has_role(auth.uid(), 'vendor') AND created_by = auth.uid());

-- Add vendor management policies for models_for_sale
CREATE POLICY "Vendors can manage their own models"
ON public.models_for_sale
FOR ALL
USING (has_role(auth.uid(), 'vendor') AND created_by = auth.uid())
WITH CHECK (has_role(auth.uid(), 'vendor') AND created_by = auth.uid());

-- Add vendor insert policy for vendor_sales (when a sale is made)
CREATE POLICY "System can insert vendor sales"
ON public.vendor_sales
FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);