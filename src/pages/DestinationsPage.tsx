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
} from "lucide-react";
import { useState } from "react";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";

const DestinationsPage = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newDestination, setNewDestination] = useState({
    name: "",
    link: "",
    type: "group",
    credential: "",
  });
  const { toast } = useToast();

  const destinations = [
    {
      id: 1,
      name: "Promoções Black Friday",
      link: "t.me/+abc123",
      type: "group",
      credential: "MediaDrop Bot",
      status: "verified",
      members: 1250,
      lastSent: "há 2 horas",
    },
    {
      id: 2,
      name: "Canal de Ofertas",
      link: "@ofertas_diarias",
      type: "channel",
      credential: "Conta Principal",
      status: "verified",
      members: 5420,
      lastSent: "há 30 min",
    },
    {
      id: 3,
      name: "Grupo VIP",
      link: "t.me/+xyz789",
      type: "group",
      credential: "MediaDrop Bot",
      status: "pending",
      members: 0,
      lastSent: "Nunca",
    },
    {
      id: 4,
      name: "Newsletter Tech",
      link: "@tech_news_br",
      type: "channel",
      credential: "Conta Principal",
      status: "error",
      members: 890,
      lastSent: "há 3 dias",
    },
  ];

  const handleAddDestination = () => {
    if (!newDestination.name || !newDestination.link) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos obrigatórios.",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Destino adicionado!",
      description: `${newDestination.name} foi adicionado com sucesso.`,
    });
    setIsDialogOpen(false);
    setNewDestination({ name: "", link: "", type: "group", credential: "" });
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
      d.link.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
                  <Label htmlFor="dest-link">Link ou @username</Label>
                  <Input
                    id="dest-link"
                    placeholder="t.me/+abc123 ou @meucanal"
                    value={newDestination.link}
                    onChange={(e) => setNewDestination({ ...newDestination, link: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Tipo</Label>
                  <Select
                    value={newDestination.type}
                    onValueChange={(value) => setNewDestination({ ...newDestination, type: value })}
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
                      <SelectItem value="channel">
                        <div className="flex items-center gap-2">
                          <Megaphone className="w-4 h-4" />
                          Canal
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Credencial</Label>
                  <Select
                    value={newDestination.credential}
                    onValueChange={(value) => setNewDestination({ ...newDestination, credential: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione uma conexão" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="bot-1">MediaDrop Bot</SelectItem>
                      <SelectItem value="session-1">Conta Principal</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
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
                      <div className={`p-2 rounded-lg ${dest.type === "group" ? "bg-telegram/20" : "bg-purple-500/20"}`}>
                        {dest.type === "group" ? (
                          <Users className="w-5 h-5 text-telegram" />
                        ) : (
                          <Megaphone className="w-5 h-5 text-purple-400" />
                        )}
                      </div>
                      <div>
                        <CardTitle className="text-base">{dest.name}</CardTitle>
                        <CardDescription className="flex items-center gap-1">
                          {dest.link}
                          <ExternalLink className="w-3 h-3" />
                        </CardDescription>
                      </div>
                    </div>
                    {getStatusBadge(dest.status)}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Credencial</span>
                      <span>{dest.credential}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Membros</span>
                      <span>{dest.members.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Último envio</span>
                      <span>{dest.lastSent}</span>
                    </div>
                    <div className="flex gap-2 pt-2">
                      <Button variant="outline" size="sm" className="flex-1">
                        <Send className="w-4 h-4 mr-1" />
                        Testar
                      </Button>
                      <Button variant="ghost" size="icon">
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {filteredDestinations.length === 0 && (
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
    </DashboardLayout>
  );
};

export default DestinationsPage;
