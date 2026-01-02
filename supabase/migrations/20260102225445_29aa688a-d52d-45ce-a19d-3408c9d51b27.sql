-- Allow users to view profiles of people they referred
CREATE POLICY "Referrers can view their referred profiles" 
ON public.profiles 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.referrals 
    WHERE referrals.referrer_id = auth.uid() 
    AND referrals.referred_id = profiles.user_id
  )
);