import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Instagram, Music2, Trash2, Edit2, DollarSign, Link2, Loader2, CheckCircle, XCircle, AlertCircle, MessageSquare, Sparkles, Users, Upload, Image, GitBranch, Shield } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useMercadoPagoIntegration } from "@/hooks/useMercadoPagoIntegration";

interface InstagramAccount {
  id: string;
  username: string;
  followers: number;
  following: number;
  posts_count: number;
  engagement_rate: number;
  niche: string | null;
  description: string | null;
  image_url: string | null;
  price_cents: number;
  is_verified: boolean;
  is_sold: boolean;
  sold_at: string | null;
  deliverable_info: string | null;
  deliverable_login: string | null;
  deliverable_password: string | null;
  deliverable_email: string | null;
  deliverable_notes: string | null;
  created_at: string;
}

interface TikTokAccount {
  id: string;
  username: string;
  followers: number;
  likes: number;
  niche: string | null;
  description: string | null;
  image_url: string | null;
  price_cents: number;
  is_verified: boolean;
  is_sold: boolean;
  sold_at: string | null;
  deliverable_info: string | null;
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
  funnel_json: any;
  created_at: string;
  created_by: string | null;
}

interface VendorSale {
  id: string;
  item_type: string;
  item_id: string;
  sale_amount_cents: number;
  vendor_commission_cents: number;
  status: string;
  created_at: string;
}

const ResellerPage = () => {
  const { user, vendorRoles } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { integration: mpIntegration, isConnected: isMpConnected, isLoading: mpLoading, refetch: refetchMp } = useMercadoPagoIntegration();

  // Check vendor permissions
  const isGeneralVendor = vendorRoles.includes("vendor");
  const canSellInstagram = isGeneralVendor || vendorRoles.includes("vendor_instagram");
  const canSellTiktok = isGeneralVendor || vendorRoles.includes("vendor_tiktok");
  const canSellTelegram = isGeneralVendor; // Only general vendor can sell telegram
  const canSellModels = isGeneralVendor || vendorRoles.includes("vendor_model");
  
  // Determine default tab based on permissions
  const getDefaultTab = () => {
    if (canSellInstagram) return "instagram";
    if (canSellTiktok) return "tiktok";
    if (canSellTelegram) return "telegram";
    if (canSellModels) return "models";
    return "sales";
  };

  // File upload refs
  const instagramImageInputRef = useRef<HTMLInputElement>(null);
  const tiktokImageInputRef = useRef<HTMLInputElement>(null);
  const telegramImageInputRef = useRef<HTMLInputElement>(null);
  const modelImageInputRef = useRef<HTMLInputElement>(null);
  const modelFunnelInputRef = useRef<HTMLInputElement>(null);

  // File states
  const [instagramImageFile, setInstagramImageFile] = useState<File | null>(null);
  const [tiktokImageFile, setTiktokImageFile] = useState<File | null>(null);
  const [telegramImageFile, setTelegramImageFile] = useState<File | null>(null);
  const [modelImageFile, setModelImageFile] = useState<File | null>(null);
  const [modelFunnelFile, setModelFunnelFile] = useState<File | null>(null);
  const [modelFunnelJson, setModelFunnelJson] = useState<any>(null);

  // Instagram accounts
  const [instagramAccounts, setInstagramAccounts] = useState<InstagramAccount[]>([]);
  const [loadingInstagram, setLoadingInstagram] = useState(true);
  const [isAddingInstagram, setIsAddingInstagram] = useState(false);
  const [instagramDialogOpen, setInstagramDialogOpen] = useState(false);
  const [editingInstagram, setEditingInstagram] = useState<InstagramAccount | null>(null);
  const [instagramForm, setInstagramForm] = useState({
    username: "",
    followers: 0,
    following: 0,
    posts_count: 0,
    engagement_rate: 0,
    niche: "",
    description: "",
    price_cents: 0,
    deliverable_info: "",
    deliverable_login: "",
    deliverable_password: "",
    deliverable_email: "",
    deliverable_notes: ""
  });

  // TikTok accounts
  const [tiktokAccounts, setTiktokAccounts] = useState<TikTokAccount[]>([]);
  const [loadingTiktok, setLoadingTiktok] = useState(true);
  const [isAddingTiktok, setIsAddingTiktok] = useState(false);
  const [tiktokDialogOpen, setTiktokDialogOpen] = useState(false);
  const [editingTiktok, setEditingTiktok] = useState<TikTokAccount | null>(null);
  const [tiktokForm, setTiktokForm] = useState({
    username: "",
    followers: 0,
    likes: 0,
    niche: "",
    description: "",
    price_cents: 0,
    deliverable_info: "",
    deliverable_login: "",
    deliverable_password: "",
    deliverable_email: "",
    deliverable_notes: ""
  });

  // Telegram Groups
  const [telegramGroups, setTelegramGroups] = useState<TelegramGroup[]>([]);
  const [loadingTelegram, setLoadingTelegram] = useState(true);
  const [isAddingTelegram, setIsAddingTelegram] = useState(false);
  const [telegramDialogOpen, setTelegramDialogOpen] = useState(false);
  const [editingTelegram, setEditingTelegram] = useState<TelegramGroup | null>(null);
  const [telegramForm, setTelegramForm] = useState({
    group_name: "",
    group_username: "",
    members_count: 0,
    description: "",
    niche: "",
    price_cents: 0,
    group_type: "group",
    deliverable_invite_link: "",
    deliverable_notes: ""
  });

  // Models
  const [models, setModels] = useState<ModelForSale[]>([]);
  const [loadingModels, setLoadingModels] = useState(true);
  const [isAddingModel, setIsAddingModel] = useState(false);
  const [modelDialogOpen, setModelDialogOpen] = useState(false);
  const [editingModel, setEditingModel] = useState<ModelForSale | null>(null);
  const [modelForm, setModelForm] = useState({
    name: "",
    bio: "",
    niche: "",
    category: "ia",
    price_cents: 0,
    deliverable_link: "",
    deliverable_notes: ""
  });

  // Sales
  const [sales, setSales] = useState<VendorSale[]>([]);
  const [loadingSales, setLoadingSales] = useState(true);

  useEffect(() => {
    if (user) {
      fetchInstagramAccounts();
      fetchTiktokAccounts();
      fetchTelegramGroups();
      fetchModels();
      fetchSales();
    }
  }, [user]);

  const fetchInstagramAccounts = async () => {
    try {
      const { data, error } = await supabase
        .from("instagram_accounts")
        .select("*")
        .eq("created_by", user?.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setInstagramAccounts((data || []) as InstagramAccount[]);
    } catch (error) {
      console.error("Error fetching Instagram accounts:", error);
    } finally {
      setLoadingInstagram(false);
    }
  };

  const fetchTiktokAccounts = async () => {
    try {
      const { data, error } = await supabase
        .from("tiktok_accounts")
        .select("*")
        .eq("created_by", user?.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setTiktokAccounts((data || []) as TikTokAccount[]);
    } catch (error) {
      console.error("Error fetching TikTok accounts:", error);
    } finally {
      setLoadingTiktok(false);
    }
  };

  const fetchTelegramGroups = async () => {
    try {
      const { data, error } = await supabase
        .from("telegram_groups")
        .select("*")
        .eq("created_by", user?.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setTelegramGroups((data || []) as TelegramGroup[]);
    } catch (error) {
      console.error("Error fetching Telegram groups:", error);
    } finally {
      setLoadingTelegram(false);
    }
  };

  const fetchModels = async () => {
    try {
      const { data, error } = await supabase
        .from("models_for_sale")
        .select("*")
        .eq("created_by", user?.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setModels((data || []) as ModelForSale[]);
    } catch (error) {
      console.error("Error fetching models:", error);
    } finally {
      setLoadingModels(false);
    }
  };

  const fetchSales = async () => {
    try {
      const { data, error } = await supabase
        .from("vendor_sales")
        .select("*")
        .eq("vendor_id", user?.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setSales((data || []) as VendorSale[]);
    } catch (error) {
      console.error("Error fetching sales:", error);
    } finally {
      setLoadingSales(false);
    }
  };

  // Helper function to upload image
  const handleUploadImage = async (file: File, bucket: string): Promise<string | null> => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user?.id}/${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(fileName);
      return urlData.publicUrl;
    } catch (error: any) {
      toast({ title: "Erro no upload", description: error.message, variant: "destructive" });
      return null;
    }
  };

  // Instagram handlers
  const handleAddInstagram = async () => {
    if (!instagramForm.username || instagramForm.price_cents <= 0) {
      toast({ title: "Erro", description: "Preencha o username e preço", variant: "destructive" });
      return;
    }

    setIsAddingInstagram(true);
    try {
      let imageUrl: string | null = null;
      if (instagramImageFile) {
        imageUrl = await handleUploadImage(instagramImageFile, "product-images");
      }

      const { error } = await supabase
        .from("instagram_accounts")
        .insert({
          ...instagramForm,
          image_url: imageUrl,
          created_by: user?.id
        });

      if (error) throw error;

      toast({ title: "Sucesso", description: "Conta Instagram adicionada!" });
      setInstagramDialogOpen(false);
      setInstagramImageFile(null);
      resetInstagramForm();
      fetchInstagramAccounts();
    } catch (error: any) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } finally {
      setIsAddingInstagram(false);
    }
  };

  const handleUpdateInstagram = async () => {
    if (!editingInstagram) return;

    setIsAddingInstagram(true);
    try {
      const { error } = await supabase
        .from("instagram_accounts")
        .update(instagramForm)
        .eq("id", editingInstagram.id);

      if (error) throw error;

      toast({ title: "Sucesso", description: "Conta atualizada!" });
      setInstagramDialogOpen(false);
      setEditingInstagram(null);
      resetInstagramForm();
      fetchInstagramAccounts();
    } catch (error: any) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } finally {
      setIsAddingInstagram(false);
    }
  };

  const handleDeleteInstagram = async (id: string) => {
    try {
      const { error } = await supabase
        .from("instagram_accounts")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast({ title: "Sucesso", description: "Conta removida!" });
      fetchInstagramAccounts();
    } catch (error: any) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    }
  };

  const resetInstagramForm = () => {
    setInstagramForm({
      username: "",
      followers: 0,
      following: 0,
      posts_count: 0,
      engagement_rate: 0,
      niche: "",
      description: "",
      price_cents: 0,
      deliverable_info: "",
      deliverable_login: "",
      deliverable_password: "",
      deliverable_email: "",
      deliverable_notes: ""
    });
    setInstagramImageFile(null);
  };

  const openEditInstagram = (account: InstagramAccount) => {
    setEditingInstagram(account);
    setInstagramForm({
      username: account.username,
      followers: account.followers,
      following: account.following,
      posts_count: account.posts_count,
      engagement_rate: account.engagement_rate,
      niche: account.niche || "",
      description: account.description || "",
      price_cents: account.price_cents,
      deliverable_info: account.deliverable_info || "",
      deliverable_login: account.deliverable_login || "",
      deliverable_password: account.deliverable_password || "",
      deliverable_email: account.deliverable_email || "",
      deliverable_notes: account.deliverable_notes || ""
    });
    setInstagramImageFile(null);
    setInstagramDialogOpen(true);
  };

  // TikTok handlers
  const handleAddTiktok = async () => {
    if (!tiktokForm.username || tiktokForm.price_cents <= 0) {
      toast({ title: "Erro", description: "Preencha o username e preço", variant: "destructive" });
      return;
    }

    setIsAddingTiktok(true);
    try {
      let imageUrl: string | null = null;
      if (tiktokImageFile) {
        imageUrl = await handleUploadImage(tiktokImageFile, "product-images");
      }

      const { error } = await supabase
        .from("tiktok_accounts")
        .insert({
          ...tiktokForm,
          image_url: imageUrl,
          created_by: user?.id
        });

      if (error) throw error;

      toast({ title: "Sucesso", description: "Conta TikTok adicionada!" });
      setTiktokDialogOpen(false);
      setTiktokImageFile(null);
      resetTiktokForm();
      fetchTiktokAccounts();
    } catch (error: any) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } finally {
      setIsAddingTiktok(false);
    }
  };

  const handleUpdateTiktok = async () => {
    if (!editingTiktok) return;

    setIsAddingTiktok(true);
    try {
      let imageUrl = editingTiktok.image_url;
      if (tiktokImageFile) {
        imageUrl = await handleUploadImage(tiktokImageFile, "product-images");
      }

      const { error } = await supabase
        .from("tiktok_accounts")
        .update({
          ...tiktokForm,
          image_url: imageUrl
        })
        .eq("id", editingTiktok.id);

      if (error) throw error;

      toast({ title: "Sucesso", description: "Conta atualizada!" });
      setTiktokDialogOpen(false);
      setEditingTiktok(null);
      setTiktokImageFile(null);
      resetTiktokForm();
      fetchTiktokAccounts();
    } catch (error: any) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } finally {
      setIsAddingTiktok(false);
    }
  };

  const handleDeleteTiktok = async (id: string) => {
    try {
      const { error } = await supabase
        .from("tiktok_accounts")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast({ title: "Sucesso", description: "Conta removida!" });
      fetchTiktokAccounts();
    } catch (error: any) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    }
  };

  const resetTiktokForm = () => {
    setTiktokForm({
      username: "",
      followers: 0,
      likes: 0,
      niche: "",
      description: "",
      price_cents: 0,
      deliverable_info: "",
      deliverable_login: "",
      deliverable_password: "",
      deliverable_email: "",
      deliverable_notes: ""
    });
    setTiktokImageFile(null);
  };

  const openEditTiktok = (account: TikTokAccount) => {
    setEditingTiktok(account);
    setTiktokForm({
      username: account.username,
      followers: account.followers,
      likes: account.likes,
      niche: account.niche || "",
      description: account.description || "",
      price_cents: account.price_cents,
      deliverable_info: account.deliverable_info || "",
      deliverable_login: account.deliverable_login || "",
      deliverable_password: account.deliverable_password || "",
      deliverable_email: account.deliverable_email || "",
      deliverable_notes: account.deliverable_notes || ""
    });
    setTiktokImageFile(null);
    setTiktokDialogOpen(true);
  };

  // Telegram handlers
  const handleAddTelegram = async () => {
    if (!telegramForm.group_name || telegramForm.price_cents <= 0) {
      toast({ title: "Erro", description: "Preencha o nome do grupo e preço", variant: "destructive" });
      return;
    }

    setIsAddingTelegram(true);
    try {
      let imageUrl: string | null = null;
      if (telegramImageFile) {
        imageUrl = await handleUploadImage(telegramImageFile, "product-images");
      }

      const { error } = await supabase
        .from("telegram_groups")
        .insert({
          ...telegramForm,
          image_url: imageUrl,
          created_by: user?.id
        });

      if (error) throw error;

      toast({ title: "Sucesso", description: "Grupo Telegram adicionado!" });
      setTelegramDialogOpen(false);
      setTelegramImageFile(null);
      resetTelegramForm();
      fetchTelegramGroups();
    } catch (error: any) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } finally {
      setIsAddingTelegram(false);
    }
  };

  const handleUpdateTelegram = async () => {
    if (!editingTelegram) return;

    setIsAddingTelegram(true);
    try {
      let imageUrl = editingTelegram.image_url;
      if (telegramImageFile) {
        imageUrl = await handleUploadImage(telegramImageFile, "product-images");
      }

      const { error } = await supabase
        .from("telegram_groups")
        .update({
          ...telegramForm,
          image_url: imageUrl
        })
        .eq("id", editingTelegram.id);

      if (error) throw error;

      toast({ title: "Sucesso", description: "Grupo atualizado!" });
      setTelegramDialogOpen(false);
      setEditingTelegram(null);
      setTelegramImageFile(null);
      resetTelegramForm();
      fetchTelegramGroups();
    } catch (error: any) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } finally {
      setIsAddingTelegram(false);
    }
  };

  const handleDeleteTelegram = async (id: string) => {
    try {
      const { error } = await supabase
        .from("telegram_groups")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast({ title: "Sucesso", description: "Grupo removido!" });
      fetchTelegramGroups();
    } catch (error: any) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    }
  };

  const resetTelegramForm = () => {
    setTelegramForm({
      group_name: "",
      group_username: "",
      members_count: 0,
      description: "",
      niche: "",
      price_cents: 0,
      group_type: "group",
      deliverable_invite_link: "",
      deliverable_notes: ""
    });
    setTelegramImageFile(null);
  };

  const openEditTelegram = (group: TelegramGroup) => {
    setEditingTelegram(group);
    setTelegramForm({
      group_name: group.group_name,
      group_username: group.group_username || "",
      members_count: group.members_count,
      description: group.description || "",
      niche: group.niche || "",
      price_cents: group.price_cents,
      group_type: group.group_type,
      deliverable_invite_link: group.deliverable_invite_link || "",
      deliverable_notes: group.deliverable_notes || ""
    });
    setTelegramImageFile(null);
    setTelegramDialogOpen(true);
  };

  // Model handlers
  const handleAddModel = async () => {
    if (!modelForm.name || modelForm.price_cents <= 0) {
      toast({ title: "Erro", description: "Preencha o nome e preço", variant: "destructive" });
      return;
    }

    setIsAddingModel(true);
    try {
      let imageUrl: string | null = null;
      if (modelImageFile) {
        imageUrl = await handleUploadImage(modelImageFile, "product-images");
      }

      const { error } = await supabase
        .from("models_for_sale")
        .insert({
          ...modelForm,
          image_url: imageUrl,
          funnel_json: modelFunnelJson || null,
          created_by: user?.id
        });

      if (error) throw error;

      toast({ title: "Sucesso", description: `Modelo adicionado${modelFunnelJson ? " com funil incluso" : ""}!` });
      setModelDialogOpen(false);
      setModelImageFile(null);
      setModelFunnelFile(null);
      setModelFunnelJson(null);
      resetModelForm();
      fetchModels();
    } catch (error: any) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } finally {
      setIsAddingModel(false);
    }
  };

  const handleUpdateModel = async () => {
    if (!editingModel) return;

    setIsAddingModel(true);
    try {
      let imageUrl = editingModel.image_url;
      if (modelImageFile) {
        imageUrl = await handleUploadImage(modelImageFile, "product-images");
      }

      const { error } = await supabase
        .from("models_for_sale")
        .update({
          ...modelForm,
          image_url: imageUrl,
          funnel_json: modelFunnelJson || editingModel.funnel_json
        })
        .eq("id", editingModel.id);

      if (error) throw error;

      toast({ title: "Sucesso", description: "Modelo atualizado!" });
      setModelDialogOpen(false);
      setEditingModel(null);
      setModelImageFile(null);
      setModelFunnelFile(null);
      setModelFunnelJson(null);
      resetModelForm();
      fetchModels();
    } catch (error: any) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } finally {
      setIsAddingModel(false);
    }
  };

  const handleDeleteModel = async (id: string) => {
    try {
      const { error } = await supabase
        .from("models_for_sale")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast({ title: "Sucesso", description: "Modelo removido!" });
      fetchModels();
    } catch (error: any) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    }
  };

  const resetModelForm = () => {
    setModelForm({
      name: "",
      bio: "",
      niche: "",
      category: "ia",
      price_cents: 0,
      deliverable_link: "",
      deliverable_notes: ""
    });
    setModelImageFile(null);
    setModelFunnelFile(null);
    setModelFunnelJson(null);
  };

  const openEditModel = (model: ModelForSale) => {
    setEditingModel(model);
    setModelForm({
      name: model.name,
      bio: model.bio || "",
      niche: model.niche || "",
      category: model.category || "ia",
      price_cents: model.price_cents,
      deliverable_link: model.deliverable_link || "",
      deliverable_notes: model.deliverable_notes || ""
    });
    setModelImageFile(null);
    setModelFunnelFile(null);
    setModelFunnelJson(model.funnel_json || null);
    setModelDialogOpen(true);
  };

  // MercadoPago connection
  const handleConnectMercadoPago = async () => {
    const clientId = import.meta.env.VITE_MERCADOPAGO_CLIENT_ID;
    if (!clientId) {
      toast({ title: "Erro", description: "Configuração do MercadoPago não encontrada", variant: "destructive" });
      return;
    }

    const redirectUri = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/mercadopago-callback`;
    const authUrl = `https://auth.mercadopago.com/authorization?client_id=${clientId}&response_type=code&platform_id=mp&state=${user?.id}&redirect_uri=${encodeURIComponent(redirectUri)}`;
    
    window.location.href = authUrl;
  };

  const handleDisconnectMercadoPago = async () => {
    if (!mpIntegration) return;

    try {
      const { error } = await supabase
        .from("integrations")
        .delete()
        .eq("id", mpIntegration.id);

      if (error) throw error;

      toast({ title: "Sucesso", description: "MercadoPago desconectado!" });
      refetchMp();
    } catch (error: any) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    }
  };

  const formatPrice = (cents: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL"
    }).format(cents / 100);
  };

  const totalEarnings = sales.reduce((acc, sale) => acc + sale.vendor_commission_cents, 0);
  const pendingEarnings = sales.filter(s => s.status === "pending").reduce((acc, sale) => acc + sale.vendor_commission_cents, 0);
  const totalProducts = instagramAccounts.length + tiktokAccounts.length + telegramGroups.length + models.length;

  // Get vendor role label
  const getVendorRoleLabel = () => {
    if (vendorRoles.includes("vendor")) return "Vendedor Geral";
    if (vendorRoles.includes("vendor_instagram")) return "Vendedor Instagram";
    if (vendorRoles.includes("vendor_tiktok")) return "Vendedor TikTok";
    if (vendorRoles.includes("vendor_model")) return "Vendedor Modelos";
    return "Vendedor";
  };

  const getVendorRoleBadges = () => {
    const badges: { label: string; color: string }[] = [];
    if (vendorRoles.includes("vendor")) {
      badges.push({ label: "Geral", color: "bg-primary" });
    }
    if (vendorRoles.includes("vendor_instagram")) {
      badges.push({ label: "Instagram", color: "bg-gradient-to-r from-purple-500 to-pink-500" });
    }
    if (vendorRoles.includes("vendor_tiktok")) {
      badges.push({ label: "TikTok", color: "bg-black" });
    }
    if (vendorRoles.includes("vendor_model")) {
      badges.push({ label: "Modelos", color: "bg-gradient-to-r from-amber-500 to-orange-500" });
    }
    return badges;
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Vendor Role Banner */}
        <Card className="bg-gradient-to-r from-primary/10 to-secondary/10 border-primary/20">
          <CardContent className="flex items-center justify-between py-4">
            <div className="flex items-center gap-3">
              <Shield className="h-6 w-6 text-primary" />
              <div>
                <h3 className="font-semibold">Painel de Revendedor</h3>
                <p className="text-sm text-muted-foreground">Gerencie seus produtos e vendas</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {getVendorRoleBadges().map((badge, idx) => (
                <Badge key={idx} className={`${badge.color} text-white`}>
                  {badge.label}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Header Stats */}
        <div className="grid gap-4 md:grid-cols-5">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Contas Instagram</CardTitle>
              <Instagram className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{instagramAccounts.length}</div>
              <p className="text-xs text-muted-foreground">
                {instagramAccounts.filter(a => a.is_sold).length} vendidas
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Contas TikTok</CardTitle>
              <Music2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{tiktokAccounts.length}</div>
              <p className="text-xs text-muted-foreground">
                {tiktokAccounts.filter(a => a.is_sold).length} vendidas
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Grupos Telegram</CardTitle>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{telegramGroups.length}</div>
              <p className="text-xs text-muted-foreground">
                {telegramGroups.filter(g => g.is_sold).length} vendidos
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Vendido</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatPrice(totalEarnings)}</div>
              <p className="text-xs text-muted-foreground">
                {formatPrice(pendingEarnings)} pendente
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">MercadoPago</CardTitle>
              <Link2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {mpLoading ? (
                <Loader2 className="h-6 w-6 animate-spin" />
              ) : isMpConnected ? (
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-success" />
                  <span className="text-sm">Conectado</span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <XCircle className="h-5 w-5 text-destructive" />
                  <span className="text-sm">Desconectado</span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* MercadoPago Connection */}
        <Card>
          <CardHeader>
            <CardTitle>Conexão MercadoPago</CardTitle>
            <CardDescription>
              Conecte sua conta MercadoPago para receber pagamentos das vendas
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isMpConnected ? (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-8 w-8 text-success" />
                  <div>
                    <p className="font-medium">{mpIntegration?.provider_name || mpIntegration?.provider_email}</p>
                    <p className="text-sm text-muted-foreground">Conta conectada</p>
                  </div>
                </div>
                <Button variant="destructive" onClick={handleDisconnectMercadoPago}>
                  Desconectar
                </Button>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <AlertCircle className="h-8 w-8 text-warning" />
                  <div>
                    <p className="font-medium">Conta não conectada</p>
                    <p className="text-sm text-muted-foreground">Conecte para receber pagamentos</p>
                  </div>
                </div>
                <Button onClick={handleConnectMercadoPago}>
                  <Link2 className="w-4 h-4 mr-2" />
                  Conectar MercadoPago
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Accounts Tabs */}
        <Tabs defaultValue={getDefaultTab()} className="space-y-4">
          <TabsList className="flex-wrap">
            {canSellInstagram && (
              <TabsTrigger value="instagram" className="gap-2">
                <Instagram className="w-4 h-4" />
                Instagram
              </TabsTrigger>
            )}
            {canSellTiktok && (
              <TabsTrigger value="tiktok" className="gap-2">
                <Music2 className="w-4 h-4" />
                TikTok
              </TabsTrigger>
            )}
            {canSellTelegram && (
              <TabsTrigger value="telegram" className="gap-2">
                <MessageSquare className="w-4 h-4" />
                Telegram
              </TabsTrigger>
            )}
            {canSellModels && (
              <TabsTrigger value="models" className="gap-2">
                <Sparkles className="w-4 h-4" />
                Modelos
              </TabsTrigger>
            )}
            <TabsTrigger value="sales" className="gap-2">
              <DollarSign className="w-4 h-4" />
              Minhas Vendas
            </TabsTrigger>
          </TabsList>

          {/* Instagram Tab */}
          {canSellInstagram && (
          <TabsContent value="instagram">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Contas Instagram</CardTitle>
                  <CardDescription>Gerencie suas contas Instagram à venda</CardDescription>
                </div>
                <Dialog open={instagramDialogOpen} onOpenChange={(open) => {
                  setInstagramDialogOpen(open);
                  if (!open) {
                    setEditingInstagram(null);
                    resetInstagramForm();
                  }
                }}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="w-4 h-4 mr-2" />
                      Adicionar Conta
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>{editingInstagram ? "Editar Conta" : "Nova Conta Instagram"}</DialogTitle>
                      <DialogDescription>
                        Preencha os dados da conta Instagram
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Username *</Label>
                          <Input
                            placeholder="@username"
                            value={instagramForm.username}
                            onChange={(e) => setInstagramForm(prev => ({ ...prev, username: e.target.value }))}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Preço (R$) *</Label>
                          <Input
                            type="number"
                            placeholder="0.00"
                            value={instagramForm.price_cents / 100}
                            onChange={(e) => setInstagramForm(prev => ({ ...prev, price_cents: Number(e.target.value) * 100 }))}
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-4 gap-4">
                        <div className="space-y-2">
                          <Label>Seguidores</Label>
                          <Input
                            type="number"
                            value={instagramForm.followers}
                            onChange={(e) => setInstagramForm(prev => ({ ...prev, followers: Number(e.target.value) }))}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Seguindo</Label>
                          <Input
                            type="number"
                            value={instagramForm.following}
                            onChange={(e) => setInstagramForm(prev => ({ ...prev, following: Number(e.target.value) }))}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Posts</Label>
                          <Input
                            type="number"
                            value={instagramForm.posts_count}
                            onChange={(e) => setInstagramForm(prev => ({ ...prev, posts_count: Number(e.target.value) }))}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Engajamento %</Label>
                          <Input
                            type="number"
                            step="0.01"
                            value={instagramForm.engagement_rate}
                            onChange={(e) => setInstagramForm(prev => ({ ...prev, engagement_rate: Number(e.target.value) }))}
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Nicho</Label>
                          <Input
                            placeholder="Ex: Fitness, Moda..."
                            value={instagramForm.niche}
                            onChange={(e) => setInstagramForm(prev => ({ ...prev, niche: e.target.value }))}
                          />
                        </div>
                        <div className="space-y-2 col-span-2">
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
                      </div>
                      <div className="space-y-2">
                        <Label>Descrição</Label>
                        <Textarea
                          placeholder="Descreva a conta..."
                          value={instagramForm.description}
                          onChange={(e) => setInstagramForm(prev => ({ ...prev, description: e.target.value }))}
                        />
                      </div>
                      <div className="border-t pt-4 mt-4">
                        <h4 className="font-medium mb-4">Dados de Entrega (visíveis após compra)</h4>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Login</Label>
                            <Input
                              value={instagramForm.deliverable_login}
                              onChange={(e) => setInstagramForm(prev => ({ ...prev, deliverable_login: e.target.value }))}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Senha</Label>
                            <Input
                              type="password"
                              value={instagramForm.deliverable_password}
                              onChange={(e) => setInstagramForm(prev => ({ ...prev, deliverable_password: e.target.value }))}
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4 mt-4">
                          <div className="space-y-2">
                            <Label>Email da conta</Label>
                            <Input
                              value={instagramForm.deliverable_email}
                              onChange={(e) => setInstagramForm(prev => ({ ...prev, deliverable_email: e.target.value }))}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Informações adicionais</Label>
                            <Input
                              value={instagramForm.deliverable_info}
                              onChange={(e) => setInstagramForm(prev => ({ ...prev, deliverable_info: e.target.value }))}
                            />
                          </div>
                        </div>
                        <div className="space-y-2 mt-4">
                          <Label>Notas</Label>
                          <Textarea
                            value={instagramForm.deliverable_notes}
                            onChange={(e) => setInstagramForm(prev => ({ ...prev, deliverable_notes: e.target.value }))}
                          />
                        </div>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setInstagramDialogOpen(false)}>
                        Cancelar
                      </Button>
                      <Button 
                        onClick={editingInstagram ? handleUpdateInstagram : handleAddInstagram}
                        disabled={isAddingInstagram}
                      >
                        {isAddingInstagram && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                        {editingInstagram ? "Salvar" : "Adicionar"}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                {loadingInstagram ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin" />
                  </div>
                ) : instagramAccounts.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Instagram className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Nenhuma conta Instagram cadastrada</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Username</TableHead>
                        <TableHead>Seguidores</TableHead>
                        <TableHead>Nicho</TableHead>
                        <TableHead>Preço</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {instagramAccounts.map((account) => (
                        <TableRow key={account.id}>
                          <TableCell className="font-medium">@{account.username}</TableCell>
                          <TableCell>{account.followers.toLocaleString()}</TableCell>
                          <TableCell>{account.niche || "-"}</TableCell>
                          <TableCell>{formatPrice(account.price_cents)}</TableCell>
                          <TableCell>
                            {account.is_sold ? (
                              <Badge variant="secondary">Vendida</Badge>
                            ) : (
                              <Badge variant="default">Disponível</Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => openEditInstagram(account)}
                                disabled={account.is_sold}
                              >
                                <Edit2 className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDeleteInstagram(account.id)}
                                disabled={account.is_sold}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          )}

          {/* TikTok Tab */}
          {canSellTiktok && (
          <TabsContent value="tiktok">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Contas TikTok</CardTitle>
                  <CardDescription>Gerencie suas contas TikTok à venda</CardDescription>
                </div>
                <Dialog open={tiktokDialogOpen} onOpenChange={(open) => {
                  setTiktokDialogOpen(open);
                  if (!open) {
                    setEditingTiktok(null);
                    resetTiktokForm();
                  }
                }}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="w-4 h-4 mr-2" />
                      Adicionar Conta
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>{editingTiktok ? "Editar Conta" : "Nova Conta TikTok"}</DialogTitle>
                      <DialogDescription>
                        Preencha os dados da conta TikTok
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Username *</Label>
                          <Input
                            placeholder="@username"
                            value={tiktokForm.username}
                            onChange={(e) => setTiktokForm(prev => ({ ...prev, username: e.target.value }))}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Preço (R$) *</Label>
                          <Input
                            type="number"
                            placeholder="0.00"
                            value={tiktokForm.price_cents / 100}
                            onChange={(e) => setTiktokForm(prev => ({ ...prev, price_cents: Number(e.target.value) * 100 }))}
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Seguidores</Label>
                          <Input
                            type="number"
                            value={tiktokForm.followers}
                            onChange={(e) => setTiktokForm(prev => ({ ...prev, followers: Number(e.target.value) }))}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Curtidas</Label>
                          <Input
                            type="number"
                            value={tiktokForm.likes}
                            onChange={(e) => setTiktokForm(prev => ({ ...prev, likes: Number(e.target.value) }))}
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Nicho</Label>
                        <Input
                          placeholder="Ex: Fitness, Humor..."
                          value={tiktokForm.niche}
                          onChange={(e) => setTiktokForm(prev => ({ ...prev, niche: e.target.value }))}
                        />
                      </div>
                      <div className="space-y-2">
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
                      <div className="space-y-2">
                        <Label>Descrição</Label>
                        <Textarea
                          placeholder="Descreva a conta..."
                          value={tiktokForm.description}
                          onChange={(e) => setTiktokForm(prev => ({ ...prev, description: e.target.value }))}
                        />
                      </div>
                      <div className="border-t pt-4 mt-4">
                        <h4 className="font-medium mb-4">Dados de Entrega (visíveis após compra)</h4>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Login</Label>
                            <Input
                              value={tiktokForm.deliverable_login}
                              onChange={(e) => setTiktokForm(prev => ({ ...prev, deliverable_login: e.target.value }))}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Senha</Label>
                            <Input
                              type="password"
                              value={tiktokForm.deliverable_password}
                              onChange={(e) => setTiktokForm(prev => ({ ...prev, deliverable_password: e.target.value }))}
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4 mt-4">
                          <div className="space-y-2">
                            <Label>Email da conta</Label>
                            <Input
                              value={tiktokForm.deliverable_email}
                              onChange={(e) => setTiktokForm(prev => ({ ...prev, deliverable_email: e.target.value }))}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Informações adicionais</Label>
                            <Input
                              value={tiktokForm.deliverable_info}
                              onChange={(e) => setTiktokForm(prev => ({ ...prev, deliverable_info: e.target.value }))}
                            />
                          </div>
                        </div>
                        <div className="space-y-2 mt-4">
                          <Label>Notas</Label>
                          <Textarea
                            value={tiktokForm.deliverable_notes}
                            onChange={(e) => setTiktokForm(prev => ({ ...prev, deliverable_notes: e.target.value }))}
                          />
                        </div>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setTiktokDialogOpen(false)}>
                        Cancelar
                      </Button>
                      <Button 
                        onClick={editingTiktok ? handleUpdateTiktok : handleAddTiktok}
                        disabled={isAddingTiktok}
                      >
                        {isAddingTiktok && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                        {editingTiktok ? "Salvar" : "Adicionar"}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                {loadingTiktok ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin" />
                  </div>
                ) : tiktokAccounts.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Music2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Nenhuma conta TikTok cadastrada</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Username</TableHead>
                        <TableHead>Seguidores</TableHead>
                        <TableHead>Curtidas</TableHead>
                        <TableHead>Nicho</TableHead>
                        <TableHead>Preço</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {tiktokAccounts.map((account) => (
                        <TableRow key={account.id}>
                          <TableCell className="font-medium">@{account.username}</TableCell>
                          <TableCell>{account.followers.toLocaleString()}</TableCell>
                          <TableCell>{account.likes.toLocaleString()}</TableCell>
                          <TableCell>{account.niche || "-"}</TableCell>
                          <TableCell>{formatPrice(account.price_cents)}</TableCell>
                          <TableCell>
                            {account.is_sold ? (
                              <Badge variant="secondary">Vendida</Badge>
                            ) : (
                              <Badge variant="default">Disponível</Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => openEditTiktok(account)}
                                disabled={account.is_sold}
                              >
                                <Edit2 className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDeleteTiktok(account.id)}
                                disabled={account.is_sold}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          )}

          {/* Telegram Tab */}
          {canSellTelegram && (
          <TabsContent value="telegram">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Grupos Telegram</CardTitle>
                  <CardDescription>Gerencie seus grupos Telegram à venda</CardDescription>
                </div>
                <Dialog open={telegramDialogOpen} onOpenChange={(open) => {
                  setTelegramDialogOpen(open);
                  if (!open) {
                    setEditingTelegram(null);
                    resetTelegramForm();
                  }
                }}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="w-4 h-4 mr-2" />
                      Adicionar Grupo
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>{editingTelegram ? "Editar Grupo" : "Novo Grupo Telegram"}</DialogTitle>
                      <DialogDescription>
                        Preencha os dados do grupo Telegram
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Nome do Grupo *</Label>
                          <Input
                            placeholder="Nome do grupo"
                            value={telegramForm.group_name}
                            onChange={(e) => setTelegramForm(prev => ({ ...prev, group_name: e.target.value }))}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Preço (R$) *</Label>
                          <Input
                            type="number"
                            placeholder="0.00"
                            value={telegramForm.price_cents / 100}
                            onChange={(e) => setTelegramForm(prev => ({ ...prev, price_cents: Number(e.target.value) * 100 }))}
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label>Username</Label>
                          <Input
                            placeholder="@grupo"
                            value={telegramForm.group_username}
                            onChange={(e) => setTelegramForm(prev => ({ ...prev, group_username: e.target.value }))}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Membros</Label>
                          <Input
                            type="number"
                            value={telegramForm.members_count}
                            onChange={(e) => setTelegramForm(prev => ({ ...prev, members_count: Number(e.target.value) }))}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Tipo</Label>
                          <Select value={telegramForm.group_type} onValueChange={(v) => setTelegramForm(prev => ({ ...prev, group_type: v }))}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="group">Grupo</SelectItem>
                              <SelectItem value="channel">Canal</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Nicho</Label>
                          <Input
                            placeholder="Ex: Crypto, Apostas..."
                            value={telegramForm.niche}
                            onChange={(e) => setTelegramForm(prev => ({ ...prev, niche: e.target.value }))}
                          />
                        </div>
                        <div className="space-y-2 col-span-2">
                          <Label>Foto do Grupo</Label>
                          <input type="file" ref={telegramImageInputRef} accept="image/*" className="hidden" onChange={(e) => { const file = e.target.files?.[0]; if (file) setTelegramImageFile(file); }} />
                          <div className="mt-2">
                            {telegramImageFile ? (
                              <div className="flex items-center gap-2 p-2 bg-secondary/50 rounded-lg">
                                <Image className="w-4 h-4" />
                                <span className="text-sm flex-1 truncate">{telegramImageFile.name}</span>
                                <Button variant="ghost" size="sm" onClick={() => setTelegramImageFile(null)}><Trash2 className="w-4 h-4" /></Button>
                              </div>
                            ) : (
                              <Button variant="outline" className="w-full" onClick={() => telegramImageInputRef.current?.click()}>
                                <Upload className="w-4 h-4 mr-2" />Selecionar Foto
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Descrição</Label>
                        <Textarea
                          placeholder="Descreva o grupo..."
                          value={telegramForm.description}
                          onChange={(e) => setTelegramForm(prev => ({ ...prev, description: e.target.value }))}
                        />
                      </div>
                      <div className="border-t pt-4 mt-4">
                        <h4 className="font-medium mb-4">Dados de Entrega (visíveis após compra)</h4>
                        <div className="space-y-2">
                          <Label>Link de Convite</Label>
                          <Input
                            placeholder="https://t.me/..."
                            value={telegramForm.deliverable_invite_link}
                            onChange={(e) => setTelegramForm(prev => ({ ...prev, deliverable_invite_link: e.target.value }))}
                          />
                        </div>
                        <div className="space-y-2 mt-4">
                          <Label>Notas</Label>
                          <Textarea
                            value={telegramForm.deliverable_notes}
                            onChange={(e) => setTelegramForm(prev => ({ ...prev, deliverable_notes: e.target.value }))}
                          />
                        </div>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setTelegramDialogOpen(false)}>
                        Cancelar
                      </Button>
                      <Button 
                        onClick={editingTelegram ? handleUpdateTelegram : handleAddTelegram}
                        disabled={isAddingTelegram}
                      >
                        {isAddingTelegram && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                        {editingTelegram ? "Salvar" : "Adicionar"}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                {loadingTelegram ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin" />
                  </div>
                ) : telegramGroups.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Nenhum grupo Telegram cadastrado</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nome</TableHead>
                        <TableHead>Username</TableHead>
                        <TableHead>Membros</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Preço</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {telegramGroups.map((group) => (
                        <TableRow key={group.id}>
                          <TableCell className="font-medium">{group.group_name}</TableCell>
                          <TableCell>{group.group_username ? `@${group.group_username}` : "-"}</TableCell>
                          <TableCell>{group.members_count.toLocaleString()}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="capitalize">{group.group_type}</Badge>
                          </TableCell>
                          <TableCell>{formatPrice(group.price_cents)}</TableCell>
                          <TableCell>
                            {group.is_sold ? (
                              <Badge variant="secondary">Vendido</Badge>
                            ) : (
                              <Badge variant="default">Disponível</Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => openEditTelegram(group)}
                                disabled={group.is_sold}
                              >
                                <Edit2 className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDeleteTelegram(group.id)}
                                disabled={group.is_sold}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          )}

          {/* Models Tab */}
          {canSellModels && (
          <TabsContent value="models">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Modelos</CardTitle>
                  <CardDescription>Gerencie seus modelos à venda</CardDescription>
                </div>
                <Dialog open={modelDialogOpen} onOpenChange={(open) => {
                  setModelDialogOpen(open);
                  if (!open) {
                    setEditingModel(null);
                    resetModelForm();
                  }
                }}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="w-4 h-4 mr-2" />
                      Adicionar Modelo
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>{editingModel ? "Editar Modelo" : "Novo Modelo"}</DialogTitle>
                      <DialogDescription>
                        Preencha os dados do modelo
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Nome *</Label>
                          <Input
                            placeholder="Nome do modelo"
                            value={modelForm.name}
                            onChange={(e) => setModelForm(prev => ({ ...prev, name: e.target.value }))}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Preço (R$) *</Label>
                          <Input
                            type="number"
                            placeholder="0.00"
                            value={modelForm.price_cents / 100}
                            onChange={(e) => setModelForm(prev => ({ ...prev, price_cents: Number(e.target.value) * 100 }))}
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Nicho</Label>
                          <Input
                            placeholder="Ex: Fitness, Moda..."
                            value={modelForm.niche}
                            onChange={(e) => setModelForm(prev => ({ ...prev, niche: e.target.value }))}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Categoria</Label>
                          <Select value={modelForm.category} onValueChange={(v) => setModelForm(prev => ({ ...prev, category: v }))}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="ia">IA</SelectItem>
                              <SelectItem value="black">Black</SelectItem>
                              <SelectItem value="white">White</SelectItem>
                              <SelectItem value="asian">Asian</SelectItem>
                              <SelectItem value="latina">Latina</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="space-y-2">
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
                      <div className="space-y-2">
                        <Label>Bio</Label>
                        <Textarea
                          placeholder="Descrição do modelo..."
                          value={modelForm.bio}
                          onChange={(e) => setModelForm(prev => ({ ...prev, bio: e.target.value }))}
                        />
                      </div>
                      <div className="border-t pt-4 mt-4">
                        <h4 className="font-medium mb-4">Dados de Entrega (visíveis após compra)</h4>
                        <div className="space-y-2">
                          <Label>Link do Material</Label>
                          <Input
                            placeholder="https://..."
                            value={modelForm.deliverable_link}
                            onChange={(e) => setModelForm(prev => ({ ...prev, deliverable_link: e.target.value }))}
                          />
                        </div>
                        <div className="space-y-2 mt-4">
                          <Label>Notas/Instruções</Label>
                          <Textarea
                            value={modelForm.deliverable_notes}
                            onChange={(e) => setModelForm(prev => ({ ...prev, deliverable_notes: e.target.value }))}
                            placeholder="Instruções para o comprador..."
                          />
                        </div>
                        <div className="space-y-2 mt-4">
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
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setModelDialogOpen(false)}>
                        Cancelar
                      </Button>
                      <Button 
                        onClick={editingModel ? handleUpdateModel : handleAddModel}
                        disabled={isAddingModel}
                      >
                        {isAddingModel && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                        {editingModel ? "Salvar" : "Adicionar"}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                {loadingModels ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin" />
                  </div>
                ) : models.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Sparkles className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Nenhum modelo cadastrado</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nome</TableHead>
                        <TableHead>Nicho</TableHead>
                        <TableHead>Categoria</TableHead>
                        <TableHead>Preço</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {models.map((model) => (
                        <TableRow key={model.id}>
                          <TableCell className="font-medium">{model.name}</TableCell>
                          <TableCell>{model.niche || "-"}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="capitalize">{model.category}</Badge>
                          </TableCell>
                          <TableCell>{formatPrice(model.price_cents)}</TableCell>
                          <TableCell>
                            {model.is_sold ? (
                              <Badge variant="secondary">Vendido</Badge>
                            ) : (
                              <Badge variant="default">Disponível</Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => openEditModel(model)}
                                disabled={model.is_sold}
                              >
                                <Edit2 className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDeleteModel(model.id)}
                                disabled={model.is_sold}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          )}

          {/* Sales Tab */}
          <TabsContent value="sales">
            <Card>
              <CardHeader>
                <CardTitle>Minhas Vendas</CardTitle>
                <CardDescription>Histórico de vendas e comissões</CardDescription>
              </CardHeader>
              <CardContent>
                {loadingSales ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin" />
                  </div>
                ) : sales.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <DollarSign className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Nenhuma venda realizada ainda</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Data</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Valor Venda</TableHead>
                        <TableHead>Sua Comissão</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sales.map((sale) => (
                        <TableRow key={sale.id}>
                          <TableCell>{new Date(sale.created_at).toLocaleDateString("pt-BR")}</TableCell>
                          <TableCell>
                            {sale.item_type === "instagram" ? (
                              <Badge variant="outline" className="gap-1">
                                <Instagram className="w-3 h-3" />
                                Instagram
                              </Badge>
                            ) : sale.item_type === "tiktok" ? (
                              <Badge variant="outline" className="gap-1">
                                <Music2 className="w-3 h-3" />
                                TikTok
                              </Badge>
                            ) : sale.item_type === "telegram" ? (
                              <Badge variant="outline" className="gap-1">
                                <MessageSquare className="w-3 h-3" />
                                Telegram
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="gap-1">
                                <Sparkles className="w-3 h-3" />
                                Modelo
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell>{formatPrice(sale.sale_amount_cents)}</TableCell>
                          <TableCell className="text-success font-medium">
                            {formatPrice(sale.vendor_commission_cents)}
                          </TableCell>
                          <TableCell>
                            {sale.status === "paid" ? (
                              <Badge className="bg-success">Pago</Badge>
                            ) : sale.status === "pending" ? (
                              <Badge variant="secondary">Pendente</Badge>
                            ) : (
                              <Badge variant="destructive">Falhou</Badge>
                            )}
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
      </div>
    </DashboardLayout>
  );
};

export default ResellerPage;
