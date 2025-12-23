import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
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
  Ban,
  Calendar,
  DollarSign,
  Filter,
  Trash2,
  Image,
  Upload,
  Shield,
  CheckCircle2,
  AlertTriangle,
  UserCog,
  RefreshCw,
  GitBranch,
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
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { AdminTemplatesPanel } from "@/components/admin/AdminTemplatesPanel";

interface Profile {
  id: string;
  user_id: string;
  email: string;
  full_name: string | null;
  phone: string | null;
  current_plan: string;
  is_online: boolean;
  is_suspended: boolean;
  last_seen_at: string;
  created_at: string;
}

interface Subscription {
  id: string;
  user_id: string;
  status: string;
  started_at: string;
  expires_at: string | null;
  plan: { name: string; slug: string } | null;
  profile?: { email: string; full_name: string | null } | null;
}

interface CheckoutSession {
  id: string;
  user_id: string;
  product_type: string;
  amount_cents: number;
  status: string;
  created_at: string;
  profile?: { email: string; full_name: string | null } | null;
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
  buyer_phone: string | null;
}

interface TikTokAccount {
  id: string;
  username: string;
  followers: number;
  likes: number;
  niche: string | null;
  price_cents: number;
  is_sold: boolean;
  image_url: string | null;
  deliverable_login: string | null;
  deliverable_password: string | null;
  deliverable_email: string | null;
  deliverable_notes: string | null;
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
  image_url: string | null;
  deliverable_link: string | null;
  deliverable_notes: string | null;
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
  media_files: any;
  created_at: string;
}

interface UserRole {
  id: string;
  user_id: string;
  role: string;
}

interface Stats {
  totalUsers: number;
  onlineUsers: number;
  offlineUsers: number;
  activeSubscriptions: number;
  pendingCheckouts: number;
  totalRevenue: number;
}

type BillingPeriod = "today" | "7days" | "15days" | "30days" | "all";

const AdminDashboardPage = () => {
  const navigate = useNavigate();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [checkouts, setCheckouts] = useState<CheckoutSession[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [tiktokAccounts, setTiktokAccounts] = useState<TikTokAccount[]>([]);
  const [models, setModels] = useState<ModelForSale[]>([]);
  const [adminMedia, setAdminMedia] = useState<AdminMedia[]>([]);
  const [userRoles, setUserRoles] = useState<UserRole[]>([]);
  const [plans, setPlans] = useState<{ id: string; slug: string; name: string }[]>([]);
  const [billingPeriod, setBillingPeriod] = useState<BillingPeriod>("30days");
  const [billingStats, setBillingStats] = useState({
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
  
  // Dialogs
  const [tiktokDialogOpen, setTiktokDialogOpen] = useState(false);
  const [modelDialogOpen, setModelDialogOpen] = useState(false);
  const [mediaDialogOpen, setMediaDialogOpen] = useState(false);
  const [planDialogOpen, setPlanDialogOpen] = useState(false);
  const [roleDialogOpen, setRoleDialogOpen] = useState(false);
  const [suspendDialogOpen, setSuspendDialogOpen] = useState(false);
  
  const [selectedUser, setSelectedUser] = useState<Profile | null>(null);
  const [selectedPlan, setSelectedPlan] = useState("");
  const [selectedRole, setSelectedRole] = useState("");
  
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  
  const { toast } = useToast();

  const [tiktokForm, setTiktokForm] = useState({
    username: "",
    followers: "",
    likes: "",
    description: "",
    niche: "",
    price: "",
    deliverable_login: "",
    deliverable_password: "",
    deliverable_email: "",
    deliverable_notes: "",
  });
  const [tiktokImageFile, setTiktokImageFile] = useState<File | null>(null);
  const tiktokImageInputRef = useRef<HTMLInputElement>(null);

  const [modelForm, setModelForm] = useState({
    name: "",
    bio: "",
    niche: "",
    category: "ia",
    price: "",
    deliverable_link: "",
    deliverable_notes: "",
  });
  const [modelImageFile, setModelImageFile] = useState<File | null>(null);
  const modelImageInputRef = useRef<HTMLInputElement>(null);

  const [mediaForm, setMediaForm] = useState({
    name: "",
    description: "",
    pack_type: "10k",
    min_plan: "basic",
  });
  const [mediaFiles, setMediaFiles] = useState<File[]>([]);
  const [mediaCoverFile, setMediaCoverFile] = useState<File | null>(null);
  const [isUploadingMedia, setIsUploadingMedia] = useState(false);
  const [isUploadingTiktok, setIsUploadingTiktok] = useState(false);
  const [isUploadingModel, setIsUploadingModel] = useState(false);
  const mediaFilesInputRef = useRef<HTMLInputElement>(null);
  const mediaCoverInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchAllData();

    const channel = supabase
      .channel("admin-data")
      .on("postgres_changes", { event: "*", schema: "public", table: "profiles" }, () => fetchData())
      .on("postgres_changes", { event: "*", schema: "public", table: "transactions" }, () => fetchTransactions())
      .on("postgres_changes", { event: "*", schema: "public", table: "subscriptions" }, () => fetchSubscriptions())
      .on("postgres_changes", { event: "*", schema: "public", table: "checkout_sessions" }, () => fetchCheckouts())
      .on("postgres_changes", { event: "*", schema: "public", table: "tiktok_accounts" }, () => fetchTikTokAccounts())
      .on("postgres_changes", { event: "*", schema: "public", table: "models_for_sale" }, () => fetchModels())
      .on("postgres_changes", { event: "*", schema: "public", table: "admin_media" }, () => fetchAdminMedia())
      .on("postgres_changes", { event: "*", schema: "public", table: "user_roles" }, () => fetchUserRoles())
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchAllData = async () => {
    await Promise.all([
      fetchData(),
      fetchTransactions(),
      fetchSubscriptions(),
      fetchCheckouts(),
      fetchTikTokAccounts(),
      fetchModels(),
      fetchAdminMedia(),
      fetchPlans(),
      fetchUserRoles(),
    ]);
  };

  const fetchPlans = async () => {
    const { data } = await supabase
      .from("plans")
      .select("id, slug, name")
      .eq("is_active", true)
      .order("price_cents", { ascending: true });
    setPlans(data || []);
  };

  const fetchUserRoles = async () => {
    const { data } = await supabase.from("user_roles").select("*");
    setUserRoles(data || []);
  };

  const fetchData = async () => {
    try {
      const { data: profilesData } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });

      const onlineUsers = profilesData?.filter((p) => p.is_online).length || 0;
      setProfiles(profilesData || []);
      
      // Update stats
      const { data: transactionsData } = await supabase
        .from("transactions")
        .select("amount_cents")
        .eq("status", "paid");
      
      const totalRevenue = transactionsData?.reduce((sum, t) => sum + (t.amount_cents || 0), 0) || 0;

      setStats((prev) => ({
        ...prev,
        totalUsers: profilesData?.length || 0,
        onlineUsers,
        offlineUsers: (profilesData?.length || 0) - onlineUsers,
        totalRevenue,
      }));
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchSubscriptions = async () => {
    const { data } = await supabase
      .from("subscriptions")
      .select("*, plan:plans(name, slug)")
      .eq("status", "active")
      .order("created_at", { ascending: false });
    
    // Fetch profiles for subscriptions
    if (data) {
      const userIds = data.map(s => s.user_id);
      const { data: profilesData } = await supabase
        .from("profiles")
        .select("user_id, email, full_name")
        .in("user_id", userIds);
      
      const profileMap = new Map(profilesData?.map(p => [p.user_id, p]));
      const enriched = data.map(s => ({ ...s, profile: profileMap.get(s.user_id) || null }));
      setSubscriptions(enriched);
      setStats(prev => ({ ...prev, activeSubscriptions: enriched.length }));
    }
  };

  const fetchCheckouts = async () => {
    const { data } = await supabase
      .from("checkout_sessions")
      .select("*")
      .eq("status", "pending")
      .order("created_at", { ascending: false });
    
    if (data) {
      const userIds = data.map(c => c.user_id);
      const { data: profilesData } = await supabase
        .from("profiles")
        .select("user_id, email, full_name")
        .in("user_id", userIds);
      
      const profileMap = new Map(profilesData?.map(p => [p.user_id, p]));
      const enriched = data.map(c => ({ ...c, profile: profileMap.get(c.user_id) || null }));
      setCheckouts(enriched);
      setStats(prev => ({ ...prev, pendingCheckouts: enriched.length }));
    }
  };

  const fetchTransactions = async () => {
    const { data } = await supabase
      .from("transactions")
      .select("*")
      .eq("status", "paid")
      .order("created_at", { ascending: false });

    if (data) {
      setTransactions(data);
      calculateBillingStats(data);
    }
  };

  const fetchTikTokAccounts = async () => {
    const { data } = await supabase
      .from("tiktok_accounts")
      .select("*")
      .order("created_at", { ascending: false });
    setTiktokAccounts(data || []);
  };

  const fetchModels = async () => {
    const { data } = await supabase
      .from("models_for_sale")
      .select("*")
      .order("created_at", { ascending: false });
    setModels(data || []);
  };

  const fetchAdminMedia = async () => {
    const { data } = await supabase
      .from("admin_media")
      .select("*")
      .order("created_at", { ascending: false });
    setAdminMedia(data || []);
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
        case "today": return txDate >= today;
        case "7days": return txDate >= new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
        case "15days": return txDate >= new Date(today.getTime() - 15 * 24 * 60 * 60 * 1000);
        case "30days": return txDate >= new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
        default: return true;
      }
    });
  };

  const handleUploadImage = async (file: File, bucket: string): Promise<string | null> => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${fileExt}`;
      const filePath = fileName;

      const { error } = await supabase.storage
        .from(bucket)
        .upload(filePath, file);

      if (error) throw error;

      const { data } = supabase.storage.from(bucket).getPublicUrl(filePath);
      return data.publicUrl;
    } catch (error: any) {
      toast({ title: "Erro no upload", description: error.message, variant: "destructive" });
      return null;
    }
  };

  const handleAddTikTokAccount = async () => {
    setIsUploadingTiktok(true);
    try {
      let imageUrl: string | null = null;
      if (tiktokImageFile) {
        imageUrl = await handleUploadImage(tiktokImageFile, "product-images");
      }

      const { error } = await supabase.from("tiktok_accounts").insert({
        username: tiktokForm.username,
        followers: parseInt(tiktokForm.followers) || 0,
        likes: parseInt(tiktokForm.likes) || 0,
        description: tiktokForm.description,
        niche: tiktokForm.niche,
        price_cents: Math.round(parseFloat(tiktokForm.price) * 100),
        image_url: imageUrl,
        deliverable_login: tiktokForm.deliverable_login || null,
        deliverable_password: tiktokForm.deliverable_password || null,
        deliverable_email: tiktokForm.deliverable_email || null,
        deliverable_notes: tiktokForm.deliverable_notes || null,
      });

      if (error) throw error;

      toast({ title: "Conta adicionada!", description: `@${tiktokForm.username} foi adicionada.` });
      setTiktokForm({
        username: "", followers: "", likes: "", description: "", niche: "", price: "",
        deliverable_login: "", deliverable_password: "", deliverable_email: "", deliverable_notes: "",
      });
      setTiktokImageFile(null);
      setTiktokDialogOpen(false);
    } catch (error: any) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } finally {
      setIsUploadingTiktok(false);
    }
  };

  const handleDeleteTikTokAccount = async (id: string) => {
    const { error } = await supabase.from("tiktok_accounts").delete().eq("id", id);
    if (!error) toast({ title: "Conta removida!" });
  };

  const handleAddModel = async () => {
    setIsUploadingModel(true);
    try {
      let imageUrl: string | null = null;
      if (modelImageFile) {
        imageUrl = await handleUploadImage(modelImageFile, "product-images");
      }

      const { error } = await supabase.from("models_for_sale").insert({
        name: modelForm.name,
        bio: modelForm.bio,
        niche: modelForm.niche,
        category: modelForm.category,
        price_cents: Math.round(parseFloat(modelForm.price) * 100),
        image_url: imageUrl,
        deliverable_link: modelForm.deliverable_link || null,
        deliverable_notes: modelForm.deliverable_notes || null,
      });

      if (error) throw error;

      toast({ title: "Modelo adicionado!", description: `${modelForm.name} foi adicionado.` });
      setModelForm({
        name: "", bio: "", niche: "", category: "ia", price: "",
        deliverable_link: "", deliverable_notes: "",
      });
      setModelImageFile(null);
      setModelDialogOpen(false);
    } catch (error: any) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } finally {
      setIsUploadingModel(false);
    }
  };

  const handleDeleteModel = async (id: string) => {
    const { error } = await supabase.from("models_for_sale").delete().eq("id", id);
    if (!error) toast({ title: "Modelo removido!" });
  };

  const handleAddMedia = async () => {
    if (!mediaForm.name) {
      toast({ title: "Erro", description: "Nome do pacote é obrigatório", variant: "destructive" });
      return;
    }

    setIsUploadingMedia(true);
    try {
      // Upload cover image if provided
      let coverUrl: string | null = null;
      if (mediaCoverFile) {
        coverUrl = await handleUploadImage(mediaCoverFile, "product-images");
      }

      // Upload media files
      const uploadedFiles: { name: string; url: string; type: string; size: number }[] = [];
      for (const file of mediaFiles) {
        const fileExt = file.name.split('.').pop();
        const fileName = `media/${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from("media-packs")
          .upload(fileName, file);

        if (uploadError) {
          console.error("Upload error:", uploadError);
          continue;
        }

        const { data: urlData } = supabase.storage.from("media-packs").getPublicUrl(fileName);
        uploadedFiles.push({
          name: file.name,
          url: urlData.publicUrl,
          type: file.type,
          size: file.size,
        });
      }

      const { error } = await supabase.from("admin_media").insert({
        name: mediaForm.name,
        description: mediaForm.description,
        pack_type: mediaForm.pack_type,
        min_plan: mediaForm.min_plan,
        file_count: uploadedFiles.length,
        image_url: coverUrl,
        media_files: uploadedFiles,
      });

      if (error) throw error;

      toast({ title: "Pacote adicionado!", description: `${mediaForm.name} foi adicionado com ${uploadedFiles.length} arquivos.` });
      setMediaForm({ name: "", description: "", pack_type: "10k", min_plan: "basic" });
      setMediaFiles([]);
      setMediaCoverFile(null);
      setMediaDialogOpen(false);
    } catch (error: any) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } finally {
      setIsUploadingMedia(false);
    }
  };

  const handleDeleteMedia = async (id: string) => {
    const { error } = await supabase.from("admin_media").delete().eq("id", id);
    if (!error) toast({ title: "Pacote removido!" });
  };

  const handleChangePlan = async () => {
    if (!selectedUser || !selectedPlan) return;
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ current_plan: selectedPlan as any })
        .eq("user_id", selectedUser.user_id);

      if (error) throw error;

      toast({ title: "Plano alterado!", description: `${selectedUser.email} agora está no plano ${selectedPlan}.` });
      setPlanDialogOpen(false);
      setSelectedUser(null);
      setSelectedPlan("");
      fetchData();
    } catch (error: any) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    }
  };

  const handleChangeRole = async () => {
    if (!selectedUser || !selectedRole) return;
    try {
      // Remove existing role if any
      await supabase.from("user_roles").delete().eq("user_id", selectedUser.user_id);
      
      // Add new role
      const { error } = await supabase.from("user_roles").insert({
        user_id: selectedUser.user_id,
        role: selectedRole as any,
      });

      if (error) throw error;

      toast({ title: "Cargo alterado!", description: `${selectedUser.email} agora é ${selectedRole}.` });
      setRoleDialogOpen(false);
      setSelectedUser(null);
      setSelectedRole("");
      fetchUserRoles();
    } catch (error: any) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    }
  };

  const handleSuspendUser = async () => {
    if (!selectedUser) return;
    try {
      const newStatus = !selectedUser.is_suspended;
      const { error } = await supabase
        .from("profiles")
        .update({ is_suspended: newStatus })
        .eq("user_id", selectedUser.user_id);

      if (error) throw error;

      toast({
        title: newStatus ? "Usuário suspenso" : "Usuário reativado",
        description: `${selectedUser.email} foi ${newStatus ? "suspenso" : "reativado"}.`,
      });
      setSuspendDialogOpen(false);
      setSelectedUser(null);
      fetchData();
    } catch (error: any) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    }
  };

  const getUserRole = (userId: string) => {
    return userRoles.find(r => r.user_id === userId)?.role || "user";
  };

  const formatPrice = (cents: number) => {
    return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(cents / 100);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("pt-BR", {
      day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit",
    });
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
    if (num >= 1000) return (num / 1000).toFixed(1) + "K";
    return num.toString();
  };

  const filteredProfiles = profiles.filter(
    (p) => p.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
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
    today: "Hoje", "7days": "Últimos 7 dias", "15days": "Últimos 15 dias", "30days": "Últimos 30 dias", all: "Todo período",
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
          <TabsList className="flex-wrap">
            <TabsTrigger value="users">Usuários</TabsTrigger>
            <TabsTrigger value="subscriptions">Assinaturas</TabsTrigger>
            <TabsTrigger value="checkouts">Checkouts</TabsTrigger>
            <TabsTrigger value="billing">Faturamento</TabsTrigger>
            <TabsTrigger value="media">Mídias</TabsTrigger>
            <TabsTrigger value="tiktok">Contas TikTok</TabsTrigger>
            <TabsTrigger value="models">Modelos</TabsTrigger>
            <TabsTrigger value="templates" className="flex items-center gap-1">
              <GitBranch className="h-4 w-4" />
              Templates Funis
            </TabsTrigger>
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

            <div className="glass-card overflow-hidden overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Status</TableHead>
                    <TableHead>Usuário</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Telefone</TableHead>
                    <TableHead>Plano</TableHead>
                    <TableHead>Cargo</TableHead>
                    <TableHead>Último Acesso</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProfiles.map((profile) => (
                    <TableRow key={profile.id} className={profile.is_suspended ? "opacity-50" : ""}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${profile.is_online ? "bg-success" : "bg-muted-foreground"}`} />
                          <span className="text-sm">{profile.is_online ? "Online" : "Offline"}</span>
                          {profile.is_suspended && <Badge variant="destructive" className="text-xs">Suspenso</Badge>}
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">{profile.full_name || "—"}</TableCell>
                      <TableCell>{profile.email}</TableCell>
                      <TableCell>
                        {profile.phone ? (
                          <a 
                            href={`https://wa.me/${profile.phone.replace(/\D/g, '')}`} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-success hover:underline"
                          >
                            {profile.phone}
                          </a>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={profile.current_plan === "free" ? "secondary" : "default"} className="capitalize">
                          {profile.current_plan}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">
                          {getUserRole(profile.user_id)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{formatDate(profile.last_seen_at)}</TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon"><MoreVertical className="w-4 h-4" /></Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => navigate(`/admin/user/${profile.user_id}`)}>
                              <Eye className="w-4 h-4 mr-2" />Ver detalhes
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => { setSelectedUser(profile); setSelectedPlan(profile.current_plan); setPlanDialogOpen(true); }}>
                              <CreditCard className="w-4 h-4 mr-2" />Alterar Plano
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => { setSelectedUser(profile); setSelectedRole(getUserRole(profile.user_id)); setRoleDialogOpen(true); }}>
                              <UserCog className="w-4 h-4 mr-2" />Alterar Cargo
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className={profile.is_suspended ? "text-success" : "text-destructive"}
                              onClick={() => { setSelectedUser(profile); setSuspendDialogOpen(true); }}
                            >
                              {profile.is_suspended ? (
                                <><CheckCircle2 className="w-4 h-4 mr-2" />Reativar</>
                              ) : (
                                <><Ban className="w-4 h-4 mr-2" />Suspender</>
                              )}
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

          {/* Subscriptions Tab */}
          <TabsContent value="subscriptions" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5" />
                  Assinaturas Ativas ({subscriptions.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {subscriptions.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <CreditCard className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p>Nenhuma assinatura ativa</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Usuário</TableHead>
                        <TableHead>Plano</TableHead>
                        <TableHead>Início</TableHead>
                        <TableHead>Expira em</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {subscriptions.map((sub) => (
                        <TableRow key={sub.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium">{sub.profile?.full_name || "—"}</p>
                              <p className="text-sm text-muted-foreground">{sub.profile?.email}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge>{sub.plan?.name || "—"}</Badge>
                          </TableCell>
                          <TableCell>{sub.started_at ? formatDate(sub.started_at) : "—"}</TableCell>
                          <TableCell>{sub.expires_at ? formatDate(sub.expires_at) : "Sem expiração"}</TableCell>
                          <TableCell>
                            <Badge className="bg-success">Ativa</Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Checkouts Tab */}
          <TabsContent value="checkouts" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShoppingCart className="w-5 h-5" />
                  Checkouts Pendentes ({checkouts.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {checkouts.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <ShoppingCart className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p>Nenhum checkout pendente</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Usuário</TableHead>
                        <TableHead>Produto</TableHead>
                        <TableHead>Valor</TableHead>
                        <TableHead>Criado em</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {checkouts.map((checkout) => (
                        <TableRow key={checkout.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium">{checkout.profile?.full_name || "—"}</p>
                              <p className="text-sm text-muted-foreground">{checkout.profile?.email}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="capitalize">{checkout.product_type}</Badge>
                          </TableCell>
                          <TableCell className="font-semibold">{formatPrice(checkout.amount_cents)}</TableCell>
                          <TableCell>{formatDate(checkout.created_at)}</TableCell>
                          <TableCell>
                            <Badge variant="secondary" className="gap-1">
                              <AlertTriangle className="w-3 h-3" />Pendente
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

          {/* Billing Tab */}
          <TabsContent value="billing" className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {(["today", "7days", "15days", "30days", "all"] as BillingPeriod[]).map((period) => (
                <Card
                  key={period}
                  className={`cursor-pointer transition-all ${billingPeriod === period ? "border-telegram" : ""}`}
                  onClick={() => setBillingPeriod(period)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      {period === "all" ? <DollarSign className="w-4 h-4 text-muted-foreground" /> : <Calendar className="w-4 h-4 text-muted-foreground" />}
                      <span className="text-sm text-muted-foreground">{billingPeriodLabels[period]}</span>
                    </div>
                    <p className="text-xl font-bold">
                      {formatPrice(period === "today" ? billingStats.today : period === "7days" ? billingStats.last7Days : period === "15days" ? billingStats.last15Days : period === "30days" ? billingStats.last30Days : billingStats.allTime)}
                    </p>
                  </CardContent>
                </Card>
              ))}
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
                    <p>Nenhuma transação no período</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Data</TableHead>
                        <TableHead>Comprador</TableHead>
                        <TableHead>Telefone</TableHead>
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
                            {tx.buyer_phone ? (
                              <a 
                                href={`https://wa.me/${tx.buyer_phone.replace(/\D/g, '')}`} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-success hover:underline"
                              >
                                {tx.buyer_phone}
                              </a>
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </TableCell>
                          <TableCell><Badge variant="outline" className="capitalize">{tx.product_type}</Badge></TableCell>
                          <TableCell className="font-semibold">{formatPrice(tx.amount_cents)}</TableCell>
                          <TableCell><Badge className="bg-success">Pago</Badge></TableCell>
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
                    <Plus className="w-4 h-4" />Adicionar Pacote
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
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
                    
                    {/* Cover Image Upload */}
                    <div>
                      <Label>Imagem de Capa</Label>
                      <input
                        type="file"
                        ref={mediaCoverInputRef}
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) setMediaCoverFile(file);
                        }}
                      />
                      <div className="mt-2">
                        {mediaCoverFile ? (
                          <div className="flex items-center gap-2 p-2 bg-secondary/50 rounded-lg">
                            <Image className="w-4 h-4" />
                            <span className="text-sm flex-1 truncate">{mediaCoverFile.name}</span>
                            <Button variant="ghost" size="sm" onClick={() => setMediaCoverFile(null)}>
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        ) : (
                          <Button variant="outline" className="w-full" onClick={() => mediaCoverInputRef.current?.click()}>
                            <Upload className="w-4 h-4 mr-2" />
                            Selecionar Imagem de Capa
                          </Button>
                        )}
                      </div>
                    </div>

                    {/* Media Files Upload */}
                    <div>
                      <Label>Arquivos de Mídia</Label>
                      <input
                        type="file"
                        ref={mediaFilesInputRef}
                        accept="image/*,video/*"
                        multiple
                        className="hidden"
                        onChange={(e) => {
                          const files = Array.from(e.target.files || []);
                          setMediaFiles(prev => [...prev, ...files]);
                        }}
                      />
                      <div className="mt-2 space-y-2">
                        <Button variant="outline" className="w-full" onClick={() => mediaFilesInputRef.current?.click()}>
                          <Upload className="w-4 h-4 mr-2" />
                          Adicionar Arquivos ({mediaFiles.length} selecionados)
                        </Button>
                        
                        {mediaFiles.length > 0 && (
                          <div className="max-h-40 overflow-y-auto space-y-1 p-2 bg-secondary/30 rounded-lg">
                            {mediaFiles.map((file, index) => (
                              <div key={index} className="flex items-center gap-2 text-sm p-1 bg-background/50 rounded">
                                <Image className="w-3 h-3" />
                                <span className="flex-1 truncate">{file.name}</span>
                                <span className="text-muted-foreground text-xs">{(file.size / 1024 / 1024).toFixed(2)} MB</span>
                                <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => setMediaFiles(prev => prev.filter((_, i) => i !== index))}>
                                  <Trash2 className="w-3 h-3" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <Button 
                      onClick={handleAddMedia} 
                      className="w-full telegram-gradient text-white"
                      disabled={isUploadingMedia || !mediaForm.name}
                    >
                      {isUploadingMedia ? (
                        <>
                          <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                          Enviando...
                        </>
                      ) : (
                        "Adicionar Pacote"
                      )}
                    </Button>
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
                      <TableCell><Badge variant="default">{media.pack_type}</Badge></TableCell>
                      <TableCell><Badge variant="outline" className="capitalize">{media.min_plan}</Badge></TableCell>
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
                        <p>Nenhum pacote cadastrado</p>
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
                    <Plus className="w-4 h-4" />Adicionar Conta
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
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
                    <div>
                      <Label>Foto da Conta</Label>
                      <input
                        type="file"
                        ref={tiktokImageInputRef}
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) setTiktokImageFile(file);
                        }}
                      />
                      <div className="mt-2">
                        {tiktokImageFile ? (
                          <div className="flex items-center gap-2 p-2 bg-secondary/50 rounded-lg">
                            <Image className="w-4 h-4" />
                            <span className="text-sm flex-1 truncate">{tiktokImageFile.name}</span>
                            <Button variant="ghost" size="sm" onClick={() => setTiktokImageFile(null)}>
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        ) : (
                          <Button variant="outline" className="w-full" onClick={() => tiktokImageInputRef.current?.click()}>
                            <Upload className="w-4 h-4 mr-2" />
                            Selecionar Foto
                          </Button>
                        )}
                      </div>
                    </div>
                    
                    <div className="border-t pt-4 mt-4">
                      <h4 className="font-semibold mb-3 flex items-center gap-2">
                        <Shield className="w-4 h-4" />
                        Dados para Entrega (após pagamento)
                      </h4>
                      <div className="space-y-3">
                        <div>
                          <Label>Login</Label>
                          <Input value={tiktokForm.deliverable_login} onChange={(e) => setTiktokForm({ ...tiktokForm, deliverable_login: e.target.value })} placeholder="login@email.com" />
                        </div>
                        <div>
                          <Label>Senha</Label>
                          <Input type="password" value={tiktokForm.deliverable_password} onChange={(e) => setTiktokForm({ ...tiktokForm, deliverable_password: e.target.value })} placeholder="••••••••" />
                        </div>
                        <div>
                          <Label>Email vinculado</Label>
                          <Input value={tiktokForm.deliverable_email} onChange={(e) => setTiktokForm({ ...tiktokForm, deliverable_email: e.target.value })} placeholder="email@vinculado.com" />
                        </div>
                        <div>
                          <Label>Notas adicionais</Label>
                          <Textarea value={tiktokForm.deliverable_notes} onChange={(e) => setTiktokForm({ ...tiktokForm, deliverable_notes: e.target.value })} placeholder="Instruções para o comprador..." />
                        </div>
                      </div>
                    </div>
                    
                    <Button onClick={handleAddTikTokAccount} className="w-full telegram-gradient text-white">Adicionar Conta</Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            <div className="glass-card overflow-hidden overflow-x-auto">
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
                    <Plus className="w-4 h-4" />Adicionar Modelo
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
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
                    <div>
                      <Label>Foto do Modelo</Label>
                      <input
                        type="file"
                        ref={modelImageInputRef}
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) setModelImageFile(file);
                        }}
                      />
                      <div className="mt-2">
                        {modelImageFile ? (
                          <div className="flex items-center gap-2 p-2 bg-secondary/50 rounded-lg">
                            <Image className="w-4 h-4" />
                            <span className="text-sm flex-1 truncate">{modelImageFile.name}</span>
                            <Button variant="ghost" size="sm" onClick={() => setModelImageFile(null)}>
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        ) : (
                          <Button variant="outline" className="w-full" onClick={() => modelImageInputRef.current?.click()}>
                            <Upload className="w-4 h-4 mr-2" />
                            Selecionar Foto
                          </Button>
                        )}
                      </div>
                    </div>
                    
                    <div className="border-t pt-4 mt-4">
                      <h4 className="font-semibold mb-3 flex items-center gap-2">
                        <Shield className="w-4 h-4" />
                        Dados para Entrega (após pagamento)
                      </h4>
                      <div className="space-y-3">
                        <div>
                          <Label>Link de Acesso</Label>
                          <Input value={modelForm.deliverable_link} onChange={(e) => setModelForm({ ...modelForm, deliverable_link: e.target.value })} placeholder="https://drive.google.com/..." />
                        </div>
                        <div>
                          <Label>Notas/Instruções</Label>
                          <Textarea value={modelForm.deliverable_notes} onChange={(e) => setModelForm({ ...modelForm, deliverable_notes: e.target.value })} placeholder="Instruções para o comprador..." />
                        </div>
                      </div>
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
                      <TableCell><Badge variant="outline" className="capitalize">{model.category}</Badge></TableCell>
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

          {/* Templates Tab */}
          <TabsContent value="templates" className="space-y-4">
            <AdminTemplatesPanel />
          </TabsContent>
        </Tabs>

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
                  <SelectTrigger className="mt-1"><SelectValue placeholder="Selecione um plano" /></SelectTrigger>
                  <SelectContent>
                    {plans.map((plan) => (
                      <SelectItem key={plan.id} value={plan.slug}>{plan.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleChangePlan} className="w-full telegram-gradient text-white" disabled={!selectedPlan || selectedPlan === selectedUser?.current_plan}>
                Confirmar Alteração
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Role Change Dialog */}
        <Dialog open={roleDialogOpen} onOpenChange={setRoleDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Alterar Cargo do Usuário</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Usuário</Label>
                <p className="text-sm text-muted-foreground">{selectedUser?.email}</p>
              </div>
              <div>
                <Label>Novo Cargo</Label>
                <Select value={selectedRole} onValueChange={setSelectedRole}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="Selecione um cargo" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user">Usuário</SelectItem>
                    <SelectItem value="vendor">Vendedor</SelectItem>
                    <SelectItem value="admin">Administrador</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleChangeRole} className="w-full telegram-gradient text-white" disabled={!selectedRole}>
                Confirmar Alteração
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Suspend User Dialog */}
        <AlertDialog open={suspendDialogOpen} onOpenChange={setSuspendDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                {selectedUser?.is_suspended ? "Reativar Usuário?" : "Suspender Usuário?"}
              </AlertDialogTitle>
              <AlertDialogDescription>
                {selectedUser?.is_suspended
                  ? `Deseja reativar o acesso de ${selectedUser?.email}?`
                  : `Deseja suspender o acesso de ${selectedUser?.email}? O usuário não poderá mais acessar a plataforma.`}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleSuspendUser}
                className={selectedUser?.is_suspended ? "bg-success hover:bg-success/90" : "bg-destructive hover:bg-destructive/90"}
              >
                {selectedUser?.is_suspended ? "Reativar" : "Suspender"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </DashboardLayout>
  );
};

export default AdminDashboardPage;
