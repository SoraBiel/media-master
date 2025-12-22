import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Image,
  Video,
  FileText,
  Search,
  Grid,
  List,
  Download,
  Lock,
  Package,
  RefreshCw,
  Play,
  Megaphone,
} from "lucide-react";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useSubscription } from "@/hooks/useSubscription";
import { useNavigate } from "react-router-dom";

interface AdminMedia {
  id: string;
  name: string;
  description: string | null;
  pack_type: string;
  min_plan: string;
  file_count: number;
  image_url: string | null;
  media_files: any;
  created_at: string;
}

const PLAN_ORDER = ["free", "basic", "pro", "agency"];

const MediaLibraryPage = () => {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [mediaPacks, setMediaPacks] = useState<AdminMedia[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPack, setSelectedPack] = useState<AdminMedia | null>(null);
  
  const { user } = useAuth();
  const { currentPlan, isLoading: isPlanLoading } = useSubscription();
  const navigate = useNavigate();

  const userPlanIndex = PLAN_ORDER.indexOf(currentPlan?.slug || "free");

  useEffect(() => {
    const fetchMediaPacks = async () => {
      if (!user) return;
      
      const { data, error } = await supabase
        .from("admin_media")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching media packs:", error);
      } else {
        setMediaPacks(data || []);
      }
      setIsLoading(false);
    };

    fetchMediaPacks();

    // Realtime subscription
    if (user) {
      const channel = supabase
        .channel("admin_media_changes")
        .on("postgres_changes", {
          event: "*",
          schema: "public",
          table: "admin_media",
        }, () => fetchMediaPacks())
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user]);

  const handleUsePack = (pack: AdminMedia) => {
    navigate(`/campaigns?media_pack_id=${pack.id}`);
  };

  const canAccessPack = (pack: AdminMedia) => {
    const packPlanIndex = PLAN_ORDER.indexOf(pack.min_plan);
    return userPlanIndex >= packPlanIndex;
  };

  const filteredPacks = mediaPacks.filter((pack) =>
    pack.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    pack.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getMediaIcon = (type: string) => {
    if (type.startsWith("image")) return <Image className="w-5 h-5 text-telegram" />;
    if (type.startsWith("video")) return <Video className="w-5 h-5 text-purple-400" />;
    return <FileText className="w-5 h-5 text-warning" />;
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / 1024 / 1024).toFixed(2) + " MB";
  };

  if (isLoading || isPlanLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <RefreshCw className="w-8 h-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Biblioteca de Mídias</h1>
            <p className="text-muted-foreground">
              Acesse os pacotes de mídia disponíveis para o seu plano.
            </p>
          </div>
          <Badge variant="outline" className="text-sm">
            Plano: <span className="font-semibold ml-1 capitalize">{currentPlan?.name || "Free"}</span>
          </Badge>
        </div>

        {/* Search and View Toggle */}
        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar pacotes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex border rounded-lg">
            <Button
              variant={viewMode === "grid" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setViewMode("grid")}
            >
              <Grid className="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === "list" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setViewMode("list")}
            >
              <List className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Media Packs Grid/List */}
        {filteredPacks.length === 0 ? (
          <Card className="glass-card">
            <CardContent className="py-12 text-center text-muted-foreground">
              <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">Nenhum pacote disponível</p>
              <p>Aguarde novos pacotes serem adicionados.</p>
            </CardContent>
          </Card>
        ) : viewMode === "grid" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPacks.map((pack, index) => {
              const hasAccess = canAccessPack(pack);
              return (
                <motion.div
                  key={pack.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className={`glass-card overflow-hidden ${!hasAccess ? "opacity-70" : ""}`}>
                    <div className="aspect-video bg-secondary/50 relative">
                      {pack.image_url ? (
                        <img src={pack.image_url} alt={pack.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Package className="w-12 h-12 text-muted-foreground" />
                        </div>
                      )}
                      {!hasAccess && (
                        <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
                          <div className="text-center">
                            <Lock className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                            <p className="text-sm font-medium">Plano {pack.min_plan.toUpperCase()} necessário</p>
                          </div>
                        </div>
                      )}
                      <Badge className="absolute top-2 right-2">{pack.pack_type}</Badge>
                    </div>
                    <CardContent className="p-4">
                      <h3 className="font-semibold text-lg">{pack.name}</h3>
                      {pack.description && (
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{pack.description}</p>
                      )}
                    <div className="flex items-center justify-between mt-4">
                      <span className="text-sm text-muted-foreground">{pack.file_count} arquivos</span>
                      {hasAccess ? (
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" onClick={() => setSelectedPack(pack)}>
                            Ver Arquivos
                          </Button>
                          <Button size="sm" onClick={() => handleUsePack(pack)}>
                            <Megaphone className="w-4 h-4 mr-1" />
                            Usar
                          </Button>
                        </div>
                      ) : (
                        <Badge variant="secondary">
                          <Lock className="w-3 h-3 mr-1" />
                          Bloqueado
                        </Badge>
                      )}
                    </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        ) : (
          <Card className="glass-card">
            <CardContent className="p-0 divide-y divide-border">
              {filteredPacks.map((pack) => {
                const hasAccess = canAccessPack(pack);
                return (
                  <div
                    key={pack.id}
                    className={`flex items-center gap-4 p-4 ${!hasAccess ? "opacity-70" : ""}`}
                  >
                    <div className="w-16 h-16 rounded-lg bg-secondary/50 flex items-center justify-center overflow-hidden">
                      {pack.image_url ? (
                        <img src={pack.image_url} alt={pack.name} className="w-full h-full object-cover" />
                      ) : (
                        <Package className="w-8 h-8 text-muted-foreground" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">{pack.name}</h3>
                        <Badge variant="outline">{pack.pack_type}</Badge>
                        <Badge variant="secondary" className="capitalize">{pack.min_plan}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{pack.file_count} arquivos</p>
                    </div>
                  {hasAccess ? (
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => setSelectedPack(pack)}>
                        Ver Arquivos
                      </Button>
                      <Button size="sm" onClick={() => handleUsePack(pack)}>
                        <Megaphone className="w-4 h-4 mr-1" />
                        Usar
                      </Button>
                    </div>
                  ) : (
                    <Badge variant="secondary">
                      <Lock className="w-3 h-3 mr-1" />
                      Plano {pack.min_plan}
                    </Badge>
                  )}
                  </div>
                );
              })}
            </CardContent>
          </Card>
        )}

        {/* Selected Pack Modal */}
        {selectedPack && (
          <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-card border rounded-lg shadow-lg w-full max-w-4xl max-h-[80vh] overflow-hidden"
            >
              <div className="p-6 border-b flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold">{selectedPack.name}</h2>
                  <p className="text-sm text-muted-foreground">{selectedPack.file_count} arquivos</p>
                </div>
                <Button variant="ghost" onClick={() => setSelectedPack(null)}>
                  Fechar
                </Button>
              </div>
              <div className="p-6 overflow-y-auto max-h-[calc(80vh-100px)]">
                {selectedPack.media_files && selectedPack.media_files.length > 0 ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {selectedPack.media_files.map((file, index) => (
                      <div key={index} className="group relative">
                        <div className="aspect-square bg-secondary/50 rounded-lg overflow-hidden">
                          {file.type.startsWith("image") ? (
                            <img src={file.url} alt={file.name} className="w-full h-full object-cover" />
                          ) : file.type.startsWith("video") ? (
                            <div className="w-full h-full flex items-center justify-center relative">
                              <video src={file.url} className="w-full h-full object-cover" />
                              <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                                <Play className="w-8 h-8 text-white" />
                              </div>
                            </div>
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <FileText className="w-12 h-12 text-muted-foreground" />
                            </div>
                          )}
                        </div>
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-lg">
                          <Button size="sm" asChild>
                            <a href={file.url} download={file.name} target="_blank" rel="noopener noreferrer">
                              <Download className="w-4 h-4 mr-1" />
                              Baixar
                            </a>
                          </Button>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1 truncate">{file.name}</p>
                        <p className="text-xs text-muted-foreground">{formatSize(file.size)}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>Nenhum arquivo neste pacote.</p>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default MediaLibraryPage;
