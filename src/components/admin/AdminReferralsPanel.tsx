import { useState } from "react";
import {
  Users,
  DollarSign,
  Percent,
  Settings,
  Plus,
  Trash2,
  CheckCircle,
  AlertCircle,
  Gift,
  Clock,
  History,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useReferrals } from "@/hooks/useReferrals";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

const ITEMS_PER_PAGE = 10;

const AVAILABLE_ROLES = ["admin", "user", "vendor", "moderator"];

const AdminReferralsPanel = () => {
  const {
    settings,
    referrals,
    commissions,
    allowedRoles,
    roleCommissions,
    isLoading,
    updateSettings,
    addAllowedRole,
    removeAllowedRole,
    setRoleCommission,
    markCommissionAsPaid,
  } = useReferrals();

  const [commissionPage, setCommissionPage] = useState(1);
  const [selectedRole, setSelectedRole] = useState("");
  const [roleCommissionPercent, setRoleCommissionPercent] = useState("");
  const [roleDialogOpen, setRoleDialogOpen] = useState(false);
  const [commissionDialogOpen, setCommissionDialogOpen] = useState(false);

  const formatPrice = (cents: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(cents / 100);
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), "dd/MM/yyyy HH:mm", { locale: ptBR });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "paid":
        return <Badge className="bg-success/15 text-success border-success/30">Paga</Badge>;
      case "pending":
        return <Badge variant="outline" className="border-warning text-warning">Pendente</Badge>;
      case "cancelled":
        return <Badge variant="outline" className="border-destructive text-destructive">Cancelada</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const handleAddRole = async () => {
    if (selectedRole) {
      await addAllowedRole(selectedRole);
      setSelectedRole("");
      setRoleDialogOpen(false);
    }
  };

  const handleSetRoleCommission = async () => {
    if (selectedRole && roleCommissionPercent) {
      await setRoleCommission(selectedRole, parseFloat(roleCommissionPercent));
      setSelectedRole("");
      setRoleCommissionPercent("");
      setCommissionDialogOpen(false);
    }
  };

  // Stats
  const totalCommissions = commissions.reduce((sum, c) => sum + c.commission_cents, 0);
  const pendingCommissions = commissions
    .filter((c) => c.status === "pending")
    .reduce((sum, c) => sum + c.commission_cents, 0);
  const paidCommissions = commissions
    .filter((c) => c.status === "paid")
    .reduce((sum, c) => sum + c.commission_cents, 0);

  // Pagination
  const paginatedCommissions = commissions.slice(
    (commissionPage - 1) * ITEMS_PER_PAGE,
    commissionPage * ITEMS_PER_PAGE
  );
  const totalPages = Math.ceil(commissions.length / ITEMS_PER_PAGE);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Toggle */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Gift className="w-5 h-5 text-primary" />
            Indique & Ganhe
          </h2>
          <p className="text-sm text-muted-foreground">
            Gerencie o programa de indicações
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground">
            {settings?.is_enabled ? "Ativado" : "Desativado"}
          </span>
          <Switch
            checked={settings?.is_enabled || false}
            onCheckedChange={(checked) => updateSettings({ is_enabled: checked })}
          />
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-500/15 flex items-center justify-center">
                <Users className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{referrals.length}</p>
                <p className="text-xs text-muted-foreground">Total Indicações</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/15 flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{formatPrice(totalCommissions)}</p>
                <p className="text-xs text-muted-foreground">Total Comissões</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-warning/15 flex items-center justify-center">
                <Clock className="w-5 h-5 text-warning" />
              </div>
              <div>
                <p className="text-2xl font-bold">{formatPrice(pendingCommissions)}</p>
                <p className="text-xs text-muted-foreground">Pendentes</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-success/15 flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-success" />
              </div>
              <div>
                <p className="text-2xl font-bold">{formatPrice(paidCommissions)}</p>
                <p className="text-xs text-muted-foreground">Pagas</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="settings" className="space-y-4">
        <TabsList>
          <TabsTrigger value="settings">
            <Settings className="w-4 h-4 mr-2" />
            Configurações
          </TabsTrigger>
          <TabsTrigger value="commissions">
            <DollarSign className="w-4 h-4 mr-2" />
            Comissões
          </TabsTrigger>
          <TabsTrigger value="referrals">
            <Users className="w-4 h-4 mr-2" />
            Indicações
          </TabsTrigger>
        </TabsList>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Global Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Configurações Globais</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Comissão Padrão (%)</Label>
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      value={settings?.default_commission_percent || 20}
                      onChange={(e) =>
                        updateSettings({
                          default_commission_percent: parseFloat(e.target.value) || 20,
                        })
                      }
                      className="w-24"
                    />
                    <span className="flex items-center text-muted-foreground">%</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Tipo de Comissão</Label>
                  <Select
                    value={settings?.commission_type || "first_only"}
                    onValueChange={(value) =>
                      updateSettings({ commission_type: value as "first_only" | "recurring" })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="first_only">Apenas primeira compra</SelectItem>
                      <SelectItem value="recurring">Recorrente</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    {settings?.commission_type === "recurring"
                      ? "Comissão gerada em todas as compras do indicado"
                      : "Comissão gerada apenas na primeira compra"}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Duração do Cookie (dias)</Label>
                  <Input
                    type="number"
                    value={settings?.cookie_duration_days || 30}
                    onChange={(e) =>
                      updateSettings({
                        cookie_duration_days: parseInt(e.target.value) || 30,
                      })
                    }
                    className="w-24"
                  />
                  <p className="text-xs text-muted-foreground">
                    Tempo que a indicação fica vinculada ao usuário
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Allowed Roles */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-lg">Cargos Autorizados</CardTitle>
                  <CardDescription>
                    Cargos que podem acessar o sistema de indicação
                  </CardDescription>
                </div>
                <Dialog open={roleDialogOpen} onOpenChange={setRoleDialogOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm">
                      <Plus className="w-4 h-4 mr-1" />
                      Adicionar
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Adicionar Cargo</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label>Cargo</Label>
                        <Select value={selectedRole} onValueChange={setSelectedRole}>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione um cargo" />
                          </SelectTrigger>
                          <SelectContent>
                            {AVAILABLE_ROLES.filter(
                              (r) => !allowedRoles.some((ar) => ar.role_name === r)
                            ).map((role) => (
                              <SelectItem key={role} value={role}>
                                {role.charAt(0).toUpperCase() + role.slice(1)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setRoleDialogOpen(false)}>
                        Cancelar
                      </Button>
                      <Button onClick={handleAddRole} disabled={!selectedRole}>
                        Adicionar
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                {allowedRoles.length === 0 ? (
                  <div className="text-center py-6 text-muted-foreground">
                    <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Nenhum cargo autorizado</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {allowedRoles.map((role) => (
                      <div
                        key={role.id}
                        className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                      >
                        <span className="font-medium">
                          {role.role_name.charAt(0).toUpperCase() + role.role_name.slice(1)}
                        </span>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Remover Cargo</AlertDialogTitle>
                              <AlertDialogDescription>
                                Tem certeza que deseja remover este cargo? Usuários com este cargo
                                perderão acesso ao sistema de indicação.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                onClick={() => removeAllowedRole(role.id)}
                              >
                                Remover
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Role-specific Commissions */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg">Comissões por Cargo</CardTitle>
                <CardDescription>
                  Defina porcentagens diferentes para cada cargo
                </CardDescription>
              </div>
              <Dialog open={commissionDialogOpen} onOpenChange={setCommissionDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Plus className="w-4 h-4 mr-1" />
                    Definir
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Definir Comissão por Cargo</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label>Cargo</Label>
                      <Select value={selectedRole} onValueChange={setSelectedRole}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione um cargo" />
                        </SelectTrigger>
                        <SelectContent>
                          {AVAILABLE_ROLES.map((role) => (
                            <SelectItem key={role} value={role}>
                              {role.charAt(0).toUpperCase() + role.slice(1)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Comissão (%)</Label>
                      <Input
                        type="number"
                        placeholder="Ex: 25"
                        value={roleCommissionPercent}
                        onChange={(e) => setRoleCommissionPercent(e.target.value)}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setCommissionDialogOpen(false)}>
                      Cancelar
                    </Button>
                    <Button
                      onClick={handleSetRoleCommission}
                      disabled={!selectedRole || !roleCommissionPercent}
                    >
                      Salvar
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              {roleCommissions.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground">
                  <Percent className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Usando comissão padrão para todos os cargos</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Cargo</TableHead>
                      <TableHead>Comissão</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {roleCommissions.map((rc) => (
                      <TableRow key={rc.id}>
                        <TableCell className="font-medium">
                          {rc.role_name.charAt(0).toUpperCase() + rc.role_name.slice(1)}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{rc.commission_percent}%</Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Commissions Tab */}
        <TabsContent value="commissions">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Todas as Comissões</CardTitle>
            </CardHeader>
            <CardContent>
              {paginatedCommissions.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <DollarSign className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Nenhuma comissão gerada ainda</p>
                </div>
              ) : (
                <>
                  <ScrollArea className="w-full">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Indicador</TableHead>
                          <TableHead>Indicado</TableHead>
                          <TableHead>Valor Compra</TableHead>
                          <TableHead>Comissão</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Data</TableHead>
                          <TableHead className="w-[100px]">Ações</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {paginatedCommissions.map((commission) => (
                          <TableRow key={commission.id}>
                            <TableCell>
                              <div>
                                <p className="font-medium">
                                  {commission.referrer_profile?.full_name || "—"}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {commission.referrer_profile?.email}
                                </p>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div>
                                <p className="font-medium">
                                  {commission.referred_profile?.full_name || "—"}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {commission.referred_profile?.email}
                                </p>
                              </div>
                            </TableCell>
                            <TableCell>{formatPrice(commission.amount_cents)}</TableCell>
                            <TableCell>
                              <div>
                                <p className="font-semibold text-success">
                                  {formatPrice(commission.commission_cents)}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {commission.commission_percent}%
                                </p>
                              </div>
                            </TableCell>
                            <TableCell>{getStatusBadge(commission.status)}</TableCell>
                            <TableCell className="text-sm">
                              {formatDate(commission.created_at)}
                            </TableCell>
                            <TableCell>
                              {commission.status === "pending" && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-success border-success/30 hover:bg-success/10"
                                  onClick={() => markCommissionAsPaid(commission.id)}
                                >
                                  <CheckCircle className="w-4 h-4 mr-1" />
                                  Pagar
                                </Button>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </ScrollArea>

                  {totalPages > 1 && (
                    <div className="mt-4">
                      <Pagination>
                        <PaginationContent>
                          <PaginationItem>
                            <PaginationPrevious
                              onClick={() => setCommissionPage((p) => Math.max(1, p - 1))}
                              className={commissionPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                            />
                          </PaginationItem>
                          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => i + 1).map((page) => (
                            <PaginationItem key={page}>
                              <PaginationLink
                                onClick={() => setCommissionPage(page)}
                                isActive={page === commissionPage}
                                className="cursor-pointer"
                              >
                                {page}
                              </PaginationLink>
                            </PaginationItem>
                          ))}
                          <PaginationItem>
                            <PaginationNext
                              onClick={() => setCommissionPage((p) => Math.min(totalPages, p + 1))}
                              className={commissionPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                            />
                          </PaginationItem>
                        </PaginationContent>
                      </Pagination>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Referrals Tab */}
        <TabsContent value="referrals">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Todas as Indicações</CardTitle>
            </CardHeader>
            <CardContent>
              {referrals.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Nenhuma indicação registrada</p>
                </div>
              ) : (
                <ScrollArea className="w-full">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Indicador</TableHead>
                        <TableHead>Indicado</TableHead>
                        <TableHead>Plano</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Data</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {referrals.map((referral) => (
                        <TableRow key={referral.id}>
                          <TableCell className="font-medium">
                            {referral.referral_code}
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium">
                                {referral.referred_profile?.full_name || "—"}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {referral.referred_profile?.email}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {referral.referred_profile?.current_plan || "Free"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {getStatusBadge(referral.status)}
                          </TableCell>
                          <TableCell className="text-sm">
                            {formatDate(referral.created_at)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminReferralsPanel;
