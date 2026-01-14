import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { 
  RefreshCw, 
  Search,
  FileText,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Info,
  Globe,
  Filter
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Log {
  id: string;
  account_type: string | null;
  account_id: string | null;
  worker_id: string | null;
  proxy_id: string | null;
  event_type: string;
  action: string;
  ip_used: string | null;
  country: string | null;
  status: string | null;
  message: string | null;
  details: any;
  created_at: string;
}

const STATUS_CONFIG = {
  success: { label: "Sucesso", icon: CheckCircle, color: "text-green-500", bg: "bg-green-500/10" },
  error: { label: "Erro", icon: XCircle, color: "text-destructive", bg: "bg-destructive/10" },
  warning: { label: "Aviso", icon: AlertTriangle, color: "text-yellow-500", bg: "bg-yellow-500/10" },
  info: { label: "Info", icon: Info, color: "text-blue-500", bg: "bg-blue-500/10" }
};

export function MultiloginLogsTab() {
  const { user } = useAuth();
  const [logs, setLogs] = useState<Log[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [eventFilter, setEventFilter] = useState<string>("all");

  useEffect(() => {
    if (user) {
      fetchLogs();
    }
  }, [user]);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("multilogin_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(200);
      
      if (error) throw error;
      setLogs(data || []);
    } catch (error: any) {
      console.error("Error fetching logs:", error);
      toast.error("Erro ao carregar logs");
    } finally {
      setLoading(false);
    }
  };

  // Get unique event types for filter
  const eventTypes = Array.from(new Set(logs.map(l => l.event_type))).sort();

  // Filter logs
  const filteredLogs = logs.filter(log => {
    const matchesSearch = 
      log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (log.message && log.message.toLowerCase().includes(searchTerm.toLowerCase())) ||
      log.event_type.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || log.status === statusFilter;
    const matchesEvent = eventFilter === "all" || log.event_type === eventFilter;
    
    return matchesSearch && matchesStatus && matchesEvent;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h3 className="text-lg font-semibold">Logs de Atividade</h3>
          <p className="text-sm text-muted-foreground">
            Histórico de ações, erros e IPs utilizados
          </p>
        </div>
        <Button variant="outline" onClick={fetchLogs} className="gap-2">
          <RefreshCw className="h-4 w-4" />
          Atualizar
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar nos logs..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os status</SelectItem>
                <SelectItem value="success">Sucesso</SelectItem>
                <SelectItem value="error">Erro</SelectItem>
                <SelectItem value="warning">Aviso</SelectItem>
                <SelectItem value="info">Info</SelectItem>
              </SelectContent>
            </Select>
            <Select value={eventFilter} onValueChange={setEventFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Tipo de evento" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os eventos</SelectItem>
                {eventTypes.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Logs list */}
      {loading ? (
        <Card>
          <CardContent className="p-4">
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="animate-pulse h-16 bg-muted/20 rounded" />
              ))}
            </div>
          </CardContent>
        </Card>
      ) : filteredLogs.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <div className="p-4 rounded-full bg-muted mb-4">
              <FileText className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="font-semibold text-lg mb-2">Nenhum log encontrado</h3>
            <p className="text-muted-foreground text-sm">
              {logs.length === 0 
                ? "Os logs aparecerão aqui quando houver atividade"
                : "Nenhum log corresponde aos filtros aplicados"
              }
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Eventos Recentes</CardTitle>
              <Badge variant="secondary">{filteredLogs.length} logs</Badge>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[500px]">
              <div className="divide-y divide-border">
                {filteredLogs.map((log) => {
                  const statusConfig = STATUS_CONFIG[log.status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.info;
                  const StatusIcon = statusConfig.icon;
                  
                  return (
                    <div key={log.id} className="p-4 hover:bg-muted/50 transition-colors">
                      <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-full ${statusConfig.bg}`}>
                          <StatusIcon className={`h-4 w-4 ${statusConfig.color}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-medium">{log.action}</span>
                            <Badge variant="outline" className="text-xs">
                              {log.event_type}
                            </Badge>
                            {log.account_type && (
                              <Badge variant="secondary" className="text-xs">
                                {log.account_type}
                              </Badge>
                            )}
                          </div>
                          {log.message && (
                            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                              {log.message}
                            </p>
                          )}
                          <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                            <span>
                              {format(new Date(log.created_at), "dd/MM/yyyy HH:mm:ss", { locale: ptBR })}
                            </span>
                            {log.ip_used && (
                              <span className="flex items-center gap-1">
                                <Globe className="h-3 w-3" />
                                {log.ip_used}
                                {log.country && ` (${log.country})`}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {/* Stats */}
      {!loading && logs.length > 0 && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold">{logs.length}</div>
              <div className="text-sm text-muted-foreground">Total de Logs</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-green-500">
                {logs.filter(l => l.status === "success").length}
              </div>
              <div className="text-sm text-muted-foreground">Sucesso</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-destructive">
                {logs.filter(l => l.status === "error").length}
              </div>
              <div className="text-sm text-muted-foreground">Erros</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-yellow-500">
                {logs.filter(l => l.status === "warning").length}
              </div>
              <div className="text-sm text-muted-foreground">Avisos</div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
