import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { usePixelWarming, PixelWarmingConfig } from "@/hooks/usePixelWarming";
import { Flame, Plus, Trash2, Settings2, Send, CheckCircle2, XCircle, Clock } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const platformIcons: Record<string, string> = {
  facebook: "📘",
  tiktok: "🎵",
  kwai: "🎬",
};

const platformNames: Record<string, string> = {
  facebook: "Facebook Pixel",
  tiktok: "TikTok Pixel",
  kwai: "Kwai Pixel",
};

const eventTypes = [
  { value: "PageView", label: "PageView - Visualização de página" },
  { value: "ViewContent", label: "ViewContent - Visualização de conteúdo" },
  { value: "AddToCart", label: "AddToCart - Adicionar ao carrinho" },
  { value: "InitiateCheckout", label: "InitiateCheckout - Iniciar checkout" },
  { value: "Purchase", label: "Purchase - Compra" },
  { value: "Lead", label: "Lead - Lead gerado" },
  { value: "CompleteRegistration", label: "CompleteRegistration - Registro completo" },
];

export const PixelWarmingTab = () => {
  const { configs, logs, isLoading, isSending, saveConfig, deleteConfig, sendWarmingEvents, toggleConfig } = usePixelWarming();
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showWarmDialog, setShowWarmDialog] = useState(false);
  const [selectedConfig, setSelectedConfig] = useState<PixelWarmingConfig | null>(null);
  
  const [newPlatform, setNewPlatform] = useState<"facebook" | "tiktok" | "kwai">("facebook");
  const [newPixelId, setNewPixelId] = useState("");
  const [newAccessToken, setNewAccessToken] = useState("");
  
  const [warmEventType, setWarmEventType] = useState("PageView");
  const [warmEventCount, setWarmEventCount] = useState("10");

  const handleSaveConfig = async () => {
    if (!newPixelId.trim()) return;
    
    await saveConfig(newPlatform, newPixelId.trim(), newAccessToken.trim() || undefined);
    setShowAddDialog(false);
    setNewPixelId("");
    setNewAccessToken("");
  };

  const handleSendEvents = async () => {
    if (!selectedConfig) return;
    
    await sendWarmingEvents(selectedConfig.id, warmEventType, parseInt(warmEventCount) || 10);
    setShowWarmDialog(false);
  };

  const openWarmDialog = (config: PixelWarmingConfig) => {
    setSelectedConfig(config);
    setShowWarmDialog(true);
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header Card */}
      <Card className="bg-gradient-to-r from-orange-500/10 to-red-500/10 border-orange-500/20">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-to-r from-orange-500 to-red-500">
                <Flame className="w-6 h-6 text-white" />
              </div>
              <div>
                <CardTitle>Aquecimento de Pixels</CardTitle>
                <CardDescription>
                  Aqueça seus pixels do Facebook, TikTok e Kwai para melhorar a performance dos anúncios
                </CardDescription>
              </div>
            </div>
            <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Adicionar Pixel
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Adicionar Pixel</DialogTitle>
                  <DialogDescription>
                    Configure um pixel para aquecimento
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label>Plataforma</Label>
                    <Select value={newPlatform} onValueChange={(v) => setNewPlatform(v as "facebook" | "tiktok" | "kwai")}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="facebook">📘 Facebook Pixel</SelectItem>
                        <SelectItem value="tiktok">🎵 TikTok Pixel</SelectItem>
                        <SelectItem value="kwai">🎬 Kwai Pixel</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>ID do Pixel</Label>
                    <Input
                      placeholder="Ex: 123456789012345"
                      value={newPixelId}
                      onChange={(e) => setNewPixelId(e.target.value)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Access Token (opcional)</Label>
                    <Input
                      type="password"
                      placeholder="Token de acesso da API"
                      value={newAccessToken}
                      onChange={(e) => setNewAccessToken(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">
                      Necessário para enviar eventos via API. Sem token, usaremos eventos simulados.
                    </p>
                  </div>
                  
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setShowAddDialog(false)}>
                      Cancelar
                    </Button>
                    <Button onClick={handleSaveConfig} disabled={!newPixelId.trim()}>
                      Salvar
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
      </Card>

      {/* Pixels Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {configs.length === 0 ? (
          <Card className="col-span-full">
            <CardContent className="py-12 text-center">
              <Flame className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">Nenhum pixel configurado</h3>
              <p className="text-muted-foreground mb-4">
                Adicione seus pixels para começar a aquecê-los
              </p>
              <Button onClick={() => setShowAddDialog(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Adicionar Pixel
              </Button>
            </CardContent>
          </Card>
        ) : (
          configs.map((config) => (
            <Card key={config.id} className={!config.is_active ? "opacity-60" : ""}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{platformIcons[config.platform]}</span>
                    <CardTitle className="text-base">{platformNames[config.platform]}</CardTitle>
                  </div>
                  <Switch
                    checked={config.is_active}
                    onCheckedChange={() => toggleConfig(config.id)}
                  />
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="p-2 bg-muted rounded text-xs font-mono break-all">
                  {config.pixel_id}
                </div>
                
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Eventos enviados:</span>
                  <Badge variant="secondary">{config.events_sent || 0}</Badge>
                </div>
                
                {config.last_warmed_at && (
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="w-3 h-3" />
                    Último aquecimento: {format(new Date(config.last_warmed_at), "dd/MM HH:mm", { locale: ptBR })}
                  </div>
                )}
                
                <div className="flex gap-2 pt-2">
                  <Button
                    size="sm"
                    className="flex-1"
                    onClick={() => openWarmDialog(config)}
                    disabled={!config.is_active}
                  >
                    <Flame className="w-4 h-4 mr-1" />
                    Aquecer
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => deleteConfig(config.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Warming Dialog */}
      <Dialog open={showWarmDialog} onOpenChange={setShowWarmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Flame className="w-5 h-5 text-orange-500" />
              Aquecer Pixel
            </DialogTitle>
            <DialogDescription>
              {selectedConfig && `Enviar eventos para o ${platformNames[selectedConfig.platform]}`}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label>Tipo de Evento</Label>
              <Select value={warmEventType} onValueChange={setWarmEventType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {eventTypes.map((event) => (
                    <SelectItem key={event.value} value={event.value}>
                      {event.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Quantidade de Eventos</Label>
              <Select value={warmEventCount} onValueChange={setWarmEventCount}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5 eventos</SelectItem>
                  <SelectItem value="10">10 eventos</SelectItem>
                  <SelectItem value="25">25 eventos</SelectItem>
                  <SelectItem value="50">50 eventos</SelectItem>
                  <SelectItem value="100">100 eventos</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
              <p className="text-sm text-amber-800 dark:text-amber-200">
                ⚠️ Eventos serão disparados para o pixel configurado. Use com moderação para evitar bloqueios.
              </p>
            </div>
            
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowWarmDialog(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSendEvents} disabled={isSending}>
                {isSending ? (
                  <>Enviando...</>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Enviar Eventos
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Logs Table */}
      {logs.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Settings2 className="w-4 h-4" />
              Histórico de Aquecimento
            </CardTitle>
            <CardDescription>Últimos eventos enviados</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Evento</TableHead>
                  <TableHead>Plataforma</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.slice(0, 20).map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="text-sm">
                      {format(new Date(log.created_at), "dd/MM HH:mm:ss", { locale: ptBR })}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{log.event_type}</Badge>
                    </TableCell>
                    <TableCell className="text-sm">
                      {log.event_data && typeof log.event_data === "object" && "platform" in log.event_data
                        ? `${platformIcons[log.event_data.platform as string] || ""} ${platformNames[log.event_data.platform as string] || log.event_data.platform}`
                        : "-"}
                    </TableCell>
                    <TableCell>
                      {log.status === "success" ? (
                        <CheckCircle2 className="w-4 h-4 text-green-500" />
                      ) : log.status === "error" ? (
                        <XCircle className="w-4 h-4 text-red-500" />
                      ) : (
                        <Clock className="w-4 h-4 text-yellow-500" />
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
