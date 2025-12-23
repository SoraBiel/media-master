import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  RefreshCw, 
  MessageSquare, 
  User, 
  CheckCircle, 
  XCircle,
  Clock,
  ChevronDown,
  ChevronRight,
  Webhook,
  Bell,
  GitBranch,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { supabase } from '@/integrations/supabase/client';

interface Session {
  id: string;
  chat_id: string;
  telegram_user_id: string | null;
  is_finished: boolean;
  created_at: string;
  last_message_at: string | null;
  variables: Record<string, any>;
}

interface Log {
  id: string;
  session_id: string | null;
  event_type: string;
  node_id: string | null;
  payload: Record<string, any>;
  created_at: string;
}

interface FunnelLogsPanelProps {
  funnelId: string;
}

const eventTypeConfig: Record<string, { label: string; icon: any; color: string }> = {
  session_started: { label: 'Sessão Iniciada', icon: User, color: 'bg-primary' },
  session_finished: { label: 'Sessão Finalizada', icon: CheckCircle, color: 'bg-success' },
  user_response: { label: 'Resposta do Usuário', icon: MessageSquare, color: 'bg-blue-500' },
  condition_evaluated: { label: 'Condição Avaliada', icon: GitBranch, color: 'bg-amber-500' },
  webhook_called: { label: 'Webhook Chamado', icon: Webhook, color: 'bg-violet-500' },
  admin_notification: { label: 'Notificação Admin', icon: Bell, color: 'bg-orange-500' },
};

export const FunnelLogsPanel = ({ funnelId }: FunnelLogsPanelProps) => {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [logs, setLogs] = useState<Log[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedSessions, setExpandedSessions] = useState<Set<string>>(new Set());

  const fetchData = async () => {
    setIsLoading(true);
    try {
      // Fetch sessions
      const { data: sessionsData } = await supabase
        .from('telegram_sessions')
        .select('*')
        .eq('funnel_id', funnelId)
        .order('created_at', { ascending: false })
        .limit(50);

      setSessions((sessionsData || []) as Session[]);

      // Fetch logs
      const { data: logsData } = await supabase
        .from('telegram_logs')
        .select('*')
        .eq('funnel_id', funnelId)
        .order('created_at', { ascending: false })
        .limit(200);

      setLogs((logsData || []) as Log[]);
    } catch (error) {
      console.error('Error fetching logs:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    // Subscribe to realtime updates
    const channel = supabase
      .channel(`funnel-logs-${funnelId}`)
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'telegram_sessions',
        filter: `funnel_id=eq.${funnelId}`
      }, () => fetchData())
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'telegram_logs',
        filter: `funnel_id=eq.${funnelId}`
      }, () => fetchData())
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [funnelId]);

  const toggleSession = (sessionId: string) => {
    const newExpanded = new Set(expandedSessions);
    if (newExpanded.has(sessionId)) {
      newExpanded.delete(sessionId);
    } else {
      newExpanded.add(sessionId);
    }
    setExpandedSessions(newExpanded);
  };

  const getSessionLogs = (sessionId: string) => {
    return logs.filter(log => log.session_id === sessionId);
  };

  const formatDate = (date: string) => {
    return format(new Date(date), "dd/MM/yyyy HH:mm:ss", { locale: ptBR });
  };

  return (
    <div className="h-full flex flex-col bg-background">
      <div className="p-4 border-b flex items-center justify-between">
        <h2 className="font-semibold text-lg">Logs de Execução</h2>
        <Button variant="outline" size="sm" onClick={fetchData} disabled={isLoading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Atualizar
        </Button>
      </div>

      <div className="grid grid-cols-3 gap-4 p-4 border-b">
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold">{sessions.length}</div>
            <p className="text-xs text-muted-foreground">Sessões</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-success">
              {sessions.filter(s => s.is_finished).length}
            </div>
            <p className="text-xs text-muted-foreground">Finalizadas</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-primary">
              {sessions.filter(s => !s.is_finished).length}
            </div>
            <p className="text-xs text-muted-foreground">Em Andamento</p>
          </CardContent>
        </Card>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-3">
          {sessions.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhuma sessão encontrada</p>
              <p className="text-sm">As sessões aparecerão aqui quando usuários interagirem com o funil</p>
            </div>
          ) : (
            sessions.map((session) => {
              const sessionLogs = getSessionLogs(session.id);
              const isExpanded = expandedSessions.has(session.id);

              return (
                <Collapsible key={session.id} open={isExpanded} onOpenChange={() => toggleSession(session.id)}>
                  <Card className="overflow-hidden">
                    <CollapsibleTrigger asChild>
                      <CardHeader className="py-3 cursor-pointer hover:bg-muted/50 transition-colors">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            {isExpanded ? (
                              <ChevronDown className="h-4 w-4" />
                            ) : (
                              <ChevronRight className="h-4 w-4" />
                            )}
                            <div>
                              <CardTitle className="text-sm font-medium">
                                Chat: {session.chat_id}
                              </CardTitle>
                              <p className="text-xs text-muted-foreground">
                                {formatDate(session.created_at)}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">
                              {sessionLogs.length} eventos
                            </Badge>
                            {session.is_finished ? (
                              <Badge className="bg-success">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Finalizada
                              </Badge>
                            ) : (
                              <Badge variant="secondary">
                                <Clock className="h-3 w-3 mr-1" />
                                Em Andamento
                              </Badge>
                            )}
                          </div>
                        </div>
                      </CardHeader>
                    </CollapsibleTrigger>
                    
                    <CollapsibleContent>
                      <CardContent className="pt-0 pb-4">
                        {/* Variables */}
                        {Object.keys(session.variables || {}).length > 0 && (
                          <div className="mb-4 p-3 bg-muted/50 rounded-lg">
                            <p className="text-xs font-medium mb-2">Variáveis</p>
                            <div className="flex flex-wrap gap-2">
                              {Object.entries(session.variables || {}).map(([key, value]) => (
                                <Badge key={key} variant="outline" className="text-xs">
                                  {key}: {String(value).slice(0, 30)}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Events timeline */}
                        <div className="space-y-2">
                          {sessionLogs.map((log, index) => {
                            const config = eventTypeConfig[log.event_type] || {
                              label: log.event_type,
                              icon: MessageSquare,
                              color: 'bg-muted',
                            };
                            const Icon = config.icon;

                            return (
                              <div key={log.id} className="flex items-start gap-3">
                                <div className={`w-6 h-6 rounded-full ${config.color} flex items-center justify-center flex-shrink-0`}>
                                  <Icon className="h-3 w-3 text-white" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center justify-between">
                                    <p className="text-sm font-medium">{config.label}</p>
                                    <p className="text-xs text-muted-foreground">
                                      {formatDate(log.created_at)}
                                    </p>
                                  </div>
                                  {log.payload && Object.keys(log.payload).length > 0 && (
                                    <pre className="mt-1 text-xs bg-muted p-2 rounded overflow-x-auto">
                                      {JSON.stringify(log.payload, null, 2)}
                                    </pre>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </CardContent>
                    </CollapsibleContent>
                  </Card>
                </Collapsible>
              );
            })
          )}
        </div>
      </ScrollArea>
    </div>
  );
};
