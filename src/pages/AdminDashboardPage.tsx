import { useMemo } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { getUsers, isUserOnline } from "@/lib/userStore";

const parsePaymentAmount = (amount: string) => {
  const normalized = amount.replace(/[^\d,]/g, "").replace(",", ".");
  const value = Number.parseFloat(normalized);
  return Number.isNaN(value) ? 0 : value;
};

const AdminDashboardPage = () => {
  const { toast } = useToast();
  const users = getUsers();

  const stats = useMemo(() => {
    const totalUsers = users.length;
    const activeUsers = users.filter((user) => user.status === "active").length;
    const suspendedUsers = users.filter((user) => user.status === "suspended").length;
    const onlineUsers = users.filter((user) => isUserOnline(user)).length;
    const offlineUsers = totalUsers - onlineUsers;
    const subscribedUsers = users.filter((user) => user.billingStatus === "active" && user.plan !== "free");
    const checkoutUsers = users.filter((user) => user.billingStatus === "checkout");
    const revenue = users
      .flatMap((user) => user.payments)
      .reduce((sum, payment) => sum + parsePaymentAmount(payment.amount), 0);

    const planCounts = users.reduce(
      (acc, user) => ({ ...acc, [user.plan]: (acc[user.plan] ?? 0) + 1 }),
      {} as Record<string, number>
    );

    return {
      totalUsers,
      activeUsers,
      suspendedUsers,
      onlineUsers,
      offlineUsers,
      subscribedUsers,
      checkoutUsers,
      revenue,
      planCounts,
    };
  }, [users]);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold">Dashboard Admin</h1>
            <p className="text-muted-foreground">
              Visão geral do banco de dados de usuários e planos ativos.
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() =>
                toast({
                  title: "Exportação iniciada",
                  description: "Você receberá o CSV completo por email.",
                })
              }
            >
              Exportar CSV
            </Button>
            <Button
              variant="gradient"
              onClick={() =>
                toast({
                  title: "Dados atualizados",
                  description: "Os dados da base foram sincronizados.",
                })
              }
            >
              Atualizar dados
            </Button>
          </div>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="glass-card">
            <CardContent className="p-6">
              <p className="text-sm text-muted-foreground">Total de usuários</p>
              <p className="text-2xl font-bold">{stats.totalUsers}</p>
            </CardContent>
          </Card>
          <Card className="glass-card">
            <CardContent className="p-6">
              <p className="text-sm text-muted-foreground">Usuários ativos</p>
              <p className="text-2xl font-bold">{stats.activeUsers}</p>
            </CardContent>
          </Card>
          <Card className="glass-card">
            <CardContent className="p-6">
              <p className="text-sm text-muted-foreground">Usuários suspensos</p>
              <p className="text-2xl font-bold">{stats.suspendedUsers}</p>
            </CardContent>
          </Card>
          <Card className="glass-card">
            <CardContent className="p-6">
              <p className="text-sm text-muted-foreground">Receita acumulada</p>
              <p className="text-2xl font-bold">R$ {stats.revenue.toFixed(2)}</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="glass-card">
            <CardContent className="p-6">
              <p className="text-sm text-muted-foreground">Usuários online</p>
              <p className="text-2xl font-bold">{stats.onlineUsers}</p>
            </CardContent>
          </Card>
          <Card className="glass-card">
            <CardContent className="p-6">
              <p className="text-sm text-muted-foreground">Usuários offline</p>
              <p className="text-2xl font-bold">{stats.offlineUsers}</p>
            </CardContent>
          </Card>
          <Card className="glass-card">
            <CardContent className="p-6">
              <p className="text-sm text-muted-foreground">Assinando</p>
              <p className="text-2xl font-bold">{stats.subscribedUsers.length}</p>
            </CardContent>
          </Card>
          <Card className="glass-card">
            <CardContent className="p-6">
              <p className="text-sm text-muted-foreground">Em checkout</p>
              <p className="text-2xl font-bold">{stats.checkoutUsers.length}</p>
            </CardContent>
          </Card>
        </div>

        <Card className="glass-card">
          <CardHeader>
            <CardTitle>Distribuição de planos</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {Object.entries(stats.planCounts).map(([plan, count]) => (
              <Badge key={plan} variant="secondary" className="text-foreground">
                {plan.toUpperCase()} • {count}
              </Badge>
            ))}
          </CardContent>
        </Card>

        <div className="grid lg:grid-cols-2 gap-6">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle>Usuários assinando</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {stats.subscribedUsers.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhum usuário assinando no momento.</p>
              ) : (
                stats.subscribedUsers.map((user) => (
                  <div key={user.id} className="flex items-center justify-between text-sm">
                    <div>
                      <p className="font-medium">{user.name}</p>
                      <p className="text-xs text-muted-foreground">{user.email}</p>
                    </div>
                    <Badge variant="secondary">{user.plan.toUpperCase()}</Badge>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardHeader>
              <CardTitle>Usuários no checkout</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {stats.checkoutUsers.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhum usuário em checkout.</p>
              ) : (
                stats.checkoutUsers.map((user) => (
                  <div key={user.id} className="flex items-center justify-between text-sm">
                    <div>
                      <p className="font-medium">{user.name}</p>
                      <p className="text-xs text-muted-foreground">{user.email}</p>
                    </div>
                    <Badge variant="outline">Checkout</Badge>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        <Card className="glass-card">
          <CardHeader>
            <CardTitle>Últimos acessos de usuários</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Usuário</TableHead>
                  <TableHead>Plano</TableHead>
                  <TableHead>Billing</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Último login</TableHead>
                  <TableHead>Envios</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{user.name}</p>
                        <p className="text-xs text-muted-foreground">{user.email}</p>
                      </div>
                    </TableCell>
                    <TableCell className="uppercase">{user.plan}</TableCell>
                    <TableCell>
                      <Badge variant={user.billingStatus === "checkout" ? "outline" : "secondary"}>
                        {user.billingStatus === "checkout" ? "Checkout" : "Ativo"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={user.status === "active" ? "secondary" : "outline"}>
                        {user.status === "active" ? "Ativo" : "Suspenso"}
                      </Badge>
                    </TableCell>
                    <TableCell>{new Date(user.lastLogin).toLocaleString("pt-BR")}</TableCell>
                    <TableCell>
                      {user.usage.sent}/{user.usage.limit}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default AdminDashboardPage;
