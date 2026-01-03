-- Allow sub-second delays (e.g. 0.001s = 1ms)
ALTER TABLE public.campaigns
  ALTER COLUMN delay_seconds TYPE double precision
  USING delay_seconds::double precision;