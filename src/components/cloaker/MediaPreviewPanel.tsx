import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { 
  Image, Video, Shield, ShieldCheck, ShieldX, Link as LinkIcon, 
  Copy, Eye, Calendar, Hash, FileType, Maximize, 
  Layers, Clock, Globe, Upload, Download, Bot, User,
  CheckCircle, XCircle, AlertTriangle, Search, Loader2
} from "lucide-react";
import { CloakerMedia } from "@/hooks/useCloakerMedia";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface MediaMetadata {
  width?: number;
  height?: number;
  duration?: number;
  size?: number;
  format?: string;
  aspectRatio?: string;
}

interface MediaPreviewPanelProps {
  media: CloakerMedia;
  onClose?: () => void;
}

interface TestResult {
  status: "idle" | "testing" | "success" | "warning" | "error";
  message?: string;
  details?: {
    botDetection: boolean;
    vpnDetection: boolean;
    geoBlocking: boolean;
    safeMediaAvailable: boolean;
    offerMediaAvailable: boolean;
  };
}

const formatDuration = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
};

const MediaPreviewPanel = ({ media, onClose }: MediaPreviewPanelProps) => {
  const [safeUrl, setSafeUrl] = useState<string | null>(null);
  const [offerUrl, setOfferUrl] = useState<string | null>(null);
  const [safeMetadata, setSafeMetadata] = useState<MediaMetadata>({});
  const [offerMetadata, setOfferMetadata] = useState<MediaMetadata>({});
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"lead" | "bot" | "test">("lead");
  const [testResult, setTestResult] = useState<TestResult>({ status: "idle" });

  useEffect(() => {
    loadMediaUrls();
  }, [media]);

  const loadMediaUrls = async () => {
    setIsLoading(true);

    // Get Safe URL
    if (media.safe_url) {
      setSafeUrl(media.safe_url);
    } else if (media.safe_file_path) {
      const { data } = supabase.storage
        .from("cloaker-media")
        .getPublicUrl(media.safe_file_path);
      setSafeUrl(data.publicUrl);
    }

    // Get Offer URL
    if (media.offer_url) {
      setOfferUrl(media.offer_url);
    } else if (media.offer_file_path) {
      const { data } = supabase.storage
        .from("cloaker-media")
        .getPublicUrl(media.offer_file_path);
      setOfferUrl(data.publicUrl);
    }

    setIsLoading(false);
  };

  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>, type: "safe" | "offer") => {
    const img = e.currentTarget;
    const metadata: MediaMetadata = {
      width: img.naturalWidth,
      height: img.naturalHeight,
      aspectRatio: `${img.naturalWidth}:${img.naturalHeight}`,
      format: type === "safe" 
        ? (media.safe_url?.split(".").pop() || media.safe_file_path?.split(".").pop())?.toUpperCase()
        : (media.offer_url?.split(".").pop() || media.offer_file_path?.split(".").pop())?.toUpperCase(),
    };
    
    if (type === "safe") {
      setSafeMetadata(metadata);
    } else {
      setOfferMetadata(metadata);
    }
  };

  const handleVideoLoad = (e: React.SyntheticEvent<HTMLVideoElement>, type: "safe" | "offer") => {
    const video = e.currentTarget;
    const metadata: MediaMetadata = {
      width: video.videoWidth,
      height: video.videoHeight,
      duration: video.duration,
      aspectRatio: `${video.videoWidth}:${video.videoHeight}`,
      format: type === "safe" 
        ? (media.safe_url?.split(".").pop() || media.safe_file_path?.split(".").pop())?.toUpperCase()
        : (media.offer_url?.split(".").pop() || media.offer_file_path?.split(".").pop())?.toUpperCase(),
    };
    
    if (type === "safe") {
      setSafeMetadata(metadata);
    } else {
      setOfferMetadata(metadata);
    }
  };

  const copyEmbedCode = () => {
    const baseUrl = import.meta.env.VITE_SUPABASE_URL || "";
    const embedUrl = `${baseUrl}/functions/v1/cloaker-media?slug=${media.slug}&redirect=true`;
    
    let code = "";
    if (media.media_type === "image") {
      code = `<img src="${embedUrl}" alt="${media.name}" style="max-width: 100%;" />`;
    } else {
      code = `<video src="${embedUrl}" controls style="max-width: 100%;"></video>`;
    }
    
    navigator.clipboard.writeText(code);
    toast.success("Código embed copiado!");
  };

  const downloadMedia = async (url: string, type: "safe" | "offer") => {
    try {
      toast.info("Iniciando download...");
      
      const response = await fetch(url);
      const blob = await response.blob();
      
      // Determine file extension
      const contentType = response.headers.get("content-type") || "";
      let extension = media.media_type === "image" ? "jpg" : "mp4";
      if (contentType.includes("png")) extension = "png";
      else if (contentType.includes("gif")) extension = "gif";
      else if (contentType.includes("webp")) extension = "webp";
      else if (contentType.includes("webm")) extension = "webm";
      
      // Create download link
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = `${media.name}-${type === "safe" ? "bot" : "lead"}-${media.slug}.${extension}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
      
      toast.success("Download concluído!");
    } catch (error) {
      console.error("Download error:", error);
      toast.error("Erro ao fazer download");
    }
  };

  const runSecurityTest = async () => {
    setTestResult({ status: "testing" });
    
    // Simulate security test
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const hasBot = media.block_bots;
    const hasVpn = media.block_vpn;
    const hasGeo = media.allowed_countries && media.allowed_countries.length > 0;
    const hasSafe = !!safeUrl;
    const hasOffer = !!offerUrl;
    
    const allGood = hasSafe && hasOffer;
    const hasProtection = hasBot || hasVpn || hasGeo;
    
    if (!allGood) {
      setTestResult({
        status: "error",
        message: "Configuração incompleta. Configure ambas as mídias.",
        details: {
          botDetection: hasBot,
          vpnDetection: hasVpn,
          geoBlocking: hasGeo,
          safeMediaAvailable: hasSafe,
          offerMediaAvailable: hasOffer,
        }
      });
    } else if (!hasProtection) {
      setTestResult({
        status: "warning",
        message: "Mídia configurada, mas sem proteção ativa. Considere ativar bloqueio de bots ou VPN.",
        details: {
          botDetection: hasBot,
          vpnDetection: hasVpn,
          geoBlocking: hasGeo,
          safeMediaAvailable: hasSafe,
          offerMediaAvailable: hasOffer,
        }
      });
    } else {
      setTestResult({
        status: "success",
        message: "Sua mídia está protegida e pronta para uso!",
        details: {
          botDetection: hasBot,
          vpnDetection: hasVpn,
          geoBlocking: hasGeo,
          safeMediaAvailable: hasSafe,
          offerMediaAvailable: hasOffer,
        }
      });
    }
  };

  const getSourceType = (type: "safe" | "offer"): "upload" | "link" => {
    if (type === "safe") {
      return media.safe_file_path ? "upload" : "link";
    }
    return media.offer_file_path ? "upload" : "link";
  };

  // Simplified preview for lead view (offer media)
  const renderLeadPreview = () => {
    if (!offerUrl) {
      return (
        <div className="flex flex-col items-center justify-center h-64 bg-muted rounded-xl">
          <XCircle className="w-12 h-12 text-muted-foreground mb-3" />
          <p className="text-muted-foreground">Mídia de oferta não configurada</p>
        </div>
      );
    }

    return (
      <div className="flex flex-col items-center space-y-6">
        {/* Educational Alert */}
        <Alert className="max-w-lg border-primary/30 bg-primary/5">
          <User className="h-4 w-4 text-primary" />
          <AlertTitle className="text-primary">Esta é a mídia para sua campanha! 🎯</AlertTitle>
          <AlertDescription className="text-sm space-y-2 mt-2">
            <p>Esta {media.media_type === "image" ? "imagem" : "vídeo"} será exibida para <strong>usuários reais</strong> que clicarem no seu anúncio.</p>
            <div className="flex items-start gap-2 mt-2 p-2 bg-background/50 rounded-lg">
              <Download className="w-4 h-4 mt-0.5 text-primary shrink-0" />
              <span><strong>Baixe esta mídia</strong> e use-a para criar sua campanha no Facebook/TikTok Ads.</span>
            </div>
          </AlertDescription>
        </Alert>

        {/* Visual indicator */}
        <div className="flex items-center gap-3 text-sm bg-primary/10 text-primary px-4 py-2 rounded-full">
          <User className="w-4 h-4" />
          <span className="font-medium">Visualização do Lead (Usuário Real)</span>
        </div>

        {/* Media Preview */}
        <div className="relative bg-black/5 dark:bg-white/5 rounded-xl overflow-hidden flex items-center justify-center w-full max-w-lg aspect-video shadow-lg">
          {media.media_type === "image" ? (
            <img
              src={offerUrl}
              alt={`Oferta - ${media.name}`}
              className="max-w-full max-h-full object-contain"
              onLoad={(e) => handleImageLoad(e, "offer")}
            />
          ) : (
            <video
              src={offerUrl}
              controls
              className="max-w-full max-h-full"
              onLoadedMetadata={(e) => handleVideoLoad(e, "offer")}
            />
          )}
        </div>

        {/* Metadata */}
        <div className="flex flex-wrap items-center justify-center gap-4 text-sm text-muted-foreground">
          {offerMetadata.format && (
            <Badge variant="outline" className="gap-1.5">
              <FileType className="w-3 h-3" />
              {offerMetadata.format}
            </Badge>
          )}
          {offerMetadata.width && offerMetadata.height && (
            <Badge variant="outline" className="gap-1.5">
              <Maximize className="w-3 h-3" />
              {offerMetadata.width}x{offerMetadata.height}
            </Badge>
          )}
          {offerMetadata.duration && (
            <Badge variant="outline" className="gap-1.5">
              <Clock className="w-3 h-3" />
              {formatDuration(offerMetadata.duration)}
            </Badge>
          )}
          <Badge variant="outline" className="gap-1.5">
            {getSourceType("offer") === "upload" ? <Upload className="w-3 h-3" /> : <LinkIcon className="w-3 h-3" />}
            {getSourceType("offer") === "upload" ? "Upload" : "URL Externa"}
          </Badge>
        </div>

        {/* Download */}
        <Button size="lg" className="gap-2 px-8" onClick={() => downloadMedia(offerUrl, "offer")}>
          <Download className="w-5 h-5" />
          Baixar {media.media_type === "image" ? "Imagem" : "Vídeo"} da Oferta
        </Button>
      </div>
    );
  };

  // Simplified preview for bot view (safe media)
  const renderBotPreview = () => {
    if (!safeUrl) {
      return (
        <div className="flex flex-col items-center justify-center h-64 bg-muted rounded-xl">
          <XCircle className="w-12 h-12 text-muted-foreground mb-3" />
          <p className="text-muted-foreground">Mídia segura não configurada</p>
        </div>
      );
    }

    return (
      <div className="flex flex-col items-center space-y-6">
        {/* Educational Alert */}
        <Alert className="max-w-lg border-green-500/30 bg-green-500/5">
          <Bot className="h-4 w-4 text-green-600" />
          <AlertTitle className="text-green-600">Esta mídia é para os revisores 🤖</AlertTitle>
          <AlertDescription className="text-sm space-y-2 mt-2">
            <p>Esta {media.media_type === "image" ? "imagem" : "vídeo"} será exibida para <strong>bots e revisores</strong> das plataformas de anúncios.</p>
            <div className="flex items-start gap-2 mt-2 p-2 bg-background/50 rounded-lg">
              <ShieldCheck className="w-4 h-4 mt-0.5 text-green-600 shrink-0" />
              <span>Use uma mídia <strong>segura e não polêmica</strong> aqui para evitar bloqueios.</span>
            </div>
          </AlertDescription>
        </Alert>

        {/* Visual indicator */}
        <div className="flex items-center gap-3 text-sm bg-green-500/10 text-green-600 dark:text-green-400 px-4 py-2 rounded-full">
          <Bot className="w-4 h-4" />
          <span className="font-medium">Visualização do Bot (Revisores)</span>
        </div>

        {/* Media Preview */}
        <div className="relative bg-black/5 dark:bg-white/5 rounded-xl overflow-hidden flex items-center justify-center w-full max-w-lg aspect-video shadow-lg border-2 border-dashed border-green-500/30">
          {media.media_type === "image" ? (
            <img
              src={safeUrl}
              alt={`Seguro - ${media.name}`}
              className="max-w-full max-h-full object-contain"
              onLoad={(e) => handleImageLoad(e, "safe")}
            />
          ) : (
            <video
              src={safeUrl}
              controls
              className="max-w-full max-h-full"
              onLoadedMetadata={(e) => handleVideoLoad(e, "safe")}
            />
          )}
        </div>

        {/* Metadata */}
        <div className="flex flex-wrap items-center justify-center gap-4 text-sm text-muted-foreground">
          {safeMetadata.format && (
            <Badge variant="outline" className="gap-1.5">
              <FileType className="w-3 h-3" />
              {safeMetadata.format}
            </Badge>
          )}
          {safeMetadata.width && safeMetadata.height && (
            <Badge variant="outline" className="gap-1.5">
              <Maximize className="w-3 h-3" />
              {safeMetadata.width}x{safeMetadata.height}
            </Badge>
          )}
          {safeMetadata.duration && (
            <Badge variant="outline" className="gap-1.5">
              <Clock className="w-3 h-3" />
              {formatDuration(safeMetadata.duration)}
            </Badge>
          )}
          <Badge variant="outline" className="gap-1.5">
            {getSourceType("safe") === "upload" ? <Upload className="w-3 h-3" /> : <LinkIcon className="w-3 h-3" />}
            {getSourceType("safe") === "upload" ? "Upload" : "URL Externa"}
          </Badge>
        </div>

        {/* Download */}
        <Button size="lg" variant="outline" className="gap-2 px-8" onClick={() => downloadMedia(safeUrl, "safe")}>
          <Download className="w-5 h-5" />
          Baixar {media.media_type === "image" ? "Imagem" : "Vídeo"} Segura
        </Button>
      </div>
    );
  };

  // Security test tab
  const renderTestTab = () => {
    return (
      <div className="flex flex-col items-center space-y-6">
        {/* Visual indicator */}
        <div className="flex items-center gap-3 text-sm bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 px-4 py-2 rounded-full">
          <Search className="w-4 h-4" />
          <span className="font-medium">Teste de Segurança</span>
        </div>

        {/* Test Card */}
        <Card className="w-full max-w-lg">
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center gap-2">
              <Shield className="w-5 h-5" />
              Verificar Proteção
            </CardTitle>
            <CardDescription>
              Teste se sua mídia está configurada corretamente para proteção
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Run Test Button */}
            {testResult.status === "idle" && (
              <Button className="w-full gap-2" size="lg" onClick={runSecurityTest}>
                <Search className="w-5 h-5" />
                Executar Teste de Segurança
              </Button>
            )}

            {/* Testing State */}
            {testResult.status === "testing" && (
              <div className="flex flex-col items-center py-6 gap-4">
                <Loader2 className="w-10 h-10 animate-spin text-primary" />
                <p className="text-muted-foreground">Analisando configuração...</p>
              </div>
            )}

            {/* Results */}
            {testResult.status !== "idle" && testResult.status !== "testing" && testResult.details && (
              <div className="space-y-4">
                <Alert variant={
                  testResult.status === "success" ? "default" : 
                  testResult.status === "warning" ? "default" : "destructive"
                } className={
                  testResult.status === "success" ? "border-green-500 bg-green-500/10" :
                  testResult.status === "warning" ? "border-yellow-500 bg-yellow-500/10" : ""
                }>
                  {testResult.status === "success" && <CheckCircle className="h-4 w-4 text-green-500" />}
                  {testResult.status === "warning" && <AlertTriangle className="h-4 w-4 text-yellow-500" />}
                  {testResult.status === "error" && <XCircle className="h-4 w-4" />}
                  <AlertTitle>
                    {testResult.status === "success" ? "Proteção Ativa" :
                     testResult.status === "warning" ? "Atenção Necessária" : "Configuração Inválida"}
                  </AlertTitle>
                  <AlertDescription>{testResult.message}</AlertDescription>
                </Alert>

                {/* Detailed Results */}
                <div className="grid gap-3">
                  <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <div className="flex items-center gap-2">
                      <Image className="w-4 h-4" />
                      <span className="text-sm">Mídia da Oferta</span>
                    </div>
                    {testResult.details.offerMediaAvailable ? (
                      <Badge variant="outline" className="gap-1 text-green-600 border-green-500">
                        <CheckCircle className="w-3 h-3" /> Configurada
                      </Badge>
                    ) : (
                      <Badge variant="destructive" className="gap-1">
                        <XCircle className="w-3 h-3" /> Ausente
                      </Badge>
                    )}
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4" />
                      <span className="text-sm">Mídia Segura</span>
                    </div>
                    {testResult.details.safeMediaAvailable ? (
                      <Badge variant="outline" className="gap-1 text-green-600 border-green-500">
                        <CheckCircle className="w-3 h-3" /> Configurada
                      </Badge>
                    ) : (
                      <Badge variant="destructive" className="gap-1">
                        <XCircle className="w-3 h-3" /> Ausente
                      </Badge>
                    )}
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <div className="flex items-center gap-2">
                      <Bot className="w-4 h-4" />
                      <span className="text-sm">Detecção de Bots</span>
                    </div>
                    {testResult.details.botDetection ? (
                      <Badge variant="outline" className="gap-1 text-green-600 border-green-500">
                        <CheckCircle className="w-3 h-3" /> Ativo
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="gap-1">
                        <XCircle className="w-3 h-3" /> Inativo
                      </Badge>
                    )}
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <div className="flex items-center gap-2">
                      <Globe className="w-4 h-4" />
                      <span className="text-sm">Bloqueio de VPN</span>
                    </div>
                    {testResult.details.vpnDetection ? (
                      <Badge variant="outline" className="gap-1 text-green-600 border-green-500">
                        <CheckCircle className="w-3 h-3" /> Ativo
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="gap-1">
                        <XCircle className="w-3 h-3" /> Inativo
                      </Badge>
                    )}
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <div className="flex items-center gap-2">
                      <Layers className="w-4 h-4" />
                      <span className="text-sm">Bloqueio Geográfico</span>
                    </div>
                    {testResult.details.geoBlocking ? (
                      <Badge variant="outline" className="gap-1 text-green-600 border-green-500">
                        <CheckCircle className="w-3 h-3" /> Ativo
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="gap-1">
                        <XCircle className="w-3 h-3" /> Inativo
                      </Badge>
                    )}
                  </div>
                </div>

                <Button variant="outline" className="w-full" onClick={() => setTestResult({ status: "idle" })}>
                  Testar Novamente
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center space-y-4 py-8">
        <Skeleton className="h-64 w-full max-w-lg" />
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-12 w-64" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Header Info */}
      <Card className="border-border/50">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <div className={`p-3 rounded-xl ${media.media_type === "image" ? "bg-primary/10" : "bg-secondary"}`}>
                {media.media_type === "image" ? (
                  <Image className="w-6 h-6 text-primary" />
                ) : (
                  <Video className="w-6 h-6 text-secondary-foreground" />
                )}
              </div>
              <div>
                <h3 className="font-semibold text-lg">{media.name}</h3>
                <div className="flex items-center justify-center sm:justify-start gap-2 text-sm text-muted-foreground">
                  <Hash className="w-3 h-3" />
                  <span className="font-mono">{media.slug}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap justify-center">
              <Badge variant={media.is_active ? "default" : "secondary"}>
                {media.is_active ? "Ativo" : "Inativo"}
              </Badge>
              {media.block_bots && (
                <Badge variant="outline" className="gap-1">
                  <Shield className="w-3 h-3" /> Bots
                </Badge>
              )}
              {media.block_vpn && (
                <Badge variant="outline" className="gap-1">
                  <Globe className="w-3 h-3" /> VPN
                </Badge>
              )}
              <Badge variant="outline" className="gap-1">
                <Eye className="w-3 h-3" /> {media.total_views || 0}
              </Badge>
            </div>
          </div>

          <Separator className="my-4" />

          <div className="flex flex-col sm:flex-row items-center justify-center sm:justify-between gap-3 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              <span>Criado em {format(new Date(media.created_at), "dd/MM/yyyy", { locale: ptBR })}</span>
            </div>
            <Button variant="outline" size="sm" onClick={copyEmbedCode}>
              <Copy className="w-3 h-3 mr-1" />
              Copiar Embed
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Media Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "lead" | "bot" | "test")} className="w-full">
        <TabsList className="grid grid-cols-3 w-full">
          <TabsTrigger value="lead" className="gap-2">
            <User className="w-4 h-4" />
            <span className="hidden sm:inline">Visão do</span> Lead
          </TabsTrigger>
          <TabsTrigger value="bot" className="gap-2">
            <Bot className="w-4 h-4" />
            <span className="hidden sm:inline">Visão do</span> Bot
          </TabsTrigger>
          <TabsTrigger value="test" className="gap-2">
            <Search className="w-4 h-4" />
            <span className="hidden sm:inline">Testar</span> Segurança
          </TabsTrigger>
        </TabsList>

        <TabsContent value="lead" className="mt-6">
          {renderLeadPreview()}
        </TabsContent>

        <TabsContent value="bot" className="mt-6">
          {renderBotPreview()}
        </TabsContent>

        <TabsContent value="test" className="mt-6">
          {renderTestTab()}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default MediaPreviewPanel;
