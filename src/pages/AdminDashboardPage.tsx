import { useState, useEffect, useRef, useMemo } from "react";
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
  Settings,
  Target,
  Megaphone,
  Sparkles,
  Video,
  Clock,
  History,
  Phone,
  Mail,
  User,
  MessageSquare,
  Store,
  Percent,
  Bell,
  Share2,
  Edit2,
  Gift,
  ArrowRightLeft,
  Copy,
  Link,
  ExternalLink,
  Server,
  Terminal,
} from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, Legend } from "recharts";
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
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { AdminTemplatesPanel } from "@/components/admin/AdminTemplatesPanel";
import { AdminNotificationsPanel } from "@/components/admin/AdminNotificationsPanel";
import { AdminBannersPanel } from "@/components/admin/AdminBannersPanel";
import AdminAutomationPanel from "@/components/admin/AdminAutomationPanel";
import { BulkMediaUploader } from "@/components/admin/BulkMediaUploader";
import AdminReferralsPanel from "@/components/admin/AdminReferralsPanel";
import AdminSystemConfigPanel from "@/components/admin/AdminSystemConfigPanel";
import AdminTIPanel from "@/components/admin/AdminTIPanel";
import AdminAccountManagersPanel from "@/components/admin/AdminAccountManagersPanel";
import { useAdminSettings, getSettingLabel } from "@/hooks/useAdminSettings";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

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
  buyer_document: string | null;
  is_admin_granted: boolean | null;
}

interface TikTokAccount {
  id: string;
  username: string;
  followers: number;
  likes: number;
  niche: string | null;
  description: string | null;
  price_cents: number;
  is_sold: boolean;
  image_url: string | null;
  deliverable_login: string | null;
  deliverable_password: string | null;
  deliverable_email: string | null;
  deliverable_notes: string | null;
  created_at: string;
  created_by: string | null;
}

interface InstagramAccount {
  id: string;
  username: string;
  followers: number;
  following: number;
  posts_count: number;
  engagement_rate: number;
  niche: string | null;
  description: string | null;
  price_cents: number;
  is_sold: boolean;
  is_verified: boolean;
  image_url: string | null;
  deliverable_login: string | null;
  deliverable_password: string | null;
  deliverable_email: string | null;
  deliverable_notes: string | null;
  created_at: string;
  created_by: string | null;
}

interface TelegramGroup {
  id: string;
  group_name: string;
  group_username: string | null;
  members_count: number;
  description: string | null;
  niche: string | null;
  price_cents: number;
  is_verified: boolean;
  is_sold: boolean;
  image_url: string | null;
  group_type: string;
  deliverable_info: string | null;
  deliverable_notes: string | null;
  deliverable_invite_link: string | null;
  created_at: string;
  created_by: string | null;
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
  created_by: string | null;
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

interface VendorSale {
  id: string;
  vendor_id: string;
  buyer_id: string;
  item_type: string;
  item_id: string;
  sale_amount_cents: number;
  vendor_commission_cents: number;
  platform_fee_cents: number;
  status: string;
  created_at: string;
  vendor_profile?: { email: string; full_name: string | null } | null;
}

interface SmartLinkPage {
  id: string;
  user_id: string;
  slug: string;
  title: string;
  description: string | null;
  is_active: boolean;
  total_views: number;
  created_at: string;
  user_email?: string;
}

interface Stats {
  totalUsers: number;
  onlineUsers: number;
  offlineUsers: number;
  activeSubscriptions: number;
  pendingCheckouts: number;
  pendingTransactions: number;
  paidTransactions: number;
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
  const [instagramAccounts, setInstagramAccounts] = useState<InstagramAccount[]>([]);
  const [telegramGroups, setTelegramGroups] = useState<TelegramGroup[]>([]);
  const [models, setModels] = useState<ModelForSale[]>([]);
  const [adminMedia, setAdminMedia] = useState<AdminMedia[]>([]);
  const [userRoles, setUserRoles] = useState<UserRole[]>([]);
  const [vendorSales, setVendorSales] = useState<VendorSale[]>([]);
  const [vendorSalesFilter, setVendorSalesFilter] = useState<string>("all");
  const [vendorProductsFilter, setVendorProductsFilter] = useState<string>("all");
  const [vendorCommissionPercent, setVendorCommissionPercent] = useState(80);
  
  // Reseller products (separate from admin products)
  const [resellerInstagramAccounts, setResellerInstagramAccounts] = useState<InstagramAccount[]>([]);
  const [resellerTiktokAccounts, setResellerTiktokAccounts] = useState<TikTokAccount[]>([]);
  const [resellerTelegramGroups, setResellerTelegramGroups] = useState<TelegramGroup[]>([]);
  const [resellerModels, setResellerModels] = useState<ModelForSale[]>([]);
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
    pendingTransactions: 0,
    paidTransactions: 0,
    totalRevenue: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Dialogs
  const [tiktokDialogOpen, setTiktokDialogOpen] = useState(false);
  const [telegramGroupDialogOpen, setTelegramGroupDialogOpen] = useState(false);
  const [modelDialogOpen, setModelDialogOpen] = useState(false);
  const [mediaDialogOpen, setMediaDialogOpen] = useState(false);
  const [editMediaDialogOpen, setEditMediaDialogOpen] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState<AdminMedia | null>(null);
  const [editMediaName, setEditMediaName] = useState("");
  const [editMediaDescription, setEditMediaDescription] = useState("");
  const [editMediaPackType, setEditMediaPackType] = useState("10k");
  const [editMediaMinPlan, setEditMediaMinPlan] = useState("basic");
  const [editMediaCoverFile, setEditMediaCoverFile] = useState<File | null>(null);
  const [editMediaCoverPreview, setEditMediaCoverPreview] = useState<string | null>(null);
  const editMediaCoverInputRef = useRef<HTMLInputElement>(null);
  
  // Transfer media dialog state
  const [transferMediaDialogOpen, setTransferMediaDialogOpen] = useState(false);
  const [transferSourceMedia, setTransferSourceMedia] = useState<AdminMedia | null>(null);
  const [transferTargetMediaId, setTransferTargetMediaId] = useState<string>("");
  const [transferQuantity, setTransferQuantity] = useState<string>("");
  const [transferMode, setTransferMode] = useState<"move" | "copy">("copy");
  const [isTransferring, setIsTransferring] = useState(false);
  
  const [planDialogOpen, setPlanDialogOpen] = useState(false);
  const [roleDialogOpen, setRoleDialogOpen] = useState(false);
  const [suspendDialogOpen, setSuspendDialogOpen] = useState(false);
  
  // Edit reseller products dialogs
  const [editResellerInstagramDialogOpen, setEditResellerInstagramDialogOpen] = useState(false);
  const [editResellerTiktokDialogOpen, setEditResellerTiktokDialogOpen] = useState(false);
  const [editResellerTelegramDialogOpen, setEditResellerTelegramDialogOpen] = useState(false);
  const [editResellerModelDialogOpen, setEditResellerModelDialogOpen] = useState(false);
  const [selectedResellerInstagram, setSelectedResellerInstagram] = useState<InstagramAccount | null>(null);
  const [selectedResellerTiktok, setSelectedResellerTiktok] = useState<TikTokAccount | null>(null);
  const [selectedResellerTelegram, setSelectedResellerTelegram] = useState<TelegramGroup | null>(null);
  const [selectedResellerModel, setSelectedResellerModel] = useState<ModelForSale | null>(null);
  
  const [selectedUser, setSelectedUser] = useState<Profile | null>(null);
  const [selectedPlan, setSelectedPlan] = useState("");
  const [selectedRole, setSelectedRole] = useState("");
  
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  
  const { toast } = useToast();
  const { settings: adminSettings, updateSetting, history: settingsHistory, isLoadingHistory } = useAdminSettings();

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
    category: "black",
    price: "",
    deliverable_link: "",
    deliverable_notes: "",
  });
  const [modelImageFile, setModelImageFile] = useState<File | null>(null);
  const modelImageInputRef = useRef<HTMLInputElement>(null);
  const [modelFunnelFile, setModelFunnelFile] = useState<File | null>(null);
  const [modelFunnelJson, setModelFunnelJson] = useState<any>(null);
  const modelFunnelInputRef = useRef<HTMLInputElement>(null);

  const [mediaForm, setMediaForm] = useState({
    name: "",
    description: "",
    pack_type: "10k",
    min_plan: "basic",
  });
  const [mediaFiles, setMediaFiles] = useState<File[]>([]);
  const [mediaCoverFile, setMediaCoverFile] = useState<File | null>(null);
  const [isUploadingMedia, setIsUploadingMedia] = useState(false);
  const [bulkUploadedFiles, setBulkUploadedFiles] = useState<{ name: string; url: string; type: string; size: number }[]>([]);
  const [bulkFilesCount, setBulkFilesCount] = useState(0);
  const [isUploadingTiktok, setIsUploadingTiktok] = useState(false);
  const [isUploadingModel, setIsUploadingModel] = useState(false);
  const [isUploadingTelegramGroup, setIsUploadingTelegramGroup] = useState(false);
  const mediaFilesInputRef = useRef<HTMLInputElement>(null);
  const mediaCoverInputRef = useRef<HTMLInputElement>(null);
  
  const [telegramGroupForm, setTelegramGroupForm] = useState({
    group_name: "",
    group_username: "",
    members_count: "",
    description: "",
    niche: "",
    price: "",
    group_type: "group",
    deliverable_invite_link: "",
    deliverable_notes: "",
  });
  const [telegramGroupImageFile, setTelegramGroupImageFile] = useState<File | null>(null);
  const telegramGroupImageInputRef = useRef<HTMLInputElement>(null);

  // Instagram form state
  const [instagramDialogOpen, setInstagramDialogOpen] = useState(false);
  const [isUploadingInstagram, setIsUploadingInstagram] = useState(false);
  const [instagramForm, setInstagramForm] = useState({
    username: "",
    followers: "",
    following: "",
    posts_count: "",
    engagement_rate: "",
    description: "",
    niche: "",
    price: "",
    is_verified: false,
    deliverable_login: "",
    deliverable_password: "",
    deliverable_email: "",
    deliverable_notes: "",
  });
  const [instagramImageFile, setInstagramImageFile] = useState<File | null>(null);
  const instagramImageInputRef = useRef<HTMLInputElement>(null);

  // Smart Link URL settings
  const [smartLinkBaseUrl, setSmartLinkBaseUrl] = useState("");
  const [smartLinkBaseUrlInput, setSmartLinkBaseUrlInput] = useState("");
  const [isSavingSmartLinkUrl, setIsSavingSmartLinkUrl] = useState(false);
  const [smartLinkPages, setSmartLinkPages] = useState<SmartLinkPage[]>([]);
  const [smartLinkSearchQuery, setSmartLinkSearchQuery] = useState("");

  useEffect(() => {
    fetchAllData();

    const channel = supabase
      .channel("admin-data")
      .on("postgres_changes", { event: "*", schema: "public", table: "profiles" }, () => fetchData())
      .on("postgres_changes", { event: "*", schema: "public", table: "transactions" }, () => fetchTransactions())
      .on("postgres_changes", { event: "*", schema: "public", table: "subscriptions" }, () => fetchSubscriptions())
      .on("postgres_changes", { event: "*", schema: "public", table: "checkout_sessions" }, () => fetchCheckouts())
      .on("postgres_changes", { event: "*", schema: "public", table: "tiktok_accounts" }, () => fetchTikTokAccounts())
      .on("postgres_changes", { event: "*", schema: "public", table: "instagram_accounts" }, () => fetchInstagramAccounts())
      .on("postgres_changes", { event: "*", schema: "public", table: "telegram_groups" }, () => fetchTelegramGroups())
      .on("postgres_changes", { event: "*", schema: "public", table: "models_for_sale" }, () => fetchModels())
      .on("postgres_changes", { event: "*", schema: "public", table: "admin_media" }, () => fetchAdminMedia())
      .on("postgres_changes", { event: "*", schema: "public", table: "user_roles" }, () => fetchUserRoles())
      .on("postgres_changes", { event: "*", schema: "public", table: "vendor_sales" }, () => fetchVendorSales())
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
      fetchInstagramAccounts(),
      fetchTelegramGroups(),
      fetchModels(),
      fetchAdminMedia(),
      fetchPlans(),
      fetchUserRoles(),
      fetchVendorSales(),
      fetchResellerProducts(),
      fetchSmartLinkBaseUrl(),
      fetchSmartLinkPages(),
    ]);
  };

  const fetchSmartLinkBaseUrl = async () => {
    const { data } = await supabase
      .from("admin_text_settings")
      .select("setting_value")
      .eq("setting_key", "smart_link_base_url")
      .maybeSingle();
    
    const url = data?.setting_value || "";
    setSmartLinkBaseUrl(url);
    setSmartLinkBaseUrlInput(url);
  };

  const handleSaveSmartLinkUrl = async () => {
    setIsSavingSmartLinkUrl(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from("admin_text_settings")
        .upsert({
          setting_key: "smart_link_base_url",
          setting_value: smartLinkBaseUrlInput,
          updated_by: user?.id,
          updated_at: new Date().toISOString(),
        }, { onConflict: "setting_key" });

      if (error) throw error;

      setSmartLinkBaseUrl(smartLinkBaseUrlInput);
      toast({
        title: "Link salvo",
        description: "A URL base do Smart Link foi atualizada.",
      });
    } catch (error) {
      console.error("Error saving smart link URL:", error);
      toast({
        title: "Erro",
        description: "Não foi possível salvar a URL.",
        variant: "destructive",
      });
    } finally {
      setIsSavingSmartLinkUrl(false);
    }
  };

  const fetchSmartLinkPages = async () => {
    const { data } = await supabase
      .from("smart_link_pages")
      .select("id, user_id, slug, title, description, is_active, total_views, created_at")
      .order("created_at", { ascending: false });
    
    if (data && data.length > 0) {
      const userIds = [...new Set(data.map(p => p.user_id))];
      const { data: profilesData } = await supabase
        .from("profiles")
        .select("user_id, email")
        .in("user_id", userIds);
      
      const emailMap = new Map(profilesData?.map(p => [p.user_id, p.email]));
      const enriched = data.map(page => ({
        ...page,
        user_email: emailMap.get(page.user_id) || "Desconhecido"
      }));
      setSmartLinkPages(enriched);
    } else {
      setSmartLinkPages([]);
    }
  };

  const handleToggleSmartLinkStatus = async (pageId: string, isActive: boolean) => {
    const { error } = await supabase
      .from("smart_link_pages")
      .update({ is_active: !isActive })
      .eq("id", pageId);
    
    if (error) {
      toast({ title: "Erro", description: "Não foi possível atualizar o status.", variant: "destructive" });
    } else {
      toast({ title: "Sucesso", description: `Página ${!isActive ? "ativada" : "desativada"}.` });
      fetchSmartLinkPages();
    }
  };

  const handleDeleteSmartLink = async (pageId: string) => {
    const { error } = await supabase
      .from("smart_link_pages")
      .delete()
      .eq("id", pageId);
    
    if (error) {
      toast({ title: "Erro", description: "Não foi possível excluir a página.", variant: "destructive" });
    } else {
      toast({ title: "Sucesso", description: "Página excluída." });
      fetchSmartLinkPages();
    }
  };

  const filteredSmartLinkPages = smartLinkPages.filter(page =>
    page.title.toLowerCase().includes(smartLinkSearchQuery.toLowerCase()) ||
    page.slug.toLowerCase().includes(smartLinkSearchQuery.toLowerCase()) ||
    (page.user_email && page.user_email.toLowerCase().includes(smartLinkSearchQuery.toLowerCase()))
  );

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

  const fetchVendorSales = async () => {
    const { data } = await supabase
      .from("vendor_sales")
      .select("*")
      .order("created_at", { ascending: false });
    
    if (data) {
      const vendorIds = [...new Set(data.map(s => s.vendor_id))];
      const { data: profilesData } = await supabase
        .from("profiles")
        .select("user_id, email, full_name")
        .in("user_id", vendorIds);
      
      const profileMap = new Map(profilesData?.map(p => [p.user_id, p]));
      const enriched = data.map(s => ({ ...s, vendor_profile: profileMap.get(s.vendor_id) || null }));
      setVendorSales(enriched);
    }
  };

  const fetchResellerProducts = async () => {
    // Fetch products created by vendors (not admins)
    const vendorRoleUsers = userRoles.filter(r => 
      r.role === 'vendor' || r.role === 'vendor_instagram' || r.role === 'vendor_tiktok' || r.role === 'vendor_model'
    ).map(r => r.user_id);

    // Fetch Instagram accounts from resellers
    const { data: instaData } = await supabase
      .from("instagram_accounts")
      .select("*")
      .not("created_by", "is", null)
      .order("created_at", { ascending: false });
    setResellerInstagramAccounts((instaData || []) as InstagramAccount[]);

    // Fetch TikTok accounts from resellers
    const { data: tiktokData } = await supabase
      .from("tiktok_accounts")
      .select("*")
      .not("created_by", "is", null)
      .order("created_at", { ascending: false });
    setResellerTiktokAccounts((tiktokData || []) as TikTokAccount[]);

    // Fetch Telegram groups from resellers
    const { data: telegramData } = await supabase
      .from("telegram_groups")
      .select("*")
      .not("created_by", "is", null)
      .order("created_at", { ascending: false });
    setResellerTelegramGroups((telegramData || []) as TelegramGroup[]);

    // Fetch Models from resellers
    const { data: modelsData } = await supabase
      .from("models_for_sale")
      .select("*")
      .not("created_by", "is", null)
      .order("created_at", { ascending: false });
    setResellerModels((modelsData || []) as ModelForSale[]);
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
    // Fetch ALL transactions (pending and paid)
    const { data } = await supabase
      .from("transactions")
      .select("*")
      .order("created_at", { ascending: false });

    if (data) {
      setTransactions(data);
      // Calculate billing stats only with paid transactions
      const paidTransactions = data.filter(tx => tx.status === "paid");
      const pendingTransactions = data.filter(tx => tx.status === "pending");
      calculateBillingStats(paidTransactions);
      setStats(prev => ({
        ...prev,
        pendingTransactions: pendingTransactions.length,
        paidTransactions: paidTransactions.length,
      }));
    }
  };

  const fetchTikTokAccounts = async () => {
    const { data } = await supabase
      .from("tiktok_accounts")
      .select("*")
      .order("created_at", { ascending: false });
    setTiktokAccounts(data || []);
  };

  const fetchInstagramAccounts = async () => {
    const { data } = await supabase
      .from("instagram_accounts")
      .select("*")
      .order("created_at", { ascending: false });
    setInstagramAccounts(data || []);
  };

  const fetchTelegramGroups = async () => {
    const { data } = await supabase
      .from("telegram_groups")
      .select("*")
      .order("created_at", { ascending: false });
    setTelegramGroups(data || []);
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
    // Filter out admin-granted transactions for real sales stats
    const realSales = txs.filter(tx => !tx.is_admin_granted);
    
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const last7 = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const last15 = new Date(today.getTime() - 15 * 24 * 60 * 60 * 1000);
    const last30 = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

    let todaySum = 0, last7Sum = 0, last15Sum = 0, last30Sum = 0, allSum = 0;

    realSales.forEach((tx) => {
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
      transactionCount: realSales.length,
    });
  };

  // Generate chart data for the last 7 days
  const chartData = useMemo(() => {
    // Filter only real paid transactions (not admin granted)
    const realPaidTxs = transactions.filter(tx => tx.status === "paid" && !tx.is_admin_granted);
    
    const days: { date: string; label: string; amount: number; count: number }[] = [];
    const now = new Date();
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      const label = date.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit' });
      
      const dayTxs = realPaidTxs.filter(tx => 
        new Date(tx.created_at).toISOString().split('T')[0] === dateStr
      );
      
      days.push({
        date: dateStr,
        label,
        amount: dayTxs.reduce((sum, tx) => sum + tx.amount_cents, 0) / 100,
        count: dayTxs.length,
      });
    }
    
    return days;
  }, [transactions]);

  const getFilteredTransactions = (statusFilter?: "pending" | "paid") => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    return transactions.filter((tx) => {
      // Filter by status if provided
      if (statusFilter && tx.status !== statusFilter) return false;
      
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

  const handleAddTelegramGroup = async () => {
    setIsUploadingTelegramGroup(true);
    try {
      let imageUrl: string | null = null;
      if (telegramGroupImageFile) {
        imageUrl = await handleUploadImage(telegramGroupImageFile, "product-images");
      }

      const { error } = await supabase.from("telegram_groups").insert({
        group_name: telegramGroupForm.group_name,
        group_username: telegramGroupForm.group_username || null,
        members_count: parseInt(telegramGroupForm.members_count) || 0,
        description: telegramGroupForm.description || null,
        niche: telegramGroupForm.niche || null,
        price_cents: Math.round(parseFloat(telegramGroupForm.price) * 100) || 0,
        group_type: telegramGroupForm.group_type,
        image_url: imageUrl,
        deliverable_invite_link: telegramGroupForm.deliverable_invite_link || null,
        deliverable_notes: telegramGroupForm.deliverable_notes || null,
      });

      if (!error) {
        toast({ title: "Grupo adicionado!" });
        setTelegramGroupDialogOpen(false);
        setTelegramGroupForm({
          group_name: "", group_username: "", members_count: "", description: "",
          niche: "", price: "", group_type: "group", deliverable_invite_link: "", deliverable_notes: "",
        });
        setTelegramGroupImageFile(null);
        fetchTelegramGroups();
      }
    } finally {
      setIsUploadingTelegramGroup(false);
    }
  };

  const handleDeleteTelegramGroup = async (id: string) => {
    const { error } = await supabase.from("telegram_groups").delete().eq("id", id);
    if (!error) toast({ title: "Grupo removido!" });
  };

  const handleAddInstagramAccount = async () => {
    setIsUploadingInstagram(true);
    try {
      let imageUrl: string | null = null;
      if (instagramImageFile) {
        imageUrl = await handleUploadImage(instagramImageFile, "product-images");
      }

      const { error } = await supabase.from("instagram_accounts").insert({
        username: instagramForm.username.replace("@", ""),
        followers: parseInt(instagramForm.followers) || 0,
        following: parseInt(instagramForm.following) || 0,
        posts_count: parseInt(instagramForm.posts_count) || 0,
        engagement_rate: parseFloat(instagramForm.engagement_rate) || 0,
        description: instagramForm.description || null,
        niche: instagramForm.niche || null,
        price_cents: Math.round(parseFloat(instagramForm.price) * 100) || 0,
        is_verified: instagramForm.is_verified,
        image_url: imageUrl,
        deliverable_login: instagramForm.deliverable_login || null,
        deliverable_password: instagramForm.deliverable_password || null,
        deliverable_email: instagramForm.deliverable_email || null,
        deliverable_notes: instagramForm.deliverable_notes || null,
      });

      if (!error) {
        toast({ title: "Conta Instagram adicionada!" });
        setInstagramDialogOpen(false);
        setInstagramForm({
          username: "", followers: "", following: "", posts_count: "", engagement_rate: "",
          description: "", niche: "", price: "", is_verified: false,
          deliverable_login: "", deliverable_password: "", deliverable_email: "", deliverable_notes: "",
        });
        setInstagramImageFile(null);
        fetchInstagramAccounts();
      }
    } finally {
      setIsUploadingInstagram(false);
    }
  };

  const handleDeleteInstagramAccount = async (id: string) => {
    const { error } = await supabase.from("instagram_accounts").delete().eq("id", id);
    if (!error) toast({ title: "Conta Instagram removida!" });
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
        funnel_json: modelFunnelJson || null,
      });

      if (error) throw error;

      toast({ title: "Modelo adicionado!", description: `${modelForm.name} foi adicionado${modelFunnelJson ? " com funil incluso" : ""}.` });
      setModelForm({
        name: "", bio: "", niche: "", category: "black", price: "",
        deliverable_link: "", deliverable_notes: "",
      });
      setModelImageFile(null);
      setModelFunnelFile(null);
      setModelFunnelJson(null);
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

  // Admin product edit/reactivate state
  const [editTiktokDialogOpen, setEditTiktokDialogOpen] = useState(false);
  const [editInstagramDialogOpen, setEditInstagramDialogOpen] = useState(false);
  const [editTelegramDialogOpen, setEditTelegramDialogOpen] = useState(false);
  const [editModelDialogOpen, setEditModelDialogOpen] = useState(false);
  const [selectedEditTiktok, setSelectedEditTiktok] = useState<TikTokAccount | null>(null);
  const [selectedEditInstagram, setSelectedEditInstagram] = useState<InstagramAccount | null>(null);
  const [selectedEditTelegram, setSelectedEditTelegram] = useState<TelegramGroup | null>(null);
  const [selectedEditModel, setSelectedEditModel] = useState<ModelForSale | null>(null);

  // Open edit dialogs
  const openEditTiktok = (acc: TikTokAccount) => {
    setSelectedEditTiktok(acc);
    setTiktokForm({
      username: acc.username,
      followers: String(acc.followers || 0),
      likes: String(acc.likes || 0),
      description: acc.description || "",
      niche: acc.niche || "",
      price: String(acc.price_cents / 100),
      deliverable_login: acc.deliverable_login || "",
      deliverable_password: acc.deliverable_password || "",
      deliverable_email: acc.deliverable_email || "",
      deliverable_notes: acc.deliverable_notes || "",
    });
    setEditTiktokDialogOpen(true);
  };

  const openEditInstagram = (acc: InstagramAccount) => {
    setSelectedEditInstagram(acc);
    setInstagramForm({
      username: acc.username,
      followers: String(acc.followers || 0),
      following: String(acc.following || 0),
      posts_count: String(acc.posts_count || 0),
      engagement_rate: String(acc.engagement_rate || 0),
      description: acc.description || "",
      niche: acc.niche || "",
      price: String(acc.price_cents / 100),
      is_verified: acc.is_verified || false,
      deliverable_login: acc.deliverable_login || "",
      deliverable_password: acc.deliverable_password || "",
      deliverable_email: acc.deliverable_email || "",
      deliverable_notes: acc.deliverable_notes || "",
    });
    setEditInstagramDialogOpen(true);
  };

  const openEditTelegram = (grp: TelegramGroup) => {
    setSelectedEditTelegram(grp);
    setTelegramGroupForm({
      group_name: grp.group_name,
      group_username: grp.group_username || "",
      members_count: String(grp.members_count || 0),
      description: grp.description || "",
      niche: grp.niche || "",
      price: String(grp.price_cents / 100),
      group_type: grp.group_type || "group",
      deliverable_invite_link: grp.deliverable_invite_link || "",
      deliverable_notes: grp.deliverable_notes || "",
    });
    setEditTelegramDialogOpen(true);
  };

  const openEditModel = (model: ModelForSale) => {
    setSelectedEditModel(model);
    setModelForm({
      name: model.name,
      bio: model.bio || "",
      niche: model.niche || "",
      category: model.category || "black",
      price: String(model.price_cents / 100),
      deliverable_link: model.deliverable_link || "",
      deliverable_notes: model.deliverable_notes || "",
    });
    setEditModelDialogOpen(true);
  };

  // Handle update functions
  const handleUpdateTiktok = async () => {
    if (!selectedEditTiktok) return;
    setIsUploadingTiktok(true);
    try {
      let imageUrl = selectedEditTiktok.image_url;
      if (tiktokImageFile) {
        imageUrl = await handleUploadImage(tiktokImageFile, "product-images");
      }
      const { error } = await supabase.from("tiktok_accounts").update({
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
      }).eq("id", selectedEditTiktok.id);
      if (error) throw error;
      toast({ title: "Conta TikTok atualizada!" });
      setEditTiktokDialogOpen(false);
      setTiktokImageFile(null);
      fetchTikTokAccounts();
    } catch (error: any) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } finally {
      setIsUploadingTiktok(false);
    }
  };

  const handleUpdateInstagram = async () => {
    if (!selectedEditInstagram) return;
    setIsUploadingInstagram(true);
    try {
      let imageUrl = selectedEditInstagram.image_url;
      if (instagramImageFile) {
        imageUrl = await handleUploadImage(instagramImageFile, "product-images");
      }
      const { error } = await supabase.from("instagram_accounts").update({
        username: instagramForm.username.replace("@", ""),
        followers: parseInt(instagramForm.followers) || 0,
        following: parseInt(instagramForm.following) || 0,
        posts_count: parseInt(instagramForm.posts_count) || 0,
        engagement_rate: parseFloat(instagramForm.engagement_rate) || 0,
        description: instagramForm.description || null,
        niche: instagramForm.niche || null,
        price_cents: Math.round(parseFloat(instagramForm.price) * 100) || 0,
        is_verified: instagramForm.is_verified,
        image_url: imageUrl,
        deliverable_login: instagramForm.deliverable_login || null,
        deliverable_password: instagramForm.deliverable_password || null,
        deliverable_email: instagramForm.deliverable_email || null,
        deliverable_notes: instagramForm.deliverable_notes || null,
      }).eq("id", selectedEditInstagram.id);
      if (error) throw error;
      toast({ title: "Conta Instagram atualizada!" });
      setEditInstagramDialogOpen(false);
      setInstagramImageFile(null);
      fetchInstagramAccounts();
    } catch (error: any) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } finally {
      setIsUploadingInstagram(false);
    }
  };

  const handleUpdateTelegram = async () => {
    if (!selectedEditTelegram) return;
    setIsUploadingTelegramGroup(true);
    try {
      let imageUrl = selectedEditTelegram.image_url;
      if (telegramGroupImageFile) {
        imageUrl = await handleUploadImage(telegramGroupImageFile, "product-images");
      }
      const { error } = await supabase.from("telegram_groups").update({
        group_name: telegramGroupForm.group_name,
        group_username: telegramGroupForm.group_username || null,
        members_count: parseInt(telegramGroupForm.members_count) || 0,
        description: telegramGroupForm.description || null,
        niche: telegramGroupForm.niche || null,
        price_cents: Math.round(parseFloat(telegramGroupForm.price) * 100) || 0,
        group_type: telegramGroupForm.group_type,
        image_url: imageUrl,
        deliverable_invite_link: telegramGroupForm.deliverable_invite_link || null,
        deliverable_notes: telegramGroupForm.deliverable_notes || null,
      }).eq("id", selectedEditTelegram.id);
      if (error) throw error;
      toast({ title: "Grupo Telegram atualizado!" });
      setEditTelegramDialogOpen(false);
      setTelegramGroupImageFile(null);
      fetchTelegramGroups();
    } catch (error: any) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } finally {
      setIsUploadingTelegramGroup(false);
    }
  };

  const handleUpdateModel = async () => {
    if (!selectedEditModel) return;
    setIsUploadingModel(true);
    try {
      let imageUrl = selectedEditModel.image_url;
      if (modelImageFile) {
        imageUrl = await handleUploadImage(modelImageFile, "product-images");
      }
      const { error } = await supabase.from("models_for_sale").update({
        name: modelForm.name,
        bio: modelForm.bio,
        niche: modelForm.niche,
        category: modelForm.category,
        price_cents: Math.round(parseFloat(modelForm.price) * 100),
        image_url: imageUrl,
        deliverable_link: modelForm.deliverable_link || null,
        deliverable_notes: modelForm.deliverable_notes || null,
      }).eq("id", selectedEditModel.id);
      if (error) throw error;
      toast({ title: "Modelo atualizado!" });
      setEditModelDialogOpen(false);
      setModelImageFile(null);
      fetchModels();
    } catch (error: any) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } finally {
      setIsUploadingModel(false);
    }
  };

  // Reactivate functions (reset sold status and clear buyer info)
  const handleReactivateTiktok = async (id: string) => {
    const { error } = await supabase.from("tiktok_accounts").update({
      is_sold: false,
      sold_at: null,
      sold_to_user_id: null,
    }).eq("id", id);
    if (!error) {
      toast({ title: "Conta TikTok reativada!", description: "A conta está novamente disponível para venda." });
      fetchTikTokAccounts();
    }
  };

  const handleReactivateInstagram = async (id: string) => {
    const { error } = await supabase.from("instagram_accounts").update({
      is_sold: false,
      sold_at: null,
      sold_to_user_id: null,
    }).eq("id", id);
    if (!error) {
      toast({ title: "Conta Instagram reativada!", description: "A conta está novamente disponível para venda." });
      fetchInstagramAccounts();
    }
  };

  const handleReactivateTelegram = async (id: string) => {
    const { error } = await supabase.from("telegram_groups").update({
      is_sold: false,
      sold_at: null,
      sold_to_user_id: null,
    }).eq("id", id);
    if (!error) {
      toast({ title: "Grupo Telegram reativado!", description: "O grupo está novamente disponível para venda." });
      fetchTelegramGroups();
    }
  };

  const handleReactivateModel = async (id: string) => {
    const { error } = await supabase.from("models_for_sale").update({
      is_sold: false,
      sold_at: null,
      sold_to_user_id: null,
    }).eq("id", id);
    if (!error) {
      toast({ title: "Modelo reativado!", description: "O modelo está novamente disponível para venda." });
      fetchModels();
    }
  };

  // Reseller product edit handlers
  const handleUpdateResellerInstagram = async () => {
    if (!selectedResellerInstagram) return;
    const { error } = await supabase.from("instagram_accounts").update({
      price_cents: Math.round(parseFloat(instagramForm.price) * 100),
      deliverable_login: instagramForm.deliverable_login,
      deliverable_password: instagramForm.deliverable_password,
      deliverable_email: instagramForm.deliverable_email,
      deliverable_notes: instagramForm.deliverable_notes,
    }).eq("id", selectedResellerInstagram.id);
    if (!error) {
      toast({ title: "Conta Instagram atualizada!" });
      setEditResellerInstagramDialogOpen(false);
      fetchResellerProducts();
    }
  };

  const handleUpdateResellerTiktok = async () => {
    if (!selectedResellerTiktok) return;
    const { error } = await supabase.from("tiktok_accounts").update({
      price_cents: Math.round(parseFloat(tiktokForm.price) * 100),
      deliverable_login: tiktokForm.deliverable_login,
      deliverable_password: tiktokForm.deliverable_password,
      deliverable_email: tiktokForm.deliverable_email,
      deliverable_notes: tiktokForm.deliverable_notes,
    }).eq("id", selectedResellerTiktok.id);
    if (!error) {
      toast({ title: "Conta TikTok atualizada!" });
      setEditResellerTiktokDialogOpen(false);
      fetchResellerProducts();
    }
  };

  const handleUpdateResellerTelegram = async () => {
    if (!selectedResellerTelegram) return;
    const { error } = await supabase.from("telegram_groups").update({
      price_cents: Math.round(parseFloat(telegramGroupForm.price) * 100),
      deliverable_invite_link: telegramGroupForm.deliverable_invite_link,
      deliverable_notes: telegramGroupForm.deliverable_notes,
    }).eq("id", selectedResellerTelegram.id);
    if (!error) {
      toast({ title: "Grupo Telegram atualizado!" });
      setEditResellerTelegramDialogOpen(false);
      fetchResellerProducts();
    }
  };

  const handleUpdateResellerModel = async () => {
    if (!selectedResellerModel) return;
    const { error } = await supabase.from("models_for_sale").update({
      price_cents: Math.round(parseFloat(modelForm.price) * 100),
      deliverable_link: modelForm.deliverable_link,
      deliverable_notes: modelForm.deliverable_notes,
    }).eq("id", selectedResellerModel.id);
    if (!error) {
      toast({ title: "Modelo atualizado!" });
      setEditResellerModelDialogOpen(false);
      fetchResellerProducts();
    }
  };

  const openEditResellerInstagram = (acc: InstagramAccount) => {
    setSelectedResellerInstagram(acc);
    setInstagramForm({ ...instagramForm, price: String(acc.price_cents / 100), deliverable_login: acc.deliverable_login || "", deliverable_password: acc.deliverable_password || "", deliverable_email: acc.deliverable_email || "", deliverable_notes: acc.deliverable_notes || "" });
    setEditResellerInstagramDialogOpen(true);
  };

  const openEditResellerTiktok = (acc: TikTokAccount) => {
    setSelectedResellerTiktok(acc);
    setTiktokForm({ ...tiktokForm, price: String(acc.price_cents / 100), deliverable_login: acc.deliverable_login || "", deliverable_password: acc.deliverable_password || "", deliverable_email: acc.deliverable_email || "", deliverable_notes: acc.deliverable_notes || "" });
    setEditResellerTiktokDialogOpen(true);
  };

  const openEditResellerTelegram = (grp: TelegramGroup) => {
    setSelectedResellerTelegram(grp);
    setTelegramGroupForm({ ...telegramGroupForm, price: String(grp.price_cents / 100), deliverable_invite_link: grp.deliverable_invite_link || "", deliverable_notes: grp.deliverable_notes || "" });
    setEditResellerTelegramDialogOpen(true);
  };

  const openEditResellerModel = (model: ModelForSale) => {
    setSelectedResellerModel(model);
    setModelForm({ ...modelForm, price: String(model.price_cents / 100), deliverable_link: model.deliverable_link || "", deliverable_notes: model.deliverable_notes || "" });
    setEditResellerModelDialogOpen(true);
  };

  const handleAddMedia = async () => {
    if (!mediaForm.name) {
      toast({ title: "Erro", description: "Nome do pacote é obrigatório", variant: "destructive" });
      return;
    }

    // Use bulk uploaded files if available, otherwise use legacy mediaFiles
    const filesToSave = bulkUploadedFiles.length > 0 ? bulkUploadedFiles : [];
    
    if (filesToSave.length === 0 && mediaFiles.length === 0) {
      toast({ title: "Erro", description: "Adicione arquivos de mídia", variant: "destructive" });
      return;
    }

    setIsUploadingMedia(true);
    try {
      // Upload cover image if provided
      let coverUrl: string | null = null;
      if (mediaCoverFile) {
        coverUrl = await handleUploadImage(mediaCoverFile, "product-images");
      }

      // If using legacy upload (small files), upload them now
      let uploadedFiles = filesToSave;
      if (filesToSave.length === 0 && mediaFiles.length > 0) {
        uploadedFiles = [];
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

      toast({ title: "Pacote adicionado!", description: `${mediaForm.name} foi adicionado com ${uploadedFiles.length.toLocaleString()} arquivos.` });
      setMediaForm({ name: "", description: "", pack_type: "10k", min_plan: "basic" });
      setMediaFiles([]);
      setBulkUploadedFiles([]);
      setBulkFilesCount(0);
      setMediaCoverFile(null);
      setMediaDialogOpen(false);
    } catch (error: any) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } finally {
      setIsUploadingMedia(false);
    }
  };

  const handleDeleteMedia = async (id: string) => {
    // Check if any campaigns are using this media pack
    const { data: campaigns, error: checkError } = await supabase
      .from("campaigns")
      .select("id, name")
      .eq("media_pack_id", id);

    if (checkError) {
      console.error("Erro ao verificar campanhas:", checkError);
      toast({ title: "Erro", description: "Não foi possível verificar se há campanhas vinculadas.", variant: "destructive" });
      return;
    }

    if (campaigns && campaigns.length > 0) {
      toast({
        title: "Não é possível excluir",
        description: `Este pacote está sendo usado por ${campaigns.length} campanha(s). Remova as campanhas primeiro ou altere o pacote de mídia delas.`,
        variant: "destructive",
      });
      return;
    }

    const { error } = await supabase.from("admin_media").delete().eq("id", id);
    if (error) {
      console.error("Erro ao deletar mídia:", error);
      toast({ title: "Erro ao deletar", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Pacote removido!" });
    }
  };

  const handleEditMedia = (media: AdminMedia) => {
    setSelectedMedia(media);
    setEditMediaName(media.name);
    setEditMediaDescription(media.description || "");
    setEditMediaPackType(media.pack_type || "10k");
    setEditMediaMinPlan(media.min_plan || "basic");
    setEditMediaCoverFile(null);
    setEditMediaCoverPreview(media.image_url || null);
    const existingFiles = Array.isArray(media.media_files) 
      ? media.media_files.map((f: any) => ({
          name: f.name || 'file',
          url: f.url,
          type: f.type || 'application/octet-stream',
          size: f.size || 0,
        }))
      : [];
    setBulkUploadedFiles(existingFiles);
    setBulkFilesCount(existingFiles.length);
    setEditMediaDialogOpen(true);
  };

  const handleSaveEditedMedia = async () => {
    if (!selectedMedia) return;
    
    setIsUploadingMedia(true);
    try {
      let imageUrl = selectedMedia.image_url;
      
      // Upload new cover image if selected
      if (editMediaCoverFile) {
        const fileExt = editMediaCoverFile.name.split('.').pop();
        const fileName = `cover-${selectedMedia.id}-${Date.now()}.${fileExt}`;
        
        const { error: uploadError, data: uploadData } = await supabase.storage
          .from("media-packs")
          .upload(fileName, editMediaCoverFile, { upsert: true });
        
        if (uploadError) throw uploadError;
        
        const { data: { publicUrl } } = supabase.storage
          .from("media-packs")
          .getPublicUrl(fileName);
        
        imageUrl = publicUrl;
      }
      
      const { error } = await supabase
        .from("admin_media")
        .update({
          name: editMediaName.trim() || selectedMedia.name,
          description: editMediaDescription.trim() || null,
          pack_type: editMediaPackType,
          min_plan: editMediaMinPlan,
          image_url: imageUrl,
          media_files: bulkUploadedFiles.map(f => ({ url: f.url, name: f.name, type: f.type, size: f.size })),
          file_count: bulkUploadedFiles.length,
          updated_at: new Date().toISOString(),
        })
        .eq("id", selectedMedia.id);

      if (error) throw error;

      toast({ 
        title: "Pacote atualizado!", 
        description: `${editMediaName || selectedMedia.name} agora tem ${bulkUploadedFiles.length.toLocaleString()} arquivos.` 
      });
      setEditMediaDialogOpen(false);
      setSelectedMedia(null);
      setEditMediaName("");
      setEditMediaDescription("");
      setEditMediaPackType("10k");
      setEditMediaMinPlan("basic");
      setEditMediaCoverFile(null);
      setEditMediaCoverPreview(null);
      setBulkUploadedFiles([]);
      setBulkFilesCount(0);
      fetchAdminMedia();
    } catch (error: any) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } finally {
      setIsUploadingMedia(false);
    }
  };

  // Transfer media between packs
  const handleOpenTransferDialog = (media: AdminMedia) => {
    setTransferSourceMedia(media);
    setTransferTargetMediaId("");
    setTransferQuantity("");
    setTransferMode("copy"); // Default to copy mode
    setTransferMediaDialogOpen(true);
  };

  const handleTransferMedia = async () => {
    if (!transferSourceMedia || !transferTargetMediaId || !transferQuantity) {
      toast({ title: "Erro", description: "Preencha todos os campos", variant: "destructive" });
      return;
    }

    const quantity = parseInt(transferQuantity);
    if (isNaN(quantity) || quantity <= 0) {
      toast({ title: "Erro", description: "Quantidade inválida", variant: "destructive" });
      return;
    }

    const sourceFiles = Array.isArray(transferSourceMedia.media_files) ? transferSourceMedia.media_files : [];
    if (quantity > sourceFiles.length) {
      toast({ 
        title: "Erro", 
        description: `O pacote de origem só tem ${sourceFiles.length} arquivos`, 
        variant: "destructive" 
      });
      return;
    }

    setIsTransferring(true);
    try {
      // Get target pack
      const targetPack = adminMedia.find(m => m.id === transferTargetMediaId);
      if (!targetPack) throw new Error("Pacote de destino não encontrado");

      const targetFiles = Array.isArray(targetPack.media_files) ? targetPack.media_files : [];
      
      // Get files to transfer (from the beginning of the source pack)
      const filesToTransfer = sourceFiles.slice(0, quantity);
      
      // Update target pack - add transferred files
      const { error: targetError } = await supabase
        .from("admin_media")
        .update({
          media_files: [...targetFiles, ...filesToTransfer],
          file_count: targetFiles.length + filesToTransfer.length,
          updated_at: new Date().toISOString(),
        })
        .eq("id", transferTargetMediaId);

      if (targetError) throw targetError;

      // Only update source pack if mode is "move" (not copy)
      if (transferMode === "move") {
        const remainingSourceFiles = sourceFiles.slice(quantity);
        const { error: sourceError } = await supabase
          .from("admin_media")
          .update({
            media_files: remainingSourceFiles,
            file_count: remainingSourceFiles.length,
            updated_at: new Date().toISOString(),
          })
          .eq("id", transferSourceMedia.id);

        if (sourceError) throw sourceError;
      }

      const actionText = transferMode === "move" ? "movidos" : "copiados";
      toast({ 
        title: transferMode === "move" ? "Mídias transferidas!" : "Mídias copiadas!", 
        description: `${quantity.toLocaleString()} arquivos ${actionText} de "${transferSourceMedia.name}" para "${targetPack.name}".` 
      });
      
      setTransferMediaDialogOpen(false);
      setTransferSourceMedia(null);
      setTransferTargetMediaId("");
      setTransferQuantity("");
      fetchAdminMedia();
    } catch (error: any) {
      toast({ title: "Erro ao transferir", description: error.message, variant: "destructive" });
    } finally {
      setIsTransferring(false);
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

  const handleClearPendingTransactions = async () => {
    try {
      const pendingIds = transactions.filter(tx => tx.status === "pending").map(tx => tx.id);
      if (pendingIds.length === 0) {
        toast({ title: "Nenhuma transação pendente para remover" });
        return;
      }
      
      const { error } = await supabase
        .from("transactions")
        .delete()
        .in("id", pendingIds);

      if (error) throw error;

      toast({ 
        title: "Transações removidas!", 
        description: `${pendingIds.length} transações pendentes foram removidas.` 
      });
      fetchTransactions();
    } catch (error: any) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    }
  };

  const handleClearPendingCheckouts = async () => {
    try {
      const pendingIds = checkouts.map(c => c.id);
      if (pendingIds.length === 0) {
        toast({ title: "Nenhum checkout pendente para remover" });
        return;
      }
      
      const { error } = await supabase
        .from("checkout_sessions")
        .delete()
        .in("id", pendingIds);

      if (error) throw error;

      toast({ 
        title: "Checkouts removidos!", 
        description: `${pendingIds.length} checkouts pendentes foram removidos.` 
      });
      fetchCheckouts();
    } catch (error: any) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    }
  };

  // Pie chart data for transactions status
  const transactionStatusChartData = useMemo(() => {
    const pending = transactions.filter(tx => tx.status === "pending").length;
    const paid = transactions.filter(tx => tx.status === "paid" && !tx.is_admin_granted).length;
    const adminGranted = transactions.filter(tx => tx.status === "paid" && tx.is_admin_granted).length;
    
    return [
      { name: "Pendentes", value: pending, color: "hsl(var(--warning))" },
      { name: "Aprovados", value: paid, color: "hsl(var(--success))" },
      { name: "Admin", value: adminGranted, color: "hsl(var(--primary))" },
    ].filter(item => item.value > 0);
  }, [transactions]);

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
    { title: "Assinaturas Ativas", value: stats.activeSubscriptions, icon: CreditCard, color: "text-primary" },
    { title: "Checkouts Pendentes", value: stats.pendingCheckouts, icon: ShoppingCart, color: "text-warning" },
    { title: "Pagamentos Pendentes", value: stats.pendingTransactions, icon: Clock, color: "text-warning" },
    { title: "Pagamentos Aprovados", value: stats.paidTransactions, icon: CheckCircle2, color: "text-success" },
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
            <TabsTrigger value="accounts">Contas</TabsTrigger>
            <TabsTrigger value="resellers" className="flex items-center gap-1">
              <Store className="h-4 w-4" />
              Revendedores
            </TabsTrigger>
            <TabsTrigger value="templates" className="flex items-center gap-1">
              <GitBranch className="h-4 w-4" />
              Templates Funis
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex items-center gap-1">
              <Bell className="h-4 w-4" />
              Notificações
            </TabsTrigger>
            <TabsTrigger value="automation" className="flex items-center gap-1">
              <Share2 className="h-4 w-4" />
              Automação
            </TabsTrigger>
            <TabsTrigger value="referrals" className="flex items-center gap-1">
              <Gift className="h-4 w-4" />
              Indique & Ganhe
            </TabsTrigger>
            <TabsTrigger value="smart-links" className="flex items-center gap-1">
              <Share2 className="h-4 w-4" />
              Smart Links
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-1">
              <Settings className="h-4 w-4" />
              Configurações
            </TabsTrigger>
            <TabsTrigger value="system" className="flex items-center gap-1">
              <Server className="h-4 w-4" />
              Sistema
            </TabsTrigger>
            <TabsTrigger value="ti" className="flex items-center gap-1">
              <Terminal className="h-4 w-4" />
              T.I.
            </TabsTrigger>
            <TabsTrigger value="account-managers" className="flex items-center gap-1">
              <UserCog className="h-4 w-4" />
              Gerentes de Contas
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
                        <TableHead>Dias Restantes</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {subscriptions.map((sub) => {
                        const daysRemaining = sub.expires_at 
                          ? Math.ceil((new Date(sub.expires_at).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
                          : null;
                        const isExpiringSoon = daysRemaining !== null && daysRemaining <= 3;
                        const isExpired = daysRemaining !== null && daysRemaining <= 0;
                        
                        return (
                          <TableRow key={sub.id} className={isExpired ? "opacity-60" : ""}>
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
                              {daysRemaining !== null ? (
                                <Badge 
                                  variant={isExpired ? "destructive" : isExpiringSoon ? "secondary" : "default"}
                                  className={!isExpired && !isExpiringSoon ? "bg-success" : isExpiringSoon && !isExpired ? "bg-warning text-warning-foreground" : ""}
                                >
                                  {isExpired ? "Expirado" : `${daysRemaining} dias`}
                                </Badge>
                              ) : (
                                <span className="text-muted-foreground">∞</span>
                              )}
                            </TableCell>
                            <TableCell>
                              <Badge className={isExpired ? "bg-destructive" : "bg-success"}>
                                {isExpired ? "Expirada" : "Ativa"}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        );
                      })}
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
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <ShoppingCart className="w-5 h-5" />
                    Checkouts Pendentes ({checkouts.length})
                  </CardTitle>
                  {checkouts.length > 0 && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive" size="sm" className="gap-2">
                          <Trash2 className="w-4 h-4" />
                          Limpar Pendentes
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Limpar checkouts pendentes?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Esta ação irá remover {checkouts.length} checkout(s) pendente(s). 
                            Esta ação não pode ser desfeita.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction onClick={handleClearPendingCheckouts} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                            Limpar
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                </div>
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
            {/* Charts Section */}
            <div className="grid md:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <TrendingUp className="w-4 h-4" />
                    Faturamento - Últimos 7 dias
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[200px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={chartData}>
                        <defs>
                          <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <XAxis dataKey="label" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
                        <YAxis tick={{ fontSize: 12 }} tickLine={false} axisLine={false} tickFormatter={(v) => `R$${v}`} />
                        <Tooltip 
                          formatter={(value: number) => [`R$ ${value.toFixed(2)}`, 'Faturamento']}
                          contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }}
                        />
                        <Area type="monotone" dataKey="amount" stroke="hsl(var(--primary))" strokeWidth={2} fill="url(#colorAmount)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <ShoppingCart className="w-4 h-4" />
                    Vendas - Últimos 7 dias
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[200px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData}>
                        <XAxis dataKey="label" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
                        <YAxis tick={{ fontSize: 12 }} tickLine={false} axisLine={false} allowDecimals={false} />
                        <Tooltip 
                          formatter={(value: number) => [value, 'Vendas']}
                          contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }}
                        />
                        <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Status Chart - Pie */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Target className="w-4 h-4" />
                    Status das Transações
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[200px]">
                    {transactionStatusChartData.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={transactionStatusChartData}
                            cx="50%"
                            cy="50%"
                            innerRadius={50}
                            outerRadius={70}
                            paddingAngle={3}
                            dataKey="value"
                            label={({ name, value }) => `${name}: ${value}`}
                            labelLine={false}
                          >
                            {transactionStatusChartData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip 
                            contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="flex items-center justify-center h-full text-muted-foreground">
                        <p>Nenhuma transação</p>
                      </div>
                    )}
                  </div>
                  {/* Legend */}
                  <div className="flex flex-wrap justify-center gap-4 mt-2">
                    {transactionStatusChartData.map((item, index) => (
                      <div key={index} className="flex items-center gap-2 text-sm">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: item.color }}
                        />
                        <span>{item.name}: {item.value}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Period Filter */}
            <div className="flex flex-wrap gap-2">
              {(["today", "7days", "15days", "30days", "all"] as BillingPeriod[]).map((period) => (
                <Button
                  key={period}
                  variant={billingPeriod === period ? "default" : "outline"}
                  size="sm"
                  onClick={() => setBillingPeriod(period)}
                  className={billingPeriod === period ? "telegram-gradient text-white" : ""}
                >
                  {billingPeriodLabels[period]}
                  {period !== "all" && (
                    <span className="ml-1 text-xs opacity-75">
                      ({formatPrice(
                        period === "today" ? billingStats.today : 
                        period === "7days" ? billingStats.last7Days : 
                        period === "15days" ? billingStats.last15Days : 
                        billingStats.last30Days
                      )})
                    </span>
                  )}
                </Button>
              ))}
            </div>

            <Tabs defaultValue="pending" className="space-y-4">
              <TabsList>
                <TabsTrigger value="pending" className="gap-2">
                  <Clock className="w-4 h-4" />
                  Pendentes ({getFilteredTransactions("pending").length})
                </TabsTrigger>
                <TabsTrigger value="paid" className="gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  Aprovadas ({getFilteredTransactions("paid").filter(tx => !tx.is_admin_granted).length})
                </TabsTrigger>
                <TabsTrigger value="admin" className="gap-2">
                  <Shield className="w-4 h-4" />
                  Admin ({getFilteredTransactions("paid").filter(tx => tx.is_admin_granted).length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="pending">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between flex-wrap gap-4">
                      <CardTitle className="flex items-center gap-2">
                        <Clock className="w-5 h-5 text-warning" />
                        Pagamentos Pendentes - {billingPeriodLabels[billingPeriod]}
                      </CardTitle>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">{getFilteredTransactions("pending").length} transações</Badge>
                        {transactions.filter(tx => tx.status === "pending").length > 0 && (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="destructive" size="sm" className="gap-2">
                                <Trash2 className="w-4 h-4" />
                                Limpar Pendentes
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Limpar pagamentos pendentes?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Esta ação irá remover {transactions.filter(tx => tx.status === "pending").length} pagamento(s) pendente(s). 
                                  Esta ação não pode ser desfeita.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction onClick={handleClearPendingTransactions} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                                  Limpar
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {getFilteredTransactions("pending").length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        <p>Nenhuma transação pendente no período</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {getFilteredTransactions("pending").map((tx) => (
                          <Card key={tx.id} className="border-warning/30 bg-warning/5">
                            <CardContent className="p-4">
                              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div className="space-y-2">
                                  <div className="flex items-center gap-2">
                                    <User className="w-4 h-4 text-muted-foreground" />
                                    <span className="font-semibold">{tx.buyer_name || "Cliente não identificado"}</span>
                                    <Badge variant="outline" className="capitalize">{tx.product_type}</Badge>
                                  </div>
                                  <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                                    {tx.buyer_email && (
                                      <div className="flex items-center gap-1">
                                        <Mail className="w-3 h-3" />
                                        <span>{tx.buyer_email}</span>
                                      </div>
                                    )}
                                    {tx.buyer_phone && (
                                      <a 
                                        href={`https://wa.me/${tx.buyer_phone.replace(/\D/g, '')}`} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-1 text-success hover:underline"
                                      >
                                        <Phone className="w-3 h-3" />
                                        <span>{tx.buyer_phone}</span>
                                      </a>
                                    )}
                                    {tx.buyer_document && (
                                      <div className="flex items-center gap-1">
                                        <CreditCard className="w-3 h-3" />
                                        <span>CPF: {tx.buyer_document}</span>
                                      </div>
                                    )}
                                  </div>
                                  <p className="text-xs text-muted-foreground">{formatDate(tx.created_at)}</p>
                                </div>
                                <div className="flex items-center gap-4">
                                  <div className="text-right">
                                    <p className="text-2xl font-bold">{formatPrice(tx.amount_cents)}</p>
                                    <Badge variant="secondary" className="gap-1">
                                      <Clock className="w-3 h-3" />Aguardando
                                    </Badge>
                                  </div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="paid">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2">
                        <CheckCircle2 className="w-5 h-5 text-success" />
                        Vendas Aprovadas - {billingPeriodLabels[billingPeriod]}
                      </CardTitle>
                      <Badge variant="secondary">{getFilteredTransactions("paid").filter(tx => !tx.is_admin_granted).length} transações</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {getFilteredTransactions("paid").filter(tx => !tx.is_admin_granted).length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <DollarSign className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        <p>Nenhuma venda no período</p>
                      </div>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Data</TableHead>
                            <TableHead>Comprador</TableHead>
                            <TableHead>Contato</TableHead>
                            <TableHead>Tipo</TableHead>
                            <TableHead>Valor</TableHead>
                            <TableHead>Status</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {getFilteredTransactions("paid").filter(tx => !tx.is_admin_granted).map((tx) => (
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

              <TabsContent value="admin">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2">
                        <Shield className="w-5 h-5 text-muted-foreground" />
                        Liberações Admin - {billingPeriodLabels[billingPeriod]}
                      </CardTitle>
                      <Badge variant="secondary">{getFilteredTransactions("paid").filter(tx => tx.is_admin_granted).length} liberações</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {getFilteredTransactions("paid").filter(tx => tx.is_admin_granted).length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <Shield className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        <p>Nenhuma liberação admin no período</p>
                      </div>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Data</TableHead>
                            <TableHead>Usuário</TableHead>
                            <TableHead>Tipo</TableHead>
                            <TableHead>Valor</TableHead>
                            <TableHead>Status</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {getFilteredTransactions("paid").filter(tx => tx.is_admin_granted).map((tx) => (
                            <TableRow key={tx.id} className="bg-muted/30">
                              <TableCell>{formatDate(tx.created_at)}</TableCell>
                              <TableCell>
                                <div>
                                  <p className="font-medium">{tx.buyer_name || "—"}</p>
                                  <p className="text-sm text-muted-foreground">{tx.buyer_email || "—"}</p>
                                </div>
                              </TableCell>
                              <TableCell><Badge variant="outline" className="capitalize">{tx.product_type}</Badge></TableCell>
                              <TableCell className="font-semibold text-muted-foreground">{formatPrice(tx.amount_cents)}</TableCell>
                              <TableCell>
                                <Badge variant="secondary" className="gap-1">
                                  <Shield className="w-3 h-3" />Admin
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
            </Tabs>
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

                    {/* Bulk Media Files Upload */}
                    <div>
                      <Label>Arquivos de Mídia (Upload em Massa)</Label>
                      <div className="mt-2">
                        <BulkMediaUploader
                          onFilesUploaded={(files) => setBulkUploadedFiles(files)}
                          onFilesSelected={(count) => setBulkFilesCount(count)}
                          bucket="media-packs"
                          concurrency={40}
                          showManageControls={true}
                          showPreview={true}
                          enableBackgroundUpload={true}
                          backgroundUploadPackName={mediaForm.name || "Novo Pacote"}
                          onBackgroundUploadStarted={() => {
                            toast({
                              title: "Upload em segundo plano",
                              description: "Você pode fechar esta janela e continuar usando a Nexo. O progresso aparece no canto inferior direito.",
                            });
                          }}
                        />
                      </div>
                      {bulkUploadedFiles.length > 0 && (
                        <p className="text-sm text-green-500 mt-2">
                          ✓ {bulkUploadedFiles.length.toLocaleString()} arquivos prontos para salvar
                        </p>
                      )}
                    </div>
                    
                    <Button 
                      onClick={handleAddMedia} 
                      className="w-full telegram-gradient text-white"
                      disabled={isUploadingMedia || !mediaForm.name || (bulkUploadedFiles.length === 0 && mediaFiles.length === 0)}
                    >
                      {isUploadingMedia ? (
                        <>
                          <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                          Salvando pacote...
                        </>
                      ) : bulkUploadedFiles.length > 0 ? (
                        `Salvar Pacote (${bulkUploadedFiles.length.toLocaleString()} arquivos)`
                      ) : (
                        "Salvar Pacote"
                      )}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>

              {/* Edit Media Dialog */}
              <Dialog open={editMediaDialogOpen} onOpenChange={(open) => {
                setEditMediaDialogOpen(open);
                if (!open) {
                  setSelectedMedia(null);
                  setEditMediaName("");
                  setEditMediaDescription("");
                  setEditMediaPackType("10k");
                  setEditMediaMinPlan("basic");
                  setEditMediaCoverFile(null);
                  setEditMediaCoverPreview(null);
                  setBulkUploadedFiles([]);
                  setBulkFilesCount(0);
                }
              }}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Editar Pacote de Mídia</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="edit-media-name">Nome do Pacote</Label>
                      <Input
                        id="edit-media-name"
                        value={editMediaName}
                        onChange={(e) => setEditMediaName(e.target.value)}
                        placeholder="Nome do pacote de mídia"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="edit-media-description">Descrição / Bio</Label>
                      <Textarea
                        id="edit-media-description"
                        value={editMediaDescription}
                        onChange={(e) => setEditMediaDescription(e.target.value)}
                        placeholder="Descrição do pacote de mídia..."
                        rows={3}
                      />
                    </div>
                    
                    {/* Cover Image Section */}
                    <div className="space-y-2">
                      <Label>Foto do Pacote</Label>
                      <input
                        type="file"
                        ref={editMediaCoverInputRef}
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            setEditMediaCoverFile(file);
                            // Create preview URL
                            const previewUrl = URL.createObjectURL(file);
                            setEditMediaCoverPreview(previewUrl);
                          }
                        }}
                      />
                      <div className="flex items-center gap-4">
                        {editMediaCoverPreview ? (
                          <div className="relative w-24 h-24 rounded-lg overflow-hidden border border-border">
                            <img 
                              src={editMediaCoverPreview} 
                              alt="Cover preview" 
                              className="w-full h-full object-cover"
                            />
                            <Button
                              variant="destructive"
                              size="icon"
                              className="absolute top-1 right-1 h-6 w-6"
                              onClick={() => {
                                setEditMediaCoverFile(null);
                                setEditMediaCoverPreview(selectedMedia?.image_url || null);
                              }}
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        ) : (
                          <div className="w-24 h-24 rounded-lg bg-muted flex items-center justify-center border border-dashed border-border">
                            <Image className="w-8 h-8 text-muted-foreground" />
                          </div>
                        )}
                        <Button 
                          variant="outline" 
                          onClick={() => editMediaCoverInputRef.current?.click()}
                        >
                          <Upload className="w-4 h-4 mr-2" />
                          {editMediaCoverPreview ? "Alterar Foto" : "Adicionar Foto"}
                        </Button>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="edit-media-pack-type">Tipo do Pacote</Label>
                        <Select value={editMediaPackType} onValueChange={setEditMediaPackType}>
                          <SelectTrigger id="edit-media-pack-type">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="10k">10k</SelectItem>
                            <SelectItem value="50k">50k</SelectItem>
                            <SelectItem value="full">Full</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="edit-media-min-plan">Plano Mínimo</Label>
                        <Select value={editMediaMinPlan} onValueChange={setEditMediaMinPlan}>
                          <SelectTrigger id="edit-media-min-plan">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="free">Free</SelectItem>
                            <SelectItem value="basic">Basic</SelectItem>
                            <SelectItem value="pro">Pro</SelectItem>
                            <SelectItem value="agency">Agency</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    
                    <div className="p-3 bg-muted/50 rounded-lg">
                      <p className="text-sm">
                        <strong>Arquivos atuais:</strong> {bulkUploadedFiles.length.toLocaleString()}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Você pode adicionar mais arquivos ou remover os existentes abaixo.
                      </p>
                    </div>
                    
                    <BulkMediaUploader
                      onFilesUploaded={async (files) => {
                        const newFiles = [...bulkUploadedFiles, ...files];
                        setBulkUploadedFiles(newFiles);
                        
                        // Auto-save when new files are uploaded (for non-background uploads)
                        if (selectedMedia) {
                          try {
                            await supabase
                              .from("admin_media")
                              .update({
                                media_files: newFiles.map(f => ({ url: f.url, name: f.name, type: f.type, size: f.size })),
                                file_count: newFiles.length,
                                updated_at: new Date().toISOString(),
                              })
                              .eq("id", selectedMedia.id);
                            
                            toast({ 
                              title: "Salvo automaticamente!", 
                              description: `${newFiles.length.toLocaleString()} arquivos salvos.` 
                            });
                            fetchAdminMedia();
                          } catch (error: any) {
                            toast({ title: "Erro ao salvar", description: error.message, variant: "destructive" });
                          }
                        }
                      }}
                      onFilesSelected={() => {}}
                      bucket="media-packs"
                      concurrency={40}
                      showManageControls={true}
                      showPreview={true}
                      existingFiles={bulkUploadedFiles}
                      enableBackgroundUpload={true}
                      backgroundUploadPackName={selectedMedia?.name || "Editando Pacote"}
                      autoSaveMediaId={selectedMedia?.id}
                      onBackgroundUploadStarted={() => {
                        toast({
                          title: "Upload em segundo plano",
                          description: "Você pode fechar esta janela. Os arquivos serão salvos automaticamente ao terminar.",
                        });
                        // Close dialog since it will auto-save
                        setEditMediaDialogOpen(false);
                      }}
                    />
                    
                    <Button 
                      onClick={handleSaveEditedMedia} 
                      className="w-full telegram-gradient text-white"
                      disabled={isUploadingMedia}
                    >
                      {isUploadingMedia ? (
                        <>
                          <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                          Salvando...
                        </>
                      ) : (
                        `Salvar Alterações (${bulkUploadedFiles.length.toLocaleString()} arquivos)`
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
                    <TableHead>Preview</TableHead>
                    <TableHead>Nome</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Plano Mínimo</TableHead>
                    <TableHead>Arquivos</TableHead>
                    <TableHead>Criado em</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {adminMedia.map((media) => {
                    // Get first 4 images for preview
                    const mediaFiles = Array.isArray(media.media_files) ? media.media_files : [];
                    const imageFiles = mediaFiles
                      .filter((f: any) => f.type?.startsWith('image/') || f.url?.match(/\.(jpg|jpeg|png|gif|webp)$/i))
                      .slice(0, 4);
                    const hasMoreFiles = mediaFiles.length > 4;
                    
                    return (
                      <TableRow key={media.id}>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            {imageFiles.length > 0 ? (
                              <>
                                {imageFiles.map((file: any, idx: number) => (
                                  <div 
                                    key={idx}
                                    className="w-10 h-10 rounded-md overflow-hidden border border-border bg-muted flex-shrink-0"
                                  >
                                    <img 
                                      src={file.url} 
                                      alt={file.name || 'Preview'} 
                                      className="w-full h-full object-cover"
                                      loading="lazy"
                                    />
                                  </div>
                                ))}
                                {hasMoreFiles && (
                                  <div className="w-10 h-10 rounded-md border border-border bg-muted/50 flex items-center justify-center text-xs text-muted-foreground flex-shrink-0">
                                    +{mediaFiles.length - 4}
                                  </div>
                                )}
                              </>
                            ) : (
                              <div className="w-10 h-10 rounded-md border border-border bg-muted flex items-center justify-center">
                                <Image className="w-4 h-4 text-muted-foreground" />
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">{media.name}</TableCell>
                        <TableCell><Badge variant="default">{media.pack_type}</Badge></TableCell>
                        <TableCell><Badge variant="outline" className="capitalize">{media.min_plan}</Badge></TableCell>
                        <TableCell>{media.file_count} arquivos</TableCell>
                        <TableCell className="text-muted-foreground">{formatDate(media.created_at)}</TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon"><MoreVertical className="w-4 h-4" /></Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleEditMedia(media)}>
                                <Edit2 className="w-4 h-4 mr-2" />Editar / Adicionar Mídias
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleOpenTransferDialog(media)}>
                                <ArrowRightLeft className="w-4 h-4 mr-2" />Transferir para Outro Pacote
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => handleDeleteMedia(media.id)} className="text-destructive">
                                <Trash2 className="w-4 h-4 mr-2" />Excluir
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {adminMedia.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        <Image className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        <p>Nenhum pacote cadastrado</p>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Transfer Media Dialog */}
            <Dialog open={transferMediaDialogOpen} onOpenChange={setTransferMediaDialogOpen}>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    {transferMode === "copy" ? <Copy className="w-5 h-5" /> : <ArrowRightLeft className="w-5 h-5" />}
                    {transferMode === "copy" ? "Copiar Mídias" : "Mover Mídias"}
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  {transferSourceMedia && (
                    <div className="p-3 bg-muted/50 rounded-lg">
                      <p className="text-sm font-medium">Pacote de origem:</p>
                      <p className="text-muted-foreground">{transferSourceMedia.name}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {transferSourceMedia.file_count?.toLocaleString()} arquivos disponíveis
                      </p>
                    </div>
                  )}

                  {/* Mode selector */}
                  <div className="space-y-2">
                    <Label>Modo de transferência</Label>
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        type="button"
                        variant={transferMode === "copy" ? "default" : "outline"}
                        className={transferMode === "copy" ? "telegram-gradient text-white" : ""}
                        onClick={() => setTransferMode("copy")}
                      >
                        <Copy className="w-4 h-4 mr-2" />
                        Copiar
                      </Button>
                      <Button
                        type="button"
                        variant={transferMode === "move" ? "default" : "outline"}
                        className={transferMode === "move" ? "telegram-gradient text-white" : ""}
                        onClick={() => setTransferMode("move")}
                      >
                        <ArrowRightLeft className="w-4 h-4 mr-2" />
                        Mover
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {transferMode === "copy" 
                        ? "Os arquivos permanecerão no pacote de origem" 
                        : "Os arquivos serão removidos do pacote de origem"}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label>Quantidade de arquivos</Label>
                    <Input
                      type="number"
                      min="1"
                      max={transferSourceMedia?.file_count || 0}
                      value={transferQuantity}
                      onChange={(e) => setTransferQuantity(e.target.value)}
                      placeholder={`1 a ${transferSourceMedia?.file_count?.toLocaleString() || 0}`}
                    />
                    <p className="text-xs text-muted-foreground">
                      Os arquivos serão selecionados do início do pacote
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label>Pacote de destino</Label>
                    <Select value={transferTargetMediaId} onValueChange={setTransferTargetMediaId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o pacote de destino" />
                      </SelectTrigger>
                      <SelectContent>
                        {adminMedia
                          .filter(m => m.id !== transferSourceMedia?.id)
                          .map((pack) => (
                            <SelectItem key={pack.id} value={pack.id}>
                              {pack.name} ({pack.file_count?.toLocaleString()} arquivos)
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {transferQuantity && transferTargetMediaId && (
                    <div className="p-3 bg-primary/10 rounded-lg border border-primary/20">
                      <p className="text-sm">
                        <strong>{parseInt(transferQuantity).toLocaleString()}</strong> arquivos serão{" "}
                        {transferMode === "copy" ? "copiados" : "movidos"} de{" "}
                        <strong>"{transferSourceMedia?.name}"</strong> para{" "}
                        <strong>"{adminMedia.find(m => m.id === transferTargetMediaId)?.name}"</strong>
                      </p>
                    </div>
                  )}

                  <div className="flex gap-2 pt-2">
                    <Button 
                      variant="outline" 
                      className="flex-1"
                      onClick={() => setTransferMediaDialogOpen(false)}
                    >
                      Cancelar
                    </Button>
                    <Button 
                      onClick={handleTransferMedia} 
                      className="flex-1 telegram-gradient text-white"
                      disabled={isTransferring || !transferQuantity || !transferTargetMediaId}
                    >
                      {isTransferring ? (
                        <>
                          <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                          {transferMode === "copy" ? "Copiando..." : "Movendo..."}
                        </>
                      ) : (
                        <>
                          {transferMode === "copy" ? <Copy className="w-4 h-4 mr-2" /> : <ArrowRightLeft className="w-4 h-4 mr-2" />}
                          {transferMode === "copy" ? "Copiar" : "Mover"}
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </TabsContent>
          {/* Unified Accounts Tab */}
          <TabsContent value="accounts" className="space-y-4">
            <Tabs defaultValue="tiktok" className="space-y-4">
              <div className="flex items-center justify-between">
                <TabsList>
                  <TabsTrigger value="tiktok" className="gap-2">
                    <Video className="w-4 h-4" />
                    TikTok ({tiktokAccounts.length})
                  </TabsTrigger>
                  <TabsTrigger value="instagram" className="gap-2">
                    <Image className="w-4 h-4" />
                    Instagram ({instagramAccounts.length})
                  </TabsTrigger>
                  <TabsTrigger value="telegram-groups" className="gap-2">
                    <Users className="w-4 h-4" />
                    Grupos Telegram ({telegramGroups.length})
                  </TabsTrigger>
                  <TabsTrigger value="models" className="gap-2">
                    <Sparkles className="w-4 h-4" />
                    Modelos Black ({models.filter(m => m.category === "black").length})
                  </TabsTrigger>
                </TabsList>
              </div>

              {/* TikTok Sub-Tab */}
              <TabsContent value="tiktok" className="space-y-4">
                <div className="flex items-center justify-end">
                  <Dialog open={tiktokDialogOpen} onOpenChange={setTiktokDialogOpen}>
                    <DialogTrigger asChild>
                      <Button className="telegram-gradient text-white gap-2">
                        <Plus className="w-4 h-4" />Adicionar Conta TikTok
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
                            <Input type="number" value={tiktokForm.followers} onChange={(e) => setTiktokForm({ ...tiktokForm, followers: e.target.value })} placeholder="50000" />
                          </div>
                          <div>
                            <Label>Curtidas</Label>
                            <Input type="number" value={tiktokForm.likes} onChange={(e) => setTiktokForm({ ...tiktokForm, likes: e.target.value })} placeholder="1000000" />
                          </div>
                        </div>
                        <div>
                          <Label>Nicho</Label>
                          <Input value={tiktokForm.niche} onChange={(e) => setTiktokForm({ ...tiktokForm, niche: e.target.value })} placeholder="Humor, Fitness, etc." />
                        </div>
                        <div>
                          <Label>Descrição</Label>
                          <Textarea value={tiktokForm.description} onChange={(e) => setTiktokForm({ ...tiktokForm, description: e.target.value })} placeholder="Descreva a conta..." />
                        </div>
                        <div>
                          <Label>Preço (R$)</Label>
                          <Input type="number" step="0.01" value={tiktokForm.price} onChange={(e) => setTiktokForm({ ...tiktokForm, price: e.target.value })} placeholder="499.90" />
                        </div>
                        <div>
                          <Label>Foto da Conta</Label>
                          <input type="file" ref={tiktokImageInputRef} accept="image/*" className="hidden" onChange={(e) => { const file = e.target.files?.[0]; if (file) setTiktokImageFile(file); }} />
                          <div className="mt-2">
                            {tiktokImageFile ? (
                              <div className="flex items-center gap-2 p-2 bg-secondary/50 rounded-lg">
                                <Image className="w-4 h-4" />
                                <span className="text-sm flex-1 truncate">{tiktokImageFile.name}</span>
                                <Button variant="ghost" size="sm" onClick={() => setTiktokImageFile(null)}><Trash2 className="w-4 h-4" /></Button>
                              </div>
                            ) : (
                              <Button variant="outline" className="w-full" onClick={() => tiktokImageInputRef.current?.click()}>
                                <Upload className="w-4 h-4 mr-2" />Selecionar Foto
                              </Button>
                            )}
                          </div>
                        </div>
                        <div className="border-t pt-4 mt-4">
                          <h4 className="font-semibold mb-3 flex items-center gap-2"><Shield className="w-4 h-4" />Dados para Entrega</h4>
                          <div className="space-y-3">
                            <div><Label>Login</Label><Input value={tiktokForm.deliverable_login} onChange={(e) => setTiktokForm({ ...tiktokForm, deliverable_login: e.target.value })} placeholder="email@exemplo.com" /></div>
                            <div><Label>Senha</Label><Input type="password" value={tiktokForm.deliverable_password} onChange={(e) => setTiktokForm({ ...tiktokForm, deliverable_password: e.target.value })} placeholder="senha123" /></div>
                            <div><Label>Email Vinculado</Label><Input value={tiktokForm.deliverable_email} onChange={(e) => setTiktokForm({ ...tiktokForm, deliverable_email: e.target.value })} placeholder="email@exemplo.com" /></div>
                            <div><Label>Notas</Label><Textarea value={tiktokForm.deliverable_notes} onChange={(e) => setTiktokForm({ ...tiktokForm, deliverable_notes: e.target.value })} placeholder="Instruções..." /></div>
                          </div>
                        </div>
                        <Button onClick={handleAddTikTokAccount} className="w-full telegram-gradient text-white" disabled={isUploadingTiktok}>
                          {isUploadingTiktok ? <><RefreshCw className="w-4 h-4 mr-2 animate-spin" />Salvando...</> : "Adicionar Conta"}
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>

                <div className="glass-card overflow-hidden overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[60px]">Foto</TableHead>
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
                      {tiktokAccounts.filter(a => !a.created_by).map((account) => (
                        <TableRow key={account.id}>
                          <TableCell>
                            {account.image_url ? (
                              <img src={account.image_url} alt={account.username} className="w-10 h-10 rounded-lg object-cover" />
                            ) : (
                              <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center">
                                <Video className="w-5 h-5 text-muted-foreground" />
                              </div>
                            )}
                          </TableCell>
                          <TableCell className="font-medium">@{account.username}</TableCell>
                          <TableCell>{formatNumber(account.followers)}</TableCell>
                          <TableCell>{formatNumber(account.likes)}</TableCell>
                          <TableCell>{account.niche || "—"}</TableCell>
                          <TableCell className="font-semibold">{formatPrice(account.price_cents)}</TableCell>
                          <TableCell><Badge variant={account.is_sold ? "secondary" : "default"}>{account.is_sold ? "Vendido" : "Disponível"}</Badge></TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon"><MoreVertical className="w-4 h-4" /></Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => openEditTiktok(account)}>
                                  <Eye className="w-4 h-4 mr-2" />Editar
                                </DropdownMenuItem>
                                {account.is_sold && (
                                  <DropdownMenuItem onClick={() => handleReactivateTiktok(account.id)}>
                                    <RefreshCw className="w-4 h-4 mr-2" />Reativar
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => handleDeleteTikTokAccount(account.id)} className="text-destructive">
                                  <Trash2 className="w-4 h-4 mr-2" />Excluir
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                      {tiktokAccounts.filter(a => !a.created_by).length === 0 && (
                        <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">Nenhuma conta TikTok cadastrada</TableCell></TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </TabsContent>

              {/* Instagram Sub-Tab */}
              <TabsContent value="instagram" className="space-y-4">
                <div className="flex items-center justify-end">
                  <Dialog open={instagramDialogOpen} onOpenChange={setInstagramDialogOpen}>
                    <DialogTrigger asChild>
                      <Button className="telegram-gradient text-white gap-2">
                        <Plus className="w-4 h-4" />Adicionar Conta Instagram
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>Nova Conta Instagram</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label>Username</Label>
                          <Input value={instagramForm.username} onChange={(e) => setInstagramForm({ ...instagramForm, username: e.target.value })} placeholder="@usuario" />
                        </div>
                        <div className="grid grid-cols-3 gap-4">
                          <div>
                            <Label>Seguidores</Label>
                            <Input type="number" value={instagramForm.followers} onChange={(e) => setInstagramForm({ ...instagramForm, followers: e.target.value })} placeholder="50000" />
                          </div>
                          <div>
                            <Label>Seguindo</Label>
                            <Input type="number" value={instagramForm.following} onChange={(e) => setInstagramForm({ ...instagramForm, following: e.target.value })} placeholder="500" />
                          </div>
                          <div>
                            <Label>Posts</Label>
                            <Input type="number" value={instagramForm.posts_count} onChange={(e) => setInstagramForm({ ...instagramForm, posts_count: e.target.value })} placeholder="100" />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label>Taxa de Engajamento (%)</Label>
                            <Input type="number" step="0.1" value={instagramForm.engagement_rate} onChange={(e) => setInstagramForm({ ...instagramForm, engagement_rate: e.target.value })} placeholder="3.5" />
                          </div>
                          <div className="flex items-center gap-2 pt-6">
                            <input 
                              type="checkbox" 
                              id="is_verified"
                              checked={instagramForm.is_verified}
                              onChange={(e) => setInstagramForm({ ...instagramForm, is_verified: e.target.checked })}
                              className="h-4 w-4"
                            />
                            <Label htmlFor="is_verified">Conta Verificada</Label>
                          </div>
                        </div>
                        <div>
                          <Label>Nicho</Label>
                          <Input value={instagramForm.niche} onChange={(e) => setInstagramForm({ ...instagramForm, niche: e.target.value })} placeholder="Moda, Fitness, etc." />
                        </div>
                        <div>
                          <Label>Descrição</Label>
                          <Textarea value={instagramForm.description} onChange={(e) => setInstagramForm({ ...instagramForm, description: e.target.value })} placeholder="Descreva a conta..." />
                        </div>
                        <div>
                          <Label>Preço (R$)</Label>
                          <Input type="number" step="0.01" value={instagramForm.price} onChange={(e) => setInstagramForm({ ...instagramForm, price: e.target.value })} placeholder="999.90" />
                        </div>
                        <div>
                          <Label>Foto da Conta</Label>
                          <input type="file" ref={instagramImageInputRef} accept="image/*" className="hidden" onChange={(e) => { const file = e.target.files?.[0]; if (file) setInstagramImageFile(file); }} />
                          <div className="mt-2">
                            {instagramImageFile ? (
                              <div className="flex items-center gap-2 p-2 bg-secondary/50 rounded-lg">
                                <Image className="w-4 h-4" />
                                <span className="text-sm flex-1 truncate">{instagramImageFile.name}</span>
                                <Button variant="ghost" size="sm" onClick={() => setInstagramImageFile(null)}><Trash2 className="w-4 h-4" /></Button>
                              </div>
                            ) : (
                              <Button variant="outline" className="w-full" onClick={() => instagramImageInputRef.current?.click()}>
                                <Upload className="w-4 h-4 mr-2" />Selecionar Foto
                              </Button>
                            )}
                          </div>
                        </div>
                        <div className="border-t pt-4 mt-4">
                          <h4 className="font-semibold mb-3 flex items-center gap-2"><Shield className="w-4 h-4" />Dados para Entrega</h4>
                          <div className="space-y-3">
                            <div><Label>Login</Label><Input value={instagramForm.deliverable_login} onChange={(e) => setInstagramForm({ ...instagramForm, deliverable_login: e.target.value })} placeholder="email@exemplo.com" /></div>
                            <div><Label>Senha</Label><Input type="password" value={instagramForm.deliverable_password} onChange={(e) => setInstagramForm({ ...instagramForm, deliverable_password: e.target.value })} placeholder="senha123" /></div>
                            <div><Label>Email Vinculado</Label><Input value={instagramForm.deliverable_email} onChange={(e) => setInstagramForm({ ...instagramForm, deliverable_email: e.target.value })} placeholder="email@exemplo.com" /></div>
                            <div><Label>Notas</Label><Textarea value={instagramForm.deliverable_notes} onChange={(e) => setInstagramForm({ ...instagramForm, deliverable_notes: e.target.value })} placeholder="Instruções..." /></div>
                          </div>
                        </div>
                        <Button onClick={handleAddInstagramAccount} className="w-full telegram-gradient text-white" disabled={isUploadingInstagram}>
                          {isUploadingInstagram ? <><RefreshCw className="w-4 h-4 mr-2 animate-spin" />Salvando...</> : "Adicionar Conta"}
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>

                <div className="glass-card overflow-hidden overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[60px]">Foto</TableHead>
                        <TableHead>Username</TableHead>
                        <TableHead>Seguidores</TableHead>
                        <TableHead>Engajamento</TableHead>
                        <TableHead>Nicho</TableHead>
                        <TableHead>Preço</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {instagramAccounts.filter(a => !a.created_by).map((account) => (
                        <TableRow key={account.id}>
                          <TableCell>
                            {account.image_url ? (
                              <img src={account.image_url} alt={account.username} className="w-10 h-10 rounded-lg object-cover" />
                            ) : (
                              <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center">
                                <Users className="w-5 h-5 text-muted-foreground" />
                              </div>
                            )}
                          </TableCell>
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-2">
                              @{account.username}
                              {account.is_verified && <CheckCircle2 className="w-4 h-4 text-telegram" />}
                            </div>
                          </TableCell>
                          <TableCell>{formatNumber(account.followers)}</TableCell>
                          <TableCell>{account.engagement_rate?.toFixed(1)}%</TableCell>
                          <TableCell>{account.niche || "—"}</TableCell>
                          <TableCell className="font-semibold">{formatPrice(account.price_cents)}</TableCell>
                          <TableCell><Badge variant={account.is_sold ? "secondary" : "default"}>{account.is_sold ? "Vendido" : "Disponível"}</Badge></TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon"><MoreVertical className="w-4 h-4" /></Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => openEditInstagram(account)}>
                                  <Eye className="w-4 h-4 mr-2" />Editar
                                </DropdownMenuItem>
                                {account.is_sold && (
                                  <DropdownMenuItem onClick={() => handleReactivateInstagram(account.id)}>
                                    <RefreshCw className="w-4 h-4 mr-2" />Reativar
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => handleDeleteInstagramAccount(account.id)} className="text-destructive">
                                  <Trash2 className="w-4 h-4 mr-2" />Excluir
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                      {instagramAccounts.filter(a => !a.created_by).length === 0 && (
                        <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">Nenhuma conta Instagram cadastrada</TableCell></TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </TabsContent>

              {/* Telegram Groups Sub-Tab */}
              <TabsContent value="telegram-groups" className="space-y-4">
                <div className="flex items-center justify-end">
                  <Dialog open={telegramGroupDialogOpen} onOpenChange={setTelegramGroupDialogOpen}>
                    <DialogTrigger asChild>
                      <Button className="telegram-gradient text-white gap-2">
                        <Plus className="w-4 h-4" />Adicionar Grupo
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>Novo Grupo Telegram</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div><Label>Nome do Grupo</Label><Input value={telegramGroupForm.group_name} onChange={(e) => setTelegramGroupForm({ ...telegramGroupForm, group_name: e.target.value })} placeholder="Grupo de Vendas" /></div>
                        <div><Label>Username (sem @)</Label><Input value={telegramGroupForm.group_username} onChange={(e) => setTelegramGroupForm({ ...telegramGroupForm, group_username: e.target.value })} placeholder="grupovendas" /></div>
                        <div className="grid grid-cols-2 gap-4">
                          <div><Label>Membros</Label><Input type="number" value={telegramGroupForm.members_count} onChange={(e) => setTelegramGroupForm({ ...telegramGroupForm, members_count: e.target.value })} placeholder="5000" /></div>
                          <div>
                            <Label>Tipo</Label>
                            <Select value={telegramGroupForm.group_type} onValueChange={(v) => setTelegramGroupForm({ ...telegramGroupForm, group_type: v })}>
                              <SelectTrigger><SelectValue /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="group">Grupo</SelectItem>
                                <SelectItem value="channel">Canal</SelectItem>
                                <SelectItem value="supergroup">Supergrupo</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        <div><Label>Nicho</Label><Input value={telegramGroupForm.niche} onChange={(e) => setTelegramGroupForm({ ...telegramGroupForm, niche: e.target.value })} placeholder="Vendas, Afiliados, etc." /></div>
                        <div><Label>Descrição</Label><Textarea value={telegramGroupForm.description} onChange={(e) => setTelegramGroupForm({ ...telegramGroupForm, description: e.target.value })} placeholder="Descreva o grupo..." /></div>
                        <div><Label>Preço (R$)</Label><Input type="number" step="0.01" value={telegramGroupForm.price} onChange={(e) => setTelegramGroupForm({ ...telegramGroupForm, price: e.target.value })} placeholder="199.90" /></div>
                        <div>
                          <Label>Foto do Grupo</Label>
                          <input type="file" ref={telegramGroupImageInputRef} accept="image/*" className="hidden" onChange={(e) => { const file = e.target.files?.[0]; if (file) setTelegramGroupImageFile(file); }} />
                          <div className="mt-2">
                            {telegramGroupImageFile ? (
                              <div className="flex items-center gap-2 p-2 bg-secondary/50 rounded-lg">
                                <Image className="w-4 h-4" />
                                <span className="text-sm flex-1 truncate">{telegramGroupImageFile.name}</span>
                                <Button variant="ghost" size="sm" onClick={() => setTelegramGroupImageFile(null)}><Trash2 className="w-4 h-4" /></Button>
                              </div>
                            ) : (
                              <Button variant="outline" className="w-full" onClick={() => telegramGroupImageInputRef.current?.click()}>
                                <Upload className="w-4 h-4 mr-2" />Selecionar Foto
                              </Button>
                            )}
                          </div>
                        </div>
                        <div className="border-t pt-4 mt-4">
                          <h4 className="font-semibold mb-3 flex items-center gap-2"><Shield className="w-4 h-4" />Dados para Entrega</h4>
                          <div className="space-y-3">
                            <div><Label>Link de Convite</Label><Input value={telegramGroupForm.deliverable_invite_link} onChange={(e) => setTelegramGroupForm({ ...telegramGroupForm, deliverable_invite_link: e.target.value })} placeholder="https://t.me/joinchat/..." /></div>
                            <div><Label>Notas/Instruções</Label><Textarea value={telegramGroupForm.deliverable_notes} onChange={(e) => setTelegramGroupForm({ ...telegramGroupForm, deliverable_notes: e.target.value })} placeholder="Instruções para o comprador..." /></div>
                          </div>
                        </div>
                        <Button onClick={handleAddTelegramGroup} className="w-full telegram-gradient text-white" disabled={isUploadingTelegramGroup}>
                          {isUploadingTelegramGroup ? <><RefreshCw className="w-4 h-4 mr-2 animate-spin" />Salvando...</> : "Adicionar Grupo"}
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>

                <div className="glass-card overflow-hidden overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nome</TableHead>
                        <TableHead>Username</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Membros</TableHead>
                        <TableHead>Nicho</TableHead>
                        <TableHead>Preço</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {telegramGroups.map((group) => (
                        <TableRow key={group.id}>
                          <TableCell className="font-medium">{group.group_name}</TableCell>
                          <TableCell>{group.group_username ? `@${group.group_username}` : "—"}</TableCell>
                          <TableCell><Badge variant="outline" className="capitalize">{group.group_type}</Badge></TableCell>
                          <TableCell>{formatNumber(group.members_count)}</TableCell>
                          <TableCell>{group.niche || "—"}</TableCell>
                          <TableCell className="font-semibold">{formatPrice(group.price_cents)}</TableCell>
                          <TableCell><Badge variant={group.is_sold ? "secondary" : "default"}>{group.is_sold ? "Vendido" : "Disponível"}</Badge></TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon"><MoreVertical className="w-4 h-4" /></Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => openEditTelegram(group)}>
                                  <Eye className="w-4 h-4 mr-2" />Editar
                                </DropdownMenuItem>
                                {group.is_sold && (
                                  <DropdownMenuItem onClick={() => handleReactivateTelegram(group.id)}>
                                    <RefreshCw className="w-4 h-4 mr-2" />Reativar
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => handleDeleteTelegramGroup(group.id)} className="text-destructive">
                                  <Trash2 className="w-4 h-4 mr-2" />Excluir
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                      {telegramGroups.length === 0 && (
                        <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">Nenhum grupo cadastrado</TableCell></TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </TabsContent>

              {/* Models Black Sub-Tab */}
              <TabsContent value="models" className="space-y-4">
                <div className="flex items-center justify-end">
                  <Dialog open={modelDialogOpen} onOpenChange={setModelDialogOpen}>
                    <DialogTrigger asChild>
                      <Button className="telegram-gradient text-white gap-2">
                        <Plus className="w-4 h-4" />Adicionar Modelo
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>Novo Modelo Black</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div><Label>Nome</Label><Input value={modelForm.name} onChange={(e) => setModelForm({ ...modelForm, name: e.target.value })} placeholder="Nome do modelo" /></div>
                        <div><Label>Bio</Label><Textarea value={modelForm.bio} onChange={(e) => setModelForm({ ...modelForm, bio: e.target.value })} placeholder="Descrição..." /></div>
                        <div><Label>Nicho</Label><Input value={modelForm.niche} onChange={(e) => setModelForm({ ...modelForm, niche: e.target.value })} placeholder="Estratégia, Vendas, etc." /></div>
                        <input type="hidden" value="black" />
                        <div><Label>Preço (R$)</Label><Input type="number" step="0.01" value={modelForm.price} onChange={(e) => setModelForm({ ...modelForm, price: e.target.value })} placeholder="499.90" /></div>
                        <div>
                          <Label>Foto do Modelo</Label>
                          <input type="file" ref={modelImageInputRef} accept="image/*" className="hidden" onChange={(e) => { const file = e.target.files?.[0]; if (file) setModelImageFile(file); }} />
                          <div className="mt-2">
                            {modelImageFile ? (
                              <div className="flex items-center gap-2 p-2 bg-secondary/50 rounded-lg">
                                <Image className="w-4 h-4" />
                                <span className="text-sm flex-1 truncate">{modelImageFile.name}</span>
                                <Button variant="ghost" size="sm" onClick={() => setModelImageFile(null)}><Trash2 className="w-4 h-4" /></Button>
                              </div>
                            ) : (
                              <Button variant="outline" className="w-full" onClick={() => modelImageInputRef.current?.click()}>
                                <Upload className="w-4 h-4 mr-2" />Selecionar Foto
                              </Button>
                            )}
                          </div>
                        </div>
                        <div className="border-t pt-4 mt-4">
                          <h4 className="font-semibold mb-3 flex items-center gap-2"><Shield className="w-4 h-4" />Dados para Entrega</h4>
                          <div className="space-y-3">
                            <div><Label>Link de Acesso</Label><Input value={modelForm.deliverable_link} onChange={(e) => setModelForm({ ...modelForm, deliverable_link: e.target.value })} placeholder="https://drive.google.com/..." /></div>
                            <div><Label>Notas/Instruções</Label><Textarea value={modelForm.deliverable_notes} onChange={(e) => setModelForm({ ...modelForm, deliverable_notes: e.target.value })} placeholder="Instruções para o comprador..." /></div>
                            <div>
                              <Label className="flex items-center gap-2">
                                <GitBranch className="w-4 h-4" />
                                Funil JSON (opcional)
                              </Label>
                              <p className="text-xs text-muted-foreground mb-2">
                                O funil será importado automaticamente para a conta do comprador
                              </p>
                              <input 
                                type="file" 
                                ref={modelFunnelInputRef} 
                                accept=".json,application/json" 
                                className="hidden" 
                                onChange={(e) => { 
                                  const file = e.target.files?.[0]; 
                                  if (file) {
                                    setModelFunnelFile(file);
                                    const reader = new FileReader();
                                    reader.onload = (event) => {
                                      try {
                                        const json = JSON.parse(event.target?.result as string);
                                        setModelFunnelJson(json);
                                        toast({ title: "Funil carregado!", description: `${json.name || "Funil"} será incluído na entrega.` });
                                      } catch (err) {
                                        toast({ title: "Erro", description: "Arquivo JSON inválido", variant: "destructive" });
                                        setModelFunnelFile(null);
                                        setModelFunnelJson(null);
                                      }
                                    };
                                    reader.readAsText(file);
                                  }
                                }} 
                              />
                              <div className="mt-2">
                                {modelFunnelFile ? (
                                  <div className="flex items-center gap-2 p-2 bg-success/10 border border-success/30 rounded-lg">
                                    <GitBranch className="w-4 h-4 text-success" />
                                    <span className="text-sm flex-1 truncate">{modelFunnelFile.name}</span>
                                    <Badge variant="outline" className="text-success border-success">
                                      {modelFunnelJson?.nodes?.length || 0} blocos
                                    </Badge>
                                    <Button variant="ghost" size="sm" onClick={() => { setModelFunnelFile(null); setModelFunnelJson(null); }}>
                                      <Trash2 className="w-4 h-4" />
                                    </Button>
                                  </div>
                                ) : (
                                  <Button variant="outline" className="w-full" onClick={() => modelFunnelInputRef.current?.click()}>
                                    <Upload className="w-4 h-4 mr-2" />Selecionar Funil .json
                                  </Button>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                        <Button onClick={handleAddModel} className="w-full telegram-gradient text-white" disabled={isUploadingModel}>
                          {isUploadingModel ? <><RefreshCw className="w-4 h-4 mr-2 animate-spin" />Salvando...</> : "Adicionar Modelo"}
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
                        <TableHead>Nicho</TableHead>
                        <TableHead>Preço</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {models.filter(m => m.category === "black").map((model) => (
                        <TableRow key={model.id}>
                          <TableCell className="font-medium">{model.name}</TableCell>
                          <TableCell>{model.niche || "—"}</TableCell>
                          <TableCell className="font-semibold">{formatPrice(model.price_cents)}</TableCell>
                          <TableCell><Badge variant={model.is_sold ? "secondary" : "default"}>{model.is_sold ? "Vendido" : "Disponível"}</Badge></TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon"><MoreVertical className="w-4 h-4" /></Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => openEditModel(model)}>
                                  <Eye className="w-4 h-4 mr-2" />Editar
                                </DropdownMenuItem>
                                {model.is_sold && (
                                  <DropdownMenuItem onClick={() => handleReactivateModel(model.id)}>
                                    <RefreshCw className="w-4 h-4 mr-2" />Reativar
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => handleDeleteModel(model.id)} className="text-destructive">
                                  <Trash2 className="w-4 h-4 mr-2" />Excluir
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                      {models.filter(m => m.category === "black").length === 0 && (
                        <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Nenhum modelo Black cadastrado</TableCell></TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </TabsContent>
            </Tabs>
          </TabsContent>

          {/* Templates Tab */}
          <TabsContent value="templates" className="space-y-4">
            <AdminTemplatesPanel />
          </TabsContent>

          {/* Resellers Tab */}
          <TabsContent value="resellers" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total de Vendas</CardTitle>
                  <Store className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{vendorSales.length}</div>
                  <p className="text-xs text-muted-foreground">
                    {vendorSales.filter(s => s.status === 'paid').length} pagas
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Faturamento Bruto</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {formatPrice(vendorSales.filter(s => s.status === 'paid').reduce((acc, s) => acc + s.sale_amount_cents, 0))}
                  </div>
                  <p className="text-xs text-muted-foreground">Total de vendas pagas</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Comissão Revendedores</CardTitle>
                  <Percent className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {formatPrice(vendorSales.filter(s => s.status === 'paid').reduce((acc, s) => acc + s.vendor_commission_cents, 0))}
                  </div>
                  <p className="text-xs text-muted-foreground">{vendorCommissionPercent}% das vendas</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Taxa Plataforma</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {formatPrice(vendorSales.filter(s => s.status === 'paid').reduce((acc, s) => acc + s.platform_fee_cents, 0))}
                  </div>
                  <p className="text-xs text-muted-foreground">{100 - vendorCommissionPercent}% das vendas</p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Store className="w-5 h-5" />
                    Vendas de Revendedores ({vendorSales.filter(s => vendorSalesFilter === "all" || s.item_type === vendorSalesFilter).length})
                  </CardTitle>
                  <Select value={vendorSalesFilter} onValueChange={setVendorSalesFilter}>
                    <SelectTrigger className="w-[180px]">
                      <Filter className="w-4 h-4 mr-2" />
                      <SelectValue placeholder="Filtrar por tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="instagram_account">Instagram</SelectItem>
                      <SelectItem value="tiktok_account">TikTok</SelectItem>
                      <SelectItem value="telegram_group">Telegram</SelectItem>
                      <SelectItem value="model">Modelos</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent>
                {vendorSales.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Store className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p>Nenhuma venda de revendedor</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Revendedor</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Valor Venda</TableHead>
                        <TableHead>Comissão Vendor</TableHead>
                        <TableHead>Taxa Plataforma</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Data</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {vendorSales
                        .filter(s => vendorSalesFilter === "all" || s.item_type === vendorSalesFilter)
                        .map((sale) => (
                        <TableRow key={sale.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium">{sale.vendor_profile?.full_name || "—"}</p>
                              <p className="text-sm text-muted-foreground">{sale.vendor_profile?.email}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="capitalize">
                              {sale.item_type === "instagram_account" ? "Instagram" : 
                               sale.item_type === "tiktok_account" ? "TikTok" : 
                               sale.item_type === "telegram_group" ? "Telegram" : 
                               sale.item_type === "model" ? "Modelo" : sale.item_type}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-medium">{formatPrice(sale.sale_amount_cents)}</TableCell>
                          <TableCell className="text-success">{formatPrice(sale.vendor_commission_cents)}</TableCell>
                          <TableCell className="text-muted-foreground">{formatPrice(sale.platform_fee_cents)}</TableCell>
                          <TableCell>
                            <Badge variant={sale.status === "paid" ? "default" : "secondary"}>
                              {sale.status === "paid" ? "Pago" : "Pendente"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-muted-foreground">{formatDate(sale.created_at)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>

            {/* Reseller Products Section */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5" />
                    Produtos de Revendedores ({resellerInstagramAccounts.length + resellerTiktokAccounts.length + resellerTelegramGroups.length + resellerModels.length})
                  </CardTitle>
                  <Select value={vendorProductsFilter} onValueChange={setVendorProductsFilter}>
                    <SelectTrigger className="w-[180px]">
                      <Filter className="w-4 h-4 mr-2" />
                      <SelectValue placeholder="Filtrar por tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="instagram">Instagram</SelectItem>
                      <SelectItem value="tiktok">TikTok</SelectItem>
                      <SelectItem value="telegram">Telegram</SelectItem>
                      <SelectItem value="model">Modelos</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Instagram Accounts from Resellers */}
                {(vendorProductsFilter === "all" || vendorProductsFilter === "instagram") && resellerInstagramAccounts.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                      <Users className="w-4 h-4" /> Instagram ({resellerInstagramAccounts.length})
                    </h4>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[60px]">Foto</TableHead>
                          <TableHead>Username</TableHead>
                          <TableHead>Seguidores</TableHead>
                          <TableHead>Preço</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="w-[60px]">Ações</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {resellerInstagramAccounts.map((acc) => (
                          <TableRow key={acc.id}>
                            <TableCell>
                              {acc.image_url ? (
                                <img src={acc.image_url} alt={acc.username} className="w-10 h-10 rounded-lg object-cover" />
                              ) : (
                                <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center">
                                  <Users className="w-5 h-5 text-muted-foreground" />
                                </div>
                              )}
                            </TableCell>
                            <TableCell className="font-medium">@{acc.username}</TableCell>
                            <TableCell>{formatNumber(acc.followers)}</TableCell>
                            <TableCell>{formatPrice(acc.price_cents)}</TableCell>
                            <TableCell><Badge variant={acc.is_sold ? "secondary" : "default"}>{acc.is_sold ? "Vendida" : "Disponível"}</Badge></TableCell>
                            <TableCell>
                              <Button variant="ghost" size="icon" onClick={() => openEditResellerInstagram(acc)}>
                                <Eye className="w-4 h-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}

                {/* TikTok Accounts from Resellers */}
                {(vendorProductsFilter === "all" || vendorProductsFilter === "tiktok") && resellerTiktokAccounts.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                      <Video className="w-4 h-4" /> TikTok ({resellerTiktokAccounts.length})
                    </h4>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[60px]">Foto</TableHead>
                          <TableHead>Username</TableHead>
                          <TableHead>Seguidores</TableHead>
                          <TableHead>Curtidas</TableHead>
                          <TableHead>Preço</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {resellerTiktokAccounts.map((acc) => (
                          <TableRow key={acc.id}>
                            <TableCell>
                              {acc.image_url ? (
                                <img src={acc.image_url} alt={acc.username} className="w-10 h-10 rounded-lg object-cover" />
                              ) : (
                                <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center">
                                  <Video className="w-5 h-5 text-muted-foreground" />
                                </div>
                              )}
                            </TableCell>
                            <TableCell className="font-medium">@{acc.username}</TableCell>
                            <TableCell>{formatNumber(acc.followers)}</TableCell>
                            <TableCell>{formatNumber(acc.likes)}</TableCell>
                            <TableCell>{formatPrice(acc.price_cents)}</TableCell>
                            <TableCell><Badge variant={acc.is_sold ? "secondary" : "default"}>{acc.is_sold ? "Vendida" : "Disponível"}</Badge></TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}

                {/* Telegram Groups from Resellers */}
                {(vendorProductsFilter === "all" || vendorProductsFilter === "telegram") && resellerTelegramGroups.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                      <MessageSquare className="w-4 h-4" /> Telegram ({resellerTelegramGroups.length})
                    </h4>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[60px]">Foto</TableHead>
                          <TableHead>Nome</TableHead>
                          <TableHead>Membros</TableHead>
                          <TableHead>Preço</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {resellerTelegramGroups.map((grp) => (
                          <TableRow key={grp.id}>
                            <TableCell>
                              {grp.image_url ? (
                                <img src={grp.image_url} alt={grp.group_name} className="w-10 h-10 rounded-lg object-cover" />
                              ) : (
                                <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center">
                                  <MessageSquare className="w-5 h-5 text-muted-foreground" />
                                </div>
                              )}
                            </TableCell>
                            <TableCell className="font-medium">{grp.group_name}</TableCell>
                            <TableCell>{formatNumber(grp.members_count)}</TableCell>
                            <TableCell>{formatPrice(grp.price_cents)}</TableCell>
                            <TableCell><Badge variant={grp.is_sold ? "secondary" : "default"}>{grp.is_sold ? "Vendido" : "Disponível"}</Badge></TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}

                {/* Models from Resellers */}
                {(vendorProductsFilter === "all" || vendorProductsFilter === "model") && resellerModels.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                      <Sparkles className="w-4 h-4" /> Modelos ({resellerModels.length})
                    </h4>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[60px]">Foto</TableHead>
                          <TableHead>Nome</TableHead>
                          <TableHead>Nicho</TableHead>
                          <TableHead>Preço</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {resellerModels.map((model) => (
                          <TableRow key={model.id}>
                            <TableCell>
                              {model.image_url ? (
                                <img src={model.image_url} alt={model.name} className="w-10 h-10 rounded-lg object-cover" />
                              ) : (
                                <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center">
                                  <Sparkles className="w-5 h-5 text-muted-foreground" />
                                </div>
                              )}
                            </TableCell>
                            <TableCell className="font-medium">{model.name}</TableCell>
                            <TableCell>{model.niche || "—"}</TableCell>
                            <TableCell>{formatPrice(model.price_cents)}</TableCell>
                            <TableCell><Badge variant={model.is_sold ? "secondary" : "default"}>{model.is_sold ? "Vendido" : "Disponível"}</Badge></TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}

                {resellerInstagramAccounts.length === 0 && resellerTiktokAccounts.length === 0 && resellerTelegramGroups.length === 0 && resellerModels.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Sparkles className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p>Nenhum produto de revendedor cadastrado</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notifications Tab */}
          <TabsContent value="notifications" className="space-y-6">
            <AdminBannersPanel />
            <AdminNotificationsPanel />
          </TabsContent>

          {/* Automation Tab */}
          <TabsContent value="automation" className="space-y-6">
            <AdminAutomationPanel />
          </TabsContent>

          {/* Referrals Tab */}
          <TabsContent value="referrals" className="space-y-6">
            <AdminReferralsPanel />
          </TabsContent>

          {/* Smart Links Tab */}
          <TabsContent value="smart-links" className="space-y-6">
            <div className="space-y-2">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Share2 className="w-5 h-5" />
                Gerenciamento de Smart Links
              </h3>
              <p className="text-sm text-muted-foreground">
                Configure a URL base e gerencie todas as páginas de Smart Links dos usuários.
              </p>
            </div>
            
            {/* URL Base Configuration */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">URL Base do Smart Link</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="smartLinkBaseUrl">URL Base</Label>
                  <div className="flex gap-2">
                    <Input
                      id="smartLinkBaseUrl"
                      value={smartLinkBaseUrlInput}
                      onChange={(e) => setSmartLinkBaseUrlInput(e.target.value)}
                      placeholder="https://seudominio.com.br"
                      className="flex-1"
                    />
                    <Button 
                      onClick={handleSaveSmartLinkUrl}
                      disabled={isSavingSmartLinkUrl || smartLinkBaseUrlInput === smartLinkBaseUrl}
                      className="telegram-gradient text-white"
                    >
                      {isSavingSmartLinkUrl ? (
                        <><RefreshCw className="w-4 h-4 mr-2 animate-spin" />Salvando...</>
                      ) : "Salvar"}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Exemplo: https://seudominio.com.br → Os leads verão links como https://seudominio.com.br/@slug
                  </p>
                  {smartLinkBaseUrl && (
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant="outline" className="text-xs">
                        URL atual: {smartLinkBaseUrl}
                      </Badge>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Smart Link Pages List */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Link className="w-4 h-4" />
                    Páginas de Smart Links ({smartLinkPages.length})
                  </CardTitle>
                  <Input
                    placeholder="Buscar por título, slug ou email..."
                    value={smartLinkSearchQuery}
                    onChange={(e) => setSmartLinkSearchQuery(e.target.value)}
                    className="max-w-xs"
                  />
                </div>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[400px]">
                  {filteredSmartLinkPages.length === 0 ? (
                    <div className="text-center text-muted-foreground py-8">
                      {smartLinkSearchQuery ? "Nenhuma página encontrada" : "Nenhuma página de Smart Link criada"}
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Título</TableHead>
                          <TableHead>Slug</TableHead>
                          <TableHead>Usuário</TableHead>
                          <TableHead className="text-center">Views</TableHead>
                          <TableHead className="text-center">Status</TableHead>
                          <TableHead>Criado em</TableHead>
                          <TableHead className="text-right">Ações</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredSmartLinkPages.map((page) => (
                          <TableRow key={page.id}>
                            <TableCell className="font-medium">{page.title}</TableCell>
                            <TableCell>
                              <code className="text-xs bg-secondary px-1.5 py-0.5 rounded">@{page.slug}</code>
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">{page.user_email}</TableCell>
                            <TableCell className="text-center">
                              <Badge variant="secondary">{page.total_views}</Badge>
                            </TableCell>
                            <TableCell className="text-center">
                              <Badge variant={page.is_active ? "default" : "secondary"}>
                                {page.is_active ? "Ativo" : "Inativo"}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-sm">
                              {format(new Date(page.created_at), "dd/MM/yy", { locale: ptBR })}
                            </TableCell>
                            <TableCell className="text-right">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon">
                                    <MoreVertical className="w-4 h-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => {
                                    const baseUrl = smartLinkBaseUrl || window.location.origin;
                                    window.open(`${baseUrl}/@${page.slug}`, "_blank");
                                  }}>
                                    <ExternalLink className="w-4 h-4 mr-2" />
                                    Ver Página
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleToggleSmartLinkStatus(page.id, page.is_active)}>
                                    {page.is_active ? (
                                      <><Ban className="w-4 h-4 mr-2" />Desativar</>
                                    ) : (
                                      <><CheckCircle2 className="w-4 h-4 mr-2" />Ativar</>
                                    )}
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                      <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive">
                                        <Trash2 className="w-4 h-4 mr-2" />
                                        Excluir
                                      </DropdownMenuItem>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                      <AlertDialogHeader>
                                        <AlertDialogTitle>Excluir Smart Link?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                          Esta ação é irreversível. A página "@{page.slug}" será excluída permanentemente.
                                        </AlertDialogDescription>
                                      </AlertDialogHeader>
                                      <AlertDialogFooter>
                                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                        <AlertDialogAction onClick={() => handleDeleteSmartLink(page.id)} className="bg-destructive text-destructive-foreground">
                                          Excluir
                                        </AlertDialogAction>
                                      </AlertDialogFooter>
                                    </AlertDialogContent>
                                  </AlertDialog>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Settings Tab - All Feature Toggles */}
          <TabsContent value="settings" className="space-y-4">
            <div className="space-y-2">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Configurações de Features
              </h3>
              <p className="text-sm text-muted-foreground">
                Ative ou desative features da plataforma. Quando desativadas, os usuários não verão essas opções no menu e serão redirecionados se tentarem acessar diretamente.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {/* Destinations Toggle */}
              <Card className="border-dashed">
                <CardContent className="flex items-center justify-between py-4">
                  <div className="space-y-0.5">
                    <div className="font-medium flex items-center gap-2">
                      <Target className="w-4 h-4 text-muted-foreground" />
                      Destinos
                      <Badge variant={adminSettings.destinations_enabled ? "default" : "secondary"}>
                        {adminSettings.destinations_enabled ? "Ativo" : "Desativado"}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Permite gerenciar grupos/canais do Telegram
                    </p>
                  </div>
                  <Switch
                    checked={adminSettings.destinations_enabled}
                    onCheckedChange={(checked) => updateSetting("destinations_enabled", checked)}
                  />
                </CardContent>
              </Card>

              {/* Campaigns Toggle */}
              <Card className="border-dashed">
                <CardContent className="flex items-center justify-between py-4">
                  <div className="space-y-0.5">
                    <div className="font-medium flex items-center gap-2">
                      <Megaphone className="w-4 h-4 text-muted-foreground" />
                      Campanhas
                      <Badge variant={adminSettings.campaigns_enabled ? "default" : "secondary"}>
                        {adminSettings.campaigns_enabled ? "Ativo" : "Desativado"}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Disparo de mídias em massa
                    </p>
                  </div>
                  <Switch
                    checked={adminSettings.campaigns_enabled}
                    onCheckedChange={(checked) => updateSetting("campaigns_enabled", checked)}
                  />
                </CardContent>
              </Card>

              {/* Contas Toggle (TikTok + Models) */}
              <Card className="border-dashed">
                <CardContent className="flex items-center justify-between py-4">
                  <div className="space-y-0.5">
                    <div className="font-medium flex items-center gap-2">
                      <Users className="w-4 h-4 text-muted-foreground" />
                      Contas
                      <Badge variant={(adminSettings.tiktok_enabled || adminSettings.models_enabled) ? "default" : "secondary"}>
                        {(adminSettings.tiktok_enabled || adminSettings.models_enabled) ? "Ativo" : "Desativado"}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Catálogo de contas TikTok, Instagram e Modelos Black
                    </p>
                  </div>
                  <Switch
                    checked={adminSettings.tiktok_enabled || adminSettings.models_enabled}
                    onCheckedChange={(checked) => {
                      updateSetting("tiktok_enabled", checked);
                      updateSetting("models_enabled", checked);
                    }}
                  />
                </CardContent>
              </Card>

              {/* Funnels Toggle */}
              <Card className="border-dashed">
                <CardContent className="flex items-center justify-between py-4">
                  <div className="space-y-0.5">
                    <div className="font-medium flex items-center gap-2">
                      <GitBranch className="w-4 h-4 text-muted-foreground" />
                      Funis
                      <Badge variant={adminSettings.funnels_enabled ? "default" : "secondary"}>
                        {adminSettings.funnels_enabled ? "Ativo" : "Desativado"}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Builder de funis de conversação
                    </p>
                  </div>
                  <Switch
                    checked={adminSettings.funnels_enabled}
                    onCheckedChange={(checked) => updateSetting("funnels_enabled", checked)}
                  />
                </CardContent>
              </Card>

              {/* WhatsApp Toggle */}
              <Card className="border-dashed">
                <CardContent className="flex items-center justify-between py-4">
                  <div className="space-y-0.5">
                    <div className="font-medium flex items-center gap-2">
                      <MessageSquare className="w-4 h-4 text-muted-foreground" />
                      WhatsApp
                      <Badge variant={adminSettings.whatsapp_enabled ? "default" : "secondary"}>
                        {adminSettings.whatsapp_enabled ? "Ativo" : "Desativado"}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Integração WhatsApp Business Cloud API
                    </p>
                  </div>
                  <Switch
                    checked={adminSettings.whatsapp_enabled}
                    onCheckedChange={(checked) => updateSetting("whatsapp_enabled", checked)}
                  />
                </CardContent>
              </Card>

              {/* Media Library Toggle */}
              <Card className="border-dashed">
                <CardContent className="flex items-center justify-between py-4">
                  <div className="space-y-0.5">
                    <div className="font-medium flex items-center gap-2">
                      <Image className="w-4 h-4 text-muted-foreground" />
                      Biblioteca de Mídias
                      <Badge variant={adminSettings.media_library_enabled ? "default" : "secondary"}>
                        {adminSettings.media_library_enabled ? "Ativo" : "Desativado"}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Acesso aos pacotes de mídias
                    </p>
                  </div>
                  <Switch
                    checked={adminSettings.media_library_enabled}
                    onCheckedChange={(checked) => updateSetting("media_library_enabled", checked)}
                  />
                </CardContent>
              </Card>

              {/* Telegram Groups Toggle */}
              <Card className="border-dashed">
                <CardContent className="flex items-center justify-between py-4">
                  <div className="space-y-0.5">
                    <div className="font-medium flex items-center gap-2">
                      <Users className="w-4 h-4 text-muted-foreground" />
                      Grupos Telegram
                      <Badge variant={adminSettings.telegram_groups_enabled ? "default" : "secondary"}>
                        {adminSettings.telegram_groups_enabled ? "Ativo" : "Desativado"}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Catálogo de grupos/canais Telegram à venda
                    </p>
                  </div>
                  <Switch
                    checked={adminSettings.telegram_groups_enabled}
                    onCheckedChange={(checked) => updateSetting("telegram_groups_enabled", checked)}
                  />
                </CardContent>
              </Card>
            </div>

            {/* Settings History */}
            <div className="mt-8 space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Histórico de Alterações
              </h3>
              
              <Card>
                <CardContent className="p-0">
                  <ScrollArea className="h-[300px]">
                    {isLoadingHistory ? (
                      <div className="p-4 text-center text-muted-foreground">
                        <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2" />
                        Carregando histórico...
                      </div>
                    ) : settingsHistory.length === 0 ? (
                      <div className="p-4 text-center text-muted-foreground">
                        Nenhuma alteração registrada
                      </div>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Data/Hora</TableHead>
                            <TableHead>Configuração</TableHead>
                            <TableHead>De</TableHead>
                            <TableHead>Para</TableHead>
                            <TableHead>Alterado por</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {settingsHistory.map((entry) => (
                            <TableRow key={entry.id}>
                              <TableCell className="text-sm">
                                {format(new Date(entry.changed_at), "dd/MM/yy HH:mm", { locale: ptBR })}
                              </TableCell>
                              <TableCell className="font-medium">
                                {getSettingLabel(entry.setting_key)}
                              </TableCell>
                              <TableCell>
                                <Badge variant={entry.old_value ? "default" : "secondary"} className="text-xs">
                                  {entry.old_value === null ? "—" : entry.old_value ? "Ativo" : "Desativado"}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <Badge variant={entry.new_value ? "default" : "secondary"} className="text-xs">
                                  {entry.new_value ? "Ativo" : "Desativado"}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-sm text-muted-foreground">
                                {entry.changed_by_email || "Sistema"}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    )}
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* System Configuration Tab */}
          <TabsContent value="system" className="space-y-4">
            <AdminSystemConfigPanel />
          </TabsContent>

          {/* T.I. Panel Tab */}
          <TabsContent value="ti" className="space-y-4">
            <AdminTIPanel />
          </TabsContent>

          {/* Account Managers Tab */}
          <TabsContent value="account-managers" className="space-y-4">
            <AdminAccountManagersPanel />
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
                    <SelectItem value="vendor">Vendedor Geral</SelectItem>
                    <SelectItem value="vendor_instagram">Vendedor Instagram</SelectItem>
                    <SelectItem value="vendor_tiktok">Vendedor TikTok</SelectItem>
                    <SelectItem value="vendor_model">Vendedor Modelos</SelectItem>
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

        {/* Edit Reseller Instagram Dialog */}
        <Dialog open={editResellerInstagramDialogOpen} onOpenChange={setEditResellerInstagramDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Editar Conta Instagram</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div><Label>Preço (R$)</Label><Input type="number" value={instagramForm.price} onChange={(e) => setInstagramForm({ ...instagramForm, price: e.target.value })} /></div>
              <div><Label>Login</Label><Input value={instagramForm.deliverable_login} onChange={(e) => setInstagramForm({ ...instagramForm, deliverable_login: e.target.value })} /></div>
              <div><Label>Senha</Label><Input value={instagramForm.deliverable_password} onChange={(e) => setInstagramForm({ ...instagramForm, deliverable_password: e.target.value })} /></div>
              <div><Label>Email</Label><Input value={instagramForm.deliverable_email} onChange={(e) => setInstagramForm({ ...instagramForm, deliverable_email: e.target.value })} /></div>
              <div><Label>Notas</Label><Textarea value={instagramForm.deliverable_notes} onChange={(e) => setInstagramForm({ ...instagramForm, deliverable_notes: e.target.value })} /></div>
            </div>
            <DialogFooter><Button onClick={handleUpdateResellerInstagram}>Salvar</Button></DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Reseller TikTok Dialog */}
        <Dialog open={editResellerTiktokDialogOpen} onOpenChange={setEditResellerTiktokDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Editar Conta TikTok</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div><Label>Preço (R$)</Label><Input type="number" value={tiktokForm.price} onChange={(e) => setTiktokForm({ ...tiktokForm, price: e.target.value })} /></div>
              <div><Label>Login</Label><Input value={tiktokForm.deliverable_login} onChange={(e) => setTiktokForm({ ...tiktokForm, deliverable_login: e.target.value })} /></div>
              <div><Label>Senha</Label><Input value={tiktokForm.deliverable_password} onChange={(e) => setTiktokForm({ ...tiktokForm, deliverable_password: e.target.value })} /></div>
              <div><Label>Email</Label><Input value={tiktokForm.deliverable_email} onChange={(e) => setTiktokForm({ ...tiktokForm, deliverable_email: e.target.value })} /></div>
              <div><Label>Notas</Label><Textarea value={tiktokForm.deliverable_notes} onChange={(e) => setTiktokForm({ ...tiktokForm, deliverable_notes: e.target.value })} /></div>
            </div>
            <DialogFooter><Button onClick={handleUpdateResellerTiktok}>Salvar</Button></DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Reseller Telegram Dialog */}
        <Dialog open={editResellerTelegramDialogOpen} onOpenChange={setEditResellerTelegramDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Editar Grupo Telegram</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div><Label>Preço (R$)</Label><Input type="number" value={telegramGroupForm.price} onChange={(e) => setTelegramGroupForm({ ...telegramGroupForm, price: e.target.value })} /></div>
              <div><Label>Link de Convite</Label><Input value={telegramGroupForm.deliverable_invite_link} onChange={(e) => setTelegramGroupForm({ ...telegramGroupForm, deliverable_invite_link: e.target.value })} /></div>
              <div><Label>Notas</Label><Textarea value={telegramGroupForm.deliverable_notes} onChange={(e) => setTelegramGroupForm({ ...telegramGroupForm, deliverable_notes: e.target.value })} /></div>
            </div>
            <DialogFooter><Button onClick={handleUpdateResellerTelegram}>Salvar</Button></DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Reseller Model Dialog */}
        <Dialog open={editResellerModelDialogOpen} onOpenChange={setEditResellerModelDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Editar Modelo</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div><Label>Preço (R$)</Label><Input type="number" value={modelForm.price} onChange={(e) => setModelForm({ ...modelForm, price: e.target.value })} /></div>
              <div><Label>Link</Label><Input value={modelForm.deliverable_link} onChange={(e) => setModelForm({ ...modelForm, deliverable_link: e.target.value })} /></div>
              <div><Label>Notas</Label><Textarea value={modelForm.deliverable_notes} onChange={(e) => setModelForm({ ...modelForm, deliverable_notes: e.target.value })} /></div>
            </div>
            <DialogFooter><Button onClick={handleUpdateResellerModel}>Salvar</Button></DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Admin Model Dialog */}
        <Dialog open={editModelDialogOpen} onOpenChange={setEditModelDialogOpen}>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Editar Modelo Black</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div><Label>Nome</Label><Input value={modelForm.name} onChange={(e) => setModelForm({ ...modelForm, name: e.target.value })} placeholder="Nome do modelo" /></div>
              <div><Label>Bio</Label><Textarea value={modelForm.bio} onChange={(e) => setModelForm({ ...modelForm, bio: e.target.value })} placeholder="Descrição..." /></div>
              <div><Label>Nicho</Label><Input value={modelForm.niche} onChange={(e) => setModelForm({ ...modelForm, niche: e.target.value })} placeholder="Estratégia, Vendas, etc." /></div>
              <div><Label>Preço (R$)</Label><Input type="number" step="0.01" value={modelForm.price} onChange={(e) => setModelForm({ ...modelForm, price: e.target.value })} placeholder="499.90" /></div>
              <div>
                <Label>Foto do Modelo</Label>
                <input type="file" ref={modelImageInputRef} accept="image/*" className="hidden" onChange={(e) => { const file = e.target.files?.[0]; if (file) setModelImageFile(file); }} />
                <div className="mt-2">
                  {modelImageFile ? (
                    <div className="flex items-center gap-2 p-2 bg-secondary/50 rounded-lg">
                      <Image className="w-4 h-4" />
                      <span className="text-sm flex-1 truncate">{modelImageFile.name}</span>
                      <Button variant="ghost" size="sm" onClick={() => setModelImageFile(null)}><Trash2 className="w-4 h-4" /></Button>
                    </div>
                  ) : selectedEditModel?.image_url ? (
                    <div className="flex items-center gap-2 p-2 bg-secondary/50 rounded-lg">
                      <img src={selectedEditModel.image_url} alt="Preview" className="w-10 h-10 rounded object-cover" />
                      <span className="text-sm flex-1">Imagem atual</span>
                      <Button variant="outline" size="sm" onClick={() => modelImageInputRef.current?.click()}>Trocar</Button>
                    </div>
                  ) : (
                    <Button variant="outline" className="w-full" onClick={() => modelImageInputRef.current?.click()}>
                      <Upload className="w-4 h-4 mr-2" />Selecionar Foto
                    </Button>
                  )}
                </div>
              </div>
              <div className="border-t pt-4 mt-4">
                <h4 className="font-semibold mb-3 flex items-center gap-2"><Shield className="w-4 h-4" />Dados para Entrega</h4>
                <div className="space-y-3">
                  <div><Label>Link de Acesso</Label><Input value={modelForm.deliverable_link} onChange={(e) => setModelForm({ ...modelForm, deliverable_link: e.target.value })} placeholder="https://drive.google.com/..." /></div>
                  <div><Label>Notas/Instruções</Label><Textarea value={modelForm.deliverable_notes} onChange={(e) => setModelForm({ ...modelForm, deliverable_notes: e.target.value })} placeholder="Instruções para o comprador..." /></div>
                </div>
              </div>
              <Button onClick={handleUpdateModel} className="w-full telegram-gradient text-white" disabled={isUploadingModel}>
                {isUploadingModel ? <><RefreshCw className="w-4 h-4 mr-2 animate-spin" />Salvando...</> : "Salvar Alterações"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Edit Admin TikTok Dialog */}
        <Dialog open={editTiktokDialogOpen} onOpenChange={setEditTiktokDialogOpen}>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Editar Conta TikTok</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div><Label>Username</Label><Input value={tiktokForm.username} onChange={(e) => setTiktokForm({ ...tiktokForm, username: e.target.value })} placeholder="@usuario" /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Seguidores</Label><Input type="number" value={tiktokForm.followers} onChange={(e) => setTiktokForm({ ...tiktokForm, followers: e.target.value })} /></div>
                <div><Label>Curtidas</Label><Input type="number" value={tiktokForm.likes} onChange={(e) => setTiktokForm({ ...tiktokForm, likes: e.target.value })} /></div>
              </div>
              <div><Label>Nicho</Label><Input value={tiktokForm.niche} onChange={(e) => setTiktokForm({ ...tiktokForm, niche: e.target.value })} placeholder="Entretenimento, Música, etc." /></div>
              <div><Label>Descrição</Label><Textarea value={tiktokForm.description} onChange={(e) => setTiktokForm({ ...tiktokForm, description: e.target.value })} placeholder="Descreva a conta..." /></div>
              <div><Label>Preço (R$)</Label><Input type="number" step="0.01" value={tiktokForm.price} onChange={(e) => setTiktokForm({ ...tiktokForm, price: e.target.value })} /></div>
              <div>
                <Label>Foto da Conta</Label>
                <input type="file" ref={tiktokImageInputRef} accept="image/*" className="hidden" onChange={(e) => { const file = e.target.files?.[0]; if (file) setTiktokImageFile(file); }} />
                <div className="mt-2">
                  {tiktokImageFile ? (
                    <div className="flex items-center gap-2 p-2 bg-secondary/50 rounded-lg">
                      <Image className="w-4 h-4" />
                      <span className="text-sm flex-1 truncate">{tiktokImageFile.name}</span>
                      <Button variant="ghost" size="sm" onClick={() => setTiktokImageFile(null)}><Trash2 className="w-4 h-4" /></Button>
                    </div>
                  ) : selectedEditTiktok?.image_url ? (
                    <div className="flex items-center gap-2 p-2 bg-secondary/50 rounded-lg">
                      <img src={selectedEditTiktok.image_url} alt="Preview" className="w-10 h-10 rounded object-cover" />
                      <span className="text-sm flex-1">Imagem atual</span>
                      <Button variant="outline" size="sm" onClick={() => tiktokImageInputRef.current?.click()}>Trocar</Button>
                    </div>
                  ) : (
                    <Button variant="outline" className="w-full" onClick={() => tiktokImageInputRef.current?.click()}>
                      <Upload className="w-4 h-4 mr-2" />Selecionar Foto
                    </Button>
                  )}
                </div>
              </div>
              <div className="border-t pt-4 mt-4">
                <h4 className="font-semibold mb-3 flex items-center gap-2"><Shield className="w-4 h-4" />Dados para Entrega</h4>
                <div className="space-y-3">
                  <div><Label>Login</Label><Input value={tiktokForm.deliverable_login} onChange={(e) => setTiktokForm({ ...tiktokForm, deliverable_login: e.target.value })} /></div>
                  <div><Label>Senha</Label><Input type="password" value={tiktokForm.deliverable_password} onChange={(e) => setTiktokForm({ ...tiktokForm, deliverable_password: e.target.value })} /></div>
                  <div><Label>Email Vinculado</Label><Input value={tiktokForm.deliverable_email} onChange={(e) => setTiktokForm({ ...tiktokForm, deliverable_email: e.target.value })} /></div>
                  <div><Label>Notas</Label><Textarea value={tiktokForm.deliverable_notes} onChange={(e) => setTiktokForm({ ...tiktokForm, deliverable_notes: e.target.value })} /></div>
                </div>
              </div>
              <Button onClick={handleUpdateTiktok} className="w-full telegram-gradient text-white" disabled={isUploadingTiktok}>
                {isUploadingTiktok ? <><RefreshCw className="w-4 h-4 mr-2 animate-spin" />Salvando...</> : "Salvar Alterações"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Edit Admin Instagram Dialog */}
        <Dialog open={editInstagramDialogOpen} onOpenChange={setEditInstagramDialogOpen}>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Editar Conta Instagram</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div><Label>Username</Label><Input value={instagramForm.username} onChange={(e) => setInstagramForm({ ...instagramForm, username: e.target.value })} placeholder="@usuario" /></div>
              <div className="grid grid-cols-3 gap-4">
                <div><Label>Seguidores</Label><Input type="number" value={instagramForm.followers} onChange={(e) => setInstagramForm({ ...instagramForm, followers: e.target.value })} /></div>
                <div><Label>Seguindo</Label><Input type="number" value={instagramForm.following} onChange={(e) => setInstagramForm({ ...instagramForm, following: e.target.value })} /></div>
                <div><Label>Posts</Label><Input type="number" value={instagramForm.posts_count} onChange={(e) => setInstagramForm({ ...instagramForm, posts_count: e.target.value })} /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Taxa de Engajamento (%)</Label><Input type="number" step="0.1" value={instagramForm.engagement_rate} onChange={(e) => setInstagramForm({ ...instagramForm, engagement_rate: e.target.value })} /></div>
                <div className="flex items-center gap-2 pt-6">
                  <input type="checkbox" id="edit_is_verified" checked={instagramForm.is_verified} onChange={(e) => setInstagramForm({ ...instagramForm, is_verified: e.target.checked })} className="h-4 w-4" />
                  <Label htmlFor="edit_is_verified">Verificada</Label>
                </div>
              </div>
              <div><Label>Nicho</Label><Input value={instagramForm.niche} onChange={(e) => setInstagramForm({ ...instagramForm, niche: e.target.value })} /></div>
              <div><Label>Descrição</Label><Textarea value={instagramForm.description} onChange={(e) => setInstagramForm({ ...instagramForm, description: e.target.value })} /></div>
              <div><Label>Preço (R$)</Label><Input type="number" step="0.01" value={instagramForm.price} onChange={(e) => setInstagramForm({ ...instagramForm, price: e.target.value })} /></div>
              <div>
                <Label>Foto da Conta</Label>
                <input type="file" ref={instagramImageInputRef} accept="image/*" className="hidden" onChange={(e) => { const file = e.target.files?.[0]; if (file) setInstagramImageFile(file); }} />
                <div className="mt-2">
                  {instagramImageFile ? (
                    <div className="flex items-center gap-2 p-2 bg-secondary/50 rounded-lg">
                      <Image className="w-4 h-4" />
                      <span className="text-sm flex-1 truncate">{instagramImageFile.name}</span>
                      <Button variant="ghost" size="sm" onClick={() => setInstagramImageFile(null)}><Trash2 className="w-4 h-4" /></Button>
                    </div>
                  ) : selectedEditInstagram?.image_url ? (
                    <div className="flex items-center gap-2 p-2 bg-secondary/50 rounded-lg">
                      <img src={selectedEditInstagram.image_url} alt="Preview" className="w-10 h-10 rounded object-cover" />
                      <span className="text-sm flex-1">Imagem atual</span>
                      <Button variant="outline" size="sm" onClick={() => instagramImageInputRef.current?.click()}>Trocar</Button>
                    </div>
                  ) : (
                    <Button variant="outline" className="w-full" onClick={() => instagramImageInputRef.current?.click()}>
                      <Upload className="w-4 h-4 mr-2" />Selecionar Foto
                    </Button>
                  )}
                </div>
              </div>
              <div className="border-t pt-4 mt-4">
                <h4 className="font-semibold mb-3 flex items-center gap-2"><Shield className="w-4 h-4" />Dados para Entrega</h4>
                <div className="space-y-3">
                  <div><Label>Login</Label><Input value={instagramForm.deliverable_login} onChange={(e) => setInstagramForm({ ...instagramForm, deliverable_login: e.target.value })} /></div>
                  <div><Label>Senha</Label><Input type="password" value={instagramForm.deliverable_password} onChange={(e) => setInstagramForm({ ...instagramForm, deliverable_password: e.target.value })} /></div>
                  <div><Label>Email Vinculado</Label><Input value={instagramForm.deliverable_email} onChange={(e) => setInstagramForm({ ...instagramForm, deliverable_email: e.target.value })} /></div>
                  <div><Label>Notas</Label><Textarea value={instagramForm.deliverable_notes} onChange={(e) => setInstagramForm({ ...instagramForm, deliverable_notes: e.target.value })} /></div>
                </div>
              </div>
              <Button onClick={handleUpdateInstagram} className="w-full telegram-gradient text-white" disabled={isUploadingInstagram}>
                {isUploadingInstagram ? <><RefreshCw className="w-4 h-4 mr-2 animate-spin" />Salvando...</> : "Salvar Alterações"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Edit Admin Telegram Dialog */}
        <Dialog open={editTelegramDialogOpen} onOpenChange={setEditTelegramDialogOpen}>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Editar Grupo Telegram</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div><Label>Nome do Grupo</Label><Input value={telegramGroupForm.group_name} onChange={(e) => setTelegramGroupForm({ ...telegramGroupForm, group_name: e.target.value })} /></div>
              <div><Label>Username</Label><Input value={telegramGroupForm.group_username} onChange={(e) => setTelegramGroupForm({ ...telegramGroupForm, group_username: e.target.value })} placeholder="@grupo" /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Membros</Label><Input type="number" value={telegramGroupForm.members_count} onChange={(e) => setTelegramGroupForm({ ...telegramGroupForm, members_count: e.target.value })} /></div>
                <div>
                  <Label>Tipo</Label>
                  <Select value={telegramGroupForm.group_type} onValueChange={(v) => setTelegramGroupForm({ ...telegramGroupForm, group_type: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="group">Grupo</SelectItem>
                      <SelectItem value="channel">Canal</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div><Label>Nicho</Label><Input value={telegramGroupForm.niche} onChange={(e) => setTelegramGroupForm({ ...telegramGroupForm, niche: e.target.value })} /></div>
              <div><Label>Descrição</Label><Textarea value={telegramGroupForm.description} onChange={(e) => setTelegramGroupForm({ ...telegramGroupForm, description: e.target.value })} /></div>
              <div><Label>Preço (R$)</Label><Input type="number" step="0.01" value={telegramGroupForm.price} onChange={(e) => setTelegramGroupForm({ ...telegramGroupForm, price: e.target.value })} /></div>
              <div>
                <Label>Foto do Grupo</Label>
                <input type="file" ref={telegramGroupImageInputRef} accept="image/*" className="hidden" onChange={(e) => { const file = e.target.files?.[0]; if (file) setTelegramGroupImageFile(file); }} />
                <div className="mt-2">
                  {telegramGroupImageFile ? (
                    <div className="flex items-center gap-2 p-2 bg-secondary/50 rounded-lg">
                      <Image className="w-4 h-4" />
                      <span className="text-sm flex-1 truncate">{telegramGroupImageFile.name}</span>
                      <Button variant="ghost" size="sm" onClick={() => setTelegramGroupImageFile(null)}><Trash2 className="w-4 h-4" /></Button>
                    </div>
                  ) : selectedEditTelegram?.image_url ? (
                    <div className="flex items-center gap-2 p-2 bg-secondary/50 rounded-lg">
                      <img src={selectedEditTelegram.image_url} alt="Preview" className="w-10 h-10 rounded object-cover" />
                      <span className="text-sm flex-1">Imagem atual</span>
                      <Button variant="outline" size="sm" onClick={() => telegramGroupImageInputRef.current?.click()}>Trocar</Button>
                    </div>
                  ) : (
                    <Button variant="outline" className="w-full" onClick={() => telegramGroupImageInputRef.current?.click()}>
                      <Upload className="w-4 h-4 mr-2" />Selecionar Foto
                    </Button>
                  )}
                </div>
              </div>
              <div className="border-t pt-4 mt-4">
                <h4 className="font-semibold mb-3 flex items-center gap-2"><Shield className="w-4 h-4" />Dados para Entrega</h4>
                <div className="space-y-3">
                  <div><Label>Link de Convite</Label><Input value={telegramGroupForm.deliverable_invite_link} onChange={(e) => setTelegramGroupForm({ ...telegramGroupForm, deliverable_invite_link: e.target.value })} placeholder="https://t.me/+..." /></div>
                  <div><Label>Notas</Label><Textarea value={telegramGroupForm.deliverable_notes} onChange={(e) => setTelegramGroupForm({ ...telegramGroupForm, deliverable_notes: e.target.value })} /></div>
                </div>
              </div>
              <Button onClick={handleUpdateTelegram} className="w-full telegram-gradient text-white" disabled={isUploadingTelegramGroup}>
                {isUploadingTelegramGroup ? <><RefreshCw className="w-4 h-4 mr-2 animate-spin" />Salvando...</> : "Salvar Alterações"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default AdminDashboardPage;
