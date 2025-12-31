import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { SmartLinkButton } from "@/hooks/useSmartLinks";

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
  const [funnels, setFunnels] = useState<Funnel[]>([]);
  const [isSaving, setIsSaving] = useState(false);

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

  const handleSave = async () => {
    setIsSaving(true);
    await onSave({
      title,
      url: url || null,
      is_active: isActive,
      funnel_id: funnelId || null,
      funnel_tag: funnelTag || null,
      event_name: eventName || null,
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
