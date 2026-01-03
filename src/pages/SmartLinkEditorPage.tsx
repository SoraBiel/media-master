import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { useSmartLinks, useSmartLinkButtons, useSmartLinkAnalytics, SmartLinkPage, SmartLinkButton } from "@/hooks/useSmartLinks";
import { useSmartLinkBaseUrl } from "@/hooks/useSmartLinkBaseUrl";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Save, Eye, Plus, GripVertical, Trash2, ExternalLink, Link2, MousePointerClick, BarChart3, Settings, Palette, ImagePlus, X, Loader2, User } from "lucide-react";
import SmartLinkButtonEditor from "@/components/smart-links/SmartLinkButtonEditor";
import SmartLinkPreview from "@/components/smart-links/SmartLinkPreview";
import SmartLinkAnalytics from "@/components/smart-links/SmartLinkAnalytics";

const SmartLinkEditorPage = () => {
  const { pageId } = useParams<{ pageId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const smartLinkBaseUrl = useSmartLinkBaseUrl();
  const { updatePage, limits, canAddButton } = useSmartLinks();
  const { buttons, createButton, updateButton, deleteButton, reorderButtons, isLoading: isLoadingButtons } = useSmartLinkButtons(pageId || null);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  
  const [page, setPage] = useState<SmartLinkPage | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [editingButton, setEditingButton] = useState<SmartLinkButton | null>(null);
  const [isCreatingButton, setIsCreatingButton] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [backgroundColor, setBackgroundColor] = useState("#1a1a2e");
  const [textColor, setTextColor] = useState("#ffffff");
  const [buttonStyle, setButtonStyle] = useState("rounded");
  const [metaPixelId, setMetaPixelId] = useState("");
  const [googleAnalyticsId, setGoogleAnalyticsId] = useState("");
  const [tiktokPixelId, setTiktokPixelId] = useState("");

  useEffect(() => {
    const fetchPage = async () => {
      if (!pageId) return;

      try {
        const { data, error } = await supabase
          .from("smart_link_pages")
          .select("*")
          .eq("id", pageId)
          .single();

        if (error) throw error;

        const pageData = data as SmartLinkPage;
        setPage(pageData);
        setTitle(pageData.title);
        setDescription(pageData.description || "");
        setAvatarUrl(pageData.avatar_url || "");
        setBackgroundColor(pageData.background_color);
        setTextColor(pageData.text_color);
        setButtonStyle(pageData.button_style);
        setMetaPixelId(pageData.meta_pixel_id || "");
        setGoogleAnalyticsId(pageData.google_analytics_id || "");
        setTiktokPixelId(pageData.tiktok_pixel_id || "");
      } catch (error) {
        console.error("Error fetching page:", error);
        toast({
          title: "Erro",
          description: "Página não encontrada.",
          variant: "destructive",
        });
        navigate("/smart-links");
      } finally {
        setIsLoading(false);
      }
    };

    fetchPage();
  }, [pageId]);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user || !pageId) return;

    setIsUploadingAvatar(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${pageId}-avatar-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("smart-link-assets")
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("smart-link-assets")
        .getPublicUrl(fileName);

      setAvatarUrl(urlData.publicUrl);
    } catch (error) {
      console.error("Error uploading avatar:", error);
      toast({
        title: "Erro no upload",
        description: "Não foi possível fazer upload da imagem.",
        variant: "destructive",
      });
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleSave = async () => {
    if (!pageId) return;

    setIsSaving(true);
    const success = await updatePage(pageId, {
      title,
      description: description || null,
      avatar_url: avatarUrl || null,
      background_color: backgroundColor,
      text_color: textColor,
      button_style: buttonStyle,
      meta_pixel_id: metaPixelId || null,
      google_analytics_id: googleAnalyticsId || null,
      tiktok_pixel_id: tiktokPixelId || null,
    });

    if (success && page) {
      setPage({
        ...page,
        title,
        description: description || null,
        avatar_url: avatarUrl || null,
        background_color: backgroundColor,
        text_color: textColor,
        button_style: buttonStyle,
        meta_pixel_id: metaPixelId || null,
        google_analytics_id: googleAnalyticsId || null,
        tiktok_pixel_id: tiktokPixelId || null,
      });
    }
    setIsSaving(false);
  };

  const handleAddButton = async () => {
    if (!canAddButton(pageId || "", buttons.length)) {
      toast({
        title: "Limite atingido",
        description: `Seu plano permite apenas ${limits.buttons} botões por página.`,
        variant: "destructive",
      });
      return;
    }

    setIsCreatingButton(true);
    const button = await createButton({
      title: "Novo Botão",
    });

    if (button) {
      setEditingButton(button);
    }
    setIsCreatingButton(false);
  };

  const handleMoveButton = async (index: number, direction: "up" | "down") => {
    const newIndex = direction === "up" ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= buttons.length) return;

    const newOrder = [...buttons];
    [newOrder[index], newOrder[newIndex]] = [newOrder[newIndex], newOrder[index]];
    await reorderButtons(newOrder.map(b => b.id));
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-[600px] w-full" />
        </div>
      </DashboardLayout>
    );
  }

  if (!page) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <p className="text-muted-foreground">Página não encontrada</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate("/smart-links")}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold">{page.title}</h1>
              <p className="text-muted-foreground text-sm flex items-center gap-1">
                <Link2 className="w-3 h-3" />
                /@{page.slug}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => {
                const base = (smartLinkBaseUrl || window.location.origin).replace(/\/+$/, "");
                window.open(`${base}/@${page.slug}`, "_blank");
              }}
            >
              <Eye className="w-4 h-4 mr-2" />
              Visualizar
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              <Save className="w-4 h-4 mr-2" />
              {isSaving ? "Salvando..." : "Salvar"}
            </Button>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Editor Panel */}
          <div className="lg:col-span-2 space-y-6">
            <Tabs defaultValue="buttons" className="space-y-4">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="buttons" className="gap-1.5">
                  <Link2 className="w-4 h-4" />
                  <span className="hidden sm:inline">Botões</span>
                </TabsTrigger>
                <TabsTrigger value="design" className="gap-1.5">
                  <Palette className="w-4 h-4" />
                  <span className="hidden sm:inline">Design</span>
                </TabsTrigger>
                <TabsTrigger value="pixels" className="gap-1.5">
                  <Settings className="w-4 h-4" />
                  <span className="hidden sm:inline">Pixels</span>
                </TabsTrigger>
                <TabsTrigger value="analytics" className="gap-1.5">
                  <BarChart3 className="w-4 h-4" />
                  <span className="hidden sm:inline">Analytics</span>
                </TabsTrigger>
              </TabsList>

              {/* Buttons Tab */}
              <TabsContent value="buttons" className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">Botões</h3>
                    <p className="text-sm text-muted-foreground">
                      {buttons.length}/{limits.buttons === 999 ? "∞" : limits.buttons} botões
                    </p>
                  </div>
                  <Button onClick={handleAddButton} disabled={isCreatingButton}>
                    <Plus className="w-4 h-4 mr-2" />
                    Adicionar
                  </Button>
                </div>

                {isLoadingButtons ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                      <Skeleton key={i} className="h-16 w-full" />
                    ))}
                  </div>
                ) : buttons.length === 0 ? (
                  <Card className="border-dashed">
                    <CardContent className="flex flex-col items-center justify-center py-8">
                      <Link2 className="w-8 h-8 text-muted-foreground mb-3" />
                      <p className="text-muted-foreground text-sm">Nenhum botão ainda</p>
                      <Button variant="outline" className="mt-3" onClick={handleAddButton}>
                        <Plus className="w-4 h-4 mr-2" />
                        Adicionar Primeiro Botão
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-2">
                    {buttons.map((button, index) => (
                      <Card key={button.id} className="group">
                        <CardContent className="p-3 flex items-center gap-3">
                          <div className="flex flex-col gap-0.5">
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              disabled={index === 0}
                              onClick={() => handleMoveButton(index, "up")}
                              className="h-5 w-5"
                            >
                              <span className="text-xs">▲</span>
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              disabled={index === buttons.length - 1}
                              onClick={() => handleMoveButton(index, "down")}
                              className="h-5 w-5"
                            >
                              <span className="text-xs">▼</span>
                            </Button>
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-medium truncate">{button.title}</span>
                              {!button.is_active && (
                                <Badge variant="secondary" className="text-2xs">Inativo</Badge>
                              )}
                              {button.funnel_id && (
                                <Badge variant="outline" className="text-2xs">Funil</Badge>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground truncate">
                              {button.url || "Sem link"}
                            </p>
                          </div>

                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <MousePointerClick className="w-3 h-3" />
                            {button.click_count}
                          </div>

                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              onClick={() => setEditingButton(button)}
                            >
                              <Settings className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              className="text-destructive hover:text-destructive"
                              onClick={() => deleteButton(button.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>

              {/* Design Tab */}
              <TabsContent value="design" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Aparência</CardTitle>
                    <CardDescription>Personalize o visual da sua página</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Avatar Upload */}
                    <div className="space-y-2">
                      <Label>Foto de Perfil</Label>
                      <div className="flex items-center gap-4">
                        <input
                          ref={avatarInputRef}
                          type="file"
                          accept="image/*"
                          onChange={handleAvatarUpload}
                          className="hidden"
                        />
                        {avatarUrl ? (
                          <div className="relative">
                            <img
                              src={avatarUrl}
                              alt="Avatar"
                              className="w-20 h-20 rounded-full object-cover border-2"
                            />
                            <button
                              type="button"
                              onClick={() => setAvatarUrl("")}
                              className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground rounded-full p-1"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => avatarInputRef.current?.click()}
                            disabled={isUploadingAvatar}
                            className="w-20 h-20 rounded-full border-2 border-dashed flex items-center justify-center hover:border-primary transition-colors"
                          >
                            {isUploadingAvatar ? (
                              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                            ) : (
                              <User className="w-6 h-6 text-muted-foreground" />
                            )}
                          </button>
                        )}
                        <div className="flex-1">
                          <p className="text-sm font-medium">Foto de perfil</p>
                          <p className="text-xs text-muted-foreground">
                            Aparece no topo da sua página
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="title">Título</Label>
                      <Input
                        id="title"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="description">Descrição</Label>
                      <Textarea
                        id="description"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Uma breve descrição sobre você ou sua marca"
                        rows={3}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="backgroundColor">Cor de Fundo</Label>
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            id="backgroundColor"
                            value={backgroundColor}
                            onChange={(e) => setBackgroundColor(e.target.value)}
                            className="w-10 h-10 rounded border cursor-pointer"
                          />
                          <Input
                            value={backgroundColor}
                            onChange={(e) => setBackgroundColor(e.target.value)}
                            className="flex-1"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="textColor">Cor do Texto</Label>
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            id="textColor"
                            value={textColor}
                            onChange={(e) => setTextColor(e.target.value)}
                            className="w-10 h-10 rounded border cursor-pointer"
                          />
                          <Input
                            value={textColor}
                            onChange={(e) => setTextColor(e.target.value)}
                            className="flex-1"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="buttonStyle">Estilo dos Botões</Label>
                      <Select value={buttonStyle} onValueChange={setButtonStyle}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="rounded">Arredondado</SelectItem>
                          <SelectItem value="pill">Pílula</SelectItem>
                          <SelectItem value="square">Quadrado</SelectItem>
                          <SelectItem value="outline">Contorno</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Pixels Tab */}
              <TabsContent value="pixels" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Pixels de Rastreamento</CardTitle>
                    <CardDescription>Configure seus pixels para tracking avançado</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="metaPixel">Meta Pixel ID</Label>
                      <Input
                        id="metaPixel"
                        value={metaPixelId}
                        onChange={(e) => setMetaPixelId(e.target.value)}
                        placeholder="Ex: 123456789012345"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="googleAnalytics">Google Analytics ID</Label>
                      <Input
                        id="googleAnalytics"
                        value={googleAnalyticsId}
                        onChange={(e) => setGoogleAnalyticsId(e.target.value)}
                        placeholder="Ex: G-XXXXXXXXXX"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="tiktokPixel">TikTok Pixel ID</Label>
                      <Input
                        id="tiktokPixel"
                        value={tiktokPixelId}
                        onChange={(e) => setTiktokPixelId(e.target.value)}
                        placeholder="Ex: XXXXXXXXXXXXXXXXX"
                      />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Analytics Tab */}
              <TabsContent value="analytics">
                <SmartLinkAnalytics pageId={pageId || null} buttons={buttons} />
              </TabsContent>
            </Tabs>
          </div>

          {/* Preview Panel */}
          <div className="lg:col-span-1">
            <div className="sticky top-20">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Preview</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <SmartLinkPreview
                    page={{
                      ...page,
                      title,
                      description: description || null,
                      avatar_url: avatarUrl || null,
                      background_color: backgroundColor,
                      text_color: textColor,
                      button_style: buttonStyle,
                    }}
                    buttons={buttons}
                  />
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        {/* Button Editor Modal */}
        {editingButton && (
          <SmartLinkButtonEditor
            button={editingButton}
            onSave={async (data) => {
              await updateButton(editingButton.id, data);
              setEditingButton(null);
            }}
            onClose={() => setEditingButton(null)}
          />
        )}
      </div>
    </DashboardLayout>
  );
};

export default SmartLinkEditorPage;
