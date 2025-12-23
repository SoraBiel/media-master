-- Add column to mark transactions created by admin
ALTER TABLE public.transactions 
ADD COLUMN IF NOT EXISTS is_admin_granted boolean DEFAULT false;

-- Add comment for clarity
COMMENT ON COLUMN public.transactions.is_admin_granted IS 'True if this transaction was manually created/approved by an admin (should not count as real sale)';