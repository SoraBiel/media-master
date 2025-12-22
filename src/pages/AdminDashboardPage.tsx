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
  const { toast } = useToast();

  // TikTok Account Form
  const [tiktokForm, setTiktokForm] = useState({
    username: "",
    followers: "",
    likes: "",
    description: "",
    niche: "",
    price: "",
  });

  // Model Form
  const [modelForm, setModelForm] = useState({
    name: "",
    bio: "",
    niche: "",
    category: "ia",
    price: "",
  });

  useEffect(() => {
    fetchData();
    fetchTransactions();

    const channel = supabase
      .channel("admin-profiles")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "profiles" },
        () => fetchData()
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "transactions" },
        () => fetchTransactions()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

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

      const totalRevenue = transactionsData?.reduce(
        (sum, t) => sum + (t.amount_cents || 0),
        0
      ) || 0;

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

      toast({
        title: "Conta adicionada!",
        description: `@${tiktokForm.username} foi adicionada com sucesso.`,
      });

      setTiktokForm({ username: "", followers: "", likes: "", description: "", niche: "", price: "" });
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

      toast({
        title: "Modelo adicionado!",
        description: `${modelForm.name} foi adicionado com sucesso.`,
      });

      setModelForm({ name: "", bio: "", niche: "", category: "ia", price: "" });
    } catch (error: any) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    }
  };

  const formatPrice = (cents: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(cents / 100);
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
                            <DropdownMenuItem><Eye className="w-4 h-4 mr-2" />Ver detalhes</DropdownMenuItem>
                            <DropdownMenuItem><Edit className="w-4 h-4 mr-2" />Editar</DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive"><Ban className="w-4 h-4 mr-2" />Suspender</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          {/* Billing Tab */}
          <TabsContent value="billing" className="space-y-6">
            {/* Billing Summary Cards */}
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

            {/* Transactions Table */}
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

          {/* TikTok Accounts Tab */}
          <TabsContent value="tiktok" className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Contas TikTok à Venda</h3>
              <Dialog>
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
          </TabsContent>

          {/* Models Tab */}
          <TabsContent value="models" className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Modelos à Venda</h3>
              <Dialog>
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
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default AdminDashboardPage;
