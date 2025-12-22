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
  Trash2,
  Edit,
  Ban,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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

interface Stats {
  totalUsers: number;
  onlineUsers: number;
  offlineUsers: number;
  activeSubscriptions: number;
  pendingCheckouts: number;
  totalRevenue: number;
}

const AdminDashboardPage = () => {
  const [profiles, setProfiles] = useState<Profile[]>([]);
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

    // Subscribe to realtime updates for online status
    const channel = supabase
      .channel("admin-profiles")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "profiles",
        },
        () => {
          fetchData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchData = async () => {
    try {
      // Fetch profiles
      const { data: profilesData, error: profilesError } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });

      if (profilesError) throw profilesError;

      // Fetch subscriptions
      const { data: subscriptionsData } = await supabase
        .from("subscriptions")
        .select("*")
        .eq("status", "active");

      // Fetch pending checkouts
      const { data: checkoutsData } = await supabase
        .from("checkout_sessions")
        .select("*")
        .eq("status", "pending");

      // Fetch transactions for revenue
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

      setTiktokForm({
        username: "",
        followers: "",
        likes: "",
        description: "",
        niche: "",
        price: "",
      });
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
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

      setModelForm({
        name: "",
        bio: "",
        niche: "",
        category: "ia",
        price: "",
      });
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
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
    (profile) =>
      profile.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      profile.full_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const statCards = [
    {
      title: "Total de Usuários",
      value: stats.totalUsers,
      icon: Users,
      color: "text-telegram",
    },
    {
      title: "Usuários Online",
      value: stats.onlineUsers,
      icon: UserCheck,
      color: "text-success",
    },
    {
      title: "Usuários Offline",
      value: stats.offlineUsers,
      icon: UserX,
      color: "text-muted-foreground",
    },
    {
      title: "Assinaturas Ativas",
      value: stats.activeSubscriptions,
      icon: CreditCard,
      color: "text-primary",
    },
    {
      title: "Checkouts Pendentes",
      value: stats.pendingCheckouts,
      icon: ShoppingCart,
      color: "text-warning",
    },
    {
      title: "Receita Total",
      value: formatPrice(stats.totalRevenue),
      icon: TrendingUp,
      color: "text-success",
    },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold mb-2">Painel Administrativo</h1>
          <p className="text-muted-foreground">
            Gerencie usuários, produtos e visualize estatísticas
          </p>
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
            <TabsTrigger value="tiktok">Contas TikTok</TabsTrigger>
            <TabsTrigger value="models">Modelos</TabsTrigger>
            <TabsTrigger value="media">Biblioteca</TabsTrigger>
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
                          <div
                            className={`w-2 h-2 rounded-full ${
                              profile.is_online ? "bg-success" : "bg-muted-foreground"
                            }`}
                          />
                          <span className="text-sm">
                            {profile.is_online ? "Online" : "Offline"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">
                        {profile.full_name || "—"}
                      </TableCell>
                      <TableCell>{profile.email}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            profile.current_plan === "free"
                              ? "secondary"
                              : "default"
                          }
                        >
                          {profile.current_plan}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatDate(profile.last_seen_at)}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatDate(profile.created_at)}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>
                              <Eye className="w-4 h-4 mr-2" />
                              Ver detalhes
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Edit className="w-4 h-4 mr-2" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive">
                              <Ban className="w-4 h-4 mr-2" />
                              Suspender
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
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
                      <Input
                        value={tiktokForm.username}
                        onChange={(e) =>
                          setTiktokForm({ ...tiktokForm, username: e.target.value })
                        }
                        placeholder="@usuario"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Seguidores</Label>
                        <Input
                          type="number"
                          value={tiktokForm.followers}
                          onChange={(e) =>
                            setTiktokForm({ ...tiktokForm, followers: e.target.value })
                          }
                          placeholder="10000"
                        />
                      </div>
                      <div>
                        <Label>Curtidas</Label>
                        <Input
                          type="number"
                          value={tiktokForm.likes}
                          onChange={(e) =>
                            setTiktokForm({ ...tiktokForm, likes: e.target.value })
                          }
                          placeholder="50000"
                        />
                      </div>
                    </div>
                    <div>
                      <Label>Nicho</Label>
                      <Input
                        value={tiktokForm.niche}
                        onChange={(e) =>
                          setTiktokForm({ ...tiktokForm, niche: e.target.value })
                        }
                        placeholder="Lifestyle, Gaming, etc."
                      />
                    </div>
                    <div>
                      <Label>Descrição</Label>
                      <Textarea
                        value={tiktokForm.description}
                        onChange={(e) =>
                          setTiktokForm({ ...tiktokForm, description: e.target.value })
                        }
                        placeholder="Descreva a conta..."
                      />
                    </div>
                    <div>
                      <Label>Preço (R$)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={tiktokForm.price}
                        onChange={(e) =>
                          setTiktokForm({ ...tiktokForm, price: e.target.value })
                        }
                        placeholder="299.90"
                      />
                    </div>
                    <Button
                      onClick={handleAddTikTokAccount}
                      className="w-full telegram-gradient text-white"
                    >
                      Adicionar Conta
                    </Button>
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
                      <Input
                        value={modelForm.name}
                        onChange={(e) =>
                          setModelForm({ ...modelForm, name: e.target.value })
                        }
                        placeholder="Nome do modelo"
                      />
                    </div>
                    <div>
                      <Label>Bio</Label>
                      <Textarea
                        value={modelForm.bio}
                        onChange={(e) =>
                          setModelForm({ ...modelForm, bio: e.target.value })
                        }
                        placeholder="Descrição do modelo..."
                      />
                    </div>
                    <div>
                      <Label>Nicho</Label>
                      <Input
                        value={modelForm.niche}
                        onChange={(e) =>
                          setModelForm({ ...modelForm, niche: e.target.value })
                        }
                        placeholder="Lifestyle, Fitness, etc."
                      />
                    </div>
                    <div>
                      <Label>Categoria</Label>
                      <select
                        value={modelForm.category}
                        onChange={(e) =>
                          setModelForm({ ...modelForm, category: e.target.value })
                        }
                        className="w-full p-2 rounded-md border border-input bg-background"
                      >
                        <option value="ia">Modelo IA</option>
                        <option value="black">Modelo Black</option>
                      </select>
                    </div>
                    <div>
                      <Label>Preço (R$)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={modelForm.price}
                        onChange={(e) =>
                          setModelForm({ ...modelForm, price: e.target.value })
                        }
                        placeholder="499.90"
                      />
                    </div>
                    <Button
                      onClick={handleAddModel}
                      className="w-full telegram-gradient text-white"
                    >
                      Adicionar Modelo
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </TabsContent>

          {/* Media Library Tab (Admin Only) */}
          <TabsContent value="media" className="space-y-4">
            <div className="text-center py-12">
              <p className="text-muted-foreground">
                Biblioteca de mídias de todos os usuários
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default AdminDashboardPage;
