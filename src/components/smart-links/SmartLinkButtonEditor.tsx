import { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { SmartLinkButton } from "@/hooks/useSmartLinks";
import { ImagePlus, X, Loader2 } from "lucide-react";

interface SmartLinkButtonEditorProps {
  button: SmartLinkButton;
  onSave: (data: Partial<SmartLinkButton>) => Promise<void>;
  onClose: () => void;
}

interface Funnel {
  id: string;
  name: string;
}

const SmartLinkButtonEditor = ({ button, onSave, onClose }: SmartLinkButtonEditorProps) => {
  const { user } = useAuth();
  const [title, setTitle] = useState(button.title);
  const [url, setUrl] = useState(button.url || "");
  const [isActive, setIsActive] = useState(button.is_active);
  const [funnelId, setFunnelId] = useState(button.funnel_id || "");
  const [funnelTag, setFunnelTag] = useState(button.funnel_tag || "");
  const [eventName, setEventName] = useState(button.event_name || "");
  const [iconUrl, setIconUrl] = useState(button.icon || "");
  const [funnels, setFunnels] = useState<Funnel[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingIcon, setIsUploadingIcon] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchFunnels = async () => {
      if (!user) return;

      const { data } = await supabase
        .from("funnels")
        .select("id, name")
        .eq("user_id", user.id)
        .eq("is_active", true)
        .order("name");

      setFunnels(data || []);
    };

    fetchFunnels();
  }, [user]);

  const handleIconUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setIsUploadingIcon(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${button.id}-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("smart-link-assets")
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("smart-link-assets")
        .getPublicUrl(fileName);

      setIconUrl(urlData.publicUrl);
    } catch (error) {
      console.error("Error uploading icon:", error);
    } finally {
      setIsUploadingIcon(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    await onSave({
      title,
      url: url || null,
      is_active: isActive,
      funnel_id: funnelId || null,
      funnel_tag: funnelTag || null,
      event_name: eventName || null,
      icon: iconUrl || null,
    });
    setIsSaving(false);
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Editar Botão</DialogTitle>
          <DialogDescription>
            Configure o comportamento do botão
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Icon Upload */}
          <div className="space-y-2">
            <Label>Ícone/Foto do Botão</Label>
            <div className="flex items-center gap-3">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleIconUpload}
                className="hidden"
              />
              {iconUrl ? (
                <div className="relative">
                  <img
                    src={iconUrl}
                    alt="Ícone"
                    className="w-12 h-12 rounded-lg object-cover border"
                  />
                  <button
                    type="button"
                    onClick={() => setIconUrl("")}
                    className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground rounded-full p-0.5"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploadingIcon}
                  className="w-12 h-12 rounded-lg border-2 border-dashed flex items-center justify-center hover:border-primary transition-colors"
                >
                  {isUploadingIcon ? (
                    <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                  ) : (
                    <ImagePlus className="w-5 h-5 text-muted-foreground" />
                  )}
                </button>
              )}
              <p className="text-xs text-muted-foreground flex-1">
                Adicione um ícone ou foto para o botão (opcional)
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="title">Título</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Meu Instagram"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="url">Link (URL)</Label>
            <Input
              id="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://..."
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="funnel">Iniciar Funil (opcional)</Label>
            <Select value={funnelId || "none"} onValueChange={(val) => setFunnelId(val === "none" ? "" : val)}>
              <SelectTrigger>
                <SelectValue placeholder="Nenhum funil" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Nenhum funil</SelectItem>
                {funnels.map((funnel) => (
                  <SelectItem key={funnel.id} value={funnel.id}>
                    {funnel.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Se selecionado, o clique inicia uma sessão no funil escolhido
            </p>
          </div>

          {funnelId && (
            <div className="space-y-2">
              <Label htmlFor="funnelTag">Tag do Funil (opcional)</Label>
              <Input
                id="funnelTag"
                value={funnelTag}
                onChange={(e) => setFunnelTag(e.target.value)}
                placeholder="Ex: origem_smartlink"
              />
              <p className="text-xs text-muted-foreground">
                Tag para segmentar leads vindos deste botão
              </p>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="eventName">Nome do Evento (opcional)</Label>
            <Input
              id="eventName"
              value={eventName}
              onChange={(e) => setEventName(e.target.value)}
              placeholder="Ex: click_instagram"
            />
            <p className="text-xs text-muted-foreground">
              Evento personalizado para tracking (disparado nos pixels)
            </p>
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Ativo</Label>
              <p className="text-xs text-muted-foreground">
                Botões inativos não aparecem na página
              </p>
            </div>
            <Switch checked={isActive} onCheckedChange={setIsActive} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? "Salvando..." : "Salvar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default SmartLinkButtonEditor;
