import { useState, useEffect } from "react";
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
import { Plus, Instagram, Music2, Trash2, Edit2, DollarSign, Link2, Loader2, CheckCircle, XCircle, AlertCircle } from "lucide-react";
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
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { integration: mpIntegration, isConnected: isMpConnected, isLoading: mpLoading, refetch: refetchMp } = useMercadoPagoIntegration();

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
    image_url: "",
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
    image_url: "",
    price_cents: 0,
    deliverable_info: "",
    deliverable_login: "",
    deliverable_password: "",
    deliverable_email: "",
    deliverable_notes: ""
  });

  // Sales
  const [sales, setSales] = useState<VendorSale[]>([]);
  const [loadingSales, setLoadingSales] = useState(true);

  useEffect(() => {
    if (user) {
      fetchInstagramAccounts();
      fetchTiktokAccounts();
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

  // Instagram handlers
  const handleAddInstagram = async () => {
    if (!instagramForm.username || instagramForm.price_cents <= 0) {
      toast({ title: "Erro", description: "Preencha o username e preço", variant: "destructive" });
      return;
    }

    setIsAddingInstagram(true);
    try {
      const { error } = await supabase
        .from("instagram_accounts")
        .insert({
          ...instagramForm,
          created_by: user?.id
        });

      if (error) throw error;

      toast({ title: "Sucesso", description: "Conta Instagram adicionada!" });
      setInstagramDialogOpen(false);
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
      image_url: "",
      price_cents: 0,
      deliverable_info: "",
      deliverable_login: "",
      deliverable_password: "",
      deliverable_email: "",
      deliverable_notes: ""
    });
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
      image_url: account.image_url || "",
      price_cents: account.price_cents,
      deliverable_info: account.deliverable_info || "",
      deliverable_login: account.deliverable_login || "",
      deliverable_password: account.deliverable_password || "",
      deliverable_email: account.deliverable_email || "",
      deliverable_notes: account.deliverable_notes || ""
    });
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
      const { error } = await supabase
        .from("tiktok_accounts")
        .insert({
          ...tiktokForm,
          created_by: user?.id
        });

      if (error) throw error;

      toast({ title: "Sucesso", description: "Conta TikTok adicionada!" });
      setTiktokDialogOpen(false);
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
      const { error } = await supabase
        .from("tiktok_accounts")
        .update(tiktokForm)
        .eq("id", editingTiktok.id);

      if (error) throw error;

      toast({ title: "Sucesso", description: "Conta atualizada!" });
      setTiktokDialogOpen(false);
      setEditingTiktok(null);
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
      image_url: "",
      price_cents: 0,
      deliverable_info: "",
      deliverable_login: "",
      deliverable_password: "",
      deliverable_email: "",
      deliverable_notes: ""
    });
  };

  const openEditTiktok = (account: TikTokAccount) => {
    setEditingTiktok(account);
    setTiktokForm({
      username: account.username,
      followers: account.followers,
      likes: account.likes,
      niche: account.niche || "",
      description: account.description || "",
      image_url: account.image_url || "",
      price_cents: account.price_cents,
      deliverable_info: account.deliverable_info || "",
      deliverable_login: account.deliverable_login || "",
      deliverable_password: account.deliverable_password || "",
      deliverable_email: account.deliverable_email || "",
      deliverable_notes: account.deliverable_notes || ""
    });
    setTiktokDialogOpen(true);
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
  const paidEarnings = sales.filter(s => s.status === "paid").reduce((acc, sale) => acc + sale.vendor_commission_cents, 0);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header Stats */}
        <div className="grid gap-4 md:grid-cols-4">
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
        <Tabs defaultValue="instagram" className="space-y-4">
          <TabsList>
            <TabsTrigger value="instagram" className="gap-2">
              <Instagram className="w-4 h-4" />
              Instagram
            </TabsTrigger>
            <TabsTrigger value="tiktok" className="gap-2">
              <Music2 className="w-4 h-4" />
              TikTok
            </TabsTrigger>
            <TabsTrigger value="sales" className="gap-2">
              <DollarSign className="w-4 h-4" />
              Minhas Vendas
            </TabsTrigger>
          </TabsList>

          {/* Instagram Tab */}
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
                        <div className="space-y-2">
                          <Label>URL da Imagem</Label>
                          <Input
                            placeholder="https://..."
                            value={instagramForm.image_url}
                            onChange={(e) => setInstagramForm(prev => ({ ...prev, image_url: e.target.value }))}
                          />
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

          {/* TikTok Tab */}
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
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Nicho</Label>
                          <Input
                            placeholder="Ex: Fitness, Humor..."
                            value={tiktokForm.niche}
                            onChange={(e) => setTiktokForm(prev => ({ ...prev, niche: e.target.value }))}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>URL da Imagem</Label>
                          <Input
                            placeholder="https://..."
                            value={tiktokForm.image_url}
                            onChange={(e) => setTiktokForm(prev => ({ ...prev, image_url: e.target.value }))}
                          />
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
                            ) : (
                              <Badge variant="outline" className="gap-1">
                                <Music2 className="w-3 h-3" />
                                TikTok
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