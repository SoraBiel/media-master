-- Drop existing policies
DROP POLICY IF EXISTS "Admins can manage admin media" ON public.admin_media;
DROP POLICY IF EXISTS "Anyone can view admin media" ON public.admin_media;

-- Recreate with proper permissions
CREATE POLICY "Anyone can view admin media" 
ON public.admin_media 
FOR SELECT 
USING (true);

CREATE POLICY "Admins can insert admin media" 
ON public.admin_media 
FOR INSERT 
WITH CHECK (is_admin());

CREATE POLICY "Admins can update admin media" 
ON public.admin_media 
FOR UPDATE 
USING (is_admin());

CREATE POLICY "Admins can delete admin media" 
ON public.admin_media 
FOR DELETE 
USING (is_admin());