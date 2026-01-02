-- Update the status check constraint to include 'converted'
ALTER TABLE public.referrals DROP CONSTRAINT referrals_status_check;
ALTER TABLE public.referrals ADD CONSTRAINT referrals_status_check CHECK (status = ANY (ARRAY['pending'::text, 'active'::text, 'converted'::text, 'cancelled'::text]));