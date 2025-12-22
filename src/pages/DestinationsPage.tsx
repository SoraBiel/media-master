import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Target,
  Plus,
  Search,
  CheckCircle2,
  AlertCircle,
  Clock,
  Users,
  Megaphone,
  Trash2,
  Edit,
  Send,
  ExternalLink,
  RefreshCw,
  Bot,
} from "lucide-react";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useTelegramIntegration } from "@/hooks/useTelegramIntegration";

interface Destination {
  id: string;
  user_id: string;
  telegram_integration_id: string | null;
  name: string;
  chat_id: string;
  chat_title: string | null;
  chat_type: string;
  status: string;
  members_count: number;
  last_sent_at: string | null;
  created_at: string;
}

const DestinationsPage = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingDestination, setEditingDestination] = useState<Destination | null>(null);
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isTesting, setIsTesting] = useState<string | null>(null);
  const [newDestination, setNewDestination] = useState({
    name: "",
    chat_id: "",
    chat_type: "group",
    telegram_integration_id: "",
  });
  const { toast } = useToast();
  const { user } = useAuth();
  const { integration, availableChats, fetchAvailableChats, sendMessage } = useTelegramIntegration();

  const fetchDestinations = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from("destinations")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      setDestinations(data || []);
    } catch (error: any) {
      console.error("Error fetching destinations:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDestinations();
    
    if (user) {
      const channel = supabase
        .channel("destinations_changes")
        .on("postgres_changes", {
          event: "*",
          schema: "public",
          table: "destinations",
          filter: `user_id=eq.${user.id}`,
        }, () => fetchDestinations())
        .subscribe();
      
      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user]);

  const handleAddDestination = async () => {
    if (!newDestination.name || !newDestination.chat_id || !user) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos obrigatórios.",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase.from("destinations").insert({
        user_id: user.id,
        name: newDestination.name,
        chat_id: newDestination.chat_id,
        chat_type: newDestination.chat_type,
        telegram_integration_id: newDestination.telegram_integration_id || null,
        status: "pending",
      });

      if (error) throw error;

      toast({
        title: "Destino adicionado!",
        description: `${newDestination.name} foi adicionado com sucesso.`,
      });
      setIsDialogOpen(false);
      setNewDestination({ name: "", chat_id: "", chat_type: "group", telegram_integration_id: "" });
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleUpdateDestination = async () => {
    if (!editingDestination) return;

    try {
      const { error } = await supabase
        .from("destinations")
        .update({
          name: editingDestination.name,
          chat_id: editingDestination.chat_id,
          chat_type: editingDestination.chat_type,
        })
        .eq("id", editingDestination.id);

      if (error) throw error;

      toast({ title: "Destino atualizado!" });
      setIsEditDialogOpen(false);
      setEditingDestination(null);
    } catch (error: any) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    }
  };

  const handleDeleteDestination = async (id: string) => {
    try {
      const { error } = await supabase.from("destinations").delete().eq("id", id);
      if (error) throw error;
      toast({ title: "Destino removido!" });
    } catch (error: any) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    }
  };

  const handleTestDestination = async (dest: Destination) => {
    if (!integration?.bot_token) {
      toast({
        title: "Bot não conectado",
        description: "Conecte um bot do Telegram primeiro em /telegram",
        variant: "destructive",
      });
      return;
    }

    setIsTesting(dest.id);
    try {
      await sendMessage("✅ Teste de conexão do MediaDrop!", dest.chat_id);
      
      // Update status to verified
      await supabase
        .from("destinations")
        .update({ status: "verified" })
        .eq("id", dest.id);
      
      toast({
        title: "Teste enviado!",
        description: `Mensagem enviada para ${dest.name}`,
      });
    } catch (error: any) {
      // Update status to error
      await supabase
        .from("destinations")
        .update({ status: "error" })
        .eq("id", dest.id);
      
      toast({
        title: "Erro no teste",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsTesting(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "verified":
        return (
          <Badge variant="secondary" className="bg-success/20 text-success">
            <CheckCircle2 className="w-3 h-3 mr-1" />
            Verificado
          </Badge>
        );
      case "pending":
        return (
          <Badge variant="secondary" className="bg-warning/20 text-warning">
            <Clock className="w-3 h-3 mr-1" />
            Pendente
          </Badge>
        );
      case "error":
        return (
          <Badge variant="secondary" className="bg-destructive/20 text-destructive">
            <AlertCircle className="w-3 h-3 mr-1" />
            Erro
          </Badge>
        );
      default:
        return null;
    }
  };

  const filteredDestinations = destinations.filter(
    (d) =>
      d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.chat_id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatDate = (date: string | null) => {
    if (!date) return "Nunca";
    return new Date(date).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <RefreshCw className="w-8 h-8 animate-spin text-telegram" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Destinos</h1>
            <p className="text-muted-foreground">
              Gerencie os grupos e canais onde você envia mídias.
            </p>
          </div>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="gradient">
                <Plus className="w-4 h-4 mr-2" />
                Adicionar Destino
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Adicionar Destino</DialogTitle>
                <DialogDescription>
                  Adicione um grupo ou canal do Telegram para enviar mídias.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="dest-name">Nome interno</Label>
                  <Input
                    id="dest-name"
                    placeholder="Ex: Grupo de Promoções"
                    value={newDestination.name}
                    onChange={(e) => setNewDestination({ ...newDestination, name: e.target.value })}
                  />
                </div>
              <div className="space-y-2">
                <Label htmlFor="dest-chat-id">Chat ID</Label>
                <Input
                  id="dest-chat-id"
                  placeholder="-1001234567890"
                  value={newDestination.chat_id}
                  onChange={(e) => setNewDestination({ ...newDestination, chat_id: e.target.value })}
                />
                <div className="p-3 rounded-lg bg-secondary/50 text-sm space-y-2 mt-2">
                  <p className="font-medium">Como obter o Chat ID:</p>
                  <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                    <li>Adicione o bot <span className="text-telegram font-mono">@meuchatid_bot</span> ao seu grupo</li>
                    <li>Envie qualquer mensagem no grupo</li>
                    <li>O bot responderá com o Chat ID (ex: -1001234567890)</li>
                    <li>Copie o ID e cole aqui</li>
                  </ol>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Tipo</Label>
                <Select
                  value={newDestination.chat_type}
                  onValueChange={(value) => setNewDestination({ ...newDestination, chat_type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="group">
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4" />
                        Grupo
                      </div>
                    </SelectItem>
                    <SelectItem value="supergroup">
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4" />
                        Supergrupo
                      </div>
                    </SelectItem>
                    <SelectItem value="channel">
                      <div className="flex items-center gap-2">
                        <Megaphone className="w-4 h-4" />
                        Canal
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground mt-1">
                  O tipo é informado pelo @meuchatid_bot junto com o Chat ID.
                </p>
              </div>
                
                {!integration?.is_connected && (
                  <div className="p-3 rounded-lg bg-warning/10 border border-warning/30 text-sm">
                    <div className="flex items-center gap-2 text-warning">
                      <Bot className="w-4 h-4" />
                      <span>Conecte um bot primeiro em /telegram</span>
                    </div>
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button variant="gradient" onClick={handleAddDestination}>
                  Adicionar
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Search */}
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar destinos..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Destinations Grid */}
        {filteredDestinations.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredDestinations.map((dest, index) => (
              <motion.div
                key={dest.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="glass-card h-full hover:border-telegram/30 transition-colors">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${dest.chat_type === "channel" ? "bg-purple-500/20" : "bg-telegram/20"}`}>
                          {dest.chat_type === "channel" ? (
                            <Megaphone className="w-5 h-5 text-purple-400" />
                          ) : (
                            <Users className="w-5 h-5 text-telegram" />
                          )}
                        </div>
                        <div>
                          <CardTitle className="text-base">{dest.name}</CardTitle>
                          <CardDescription className="flex items-center gap-1 text-xs">
                            {dest.chat_id}
                          </CardDescription>
                        </div>
                      </div>
                      {getStatusBadge(dest.status)}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Tipo</span>
                        <span className="capitalize">{dest.chat_type}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Último envio</span>
                        <span>{formatDate(dest.last_sent_at)}</span>
                      </div>
                      <div className="flex gap-2 pt-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="flex-1"
                          onClick={() => handleTestDestination(dest)}
                          disabled={isTesting === dest.id}
                        >
                          {isTesting === dest.id ? (
                            <RefreshCw className="w-4 h-4 animate-spin" />
                          ) : (
                            <>
                              <Send className="w-4 h-4 mr-1" />
                              Testar
                            </>
                          )}
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => {
                            setEditingDestination(dest);
                            setIsEditDialogOpen(true);
                          }}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="text-destructive hover:text-destructive"
                          onClick={() => handleDeleteDestination(dest.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        ) : (
          <Card className="glass-card">
            <CardContent className="p-12 text-center">
              <Target className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nenhum destino encontrado</h3>
              <p className="text-muted-foreground mb-4">
                {searchQuery
                  ? "Tente buscar por outro termo."
                  : "Adicione seu primeiro grupo ou canal para começar."}
              </p>
              {!searchQuery && (
                <Button variant="gradient" onClick={() => setIsDialogOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Adicionar Destino
                </Button>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Editar Destino</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Nome interno</Label>
              <Input
                value={editingDestination?.name || ""}
                onChange={(e) => setEditingDestination(prev => prev ? { ...prev, name: e.target.value } : null)}
              />
            </div>
            <div className="space-y-2">
              <Label>Chat ID</Label>
              <Input
                value={editingDestination?.chat_id || ""}
                onChange={(e) => setEditingDestination(prev => prev ? { ...prev, chat_id: e.target.value } : null)}
              />
            </div>
            <div className="space-y-2">
              <Label>Tipo</Label>
              <Select
                value={editingDestination?.chat_type || "group"}
                onValueChange={(value) => setEditingDestination(prev => prev ? { ...prev, chat_type: value } : null)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="group">Grupo</SelectItem>
                  <SelectItem value="supergroup">Supergrupo</SelectItem>
                  <SelectItem value="channel">Canal</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancelar
            </Button>
            <Button variant="gradient" onClick={handleUpdateDestination}>
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default DestinationsPage;