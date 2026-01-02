import { useState, useEffect } from "react";
import {
  Users,
  DollarSign,
  Settings,
  CheckCircle,
  Clock,
  ChevronDown,
  ChevronUp,
  UserCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { useReferrals } from "@/hooks/useReferrals";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Indicador {
  user_id: string;
  email: string;
  full_name: string | null;
  commission_percent: number | null;
  referrals_count: number;
  converted_count: number;
  total_commission: number;
  pending_commission: number;
  paid_commission: number;
}

const AdminReferralsPanel = () => {
  const {
    settings,
    commissions,
    isLoading,
    updateSettings,
    markCommissionAsPaid,
  } = useReferrals();

  const [indicadores, setIndicadores] = useState<Indicador[]>([]);
  const [expandedIndicador, setExpandedIndicador] = useState<string | null>(null);
  const [loadingIndicadores, setLoadingIndicadores] = useState(true);

  // Local settings state for manual save
  const [localCommissionPercent, setLocalCommissionPercent] = useState<number>(20);
  const [localCommissionType, setLocalCommissionType] = useState<"first_only" | "recurring">("first_only");
  const [localCookieDuration, setLocalCookieDuration] = useState<number>(30);
  const [localReferralBaseUrl, setLocalReferralBaseUrl] = useState<string>("");
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Sync local state with settings when loaded
  useEffect(() => {
    if (settings) {
      setLocalCommissionPercent(settings.default_commission_percent);
      setLocalCommissionType(settings.commission_type);
      setLocalCookieDuration(settings.cookie_duration_days);
      setLocalReferralBaseUrl(settings.referral_base_url || "");
      setHasUnsavedChanges(false);
    }
  }, [settings?.id]);

  // Fetch indicadores
  useEffect(() => {
    const fetchIndicadores = async () => {
      setLoadingIndicadores(true);
      
      // Get users with indicador role
      const { data: indicadorRoles } = await supabase
        .from("user_roles")
        .select("user_id")
        .eq("role", "indicador");

      if (!indicadorRoles || indicadorRoles.length === 0) {
        setIndicadores([]);
        setLoadingIndicadores(false);
        return;
      }

      const userIds = indicadorRoles.map(r => r.user_id);

      // Get profiles
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, email, full_name")
        .in("user_id", userIds);

      // Get custom commissions
      const { data: customCommissions } = await supabase
        .from("user_referral_commissions")
        .select("user_id, commission_percent")
        .in("user_id", userIds);

      // Get referrals for each indicador
      const { data: referrals } = await supabase
        .from("referrals")
        .select("referrer_id, status")
        .in("referrer_id", userIds);

      // Get commissions for each indicador
      const { data: allCommissions } = await supabase
        .from("commissions")
        .select("referrer_id, commission_cents, status")
        .in("referrer_id", userIds);

      const profileMap = new Map(profiles?.map(p => [p.user_id, p]));
      const commissionMap = new Map(customCommissions?.map(c => [c.user_id, c.commission_percent]));

      const indicadoresList: Indicador[] = userIds.map(userId => {
        const profile = profileMap.get(userId);
        const userReferrals = referrals?.filter(r => r.referrer_id === userId) || [];
        const userCommissions = allCommissions?.filter(c => c.referrer_id === userId) || [];

        return {
          user_id: userId,
          email: profile?.email || "",
          full_name: profile?.full_name || null,
          commission_percent: commissionMap.get(userId) || null,
          referrals_count: userReferrals.length,
          converted_count: userReferrals.filter(r => r.status === "converted").length,
          total_commission: userCommissions.reduce((sum, c) => sum + c.commission_cents, 0),
          pending_commission: userCommissions.filter(c => c.status === "pending").reduce((sum, c) => sum + c.commission_cents, 0),
          paid_commission: userCommissions.filter(c => c.status === "paid").reduce((sum, c) => sum + c.commission_cents, 0),
        };
      });

      setIndicadores(indicadoresList);
      setLoadingIndicadores(false);
    };

    fetchIndicadores();
  }, [commissions]);

  const handleSaveSettings = async () => {
    setIsSaving(true);
    await updateSettings({
      default_commission_percent: localCommissionPercent,
      commission_type: localCommissionType,
      cookie_duration_days: localCookieDuration,
      referral_base_url: localReferralBaseUrl || null,
    });
    setHasUnsavedChanges(false);
    setIsSaving(false);
  };

  const formatPrice = (cents: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(cents / 100);
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), "dd/MM/yyyy HH:mm", { locale: ptBR });
  };

  // Stats
  const totalIndicadores = indicadores.length;
  const totalCommissions = indicadores.reduce((sum, i) => sum + i.total_commission, 0);
  const pendingCommissions = indicadores.reduce((sum, i) => sum + i.pending_commission, 0);
  const paidCommissions = indicadores.reduce((sum, i) => sum + i.paid_commission, 0);

  // Get commissions for a specific indicador
  const getIndicadorCommissions = (userId: string) => {
    return commissions.filter(c => c.referrer_id === userId);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-pulse text-muted-foreground">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <UserCheck className="w-5 h-5 text-primary" />
          Sistema de Indicadores
        </h2>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Ativo</span>
          <Switch
            checked={settings?.is_enabled}
            onCheckedChange={(checked) => updateSettings({ is_enabled: checked })}
          />
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/15 flex items-center justify-center">
                <Users className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalIndicadores}</p>
                <p className="text-xs text-muted-foreground">Indicadores</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-500/15 flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-blue-500" />
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

      {/* Tabs */}
      <Tabs defaultValue="indicadores" className="space-y-4">
        <TabsList>
          <TabsTrigger value="indicadores">
            <Users className="w-4 h-4 mr-2" />
            Indicadores
          </TabsTrigger>
          <TabsTrigger value="settings">
            <Settings className="w-4 h-4 mr-2" />
            Configurações
          </TabsTrigger>
        </TabsList>

        {/* Indicadores Tab */}
        <TabsContent value="indicadores" className="space-y-4">
          {loadingIndicadores ? (
            <div className="text-center py-12 text-muted-foreground">
              Carregando indicadores...
            </div>
          ) : indicadores.length === 0 ? (
            <Card>
              <CardContent className="py-12">
                <div className="text-center text-muted-foreground">
                  <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Nenhum indicador cadastrado</p>
                  <p className="text-sm">Atribua o cargo "Indicador" a usuários no painel de usuários</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {indicadores.map((indicador) => (
                <Collapsible
                  key={indicador.user_id}
                  open={expandedIndicador === indicador.user_id}
                  onOpenChange={(open) => setExpandedIndicador(open ? indicador.user_id : null)}
                >
                  <Card>
                    <CollapsibleTrigger asChild>
                      <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full bg-primary/15 flex items-center justify-center">
                              <Users className="w-5 h-5 text-primary" />
                            </div>
                            <div>
                              <CardTitle className="text-base">
                                {indicador.full_name || indicador.email}
                              </CardTitle>
                              <p className="text-sm text-muted-foreground">{indicador.email}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-6">
                            <div className="text-right">
                              <p className="text-sm font-medium">
                                Comissão: {indicador.commission_percent || settings?.default_commission_percent || 20}%
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {indicador.referrals_count} indicados • {indicador.converted_count} convertidos
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-lg font-bold text-success">
                                {formatPrice(indicador.total_commission)}
                              </p>
                              {indicador.pending_commission > 0 && (
                                <Badge variant="outline" className="text-warning border-warning text-xs">
                                  {formatPrice(indicador.pending_commission)} pendente
                                </Badge>
                              )}
                            </div>
                            {expandedIndicador === indicador.user_id ? (
                              <ChevronUp className="w-5 h-5 text-muted-foreground" />
                            ) : (
                              <ChevronDown className="w-5 h-5 text-muted-foreground" />
                            )}
                          </div>
                        </div>
                      </CardHeader>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <CardContent className="pt-0">
                        <div className="border-t pt-4">
                          <h4 className="font-medium mb-3">Histórico de Comissões</h4>
                          {getIndicadorCommissions(indicador.user_id).length === 0 ? (
                            <p className="text-sm text-muted-foreground text-center py-4">
                              Nenhuma comissão gerada ainda
                            </p>
                          ) : (
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>Indicado</TableHead>
                                  <TableHead>Valor da Compra</TableHead>
                                  <TableHead>Comissão</TableHead>
                                  <TableHead>Status</TableHead>
                                  <TableHead>Data</TableHead>
                                  <TableHead></TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {getIndicadorCommissions(indicador.user_id).map((commission) => (
                                  <TableRow key={commission.id}>
                                    <TableCell>
                                      {commission.referred_profile?.full_name || commission.referred_profile?.email || "—"}
                                    </TableCell>
                                    <TableCell>{formatPrice(commission.amount_cents)}</TableCell>
                                    <TableCell className="font-semibold text-success">
                                      {formatPrice(commission.commission_cents)} ({commission.commission_percent}%)
                                    </TableCell>
                                    <TableCell>
                                      {commission.status === "paid" ? (
                                        <Badge className="bg-success/15 text-success border-success/30">Paga</Badge>
                                      ) : (
                                        <Badge variant="outline" className="border-warning text-warning">Pendente</Badge>
                                      )}
                                    </TableCell>
                                    <TableCell className="text-sm text-muted-foreground">
                                      {formatDate(commission.created_at)}
                                    </TableCell>
                                    <TableCell>
                                      {commission.status === "pending" && (
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          onClick={() => markCommissionAsPaid(commission.id)}
                                        >
                                          <CheckCircle className="w-4 h-4 mr-1" />
                                          Marcar Paga
                                        </Button>
                                      )}
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          )}
                        </div>
                      </CardContent>
                    </CollapsibleContent>
                  </Card>
                </Collapsible>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Configurações Globais</CardTitle>
              {hasUnsavedChanges && (
                <Badge variant="outline" className="border-warning text-warning">
                  Não salvo
                </Badge>
              )}
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Comissão Padrão (%)</Label>
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      value={localCommissionPercent}
                      onChange={(e) => {
                        setLocalCommissionPercent(parseFloat(e.target.value) || 20);
                        setHasUnsavedChanges(true);
                      }}
                      className="w-24"
                    />
                    <span className="flex items-center text-muted-foreground">%</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Usado quando o indicador não tem comissão personalizada
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Tipo de Comissão</Label>
                  <Select
                    value={localCommissionType}
                    onValueChange={(value) => {
                      setLocalCommissionType(value as "first_only" | "recurring");
                      setHasUnsavedChanges(true);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="first_only">Apenas primeira compra</SelectItem>
                      <SelectItem value="recurring">Recorrente</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Duração do Cookie (dias)</Label>
                  <Input
                    type="number"
                    value={localCookieDuration}
                    onChange={(e) => {
                      setLocalCookieDuration(parseInt(e.target.value) || 30);
                      setHasUnsavedChanges(true);
                    }}
                    className="w-24"
                  />
                  <p className="text-xs text-muted-foreground">
                    Tempo que a indicação fica vinculada
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>URL Base para Links</Label>
                  <Input
                    type="url"
                    placeholder="https://nexo.com.br/r"
                    value={localReferralBaseUrl}
                    onChange={(e) => {
                      setLocalReferralBaseUrl(e.target.value);
                      setHasUnsavedChanges(true);
                    }}
                  />
                  <p className="text-xs text-muted-foreground">
                    Deixe vazio para usar o domínio atual
                  </p>
                </div>
              </div>

              <Button 
                onClick={handleSaveSettings} 
                disabled={!hasUnsavedChanges || isSaving}
                className="w-full"
              >
                {isSaving ? "Salvando..." : "Salvar Configurações"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminReferralsPanel;