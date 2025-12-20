import { useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { getUsers, updateUser, UserRecord } from "@/lib/userStore";

const AdminUsersPage = () => {
  const { toast } = useToast();
  const [users, setUsers] = useState<UserRecord[]>(getUsers());

  const handleToggleStatus = (user: UserRecord) => {
    const nextStatus = user.status === "active" ? "suspended" : "active";
    const updated = updateUser(user.id, { status: nextStatus });
    if (updated) {
      setUsers(getUsers());
      toast({
        title: "Status atualizado",
        description: `${user.name} agora está ${nextStatus === "active" ? "ativo" : "suspenso"}.`,
      });
    }
  };

  const handleResetPassword = (user: UserRecord) => {
    toast({
      title: "Reset enviado",
      description: `Enviamos um link de redefinição para ${user.email}.`,
    });
  };

  const handleViewDetails = (user: UserRecord) => {
    toast({
      title: "Detalhes do usuário",
      description: `${user.name} • Plano ${user.plan.toUpperCase()} • ${user.company || "Sem empresa"}`,
    });
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Banco de usuários</h1>
          <p className="text-muted-foreground">
            Gerencie dados, planos e permissões dos usuários cadastrados.
          </p>
        </div>

        <Card className="glass-card">
          <CardHeader>
            <CardTitle>Lista completa</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Usuário</TableHead>
                  <TableHead>Empresa</TableHead>
                  <TableHead>Plano</TableHead>
                  <TableHead>Billing</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Ações</TableHead>
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
                    <TableCell>{user.company || "—"}</TableCell>
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
                    <TableCell>
                      <div className="flex flex-wrap gap-2">
                        <Button size="sm" variant="outline" onClick={() => handleViewDetails(user)}>
                          Ver detalhes
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => handleResetPassword(user)}>
                          Reset senha
                        </Button>
                        <Button size="sm" variant="secondary" onClick={() => handleToggleStatus(user)}>
                          {user.status === "active" ? "Suspender" : "Reativar"}
                        </Button>
                      </div>
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

export default AdminUsersPage;
