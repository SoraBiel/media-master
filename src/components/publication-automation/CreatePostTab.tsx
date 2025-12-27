import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarIcon, Upload, X, Image, Video, Send, Clock, Twitter, Instagram, Facebook } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

const PLATFORMS = [
  { id: "x", name: "X (Twitter)", icon: Twitter, maxChars: 280 },
  { id: "instagram", name: "Instagram", icon: Instagram, maxChars: 2200 },
  { id: "threads", name: "Threads", icon: () => <span className="font-bold text-sm">@</span>, maxChars: 500 },
  { id: "facebook", name: "Facebook", icon: Facebook, maxChars: 63206 },
];

const CreatePostTab = () => {
  const { user } = useAuth();
  const [content, setContent] = useState("");
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [mediaFiles, setMediaFiles] = useState<File[]>([]);
  const [mediaPreviews, setMediaPreviews] = useState<string[]>([]);
  const [publishMode, setPublishMode] = useState<"now" | "schedule">("now");
  const [scheduledDate, setScheduledDate] = useState<Date>();
  const [scheduledTime, setScheduledTime] = useState("12:00");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handlePlatformToggle = (platformId: string) => {
    setSelectedPlatforms(prev => 
      prev.includes(platformId) 
        ? prev.filter(p => p !== platformId)
        : [...prev, platformId]
    );
  };

  const handleMediaUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length + mediaFiles.length > 4) {
      toast.error("Máximo de 4 arquivos permitidos");
      return;
    }

    const newPreviews: string[] = [];
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = () => {
        newPreviews.push(reader.result as string);
        if (newPreviews.length === files.length) {
          setMediaPreviews(prev => [...prev, ...newPreviews]);
        }
      };
      reader.readAsDataURL(file);
    });

    setMediaFiles(prev => [...prev, ...files]);
  };

  const removeMedia = (index: number) => {
    setMediaFiles(prev => prev.filter((_, i) => i !== index));
    setMediaPreviews(prev => prev.filter((_, i) => i !== index));
  };

  const getCharacterLimit = () => {
    if (selectedPlatforms.length === 0) return null;
    const limits = selectedPlatforms.map(p => 
      PLATFORMS.find(pl => pl.id === p)?.maxChars || Infinity
    );
    return Math.min(...limits);
  };

  const characterLimit = getCharacterLimit();
  const isOverLimit = characterLimit !== null && content.length > characterLimit;

  const handleSubmit = async () => {
    if (!content.trim()) {
      toast.error("Digite o conteúdo do post");
      return;
    }
    if (selectedPlatforms.length === 0) {
      toast.error("Selecione pelo menos uma plataforma");
      return;
    }
    if (publishMode === "schedule" && !scheduledDate) {
      toast.error("Selecione uma data para agendar");
      return;
    }
    if (isOverLimit) {
      toast.error("O conteúdo excede o limite de caracteres");
      return;
    }

    setIsSubmitting(true);

    try {
      // Upload media files if any
      const mediaUrls: string[] = [];
      for (const file of mediaFiles) {
        const fileName = `${user?.id}/${Date.now()}-${file.name}`;
        const { data, error } = await supabase.storage
          .from("user-media")
          .upload(fileName, file);
        
        if (error) throw error;
        
        const { data: urlData } = supabase.storage
          .from("user-media")
          .getPublicUrl(fileName);
        
        mediaUrls.push(urlData.publicUrl);
      }

      // Calculate scheduled datetime
      let scheduledAt = null;
      if (publishMode === "schedule" && scheduledDate) {
        const [hours, minutes] = scheduledTime.split(":").map(Number);
        scheduledAt = new Date(scheduledDate);
        scheduledAt.setHours(hours, minutes, 0, 0);
      }

      // Create the scheduled post
      const { data: post, error: postError } = await supabase
        .from("scheduled_posts")
        .insert({
          user_id: user?.id,
          content,
          media_urls: mediaUrls,
          platforms: selectedPlatforms,
          scheduled_at: scheduledAt?.toISOString() || null,
          status: publishMode === "now" ? "processing" : "scheduled",
        })
        .select()
        .single();

      if (postError) throw postError;

      // Create platform logs
      const platformLogs = selectedPlatforms.map(platform => ({
        post_id: post.id,
        platform,
        status: "pending" as const,
      }));

      const { error: logsError } = await supabase
        .from("post_platform_logs")
        .insert(platformLogs);

      if (logsError) throw logsError;

      // If publishing now, call the social-post edge function
      if (publishMode === "now") {
        const { data: postResult, error: postFnError } = await supabase.functions.invoke('social-post', {
          body: {
            post_id: post.id,
            platforms: selectedPlatforms,
            content,
            media_urls: mediaUrls,
          },
        });

        if (postFnError) {
          console.error("Post function error:", postFnError);
          toast.error("Erro ao publicar: " + postFnError.message);
        } else if (postResult?.results) {
          const results = postResult.results;
          const successCount = Object.values(results).filter((r: any) => r.success).length;
          const failCount = Object.values(results).filter((r: any) => !r.success).length;
          
          if (successCount > 0 && failCount === 0) {
            toast.success(`Publicado com sucesso em ${successCount} plataforma(s)!`);
          } else if (successCount > 0 && failCount > 0) {
            toast.warning(`Publicado em ${successCount}, falhou em ${failCount} plataforma(s)`);
          } else {
            const errors = Object.entries(results)
              .filter(([_, r]: [string, any]) => !r.success)
              .map(([platform, r]: [string, any]) => `${platform}: ${r.error}`)
              .join(', ');
            toast.error(`Falha ao publicar: ${errors}`);
          }
        }
      } else {
        toast.success("Post agendado com sucesso!");
      }

      // Reset form
      setContent("");
      setSelectedPlatforms([]);
      setMediaFiles([]);
      setMediaPreviews([]);
      setPublishMode("now");
      setScheduledDate(undefined);
      setScheduledTime("12:00");

    } catch (error: any) {
      console.error("Error creating post:", error);
      toast.error("Erro ao criar post: " + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Post Creation */}
      <Card>
        <CardHeader>
          <CardTitle>Novo Post</CardTitle>
          <CardDescription>
            Crie uma publicação para várias plataformas
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Content */}
          <div className="space-y-2">
            <Label>Conteúdo</Label>
            <Textarea
              placeholder="O que você quer compartilhar?"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="min-h-[150px] resize-none"
            />
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>
                {characterLimit !== null && (
                  <span className={cn(isOverLimit && "text-destructive")}>
                    {content.length} / {characterLimit} caracteres
                  </span>
                )}
              </span>
              <span>
                Limite: {characterLimit !== null ? `${characterLimit} chars` : "Selecione uma plataforma"}
              </span>
            </div>
          </div>

          {/* Media Upload */}
          <div className="space-y-2">
            <Label>Mídia (opcional)</Label>
            <div className="flex flex-wrap gap-3">
              {mediaPreviews.map((preview, index) => (
                <div key={index} className="relative w-20 h-20 rounded-lg overflow-hidden border">
                  <img
                    src={preview}
                    alt={`Preview ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                  <button
                    onClick={() => removeMedia(index)}
                    className="absolute top-1 right-1 p-1 bg-destructive text-destructive-foreground rounded-full"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
              {mediaFiles.length < 4 && (
                <label className="w-20 h-20 border-2 border-dashed rounded-lg flex flex-col items-center justify-center cursor-pointer hover:bg-muted/50 transition-colors">
                  <Upload className="w-5 h-5 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground mt-1">Upload</span>
                  <input
                    type="file"
                    accept="image/*,video/*"
                    multiple
                    className="hidden"
                    onChange={handleMediaUpload}
                  />
                </label>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Suporta imagens e vídeos. Máximo 4 arquivos.
            </p>
          </div>

          {/* Platforms */}
          <div className="space-y-3">
            <Label>Plataformas</Label>
            <div className="grid grid-cols-2 gap-3">
              {PLATFORMS.map((platform) => {
                const Icon = platform.icon;
                const isSelected = selectedPlatforms.includes(platform.id);
                return (
                  <div
                    key={platform.id}
                    onClick={() => handlePlatformToggle(platform.id)}
                    className={cn(
                      "flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all",
                      isSelected 
                        ? "border-primary bg-primary/10" 
                        : "border-border hover:bg-muted/50"
                    )}
                  >
                    <Checkbox checked={isSelected} />
                    <Icon className="w-5 h-5" />
                    <span className="text-sm font-medium">{platform.name}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Scheduling & Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quando publicar?</CardTitle>
          <CardDescription>
            Publique agora ou agende para depois
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <RadioGroup value={publishMode} onValueChange={(v) => setPublishMode(v as "now" | "schedule")}>
            <div className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-muted/50 cursor-pointer">
              <RadioGroupItem value="now" id="now" />
              <Label htmlFor="now" className="flex items-center gap-2 cursor-pointer">
                <Send className="w-4 h-4" />
                Publicar agora
              </Label>
            </div>
            <div className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-muted/50 cursor-pointer">
              <RadioGroupItem value="schedule" id="schedule" />
              <Label htmlFor="schedule" className="flex items-center gap-2 cursor-pointer">
                <Clock className="w-4 h-4" />
                Agendar publicação
              </Label>
            </div>
          </RadioGroup>

          {publishMode === "schedule" && (
            <div className="space-y-4 p-4 rounded-lg bg-muted/50">
              <div className="space-y-2">
                <Label>Data</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !scheduledDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {scheduledDate ? (
                        format(scheduledDate, "PPP", { locale: ptBR })
                      ) : (
                        "Selecione uma data"
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={scheduledDate}
                      onSelect={setScheduledDate}
                      disabled={(date) => date < new Date()}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label>Horário</Label>
                <Input
                  type="time"
                  value={scheduledTime}
                  onChange={(e) => setScheduledTime(e.target.value)}
                />
              </div>
            </div>
          )}

          <div className="pt-4 border-t">
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting || !content.trim() || selectedPlatforms.length === 0 || isOverLimit}
              className="w-full"
              size="lg"
            >
              {isSubmitting ? (
                "Processando..."
              ) : publishMode === "now" ? (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Publicar Agora
                </>
              ) : (
                <>
                  <Clock className="w-4 h-4 mr-2" />
                  Agendar Publicação
                </>
              )}
            </Button>
          </div>

          {/* Status Preview */}
          {selectedPlatforms.length > 0 && (
            <div className="p-4 rounded-lg bg-muted/30 space-y-2">
              <p className="text-sm font-medium">Será publicado em:</p>
              <div className="flex flex-wrap gap-2">
                {selectedPlatforms.map(platformId => {
                  const platform = PLATFORMS.find(p => p.id === platformId);
                  if (!platform) return null;
                  const Icon = platform.icon;
                  return (
                    <div key={platformId} className="flex items-center gap-1.5 px-2 py-1 bg-background rounded-md text-sm">
                      <Icon className="w-4 h-4" />
                      {platform.name}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default CreatePostTab;
