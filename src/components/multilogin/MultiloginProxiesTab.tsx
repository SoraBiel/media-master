import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { 
  Plus, 
  Trash2, 
  TestTube, 
  Globe,
  CheckCircle,
  XCircle,
  Loader2,
  Link2,
  Clock
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Proxy {
  id: string;
  name: string;
  protocol: string;
  host: string;
  port: number;
  username: string | null;
  password: string | null;
  country: string | null;
  detected_ip: string | null;
  is_active: boolean;
  last_tested_at: string | null;
  last_test_success: boolean | null;
  test_error: string | null;
  created_at: string;
}

export function MultiloginProxiesTab() {
  const { user } = useAuth();
  const [proxies, setProxies] = useState<Proxy[]>([]);
  const [loading, setLoading] = useState(true);
  const [testingId, setTestingId] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    name: "",
    protocol: "http",
    host: "",
    port: "",
    username: "",
    password: ""
  });

  useEffect(() => {
    if (user) {
      fetchProxies();
    }
  }, [user]);

  const fetchProxies = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("multilogin_proxies")
        .select("*")
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      setProxies(data || []);
    } catch (error: any) {
      console.error("Error fetching proxies:", error);
      toast.error("Erro ao carregar proxies");
    } finally {
      setLoading(false);
    }
  };

  const handleAddProxy = async () => {
    if (!formData.name || !formData.host || !formData.port) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from("multilogin_proxies")
        .insert({
          user_id: user?.id,
          name: formData.name,
          protocol: formData.protocol,
          host: formData.host,
          port: parseInt(formData.port),
          username: formData.username || null,
          password: formData.password || null
        });
      
      if (error) throw error;
      
      toast.success("Proxy adicionado com sucesso");
      setDialogOpen(false);
      setFormData({ name: "", protocol: "http", host: "", port: "", username: "", password: "" });
      fetchProxies();
    } catch (error: any) {
      console.error("Error adding proxy:", error);
      toast.error("Erro ao adicionar proxy");
    } finally {
      setSaving(false);
    }
  };

  const handleTestProxy = async (proxy: Proxy) => {
    setTestingId(proxy.id);
    try {
      // Simulate proxy test - in production, this would call an edge function
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Mock result
      const success = Math.random() > 0.3;
      const ip = success ? `${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}` : null;
      
      const { error } = await supabase
        .from("multilogin_proxies")
        .update({
          last_tested_at: new Date().toISOString(),
          last_test_success: success,
          detected_ip: ip,
          test_error: success ? null : "Timeout: Unable to connect"
        })
        .eq("id", proxy.id);
      
      if (error) throw error;
      
      if (success) {
        toast.success(`Proxy funcionando! IP detectado: ${ip}`);
      } else {
        toast.error("Falha no teste do proxy");
      }
      
      fetchProxies();
    } catch (error: any) {
      console.error("Error testing proxy:", error);
      toast.error("Erro ao testar proxy");
    } finally {
      setTestingId(null);
    }
  };

  const handleToggleProxy = async (proxy: Proxy) => {
    try {
      const { error } = await supabase
        .from("multilogin_proxies")
        .update({ is_active: !proxy.is_active })
        .eq("id", proxy.id);
      
      if (error) throw error;
      
      toast.success(proxy.is_active ? "Proxy desativado" : "Proxy ativado");
      fetchProxies();
    } catch (error: any) {
      console.error("Error toggling proxy:", error);
      toast.error("Erro ao alterar status do proxy");
    }
  };

  const handleDeleteProxy = async (id: string) => {
    try {
      const { error } = await supabase
        .from("multilogin_proxies")
        .delete()
        .eq("id", id);
      
      if (error) throw error;
      
      toast.success("Proxy removido com sucesso");
      fetchProxies();
    } catch (error: any) {
      console.error("Error deleting proxy:", error);
      toast.error("Erro ao remover proxy");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Gerenciar Proxies</h3>
          <p className="text-sm text-muted-foreground">
            Adicione e configure proxies para isolamento de contas
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Adicionar Proxy
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Adicionar Novo Proxy</DialogTitle>
              <DialogDescription>
                Configure um proxy para usar com suas contas
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome do Proxy *</Label>
                <Input
                  id="name"
                  placeholder="Ex: Proxy Brasil 1"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Protocolo *</Label>
                  <Select
                    value={formData.protocol}
                    onValueChange={(value) => setFormData({ ...formData, protocol: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="http">HTTP</SelectItem>
                      <SelectItem value="https">HTTPS</SelectItem>
                      <SelectItem value="socks5">SOCKS5</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="port">Porta *</Label>
                  <Input
                    id="port"
                    type="number"
                    placeholder="8080"
                    value={formData.port}
                    onChange={(e) => setFormData({ ...formData, port: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="host">Host / IP *</Label>
                <Input
                  id="host"
                  placeholder="proxy.exemplo.com ou 192.168.1.1"
                  value={formData.host}
                  onChange={(e) => setFormData({ ...formData, host: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="username">Usuário (opcional)</Label>
                  <Input
                    id="username"
                    placeholder="Usuário"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Senha (opcional)</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleAddProxy} disabled={saving}>
                {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                Adicionar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Proxies list */}
      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-4 h-40 bg-muted/20" />
            </Card>
          ))}
        </div>
      ) : proxies.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <div className="p-4 rounded-full bg-muted mb-4">
              <Globe className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="font-semibold text-lg mb-2">Nenhum proxy configurado</h3>
            <p className="text-muted-foreground text-sm mb-4">
              Adicione proxies para usar com suas contas e ter isolamento total
            </p>
            <Button onClick={() => setDialogOpen(true)} variant="outline" className="gap-2">
              <Plus className="h-4 w-4" />
              Adicionar primeiro proxy
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {proxies.map((proxy) => (
            <Card key={proxy.id} className={!proxy.is_active ? "opacity-60" : ""}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <Globe className="h-5 w-5 text-muted-foreground" />
                    <CardTitle className="text-base">{proxy.name}</CardTitle>
                  </div>
                  <Switch
                    checked={proxy.is_active}
                    onCheckedChange={() => handleToggleProxy(proxy)}
                  />
                </div>
                <CardDescription className="font-mono text-xs">
                  {proxy.protocol}://{proxy.host}:{proxy.port}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* Status */}
                <div className="flex items-center gap-2">
                  {proxy.last_test_success === true && (
                    <Badge variant="default" className="gap-1">
                      <CheckCircle className="h-3 w-3" />
                      Funcionando
                    </Badge>
                  )}
                  {proxy.last_test_success === false && (
                    <Badge variant="destructive" className="gap-1">
                      <XCircle className="h-3 w-3" />
                      Falhou
                    </Badge>
                  )}
                  {proxy.last_test_success === null && (
                    <Badge variant="secondary" className="gap-1">
                      <Clock className="h-3 w-3" />
                      Não testado
                    </Badge>
                  )}
                </div>

                {/* IP detectado */}
                {proxy.detected_ip && (
                  <div className="text-xs text-muted-foreground">
                    IP: <span className="font-mono">{proxy.detected_ip}</span>
                    {proxy.country && <span className="ml-1">({proxy.country})</span>}
                  </div>
                )}

                {/* Last tested */}
                {proxy.last_tested_at && (
                  <div className="text-xs text-muted-foreground">
                    Último teste: {format(new Date(proxy.last_tested_at), "dd/MM HH:mm", { locale: ptBR })}
                  </div>
                )}

                {/* Error message */}
                {proxy.test_error && (
                  <div className="text-xs text-destructive bg-destructive/10 p-2 rounded">
                    {proxy.test_error}
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleTestProxy(proxy)}
                    disabled={testingId === proxy.id}
                    className="flex-1 gap-2"
                  >
                    {testingId === proxy.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <TestTube className="h-4 w-4" />
                    )}
                    Testar
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDeleteProxy(proxy.id)}
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
