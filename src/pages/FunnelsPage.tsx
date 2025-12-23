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
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import DashboardLayout from "@/components/layout/DashboardLayout";
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
  nodes_count?: number;
}

interface TelegramIntegration {
  id: string;
  bot_name: string | null;
  bot_username: string | null;
  is_connected: boolean;
}

const FunnelsPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { currentPlan } = useSubscription();
  const { toast } = useToast();

  const [funnels, setFunnels] = useState<Funnel[]>([]);
  const [telegramBots, setTelegramBots] = useState<TelegramIntegration[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newFunnel, setNewFunnel] = useState({
    name: "",
    description: "",
    telegram_integration_id: "",
  });

  // Get max funnels based on plan
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

  const fetchTelegramBots = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("telegram_integrations")
        .select("id, bot_name, bot_username, is_connected")
        .eq("user_id", user.id)
        .eq("is_connected", true);

      if (error) throw error;
      setTelegramBots(data || []);
    } catch (error: any) {
      console.error("Error fetching bots:", error);
    }
  };

  useEffect(() => {
    fetchFunnels();
    fetchTelegramBots();

    if (user) {
      const channel = supabase
        .channel("funnels_changes")
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "funnels",
            filter: `user_id=eq.${user.id}`,
          },
          () => fetchFunnels()
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user]);

  const handleCreateFunnel = async () => {
    if (!newFunnel.name || !user) {
      toast({
        title: "Erro",
        description: "Digite um nome para o funil.",
        variant: "destructive",
      });
      return;
    }

    if (!canCreateFunnel) {
      toast({
        title: "Limite atingido",
        description: `Seu plano permite no máximo ${maxFunnels} funis.`,
        variant: "destructive",
      });
      return;
    }

    try {
      const { data, error } = await supabase.from("funnels").insert({
        user_id: user.id,
        name: newFunnel.name,
        description: newFunnel.description || null,
        telegram_integration_id: newFunnel.telegram_integration_id || null,
      }).select().single();

      if (error) throw error;

      toast({ title: "Funil criado com sucesso!" });
      setIsDialogOpen(false);
      setNewFunnel({ name: "", description: "", telegram_integration_id: "" });

      // Navigate to the funnel builder
      if (data) {
        navigate(`/funnels/${data.id}`);
      }
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleDeleteFunnel = async (id: string) => {
    try {
      const { error } = await supabase.from("funnels").delete().eq("id", id);
      if (error) throw error;
      toast({ title: "Funil removido!" });
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleToggleActive = async (id: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from("funnels")
        .update({ is_active: !isActive })
        .eq("id", id);
      if (error) throw error;
      toast({ title: isActive ? "Funil desativado" : "Funil ativado!" });
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  if (maxFunnels === 0) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
          <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-6">
            <Lock className="w-10 h-10 text-muted-foreground" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Funis de Chat</h1>
          <p className="text-muted-foreground max-w-md mb-6">
            Crie fluxos de conversa automáticos para seu bot do Telegram.
            Este recurso está disponível a partir do plano Basic.
          </p>
          <Button variant="gradient" onClick={() => navigate("/billing")}>
            Ver Planos
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Funis de Chat</h1>
            <p className="text-muted-foreground">
              Crie fluxos de conversa automáticos estilo TypeBot
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="outline">
              {funnels.length}/{maxFunnels === 999 ? "∞" : maxFunnels} funis
            </Badge>
            <Button
              variant="gradient"
              onClick={() => setIsDialogOpen(true)}
              disabled={!canCreateFunnel}
            >
              <Plus className="w-4 h-4 mr-2" />
              Novo Funil
            </Button>
          </div>
        </div>

        {/* Funnels Grid */}
        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="glass-card animate-pulse">
                <CardHeader className="pb-2">
                  <div className="h-6 bg-muted rounded w-3/4" />
                </CardHeader>
                <CardContent>
                  <div className="h-4 bg-muted rounded w-full mb-4" />
                  <div className="h-10 bg-muted rounded" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : funnels.length === 0 ? (
          <Card className="glass-card">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <GitBranch className="w-12 h-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nenhum funil criado</h3>
              <p className="text-muted-foreground text-center max-w-sm mb-4">
                Crie seu primeiro funil para automatizar conversas no Telegram
              </p>
              <Button variant="gradient" onClick={() => setIsDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Criar Funil
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {funnels.map((funnel, index) => (
              <motion.div
                key={funnel.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="glass-card hover:border-telegram/50 transition-colors">
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
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => navigate(`/funnels/${funnel.id}`)}>
                            <Edit className="w-4 h-4 mr-2" />
                            Editar Fluxo
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleToggleActive(funnel.id, funnel.is_active)}>
                            {funnel.is_active ? (
                              <><Pause className="w-4 h-4 mr-2" />Desativar</>
                            ) : (
                              <><Play className="w-4 h-4 mr-2" />Ativar</>
                            )}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => handleDeleteFunnel(funnel.id)}
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Excluir
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {funnel.description && (
                      <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                        {funnel.description}
                      </p>
                    )}
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <MessageCircle className="w-3 h-3" />
                      <span>
                        {new Date(funnel.created_at).toLocaleDateString("pt-BR")}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Create Funnel Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Criar Novo Funil</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome do Funil</Label>
              <Input
                id="name"
                placeholder="Ex: Boas-vindas"
                value={newFunnel.name}
                onChange={(e) => setNewFunnel({ ...newFunnel, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Descrição (opcional)</Label>
              <Textarea
                id="description"
                placeholder="Descreva o objetivo deste funil..."
                value={newFunnel.description}
                onChange={(e) => setNewFunnel({ ...newFunnel, description: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bot">Bot do Telegram (opcional)</Label>
              <Select
                value={newFunnel.telegram_integration_id}
                onValueChange={(value) => setNewFunnel({ ...newFunnel, telegram_integration_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecionar bot..." />
                </SelectTrigger>
                <SelectContent>
                  {telegramBots.map((bot) => (
                    <SelectItem key={bot.id} value={bot.id}>
                      @{bot.bot_username || bot.bot_name || "Bot"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancelar
            </Button>
            <Button variant="gradient" onClick={handleCreateFunnel}>
              Criar Funil
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default FunnelsPage;
