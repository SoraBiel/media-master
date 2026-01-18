import { useState, useRef } from "react";
import { Link } from "react-router-dom";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCloakerMedia, useCloakerMediaViews, CloakerMedia } from "@/hooks/useCloakerMedia";
import { useSubscription } from "@/hooks/useSubscription";
import { useAuth } from "@/contexts/AuthContext";
import { Plus, Image, Video, Shield, ShieldOff, Copy, Trash2, Edit2, Eye, BarChart3, ShieldCheck, ShieldX, MapPin, Smartphone, Monitor, Globe, Upload, Link as LinkIcon, CheckCircle2, Layers, Lock, Crown } from "lucide-react";
import MediaPreviewPanel from "@/components/cloaker/MediaPreviewPanel";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useNavigate } from "react-router-dom";

const CloakerMediaPage = () => {
  const { mediaList, isLoading, createMedia, updateMedia, deleteMedia, getPublicUrl } = useCloakerMedia();
  const { currentPlan } = useSubscription();
  const { isAdmin } = useAuth();
  const navigate = useNavigate();
  
  // Check if user has access to media cloaker (basic plan or higher)
  const hasMediaCloakerAccess = isAdmin || (currentPlan && currentPlan.slug !== "free");
  
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingMedia, setEditingMedia] = useState<CloakerMedia | null>(null);
  const [viewingMedia, setViewingMedia] = useState<CloakerMedia | null>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    name: "",
    media_type: "image" as "image" | "video",
    safe_url: "",
    offer_url: "",
    block_bots: true,
    block_vpn: false,
    allowed_countries: [] as string[],
  });
  
  // File refs
  const safeFileRef = useRef<HTMLInputElement>(null);
  const offerFileRef = useRef<HTMLInputElement>(null);
  const [safeFile, setSafeFile] = useState<File | null>(null);
  const [offerFile, setOfferFile] = useState<File | null>(null);
  const [sourceType, setSourceType] = useState<{ safe: "url" | "file"; offer: "url" | "file" }>({ safe: "url", offer: "url" });

  const resetForm = () => {
    setFormData({
      name: "",
      media_type: "image",
      safe_url: "",
      offer_url: "",
      block_bots: true,
      block_vpn: false,
      allowed_countries: [],
    });
    setSafeFile(null);
    setOfferFile(null);
    setSourceType({ safe: "url", offer: "url" });
  };

  const handleCreateMedia = async () => {
    if (!formData.name) {
      toast.error("Digite um nome para a mídia");
      return;
    }

    const hasSafeSource = sourceType.safe === "url" ? !!formData.safe_url : !!safeFile;
    const hasOfferSource = sourceType.offer === "url" ? !!formData.offer_url : !!offerFile;

    if (!hasSafeSource || !hasOfferSource) {
      toast.error("Configure tanto a mídia segura quanto a mídia da oferta");
      return;
    }

    const result = await createMedia({
      name: formData.name,
      media_type: formData.media_type,
      safe_url: sourceType.safe === "url" ? formData.safe_url : undefined,
      safe_file: sourceType.safe === "file" ? safeFile! : undefined,
      offer_url: sourceType.offer === "url" ? formData.offer_url : undefined,
      offer_file: sourceType.offer === "file" ? offerFile! : undefined,
      block_bots: formData.block_bots,
      block_vpn: formData.block_vpn,
      allowed_countries: formData.allowed_countries.length > 0 ? formData.allowed_countries : undefined,
    });

    if (result) {
      setShowCreateDialog(false);
      resetForm();
    }
  };

  const handleUpdateMedia = async () => {
    if (!editingMedia) return;

    const updates: any = {
      name: formData.name,
      block_bots: formData.block_bots,
      block_vpn: formData.block_vpn,
      allowed_countries: formData.allowed_countries.length > 0 ? formData.allowed_countries : null,
    };

    if (sourceType.safe === "url" && formData.safe_url) {
      updates.safe_url = formData.safe_url;
      updates.safe_file_path = null;
    } else if (sourceType.safe === "file" && safeFile) {
      updates.safe_file = safeFile;
      updates.safe_url = null;
    }

    if (sourceType.offer === "url" && formData.offer_url) {
      updates.offer_url = formData.offer_url;
      updates.offer_file_path = null;
    } else if (sourceType.offer === "file" && offerFile) {
      updates.offer_file = offerFile;
      updates.offer_url = null;
    }

    const result = await updateMedia(editingMedia.id, updates);
    if (result) {
      setEditingMedia(null);
      resetForm();
    }
  };

  const handleDeleteMedia = async (id: string) => {
    if (confirm("Tem certeza que deseja excluir esta mídia?")) {
      await deleteMedia(id);
    }
  };

  const copyMediaUrl = (slug: string) => {
    const baseUrl = import.meta.env.VITE_SUPABASE_URL || "";
    const url = `${baseUrl}/functions/v1/cloaker-media?slug=${slug}`;
    navigator.clipboard.writeText(url);
    toast.success("URL da mídia copiada!");
  };

  const copyEmbedCode = (media: CloakerMedia) => {
    const baseUrl = import.meta.env.VITE_SUPABASE_URL || "";
    const url = `${baseUrl}/functions/v1/cloaker-media?slug=${media.slug}&redirect=true`;
    
    let code = "";
    if (media.media_type === "image") {
      code = `<img src="${url}" alt="${media.name}" />`;
    } else {
      code = `<video src="${url}" controls></video>`;
    }
    
    navigator.clipboard.writeText(code);
    toast.success("Código embed copiado!");
  };

  const openEditDialog = (media: CloakerMedia) => {
    setFormData({
      name: media.name,
      media_type: media.media_type,
      safe_url: media.safe_url || "",
      offer_url: media.offer_url || "",
      block_bots: media.block_bots,
      block_vpn: media.block_vpn,
      allowed_countries: media.allowed_countries || [],
    });
    setSourceType({
      safe: media.safe_file_path ? "file" : "url",
      offer: media.offer_file_path ? "file" : "url",
    });
    setSafeFile(null);
    setOfferFile(null);
    setEditingMedia(media);
  };

  // Calculate totals
  const totalViews = mediaList.reduce((acc, m) => acc + (m.total_views || 0), 0);

  // If user doesn't have access, show upgrade prompt
  if (!hasMediaCloakerAccess) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-2xl font-bold">Cloaker de Mídia</h1>
              <p className="text-muted-foreground">Proteja suas imagens e vídeos contra bots e revisores</p>
            </div>
            <Link to="/cloaker">
              <Button variant="outline">
                <LinkIcon className="w-4 h-4 mr-2" />
                Cloaker de Links
              </Button>
            </Link>
          </div>

          {/* Plan Required Card */}
          <Card className="border-2 border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <div className="p-4 rounded-full bg-primary/10 mb-4">
                <Lock className="w-10 h-10 text-primary" />
              </div>
              <h2 className="text-2xl font-bold mb-2">Recurso Exclusivo</h2>
              <p className="text-muted-foreground mb-6 max-w-md">
                O Cloaker de Mídia (imagens e vídeos) está disponível a partir do plano <strong>Basic</strong>.
                Com o plano Free, você pode usar apenas o <strong>Cloaker de Links</strong>.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Button onClick={() => navigate("/billing")} className="gap-2">
                  <Crown className="w-4 h-4" />
                  Fazer Upgrade
                </Button>
                <Button variant="outline" onClick={() => navigate("/cloaker")}>
                  <LinkIcon className="w-4 h-4 mr-2" />
                  Usar Cloaker de Links
                </Button>
              </div>

              {/* Feature comparison */}
              <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4 text-left max-w-lg">
                <Card className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <LinkIcon className="w-4 h-4 text-muted-foreground" />
                    <span className="font-medium">Plano Free</span>
                  </div>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-3 h-3 text-green-500" />
                      Cloaker de Links
                    </li>
                    <li className="flex items-center gap-2 opacity-50">
                      <Lock className="w-3 h-3" />
                      Cloaker de Imagens
                    </li>
                    <li className="flex items-center gap-2 opacity-50">
                      <Lock className="w-3 h-3" />
                      Cloaker de Vídeos
                    </li>
                  </ul>
                </Card>
                <Card className="p-4 border-primary/50 bg-primary/5">
                  <div className="flex items-center gap-2 mb-2">
                    <Crown className="w-4 h-4 text-primary" />
                    <span className="font-medium">Plano Basic+</span>
                  </div>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-3 h-3 text-green-500" />
                      Cloaker de Links
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-3 h-3 text-green-500" />
                      Cloaker de Imagens
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-3 h-3 text-green-500" />
                      Cloaker de Vídeos
                    </li>
                  </ul>
                </Card>
              </div>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold">Cloaker de Mídia</h1>
            <p className="text-muted-foreground">Proteja suas imagens e vídeos contra bots e revisores</p>
          </div>
          <div className="flex gap-2">
            <Link to="/cloaker">
              <Button variant="outline">
                <LinkIcon className="w-4 h-4 mr-2" />
                Cloaker de Links
              </Button>
            </Link>
            <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
              <DialogTrigger asChild>
                <Button onClick={resetForm}>
                  <Plus className="w-4 h-4 mr-2" />
                  Nova Mídia
                </Button>
              </DialogTrigger>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Criar Mídia Cloakada</DialogTitle>
                <DialogDescription>
                  Configure uma mídia para mostrar diferentes versões para bots/revisores vs usuários reais
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Nome</Label>
                  <Input
                    placeholder="Ex: Banner Campanha"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>

                <div>
                  <Label>Tipo de Mídia</Label>
                  <Select
                    value={formData.media_type}
                    onValueChange={(value: "image" | "video") => setFormData({ ...formData, media_type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="image">
                        <div className="flex items-center gap-2">
                          <Image className="w-4 h-4" />
                          Imagem
                        </div>
                      </SelectItem>
                      <SelectItem value="video">
                        <div className="flex items-center gap-2">
                          <Video className="w-4 h-4" />
                          Vídeo
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Safe Media */}
                <div className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-green-500" />
                    <Label className="font-medium">Mídia Segura (para bots/revisores)</Label>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant={sourceType.safe === "url" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSourceType({ ...sourceType, safe: "url" })}
                    >
                      <LinkIcon className="w-3 h-3 mr-1" />
                      URL
                    </Button>
                    <Button
                      type="button"
                      variant={sourceType.safe === "file" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSourceType({ ...sourceType, safe: "file" })}
                    >
                      <Upload className="w-3 h-3 mr-1" />
                      Upload
                    </Button>
                  </div>
                  {sourceType.safe === "url" ? (
                    <Input
                      placeholder="https://exemplo.com/imagem-segura.jpg"
                      value={formData.safe_url}
                      onChange={(e) => setFormData({ ...formData, safe_url: e.target.value })}
                    />
                  ) : (
                    <div>
                      <input
                        ref={safeFileRef}
                        type="file"
                        accept={formData.media_type === "image" ? "image/*" : "video/*"}
                        className="hidden"
                        onChange={(e) => setSafeFile(e.target.files?.[0] || null)}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => safeFileRef.current?.click()}
                        className="w-full"
                      >
                        <Upload className="w-4 h-4 mr-2" />
                        {safeFile ? safeFile.name : "Selecionar arquivo"}
                      </Button>
                    </div>
                  )}
                </div>

                {/* Offer Media */}
                <div className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <ShieldX className="w-4 h-4 text-primary" />
                    <Label className="font-medium">Mídia da Oferta (para usuários reais)</Label>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant={sourceType.offer === "url" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSourceType({ ...sourceType, offer: "url" })}
                    >
                      <LinkIcon className="w-3 h-3 mr-1" />
                      URL
                    </Button>
                    <Button
                      type="button"
                      variant={sourceType.offer === "file" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSourceType({ ...sourceType, offer: "file" })}
                    >
                      <Upload className="w-3 h-3 mr-1" />
                      Upload
                    </Button>
                  </div>
                  {sourceType.offer === "url" ? (
                    <Input
                      placeholder="https://exemplo.com/imagem-real.jpg"
                      value={formData.offer_url}
                      onChange={(e) => setFormData({ ...formData, offer_url: e.target.value })}
                    />
                  ) : (
                    <div>
                      <input
                        ref={offerFileRef}
                        type="file"
                        accept={formData.media_type === "image" ? "image/*" : "video/*"}
                        className="hidden"
                        onChange={(e) => setOfferFile(e.target.files?.[0] || null)}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => offerFileRef.current?.click()}
                        className="w-full"
                      >
                        <Upload className="w-4 h-4 mr-2" />
                        {offerFile ? offerFile.name : "Selecionar arquivo"}
                      </Button>
                    </div>
                  )}
                </div>

                {/* Blocking options */}
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Bloquear Bots</Label>
                    <p className="text-xs text-muted-foreground">Detecta crawlers e revisores</p>
                  </div>
                  <Switch
                    checked={formData.block_bots}
                    onCheckedChange={(checked) => setFormData({ ...formData, block_bots: checked })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Bloquear VPN</Label>
                    <p className="text-xs text-muted-foreground">Detecta conexões VPN/Proxy</p>
                  </div>
                  <Switch
                    checked={formData.block_vpn}
                    onCheckedChange={(checked) => setFormData({ ...formData, block_vpn: checked })}
                  />
                </div>

                <Button onClick={handleCreateMedia} className="w-full">
                  Criar Mídia Cloakada
                </Button>
              </div>
            </DialogContent>
            </Dialog>
          </div>
        </div>

        <Tabs defaultValue="media">
          <TabsList>
            <TabsTrigger value="media">
              <Image className="w-4 h-4 mr-2" />
              Minhas Mídias
            </TabsTrigger>
            <TabsTrigger value="analytics">
              <BarChart3 className="w-4 h-4 mr-2" />
              Analytics
            </TabsTrigger>
          </TabsList>

          <TabsContent value="media" className="space-y-4">
            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Image className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{mediaList.filter(m => m.media_type === "image").length}</p>
                      <p className="text-xs text-muted-foreground">Imagens</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-secondary/50">
                      <Video className="w-5 h-5 text-secondary-foreground" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{mediaList.filter(m => m.media_type === "video").length}</p>
                      <p className="text-xs text-muted-foreground">Vídeos</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-green-500/10">
                      <Eye className="w-5 h-5 text-green-500" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{totalViews}</p>
                      <p className="text-xs text-muted-foreground">Views Totais</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-blue-500/10">
                      <Shield className="w-5 h-5 text-blue-500" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{mediaList.filter(m => m.is_active).length}</p>
                      <p className="text-xs text-muted-foreground">Ativos</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Media Table */}
            <Card>
              <CardHeader>
                <CardTitle>Mídias Cloakadas</CardTitle>
                <CardDescription>Gerencie suas imagens e vídeos protegidos</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                      <Skeleton key={i} className="h-16 w-full" />
                    ))}
                  </div>
                ) : mediaList.length === 0 ? (
                  <div className="text-center py-12">
                    <Image className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium">Nenhuma mídia criada</h3>
                    <p className="text-muted-foreground mb-4">
                      Crie sua primeira mídia cloakada para proteger seu conteúdo
                    </p>
                    <Button onClick={() => setShowCreateDialog(true)}>
                      <Plus className="w-4 h-4 mr-2" />
                      Nova Mídia
                    </Button>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nome</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Views</TableHead>
                        <TableHead>Proteções</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {mediaList.map((media) => (
                        <TableRow key={media.id}>
                          <TableCell className="font-medium">{media.name}</TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {media.media_type === "image" ? (
                                <><Image className="w-3 h-3 mr-1" /> Imagem</>
                              ) : (
                                <><Video className="w-3 h-3 mr-1" /> Vídeo</>
                              )}
                            </Badge>
                          </TableCell>
                          <TableCell>{media.total_views || 0}</TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              {media.block_bots && (
                                <Badge variant="outline" className="text-xs">
                                  <Shield className="w-3 h-3 mr-1" />
                                  Bots
                                </Badge>
                              )}
                              {media.block_vpn && (
                                <Badge variant="outline" className="text-xs">
                                  <ShieldOff className="w-3 h-3 mr-1" />
                                  VPN
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={media.is_active ? "default" : "secondary"}>
                              {media.is_active ? "Ativo" : "Inativo"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => copyMediaUrl(media.slug)}
                                title="Copiar URL"
                              >
                                <Copy className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => copyEmbedCode(media)}
                                title="Copiar código embed"
                              >
                                <LinkIcon className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setViewingMedia(media)}
                                title="Ver analytics"
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => openEditDialog(media)}
                                title="Editar"
                              >
                                <Edit2 className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDeleteMedia(media.id)}
                                title="Excluir"
                              >
                                <Trash2 className="w-4 h-4 text-destructive" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-4">
            <MediaAnalyticsDashboard mediaList={mediaList} />
          </TabsContent>
        </Tabs>

        {/* Edit Dialog */}
        <Dialog open={!!editingMedia} onOpenChange={(open) => !open && setEditingMedia(null)}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Editar Mídia</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Nome</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label>Bloquear Bots</Label>
                <Switch
                  checked={formData.block_bots}
                  onCheckedChange={(checked) => setFormData({ ...formData, block_bots: checked })}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label>Bloquear VPN</Label>
                <Switch
                  checked={formData.block_vpn}
                  onCheckedChange={(checked) => setFormData({ ...formData, block_vpn: checked })}
                />
              </div>
              <Button onClick={handleUpdateMedia} className="w-full">
                Salvar Alterações
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* View Media Preview Dialog */}
        <Dialog open={!!viewingMedia} onOpenChange={(open) => !open && setViewingMedia(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Layers className="w-5 h-5" />
                Preview: {viewingMedia?.name}
              </DialogTitle>
            </DialogHeader>
            {viewingMedia && <MediaPreviewPanel media={viewingMedia} />}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

const MediaAnalyticsDashboard = ({ mediaList }: { mediaList: CloakerMedia[] }) => {
  const totalViews = mediaList.reduce((acc, m) => acc + (m.total_views || 0), 0);
  const imageViews = mediaList.filter(m => m.media_type === "image").reduce((acc, m) => acc + (m.total_views || 0), 0);
  const videoViews = mediaList.filter(m => m.media_type === "video").reduce((acc, m) => acc + (m.total_views || 0), 0);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Eye className="w-4 h-4" />
            Views Totais
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-4xl font-bold">{totalViews}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Image className="w-4 h-4" />
            Views de Imagens
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-4xl font-bold">{imageViews}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Video className="w-4 h-4" />
            Views de Vídeos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-4xl font-bold">{videoViews}</p>
        </CardContent>
      </Card>
    </div>
  );
};

const MediaViewsTable = ({ mediaId }: { mediaId: string }) => {
  const { views, stats, isLoading } = useCloakerMediaViews(mediaId);

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Quick Stats */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-muted/50 rounded-lg p-3 text-center">
          <p className="text-2xl font-bold">{stats.totalViews}</p>
          <p className="text-xs text-muted-foreground">Total</p>
        </div>
        <div className="bg-green-500/10 rounded-lg p-3 text-center">
          <p className="text-2xl font-bold text-green-600">{stats.allowedViews}</p>
          <p className="text-xs text-muted-foreground">Permitidos</p>
        </div>
        <div className="bg-destructive/10 rounded-lg p-3 text-center">
          <p className="text-2xl font-bold text-destructive">{stats.blockedViews}</p>
          <p className="text-xs text-muted-foreground">Bloqueados</p>
        </div>
        <div className="bg-primary/10 rounded-lg p-3 text-center">
          <p className="text-2xl font-bold text-primary">{stats.offerServed}</p>
          <p className="text-xs text-muted-foreground">Oferta Servida</p>
        </div>
      </div>

      {/* Views Table */}
      {views.length === 0 ? (
        <p className="text-center text-muted-foreground py-8">
          Nenhuma visualização registrada ainda
        </p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Data</TableHead>
              <TableHead>País</TableHead>
              <TableHead>Dispositivo</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Servido</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {views.slice(0, 50).map((view) => (
              <TableRow key={view.id}>
                <TableCell className="text-sm">
                  {format(new Date(view.viewed_at), "dd/MM HH:mm", { locale: ptBR })}
                </TableCell>
                <TableCell>{view.country || "-"}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    {view.device_type === "mobile" ? (
                      <Smartphone className="w-4 h-4" />
                    ) : (
                      <Monitor className="w-4 h-4" />
                    )}
                    <span className="text-sm">{view.browser || "-"}</span>
                  </div>
                </TableCell>
                <TableCell>
                  {view.was_blocked ? (
                    <Badge variant="destructive" className="text-xs">
                      <ShieldX className="w-3 h-3 mr-1" />
                      Bloqueado
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-xs text-green-600 border-green-600">
                      <CheckCircle2 className="w-3 h-3 mr-1" />
                      Permitido
                    </Badge>
                  )}
                </TableCell>
                <TableCell>
                  <Badge variant={view.served_type === "offer" ? "default" : "secondary"}>
                    {view.served_type === "offer" ? "Oferta" : "Seguro"}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
};

export default CloakerMediaPage;
