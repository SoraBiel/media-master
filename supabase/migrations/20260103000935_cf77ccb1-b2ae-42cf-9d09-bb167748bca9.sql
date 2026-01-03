-- Add page_type column to smart_link_pages
ALTER TABLE public.smart_link_pages 
ADD COLUMN page_type text NOT NULL DEFAULT 'linkbio';

-- Add redirect_url column for redirector pages
ALTER TABLE public.smart_link_pages 
ADD COLUMN redirect_url text;

-- Add template column for pre-built layouts
ALTER TABLE public.smart_link_pages 
ADD COLUMN template text DEFAULT 'custom';

-- Create index for faster lookups
CREATE INDEX idx_smart_link_pages_page_type ON public.smart_link_pages(page_type);