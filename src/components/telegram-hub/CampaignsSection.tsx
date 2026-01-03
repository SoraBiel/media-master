import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  Upload,
  Link2,
  Package,
  Lock,
  Grid,
  List,
  Video,
  FileText,
  Crown,
  FolderOpen,
  ChevronDown,
  Zap,
  Bot,
} from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useSubscription } from "@/hooks/useSubscription";
import { useSearchParams, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

interface CampaignErrorLog {
  index: number;
  url: string;
  error: string;
  timestamp: string;
}

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
  errors_log?: CampaignErrorLog[];
}

interface Destination {
  id: string;
  name: string;
  chat_id: string;
}

interface AdminMedia {
  id: string;
  name: string;
  description: string | null;
  min_plan: string;
  file_count: number;
  image_url: string | null;
  media_files: any;
}

interface UserMedia {
  id: string;
  name: string;
  url: string;
  type: string;
  size: number;
  created_at: string;
}

const PLAN_ORDER = ["free", "basic", "pro", "agency"];
const PLAN_LIMITS = {
  free: { maxFiles: 100, maxSizeMB: 50 },
  basic: { maxFiles: 500, maxSizeMB: 200 },
  pro: { maxFiles: 2000, maxSizeMB: 500 },
  agency: { maxFiles: Infinity, maxSizeMB: 2048 },
};

const CampaignsSection = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [innerTab, setInnerTab] = useState("media");
  const [searchQuery, setSearchQuery] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [adminMedia, setAdminMedia] = useState<AdminMedia[]>([]);
  const [userMedia, setUserMedia] = useState<UserMedia[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [startImmediately, setStartImmediately] = useState(true);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [mediaTab, setMediaTab] = useState<"admin" | "my">("admin");
  
  // Upload states
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Multi-select states
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [selectedMediaIds, setSelectedMediaIds] = useState<Set<string>>(new Set());
  const [isDeletingMultiple, setIsDeletingMultiple] = useState(false);
  const [isTestingDestination, setIsTestingDestination] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; error?: string; botInfo?: any; chatInfo?: any } | null>(null);
  
  const [newCampaign, setNewCampaign] = useState({
    name: "",
    destination_id: "",
    media_pack_id: "",
    use_user_media: false,
    delay_seconds: 2, // Default to faster 2s
    send_mode: "media",
    caption: "",
    scheduled_start: "",
    scheduled_end: "",
    pack_size: 1,
  });
  
  const { toast } = useToast();
  const { user } = useAuth();
  const { currentPlan } = useSubscription();

  const userPlanSlug = currentPlan?.slug || "free";
  const userPlanIndex = PLAN_ORDER.indexOf(userPlanSlug);
  const planLimits = PLAN_LIMITS[userPlanSlug as keyof typeof PLAN_LIMITS] || PLAN_LIMITS.free;

  useEffect(() => {
    const mediaPackId = searchParams.get("media_pack_id");
    if (mediaPackId) {
      setNewCampaign(prev => ({ ...prev, media_pack_id: mediaPackId }));
      setIsDialogOpen(true);
      setInnerTab("campaigns");
    }
  }, [searchParams]);

  const fetchCampaigns = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase.from("campaigns").select("*").eq("user_id", user.id).order("created_at", { ascending: false });
      if (error) throw error;
      // Cast the data to handle Json type for errors_log
      const typedData = (data || []).map(c => ({
        ...c,
        errors_log: Array.isArray(c.errors_log) ? c.errors_log as unknown as CampaignErrorLog[] : undefined
      }));
      setCampaigns(typedData);
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
      const { data, error } = await supabase.from("admin_media").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      setAdminMedia(data || []);
    } catch (error: any) {
      console.error("Error fetching admin media:", error);
    }
  };

  const fetchUserMedia = async () => {
    if (!user) return;
    try {
      const { data: files, error } = await supabase.storage
        .from("user-media")
        .list(`${user.id}`, {
          limit: 100,
          sortBy: { column: "created_at", order: "desc" },
        });

      if (error) {
        console.error("Error fetching user media:", error);
        return;
      }

      if (files && files.length > 0) {
        const mediaItems: UserMedia[] = files
          .filter(f => f.name !== ".emptyFolderPlaceholder")
          .map((file) => {
            const { data: urlData } = supabase.storage
              .from("user-media")
              .getPublicUrl(`${user.id}/${file.name}`);

            const isVideo = /\.(mp4|webm|mov|avi)$/i.test(file.name);
            const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(file.name);

            return {
              id: file.id || file.name,
              name: file.name,
              url: urlData.publicUrl,
              type: isVideo ? "video" : isImage ? "image" : "file",
              size: file.metadata?.size || 0,
              created_at: file.created_at || new Date().toISOString(),
            };
          });
        setUserMedia(mediaItems);
      } else {
        setUserMedia([]);
      }
    } catch (error) {
      console.error("Error fetching user media:", error);
    }
  };

  useEffect(() => {
    fetchCampaigns();
    fetchDestinations();
    fetchAdminMedia();
    fetchUserMedia();

    if (user) {
      const campaignsChannel = supabase.channel("campaigns_realtime_hub")
        .on("postgres_changes", { event: "INSERT", schema: "public", table: "campaigns", filter: `user_id=eq.${user.id}` }, (payload) => {
          const newCamp = payload.new as any;
          setCampaigns(prev => {
            const exists = prev.some(c => c.id === newCamp.id);
            if (exists) return prev;
            return [{
              ...newCamp,
              errors_log: Array.isArray(newCamp.errors_log) ? newCamp.errors_log as CampaignErrorLog[] : undefined
            }, ...prev];
          });
        })
        .on("postgres_changes", { event: "UPDATE", schema: "public", table: "campaigns", filter: `user_id=eq.${user.id}` }, (payload) => {
          const updated = payload.new as any;
          setCampaigns(prev => prev.map(c => c.id === updated.id ? {
            ...updated,
            errors_log: Array.isArray(updated.errors_log) ? updated.errors_log as CampaignErrorLog[] : undefined
          } : c));
        })
        .on("postgres_changes", { event: "DELETE", schema: "public", table: "campaigns", filter: `user_id=eq.${user.id}` }, (payload) => {
          const deleted = payload.old as any;
          setCampaigns(prev => prev.filter(c => c.id !== deleted.id));
        })
        .subscribe();
      
      const mediaChannel = supabase.channel("admin_media_changes_hub")
        .on("postgres_changes", { event: "*", schema: "public", table: "admin_media" }, () => fetchAdminMedia())
        .subscribe();

      return () => { 
        supabase.removeChannel(campaignsChannel);
        supabase.removeChannel(mediaChannel);
      };
    }
  }, [user]);

  const canAccessMedia = (minPlan: string) => {
    return userPlanIndex >= PLAN_ORDER.indexOf(minPlan);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const currentCount = userMedia.length;
    const remaining = planLimits.maxFiles - currentCount;
    
    if (files.length > remaining) {
      toast({
        title: "Limite atingido",
        description: `Você pode adicionar apenas mais ${remaining} arquivos no seu plano.`,
        variant: "destructive",
      });
      setSelectedFiles(files.slice(0, remaining));
    } else {
      setSelectedFiles(files);
    }
  };

  const handleUploadMedia = async () => {
    if (!user || selectedFiles.length === 0) return;
    
    setIsUploading(true);
    let uploadedCount = 0;
    
    try {
      for (const file of selectedFiles) {
        const maxSize = planLimits.maxSizeMB * 1024 * 1024;
        if (file.size > maxSize) {
          toast({
            title: "Arquivo muito grande",
            description: `${file.name} excede o limite de ${planLimits.maxSizeMB}MB do seu plano.`,
            variant: "destructive",
          });
          continue;
        }
        
        const fileName = `${Date.now()}-${file.name}`;
        const { error } = await supabase.storage
          .from("user-media")
          .upload(`${user.id}/${fileName}`, file);
          
        if (error) {
          console.error("Upload error:", error);
          toast({ title: "Erro", description: `Falha ao enviar ${file.name}`, variant: "destructive" });
        } else {
          uploadedCount++;
        }
      }
      
      if (uploadedCount > 0) {
        toast({ title: "Upload concluído", description: `${uploadedCount} arquivo(s) enviado(s)!` });
        fetchUserMedia();
      }
      
      setSelectedFiles([]);
      setIsUploadDialogOpen(false);
    } catch (error: any) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteUserMedia = async (fileName: string) => {
    if (!user) return;
    try {
      const { error } = await supabase.storage
        .from("user-media")
        .remove([`${user.id}/${fileName}`]);
        
      if (error) throw error;
      toast({ title: "Arquivo removido!" });
      fetchUserMedia();
    } catch (error: any) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    }
  };

  const handleDeleteMultipleMedia = async () => {
    if (!user || selectedMediaIds.size === 0) return;
    setIsDeletingMultiple(true);
    
    try {
      const filesToDelete = userMedia
        .filter(m => selectedMediaIds.has(m.id))
        .map(m => `${user.id}/${m.name}`);
      
      const { error } = await supabase.storage
        .from("user-media")
        .remove(filesToDelete);
        
      if (error) throw error;
      
      toast({ 
        title: "Arquivos removidos!", 
        description: `${filesToDelete.length} arquivo(s) excluído(s).` 
      });
      
      setSelectedMediaIds(new Set());
      setIsSelectMode(false);
      fetchUserMedia();
    } catch (error: any) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } finally {
      setIsDeletingMultiple(false);
    }
  };

  const toggleMediaSelection = (mediaId: string) => {
    setSelectedMediaIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(mediaId)) {
        newSet.delete(mediaId);
      } else {
        newSet.add(mediaId);
      }
      return newSet;
    });
  };

  const toggleSelectAll = () => {
    if (selectedMediaIds.size === userMedia.length) {
      setSelectedMediaIds(new Set());
    } else {
      setSelectedMediaIds(new Set(userMedia.map(m => m.id)));
    }
  };

  const usagePercentage = planLimits.maxFiles === Infinity ? 0 : (userMedia.length / planLimits.maxFiles) * 100;
  const isNearLimit = usagePercentage >= 80 && planLimits.maxFiles !== Infinity;

  const handleUseMedia = (mediaId: string, isUserMedia: boolean = false) => {
    setNewCampaign(prev => ({
      ...prev,
      media_pack_id: isUserMedia ? "" : mediaId,
      use_user_media: isUserMedia,
    }));
    setInnerTab("campaigns");
    setIsDialogOpen(true);
  };

  const handleCreateCampaign = async () => {
    if (!newCampaign.name || !newCampaign.destination_id || !user) {
      toast({ title: "Erro", description: "Preencha todos os campos.", variant: "destructive" });
      return;
    }

    if (!newCampaign.media_pack_id && !newCampaign.use_user_media) {
      toast({ title: "Erro", description: "Selecione um pacote de mídia.", variant: "destructive" });
      return;
    }

    const selectedPack = adminMedia.find(m => m.id === newCampaign.media_pack_id);
    const totalCount = newCampaign.use_user_media ? userMedia.length : (selectedPack?.file_count || 0);
    
    if (totalCount === 0) {
      toast({ title: "Erro", description: "Nenhum arquivo disponível.", variant: "destructive" });
      return;
    }

    try {
      // Sempre começa imediatamente
      const { data: campaignData, error } = await supabase.from("campaigns").insert({
        user_id: user.id,
        name: newCampaign.name,
        destination_id: newCampaign.destination_id,
        media_pack_id: newCampaign.use_user_media ? null : newCampaign.media_pack_id,
        delay_seconds: newCampaign.delay_seconds,
        send_mode: newCampaign.send_mode,
        caption: newCampaign.caption || null,
        scheduled_start: null,
        scheduled_end: null,
        status: "running",
        total_count: totalCount,
        started_at: new Date().toISOString(),
        pack_size: newCampaign.pack_size,
      }).select().single();

      if (error) throw error;

      if (campaignData) {
        const { error: invokeError } = await supabase.functions.invoke("campaign-dispatch", { body: { campaignId: campaignData.id } });
        if (invokeError) throw invokeError;
        toast({ title: "Campanha iniciada!" });
      }

      setIsDialogOpen(false);
      setNewCampaign({ name: "", destination_id: "", media_pack_id: "", use_user_media: false, delay_seconds: 10, send_mode: "media", caption: "", scheduled_start: "", scheduled_end: "", pack_size: 1 });
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
      const updates: any = { 
        status: newStatus,
        runner_lock_token: null,
        runner_lock_expires_at: null,
      };
      if (newStatus === "running") updates.started_at = new Date().toISOString();
      if (newStatus === "completed") updates.completed_at = new Date().toISOString();

      await supabase.from("campaigns").update(updates).eq("id", id);
      
      // Ao iniciar/retomar, use o dispatcher (resume-safe)
      if (newStatus === "running") {
        const { error: invokeError } = await supabase.functions.invoke("campaign-dispatch", { body: { campaignId: id } });
        if (invokeError) throw invokeError;
      }
      
      const statusLabels: Record<string, string> = {
        running: "Em execução",
        paused: "Pausado", 
        completed: "Concluído",
        failed: "Parado"
      };
      toast({ title: statusLabels[newStatus] || newStatus });
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
  const filteredAdminMedia = adminMedia.filter((m) => m.name.toLowerCase().includes(searchQuery.toLowerCase()));
  const filteredUserMedia = userMedia.filter((m) => m.name.toLowerCase().includes(searchQuery.toLowerCase()));

  const formatDate = (date: string | null) => {
    if (!date) return "—";
    return new Date(date).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-[400px]"><RefreshCw className="w-8 h-8 animate-spin text-telegram" /></div>;
  }

  return (
    <div className="space-y-6">
      <Tabs value={innerTab} onValueChange={setInnerTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="media" className="gap-2">
            <Image className="w-4 h-4" />
            Mídias
          </TabsTrigger>
          <TabsTrigger value="campaigns" className="gap-2">
            <Megaphone className="w-4 h-4" />
            Campanhas
          </TabsTrigger>
        </TabsList>

        {/* Media Tab */}
        <TabsContent value="media" className="space-y-6">
          <div className="flex items-center justify-between gap-4">
            <div className="relative max-w-sm flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Buscar mídias..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10" />
            </div>
            <div className="flex items-center gap-2">
              <Button variant={viewMode === "grid" ? "secondary" : "ghost"} size="icon" onClick={() => setViewMode("grid")}><Grid className="w-4 h-4" /></Button>
              <Button variant={viewMode === "list" ? "secondary" : "ghost"} size="icon" onClick={() => setViewMode("list")}><List className="w-4 h-4" /></Button>
            </div>
          </div>

          <Tabs value={mediaTab} onValueChange={(v) => setMediaTab(v as "admin" | "my")} className="space-y-4">
            <TabsList>
              <TabsTrigger value="admin" className="gap-2">
                <Package className="w-4 h-4" />
                Pacotes Disponíveis
              </TabsTrigger>
              <TabsTrigger value="my" className="gap-2">
                <FolderOpen className="w-4 h-4" />
                Minhas Mídias
                <Badge variant="outline" className="ml-1">
                  {userMedia.length}/{planLimits.maxFiles === Infinity ? "∞" : planLimits.maxFiles}
                </Badge>
              </TabsTrigger>
            </TabsList>

            {/* Admin Media Packs */}
            <TabsContent value="admin" className="space-y-4">
              {filteredAdminMedia.length > 0 ? (
                <div className={cn(
                  viewMode === "grid" ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" : "space-y-3"
                )}>
                  {filteredAdminMedia.map((pack, index) => {
                    const isLocked = !canAccessMedia(pack.min_plan);
                    return (
                      <motion.div
                        key={pack.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                      >
                        <Card className={cn("overflow-hidden transition-all hover:shadow-lg", isLocked && "opacity-70")}>
                          <div className="relative aspect-video bg-muted">
                            {pack.image_url ? (
                              <img src={pack.image_url} alt={pack.name} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Package className="w-12 h-12 text-muted-foreground" />
                              </div>
                            )}
                            {isLocked && (
                              <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex flex-col items-center justify-center gap-2">
                                <Lock className="w-8 h-8 text-muted-foreground" />
                                <Badge variant="secondary" className="capitalize">{pack.min_plan}+</Badge>
                              </div>
                            )}
                            <Badge className="absolute top-2 right-2">{pack.file_count} arquivos</Badge>
                          </div>
                          <CardContent className="p-4">
                            <h3 className="font-semibold truncate">{pack.name}</h3>
                            {pack.description && (
                              <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{pack.description}</p>
                            )}
                            <div className="mt-3">
                              {isLocked ? (
                                <Button variant="outline" size="sm" className="w-full" onClick={() => navigate("/billing")}>
                                  <Crown className="w-4 h-4 mr-2" />
                                  Upgrade para {pack.min_plan}
                                </Button>
                              ) : (
                                <Button variant="gradient" size="sm" className="w-full" onClick={() => handleUseMedia(pack.id)}>
                                  <Megaphone className="w-4 h-4 mr-2" />
                                  Usar em Campanha
                                </Button>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    );
                  })}
                </div>
              ) : (
                <Card className="p-12 text-center">
                  <Package className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold">Nenhum pacote disponível</h3>
                  <p className="text-muted-foreground">Os pacotes de mídia aparecerão aqui.</p>
                </Card>
              )}
            </TabsContent>

            {/* User's Own Media */}
            <TabsContent value="my" className="space-y-4">
              {/* 80% Limit Alert */}
              {isNearLimit && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <Card className="border-warning/50 bg-warning/10">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-warning/20">
                          <AlertCircle className="w-5 h-5 text-warning" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-warning">Limite próximo!</h4>
                          <p className="text-sm text-muted-foreground">
                            Você está usando {usagePercentage.toFixed(0)}% do seu limite de mídias. 
                            {planLimits.maxFiles - userMedia.length} arquivos restantes.
                          </p>
                        </div>
                        <Button variant="outline" size="sm" onClick={() => navigate("/billing")}>
                          <Crown className="w-4 h-4 mr-2" />
                          Upgrade
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}

              {/* Plan Usage Card */}
              <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-transparent">
                <CardContent className="p-4">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex-1 space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-primary/10">
                          <Crown className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-semibold">Plano {currentPlan?.name || "Free"}</h3>
                          <p className="text-sm text-muted-foreground">
                            Máximo de {planLimits.maxSizeMB}MB por arquivo
                          </p>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Mídias utilizadas</span>
                          <span className={cn("font-medium", isNearLimit && "text-warning")}>
                            {userMedia.length} / {planLimits.maxFiles === Infinity ? "∞" : planLimits.maxFiles}
                          </span>
                        </div>
                        <Progress 
                          value={usagePercentage} 
                          className={cn("h-2", isNearLimit && "[&>div]:bg-warning")}
                        />
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>
                            {planLimits.maxFiles === Infinity 
                              ? "Armazenamento ilimitado" 
                              : `${planLimits.maxFiles - userMedia.length} arquivos restantes`
                            }
                          </span>
                          {planLimits.maxFiles !== Infinity && (
                            <span className={cn(isNearLimit && "text-warning font-medium")}>
                              {usagePercentage.toFixed(0)}% usado
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex flex-col gap-2">
                      <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
                        <DialogTrigger asChild>
                          <Button 
                            variant="gradient" 
                            disabled={planLimits.maxFiles !== Infinity && userMedia.length >= planLimits.maxFiles}
                          >
                            <Upload className="w-4 h-4 mr-2" />
                            Upload Mídia
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Upload de Mídias</DialogTitle>
                            <DialogDescription>
                              Envie imagens ou vídeos do seu computador. Máximo {planLimits.maxSizeMB}MB por arquivo.
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4 py-4">
                            <input
                              type="file"
                              ref={fileInputRef}
                              multiple
                              accept="image/*,video/*"
                              className="hidden"
                              onChange={handleFileSelect}
                            />
                            <div 
                              className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 transition-colors"
                              onClick={() => fileInputRef.current?.click()}
                            >
                              <Upload className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                              <p className="font-medium">Clique para selecionar arquivos</p>
                              <p className="text-sm text-muted-foreground mt-1">ou arraste e solte aqui</p>
                            </div>
                            
                            {selectedFiles.length > 0 && (
                              <div className="space-y-2">
                                <Label>Arquivos selecionados ({selectedFiles.length})</Label>
                                <div className="max-h-40 overflow-y-auto space-y-2">
                                  {selectedFiles.map((file, i) => (
                                    <div key={i} className="flex items-center gap-2 p-2 bg-muted rounded-lg">
                                      {file.type.startsWith("video") ? (
                                        <Video className="w-4 h-4 text-primary" />
                                      ) : (
                                        <Image className="w-4 h-4 text-primary" />
                                      )}
                                      <span className="flex-1 text-sm truncate">{file.name}</span>
                                      <span className="text-xs text-muted-foreground">{formatFileSize(file.size)}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                          <DialogFooter>
                            <Button variant="outline" onClick={() => { setSelectedFiles([]); setIsUploadDialogOpen(false); }}>Cancelar</Button>
                            <Button variant="gradient" onClick={handleUploadMedia} disabled={selectedFiles.length === 0 || isUploading}>
                              {isUploading ? <><RefreshCw className="w-4 h-4 mr-2 animate-spin" />Enviando...</> : <><Upload className="w-4 h-4 mr-2" />Enviar</>}
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                      
                      {userMedia.length > 0 && (
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleUseMedia("", true)}
                        >
                          <Megaphone className="w-4 h-4 mr-2" />
                          Usar em Campanha
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {filteredUserMedia.length > 0 ? (
                <>
                  {/* Multi-select toolbar */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Button
                        variant={isSelectMode ? "secondary" : "outline"}
                        size="sm"
                        onClick={() => {
                          setIsSelectMode(!isSelectMode);
                          if (isSelectMode) setSelectedMediaIds(new Set());
                        }}
                      >
                        {isSelectMode ? "Cancelar Seleção" : "Selecionar Múltiplos"}
                      </Button>
                      
                      {isSelectMode && (
                        <>
                          <Button variant="outline" size="sm" onClick={toggleSelectAll}>
                            {selectedMediaIds.size === userMedia.length ? "Desmarcar Todos" : "Selecionar Todos"}
                          </Button>
                          <Badge variant="secondary">
                            {selectedMediaIds.size} selecionado(s)
                          </Badge>
                        </>
                      )}
                    </div>
                    
                    {isSelectMode && selectedMediaIds.size > 0 && (
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={handleDeleteMultipleMedia}
                        disabled={isDeletingMultiple}
                      >
                        {isDeletingMultiple ? (
                          <><RefreshCw className="w-4 h-4 mr-2 animate-spin" />Excluindo...</>
                        ) : (
                          <><Trash2 className="w-4 h-4 mr-2" />Excluir {selectedMediaIds.size}</>
                        )}
                      </Button>
                    )}
                  </div>

                  <div className={cn(
                    viewMode === "grid" ? "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4" : "space-y-2"
                  )}>
                    {filteredUserMedia.map((media, index) => {
                      const isSelected = selectedMediaIds.has(media.id);
                      return (
                        <motion.div
                          key={media.id}
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: index * 0.03 }}
                        >
                          <Card 
                            className={cn(
                              "overflow-hidden group cursor-pointer transition-all",
                              isSelectMode && isSelected && "ring-2 ring-primary ring-offset-2",
                              isSelectMode && !isSelected && "opacity-70 hover:opacity-100"
                            )}
                            onClick={isSelectMode ? () => toggleMediaSelection(media.id) : undefined}
                          >
                            <div className="relative aspect-square bg-muted">
                              {media.type === "video" ? (
                                <div className="w-full h-full flex items-center justify-center">
                                  <Video className="w-10 h-10 text-muted-foreground" />
                                </div>
                              ) : (
                                <img src={media.url} alt={media.name} className="w-full h-full object-cover" />
                              )}
                              
                              {isSelectMode && (
                                <div className={cn(
                                  "absolute top-2 left-2 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all",
                                  isSelected 
                                    ? "bg-primary border-primary" 
                                    : "bg-background/80 border-muted-foreground"
                                )}>
                                  {isSelected && <CheckCircle2 className="w-4 h-4 text-primary-foreground" />}
                                </div>
                              )}
                              
                              {!isSelectMode && (
                                <div className="absolute inset-0 bg-background/80 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                  <Button size="sm" variant="secondary" onClick={() => handleDeleteUserMedia(media.name)}>
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </div>
                              )}
                            </div>
                            <CardContent className="p-2">
                              <p className="text-xs truncate">{media.name}</p>
                              <p className="text-xs text-muted-foreground">{formatFileSize(media.size)}</p>
                            </CardContent>
                          </Card>
                        </motion.div>
                      );
                    })}
                  </div>
                  
                  {userMedia.length > 0 && (
                    <div className="flex justify-center pt-4">
                      <Button variant="gradient" onClick={() => handleUseMedia("user", true)}>
                        <Megaphone className="w-4 h-4 mr-2" />
                        Usar Minhas Mídias em Campanha
                      </Button>
                    </div>
                  )}
                </>
              ) : (
                <Card className="p-12 text-center">
                  <FolderOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold">Nenhuma mídia própria</h3>
                  <p className="text-muted-foreground mb-4">Faça upload de suas próprias imagens e vídeos.</p>
                  <Button variant="gradient" onClick={() => setIsUploadDialogOpen(true)}>
                    <Upload className="w-4 h-4 mr-2" />
                    Upload Mídia
                  </Button>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </TabsContent>

        {/* Campaigns Tab */}
        <TabsContent value="campaigns" className="space-y-6">
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
                    <div className="flex gap-2">
                      <Select value={newCampaign.destination_id} onValueChange={(value) => { setNewCampaign({ ...newCampaign, destination_id: value }); setTestResult(null); }}>
                        <SelectTrigger className="flex-1"><SelectValue placeholder="Selecione" /></SelectTrigger>
                        <SelectContent>
                          {destinations.map((dest) => (<SelectItem key={dest.id} value={dest.id}><div className="flex items-center gap-2"><Target className="w-4 h-4" />{dest.name}</div></SelectItem>))}
                        </SelectContent>
                      </Select>
                      <Button
                        type="button"
                        variant={testResult?.success ? "success" : "outline"}
                        size="icon"
                        disabled={!newCampaign.destination_id || isTestingDestination}
                        onClick={async () => {
                          setIsTestingDestination(true);
                          setTestResult(null);
                          try {
                            const { data, error } = await supabase.functions.invoke("test-destination", {
                              body: { destinationId: newCampaign.destination_id }
                            });
                            if (error) throw error;
                            setTestResult(data);
                            if (data.success) {
                              toast({ title: "Teste OK!", description: `Bot @${data.botInfo?.username} pode enviar para ${data.chatInfo?.title}` });
                            } else {
                              toast({ title: "Teste falhou", description: data.error, variant: "destructive" });
                            }
                          } catch (error: any) {
                            setTestResult({ success: false, error: error.message });
                            toast({ title: "Erro no teste", description: error.message, variant: "destructive" });
                          } finally {
                            setIsTestingDestination(false);
                          }
                        }}
                        title="Testar destino antes de criar"
                      >
                        {isTestingDestination ? <RefreshCw className="w-4 h-4 animate-spin" /> : testResult?.success ? <CheckCircle2 className="w-4 h-4" /> : <Zap className="w-4 h-4" />}
                      </Button>
                    </div>
                    {destinations.length === 0 && <p className="text-xs text-warning">Adicione destinos na aba "Destinos"</p>}
                    {testResult && !testResult.success && (
                      <p className="text-xs text-destructive flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        {testResult.error}
                      </p>
                    )}
                    {testResult?.success && (
                      <p className="text-xs text-success flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        Bot @{testResult.botInfo?.username} verificado • {testResult.chatInfo?.title}
                      </p>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Fonte de Mídia</Label>
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        type="button"
                        variant={!newCampaign.use_user_media ? "default" : "outline"}
                        className="justify-start"
                        onClick={() => setNewCampaign({ ...newCampaign, use_user_media: false, media_pack_id: "" })}
                      >
                        <Package className="w-4 h-4 mr-2" />
                        Pacote Admin
                      </Button>
                      <Button
                        type="button"
                        variant={newCampaign.use_user_media ? "default" : "outline"}
                        className="justify-start"
                        onClick={() => setNewCampaign({ ...newCampaign, use_user_media: true, media_pack_id: "" })}
                        disabled={userMedia.length === 0}
                      >
                        <FolderOpen className="w-4 h-4 mr-2" />
                        Minhas Mídias ({userMedia.length})
                      </Button>
                    </div>
                  </div>
                  
                  {!newCampaign.use_user_media && (
                    <div className="space-y-2">
                      <Label>Pacote de Mídia</Label>
                      <Select value={newCampaign.media_pack_id} onValueChange={(value) => setNewCampaign({ ...newCampaign, media_pack_id: value })}>
                        <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                        <SelectContent>
                          {adminMedia.filter(m => canAccessMedia(m.min_plan)).map((media) => (<SelectItem key={media.id} value={media.id}><div className="flex items-center gap-2"><Image className="w-4 h-4" />{media.name} ({media.file_count} arquivos)</div></SelectItem>))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Delay</Label>
                      <Select value={String(newCampaign.delay_seconds)} onValueChange={(value) => setNewCampaign({ ...newCampaign, delay_seconds: parseFloat(value) })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="0.001">⚡ Turbo (1ms)</SelectItem>
                          <SelectItem value="0.5">0.5s</SelectItem>
                          <SelectItem value="1">1s</SelectItem>
                          <SelectItem value="2">2s</SelectItem>
                          <SelectItem value="5">5s</SelectItem>
                          <SelectItem value="10">10s</SelectItem>
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
                  
                  {/* Pack Size Selection */}
                  <div className="space-y-2">
                    <Label>Tamanho do Pack</Label>
                    <p className="text-xs text-muted-foreground">Quantas mídias enviar por vez (álbum)</p>
                    <div className="grid grid-cols-3 gap-2">
                      {[1, 2, 5].map((size) => (
                        <Button
                          key={size}
                          type="button"
                          variant={newCampaign.pack_size === size ? "default" : "outline"}
                          onClick={() => setNewCampaign({ ...newCampaign, pack_size: size })}
                          className="w-full"
                        >
                          {size === 1 ? "1 (Individual)" : `${size} por vez`}
                        </Button>
                      ))}
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
              {filteredCampaigns.map((campaign, index) => {
                const isRunning = campaign.status === "running";
                const progress = campaign.progress || 0;
                const successRate = campaign.total_count > 0 
                  ? Math.round((campaign.success_count || 0) / Math.max(campaign.sent_count, 1) * 100)
                  : 0;
                
                return (
                  <motion.div 
                    key={campaign.id} 
                    initial={{ opacity: 0, y: 10 }} 
                    animate={{ opacity: 1, y: 0 }} 
                    transition={{ delay: index * 0.05 }}
                    layout
                  >
                    <Card className={cn(
                      "glass-card overflow-hidden",
                      isRunning && "ring-2 ring-telegram/50"
                    )}>
                      {/* Animated progress bar at top */}
                      {isRunning && (
                        <div className="relative h-1 bg-muted overflow-hidden">
                          <motion.div 
                            className="absolute inset-y-0 left-0 bg-gradient-to-r from-telegram via-success to-telegram"
                            initial={{ width: "0%" }}
                            animate={{ width: `${progress}%` }}
                            transition={{ duration: 0.5, ease: "easeOut" }}
                          />
                          <motion.div
                            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                            animate={{ x: ["-100%", "100%"] }}
                            transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                            style={{ width: "50%" }}
                          />
                        </div>
                      )}
                      
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 space-y-4">
                            <div className="flex items-center gap-3">
                              <motion.div 
                                className={cn(
                                  "p-2 rounded-lg",
                                  isRunning ? "bg-telegram/20" : "bg-muted"
                                )}
                                animate={isRunning ? { scale: [1, 1.1, 1] } : {}}
                                transition={{ duration: 1.5, repeat: Infinity }}
                              >
                                <Megaphone className={cn(
                                  "w-5 h-5",
                                  isRunning ? "text-telegram" : "text-muted-foreground"
                                )} />
                              </motion.div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <h3 className="font-semibold">{campaign.name}</h3>
                                  {getStatusBadge(campaign.status)}
                                </div>
                                <p className="text-sm text-muted-foreground">
                                  Destino: {getDestinationName(campaign.destination_id)} • Delay: {campaign.delay_seconds}s
                                </p>
                              </div>
                            </div>

                            {campaign.status !== "queued" && (
                              <div className="space-y-3">
                                {/* Progress bar with animation */}
                                <div className="space-y-2">
                                  <div className="flex items-center justify-between text-sm">
                                    <span className="flex items-center gap-2">
                                      Progresso
                                      {isRunning && (
                                        <motion.span 
                                          className="inline-flex items-center gap-1 text-telegram text-xs"
                                          animate={{ opacity: [1, 0.5, 1] }}
                                          transition={{ duration: 1, repeat: Infinity }}
                                        >
                                          <div className="w-1.5 h-1.5 rounded-full bg-telegram animate-pulse" />
                                          Enviando...
                                        </motion.span>
                                      )}
                                    </span>
                                    <motion.span 
                                      className="text-muted-foreground font-mono"
                                      key={campaign.sent_count}
                                      initial={{ scale: 1.2, color: "hsl(var(--telegram))" }}
                                      animate={{ scale: 1, color: "hsl(var(--muted-foreground))" }}
                                      transition={{ duration: 0.3 }}
                                    >
                                      {campaign.sent_count} / {campaign.total_count}
                                    </motion.span>
                                  </div>
                                  <div className="relative">
                                    <Progress value={progress} className="h-3" />
                                    {/* Percentage overlay */}
                                    <motion.div 
                                      className="absolute inset-0 flex items-center justify-center"
                                      initial={{ opacity: 0 }}
                                      animate={{ opacity: progress > 10 ? 1 : 0 }}
                                    >
                                      <span className="text-[10px] font-bold text-primary-foreground drop-shadow-sm">
                                        {progress}%
                                      </span>
                                    </motion.div>
                                  </div>
                                </div>
                                
                                {/* Stats grid with animations */}
                                <div className="grid grid-cols-3 gap-3">
                                  <motion.div 
                                    className="p-3 rounded-lg bg-success/10 flex flex-col items-center"
                                    animate={isRunning ? { scale: [1, 1.02, 1] } : {}}
                                    transition={{ duration: 2, repeat: Infinity }}
                                  >
                                    <motion.span 
                                      className="text-lg font-bold text-success"
                                      key={campaign.success_count}
                                      initial={{ scale: 1.3 }}
                                      animate={{ scale: 1 }}
                                    >
                                      {campaign.success_count || 0}
                                    </motion.span>
                                    <span className="text-xs text-muted-foreground">Enviados</span>
                                  </motion.div>
                                  
                                  <motion.div 
                                    className={cn(
                                      "p-3 rounded-lg flex flex-col items-center",
                                      (campaign.error_count || 0) > 0 ? "bg-destructive/10" : "bg-muted"
                                    )}
                                  >
                                    <motion.span 
                                      className={cn(
                                        "text-lg font-bold",
                                        (campaign.error_count || 0) > 0 ? "text-destructive" : "text-muted-foreground"
                                      )}
                                      key={campaign.error_count}
                                      initial={{ scale: 1.3 }}
                                      animate={{ scale: 1 }}
                                    >
                                      {campaign.error_count || 0}
                                    </motion.span>
                                    <span className="text-xs text-muted-foreground">Erros</span>
                                  </motion.div>
                                  
                                  <div className="p-3 rounded-lg bg-muted flex flex-col items-center">
                                    <span className="text-lg font-bold text-muted-foreground">
                                      {campaign.avg_send_time_ms ? `${(campaign.avg_send_time_ms / 1000).toFixed(1)}s` : "—"}
                                    </span>
                                    <span className="text-xs text-muted-foreground">Tempo médio</span>
                                  </div>
                                </div>
                                
                                {/* Success rate indicator */}
                                {campaign.sent_count > 0 && (
                                  <div className="flex items-center gap-2 text-sm">
                                    <span className="text-muted-foreground">Taxa de sucesso:</span>
                                    <motion.div 
                                      className={cn(
                                        "px-2 py-0.5 rounded-full text-xs font-medium",
                                        successRate >= 90 ? "bg-success/20 text-success" :
                                        successRate >= 70 ? "bg-warning/20 text-warning" :
                                        "bg-destructive/20 text-destructive"
                                      )}
                                      initial={{ scale: 0 }}
                                      animate={{ scale: 1 }}
                                    >
                                      {successRate}%
                                    </motion.div>
                                  </div>
                                )}
                              </div>
                            )}

                            {/* Error message and detailed errors log */}
                            {(campaign.error_message || (campaign.error_count && campaign.error_count > 0)) && (
                              <div className="space-y-2">
                                {campaign.error_message && (
                                  <motion.div 
                                    className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm"
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: "auto" }}
                                  >
                                    <AlertCircle className="w-4 h-4 inline mr-2" />
                                    {campaign.error_message}
                                  </motion.div>
                                )}
                                
                                {/* Expandable detailed errors */}
                                {campaign.errors_log && Array.isArray(campaign.errors_log) && campaign.errors_log.length > 0 && (
                                  <details className="group">
                                    <summary className="cursor-pointer text-sm text-muted-foreground hover:text-foreground flex items-center gap-2 py-2">
                                      <ChevronDown className="w-4 h-4 transition-transform group-open:rotate-180" />
                                      Ver detalhes dos {campaign.errors_log.length} erro(s)
                                    </summary>
                                    <motion.div 
                                      className="mt-2 space-y-2 max-h-48 overflow-y-auto"
                                      initial={{ opacity: 0 }}
                                      animate={{ opacity: 1 }}
                                    >
                                      {(campaign.errors_log as Array<{ index: number; url: string; error: string; timestamp: string }>).map((err, idx) => (
                                        <div 
                                          key={idx}
                                          className="p-2 rounded-lg bg-destructive/5 border border-destructive/20 text-xs space-y-1"
                                        >
                                          <div className="flex items-center justify-between">
                                            <span className="font-medium text-destructive">
                                              Mídia #{err.index + 1}
                                            </span>
                                            <span className="text-muted-foreground">
                                              {new Date(err.timestamp).toLocaleTimeString("pt-BR")}
                                            </span>
                                          </div>
                                          <p className="text-destructive/80 break-all">
                                            <strong>Erro:</strong> {err.error}
                                          </p>
                                          <p className="text-muted-foreground truncate" title={err.url}>
                                            <strong>URL:</strong> {err.url}
                                          </p>
                                        </div>
                                      ))}
                                    </motion.div>
                                  </details>
                                )}
                              </div>
                            )}
                          </div>

                          <div className="flex flex-col items-end gap-2">
                            {getActionButtons(campaign)}
                            <span className="text-xs text-muted-foreground">{formatDate(campaign.created_at)}</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          ) : (
            <Card className="p-12 text-center">
              <Megaphone className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold">Nenhuma campanha</h3>
              <p className="text-muted-foreground mb-4">Crie sua primeira campanha para enviar mídias.</p>
              <Button variant="gradient" onClick={() => { setInnerTab("media"); }}>
                <Image className="w-4 h-4 mr-2" />
                Escolher Mídias
              </Button>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CampaignsSection;
