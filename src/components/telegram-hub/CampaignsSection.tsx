import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
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
  Calendar,
  Image,
  Target,
  RefreshCw,
  Trash2,
} from "lucide-react";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useSubscription } from "@/hooks/useSubscription";
import { useSearchParams } from "react-router-dom";

interface Campaign {
  id: string;
  user_id: string;
  destination_id: string | null;
  media_pack_id: string | null;
  name: string;
  status: string;
  progress: number;
  sent_count: number;
  total_count: number;
  delay_seconds: number;
  send_mode: string;
  caption: string | null;
  error_message: string | null;
  started_at: string | null;
  completed_at: string | null;
  scheduled_start: string | null;
  scheduled_end: string | null;
  created_at: string;
  success_count?: number;
  error_count?: number;
  avg_send_time_ms?: number;
}

interface Destination {
  id: string;
  name: string;
  chat_id: string;
}

interface AdminMedia {
  id: string;
  name: string;
  min_plan: string;
  file_count: number;
}

const CampaignsSection = () => {
  const [searchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [adminMedia, setAdminMedia] = useState<AdminMedia[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [startImmediately, setStartImmediately] = useState(true);
  const [newCampaign, setNewCampaign] = useState({
    name: "",
    destination_id: "",
    media_pack_id: "",
    delay_seconds: 10,
    send_mode: "media",
    caption: "",
    scheduled_start: "",
    scheduled_end: "",
  });
  const { toast } = useToast();
  const { user } = useAuth();
  const { currentPlan } = useSubscription();

  useEffect(() => {
    const mediaPackId = searchParams.get("media_pack_id");
    if (mediaPackId) {
      setNewCampaign(prev => ({ ...prev, media_pack_id: mediaPackId }));
      setIsDialogOpen(true);
    }
  }, [searchParams]);

  const fetchCampaigns = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase.from("campaigns").select("*").eq("user_id", user.id).order("created_at", { ascending: false });
      if (error) throw error;
      setCampaigns(data || []);
    } catch (error: any) {
      console.error("Error fetching campaigns:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchDestinations = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase.from("destinations").select("id, name, chat_id").eq("user_id", user.id);
      if (error) throw error;
      setDestinations(data || []);
    } catch (error: any) {
      console.error("Error fetching destinations:", error);
    }
  };

  const fetchAdminMedia = async () => {
    try {
      const { data, error } = await supabase.from("admin_media").select("id, name, min_plan, file_count").order("created_at", { ascending: false });
      if (error) throw error;
      setAdminMedia(data || []);
    } catch (error: any) {
      console.error("Error fetching admin media:", error);
    }
  };

  useEffect(() => {
    fetchCampaigns();
    fetchDestinations();
    fetchAdminMedia();

    if (user) {
      const campaignsChannel = supabase.channel("campaigns_changes_hub").on("postgres_changes", { event: "*", schema: "public", table: "campaigns", filter: `user_id=eq.${user.id}` }, () => fetchCampaigns()).subscribe();
      return () => { supabase.removeChannel(campaignsChannel); };
    }
  }, [user]);

  const canAccessMedia = (minPlan: string) => {
    const planOrder = ["free", "basic", "pro", "agency"];
    const userPlanSlug = currentPlan?.slug || "free";
    return planOrder.indexOf(userPlanSlug) >= planOrder.indexOf(minPlan);
  };

  const handleCreateCampaign = async () => {
    if (!newCampaign.name || !newCampaign.destination_id || !newCampaign.media_pack_id || !user) {
      toast({ title: "Erro", description: "Preencha todos os campos.", variant: "destructive" });
      return;
    }

    const selectedPack = adminMedia.find(m => m.id === newCampaign.media_pack_id);
    if (!selectedPack || !canAccessMedia(selectedPack.min_plan)) {
      toast({ title: "Erro", description: "Pacote inválido ou inacessível.", variant: "destructive" });
      return;
    }

    try {
      const { data: campaignData, error } = await supabase.from("campaigns").insert({
        user_id: user.id,
        name: newCampaign.name,
        destination_id: newCampaign.destination_id,
        media_pack_id: newCampaign.media_pack_id,
        delay_seconds: newCampaign.delay_seconds,
        send_mode: newCampaign.send_mode,
        caption: newCampaign.caption || null,
        scheduled_start: startImmediately ? null : newCampaign.scheduled_start || null,
        scheduled_end: startImmediately ? null : newCampaign.scheduled_end || null,
        status: startImmediately ? "running" : "queued",
        total_count: selectedPack.file_count || 0,
        started_at: startImmediately ? new Date().toISOString() : null,
      }).select().single();

      if (error) throw error;

      if (startImmediately && campaignData) {
        await supabase.functions.invoke("campaign-dispatch", { body: { campaignId: campaignData.id } });
        toast({ title: "Campanha iniciada!" });
      } else {
        toast({ title: "Campanha agendada!" });
      }

      setIsDialogOpen(false);
      setNewCampaign({ name: "", destination_id: "", media_pack_id: "", delay_seconds: 10, send_mode: "media", caption: "", scheduled_start: "", scheduled_end: "" });
      setStartImmediately(true);
    } catch (error: any) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    }
  };

  const handleDeleteCampaign = async (id: string) => {
    try {
      await supabase.from("campaigns").delete().eq("id", id);
      toast({ title: "Campanha removida!" });
    } catch (error: any) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    }
  };

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    try {
      const updates: any = { status: newStatus };
      if (newStatus === "running") updates.started_at = new Date().toISOString();
      if (newStatus === "completed") updates.completed_at = new Date().toISOString();

      await supabase.from("campaigns").update(updates).eq("id", id);
      
      if (newStatus === "running") {
        const campaign = campaigns.find(c => c.id === id);
        if (campaign) await supabase.functions.invoke("campaign-dispatch", { body: { campaignId: campaign.id } });
      }
      
      toast({ title: `Status atualizado para ${newStatus}` });
    } catch (error: any) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "running": return <Badge className="bg-success/20 text-success"><div className="w-2 h-2 rounded-full bg-success animate-pulse mr-1" />Em execução</Badge>;
      case "queued": return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" />Agendado</Badge>;
      case "paused": return <Badge className="bg-warning/20 text-warning"><Pause className="w-3 h-3 mr-1" />Pausado</Badge>;
      case "completed": return <Badge className="bg-telegram/20 text-telegram"><CheckCircle2 className="w-3 h-3 mr-1" />Concluído</Badge>;
      case "failed": return <Badge className="bg-destructive/20 text-destructive"><AlertCircle className="w-3 h-3 mr-1" />Falha</Badge>;
      default: return null;
    }
  };

  const getActionButtons = (campaign: Campaign) => {
    switch (campaign.status) {
      case "running":
        return (
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => handleUpdateStatus(campaign.id, "paused")}><Pause className="w-4 h-4 mr-1" />Pausar</Button>
            <Button variant="destructive" size="sm" onClick={() => handleUpdateStatus(campaign.id, "failed")}><StopCircle className="w-4 h-4 mr-1" />Parar</Button>
          </div>
        );
      case "queued":
        return (
          <div className="flex gap-2">
            <Button variant="gradient" size="sm" onClick={() => handleUpdateStatus(campaign.id, "running")}><Play className="w-4 h-4 mr-1" />Iniciar</Button>
            <Button variant="ghost" size="icon" onClick={() => handleDeleteCampaign(campaign.id)}><Trash2 className="w-4 h-4" /></Button>
          </div>
        );
      case "paused":
        return (
          <div className="flex gap-2">
            <Button variant="gradient" size="sm" onClick={() => handleUpdateStatus(campaign.id, "running")}><Play className="w-4 h-4 mr-1" />Retomar</Button>
            <Button variant="destructive" size="sm" onClick={() => handleDeleteCampaign(campaign.id)}><StopCircle className="w-4 h-4 mr-1" />Cancelar</Button>
          </div>
        );
      case "completed":
      case "failed":
        return <Button variant="ghost" size="icon" onClick={() => handleDeleteCampaign(campaign.id)}><Trash2 className="w-4 h-4" /></Button>;
      default: return null;
    }
  };

  const getDestinationName = (destId: string | null) => {
    if (!destId) return "Sem destino";
    const dest = destinations.find(d => d.id === destId);
    return dest?.name || "Destino não encontrado";
  };

  const filteredCampaigns = campaigns.filter((c) => c.name.toLowerCase().includes(searchQuery.toLowerCase()));

  const formatDate = (date: string | null) => {
    if (!date) return "—";
    return new Date(date).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
  };

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-[400px]"><RefreshCw className="w-8 h-8 animate-spin text-telegram" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Buscar campanhas..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10" />
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="gradient"><Plus className="w-4 h-4 mr-2" />Nova Campanha</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Nova Campanha</DialogTitle>
              <DialogDescription>Configure uma nova campanha de envio de mídias.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Nome</Label>
                <Input placeholder="Ex: Promoção Natal" value={newCampaign.name} onChange={(e) => setNewCampaign({ ...newCampaign, name: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Destino</Label>
                <Select value={newCampaign.destination_id} onValueChange={(value) => setNewCampaign({ ...newCampaign, destination_id: value })}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    {destinations.map((dest) => (<SelectItem key={dest.id} value={dest.id}><div className="flex items-center gap-2"><Target className="w-4 h-4" />{dest.name}</div></SelectItem>))}
                  </SelectContent>
                </Select>
                {destinations.length === 0 && <p className="text-xs text-warning">Adicione destinos na aba "Destinos"</p>}
              </div>
              <div className="space-y-2">
                <Label>Pacote de Mídia</Label>
                <Select value={newCampaign.media_pack_id} onValueChange={(value) => setNewCampaign({ ...newCampaign, media_pack_id: value })}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    {adminMedia.filter(m => canAccessMedia(m.min_plan)).map((media) => (<SelectItem key={media.id} value={media.id}><div className="flex items-center gap-2"><Image className="w-4 h-4" />{media.name} ({media.file_count} arquivos)</div></SelectItem>))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Delay</Label>
                  <Select value={String(newCampaign.delay_seconds)} onValueChange={(value) => setNewCampaign({ ...newCampaign, delay_seconds: parseInt(value) })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="5">5s</SelectItem>
                      <SelectItem value="10">10s</SelectItem>
                      <SelectItem value="15">15s</SelectItem>
                      <SelectItem value="30">30s</SelectItem>
                      <SelectItem value="60">1min</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Modo</Label>
                  <Select value={newCampaign.send_mode} onValueChange={(value) => setNewCampaign({ ...newCampaign, send_mode: value })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="media">Mídia</SelectItem>
                      <SelectItem value="document">Documento</SelectItem>
                      <SelectItem value="album">Álbum</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Caption (opcional)</Label>
                <Textarea placeholder="Texto que acompanha a mídia." rows={2} value={newCampaign.caption} onChange={(e) => setNewCampaign({ ...newCampaign, caption: e.target.value })} />
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/50">
                <div><Label>Iniciar imediatamente</Label></div>
                <Switch checked={startImmediately} onCheckedChange={setStartImmediately} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
              <Button variant="gradient" onClick={handleCreateCampaign}>{startImmediately ? <><Play className="w-4 h-4 mr-2" />Criar e Iniciar</> : <><Calendar className="w-4 h-4 mr-2" />Agendar</>}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {filteredCampaigns.length > 0 ? (
        <div className="space-y-4">
          {filteredCampaigns.map((campaign, index) => (
            <motion.div key={campaign.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }}>
              <Card className="glass-card">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-telegram/20"><Megaphone className="w-5 h-5 text-telegram" /></div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold">{campaign.name}</h3>
                            {getStatusBadge(campaign.status)}
                          </div>
                          <p className="text-sm text-muted-foreground">Destino: {getDestinationName(campaign.destination_id)} • Delay: {campaign.delay_seconds}s</p>
                        </div>
                      </div>

                      {campaign.status !== "queued" && (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span>Progresso</span>
                            <span className="text-muted-foreground">{campaign.sent_count} / {campaign.total_count}</span>
                          </div>
                          <Progress value={campaign.progress} className="h-2" />
                        </div>
                      )}

                      {(campaign.status === "running" || campaign.status === "completed" || campaign.status === "failed") && (
                        <div className="grid grid-cols-3 gap-4 p-3 rounded-lg bg-secondary/50">
                          <div className="text-center">
                            <div className="flex items-center justify-center gap-1"><CheckCircle2 className="w-4 h-4 text-success" /><span className="text-lg font-semibold text-success">{campaign.success_count || 0}</span></div>
                            <p className="text-xs text-muted-foreground">Sucesso</p>
                          </div>
                          <div className="text-center">
                            <div className="flex items-center justify-center gap-1"><AlertCircle className="w-4 h-4 text-destructive" /><span className="text-lg font-semibold text-destructive">{campaign.error_count || 0}</span></div>
                            <p className="text-xs text-muted-foreground">Erros</p>
                          </div>
                          <div className="text-center">
                            <div className="flex items-center justify-center gap-1"><Clock className="w-4 h-4 text-telegram" /><span className="text-lg font-semibold text-telegram">{campaign.avg_send_time_ms ? `${(campaign.avg_send_time_ms / 1000).toFixed(1)}s` : '—'}</span></div>
                            <p className="text-xs text-muted-foreground">Tempo médio</p>
                          </div>
                        </div>
                      )}

                      {campaign.error_message && (
                        <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-sm"><p className="text-destructive">{campaign.error_message}</p></div>
                      )}

                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        {campaign.started_at && <div className="flex items-center gap-1"><Play className="w-4 h-4" />Início: {formatDate(campaign.started_at)}</div>}
                        {campaign.completed_at && <div className="flex items-center gap-1"><Clock className="w-4 h-4" />Fim: {formatDate(campaign.completed_at)}</div>}
                      </div>
                    </div>
                    <div>{getActionButtons(campaign)}</div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      ) : (
        <Card className="glass-card">
          <CardContent className="p-12 text-center">
            <Megaphone className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhuma campanha</h3>
            <p className="text-muted-foreground mb-4">{searchQuery ? "Tente outro termo." : "Crie sua primeira campanha."}</p>
            {!searchQuery && <Button variant="gradient" onClick={() => setIsDialogOpen(true)}><Plus className="w-4 h-4 mr-2" />Nova Campanha</Button>}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default CampaignsSection;
