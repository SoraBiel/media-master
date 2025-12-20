import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
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
  Megaphone,
  Plus,
  Search,
  Play,
  Pause,
  StopCircle,
  CheckCircle2,
  Clock,
  AlertCircle,
  Settings,
  BarChart3,
  Calendar,
  Image,
  Target,
} from "lucide-react";
import { useState } from "react";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";

const CampaignsPage = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();

  const campaigns = [
    {
      id: 1,
      name: "Black Friday 2024",
      status: "running",
      destination: "Promoções Black Friday",
      progress: 68,
      sent: 342,
      total: 500,
      delay: "10s",
      startTime: "2024-12-15 10:00",
      endTime: "2024-12-15 18:00",
    },
    {
      id: 2,
      name: "Newsletter Dezembro",
      status: "queued",
      destination: "Canal de Ofertas",
      progress: 0,
      sent: 0,
      total: 200,
      delay: "15s",
      startTime: "2024-12-16 09:00",
      endTime: null,
    },
    {
      id: 3,
      name: "Ofertas Relâmpago",
      status: "paused",
      destination: "Grupo VIP",
      progress: 45,
      sent: 90,
      total: 200,
      delay: "5s",
      startTime: "2024-12-14 14:00",
      endTime: null,
    },
    {
      id: 4,
      name: "Lançamento Natal",
      status: "completed",
      destination: "Newsletter Tech",
      progress: 100,
      sent: 150,
      total: 150,
      delay: "10s",
      startTime: "2024-12-13 08:00",
      endTime: "2024-12-13 12:30",
    },
    {
      id: 5,
      name: "Cyber Monday",
      status: "failed",
      destination: "Promoções Black Friday",
      progress: 23,
      sent: 46,
      total: 200,
      delay: "10s",
      startTime: "2024-12-02 10:00",
      endTime: null,
      error: "FloodWait: aguarde 2 horas",
    },
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "running":
        return (
          <Badge className="bg-success/20 text-success">
            <div className="w-2 h-2 rounded-full bg-success animate-pulse mr-1" />
            Em execução
          </Badge>
        );
      case "queued":
        return (
          <Badge variant="secondary">
            <Clock className="w-3 h-3 mr-1" />
            Agendado
          </Badge>
        );
      case "paused":
        return (
          <Badge className="bg-warning/20 text-warning">
            <Pause className="w-3 h-3 mr-1" />
            Pausado
          </Badge>
        );
      case "completed":
        return (
          <Badge className="bg-telegram/20 text-telegram">
            <CheckCircle2 className="w-3 h-3 mr-1" />
            Concluído
          </Badge>
        );
      case "failed":
        return (
          <Badge className="bg-destructive/20 text-destructive">
            <AlertCircle className="w-3 h-3 mr-1" />
            Falha
          </Badge>
        );
      default:
        return null;
    }
  };

  const getActionButtons = (status: string) => {
    switch (status) {
      case "running":
        return (
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <Pause className="w-4 h-4 mr-1" />
              Pausar
            </Button>
            <Button variant="destructive" size="sm">
              <StopCircle className="w-4 h-4 mr-1" />
              Parar
            </Button>
          </div>
        );
      case "queued":
        return (
          <div className="flex gap-2">
            <Button variant="gradient" size="sm">
              <Play className="w-4 h-4 mr-1" />
              Iniciar agora
            </Button>
            <Button variant="outline" size="sm">
              <Settings className="w-4 h-4" />
            </Button>
          </div>
        );
      case "paused":
        return (
          <div className="flex gap-2">
            <Button variant="gradient" size="sm">
              <Play className="w-4 h-4 mr-1" />
              Retomar
            </Button>
            <Button variant="destructive" size="sm">
              <StopCircle className="w-4 h-4 mr-1" />
              Cancelar
            </Button>
          </div>
        );
      case "completed":
        return (
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <BarChart3 className="w-4 h-4 mr-1" />
              Relatório
            </Button>
          </div>
        );
      case "failed":
        return (
          <div className="flex gap-2">
            <Button variant="gradient" size="sm">
              <Play className="w-4 h-4 mr-1" />
              Tentar novamente
            </Button>
            <Button variant="outline" size="sm">
              <BarChart3 className="w-4 h-4 mr-1" />
              Ver logs
            </Button>
          </div>
        );
      default:
        return null;
    }
  };

  const filteredCampaigns = campaigns.filter((c) =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Campanhas</h1>
            <p className="text-muted-foreground">
              Crie e gerencie campanhas de envio de mídias.
            </p>
          </div>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="gradient">
                <Plus className="w-4 h-4 mr-2" />
                Nova Campanha
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>Nova Campanha</DialogTitle>
                <DialogDescription>
                  Configure uma nova campanha de envio de mídias.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Nome da campanha</Label>
                  <Input placeholder="Ex: Promoção Natal 2024" />
                </div>
                <div className="space-y-2">
                  <Label>Destino</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um destino" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="dest-1">
                        <div className="flex items-center gap-2">
                          <Target className="w-4 h-4" />
                          Promoções Black Friday
                        </div>
                      </SelectItem>
                      <SelectItem value="dest-2">
                        <div className="flex items-center gap-2">
                          <Target className="w-4 h-4" />
                          Canal de Ofertas
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Mídias</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione uma pasta ou tag" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="folder-1">
                        <div className="flex items-center gap-2">
                          <Image className="w-4 h-4" />
                          Black Friday 2024 (48 arquivos)
                        </div>
                      </SelectItem>
                      <SelectItem value="folder-2">
                        <div className="flex items-center gap-2">
                          <Image className="w-4 h-4" />
                          Natal (32 arquivos)
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Delay entre envios</Label>
                    <Select defaultValue="10">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="5">5 segundos</SelectItem>
                        <SelectItem value="10">10 segundos</SelectItem>
                        <SelectItem value="15">15 segundos</SelectItem>
                        <SelectItem value="30">30 segundos</SelectItem>
                        <SelectItem value="60">1 minuto</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Modo de envio</Label>
                    <Select defaultValue="media">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="media">Como mídia</SelectItem>
                        <SelectItem value="document">Como documento</SelectItem>
                        <SelectItem value="album">Álbum (até 10)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Caption (opcional)</Label>
                  <Textarea
                    placeholder="Texto que acompanha a mídia. Use {{nome}}, {{data}} para variáveis."
                    rows={3}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Início</Label>
                    <Input type="datetime-local" />
                  </div>
                  <div className="space-y-2">
                    <Label>Fim (opcional)</Label>
                    <Input type="datetime-local" />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button
                  variant="gradient"
                  onClick={() => {
                    setIsDialogOpen(false);
                    toast({
                      title: "Campanha criada!",
                      description: "Sua campanha foi agendada com sucesso.",
                    });
                  }}
                >
                  <Calendar className="w-4 h-4 mr-2" />
                  Criar Campanha
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Search */}
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar campanhas..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Campaigns List */}
        <div className="space-y-4">
          {filteredCampaigns.map((campaign, index) => (
            <motion.div
              key={campaign.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card className="glass-card">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-telegram/20">
                          <Megaphone className="w-5 h-5 text-telegram" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold">{campaign.name}</h3>
                            {getStatusBadge(campaign.status)}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            Destino: {campaign.destination} • Delay: {campaign.delay}
                          </p>
                        </div>
                      </div>

                      {campaign.status !== "queued" && (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span>Progresso</span>
                            <span className="text-muted-foreground">
                              {campaign.sent} / {campaign.total} enviados
                            </span>
                          </div>
                          <Progress value={campaign.progress} className="h-2" />
                        </div>
                      )}

                      {campaign.error && (
                        <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-sm">
                          <p className="text-destructive">{campaign.error}</p>
                        </div>
                      )}

                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          Início: {campaign.startTime}
                        </div>
                        {campaign.endTime && (
                          <div className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            Fim: {campaign.endTime}
                          </div>
                        )}
                      </div>
                    </div>

                    <div>{getActionButtons(campaign.status)}</div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {filteredCampaigns.length === 0 && (
          <Card className="glass-card">
            <CardContent className="p-12 text-center">
              <Megaphone className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nenhuma campanha encontrada</h3>
              <p className="text-muted-foreground mb-4">
                {searchQuery
                  ? "Tente buscar por outro termo."
                  : "Crie sua primeira campanha para começar a enviar mídias."}
              </p>
              {!searchQuery && (
                <Button variant="gradient" onClick={() => setIsDialogOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Nova Campanha
                </Button>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
};

export default CampaignsPage;
