import { useAuth } from "@/contexts/AuthContext";
import { useReferrals } from "@/hooks/useReferrals";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Copy, Users, DollarSign, Clock, CheckCircle, TrendingUp, Gift } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";

const IndicadorPage = () => {
  const { user } = useAuth();
  const { 
    referrals, 
    commissions, 
    stats,
    settings,
    getReferralLink,
    getReferralCode,
    isLoading 
  } = useReferrals();

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const referralCode = getReferralCode();
  const referralLink = getReferralLink();

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copiado!`);
  };

  const formatPrice = (cents: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(cents / 100);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="secondary">Pendente</Badge>;
      case "active":
        return <Badge className="bg-green-500">Ativo</Badge>;
      case "paid":
        return <Badge className="bg-blue-500">Pago</Badge>;
      case "cancelled":
        return <Badge variant="destructive">Cancelado</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  // Pagination for commissions
  const paginatedCommissions = commissions.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );
  const totalPages = Math.ceil(commissions.length / itemsPerPage);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Gift className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold">Painel do Indicador</h1>
          <p className="text-muted-foreground">
            Gerencie suas indicações e acompanhe suas comissões
          </p>
        </div>
      </div>

      {/* Referral Link Section */}
      <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-transparent">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Seu Link de Indicação
          </CardTitle>
          <CardDescription>
            Compartilhe este link para ganhar comissões por cada indicação
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              value={referralLink}
              readOnly
              className="bg-background"
            />
            <Button onClick={() => copyToClipboard(referralLink, "Link")}>
              <Copy className="h-4 w-4 mr-2" />
              Copiar
            </Button>
          </div>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span>Código: <strong className="text-foreground">{referralCode}</strong></span>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => copyToClipboard(referralCode, "Código")}
            >
              <Copy className="h-3 w-3" />
            </Button>
          </div>
          {settings && (
            <p className="text-sm text-muted-foreground">
              Comissão: <strong className="text-primary">{settings.default_commission_percent}%</strong> por indicação
            </p>
          )}
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Indicados</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalReferred}</div>
            <p className="text-xs text-muted-foreground">
              {stats.activeReferred} ativos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Ganho</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatPrice(stats.totalEarned)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pendente</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {formatPrice(stats.pendingCommission)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pago</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {formatPrice(stats.paidCommission)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Referrals Table */}
      <Card>
        <CardHeader>
          <CardTitle>Minhas Indicações</CardTitle>
          <CardDescription>
            Lista de usuários que você indicou para a plataforma
          </CardDescription>
        </CardHeader>
        <CardContent>
          {referrals.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Você ainda não possui indicações</p>
              <p className="text-sm mt-2">Compartilhe seu link para começar a ganhar!</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Usuário</TableHead>
                  <TableHead>Plano</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Data</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {referrals.map((referral) => (
                  <TableRow key={referral.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{referral.referred_profile?.full_name || "Usuário"}</p>
                        <p className="text-sm text-muted-foreground">{referral.referred_profile?.email}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">
                        {referral.referred_profile?.current_plan || "free"}
                      </Badge>
                    </TableCell>
                    <TableCell>{getStatusBadge(referral.status)}</TableCell>
                    <TableCell>{formatDate(referral.created_at)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Commissions Table */}
      <Card>
        <CardHeader>
          <CardTitle>Histórico de Comissões</CardTitle>
          <CardDescription>
            Todas as comissões geradas pelas suas indicações
          </CardDescription>
        </CardHeader>
        <CardContent>
          {commissions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <DollarSign className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhuma comissão registrada</p>
              <p className="text-sm mt-2">Suas comissões aparecerão aqui quando seus indicados fizerem compras</p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Indicado</TableHead>
                    <TableHead>Valor da Compra</TableHead>
                    <TableHead>Comissão</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Data</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedCommissions.map((commission) => (
                    <TableRow key={commission.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{commission.referred_profile?.full_name || "Usuário"}</p>
                          <p className="text-sm text-muted-foreground">{commission.referred_profile?.email}</p>
                        </div>
                      </TableCell>
                      <TableCell>{formatPrice(commission.amount_cents)}</TableCell>
                      <TableCell className="font-medium text-green-600">
                        {formatPrice(commission.commission_cents)}
                        <span className="text-xs text-muted-foreground ml-1">
                          ({commission.commission_percent}%)
                        </span>
                      </TableCell>
                      <TableCell>{getStatusBadge(commission.status)}</TableCell>
                      <TableCell>{formatDate(commission.created_at)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <p className="text-sm text-muted-foreground">
                    Página {currentPage} de {totalPages}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                    >
                      Anterior
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                    >
                      Próximo
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default IndicadorPage;
