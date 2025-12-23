import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { FunnelCanvas } from "@/components/funnel-builder/FunnelCanvas";
import { FunnelNode, FunnelEdge, SCHEMA_VERSION } from "@/components/funnel-builder/types";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

interface Funnel {
  id: string;
  name: string;
  description: string | null;
  is_active: boolean;
  telegram_integration_id: string | null;
}

const FunnelBuilderPage = () => {
  const { funnelId } = useParams<{ funnelId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  const [funnel, setFunnel] = useState<Funnel | null>(null);
  const [nodes, setNodes] = useState<FunnelNode[]>([]);
  const [edges, setEdges] = useState<FunnelEdge[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchFunnel = useCallback(async () => {
    if (!funnelId || !user) return;

    try {
      // Fetch funnel
      const { data: funnelData, error: funnelError } = await supabase
        .from("funnels")
        .select("*")
        .eq("id", funnelId)
        .eq("user_id", user.id)
        .single();

      if (funnelError) throw funnelError;
      setFunnel(funnelData);

      // Fetch nodes
      const { data: nodesData, error: nodesError } = await supabase
        .from("funnel_nodes")
        .select("*")
        .eq("funnel_id", funnelId);

      if (nodesError) throw nodesError;

      // Convert DB nodes to FunnelNode format
      const convertedNodes: FunnelNode[] = (nodesData || []).map((node: any) => ({
        id: node.id,
        type: node.node_type,
        position: { x: node.position_x, y: node.position_y },
        data: node.content || {},
      }));
      setNodes(convertedNodes);

      // Fetch edges
      const { data: edgesData, error: edgesError } = await supabase
        .from("funnel_edges")
        .select("*")
        .eq("funnel_id", funnelId);

      if (edgesError) throw edgesError;

      const convertedEdges: FunnelEdge[] = (edgesData || []).map((edge: any) => ({
        id: edge.id,
        source: edge.source_node_id,
        target: edge.target_node_id,
        sourceHandle: edge.source_handle || undefined,
      }));
      setEdges(convertedEdges);

    } catch (error: any) {
      console.error("Error fetching funnel:", error);
      toast({
        title: "Erro",
        description: "Funil não encontrado.",
        variant: "destructive",
      });
      navigate("/funnels");
    } finally {
      setIsLoading(false);
    }
  }, [funnelId, user, navigate, toast]);

  useEffect(() => {
    fetchFunnel();
  }, [fetchFunnel]);

  const handleSave = async (newNodes: FunnelNode[], newEdges: FunnelEdge[]) => {
    if (!funnelId || !user) return;

    try {
      // Delete existing nodes and edges
      await supabase.from("funnel_edges").delete().eq("funnel_id", funnelId);
      await supabase.from("funnel_nodes").delete().eq("funnel_id", funnelId);

      // Create a map from old IDs to new UUIDs
      const idMap = new Map<string, string>();

      // Insert new nodes with proper UUIDs
      if (newNodes.length > 0) {
        const nodesToInsert = newNodes.map((node) => {
          // Generate a proper UUID for each node
          const newId = crypto.randomUUID();
          idMap.set(node.id, newId);
          
          return {
            id: newId,
            funnel_id: funnelId,
            node_type: node.type,
            position_x: node.position.x,
            position_y: node.position.y,
            content: { blockType: node.type, ...node.data },
          };
        });

        const { error: nodesError } = await supabase
          .from("funnel_nodes")
          .insert(nodesToInsert);

        if (nodesError) throw nodesError;
      }

      // Insert new edges with remapped UUIDs
      if (newEdges.length > 0) {
        const edgesToInsert = newEdges.map((edge) => ({
          id: crypto.randomUUID(),
          funnel_id: funnelId,
          source_node_id: idMap.get(edge.source) || edge.source,
          target_node_id: idMap.get(edge.target) || edge.target,
          source_handle: edge.sourceHandle || 'default',
        }));

        const { error: edgesError } = await supabase
          .from("funnel_edges")
          .insert(edgesToInsert);

        if (edgesError) throw edgesError;
      }

      // Refresh from database to get the new UUIDs
      await fetchFunnel();
      
      toast({ title: "Funil salvo!" });
    } catch (error: any) {
      console.error("Error saving funnel:", error);
      throw error;
    }
  };

  const handleExport = () => {
    if (!funnel) return;

    const exportData = {
      name: funnel.name,
      description: funnel.description,
      schemaVersion: SCHEMA_VERSION,
      nodes,
      edges,
      exportedAt: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `funil-${funnel.name.toLowerCase().replace(/\s+/g, '-')}.json`;
    a.click();
    URL.revokeObjectURL(url);
    
    toast({ title: "Funil exportado!" });
  };

  const handleImport = (data: any) => {
    if (!data.nodes || !Array.isArray(data.nodes)) {
      toast({
        title: "Erro",
        description: "Formato de arquivo inválido.",
        variant: "destructive",
      });
      return;
    }

    // Remap IDs to avoid conflicts
    const idMap = new Map<string, string>();
    
    const newNodes: FunnelNode[] = data.nodes.map((node: any) => {
      const newId = `${node.type || node.id}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
      idMap.set(node.id, newId);
      return {
        ...node,
        id: newId,
      };
    });

    const newEdges: FunnelEdge[] = (data.edges || []).map((edge: any) => ({
      ...edge,
      id: `edge_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      source: idMap.get(edge.source) || edge.source,
      target: idMap.get(edge.target) || edge.target,
    }));

    setNodes(newNodes);
    setEdges(newEdges);
  };

  const handleToggleActive = async () => {
    if (!funnel) return;

    try {
      const { error } = await supabase
        .from("funnels")
        .update({ is_active: !funnel.is_active })
        .eq("id", funnel.id);

      if (error) throw error;
      setFunnel({ ...funnel, is_active: !funnel.is_active });
      toast({ title: funnel.is_active ? "Funil desativado" : "Funil ativado!" });
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
            <div className="w-6 h-6 rounded-full bg-primary animate-ping" />
          </div>
          <p className="text-muted-foreground">Carregando editor...</p>
        </div>
      </div>
    );
  }

  if (!funnel) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Funil não encontrado.</p>
      </div>
    );
  }

  return (
    <div className="h-screen bg-background flex flex-col overflow-hidden">
      <FunnelCanvas
        funnelId={funnel.id}
        funnelName={funnel.name}
        initialNodes={nodes}
        initialEdges={edges}
        onSave={handleSave}
        onExport={handleExport}
        onImport={handleImport}
        isActive={funnel.is_active}
        onToggleActive={handleToggleActive}
      />
    </div>
  );
};

export default FunnelBuilderPage;
