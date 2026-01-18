import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Image, Video, Shield, ShieldCheck, ShieldX, Link as LinkIcon, 
  Copy, Eye, Calendar, Hash, FileType, HardDrive, Maximize, 
  Layers, Clock, Globe, Upload, ExternalLink
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

const formatBytes = (bytes: number): string => {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

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
  const [activeTab, setActiveTab] = useState<"safe" | "offer">("offer");

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

  const copyUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    toast.success("URL copiada!");
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

  const getSourceType = (type: "safe" | "offer"): "upload" | "link" => {
    if (type === "safe") {
      return media.safe_file_path ? "upload" : "link";
    }
    return media.offer_file_path ? "upload" : "link";
  };

  const renderMediaPreview = (type: "safe" | "offer") => {
    const url = type === "safe" ? safeUrl : offerUrl;
    const metadata = type === "safe" ? safeMetadata : offerMetadata;
    const sourceType = getSourceType(type);

    if (!url) {
      return (
        <div className="flex items-center justify-center h-64 bg-muted rounded-lg">
          <p className="text-muted-foreground">Mídia não configurada</p>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {/* Media Preview */}
        <div className="relative bg-black/5 dark:bg-white/5 rounded-lg overflow-hidden flex items-center justify-center min-h-[280px]">
          {media.media_type === "image" ? (
            <img
              src={url}
              alt={`${type === "safe" ? "Seguro" : "Oferta"} - ${media.name}`}
              className="max-w-full max-h-[400px] object-contain"
              onLoad={(e) => handleImageLoad(e, type)}
            />
          ) : (
            <video
              src={url}
              controls
              className="max-w-full max-h-[400px]"
              onLoadedMetadata={(e) => handleVideoLoad(e, type)}
            />
          )}
        </div>

        {/* Metadata Panel */}
        <Card className="bg-muted/30">
          <CardHeader className="py-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Layers className="w-4 h-4" />
              Metadados da Mídia
            </CardTitle>
          </CardHeader>
          <CardContent className="py-3">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {/* Source Type */}
              <div className="flex items-start gap-2">
                <div className="p-1.5 rounded bg-primary/10">
                  {sourceType === "upload" ? (
                    <Upload className="w-3.5 h-3.5 text-primary" />
                  ) : (
                    <LinkIcon className="w-3.5 h-3.5 text-primary" />
                  )}
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Fonte</p>
                  <p className="text-sm font-medium">
                    {sourceType === "upload" ? "Upload" : "URL Externa"}
                  </p>
                </div>
              </div>

              {/* Format */}
              {metadata.format && (
                <div className="flex items-start gap-2">
                  <div className="p-1.5 rounded bg-blue-500/10">
                    <FileType className="w-3.5 h-3.5 text-blue-500" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Formato</p>
                    <p className="text-sm font-medium">{metadata.format}</p>
                  </div>
                </div>
              )}

              {/* Dimensions */}
              {metadata.width && metadata.height && (
                <div className="flex items-start gap-2">
                  <div className="p-1.5 rounded bg-green-500/10">
                    <Maximize className="w-3.5 h-3.5 text-green-500" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Dimensões</p>
                    <p className="text-sm font-medium">
                      {metadata.width} x {metadata.height}px
                    </p>
                  </div>
                </div>
              )}

              {/* Duration (for videos) */}
              {metadata.duration && (
                <div className="flex items-start gap-2">
                  <div className="p-1.5 rounded bg-purple-500/10">
                    <Clock className="w-3.5 h-3.5 text-purple-500" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Duração</p>
                    <p className="text-sm font-medium">
                      {formatDuration(metadata.duration)}
                    </p>
                  </div>
                </div>
              )}

              {/* Media Type */}
              <div className="flex items-start gap-2">
                <div className="p-1.5 rounded bg-orange-500/10">
                  {media.media_type === "image" ? (
                    <Image className="w-3.5 h-3.5 text-orange-500" />
                  ) : (
                    <Video className="w-3.5 h-3.5 text-orange-500" />
                  )}
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Tipo</p>
                  <p className="text-sm font-medium capitalize">
                    {media.media_type === "image" ? "Imagem" : "Vídeo"}
                  </p>
                </div>
              </div>

              {/* Purpose */}
              <div className="flex items-start gap-2">
                <div className={`p-1.5 rounded ${type === "safe" ? "bg-green-500/10" : "bg-primary/10"}`}>
                  {type === "safe" ? (
                    <ShieldCheck className="w-3.5 h-3.5 text-green-500" />
                  ) : (
                    <ShieldX className="w-3.5 h-3.5 text-primary" />
                  )}
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Propósito</p>
                  <p className="text-sm font-medium">
                    {type === "safe" ? "Bots/Revisores" : "Usuários Reais"}
                  </p>
                </div>
              </div>
            </div>

            {/* URL Info */}
            <Separator className="my-4" />
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">URL da Mídia</p>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => copyUrl(url)}>
                    <Copy className="w-3 h-3" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-6 w-6" asChild>
                    <a href={url} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </Button>
                </div>
              </div>
              <p className="text-xs font-mono bg-muted p-2 rounded truncate">{url}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Info */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${media.media_type === "image" ? "bg-primary/10" : "bg-secondary"}`}>
                {media.media_type === "image" ? (
                  <Image className="w-5 h-5 text-primary" />
                ) : (
                  <Video className="w-5 h-5 text-secondary-foreground" />
                )}
              </div>
              <div>
                <h3 className="font-semibold">{media.name}</h3>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Hash className="w-3 h-3" />
                  <span className="font-mono">{media.slug}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
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
                <Eye className="w-3 h-3" /> {media.total_views || 0} views
              </Badge>
            </div>
          </div>

          <Separator className="my-4" />

          <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
            <div className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              <span>Criado em {format(new Date(media.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</span>
            </div>
            <Button variant="outline" size="sm" onClick={copyEmbedCode}>
              <Copy className="w-3 h-3 mr-1" />
              Copiar Embed
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Media Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "safe" | "offer")}>
        <TabsList className="grid grid-cols-2 w-full max-w-md">
          <TabsTrigger value="offer" className="gap-2">
            <ShieldX className="w-4 h-4" />
            Mídia da Oferta
          </TabsTrigger>
          <TabsTrigger value="safe" className="gap-2">
            <ShieldCheck className="w-4 h-4" />
            Mídia Segura
          </TabsTrigger>
        </TabsList>

        <TabsContent value="offer" className="mt-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <ShieldX className="w-4 h-4 text-primary" />
              <span>Exibida para <strong>usuários reais</strong> (tráfego legítimo)</span>
            </div>
            {renderMediaPreview("offer")}
          </div>
        </TabsContent>

        <TabsContent value="safe" className="mt-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <ShieldCheck className="w-4 h-4 text-green-500" />
              <span>Exibida para <strong>bots e revisores</strong> (tráfego suspeito)</span>
            </div>
            {renderMediaPreview("safe")}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default MediaPreviewPanel;
