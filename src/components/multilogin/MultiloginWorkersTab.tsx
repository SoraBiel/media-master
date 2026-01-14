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
  Play,
  Pause,
  Cog,
  CheckCircle,
  XCircle,
  Clock,
  Loader2,
  Activity
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Worker {
  id: string;
  name: string;
  task_type: string;
  account_type: string;
  account_id: string;
  proxy_id: string | null;
  config: any;
  schedule_cron: string | null;
  is_active: boolean;
  status: string;
  last_run_at: string | null;
  next_run_at: string | null;
  run_count: number;
  error_count: number;
  last_error: string | null;
  created_at: string;
}

interface Account {
  id: string;
  email?: string;
  display_name?: string | null;
  username?: string;
  type: string;
}

const TASK_TYPES = [
  { value: "publish", label: "Publicação" },
  { value: "sync_metrics", label: "Sincronizar Métricas" },
  { value: "webhook", label: "Webhook" },
  { value: "automation", label: "Automação" },
  { value: "custom", label: "Personalizado" }
];

const STATUS_CONFIG = {
  idle: { label: "Parado", icon: Clock, color: "text-muted-foreground" },
  running: { label: "Executando", icon: Activity, color: "text-green-500" },
  error: { label: "Erro", icon: XCircle, color: "text-destructive" },
  paused: { label: "Pausado", icon: Pause, color: "text-yellow-500" }
};

export function MultiloginWorkersTab() {
  const { user } = useAuth();
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    name: "",
    task_type: "automation",
    account_type: "",
    account_id: "",
    schedule_cron: ""
  });

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch workers
      const { data: workersData, error: workersError } = await supabase
        .from("multilogin_workers")
        .select("*")
        .order("created_at", { ascending: false });
      
      if (workersError) throw workersError;
      setWorkers(workersData || []);

      // Fetch accounts for selection
      const [googleRes, facebookRes, instagramRes] = await Promise.all([
        supabase.from("multilogin_google_accounts").select("id, email, display_name"),
        supabase.from("multilogin_facebook_accounts").select("id, email, display_name"),
        supabase.from("multilogin_instagram_accounts").select("id, username, display_name")
      ]);

      const allAccounts: Account[] = [
        ...(googleRes.data || []).map(a => ({ ...a, type: "google" })),
        ...(facebookRes.data || []).map(a => ({ ...a, type: "facebook" })),
        ...(instagramRes.data || []).map(a => ({ ...a, type: "instagram" }))
      ];
      setAccounts(allAccounts);
    } catch (error: any) {
      console.error("Error fetching data:", error);
      toast.error("Erro ao carregar workers");
    } finally {
      setLoading(false);
    }
  };

  const handleAddWorker = async () => {
    if (!formData.name || !formData.account_id) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    const selectedAccount = accounts.find(a => a.id === formData.account_id);
    if (!selectedAccount) {
      toast.error("Selecione uma conta válida");
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from("multilogin_workers")
        .insert({
          user_id: user?.id,
          name: formData.name,
          task_type: formData.task_type,
          account_type: selectedAccount.type,
          account_id: formData.account_id,
          schedule_cron: formData.schedule_cron || null
        });
      
      if (error) throw error;
      
      toast.success("Worker criado com sucesso");
      setDialogOpen(false);
      setFormData({ name: "", task_type: "automation", account_type: "", account_id: "", schedule_cron: "" });
      fetchData();
    } catch (error: any) {
      console.error("Error adding worker:", error);
      toast.error("Erro ao criar worker");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleWorker = async (worker: Worker) => {
    try {
      const { error } = await supabase
        .from("multilogin_workers")
        .update({ 
          is_active: !worker.is_active,
          status: !worker.is_active ? "idle" : "paused"
        })
        .eq("id", worker.id);
      
      if (error) throw error;
      
      toast.success(worker.is_active ? "Worker pausado" : "Worker ativado");
      fetchData();
    } catch (error: any) {
      console.error("Error toggling worker:", error);
      toast.error("Erro ao alterar status do worker");
    }
  };

  const handleDeleteWorker = async (id: string) => {
    try {
      const { error } = await supabase
        .from("multilogin_workers")
        .delete()
        .eq("id", id);
      
      if (error) throw error;
      
      toast.success("Worker removido com sucesso");
      fetchData();
    } catch (error: any) {
      console.error("Error deleting worker:", error);
      toast.error("Erro ao remover worker");
    }
  };

  const handleRunWorker = async (worker: Worker) => {
    toast.info("Executando worker...", { description: "Esta funcionalidade requer Edge Functions configuradas" });
  };

  const getAccountLabel = (accountId: string) => {
    const account = accounts.find(a => a.id === accountId);
    if (!account) return "Conta removida";
    return account.display_name || account.email || account.username || accountId.substring(0, 8);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Workers & Automações</h3>
          <p className="text-sm text-muted-foreground">
            Configure workers para executar tarefas automatizadas
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2" disabled={accounts.length === 0}>
              <Plus className="h-4 w-4" />
              Criar Worker
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Criar Novo Worker</DialogTitle>
              <DialogDescription>
                Configure um worker para executar tarefas em background
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome do Worker *</Label>
                <Input
                  id="name"
                  placeholder="Ex: Sincronizar métricas diariamente"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Tipo de Tarefa *</Label>
                <Select
                  value={formData.task_type}
                  onValueChange={(value) => setFormData({ ...formData, task_type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TASK_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Conta Vinculada *</Label>
                <Select
                  value={formData.account_id}
                  onValueChange={(value) => setFormData({ ...formData, account_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma conta" />
                  </SelectTrigger>
                  <SelectContent>
                    {accounts.map((account) => (
                      <SelectItem key={account.id} value={account.id}>
                        <span className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            {account.type}
                          </Badge>
                          {account.display_name || account.email || account.username}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="cron">Agendamento (Cron - opcional)</Label>
                <Input
                  id="cron"
                  placeholder="Ex: 0 */6 * * * (a cada 6 horas)"
                  value={formData.schedule_cron}
                  onChange={(e) => setFormData({ ...formData, schedule_cron: e.target.value })}
                />
                <p className="text-xs text-muted-foreground">
                  Deixe vazio para execução manual
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleAddWorker} disabled={saving}>
                {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                Criar Worker
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Workers list */}
      {loading ? (
        <div className="grid gap-4 md:grid-cols-2">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-4 h-32 bg-muted/20" />
            </Card>
          ))}
        </div>
      ) : workers.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <div className="p-4 rounded-full bg-muted mb-4">
              <Cog className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="font-semibold text-lg mb-2">Nenhum worker configurado</h3>
            <p className="text-muted-foreground text-sm mb-4">
              {accounts.length === 0 
                ? "Conecte contas primeiro para criar workers"
                : "Crie workers para automatizar tarefas em suas contas"
              }
            </p>
            {accounts.length > 0 && (
              <Button onClick={() => setDialogOpen(true)} variant="outline" className="gap-2">
                <Plus className="h-4 w-4" />
                Criar primeiro worker
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {workers.map((worker) => {
            const statusConfig = STATUS_CONFIG[worker.status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.idle;
            const StatusIcon = statusConfig.icon;
            
            return (
              <Card key={worker.id} className={!worker.is_active ? "opacity-60" : ""}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <Cog className="h-5 w-5 text-muted-foreground" />
                      <CardTitle className="text-base">{worker.name}</CardTitle>
                    </div>
                    <Switch
                      checked={worker.is_active}
                      onCheckedChange={() => handleToggleWorker(worker)}
                    />
                  </div>
                  <CardDescription>
                    {TASK_TYPES.find(t => t.value === worker.task_type)?.label || worker.task_type}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {/* Account & Status */}
                  <div className="flex items-center justify-between">
                    <Badge variant="outline">
                      {worker.account_type}: {getAccountLabel(worker.account_id)}
                    </Badge>
                    <div className={`flex items-center gap-1 text-sm ${statusConfig.color}`}>
                      <StatusIcon className="h-4 w-4" />
                      {statusConfig.label}
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span>{worker.run_count} execuções</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <XCircle className="h-4 w-4 text-destructive" />
                      <span>{worker.error_count} erros</span>
                    </div>
                  </div>

                  {/* Last run */}
                  {worker.last_run_at && (
                    <div className="text-xs text-muted-foreground">
                      Última execução: {format(new Date(worker.last_run_at), "dd/MM HH:mm", { locale: ptBR })}
                    </div>
                  )}

                  {/* Error message */}
                  {worker.last_error && (
                    <div className="text-xs text-destructive bg-destructive/10 p-2 rounded">
                      {worker.last_error}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center gap-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRunWorker(worker)}
                      disabled={!worker.is_active}
                      className="flex-1 gap-2"
                    >
                      <Play className="h-4 w-4" />
                      Executar
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteWorker(worker.id)}
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
