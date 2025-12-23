import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Save,
  Play,
  Plus,
  MessageSquare,
  Image,
  Video,
  MousePointer2,
  Clock,
  GitBranch,
  Trash2,
  Settings,
  GripVertical,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

interface FunnelNode {
  id: string;
  funnel_id: string;
  node_type: string;
  position_x: number;
  position_y: number;
  content: any;
}

interface Funnel {
  id: string;
  name: string;
  description: string | null;
  is_active: boolean;
}

const NODE_TYPES = [
  { type: "message", label: "Mensagem", icon: MessageSquare, color: "bg-telegram/20 text-telegram" },
  { type: "image", label: "Imagem", icon: Image, color: "bg-pink-500/20 text-pink-500" },
  { type: "video", label: "Vídeo", icon: Video, color: "bg-purple-500/20 text-purple-500" },
  { type: "buttons", label: "Botões", icon: MousePointer2, color: "bg-success/20 text-success" },
  { type: "delay", label: "Delay", icon: Clock, color: "bg-warning/20 text-warning" },
  { type: "condition", label: "Condição", icon: GitBranch, color: "bg-orange-500/20 text-orange-500" },
];

const FunnelBuilderPage = () => {
  const { funnelId } = useParams<{ funnelId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  const [funnel, setFunnel] = useState<Funnel | null>(null);
  const [nodes, setNodes] = useState<FunnelNode[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedNode, setSelectedNode] = useState<FunnelNode | null>(null);
  const [isNodeDialogOpen, setIsNodeDialogOpen] = useState(false);
  const [newNodeType, setNewNodeType] = useState("");

  const fetchFunnel = async () => {
    if (!funnelId || !user) return;

    try {
      const { data: funnelData, error: funnelError } = await supabase
        .from("funnels")
        .select("*")
        .eq("id", funnelId)
        .eq("user_id", user.id)
        .single();

      if (funnelError) throw funnelError;
      setFunnel(funnelData);

      const { data: nodesData, error: nodesError } = await supabase
        .from("funnel_nodes")
        .select("*")
        .eq("funnel_id", funnelId)
        .order("position_y", { ascending: true });

      if (nodesError) throw nodesError;
      setNodes(nodesData || []);
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
  };

  useEffect(() => {
    fetchFunnel();

    if (funnelId && user) {
      const channel = supabase
        .channel(`funnel_nodes_${funnelId}`)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "funnel_nodes",
            filter: `funnel_id=eq.${funnelId}`,
          },
          () => fetchFunnel()
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [funnelId, user]);

  const handleAddNode = async (type: string) => {
    if (!funnelId || !user) return;

    const defaultContent: Record<string, any> = {
      message: { text: "" },
      image: { url: "", caption: "" },
      video: { url: "", caption: "" },
      buttons: { text: "", buttons: [{ label: "Opção 1", value: "1" }] },
      delay: { seconds: 5 },
      condition: { variable: "", operator: "equals", value: "" },
    };

    try {
      const newY = nodes.length * 120;
      const { error } = await supabase.from("funnel_nodes").insert({
        funnel_id: funnelId,
        node_type: type,
        position_x: 0,
        position_y: newY,
        content: defaultContent[type] || {},
      });

      if (error) throw error;
      toast({ title: "Bloco adicionado!" });
      setIsNodeDialogOpen(false);
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleUpdateNode = async (nodeId: string, content: any) => {
    try {
      const { error } = await supabase
        .from("funnel_nodes")
        .update({ content })
        .eq("id", nodeId);

      if (error) throw error;
      setNodes(nodes.map((n) => (n.id === nodeId ? { ...n, content } : n)));
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleDeleteNode = async (nodeId: string) => {
    try {
      const { error } = await supabase
        .from("funnel_nodes")
        .delete()
        .eq("id", nodeId);

      if (error) throw error;
      setNodes(nodes.filter((n) => n.id !== nodeId));
      setSelectedNode(null);
      toast({ title: "Bloco removido!" });
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleSaveFunnel = async () => {
    if (!funnel) return;
    setIsSaving(true);

    try {
      // Save is automatic with each node update
      toast({ title: "Funil salvo!" });
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
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

  const getNodeIcon = (type: string) => {
    const nodeType = NODE_TYPES.find((n) => n.type === type);
    return nodeType?.icon || MessageSquare;
  };

  const getNodeColor = (type: string) => {
    const nodeType = NODE_TYPES.find((n) => n.type === type);
    return nodeType?.color || "bg-muted text-muted-foreground";
  };

  const renderNodeContent = (node: FunnelNode) => {
    switch (node.node_type) {
      case "message":
        return (
          <div className="space-y-2">
            <Textarea
              placeholder="Digite a mensagem..."
              value={node.content?.text || ""}
              onChange={(e) => handleUpdateNode(node.id, { ...node.content, text: e.target.value })}
              className="min-h-[80px]"
            />
          </div>
        );
      case "image":
      case "video":
        return (
          <div className="space-y-2">
            <Input
              placeholder="URL da mídia..."
              value={node.content?.url || ""}
              onChange={(e) => handleUpdateNode(node.id, { ...node.content, url: e.target.value })}
            />
            <Input
              placeholder="Legenda (opcional)"
              value={node.content?.caption || ""}
              onChange={(e) => handleUpdateNode(node.id, { ...node.content, caption: e.target.value })}
            />
          </div>
        );
      case "buttons":
        return (
          <div className="space-y-2">
            <Textarea
              placeholder="Texto antes dos botões..."
              value={node.content?.text || ""}
              onChange={(e) => handleUpdateNode(node.id, { ...node.content, text: e.target.value })}
              className="min-h-[60px]"
            />
            <div className="space-y-1">
              {(node.content?.buttons || []).map((btn: any, idx: number) => (
                <div key={idx} className="flex gap-2">
                  <Input
                    placeholder={`Botão ${idx + 1}`}
                    value={btn.label}
                    onChange={(e) => {
                      const buttons = [...(node.content?.buttons || [])];
                      buttons[idx] = { ...buttons[idx], label: e.target.value };
                      handleUpdateNode(node.id, { ...node.content, buttons });
                    }}
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      const buttons = (node.content?.buttons || []).filter((_: any, i: number) => i !== idx);
                      handleUpdateNode(node.id, { ...node.content, buttons });
                    }}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => {
                  const buttons = [...(node.content?.buttons || []), { label: "", value: String((node.content?.buttons?.length || 0) + 1) }];
                  handleUpdateNode(node.id, { ...node.content, buttons });
                }}
              >
                <Plus className="w-4 h-4 mr-1" />
                Adicionar Botão
              </Button>
            </div>
          </div>
        );
      case "delay":
        return (
          <div className="space-y-2">
            <Label>Segundos de espera</Label>
            <Input
              type="number"
              min={1}
              value={node.content?.seconds || 5}
              onChange={(e) => handleUpdateNode(node.id, { ...node.content, seconds: parseInt(e.target.value) || 5 })}
            />
          </div>
        );
      case "condition":
        return (
          <div className="space-y-2">
            <Input
              placeholder="Variável..."
              value={node.content?.variable || ""}
              onChange={(e) => handleUpdateNode(node.id, { ...node.content, variable: e.target.value })}
            />
            <Input
              placeholder="Valor esperado..."
              value={node.content?.value || ""}
              onChange={(e) => handleUpdateNode(node.id, { ...node.content, value: e.target.value })}
            />
          </div>
        );
      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-telegram/20 flex items-center justify-center">
            <div className="w-6 h-6 rounded-full bg-telegram animate-ping" />
          </div>
          <p className="text-muted-foreground">Carregando...</p>
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
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 h-16 border-b border-border bg-background/80 backdrop-blur-sm flex items-center justify-between px-4 md:px-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/funnels")}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="font-semibold">{funnel.name}</h1>
            <Badge variant={funnel.is_active ? "default" : "secondary"}>
              {funnel.is_active ? "Ativo" : "Inativo"}
            </Badge>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleToggleActive}>
            <Play className="w-4 h-4 mr-2" />
            {funnel.is_active ? "Desativar" : "Ativar"}
          </Button>
          <Button variant="gradient" onClick={handleSaveFunnel} disabled={isSaving}>
            <Save className="w-4 h-4 mr-2" />
            {isSaving ? "Salvando..." : "Salvar"}
          </Button>
        </div>
      </header>

      <div className="flex h-[calc(100vh-4rem)]">
        {/* Sidebar - Node Types */}
        <aside className="w-64 border-r border-border bg-card p-4 overflow-y-auto hidden md:block">
          <h3 className="font-semibold mb-4">Blocos</h3>
          <div className="space-y-2">
            {NODE_TYPES.map((nodeType) => (
              <button
                key={nodeType.type}
                onClick={() => handleAddNode(nodeType.type)}
                className="w-full flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-muted transition-colors text-left"
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${nodeType.color}`}>
                  <nodeType.icon className="w-4 h-4" />
                </div>
                <span className="text-sm font-medium">{nodeType.label}</span>
              </button>
            ))}
          </div>
        </aside>

        {/* Main Canvas */}
        <main className="flex-1 p-6 overflow-y-auto">
          <div className="max-w-2xl mx-auto space-y-4">
            {/* Add Node Button for Mobile */}
            <div className="md:hidden mb-4">
              <Button
                variant="outline"
                className="w-full"
                onClick={() => setIsNodeDialogOpen(true)}
              >
                <Plus className="w-4 h-4 mr-2" />
                Adicionar Bloco
              </Button>
            </div>

            {/* Nodes */}
            {nodes.length === 0 ? (
              <Card className="glass-card">
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <GitBranch className="w-12 h-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Comece seu fluxo</h3>
                  <p className="text-muted-foreground text-center max-w-sm mb-4">
                    Adicione blocos para criar a conversa do seu bot
                  </p>
                  <Button variant="gradient" onClick={() => handleAddNode("message")}>
                    <Plus className="w-4 h-4 mr-2" />
                    Adicionar Mensagem
                  </Button>
                </CardContent>
              </Card>
            ) : (
              nodes.map((node, index) => {
                const NodeIcon = getNodeIcon(node.node_type);
                const nodeColor = getNodeColor(node.node_type);
                const nodeTypeInfo = NODE_TYPES.find((n) => n.type === node.node_type);

                return (
                  <motion.div
                    key={node.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Card className="glass-card">
                      <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="cursor-grab">
                              <GripVertical className="w-4 h-4 text-muted-foreground" />
                            </div>
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${nodeColor}`}>
                              <NodeIcon className="w-4 h-4" />
                            </div>
                            <CardTitle className="text-sm">{nodeTypeInfo?.label}</CardTitle>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteNode(node.id)}
                          >
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent>
                        {renderNodeContent(node)}
                      </CardContent>
                    </Card>

                    {/* Connector Line */}
                    {index < nodes.length - 1 && (
                      <div className="flex justify-center py-2">
                        <div className="w-0.5 h-8 bg-border" />
                      </div>
                    )}
                  </motion.div>
                );
              })
            )}

            {/* Add More Button */}
            {nodes.length > 0 && (
              <div className="flex justify-center pt-4">
                <Button
                  variant="outline"
                  onClick={() => setIsNodeDialogOpen(true)}
                  className="hidden md:flex"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Adicionar Bloco
                </Button>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Mobile Add Node Dialog */}
      <Dialog open={isNodeDialogOpen} onOpenChange={setIsNodeDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adicionar Bloco</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-2">
            {NODE_TYPES.map((nodeType) => (
              <button
                key={nodeType.type}
                onClick={() => handleAddNode(nodeType.type)}
                className="flex flex-col items-center gap-2 p-4 rounded-lg border border-border hover:bg-muted transition-colors"
              >
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${nodeType.color}`}>
                  <nodeType.icon className="w-5 h-5" />
                </div>
                <span className="text-sm font-medium">{nodeType.label}</span>
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default FunnelBuilderPage;
