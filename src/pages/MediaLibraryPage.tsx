import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
  Plus,
  Upload,
  Link2,
  Trash2,
  ImagePlus,
} from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useSubscription } from "@/hooks/useSubscription";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

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

interface UserMedia {
  id: string;
  name: string;
  url: string;
  type: string;
  size: number;
  created_at: string;
}

const PLAN_ORDER = ["free", "basic", "pro", "agency"];

const MediaLibraryPage = () => {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [mediaPacks, setMediaPacks] = useState<AdminMedia[]>([]);
  const [userMedia, setUserMedia] = useState<UserMedia[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPack, setSelectedPack] = useState<AdminMedia | null>(null);
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [uploadMode, setUploadMode] = useState<"file" | "url">("file");
  const [urlInput, setUrlInput] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuth();
  const { currentPlan, isLoading: isPlanLoading } = useSubscription();
  const navigate = useNavigate();
  const { toast } = useToast();

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

  // Fetch user's own media from storage
  useEffect(() => {
    const fetchUserMedia = async () => {
      if (!user) return;

      try {
        const { data: files, error } = await supabase.storage
          .from("media-packs")
          .list(`user-uploads/${user.id}`, {
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
                .from("media-packs")
                .getPublicUrl(`user-uploads/${user.id}/${file.name}`);

              return {
                id: file.id || file.name,
                name: file.name,
                url: urlData.publicUrl,
                type: file.metadata?.mimetype || getTypeFromName(file.name),
                size: file.metadata?.size || 0,
                created_at: file.created_at || new Date().toISOString(),
              };
            });

          setUserMedia(mediaItems);
        }
      } catch (err) {
        console.error("Error fetching user media:", err);
      }
    };

    fetchUserMedia();
  }, [user]);

  const getTypeFromName = (name: string): string => {
    const ext = name.split(".").pop()?.toLowerCase() || "";
    if (["jpg", "jpeg", "png", "gif", "webp", "svg"].includes(ext)) return "image/" + ext;
    if (["mp4", "webm", "mov", "avi"].includes(ext)) return "video/" + ext;
    return "file";
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setSelectedFiles(prev => [...prev, ...files]);
  };

  const handleUpload = async () => {
    if (!user) return;

    setIsUploading(true);

    try {
      if (uploadMode === "file" && selectedFiles.length > 0) {
        for (const file of selectedFiles) {
          const fileName = `${Date.now()}-${file.name}`;
          const filePath = `user-uploads/${user.id}/${fileName}`;

          const { error: uploadError } = await supabase.storage
            .from("media-packs")
            .upload(filePath, file);

          if (uploadError) {
            console.error("Upload error:", uploadError);
            toast({
              title: "Erro no upload",
              description: `Falha ao enviar ${file.name}`,
              variant: "destructive",
            });
          }
        }

        toast({
          title: "Upload concluído",
          description: `${selectedFiles.length} arquivo(s) enviado(s) com sucesso`,
        });

        // Refresh user media
        const { data: files } = await supabase.storage
          .from("media-packs")
          .list(`user-uploads/${user.id}`, {
            limit: 100,
            sortBy: { column: "created_at", order: "desc" },
          });

        if (files) {
          const mediaItems: UserMedia[] = files
            .filter(f => f.name !== ".emptyFolderPlaceholder")
            .map((file) => {
              const { data: urlData } = supabase.storage
                .from("media-packs")
                .getPublicUrl(`user-uploads/${user.id}/${file.name}`);

              return {
                id: file.id || file.name,
                name: file.name,
                url: urlData.publicUrl,
                type: file.metadata?.mimetype || getTypeFromName(file.name),
                size: file.metadata?.size || 0,
                created_at: file.created_at || new Date().toISOString(),
              };
            });

          setUserMedia(mediaItems);
        }

      } else if (uploadMode === "url" && urlInput.trim()) {
        // For URL mode, we'll just save the URL as a reference
        // In a real implementation, you might want to download and re-upload
        const urlMedia: UserMedia = {
          id: `url-${Date.now()}`,
          name: urlInput.split("/").pop() || "image-from-url",
          url: urlInput.trim(),
          type: "image/url",
          size: 0,
          created_at: new Date().toISOString(),
        };

        setUserMedia(prev => [urlMedia, ...prev]);

        toast({
          title: "Imagem adicionada",
          description: "Imagem da URL adicionada com sucesso",
        });
      }

      setIsUploadDialogOpen(false);
      setSelectedFiles([]);
      setUrlInput("");
    } catch (error) {
      console.error("Upload error:", error);
      toast({
        title: "Erro",
        description: "Falha ao fazer upload",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteUserMedia = async (media: UserMedia) => {
    if (!user) return;

    try {
      if (!media.id.startsWith("url-")) {
        const { error } = await supabase.storage
          .from("media-packs")
          .remove([`user-uploads/${user.id}/${media.name}`]);

        if (error) {
          throw error;
        }
      }

      setUserMedia(prev => prev.filter(m => m.id !== media.id));
      toast({ title: "Mídia removida" });
    } catch (error) {
      console.error("Delete error:", error);
      toast({
        title: "Erro",
        description: "Falha ao remover mídia",
        variant: "destructive",
      });
    }
  };

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

  const filteredUserMedia = userMedia.filter((media) =>
    media.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getMediaIcon = (type: string) => {
    if (type.startsWith("image")) return <Image className="w-5 h-5 text-telegram" />;
    if (type.startsWith("video")) return <Video className="w-5 h-5 text-purple-400" />;
    return <FileText className="w-5 h-5 text-warning" />;
  };

  const formatSize = (bytes: number) => {
    if (bytes === 0) return "—";
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
              Gerencie suas mídias e acesse os pacotes disponíveis.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-sm">
              Plano: <span className="font-semibold ml-1 capitalize">{currentPlan?.name || "Free"}</span>
            </Badge>
            <Button onClick={() => setIsUploadDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Adicionar Mídia
            </Button>
          </div>
        </div>

        {/* Search and View Toggle */}
        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar mídias..."
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

        <Tabs defaultValue="my-media" className="space-y-6">
          <TabsList>
            <TabsTrigger value="my-media">
              <ImagePlus className="w-4 h-4 mr-2" />
              Minhas Mídias ({userMedia.length})
            </TabsTrigger>
            <TabsTrigger value="packs">
              <Package className="w-4 h-4 mr-2" />
              Pacotes ({mediaPacks.length})
            </TabsTrigger>
          </TabsList>

          {/* My Media Tab */}
          <TabsContent value="my-media">
            {filteredUserMedia.length === 0 ? (
              <Card className="glass-card">
                <CardContent className="py-12 text-center text-muted-foreground">
                  <ImagePlus className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium">Nenhuma mídia enviada</p>
                  <p className="mb-4">Faça upload de imagens do seu computador ou adicione por URL.</p>
                  <Button onClick={() => setIsUploadDialogOpen(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Adicionar Mídia
                  </Button>
                </CardContent>
              </Card>
            ) : viewMode === "grid" ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {filteredUserMedia.map((media, index) => (
                  <motion.div
                    key={media.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="group relative"
                  >
                    <div className="aspect-square bg-secondary/50 rounded-lg overflow-hidden">
                      {media.type.startsWith("image") ? (
                        <img src={media.url} alt={media.name} className="w-full h-full object-cover" />
                      ) : media.type.startsWith("video") ? (
                        <div className="w-full h-full flex items-center justify-center relative">
                          <video src={media.url} className="w-full h-full object-cover" />
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
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 rounded-lg">
                      <Button size="sm" variant="secondary" asChild>
                        <a href={media.url} download={media.name} target="_blank" rel="noopener noreferrer">
                          <Download className="w-4 h-4" />
                        </a>
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => handleDeleteUserMedia(media)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 truncate">{media.name}</p>
                  </motion.div>
                ))}
              </div>
            ) : (
              <Card className="glass-card">
                <CardContent className="p-0 divide-y divide-border">
                  {filteredUserMedia.map((media) => (
                    <div key={media.id} className="flex items-center gap-4 p-4">
                      <div className="w-16 h-16 rounded-lg bg-secondary/50 flex items-center justify-center overflow-hidden">
                        {media.type.startsWith("image") ? (
                          <img src={media.url} alt={media.name} className="w-full h-full object-cover" />
                        ) : (
                          getMediaIcon(media.type)
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium truncate">{media.name}</p>
                        <p className="text-sm text-muted-foreground">{formatSize(media.size)}</p>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" asChild>
                          <a href={media.url} download={media.name} target="_blank" rel="noopener noreferrer">
                            <Download className="w-4 h-4" />
                          </a>
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => handleDeleteUserMedia(media)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Packs Tab */}
          <TabsContent value="packs">
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
          </TabsContent>
        </Tabs>

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
                    {selectedPack.media_files.map((file: any, index: number) => (
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

        {/* Upload Dialog */}
        <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Adicionar Mídia</DialogTitle>
              <DialogDescription>
                Faça upload de imagens do seu computador ou adicione por URL.
              </DialogDescription>
            </DialogHeader>

            <Tabs value={uploadMode} onValueChange={(v) => setUploadMode(v as "file" | "url")}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="file">
                  <Upload className="w-4 h-4 mr-2" />
                  Do Computador
                </TabsTrigger>
                <TabsTrigger value="url">
                  <Link2 className="w-4 h-4 mr-2" />
                  Por URL
                </TabsTrigger>
              </TabsList>

              <TabsContent value="file" className="space-y-4 mt-4">
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*,video/*"
                  multiple
                  className="hidden"
                  onChange={handleFileSelect}
                />
                <Button
                  variant="outline"
                  className="w-full h-32 border-dashed"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <div className="flex flex-col items-center">
                    <Upload className="w-8 h-8 mb-2 text-muted-foreground" />
                    <span>Clique para selecionar arquivos</span>
                    <span className="text-xs text-muted-foreground">ou arraste e solte</span>
                  </div>
                </Button>

                {selectedFiles.length > 0 && (
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {selectedFiles.map((file, index) => (
                      <div key={index} className="flex items-center gap-2 p-2 bg-secondary/50 rounded-lg">
                        {getMediaIcon(file.type)}
                        <span className="text-sm flex-1 truncate">{file.name}</span>
                        <span className="text-xs text-muted-foreground">{formatSize(file.size)}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedFiles(prev => prev.filter((_, i) => i !== index))}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="url" className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label>URL da Imagem</Label>
                  <Input
                    placeholder="https://exemplo.com/imagem.jpg"
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Cole a URL direta de uma imagem (JPG, PNG, GIF, WebP)
                  </p>
                </div>

                {urlInput && (
                  <div className="border rounded-lg p-2">
                    <p className="text-xs text-muted-foreground mb-2">Preview:</p>
                    <img
                      src={urlInput}
                      alt="Preview"
                      className="max-h-40 mx-auto rounded"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = "none";
                      }}
                    />
                  </div>
                )}
              </TabsContent>
            </Tabs>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsUploadDialogOpen(false)}>
                Cancelar
              </Button>
              <Button
                onClick={handleUpload}
                disabled={isUploading || (uploadMode === "file" ? selectedFiles.length === 0 : !urlInput.trim())}
              >
                {isUploading ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    Adicionar
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default MediaLibraryPage;
