-- Create funnels table for the TypeBot-like flow builder
CREATE TABLE public.funnels (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT false,
  telegram_integration_id UUID REFERENCES public.telegram_integrations(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create funnel_nodes table for flow nodes
CREATE TABLE public.funnel_nodes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  funnel_id UUID NOT NULL REFERENCES public.funnels(id) ON DELETE CASCADE,
  node_type TEXT NOT NULL DEFAULT 'message', -- message, image, video, buttons, condition, delay, input
  position_x FLOAT NOT NULL DEFAULT 0,
  position_y FLOAT NOT NULL DEFAULT 0,
  content JSONB DEFAULT '{}', -- node-specific content
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create funnel_edges table for connections between nodes
CREATE TABLE public.funnel_edges (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  funnel_id UUID NOT NULL REFERENCES public.funnels(id) ON DELETE CASCADE,
  source_node_id UUID NOT NULL REFERENCES public.funnel_nodes(id) ON DELETE CASCADE,
  target_node_id UUID NOT NULL REFERENCES public.funnel_nodes(id) ON DELETE CASCADE,
  source_handle TEXT DEFAULT 'default', -- for button responses
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.funnels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.funnel_nodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.funnel_edges ENABLE ROW LEVEL SECURITY;

-- RLS Policies for funnels
CREATE POLICY "Users can view their own funnels"
  ON public.funnels FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own funnels"
  ON public.funnels FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own funnels"
  ON public.funnels FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own funnels"
  ON public.funnels FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all funnels"
  ON public.funnels FOR ALL
  USING (is_admin());

-- RLS Policies for funnel_nodes (access through funnel ownership)
CREATE POLICY "Users can view nodes of their funnels"
  ON public.funnel_nodes FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.funnels WHERE funnels.id = funnel_nodes.funnel_id AND funnels.user_id = auth.uid()
  ));

CREATE POLICY "Users can create nodes in their funnels"
  ON public.funnel_nodes FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.funnels WHERE funnels.id = funnel_nodes.funnel_id AND funnels.user_id = auth.uid()
  ));

CREATE POLICY "Users can update nodes in their funnels"
  ON public.funnel_nodes FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.funnels WHERE funnels.id = funnel_nodes.funnel_id AND funnels.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete nodes in their funnels"
  ON public.funnel_nodes FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM public.funnels WHERE funnels.id = funnel_nodes.funnel_id AND funnels.user_id = auth.uid()
  ));

CREATE POLICY "Admins can manage all funnel nodes"
  ON public.funnel_nodes FOR ALL
  USING (is_admin());

-- RLS Policies for funnel_edges
CREATE POLICY "Users can view edges of their funnels"
  ON public.funnel_edges FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.funnels WHERE funnels.id = funnel_edges.funnel_id AND funnels.user_id = auth.uid()
  ));

CREATE POLICY "Users can create edges in their funnels"
  ON public.funnel_edges FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.funnels WHERE funnels.id = funnel_edges.funnel_id AND funnels.user_id = auth.uid()
  ));

CREATE POLICY "Users can update edges in their funnels"
  ON public.funnel_edges FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.funnels WHERE funnels.id = funnel_edges.funnel_id AND funnels.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete edges in their funnels"
  ON public.funnel_edges FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM public.funnels WHERE funnels.id = funnel_edges.funnel_id AND funnels.user_id = auth.uid()
  ));

CREATE POLICY "Admins can manage all funnel edges"
  ON public.funnel_edges FOR ALL
  USING (is_admin());

-- Trigger to update updated_at on funnels
CREATE TRIGGER update_funnels_updated_at
  BEFORE UPDATE ON public.funnels
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_funnel_nodes_updated_at
  BEFORE UPDATE ON public.funnel_nodes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

-- Enable realtime for funnels
ALTER PUBLICATION supabase_realtime ADD TABLE public.funnels;
ALTER PUBLICATION supabase_realtime ADD TABLE public.funnel_nodes;

-- Update plans table to add max_funnels column
ALTER TABLE public.plans ADD COLUMN IF NOT EXISTS max_funnels INTEGER DEFAULT 0;