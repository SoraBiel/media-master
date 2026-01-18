import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  History,
  FileText,
  UserCog,
  CreditCard,
  Ban,
  Key
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface Log {
  id: string;
  manager_id: string;
  target_user_id: string | null;
  action: string;
  action_type: string;
  details: Record<string, unknown> | null;
  ip_address: string | null;
  created_at: string;
}

const actionTypeIcons: Record<string, React.ReactNode> = {
  notes_update: <FileText className="w-4 h-4" />,
  plan_change: <CreditCard className="w-4 h-4" />,
  suspension: <Ban className="w-4 h-4" />,
  role_change: <UserCog className="w-4 h-4" />,
  password_reset: <Key className="w-4 h-4" />,
  default: <History className="w-4 h-4" />
};

const actionTypeColors: Record<string, string> = {
  notes_update: "bg-blue-500/10 text-blue-500",
  plan_change: "bg-purple-500/10 text-purple-500",
  suspension: "bg-destructive/10 text-destructive",
  role_change: "bg-amber-500/10 text-amber-500",
  password_reset: "bg-orange-500/10 text-orange-500",
  default: "bg-muted text-muted-foreground"
};

export const AccountManagerLogsTab = () => {
  const { user } = useAuth();
  const [logs, setLogs] = useState<Log[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchLogs = async () => {
      if (!user) return;

      try {
        const { data, error } = await supabase
          .from("account_manager_logs")
          .select("*")
          .eq("manager_id", user.id)
          .order("created_at", { ascending: false })
          .limit(50);

        if (error) throw error;
        setLogs((data || []) as Log[]);
      } catch (error) {
        console.error("Error fetching logs:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchLogs();
  }, [user]);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <History className="w-5 h-5" />
          Histórico de Ações
        </CardTitle>
        <CardDescription>
          Registro de todas as suas ações como gerente
        </CardDescription>
      </CardHeader>
      <CardContent>
        {logs.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">
            Nenhuma ação registrada ainda
          </p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Ação</TableHead>
                  <TableHead>Data/Hora</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell>
                      <Badge className={actionTypeColors[log.action_type] || actionTypeColors.default}>
                        <span className="mr-1">
                          {actionTypeIcons[log.action_type] || actionTypeIcons.default}
                        </span>
                        {log.action_type}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <p className="font-medium">{log.action}</p>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground">
                        {format(new Date(log.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
