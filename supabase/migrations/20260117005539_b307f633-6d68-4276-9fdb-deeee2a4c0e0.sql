
-- Drop existing vendor policy for tiktok_accounts
DROP POLICY IF EXISTS "Vendors can manage their own tiktok accounts" ON public.tiktok_accounts;

-- Create new policy that includes both vendor and vendor_tiktok roles
CREATE POLICY "Vendors can manage their own tiktok accounts"
ON public.tiktok_accounts
FOR ALL
USING (
  (has_role(auth.uid(), 'vendor') OR has_role(auth.uid(), 'vendor_tiktok'))
  AND created_by = auth.uid()
)
WITH CHECK (
  (has_role(auth.uid(), 'vendor') OR has_role(auth.uid(), 'vendor_tiktok'))
  AND created_by = auth.uid()
);

-- Drop and recreate vendor policy for instagram_accounts to include vendor_instagram
DROP POLICY IF EXISTS "Vendors can manage their own instagram accounts" ON public.instagram_accounts;

CREATE POLICY "Vendors can manage their own instagram accounts"
ON public.instagram_accounts
FOR ALL
USING (
  (has_role(auth.uid(), 'vendor') OR has_role(auth.uid(), 'vendor_instagram'))
  AND created_by = auth.uid()
)
WITH CHECK (
  (has_role(auth.uid(), 'vendor') OR has_role(auth.uid(), 'vendor_instagram'))
  AND created_by = auth.uid()
);

-- Drop and recreate vendor policy for models_for_sale to include vendor_model
DROP POLICY IF EXISTS "Vendors can manage their own models" ON public.models_for_sale;

CREATE POLICY "Vendors can manage their own models"
ON public.models_for_sale
FOR ALL
USING (
  (has_role(auth.uid(), 'vendor') OR has_role(auth.uid(), 'vendor_model'))
  AND created_by = auth.uid()
)
WITH CHECK (
  (has_role(auth.uid(), 'vendor') OR has_role(auth.uid(), 'vendor_model'))
  AND created_by = auth.uid()
);
