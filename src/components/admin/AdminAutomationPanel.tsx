import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Settings, Users, History, CheckCircle, XCircle, Clock, AlertCircle, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface AdminSetting {
  id: string;
  setting_key: string;
  setting_value: boolean;
}

interface PostLog {
  id: string;
  post_id: string;
  platform: string;
  status: string;
  error_message: string | null;
  posted_at: string | null;
  created_at: string;
  scheduled_posts: {
    content: string;
    profiles: {
      email: string;
      full_name: string | null;
    } | null;
  } | null;
}

const PLAN_SETTINGS = [
  { key: "automation_free_plan_access", label: "Plano Free" },
  { key: "automation_basic_plan_access", label: "Plano Basic" },
  { key: "automation_pro_plan_access", label: "Plano Pro" },
  { key: "automation_agency_plan_access", label: "Plano Agency" },
];

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: any }> = {
  pending: { label: "Pendente", color: "secondary", icon: Clock },
  success: { label: "Sucesso", color: "default", icon: CheckCircle },
  failed: { label: "Falhou", color: "destructive", icon: XCircle },
  skipped: { label: "Ignorado", color: "secondary", icon: AlertCircle },
};

const AdminAutomationPanel = () => {
  const [settings, setSettings] = useState<Record<string, boolean>>({});
  const [logs, setLogs] = useState<PostLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingLogs, setIsLoadingLogs] = useState(true);

  useEffect(() => {
    fetchSettings();
    fetchLogs();
  }, []);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from("admin_settings")
        .select("*")
        .like("setting_key", "automation_%");

      if (error) throw error;

      const settingsMap: Record<string, boolean> = {};
      data?.forEach(setting => {
        settingsMap[setting.setting_key] = setting.setting_value;
      });
      setSettings(settingsMap);
    } catch (error: any) {
      console.error("Error fetching settings:", error);
      toast.error("Erro ao carregar configurações");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchLogs = async () => {
    try {
      const { data, error } = await supabase
        .from("post_platform_logs")
        .select(`
          *,
          scheduled_posts (
            content,
            user_id
          )
        `)
        .order("created_at", { ascending: false })
        .limit(100);

      if (error) throw error;
      
      // Fetch user profiles for each log
      const logsWithProfiles = await Promise.all(
        (data || []).map(async (log) => {
          if (log.scheduled_posts?.user_id) {
            const { data: profile } = await supabase
              .from("profiles")
              .select("email, full_name")
              .eq("user_id", log.scheduled_posts.user_id)
              .single();
            
            return {
              ...log,
              scheduled_posts: {
                ...log.scheduled_posts,
                profiles: profile,
              },
            };
          }
          return {
            ...log,
            scheduled_posts: {
              ...log.scheduled_posts,
              profiles: null,
            },
          };
        })
      );
      
      setLogs(logsWithProfiles as PostLog[]);
    } catch (error: any) {
      console.error("Error fetching logs:", error);
    } finally {
      setIsLoadingLogs(false);
    }
  };

  const updateSetting = async (key: string, value: boolean) => {
    try {
      const { error } = await supabase
        .from("admin_settings")
        .upsert({
          setting_key: key,
          setting_value: value,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: "setting_key",
        });

      if (error) throw error;

      setSettings(prev => ({ ...prev, [key]: value }));
      toast.success("Configuração atualizada");
    } catch (error: any) {
      console.error("Error updating setting:", error);
      toast.error("Erro ao atualizar configuração");
    }
  };

  const getFailureStats = () => {
    const platformStats: Record<string, { total: number; failed: number }> = {};
    
    logs.forEach(log => {
      if (!platformStats[log.platform]) {
        platformStats[log.platform] = { total: 0, failed: 0 };
      }
      platformStats[log.platform].total++;
      if (log.status === "failed") {
        platformStats[log.platform].failed++;
      }
    });

    return platformStats;
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  const failureStats = getFailureStats();

  return (
    <Tabs defaultValue="settings" className="space-y-6">
      <TabsList>
        <TabsTrigger value="settings" className="gap-2">
          <Settings className="w-4 h-4" />
          Configurações
        </TabsTrigger>
        <TabsTrigger value="logs" className="gap-2">
          <History className="w-4 h-4" />
          Logs
        </TabsTrigger>
      </TabsList>

      <TabsContent value="settings" className="space-y-6">
        {/* Global Toggle */}
        <Card>
          <CardHeader>
            <CardTitle>Módulo de Automação</CardTitle>
            <CardDescription>
              Controle global do módulo de automação de publicações
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
              <div>
                <Label className="text-base font-medium">Ativar Módulo</Label>
                <p className="text-sm text-muted-foreground">
                  Quando desativado, o módulo não aparece para nenhum usuário e posts agendados são pausados
                </p>
              </div>
              <Switch
                checked={settings.automation_module_enabled ?? true}
                onCheckedChange={(checked) => updateSetting("automation_module_enabled", checked)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Plan Access */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Acesso por Plano
            </CardTitle>
            <CardDescription>
              Defina quais planos têm acesso ao módulo de automação
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {PLAN_SETTINGS.map((plan) => (
                <div
                  key={plan.key}
                  className="flex items-center justify-between p-3 rounded-lg border"
                >
                  <Label className="font-medium">{plan.label}</Label>
                  <Switch
                    checked={settings[plan.key] ?? false}
                    onCheckedChange={(checked) => updateSetting(plan.key, checked)}
                    disabled={!settings.automation_module_enabled}
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Failure Stats */}
        <Card>
          <CardHeader>
            <CardTitle>Estatísticas de Falhas</CardTitle>
            <CardDescription>
              Taxa de falha por plataforma (últimos 100 posts)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {Object.entries(failureStats).map(([platform, stats]) => {
                const failureRate = stats.total > 0 
                  ? ((stats.failed / stats.total) * 100).toFixed(1) 
                  : "0";
                
                return (
                  <div key={platform} className="p-4 rounded-lg bg-muted/50">
                    <p className="font-medium capitalize">{platform}</p>
                    <div className="flex items-end justify-between mt-2">
                      <span className="text-2xl font-bold">{failureRate}%</span>
                      <span className="text-sm text-muted-foreground">
                        {stats.failed}/{stats.total} falhas
                      </span>
                    </div>
                  </div>
                );
              })}
              {Object.keys(failureStats).length === 0 && (
                <p className="text-muted-foreground col-span-full text-center py-4">
                  Nenhum log disponível
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="logs">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Logs de Publicação</CardTitle>
              <CardDescription>
                Histórico de todas as publicações do sistema
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={fetchLogs}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Atualizar
            </Button>
          </CardHeader>
          <CardContent>
            {isLoadingLogs ? (
              <div className="space-y-2">
                {[1, 2, 3, 4, 5].map(i => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : logs.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Nenhum log disponível
              </div>
            ) : (
              <ScrollArea className="h-[400px]">
                <div className="space-y-2">
                  {logs.map((log) => {
                    const statusConfig = STATUS_CONFIG[log.status] || STATUS_CONFIG.pending;
                    const StatusIcon = statusConfig.icon;

                    return (
                      <div
                        key={log.id}
                        className="flex items-center justify-between p-3 rounded-lg border"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <Badge variant={statusConfig.color as any} className="gap-1">
                              <StatusIcon className="w-3 h-3" />
                              {statusConfig.label}
                            </Badge>
                            <Badge variant="outline" className="capitalize">
                              {log.platform}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1 truncate">
                            {log.scheduled_posts?.profiles?.full_name || log.scheduled_posts?.profiles?.email || "Usuário"}
                            {" - "}
                            {log.scheduled_posts?.content?.substring(0, 50)}...
                          </p>
                          {log.error_message && (
                            <p className="text-sm text-destructive mt-1">
                              Erro: {log.error_message}
                            </p>
                          )}
                        </div>
                        <div className="text-right text-sm text-muted-foreground">
                          {format(new Date(log.created_at), "dd/MM HH:mm", { locale: ptBR })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
};

export default AdminAutomationPanel;
