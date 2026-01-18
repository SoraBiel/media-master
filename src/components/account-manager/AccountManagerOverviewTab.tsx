import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Users, 
  TrendingUp, 
  Clock,
  Crown,
  Activity
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

interface UserProfile {
  id: string;
  user_id: string;
  email: string;
  full_name: string | null;
  current_plan: string | null;
  is_online: boolean;
  is_suspended: boolean;
  last_seen_at: string | null;
  created_at: string | null;
}

interface SellerStats {
  total: number;
  active: number;
  inactive: number;
}

interface AccountManagerOverviewTabProps {
  users: UserProfile[];
  isLoading: boolean;
  stats: SellerStats;
}

const planColors: Record<string, string> = {
  free: "bg-muted text-muted-foreground",
  basic: "bg-blue-500/10 text-blue-500",
  pro: "bg-purple-500/10 text-purple-500",
  agency: "bg-amber-500/10 text-amber-500"
};

export const AccountManagerOverviewTab = ({ users, isLoading, stats }: AccountManagerOverviewTabProps) => {
  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  // Get recent activity - users sorted by last seen
  const recentActivity = [...users]
    .filter(u => u.last_seen_at)
    .sort((a, b) => {
      const dateA = new Date(a.last_seen_at || 0);
      const dateB = new Date(b.last_seen_at || 0);
      return dateB.getTime() - dateA.getTime();
    })
    .slice(0, 5);

  // Group by plan
  const planDistribution = users.reduce((acc, user) => {
    const plan = user.current_plan || "free";
    acc[plan] = (acc[plan] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Online users
  const onlineUsers = users.filter(u => u.is_online && !u.is_suspended);

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Atividade Recente
          </CardTitle>
          <CardDescription>
            Últimos usuários online
          </CardDescription>
        </CardHeader>
        <CardContent>
          {recentActivity.length === 0 ? (
            <p className="text-muted-foreground text-sm">Nenhuma atividade recente</p>
          ) : (
            <div className="space-y-3">
              {recentActivity.map(user => (
                <div key={user.id} className="flex items-center justify-between py-2 border-b last:border-0">
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${user.is_online ? "bg-success" : "bg-muted"}`} />
                    <div>
                      <p className="font-medium text-sm">
                        {user.full_name || "Sem nome"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {user.email}
                      </p>
                    </div>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {user.last_seen_at 
                      ? formatDistanceToNow(new Date(user.last_seen_at), { 
                          addSuffix: true, 
                          locale: ptBR 
                        })
                      : "Nunca"
                    }
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Plan Distribution */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Crown className="w-5 h-5" />
            Distribuição por Plano
          </CardTitle>
          <CardDescription>
            Planos dos usuários
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Object.entries(planDistribution).map(([plan, count]) => (
              <div key={plan} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge className={planColors[plan] || planColors.free}>
                    {plan.charAt(0).toUpperCase() + plan.slice(1)}
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-medium">{count}</span>
                  <span className="text-muted-foreground text-sm">
                    ({stats.total > 0 ? Math.round((count / stats.total) * 100) : 0}%)
                  </span>
                </div>
              </div>
            ))}
          </div>

          {Object.keys(planDistribution).length === 0 && (
            <p className="text-muted-foreground text-sm">Nenhum usuário cadastrado</p>
          )}
        </CardContent>
      </Card>

      {/* Online Status */}
      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Users className="w-5 h-5" />
            Status dos Usuários
          </CardTitle>
          <CardDescription>
            Visão geral do status de todos os usuários
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-success/10 rounded-lg">
              <p className="text-3xl font-bold text-success">
                {onlineUsers.length}
              </p>
              <p className="text-sm text-muted-foreground">Online Agora</p>
            </div>
            <div className="text-center p-4 bg-muted rounded-lg">
              <p className="text-3xl font-bold">
                {users.filter(u => !u.is_online && !u.is_suspended).length}
              </p>
              <p className="text-sm text-muted-foreground">Offline</p>
            </div>
            <div className="text-center p-4 bg-destructive/10 rounded-lg">
              <p className="text-3xl font-bold text-destructive">
                {users.filter(u => u.is_suspended).length}
              </p>
              <p className="text-sm text-muted-foreground">Suspensos</p>
            </div>
            <div className="text-center p-4 bg-primary/10 rounded-lg">
              <p className="text-3xl font-bold text-primary">{stats.total}</p>
              <p className="text-sm text-muted-foreground">Total</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
