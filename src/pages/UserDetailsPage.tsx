import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  User,
  Mail,
  Calendar,
  CreditCard,
  Activity,
  Bot,
  ShoppingCart,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Phone,
  Pencil,
  Save,
  X,
  Loader2,
  Ban,
  UserCheck,
  Shield,
  Plus,
  Trash2,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface UserProfile {
  id: string;
  user_id: string;
  email: string;
  full_name: string | null;
  current_plan: string;
  is_online: boolean;
  is_suspended: boolean;
  last_seen_at: string;
  created_at: string;
  phone: string | null;
}

interface Transaction {
  id: string;
  amount_cents: number;
  status: string;
  product_type: string;
  created_at: string;
}

interface TelegramIntegration {
  id: string;
  bot_username: string | null;
  bot_name: string | null;
  is_connected: boolean;
  created_at: string;
}

interface UserActivity {
  id: string;
  action: string;
  created_at: string;
  details: any;
}

interface UserRole {
  id: string;
  role: string;
}

const AVAILABLE_ROLES = [
  { value: "admin", label: "Admin" },
  { value: "user", label: "Usuário" },
  { value: "vendor", label: "Revendedor" },
  { value: "vendor_instagram", label: "Revendedor Instagram" },
  { value: "vendor_tiktok", label: "Revendedor TikTok" },
  { value: "vendor_model", label: "Revendedor Modelo" },
  { value: "indicador", label: "Indicador" },
  { value: "moderator", label: "Moderador" },
];

const UserDetailsPage = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [integrations, setIntegrations] = useState<TelegramIntegration[]>([]);
  const [activities, setActivities] = useState<UserActivity[]>([]);
  const [userRoles, setUserRoles] = useState<UserRole[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditingEmail, setIsEditingEmail] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [isUpdatingEmail, setIsUpdatingEmail] = useState(false);
  const [showEmailDialog, setShowEmailDialog] = useState(false);
  const [isTogglingStatus, setIsTogglingStatus] = useState(false);
  const [showSuspendDialog, setShowSuspendDialog] = useState(false);
  const [selectedRole, setSelectedRole] = useState<string>("");
  const [isAddingRole, setIsAddingRole] = useState(false);
  const [isRemovingRole, setIsRemovingRole] = useState<string | null>(null);

  useEffect(() => {
    if (userId) {
      fetchUserData();
    }
  }, [userId]);

  const fetchUserData = async () => {
    try {
      // Fetch profile
      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();

      setProfile(profileData);

      // Fetch transactions
      const { data: txData } = await supabase
        .from("transactions")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      setTransactions(txData || []);

      // Fetch telegram integrations
      const { data: intData } = await supabase
        .from("telegram_integrations")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      setIntegrations(intData || []);

      // Fetch activities
      const { data: actData } = await supabase
        .from("user_activity")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(50);

      setActivities(actData || []);

      // Fetch user roles
      const { data: rolesData } = await supabase
        .from("user_roles")
        .select("id, role")
        .eq("user_id", userId);

      setUserRoles(rolesData || []);
    } catch (error) {
      console.error("Error fetching user data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddRole = async () => {
    if (!selectedRole || !userId) return;

    setIsAddingRole(true);
    try {
      const { error } = await supabase
        .from("user_roles")
        .insert({ user_id: userId, role: selectedRole as any });

      if (error) {
        if (error.code === "23505") {
          toast({
            title: "Cargo já atribuído",
            description: "Este usuário já possui este cargo.",
            variant: "destructive",
          });
        } else {
          throw error;
        }
      } else {
        toast({
          title: "Cargo adicionado",
          description: `Cargo ${AVAILABLE_ROLES.find(r => r.value === selectedRole)?.label} adicionado com sucesso.`,
        });
        setSelectedRole("");
        // Refresh roles
        const { data: rolesData } = await supabase
          .from("user_roles")
          .select("id, role")
          .eq("user_id", userId);
        setUserRoles(rolesData || []);
      }
    } catch (error: any) {
      console.error("Error adding role:", error);
      toast({
        title: "Erro ao adicionar cargo",
        description: error.message || "Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsAddingRole(false);
    }
  };

  const handleRemoveRole = async (roleId: string, roleName: string) => {
    setIsRemovingRole(roleId);
    try {
      const { error } = await supabase
        .from("user_roles")
        .delete()
        .eq("id", roleId);

      if (error) throw error;

      toast({
        title: "Cargo removido",
        description: `Cargo ${AVAILABLE_ROLES.find(r => r.value === roleName)?.label || roleName} removido.`,
      });

      setUserRoles(prev => prev.filter(r => r.id !== roleId));
    } catch (error: any) {
      console.error("Error removing role:", error);
      toast({
        title: "Erro ao remover cargo",
        description: error.message || "Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsRemovingRole(null);
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatPrice = (cents: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(cents / 100);
  };

  const handleUpdateEmail = async () => {
    if (!profile || !newEmail || newEmail === profile.email) {
      setShowEmailDialog(false);
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newEmail)) {
      toast({
        title: "Email inválido",
        description: "Por favor, insira um email válido.",
        variant: "destructive",
      });
      return;
    }

    setIsUpdatingEmail(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      
      const response = await supabase.functions.invoke("admin-update-email", {
        body: { userId: profile.user_id, newEmail },
      });

      if (response.error) {
        throw new Error(response.error.message || "Erro ao atualizar email");
      }

      if (response.data?.error) {
        throw new Error(response.data.error);
      }

      // Update local state
      setProfile({ ...profile, email: newEmail });
      setShowEmailDialog(false);
      setNewEmail("");

      toast({
        title: "Email atualizado",
        description: `Email alterado para ${newEmail}`,
      });
    } catch (error: any) {
      console.error("Error updating email:", error);
      toast({
        title: "Erro ao atualizar email",
        description: error.message || "Tente novamente mais tarde.",
        variant: "destructive",
      });
    } finally {
      setIsUpdatingEmail(false);
    }
  };

  const openEmailDialog = () => {
    setNewEmail(profile?.email || "");
    setShowEmailDialog(true);
  };

  const handleToggleSuspension = async () => {
    if (!profile) return;

    setIsTogglingStatus(true);
    try {
      const newStatus = !profile.is_suspended;
      
      const { error } = await supabase
        .from("profiles")
        .update({ 
          is_suspended: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq("user_id", profile.user_id);

      if (error) throw error;

      // Update local state
      setProfile({ ...profile, is_suspended: newStatus });
      setShowSuspendDialog(false);

      toast({
        title: newStatus ? "Usuário suspenso" : "Usuário reativado",
        description: newStatus 
          ? `${profile.full_name || profile.email} foi suspenso.`
          : `${profile.full_name || profile.email} foi reativado.`,
      });
    } catch (error: any) {
      console.error("Error toggling suspension:", error);
      toast({
        title: "Erro ao alterar status",
        description: error.message || "Tente novamente mais tarde.",
        variant: "destructive",
      });
    } finally {
      setIsTogglingStatus(false);
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      </DashboardLayout>
    );
  }

  if (!profile) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <AlertTriangle className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold mb-2">Usuário não encontrado</h2>
          <Button onClick={() => navigate("/admin")}>Voltar</Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/admin")}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Detalhes do Usuário</h1>
            <p className="text-muted-foreground">{profile.email}</p>
          </div>
        </div>

        {/* User Info Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="glass-card">
            <CardContent className="pt-6">
              <div className="flex flex-col md:flex-row gap-6">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center">
                    <User className="w-8 h-8 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold">{profile.full_name || "Sem nome"}</h2>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <Badge variant={profile.is_online ? "default" : "secondary"}>
                        {profile.is_online ? "Online" : "Offline"}
                      </Badge>
                      {profile.is_suspended && (
                        <Badge variant="destructive">Suspenso</Badge>
                      )}
                      <Badge variant="outline" className="capitalize">
                        {profile.current_plan}
                      </Badge>
                    </div>
                  </div>
                </div>

                {/* Suspend/Reactivate Button */}
                <div className="md:ml-auto flex items-center">
                  <Button
                    variant={profile.is_suspended ? "default" : "destructive"}
                    size="sm"
                    onClick={() => setShowSuspendDialog(true)}
                    className="gap-2"
                  >
                    {profile.is_suspended ? (
                      <>
                        <UserCheck className="w-4 h-4" />
                        Reativar Usuário
                      </>
                    ) : (
                      <>
                        <Ban className="w-4 h-4" />
                        Suspender Usuário
                      </>
                    )}
                  </Button>
                </div>
              </div>

              <div className="mt-6 grid grid-cols-2 md:grid-cols-5 gap-4">
                  <div className="p-3 rounded-lg bg-secondary group relative">
                    <div className="flex items-center gap-2 text-muted-foreground mb-1">
                      <Mail className="w-4 h-4" />
                      <span className="text-xs">Email</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="w-5 h-5 ml-auto opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={openEmailDialog}
                      >
                        <Pencil className="w-3 h-3" />
                      </Button>
                    </div>
                    <p className="text-sm font-medium truncate">{profile.email}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-secondary">
                    <div className="flex items-center gap-2 text-muted-foreground mb-1">
                      <Phone className="w-4 h-4" />
                      <span className="text-xs">Telefone</span>
                    </div>
                    {profile.phone ? (
                      <a 
                        href={`https://wa.me/${profile.phone.replace(/\D/g, '')}`} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-sm font-medium text-success hover:underline"
                      >
                        {profile.phone}
                      </a>
                    ) : (
                      <p className="text-sm font-medium text-muted-foreground">—</p>
                    )}
                  </div>
                  <div className="p-3 rounded-lg bg-secondary">
                    <div className="flex items-center gap-2 text-muted-foreground mb-1">
                      <Calendar className="w-4 h-4" />
                      <span className="text-xs">Cadastro</span>
                    </div>
                    <p className="text-sm font-medium">{formatDate(profile.created_at)}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-secondary">
                    <div className="flex items-center gap-2 text-muted-foreground mb-1">
                      <Clock className="w-4 h-4" />
                      <span className="text-xs">Último acesso</span>
                    </div>
                    <p className="text-sm font-medium">{formatDate(profile.last_seen_at)}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-secondary">
                    <div className="flex items-center gap-2 text-muted-foreground mb-1">
                      <CreditCard className="w-4 h-4" />
                      <span className="text-xs">Transações</span>
                    </div>
                    <p className="text-sm font-medium">{transactions.length}</p>
                  </div>
                </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Tabs */}
        <Tabs defaultValue="transactions" className="space-y-4">
          <TabsList>
            <TabsTrigger value="transactions" className="gap-2">
              <ShoppingCart className="w-4 h-4" />
              Transações
            </TabsTrigger>
            <TabsTrigger value="integrations" className="gap-2">
              <Bot className="w-4 h-4" />
              Integrações
            </TabsTrigger>
            <TabsTrigger value="roles" className="gap-2">
              <Users className="w-4 h-4" />
              Cargos
            </TabsTrigger>
            <TabsTrigger value="activities" className="gap-2">
              <Activity className="w-4 h-4" />
              Atividades
            </TabsTrigger>
          </TabsList>

          <TabsContent value="transactions">
            <Card className="glass-card">
              <CardHeader>
                <CardTitle>Transações ({transactions.length})</CardTitle>
              </CardHeader>
              <CardContent>
                {transactions.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <ShoppingCart className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p>Nenhuma transação</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Data</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Valor</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {transactions.map((tx) => (
                        <TableRow key={tx.id}>
                          <TableCell>{formatDate(tx.created_at)}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="capitalize">
                              {tx.product_type}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-semibold">
                            {formatPrice(tx.amount_cents)}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={tx.status === "paid" ? "default" : "secondary"}
                              className={tx.status === "paid" ? "bg-success" : ""}
                            >
                              {tx.status === "paid" ? (
                                <><CheckCircle2 className="w-3 h-3 mr-1" />Pago</>
                              ) : tx.status === "pending" ? (
                                <><Clock className="w-3 h-3 mr-1" />Pendente</>
                              ) : (
                                <><XCircle className="w-3 h-3 mr-1" />Falhou</>
                              )}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="integrations">
            <Card className="glass-card">
              <CardHeader>
                <CardTitle>Integrações Telegram ({integrations.length})</CardTitle>
              </CardHeader>
              <CardContent>
                {integrations.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Bot className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p>Nenhuma integração</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Bot</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Conectado em</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {integrations.map((int) => (
                        <TableRow key={int.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium">{int.bot_name || "Bot"}</p>
                              <p className="text-sm text-muted-foreground">
                                @{int.bot_username}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={int.is_connected ? "default" : "secondary"}>
                              {int.is_connected ? "Conectado" : "Desconectado"}
                            </Badge>
                          </TableCell>
                          <TableCell>{formatDate(int.created_at)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="roles">
            <Card className="glass-card">
              <CardHeader>
                <CardTitle>Cargos do Usuário ({userRoles.length})</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Add Role */}
                <div className="flex gap-2">
                  <Select value={selectedRole} onValueChange={setSelectedRole}>
                    <SelectTrigger className="w-[200px]">
                      <SelectValue placeholder="Selecionar cargo" />
                    </SelectTrigger>
                    <SelectContent>
                      {AVAILABLE_ROLES.filter(
                        (r) => !userRoles.some((ur) => ur.role === r.value)
                      ).map((role) => (
                        <SelectItem key={role.value} value={role.value}>
                          {role.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    onClick={handleAddRole}
                    disabled={!selectedRole || isAddingRole}
                    size="sm"
                  >
                    {isAddingRole ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <Plus className="w-4 h-4 mr-1" />
                        Adicionar
                      </>
                    )}
                  </Button>
                </div>

                {/* Current Roles */}
                {userRoles.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p>Nenhum cargo atribuído</p>
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {userRoles.map((role) => (
                      <Badge
                        key={role.id}
                        variant="secondary"
                        className="px-3 py-1.5 text-sm flex items-center gap-2"
                      >
                        {AVAILABLE_ROLES.find((r) => r.value === role.role)?.label || role.role}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="w-4 h-4 p-0 hover:bg-destructive/20"
                          onClick={() => handleRemoveRole(role.id, role.role)}
                          disabled={isRemovingRole === role.id}
                        >
                          {isRemovingRole === role.id ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <Trash2 className="w-3 h-3 text-destructive" />
                          )}
                        </Button>
                      </Badge>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="activities">
            <Card className="glass-card">
              <CardHeader>
                <CardTitle>Atividades Recentes</CardTitle>
              </CardHeader>
              <CardContent>
                {activities.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Activity className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p>Nenhuma atividade registrada</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {activities.map((act) => (
                      <div
                        key={act.id}
                        className="flex items-center justify-between p-3 rounded-lg bg-secondary"
                      >
                        <div>
                          <p className="font-medium">{act.action}</p>
                          {act.details && (
                            <p className="text-sm text-muted-foreground">
                              {JSON.stringify(act.details)}
                            </p>
                          )}
                        </div>
                        <span className="text-sm text-muted-foreground">
                          {formatDate(act.created_at)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Email Edit Dialog */}
        <Dialog open={showEmailDialog} onOpenChange={setShowEmailDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Alterar Email do Usuário</DialogTitle>
              <DialogDescription>
                Insira o novo email para o usuário. O usuário será notificado da alteração.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <label className="text-sm font-medium mb-2 block">Novo Email</label>
              <Input
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="novoemail@exemplo.com"
                disabled={isUpdatingEmail}
              />
            </div>
            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={() => setShowEmailDialog(false)}
                disabled={isUpdatingEmail}
              >
                Cancelar
              </Button>
              <Button 
                onClick={handleUpdateEmail}
                disabled={isUpdatingEmail || !newEmail || newEmail === profile?.email}
              >
                {isUpdatingEmail ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Atualizando...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Salvar
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Suspend/Reactivate Dialog */}
        <Dialog open={showSuspendDialog} onOpenChange={setShowSuspendDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                {profile?.is_suspended ? (
                  <>
                    <UserCheck className="w-5 h-5 text-success" />
                    Reativar Usuário
                  </>
                ) : (
                  <>
                    <Ban className="w-5 h-5 text-destructive" />
                    Suspender Usuário
                  </>
                )}
              </DialogTitle>
              <DialogDescription>
                {profile?.is_suspended
                  ? `Tem certeza que deseja reativar o acesso de ${profile?.full_name || profile?.email}? O usuário poderá acessar a plataforma novamente.`
                  : `Tem certeza que deseja suspender ${profile?.full_name || profile?.email}? O usuário não poderá acessar a plataforma enquanto estiver suspenso.`}
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={() => setShowSuspendDialog(false)}
                disabled={isTogglingStatus}
              >
                Cancelar
              </Button>
              <Button 
                variant={profile?.is_suspended ? "default" : "destructive"}
                onClick={handleToggleSuspension}
                disabled={isTogglingStatus}
              >
                {isTogglingStatus ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Processando...
                  </>
                ) : profile?.is_suspended ? (
                  <>
                    <UserCheck className="w-4 h-4 mr-2" />
                    Confirmar Reativação
                  </>
                ) : (
                  <>
                    <Ban className="w-4 h-4 mr-2" />
                    Confirmar Suspensão
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default UserDetailsPage;
