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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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

const UserDetailsPage = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [integrations, setIntegrations] = useState<TelegramIntegration[]>([]);
  const [activities, setActivities] = useState<UserActivity[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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
    } catch (error) {
      console.error("Error fetching user data:", error);
    } finally {
      setIsLoading(false);
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
                    <div className="flex items-center gap-2 mt-1">
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

                <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-3 rounded-lg bg-secondary">
                    <div className="flex items-center gap-2 text-muted-foreground mb-1">
                      <Mail className="w-4 h-4" />
                      <span className="text-xs">Email</span>
                    </div>
                    <p className="text-sm font-medium truncate">{profile.email}</p>
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
      </div>
    </DashboardLayout>
  );
};

export default UserDetailsPage;
