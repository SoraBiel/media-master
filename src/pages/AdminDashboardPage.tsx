import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Users,
  UserCheck,
  UserX,
  CreditCard,
  ShoppingCart,
  TrendingUp,
  Eye,
  MoreVertical,
  Plus,
  Edit,
  Ban,
  Calendar,
  DollarSign,
  Filter,
  Trash2,
  Image,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Profile {
  id: string;
  user_id: string;
  email: string;
  full_name: string | null;
  current_plan: string;
  is_online: boolean;
  last_seen_at: string;
  created_at: string;
}

interface Transaction {
  id: string;
  user_id: string;
  amount_cents: number;
  status: string;
  product_type: string;
  created_at: string;
  buyer_name: string | null;
  buyer_email: string | null;
}

interface TikTokAccount {
  id: string;
  username: string;
  followers: number;
  likes: number;
  niche: string | null;
  price_cents: number;
  is_sold: boolean;
  created_at: string;
}

interface ModelForSale {
  id: string;
  name: string;
  bio: string | null;
  niche: string | null;
  category: string | null;
  price_cents: number;
  is_sold: boolean;
  created_at: string;
}

interface AdminMedia {
  id: string;
  name: string;
  description: string | null;
  pack_type: string;
  min_plan: string;
  file_count: number;
  image_url: string | null;
  created_at: string;
}

interface Stats {
  totalUsers: number;
  onlineUsers: number;
  offlineUsers: number;
  activeSubscriptions: number;
  pendingCheckouts: number;
  totalRevenue: number;
}

interface BillingStats {
  today: number;
  last7Days: number;
  last15Days: number;
  last30Days: number;
  allTime: number;
  transactionCount: number;
}

type BillingPeriod = "today" | "7days" | "15days" | "30days" | "all";

const AdminDashboardPage = () => {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [tiktokAccounts, setTiktokAccounts] = useState<TikTokAccount[]>([]);
  const [models, setModels] = useState<ModelForSale[]>([]);
  const [adminMedia, setAdminMedia] = useState<AdminMedia[]>([]);
  const [plans, setPlans] = useState<{ id: string; slug: string; name: string }[]>([]);
  const [billingPeriod, setBillingPeriod] = useState<BillingPeriod>("30days");
  const [billingStats, setBillingStats] = useState<BillingStats>({
    today: 0,
    last7Days: 0,
    last15Days: 0,
    last30Days: 0,
    allTime: 0,
    transactionCount: 0,
  });
  const [stats, setStats] = useState<Stats>({
    totalUsers: 0,
    onlineUsers: 0,
    offlineUsers: 0,
    activeSubscriptions: 0,
    pendingCheckouts: 0,
    totalRevenue: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [tiktokDialogOpen, setTiktokDialogOpen] = useState(false);
  const [modelDialogOpen, setModelDialogOpen] = useState(false);
  const [mediaDialogOpen, setMediaDialogOpen] = useState(false);
  const [planDialogOpen, setPlanDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<Profile | null>(null);
  const [selectedPlan, setSelectedPlan] = useState("");
  const { toast } = useToast();

  const [tiktokForm, setTiktokForm] = useState({
    username: "",
    followers: "",
    likes: "",
    description: "",
    niche: "",
    price: "",
  });

  const [modelForm, setModelForm] = useState({
    name: "",
    bio: "",
    niche: "",
    category: "ia",
    price: "",
  });

  const [mediaForm, setMediaForm] = useState({
    name: "",
    description: "",
    pack_type: "10k",
    min_plan: "basic",
    file_count: "",
  });

  useEffect(() => {
    fetchData();
    fetchTransactions();
    fetchTikTokAccounts();
    fetchModels();
    fetchAdminMedia();
    fetchPlans();

    const channel = supabase
      .channel("admin-data")
      .on("postgres_changes", { event: "*", schema: "public", table: "profiles" }, () => fetchData())
      .on("postgres_changes", { event: "*", schema: "public", table: "transactions" }, () => fetchTransactions())
      .on("postgres_changes", { event: "*", schema: "public", table: "tiktok_accounts" }, () => fetchTikTokAccounts())
      .on("postgres_changes", { event: "*", schema: "public", table: "models_for_sale" }, () => fetchModels())
      .on("postgres_changes", { event: "*", schema: "public", table: "admin_media" }, () => fetchAdminMedia())
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchPlans = async () => {
    try {
      const { data } = await supabase
        .from("plans")
        .select("id, slug, name")
        .eq("is_active", true)
        .order("price_cents", { ascending: true });
      setPlans(data || []);
    } catch (error) {
      console.error("Error fetching plans:", error);
    }
  };

  const fetchData = async () => {
    try {
      const { data: profilesData } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });

      const { data: subscriptionsData } = await supabase
        .from("subscriptions")
        .select("*")
        .eq("status", "active");

      const { data: checkoutsData } = await supabase
        .from("checkout_sessions")
        .select("*")
        .eq("status", "pending");

      const { data: transactionsData } = await supabase
        .from("transactions")
        .select("amount_cents")
        .eq("status", "paid");

      const totalRevenue = transactionsData?.reduce((sum, t) => sum + (t.amount_cents || 0), 0) || 0;
      const onlineUsers = profilesData?.filter((p) => p.is_online).length || 0;

      setProfiles(profilesData || []);
      setStats({
        totalUsers: profilesData?.length || 0,
        onlineUsers,
        offlineUsers: (profilesData?.length || 0) - onlineUsers,
        activeSubscriptions: subscriptionsData?.length || 0,
        pendingCheckouts: checkoutsData?.length || 0,
        totalRevenue,
      });
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchTransactions = async () => {
    try {
      const { data } = await supabase
        .from("transactions")
        .select("*")
        .eq("status", "paid")
        .order("created_at", { ascending: false });

      if (data) {
        setTransactions(data);
        calculateBillingStats(data);
      }
    } catch (error) {
      console.error("Error fetching transactions:", error);
    }
  };

  const fetchTikTokAccounts = async () => {
    try {
      const { data } = await supabase
        .from("tiktok_accounts")
        .select("*")
        .order("created_at", { ascending: false });
      setTiktokAccounts(data || []);
    } catch (error) {
      console.error("Error fetching TikTok accounts:", error);
    }
  };

  const fetchModels = async () => {
    try {
      const { data } = await supabase
        .from("models_for_sale")
        .select("*")
        .order("created_at", { ascending: false });
      setModels(data || []);
    } catch (error) {
      console.error("Error fetching models:", error);
    }
  };

  const fetchAdminMedia = async () => {
    try {
      const { data } = await supabase
        .from("admin_media")
        .select("*")
        .order("created_at", { ascending: false });
      setAdminMedia(data || []);
    } catch (error) {
      console.error("Error fetching admin media:", error);
    }
  };

  const calculateBillingStats = (txs: Transaction[]) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const last7 = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const last15 = new Date(today.getTime() - 15 * 24 * 60 * 60 * 1000);
    const last30 = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

    let todaySum = 0, last7Sum = 0, last15Sum = 0, last30Sum = 0, allSum = 0;

    txs.forEach((tx) => {
      const txDate = new Date(tx.created_at);
      allSum += tx.amount_cents;
      if (txDate >= today) todaySum += tx.amount_cents;
      if (txDate >= last7) last7Sum += tx.amount_cents;
      if (txDate >= last15) last15Sum += tx.amount_cents;
      if (txDate >= last30) last30Sum += tx.amount_cents;
    });

    setBillingStats({
      today: todaySum,
      last7Days: last7Sum,
      last15Days: last15Sum,
      last30Days: last30Sum,
      allTime: allSum,
      transactionCount: txs.length,
    });
  };

  const getFilteredTransactions = () => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    return transactions.filter((tx) => {
      const txDate = new Date(tx.created_at);
      switch (billingPeriod) {
        case "today":
          return txDate >= today;
        case "7days":
          return txDate >= new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
        case "15days":
          return txDate >= new Date(today.getTime() - 15 * 24 * 60 * 60 * 1000);
        case "30days":
          return txDate >= new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
        default:
          return true;
      }
    });
  };

  const handleAddTikTokAccount = async () => {
    try {
      const { error } = await supabase.from("tiktok_accounts").insert({
        username: tiktokForm.username,
        followers: parseInt(tiktokForm.followers) || 0,
        likes: parseInt(tiktokForm.likes) || 0,
        description: tiktokForm.description,
        niche: tiktokForm.niche,
        price_cents: Math.round(parseFloat(tiktokForm.price) * 100),
      });

      if (error) throw error;

      toast({ title: "Conta adicionada!", description: `@${tiktokForm.username} foi adicionada com sucesso.` });
      setTiktokForm({ username: "", followers: "", likes: "", description: "", niche: "", price: "" });
      setTiktokDialogOpen(false);
    } catch (error: any) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    }
  };

  const handleDeleteTikTokAccount = async (id: string) => {
    try {
      const { error } = await supabase.from("tiktok_accounts").delete().eq("id", id);
      if (error) throw error;
      toast({ title: "Conta removida!" });
    } catch (error: any) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    }
  };

  const handleAddModel = async () => {
    try {
      const { error } = await supabase.from("models_for_sale").insert({
        name: modelForm.name,
        bio: modelForm.bio,
        niche: modelForm.niche,
        category: modelForm.category,
        price_cents: Math.round(parseFloat(modelForm.price) * 100),
      });

      if (error) throw error;

      toast({ title: "Modelo adicionado!", description: `${modelForm.name} foi adicionado com sucesso.` });
      setModelForm({ name: "", bio: "", niche: "", category: "ia", price: "" });
      setModelDialogOpen(false);
    } catch (error: any) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    }
  };

  const handleDeleteModel = async (id: string) => {
    try {
      const { error } = await supabase.from("models_for_sale").delete().eq("id", id);
      if (error) throw error;
      toast({ title: "Modelo removido!" });
    } catch (error: any) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    }
  };

  const handleAddMedia = async () => {
    try {
      const { error } = await supabase.from("admin_media").insert({
        name: mediaForm.name,
        description: mediaForm.description,
        pack_type: mediaForm.pack_type,
        min_plan: mediaForm.min_plan,
        file_count: parseInt(mediaForm.file_count) || 0,
      });

      if (error) throw error;

      toast({ title: "Pacote de mídia adicionado!", description: `${mediaForm.name} foi adicionado.` });
      setMediaForm({ name: "", description: "", pack_type: "10k", min_plan: "basic", file_count: "" });
      setMediaDialogOpen(false);
    } catch (error: any) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    }
  };

  const handleDeleteMedia = async (id: string) => {
    try {
      const { error } = await supabase.from("admin_media").delete().eq("id", id);
      if (error) throw error;
      toast({ title: "Pacote removido!" });
    } catch (error: any) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    }
  };

  const handleChangePlan = async () => {
    if (!selectedUser || !selectedPlan) return;
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ current_plan: selectedPlan as any })
        .eq("user_id", selectedUser.user_id);

      if (error) throw error;

      toast({ 
        title: "Plano alterado!", 
        description: `${selectedUser.email} agora está no plano ${selectedPlan}.` 
      });
      setPlanDialogOpen(false);
      setSelectedUser(null);
      setSelectedPlan("");
      fetchData();
    } catch (error: any) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    }
  };

  const openPlanDialog = (profile: Profile) => {
    setSelectedUser(profile);
    setSelectedPlan(profile.current_plan);
    setPlanDialogOpen(true);
  };

  const formatPrice = (cents: number) => {
    return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(cents / 100);
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

  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
    if (num >= 1000) return (num / 1000).toFixed(1) + "K";
    return num.toString();
  };

  const filteredProfiles = profiles.filter(
    (p) =>
      p.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.full_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const statCards = [
    { title: "Total de Usuários", value: stats.totalUsers, icon: Users, color: "text-telegram" },
    { title: "Usuários Online", value: stats.onlineUsers, icon: UserCheck, color: "text-success" },
    { title: "Usuários Offline", value: stats.offlineUsers, icon: UserX, color: "text-muted-foreground" },
    { title: "Assinaturas Ativas", value: stats.activeSubscriptions, icon: CreditCard, color: "text-primary" },
    { title: "Checkouts Pendentes", value: stats.pendingCheckouts, icon: ShoppingCart, color: "text-warning" },
    { title: "Receita Total", value: formatPrice(stats.totalRevenue), icon: TrendingUp, color: "text-success" },
  ];

  const billingPeriodLabels: Record<BillingPeriod, string> = {
    today: "Hoje",
    "7days": "Últimos 7 dias",
    "15days": "Últimos 15 dias",
    "30days": "Últimos 30 dias",
    all: "Todo período",
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Painel Administrativo</h1>
          <p className="text-muted-foreground">Gerencie usuários, produtos e visualize estatísticas</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          {statCards.map((stat, index) => (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="glass-card p-4"
            >
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg bg-muted ${stat.color}`}>
                  <stat.icon className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{stat.title}</p>
                  <p className="text-xl font-bold">{stat.value}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Tabs */}
        <Tabs defaultValue="users" className="space-y-4">
          <TabsList>
            <TabsTrigger value="users">Usuários</TabsTrigger>
            <TabsTrigger value="billing">Faturamento</TabsTrigger>
            <TabsTrigger value="media">Mídias</TabsTrigger>
            <TabsTrigger value="tiktok">Contas TikTok</TabsTrigger>
            <TabsTrigger value="models">Modelos</TabsTrigger>
          </TabsList>

          {/* Users Tab */}
          <TabsContent value="users" className="space-y-4">
            <div className="flex items-center justify-between">
              <Input
                placeholder="Buscar usuários..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="max-w-sm"
              />
            </div>

            <div className="glass-card overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Status</TableHead>
                    <TableHead>Usuário</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Plano</TableHead>
                    <TableHead>Último Acesso</TableHead>
                    <TableHead>Cadastro</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProfiles.map((profile) => (
                    <TableRow key={profile.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${profile.is_online ? "bg-success" : "bg-muted-foreground"}`} />
                          <span className="text-sm">{profile.is_online ? "Online" : "Offline"}</span>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">{profile.full_name || "—"}</TableCell>
                      <TableCell>{profile.email}</TableCell>
                      <TableCell>
                        <Badge variant={profile.current_plan === "free" ? "secondary" : "default"}>
                          {profile.current_plan}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{formatDate(profile.last_seen_at)}</TableCell>
                      <TableCell className="text-muted-foreground">{formatDate(profile.created_at)}</TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon"><MoreVertical className="w-4 h-4" /></Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => openPlanDialog(profile)}>
                              <CreditCard className="w-4 h-4 mr-2" />Alterar Plano
                            </DropdownMenuItem>
                            <DropdownMenuItem><Eye className="w-4 h-4 mr-2" />Ver detalhes</DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive"><Ban className="w-4 h-4 mr-2" />Suspender</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Plan Change Dialog */}
            <Dialog open={planDialogOpen} onOpenChange={setPlanDialogOpen}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Alterar Plano do Usuário</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>Usuário</Label>
                    <p className="text-sm text-muted-foreground">{selectedUser?.email}</p>
                  </div>
                  <div>
                    <Label>Plano Atual</Label>
                    <Badge variant="secondary" className="ml-2 capitalize">{selectedUser?.current_plan}</Badge>
                  </div>
                  <div>
                    <Label>Novo Plano</Label>
                    <Select value={selectedPlan} onValueChange={setSelectedPlan}>
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Selecione um plano" />
                      </SelectTrigger>
                      <SelectContent>
                        {plans.map((plan) => (
                          <SelectItem key={plan.id} value={plan.slug}>
                            {plan.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button 
                    onClick={handleChangePlan} 
                    className="w-full telegram-gradient text-white"
                    disabled={!selectedPlan || selectedPlan === selectedUser?.current_plan}
                  >
                    Confirmar Alteração
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </TabsContent>

          {/* Billing Tab */}
          <TabsContent value="billing" className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <Card className={`cursor-pointer transition-all ${billingPeriod === "today" ? "border-telegram" : ""}`} onClick={() => setBillingPeriod("today")}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Hoje</span>
                  </div>
                  <p className="text-xl font-bold">{formatPrice(billingStats.today)}</p>
                </CardContent>
              </Card>
              <Card className={`cursor-pointer transition-all ${billingPeriod === "7days" ? "border-telegram" : ""}`} onClick={() => setBillingPeriod("7days")}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">7 dias</span>
                  </div>
                  <p className="text-xl font-bold">{formatPrice(billingStats.last7Days)}</p>
                </CardContent>
              </Card>
              <Card className={`cursor-pointer transition-all ${billingPeriod === "15days" ? "border-telegram" : ""}`} onClick={() => setBillingPeriod("15days")}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">15 dias</span>
                  </div>
                  <p className="text-xl font-bold">{formatPrice(billingStats.last15Days)}</p>
                </CardContent>
              </Card>
              <Card className={`cursor-pointer transition-all ${billingPeriod === "30days" ? "border-telegram" : ""}`} onClick={() => setBillingPeriod("30days")}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">30 dias</span>
                  </div>
                  <p className="text-xl font-bold">{formatPrice(billingStats.last30Days)}</p>
                </CardContent>
              </Card>
              <Card className={`cursor-pointer transition-all ${billingPeriod === "all" ? "border-telegram" : ""}`} onClick={() => setBillingPeriod("all")}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <DollarSign className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Total</span>
                  </div>
                  <p className="text-xl font-bold">{formatPrice(billingStats.allTime)}</p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Filter className="w-5 h-5" />
                    Transações - {billingPeriodLabels[billingPeriod]}
                  </CardTitle>
                  <Badge variant="secondary">{getFilteredTransactions().length} transações</Badge>
                </div>
              </CardHeader>
              <CardContent>
                {getFilteredTransactions().length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <DollarSign className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p>Nenhuma transação no período selecionado</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Data</TableHead>
                        <TableHead>Comprador</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Valor</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {getFilteredTransactions().map((tx) => (
                        <TableRow key={tx.id}>
                          <TableCell>{formatDate(tx.created_at)}</TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium">{tx.buyer_name || "—"}</p>
                              <p className="text-sm text-muted-foreground">{tx.buyer_email || "—"}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="capitalize">{tx.product_type}</Badge>
                          </TableCell>
                          <TableCell className="font-semibold">{formatPrice(tx.amount_cents)}</TableCell>
                          <TableCell>
                            <Badge className="bg-success">Pago</Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Media Tab */}
          <TabsContent value="media" className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Pacotes de Mídias ({adminMedia.length})</h3>
              <Dialog open={mediaDialogOpen} onOpenChange={setMediaDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="telegram-gradient text-white gap-2">
                    <Plus className="w-4 h-4" />
                    Adicionar Pacote
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Novo Pacote de Mídias</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label>Nome do Pacote</Label>
                      <Input value={mediaForm.name} onChange={(e) => setMediaForm({ ...mediaForm, name: e.target.value })} placeholder="Ex: Pack Premium 10K" />
                    </div>
                    <div>
                      <Label>Descrição</Label>
                      <Textarea value={mediaForm.description} onChange={(e) => setMediaForm({ ...mediaForm, description: e.target.value })} placeholder="Descreva o pacote..." />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Tipo do Pacote</Label>
                        <Select value={mediaForm.pack_type} onValueChange={(v) => setMediaForm({ ...mediaForm, pack_type: v })}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="10k">10K</SelectItem>
                            <SelectItem value="50k">50K</SelectItem>
                            <SelectItem value="full">Full</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Plano Mínimo</Label>
                        <Select value={mediaForm.min_plan} onValueChange={(v) => setMediaForm({ ...mediaForm, min_plan: v })}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="free">Free</SelectItem>
                            <SelectItem value="basic">Basic</SelectItem>
                            <SelectItem value="pro">Pro</SelectItem>
                            <SelectItem value="agency">Agency</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div>
                      <Label>Quantidade de Arquivos</Label>
                      <Input type="number" value={mediaForm.file_count} onChange={(e) => setMediaForm({ ...mediaForm, file_count: e.target.value })} placeholder="100" />
                    </div>
                    <Button onClick={handleAddMedia} className="w-full telegram-gradient text-white">Adicionar Pacote</Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            <div className="glass-card overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Plano Mínimo</TableHead>
                    <TableHead>Arquivos</TableHead>
                    <TableHead>Criado em</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {adminMedia.map((media) => (
                    <TableRow key={media.id}>
                      <TableCell className="font-medium">{media.name}</TableCell>
                      <TableCell>
                        <Badge variant="default">{media.pack_type}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">{media.min_plan}</Badge>
                      </TableCell>
                      <TableCell>{media.file_count} arquivos</TableCell>
                      <TableCell className="text-muted-foreground">{formatDate(media.created_at)}</TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon" onClick={() => handleDeleteMedia(media.id)}>
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {adminMedia.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        <Image className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        <p>Nenhum pacote de mídia cadastrado</p>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          {/* TikTok Accounts Tab */}
          <TabsContent value="tiktok" className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Contas TikTok ({tiktokAccounts.length})</h3>
              <Dialog open={tiktokDialogOpen} onOpenChange={setTiktokDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="telegram-gradient text-white gap-2">
                    <Plus className="w-4 h-4" />
                    Adicionar Conta
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Nova Conta TikTok</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label>Username</Label>
                      <Input value={tiktokForm.username} onChange={(e) => setTiktokForm({ ...tiktokForm, username: e.target.value })} placeholder="@usuario" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Seguidores</Label>
                        <Input type="number" value={tiktokForm.followers} onChange={(e) => setTiktokForm({ ...tiktokForm, followers: e.target.value })} placeholder="10000" />
                      </div>
                      <div>
                        <Label>Curtidas</Label>
                        <Input type="number" value={tiktokForm.likes} onChange={(e) => setTiktokForm({ ...tiktokForm, likes: e.target.value })} placeholder="50000" />
                      </div>
                    </div>
                    <div>
                      <Label>Nicho</Label>
                      <Input value={tiktokForm.niche} onChange={(e) => setTiktokForm({ ...tiktokForm, niche: e.target.value })} placeholder="Lifestyle, Gaming, etc." />
                    </div>
                    <div>
                      <Label>Descrição</Label>
                      <Textarea value={tiktokForm.description} onChange={(e) => setTiktokForm({ ...tiktokForm, description: e.target.value })} placeholder="Descreva a conta..." />
                    </div>
                    <div>
                      <Label>Preço (R$)</Label>
                      <Input type="number" step="0.01" value={tiktokForm.price} onChange={(e) => setTiktokForm({ ...tiktokForm, price: e.target.value })} placeholder="299.90" />
                    </div>
                    <Button onClick={handleAddTikTokAccount} className="w-full telegram-gradient text-white">Adicionar Conta</Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            <div className="glass-card overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Username</TableHead>
                    <TableHead>Seguidores</TableHead>
                    <TableHead>Curtidas</TableHead>
                    <TableHead>Nicho</TableHead>
                    <TableHead>Preço</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tiktokAccounts.map((account) => (
                    <TableRow key={account.id}>
                      <TableCell className="font-medium">@{account.username}</TableCell>
                      <TableCell>{formatNumber(account.followers)}</TableCell>
                      <TableCell>{formatNumber(account.likes)}</TableCell>
                      <TableCell>{account.niche || "—"}</TableCell>
                      <TableCell className="font-semibold">{formatPrice(account.price_cents)}</TableCell>
                      <TableCell>
                        <Badge variant={account.is_sold ? "secondary" : "default"}>
                          {account.is_sold ? "Vendida" : "Disponível"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon" onClick={() => handleDeleteTikTokAccount(account.id)}>
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {tiktokAccounts.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        Nenhuma conta cadastrada
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          {/* Models Tab */}
          <TabsContent value="models" className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Modelos ({models.length})</h3>
              <Dialog open={modelDialogOpen} onOpenChange={setModelDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="telegram-gradient text-white gap-2">
                    <Plus className="w-4 h-4" />
                    Adicionar Modelo
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Novo Modelo</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label>Nome</Label>
                      <Input value={modelForm.name} onChange={(e) => setModelForm({ ...modelForm, name: e.target.value })} placeholder="Nome do modelo" />
                    </div>
                    <div>
                      <Label>Bio</Label>
                      <Textarea value={modelForm.bio} onChange={(e) => setModelForm({ ...modelForm, bio: e.target.value })} placeholder="Descrição do modelo..." />
                    </div>
                    <div>
                      <Label>Nicho</Label>
                      <Input value={modelForm.niche} onChange={(e) => setModelForm({ ...modelForm, niche: e.target.value })} placeholder="Lifestyle, Fitness, etc." />
                    </div>
                    <div>
                      <Label>Categoria</Label>
                      <Select value={modelForm.category} onValueChange={(v) => setModelForm({ ...modelForm, category: v })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ia">Modelo IA</SelectItem>
                          <SelectItem value="black">Modelo Black</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Preço (R$)</Label>
                      <Input type="number" step="0.01" value={modelForm.price} onChange={(e) => setModelForm({ ...modelForm, price: e.target.value })} placeholder="499.90" />
                    </div>
                    <Button onClick={handleAddModel} className="w-full telegram-gradient text-white">Adicionar Modelo</Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            <div className="glass-card overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead>Nicho</TableHead>
                    <TableHead>Preço</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {models.map((model) => (
                    <TableRow key={model.id}>
                      <TableCell className="font-medium">{model.name}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">{model.category}</Badge>
                      </TableCell>
                      <TableCell>{model.niche || "—"}</TableCell>
                      <TableCell className="font-semibold">{formatPrice(model.price_cents)}</TableCell>
                      <TableCell>
                        <Badge variant={model.is_sold ? "secondary" : "default"}>
                          {model.is_sold ? "Vendido" : "Disponível"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon" onClick={() => handleDeleteModel(model.id)}>
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {models.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        Nenhum modelo cadastrado
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default AdminDashboardPage;