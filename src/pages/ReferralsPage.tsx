import { useState } from "react";
import { motion } from "framer-motion";
import {
  Users,
  UserCheck,
  DollarSign,
  Clock,
  CheckCircle,
  Copy,
  ExternalLink,
  Share2,
  Gift,
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
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useReferrals } from "@/hooks/useReferrals";
import { useToast } from "@/hooks/use-toast";
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

const ReferralsPage = () => {
  const { toast } = useToast();
  const {
    settings,
    referrals,
    commissions,
    stats,
    isLoading,
    canAccessReferrals,
    getReferralCode,
    getReferralLink,
  } = useReferrals();

  const [referralPage, setReferralPage] = useState(1);
  const [commissionPage, setCommissionPage] = useState(1);

  const formatPrice = (cents: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(cents / 100);
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), "dd/MM/yyyy", { locale: ptBR });
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Link copiado!" });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "converted":
        return <Badge className="bg-success/15 text-success border-success/30">Convertido</Badge>;
      case "active":
        return <Badge className="bg-success/15 text-success border-success/30">Ativo</Badge>;
      case "pending":
        return <Badge variant="outline" className="border-warning text-warning">Aguardando Pagamento</Badge>;
      case "cancelled":
        return <Badge variant="outline" className="border-destructive text-destructive">Cancelado</Badge>;
      case "paid":
        return <Badge className="bg-success/15 text-success border-success/30">Paga</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getPlanBadge = (plan: string | null) => {
    if (!plan) return <Badge variant="outline">Free</Badge>;
    
    const colors: Record<string, string> = {
      free: "bg-muted text-muted-foreground",
      basic: "bg-blue-500/15 text-blue-500",
      pro: "bg-purple-500/15 text-purple-500",
      agency: "bg-amber-500/15 text-amber-500",
    };

    return (
      <Badge className={colors[plan] || "bg-muted text-muted-foreground"}>
        {plan.charAt(0).toUpperCase() + plan.slice(1)}
      </Badge>
    );
  };

  // Pagination
  const paginatedReferrals = referrals.slice(
    (referralPage - 1) * ITEMS_PER_PAGE,
    referralPage * ITEMS_PER_PAGE
  );
  const totalReferralPages = Math.ceil(referrals.length / ITEMS_PER_PAGE);

  const paginatedCommissions = commissions.slice(
    (commissionPage - 1) * ITEMS_PER_PAGE,
    commissionPage * ITEMS_PER_PAGE
  );
  const totalCommissionPages = Math.ceil(commissions.length / ITEMS_PER_PAGE);

  if (!settings?.is_enabled) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
          <Gift className="w-16 h-16 text-muted-foreground mb-4" />
          <h2 className="text-2xl font-semibold mb-2">Sistema de Indicação Desativado</h2>
          <p className="text-muted-foreground">
            O programa de indicações está temporariamente desativado.
          </p>
        </div>
      </DashboardLayout>
    );
  }

  if (!canAccessReferrals) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
          <Users className="w-16 h-16 text-muted-foreground mb-4" />
          <h2 className="text-2xl font-semibold mb-2">Acesso Restrito</h2>
          <p className="text-muted-foreground">
            Você não possui permissão para acessar o programa de indicações.
          </p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="space-y-6"
      >
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Gift className="w-6 h-6 text-primary" />
              Indique & Ganhe
            </h1>
            <p className="text-muted-foreground">
              Ganhe {settings?.default_commission_percent}% de comissão por cada indicação
            </p>
          </div>
        </div>

        {/* Referral Link Card */}
        <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-transparent">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Share2 className="w-5 h-5" />
              Seu Link de Indicação
            </CardTitle>
            <CardDescription>
              Compartilhe este link e ganhe comissões a cada indicação que realizar uma compra
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1 relative">
                <Input
                  value={getReferralLink()}
                  readOnly
                  className="pr-24 font-mono text-sm bg-background"
                />
                <div className="absolute right-1 top-1/2 -translate-y-1/2 flex gap-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => copyToClipboard(getReferralLink())}
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => window.open(getReferralLink(), "_blank")}
                  >
                    <ExternalLink className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              <div className="flex items-center gap-2 px-3 py-2 bg-muted rounded-md">
                <span className="text-sm text-muted-foreground">Código:</span>
                <code className="font-mono font-bold text-primary">{getReferralCode()}</code>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats Cards */}
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-5">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-500/15 flex items-center justify-center">
                  <Users className="w-5 h-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.totalReferred}</p>
                  <p className="text-xs text-muted-foreground">Total Indicados</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-success/15 flex items-center justify-center">
                  <UserCheck className="w-5 h-5 text-success" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.activeReferred}</p>
                  <p className="text-xs text-muted-foreground">Indicados Ativos</p>
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
                  <p className="text-2xl font-bold">{formatPrice(stats.totalEarned)}</p>
                  <p className="text-xs text-muted-foreground">Total Ganho</p>
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
                  <p className="text-2xl font-bold">{formatPrice(stats.pendingCommission)}</p>
                  <p className="text-xs text-muted-foreground">Pendente</p>
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
                  <p className="text-2xl font-bold">{formatPrice(stats.paidCommission)}</p>
                  <p className="text-xs text-muted-foreground">Pago</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="referrals" className="space-y-4">
          <TabsList>
            <TabsTrigger value="referrals">Indicados</TabsTrigger>
            <TabsTrigger value="commissions">Comissões</TabsTrigger>
          </TabsList>

          <TabsContent value="referrals">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Seus Indicados</CardTitle>
              </CardHeader>
              <CardContent>
                {paginatedReferrals.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>Você ainda não possui indicados</p>
                    <p className="text-sm">Compartilhe seu link para começar a ganhar</p>
                  </div>
                ) : (
                  <>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Nome</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Plano Atual</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Comissão Estimada</TableHead>
                          <TableHead>Data Cadastro</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {paginatedReferrals.map((referral) => {
                          const plan = referral.referred_profile?.current_plan || "free";
                          const planPrices: Record<string, number> = {
                            free: 0,
                            basic: 4990,
                            pro: 7990,
                            agency: 14990,
                          };
                          const estimatedCommission = planPrices[plan] 
                            ? Math.round((planPrices[plan] * (settings?.default_commission_percent || 20)) / 100)
                            : 0;

                          return (
                            <TableRow key={referral.id}>
                              <TableCell className="font-medium">
                                {referral.referred_profile?.full_name || "—"}
                              </TableCell>
                              <TableCell>{referral.referred_profile?.email || "—"}</TableCell>
                              <TableCell>
                                {getPlanBadge(plan)}
                              </TableCell>
                              <TableCell>{getStatusBadge(referral.status)}</TableCell>
                              <TableCell>
                                {referral.status === "converted" && plan !== "free" ? (
                                  <span className="text-success font-semibold">
                                    {formatPrice(estimatedCommission)}
                                  </span>
                                ) : plan === "free" ? (
                                  <span className="text-muted-foreground">Aguardando assinatura</span>
                                ) : (
                                  <span className="text-muted-foreground">—</span>
                                )}
                              </TableCell>
                              <TableCell>{formatDate(referral.created_at)}</TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>

                    {totalReferralPages > 1 && (
                      <div className="mt-4">
                        <Pagination>
                          <PaginationContent>
                            <PaginationItem>
                              <PaginationPrevious
                                onClick={() => setReferralPage((p) => Math.max(1, p - 1))}
                                className={referralPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                              />
                            </PaginationItem>
                            {Array.from({ length: totalReferralPages }, (_, i) => i + 1).map((page) => (
                              <PaginationItem key={page}>
                                <PaginationLink
                                  onClick={() => setReferralPage(page)}
                                  isActive={page === referralPage}
                                  className="cursor-pointer"
                                >
                                  {page}
                                </PaginationLink>
                              </PaginationItem>
                            ))}
                            <PaginationItem>
                              <PaginationNext
                                onClick={() => setReferralPage((p) => Math.min(totalReferralPages, p + 1))}
                                className={referralPage === totalReferralPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
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

          <TabsContent value="commissions">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Histórico de Comissões</CardTitle>
              </CardHeader>
              <CardContent>
                {paginatedCommissions.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <DollarSign className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>Nenhuma comissão gerada ainda</p>
                    <p className="text-sm">Comissões são geradas quando seus indicados realizam compras</p>
                  </div>
                ) : (
                  <>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Indicado</TableHead>
                          <TableHead>Valor Compra</TableHead>
                          <TableHead>Comissão (%)</TableHead>
                          <TableHead>Comissão (R$)</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Data</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {paginatedCommissions.map((commission) => (
                          <TableRow key={commission.id}>
                            <TableCell className="font-medium">
                              {commission.referred_profile?.full_name || commission.referred_profile?.email || "—"}
                            </TableCell>
                            <TableCell>{formatPrice(commission.amount_cents)}</TableCell>
                            <TableCell>{commission.commission_percent}%</TableCell>
                            <TableCell className="font-semibold text-success">
                              {formatPrice(commission.commission_cents)}
                            </TableCell>
                            <TableCell>{getStatusBadge(commission.status)}</TableCell>
                            <TableCell>{formatDate(commission.created_at)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>

                    {totalCommissionPages > 1 && (
                      <div className="mt-4">
                        <Pagination>
                          <PaginationContent>
                            <PaginationItem>
                              <PaginationPrevious
                                onClick={() => setCommissionPage((p) => Math.max(1, p - 1))}
                                className={commissionPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                              />
                            </PaginationItem>
                            {Array.from({ length: totalCommissionPages }, (_, i) => i + 1).map((page) => (
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
                                onClick={() => setCommissionPage((p) => Math.min(totalCommissionPages, p + 1))}
                                className={commissionPage === totalCommissionPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
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
        </Tabs>
      </motion.div>
    </DashboardLayout>
  );
};

export default ReferralsPage;
