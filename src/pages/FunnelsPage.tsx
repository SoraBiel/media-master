import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  GitBranch,
  Plus,
  Play,
  Pause,
  Trash2,
  Edit,
  MoreVertical,
  Lock,
  MessageCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { TemplateSelection } from "@/components/funnel-builder/TemplateSelection";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useSubscription } from "@/hooks/useSubscription";
import { useToast } from "@/hooks/use-toast";

interface Funnel {
  id: string;
  name: string;
  description: string | null;
  is_active: boolean;
  telegram_integration_id: string | null;
  created_at: string;
}

const FunnelsPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { currentPlan } = useSubscription();
  const { toast } = useToast();

  const [funnels, setFunnels] = useState<Funnel[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isTemplateDialogOpen, setIsTemplateDialogOpen] = useState(false);

  const getMaxFunnels = () => {
    if (!currentPlan) return 0;
    switch (currentPlan.slug) {
      case "basic": return 3;
      case "pro": return 10;
      case "agency": return 999;
      default: return 0;
    }
  };

  const maxFunnels = getMaxFunnels();
  const canCreateFunnel = funnels.length < maxFunnels;

  const fetchFunnels = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from("funnels")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      setFunnels(data || []);
    } catch (error: any) {
      console.error("Error fetching funnels:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFunnels();
  }, [user]);

  const handleCreateFunnel = async (template: any, name: string, description: string) => {
    if (!name || !user) return;

    try {
      const { data, error } = await supabase.from("funnels").insert({
        user_id: user.id,
        name: name,
        description: description || null,
      }).select().single();

      if (error) throw error;

      // Se tem template, usa os nodes do template
      if (template && data) {
        const idMap = new Map<string, string>();
        
        const nodes = (template.nodes || []).map((node: any) => {
          const newId = `${node.id}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
          idMap.set(node.id, newId);
          return {
            id: newId,
            funnel_id: data.id,
            node_type: node.type,
            position_x: node.position.x,
            position_y: node.position.y,
            content: { blockType: node.type, ...node.data },
          };
        });

        if (nodes.length > 0) {
          await supabase.from("funnel_nodes").insert(nodes);
        }

        // Insert edges with remapped IDs
        const edges = (template.edges || []).map((edge: any) => ({
          id: `edge_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
          funnel_id: data.id,
          source_node_id: idMap.get(edge.source) || edge.source,
          target_node_id: idMap.get(edge.target) || edge.target,
          source_handle: edge.sourceHandle || 'default',
        }));

        if (edges.length > 0) {
          await supabase.from("funnel_edges").insert(edges);
        }
      } else if (data) {
        // Se não tem template, cria blocos iniciais de teste
        const startNodeId = `start_${Date.now()}_1`;
        const messageNodeId = `message_${Date.now()}_2`;
        const endNodeId = `end_${Date.now()}_3`;

        const initialNodes = [
          {
            id: startNodeId,
            funnel_id: data.id,
            node_type: 'start',
            position_x: 300,
            position_y: 50,
            content: { blockType: 'start', label: 'Início' },
          },
          {
            id: messageNodeId,
            funnel_id: data.id,
            node_type: 'message',
            position_x: 300,
            position_y: 200,
            content: { blockType: 'message', text: 'Olá! Seja bem-vindo ao funil. Edite esta mensagem.' },
          },
          {
            id: endNodeId,
            funnel_id: data.id,
            node_type: 'end',
            position_x: 300,
            position_y: 350,
            content: { blockType: 'end', label: 'Fim' },
          },
        ];

        const initialEdges = [
          {
            id: `edge_${Date.now()}_1`,
            funnel_id: data.id,
            source_node_id: startNodeId,
            target_node_id: messageNodeId,
            source_handle: 'default',
          },
          {
            id: `edge_${Date.now()}_2`,
            funnel_id: data.id,
            source_node_id: messageNodeId,
            target_node_id: endNodeId,
            source_handle: 'default',
          },
        ];

        await supabase.from("funnel_nodes").insert(initialNodes);
        await supabase.from("funnel_edges").insert(initialEdges);
      }

      toast({ title: "Funil criado com blocos iniciais!" });
      setIsTemplateDialogOpen(false);
      navigate(`/funnels/${data.id}`);
    } catch (error: any) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    }
  };

  const handleDeleteFunnel = async (id: string) => {
    try {
      await supabase.from("funnels").delete().eq("id", id);
      setFunnels(funnels.filter(f => f.id !== id));
      toast({ title: "Funil removido!" });
    } catch (error: any) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    }
  };

  const handleToggleActive = async (id: string, isActive: boolean) => {
    try {
      await supabase.from("funnels").update({ is_active: !isActive }).eq("id", id);
      setFunnels(funnels.map(f => f.id === id ? { ...f, is_active: !isActive } : f));
      toast({ title: isActive ? "Funil desativado" : "Funil ativado!" });
    } catch (error: any) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    }
  };

  if (maxFunnels === 0) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
          <Lock className="w-12 h-12 text-muted-foreground mb-4" />
          <h1 className="text-2xl font-bold mb-2">Funis de Chat</h1>
          <p className="text-muted-foreground max-w-md mb-6">
            Disponível a partir do plano Basic.
          </p>
          <Button variant="gradient" onClick={() => navigate("/billing")}>Ver Planos</Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Funis de Chat</h1>
            <p className="text-muted-foreground">Crie fluxos automáticos estilo TypeBot</p>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="outline">{funnels.length}/{maxFunnels === 999 ? "∞" : maxFunnels}</Badge>
            <Button variant="gradient" onClick={() => setIsTemplateDialogOpen(true)} disabled={!canCreateFunnel}>
              <Plus className="w-4 h-4 mr-2" />Novo Funil
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse"><CardContent className="h-32" /></Card>
            ))}
          </div>
        ) : funnels.length === 0 ? (
          <Card className="glass-card">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <GitBranch className="w-12 h-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nenhum funil criado</h3>
              <Button variant="gradient" onClick={() => setIsTemplateDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />Criar Funil
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {funnels.map((funnel, index) => (
              <motion.div key={funnel.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.1 }}>
                <Card className="glass-card hover:border-primary/50 transition-colors">
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${funnel.is_active ? "bg-success/20" : "bg-muted"}`}>
                          <GitBranch className={`w-5 h-5 ${funnel.is_active ? "text-success" : "text-muted-foreground"}`} />
                        </div>
                        <div>
                          <CardTitle className="text-base">{funnel.name}</CardTitle>
                          <Badge variant={funnel.is_active ? "default" : "secondary"} className="mt-1">
                            {funnel.is_active ? "Ativo" : "Inativo"}
                          </Badge>
                        </div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon"><MoreVertical className="w-4 h-4" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => navigate(`/funnels/${funnel.id}`)}>
                            <Edit className="w-4 h-4 mr-2" />Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleToggleActive(funnel.id, funnel.is_active)}>
                            {funnel.is_active ? <><Pause className="w-4 h-4 mr-2" />Desativar</> : <><Play className="w-4 h-4 mr-2" />Ativar</>}
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive" onClick={() => handleDeleteFunnel(funnel.id)}>
                            <Trash2 className="w-4 h-4 mr-2" />Excluir
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {funnel.description && <p className="text-sm text-muted-foreground mb-2 line-clamp-2">{funnel.description}</p>}
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <MessageCircle className="w-3 h-3" />
                      <span>{new Date(funnel.created_at).toLocaleDateString("pt-BR")}</span>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      <Dialog open={isTemplateDialogOpen} onOpenChange={setIsTemplateDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] p-0">
          <TemplateSelection onClose={() => setIsTemplateDialogOpen(false)} onSelectTemplate={handleCreateFunnel} />
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default FunnelsPage;
