import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  User, 
  Mail, 
  Phone, 
  Crown, 
  Calendar,
  Ban,
  CheckCircle,
  Key,
  Edit,
  Gift,
  TrendingUp,
  MessageCircle,
  GitBranch,
  DollarSign,
  Loader2
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

interface SellerDetailsDialogProps {
  sellerId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate: () => void;
}

interface SellerDetails {
  profile: {
    user_id: string;
    email: string;
    full_name: string | null;
    phone: string | null;
    current_plan: string;
    is_suspended: boolean;
    is_online: boolean;
    last_seen_at: string | null;
    created_at: string;
  };
  roles: string[];
  subscription: any;
  stats: {
    funnels: number;
    telegram_integrations: number;
  };
  transactions: any[];
  referralCommission?: number;
}

const planOptions = [
  { value: "free", label: "Free" },
  { value: "basic", label: "Basic" },
  { value: "pro", label: "Pro" },
  { value: "agency", label: "Agency" },
];

export const SellerDetailsDialog = ({ sellerId, open, onOpenChange, onUpdate }: SellerDetailsDialogProps) => {
  const { isAdmin } = useAuth();
  const [details, setDetails] = useState<SellerDetails | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Form states
  const [editingField, setEditingField] = useState<string | null>(null);
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [selectedPlan, setSelectedPlan] = useState("");
  const [indicadorCommission, setIndicadorCommission] = useState("25");

  useEffect(() => {
    if (sellerId && open) {
      fetchSellerDetails();
    }
  }, [sellerId, open]);

  const fetchSellerDetails = async () => {
    if (!sellerId) return;
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("account-manager-action", {
        body: { action: "get_seller_details", targetUserId: sellerId },
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);

      setDetails(data);
      setNewName(data.profile.full_name || "");
      setNewEmail(data.profile.email);
      setNewPhone(data.profile.phone || "");
      setSelectedPlan(data.profile.current_plan);
      setIndicadorCommission(data.referralCommission?.toString() || "25");
    } catch (error: any) {
      console.error("Error fetching seller details:", error);
      toast.error("Erro ao carregar detalhes do seller");
    } finally {
      setIsLoading(false);
    }
  };

  const executeAction = async (action: string, data: any) => {
    if (!sellerId) return;

    setActionLoading(action);
    try {
      const response = await supabase.functions.invoke("account-manager-action", {
        body: { action, targetUserId: sellerId, data },
      });

      if (response.error) throw response.error;
      if (response.data?.error) throw new Error(response.data.error);

      toast.success(response.data?.message || "Ação executada com sucesso");
      fetchSellerDetails();
      onUpdate();
      setEditingField(null);
    } catch (error: any) {
      console.error("Error executing action:", error);
      toast.error(error.message || "Erro ao executar ação");
    } finally {
      setActionLoading(null);
    }
  };

  const handleSuspendToggle = () => {
    if (!details) return;
    executeAction("suspend_user", { suspend: !details.profile.is_suspended });
  };

  const handleChangePlan = () => {
    if (!details || !selectedPlan) return;
    executeAction("change_plan", { plan: selectedPlan, oldPlan: details.profile.current_plan });
  };

  const handleUpdateName = () => {
    executeAction("update_profile", { full_name: newName });
  };

  const handleUpdateEmail = () => {
    if (!details) return;
    executeAction("update_email", { email: newEmail, oldEmail: details.profile.email });
  };

  const handleUpdatePhone = () => {
    executeAction("update_profile", { phone: newPhone });
  };

  const handlePasswordReset = () => {
    executeAction("send_password_reset", {});
  };

  const handleAssignIndicador = () => {
    executeAction("assign_indicador_role", { commission: parseFloat(indicadorCommission) || 25 });
  };

  const handleRemoveIndicador = () => {
    executeAction("remove_indicador_role", {});
  };

  const isIndicador = details?.roles.includes("indicador");

  if (isLoading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Carregando...</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-40 w-full" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            {details?.profile.full_name || "Sem nome"}
            {details?.profile.is_suspended && (
              <Badge variant="destructive">Suspenso</Badge>
            )}
            {details?.profile.is_online && (
              <Badge className="bg-success text-success-foreground">Online</Badge>
            )}
          </DialogTitle>
          <DialogDescription>{details?.profile.email}</DialogDescription>
        </DialogHeader>

        {details && (
          <Tabs defaultValue="info" className="mt-4">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="info">Informações</TabsTrigger>
              <TabsTrigger value="actions">Ações</TabsTrigger>
              <TabsTrigger value="stats">Estatísticas</TabsTrigger>
              <TabsTrigger value="indicador">Indicador</TabsTrigger>
            </TabsList>

            <TabsContent value="info" className="space-y-4 mt-4">
              {/* Basic Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Dados do Seller</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Name */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">Nome:</span>
                      {editingField === "name" ? (
                        <Input
                          value={newName}
                          onChange={(e) => setNewName(e.target.value)}
                          className="h-8 w-48"
                        />
                      ) : (
                        <span className="font-medium">{details.profile.full_name || "Não informado"}</span>
                      )}
                    </div>
                    {editingField === "name" ? (
                      <div className="flex gap-2">
                        <Button size="sm" onClick={handleUpdateName} disabled={actionLoading === "update_profile"}>
                          {actionLoading === "update_profile" ? <Loader2 className="w-4 h-4 animate-spin" /> : "Salvar"}
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => setEditingField(null)}>
                          Cancelar
                        </Button>
                      </div>
                    ) : (
                      <Button size="icon-sm" variant="ghost" onClick={() => setEditingField("name")}>
                        <Edit className="w-4 h-4" />
                      </Button>
                    )}
                  </div>

                  {/* Email */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">Email:</span>
                      {editingField === "email" ? (
                        <Input
                          type="email"
                          value={newEmail}
                          onChange={(e) => setNewEmail(e.target.value)}
                          className="h-8 w-64"
                        />
                      ) : (
                        <span className="font-medium">{details.profile.email}</span>
                      )}
                    </div>
                    {editingField === "email" ? (
                      <div className="flex gap-2">
                        <Button size="sm" onClick={handleUpdateEmail} disabled={actionLoading === "update_email"}>
                          {actionLoading === "update_email" ? <Loader2 className="w-4 h-4 animate-spin" /> : "Salvar"}
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => setEditingField(null)}>
                          Cancelar
                        </Button>
                      </div>
                    ) : (
                      <Button size="icon-sm" variant="ghost" onClick={() => setEditingField("email")}>
                        <Edit className="w-4 h-4" />
                      </Button>
                    )}
                  </div>

                  {/* Phone */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">Telefone:</span>
                      {editingField === "phone" ? (
                        <Input
                          value={newPhone}
                          onChange={(e) => setNewPhone(e.target.value)}
                          className="h-8 w-48"
                        />
                      ) : (
                        <span className="font-medium">{details.profile.phone || "Não informado"}</span>
                      )}
                    </div>
                    {editingField === "phone" ? (
                      <div className="flex gap-2">
                        <Button size="sm" onClick={handleUpdatePhone} disabled={actionLoading === "update_profile"}>
                          {actionLoading === "update_profile" ? <Loader2 className="w-4 h-4 animate-spin" /> : "Salvar"}
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => setEditingField(null)}>
                          Cancelar
                        </Button>
                      </div>
                    ) : (
                      <Button size="icon-sm" variant="ghost" onClick={() => setEditingField("phone")}>
                        <Edit className="w-4 h-4" />
                      </Button>
                    )}
                  </div>

                  {/* Plan */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Crown className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">Plano:</span>
                      <Badge>{details.profile.current_plan}</Badge>
                    </div>
                  </div>

                  {/* Created */}
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Cadastro:</span>
                    <span className="font-medium">
                      {format(new Date(details.profile.created_at), "dd/MM/yyyy", { locale: ptBR })}
                    </span>
                  </div>

                  {/* Last Seen */}
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Último acesso:</span>
                    <span className="font-medium">
                      {details.profile.last_seen_at 
                        ? formatDistanceToNow(new Date(details.profile.last_seen_at), { addSuffix: true, locale: ptBR })
                        : "Nunca"}
                    </span>
                  </div>

                  {/* Roles */}
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Cargos:</span>
                    <div className="flex gap-1">
                      {details.roles.length > 0 ? details.roles.map(role => (
                        <Badge key={role} variant="outline">{role}</Badge>
                      )) : <span className="text-muted-foreground">user</span>}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="actions" className="space-y-4 mt-4">
              {/* Plan Change */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Crown className="w-4 h-4" />
                    Alterar Plano
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4">
                    <Select value={selectedPlan} onValueChange={setSelectedPlan}>
                      <SelectTrigger className="w-40">
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        {planOptions.map(plan => (
                          <SelectItem key={plan.value} value={plan.value}>
                            {plan.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button 
                      onClick={handleChangePlan} 
                      disabled={selectedPlan === details.profile.current_plan || actionLoading === "change_plan"}
                    >
                      {actionLoading === "change_plan" ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                      Alterar Plano
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Suspension */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    {details.profile.is_suspended ? <CheckCircle className="w-4 h-4" /> : <Ban className="w-4 h-4" />}
                    {details.profile.is_suspended ? "Reativar Conta" : "Suspender Conta"}
                  </CardTitle>
                  <CardDescription>
                    {details.profile.is_suspended 
                      ? "O usuário está suspenso e não pode acessar a plataforma."
                      : "Suspender o usuário irá bloquear seu acesso à plataforma."}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button 
                    variant={details.profile.is_suspended ? "default" : "destructive"}
                    onClick={handleSuspendToggle}
                    disabled={actionLoading === "suspend_user"}
                  >
                    {actionLoading === "suspend_user" ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                    {details.profile.is_suspended ? "Reativar Conta" : "Suspender Conta"}
                  </Button>
                </CardContent>
              </Card>

              {/* Password Reset */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Key className="w-4 h-4" />
                    Resetar Senha
                  </CardTitle>
                  <CardDescription>
                    Enviar email de recuperação de senha para o usuário.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button 
                    variant="outline"
                    onClick={handlePasswordReset}
                    disabled={actionLoading === "send_password_reset"}
                  >
                    {actionLoading === "send_password_reset" ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                    Enviar Email de Reset
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="stats" className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-primary/10 rounded-lg">
                        <GitBranch className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold">{details.stats.funnels}</p>
                        <p className="text-sm text-muted-foreground">Funis Criados</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-blue-500/10 rounded-lg">
                        <MessageCircle className="w-6 h-6 text-blue-500" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold">{details.stats.telegram_integrations}</p>
                        <p className="text-sm text-muted-foreground">Bots Telegram</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Recent Transactions */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <DollarSign className="w-4 h-4" />
                    Transações Recentes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {details.transactions.length === 0 ? (
                    <p className="text-muted-foreground text-sm">Nenhuma transação</p>
                  ) : (
                    <div className="space-y-2">
                      {details.transactions.map((tx: any) => (
                        <div key={tx.id} className="flex items-center justify-between py-2 border-b last:border-0">
                          <div>
                            <p className="font-medium text-sm">{tx.description || "Transação"}</p>
                            <p className="text-xs text-muted-foreground">
                              {format(new Date(tx.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-medium">
                              R$ {((tx.amount_cents || 0) / 100).toFixed(2)}
                            </p>
                            <Badge variant={tx.status === "completed" ? "default" : "secondary"}>
                              {tx.status}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="indicador" className="space-y-4 mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Gift className="w-4 h-4" />
                    Cargo Indicador
                  </CardTitle>
                  <CardDescription>
                    Indicadores podem convidar novos usuários e ganhar comissão.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {isIndicador ? (
                    <>
                      <div className="flex items-center gap-2">
                        <Badge className="bg-success/10 text-success">Indicador Ativo</Badge>
                        {details.referralCommission && (
                          <Badge variant="outline">{details.referralCommission}% de comissão</Badge>
                        )}
                      </div>
                      <Button 
                        variant="destructive"
                        onClick={handleRemoveIndicador}
                        disabled={actionLoading === "remove_indicador_role"}
                      >
                        {actionLoading === "remove_indicador_role" ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                        Remover Cargo Indicador
                      </Button>
                    </>
                  ) : (
                    <>
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          <Label>Comissão (%):</Label>
                          <Input
                            type="number"
                            min="1"
                            max="100"
                            value={indicadorCommission}
                            onChange={(e) => setIndicadorCommission(e.target.value)}
                            className="w-20"
                          />
                        </div>
                        <Button 
                          onClick={handleAssignIndicador}
                          disabled={actionLoading === "assign_indicador_role"}
                        >
                          {actionLoading === "assign_indicador_role" ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                          Atribuir Cargo Indicador
                        </Button>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  );
};
