-- Add runner lock fields to prevent concurrent processing
ALTER TABLE public.campaigns
ADD COLUMN IF NOT EXISTS runner_lock_token uuid,
ADD COLUMN IF NOT EXISTS runner_lock_expires_at timestamptz;

CREATE INDEX IF NOT EXISTS idx_campaigns_running_lock
ON public.campaigns (status, runner_lock_expires_at, updated_at);

-- Helper function to reserve the next batch safely (prevents duplicate sending)
CREATE OR REPLACE FUNCTION public.reserve_campaign_batch(
  p_campaign_id uuid,
  p_batch_size int
)
RETURNS TABLE(start_offset int, end_offset int, total_count int)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_sent int;
  v_total int;
  v_end int;
BEGIN
  SELECT COALESCE(sent_count, 0), COALESCE(total_count, 0)
    INTO v_sent, v_total
  FROM public.campaigns
  WHERE id = p_campaign_id
  FOR UPDATE;

  IF v_sent >= v_total THEN
    start_offset := v_sent;
    end_offset := v_sent;
    total_count := v_total;
    RETURN NEXT;
    RETURN;
  END IF;

  v_end := LEAST(v_sent + GREATEST(p_batch_size, 0), v_total);

  -- NOTE: we do NOT advance sent_count here; this function is for future use.
  -- We return the range so the caller can process deterministically.
  start_offset := v_sent;
  end_offset := v_end;
  total_count := v_total;
  RETURN NEXT;
END;
$$;

REVOKE ALL ON FUNCTION public.reserve_campaign_batch(uuid, int) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.reserve_campaign_batch(uuid, int) TO service_role;