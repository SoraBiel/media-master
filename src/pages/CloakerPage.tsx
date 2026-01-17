import { useState } from "react";
import { Link } from "react-router-dom";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { useCloaker, useAllCloakerStats, useCloakerClicks, CloakerLink } from "@/hooks/useCloaker";
import { Plus, Link as LinkIcon, Shield, ShieldOff, Globe, Smartphone, Monitor, Copy, Trash2, Edit2, Eye, BarChart3, ShieldCheck, ShieldX, MapPin, CheckCircle2, Image, ArrowRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const CloakerPage = () => {
  const { links, isLoading, createLink, updateLink, deleteLink } = useCloaker();
  const { stats: globalStats, isLoading: isLoadingStats } = useAllCloakerStats();
  const { toast } = useToast();
  
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingLink, setEditingLink] = useState<CloakerLink | null>(null);
  const [viewingLink, setViewingLink] = useState<CloakerLink | null>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    safe_url: "",
    offer_url: "",
    block_vpn: true,
    block_bots: true,
    allowed_countries: ["BR"],
  });

  const resetForm = () => {
    setFormData({
      name: "",
      slug: "",
      safe_url: "",
      offer_url: "",
      block_vpn: true,
      block_bots: true,
      allowed_countries: ["BR"],
    });
  };

  const handleCreateLink = async () => {
    if (!formData.name || !formData.slug || !formData.safe_url || !formData.offer_url) {
      toast({
        title: "Preencha todos os campos",
        description: "Nome, slug, URL segura e URL da oferta são obrigatórios.",
        variant: "destructive",
      });
      return;
    }

    const result = await createLink({
      ...formData,
      is_active: true,
    });

    if (result) {
      setShowCreateDialog(false);
      resetForm();
    }
  };

  const handleUpdateLink = async () => {
    if (!editingLink) return;

    const result = await updateLink(editingLink.id, formData);
    if (result) {
      setEditingLink(null);
      resetForm();
    }
  };

  const handleDeleteLink = async (id: string) => {
    if (confirm("Tem certeza que deseja excluir este link?")) {
      await deleteLink(id);
    }
  };

  const copyLink = (slug: string) => {
    const url = `${window.location.origin}/clk/${slug}`;
    navigator.clipboard.writeText(url);
    toast({
      title: "Link copiado",
      description: "O link foi copiado para a área de transferência.",
    });
  };

  const openEditDialog = (link: CloakerLink) => {
    setFormData({
      name: link.name,
      slug: link.slug,
      safe_url: link.safe_url,
      offer_url: link.offer_url,
      block_vpn: link.block_vpn,
      block_bots: link.block_bots,
      allowed_countries: link.allowed_countries,
    });
    setEditingLink(link);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold">Cloaker de Links</h1>
            <p className="text-muted-foreground">Proteja seus links de anúncios contra revisores e bots</p>
          </div>
          <div className="flex gap-2">
            <Link to="/cloaker-media">
              <Button variant="outline">
                <Image className="w-4 h-4 mr-2" />
                Cloaker de Mídia
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
            <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
              <DialogTrigger asChild>
                <Button onClick={resetForm}>
                  <Plus className="w-4 h-4 mr-2" />
                  Novo Link
                </Button>
              </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Criar Link Cloakado</DialogTitle>
                <DialogDescription>
                  Configure um novo link para proteger seus anúncios
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Nome</Label>
                  <Input
                    placeholder="Ex: Campanha Facebook"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Slug (identificador único)</Label>
                  <Input
                    placeholder="Ex: fb-campanha-1"
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "") })}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    URL: {window.location.origin}/clk/{formData.slug || "seu-slug"}
                  </p>
                </div>
                <div>
                  <Label>URL Segura (para revisores)</Label>
                  <Input
                    placeholder="https://site-seguro.com"
                    value={formData.safe_url}
                    onChange={(e) => setFormData({ ...formData, safe_url: e.target.value })}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Revisores do Facebook verão esta página
                  </p>
                </div>
                <div>
                  <Label>URL da Oferta (para usuários reais)</Label>
                  <Input
                    placeholder="https://sua-oferta.com"
                    value={formData.offer_url}
                    onChange={(e) => setFormData({ ...formData, offer_url: e.target.value })}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Usuários reais serão redirecionados para cá
                  </p>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Bloquear VPN/Proxy</Label>
                    <p className="text-xs text-muted-foreground">Detecta e bloqueia conexões VPN</p>
                  </div>
                  <Switch
                    checked={formData.block_vpn}
                    onCheckedChange={(checked) => setFormData({ ...formData, block_vpn: checked })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Bloquear Bots</Label>
                    <p className="text-xs text-muted-foreground">Detecta crawlers e revisores</p>
                  </div>
                  <Switch
                    checked={formData.block_bots}
                    onCheckedChange={(checked) => setFormData({ ...formData, block_bots: checked })}
                  />
                </div>
                <Button onClick={handleCreateLink} className="w-full">
                  Criar Link
                </Button>
              </div>
            </DialogContent>
            </Dialog>
          </div>
        </div>

        <Tabs defaultValue="links">
          <TabsList>
            <TabsTrigger value="links">
              <LinkIcon className="w-4 h-4 mr-2" />
              Meus Links
            </TabsTrigger>
            <TabsTrigger value="analytics">
              <BarChart3 className="w-4 h-4 mr-2" />
              Dashboard
            </TabsTrigger>
          </TabsList>

          <TabsContent value="links" className="space-y-4">
            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <LinkIcon className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{links.length}</p>
                      <p className="text-xs text-muted-foreground">Links Ativos</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-success/10">
                      <Eye className="w-5 h-5 text-success" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{isLoadingStats ? "-" : globalStats?.totalClicks || 0}</p>
                      <p className="text-xs text-muted-foreground">Total de Cliques</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-green-500/10">
                      <ShieldCheck className="w-5 h-5 text-green-500" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{isLoadingStats ? "-" : globalStats?.allowedClicks || 0}</p>
                      <p className="text-xs text-muted-foreground">Permitidos</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-destructive/10">
                      <ShieldX className="w-5 h-5 text-destructive" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{isLoadingStats ? "-" : globalStats?.blockedClicks || 0}</p>
                      <p className="text-xs text-muted-foreground">Bloqueados</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Links Table */}
            <Card>
              <CardHeader>
                <CardTitle>Links Cloakados</CardTitle>
                <CardDescription>Gerencie seus links protegidos</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                      <Skeleton key={i} className="h-16 w-full" />
                    ))}
                  </div>
                ) : links.length === 0 ? (
                  <div className="text-center py-12">
                    <Shield className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium">Nenhum link criado</h3>
                    <p className="text-muted-foreground mb-4">
                      Crie seu primeiro link cloakado para proteger seus anúncios
                    </p>
                    <Button onClick={() => setShowCreateDialog(true)}>
                      <Plus className="w-4 h-4 mr-2" />
                      Criar Link
                    </Button>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nome</TableHead>
                        <TableHead>Slug</TableHead>
                        <TableHead>Proteções</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {links.map((link) => (
                        <TableRow key={link.id}>
                          <TableCell className="font-medium">{link.name}</TableCell>
                          <TableCell>
                            <code className="text-xs bg-muted px-2 py-1 rounded">/clk/{link.slug}</code>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              {link.block_vpn && (
                                <Badge variant="outline" className="text-xs">
                                  <Shield className="w-3 h-3 mr-1" />
                                  VPN
                                </Badge>
                              )}
                              {link.block_bots && (
                                <Badge variant="outline" className="text-xs">
                                  <ShieldOff className="w-3 h-3 mr-1" />
                                  Bots
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={link.is_active ? "default" : "secondary"}>
                              {link.is_active ? "Ativo" : "Inativo"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => copyLink(link.slug)}
                              >
                                <Copy className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setViewingLink(link)}
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => openEditDialog(link)}
                              >
                                <Edit2 className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDeleteLink(link.id)}
                              >
                                <Trash2 className="w-4 h-4 text-destructive" />
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

          <TabsContent value="analytics" className="space-y-4">
            <CloakerAnalyticsDashboard stats={globalStats} isLoading={isLoadingStats} />
          </TabsContent>
        </Tabs>

        {/* Edit Dialog */}
        <Dialog open={!!editingLink} onOpenChange={(open) => !open && setEditingLink(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Editar Link</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Nome</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div>
                <Label>URL Segura</Label>
                <Input
                  value={formData.safe_url}
                  onChange={(e) => setFormData({ ...formData, safe_url: e.target.value })}
                />
              </div>
              <div>
                <Label>URL da Oferta</Label>
                <Input
                  value={formData.offer_url}
                  onChange={(e) => setFormData({ ...formData, offer_url: e.target.value })}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label>Bloquear VPN</Label>
                <Switch
                  checked={formData.block_vpn}
                  onCheckedChange={(checked) => setFormData({ ...formData, block_vpn: checked })}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label>Bloquear Bots</Label>
                <Switch
                  checked={formData.block_bots}
                  onCheckedChange={(checked) => setFormData({ ...formData, block_bots: checked })}
                />
              </div>
              <Button onClick={handleUpdateLink} className="w-full">
                Salvar Alterações
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* View Clicks Dialog */}
        <Dialog open={!!viewingLink} onOpenChange={(open) => !open && setViewingLink(null)}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Cliques: {viewingLink?.name}</DialogTitle>
            </DialogHeader>
            {viewingLink && <CloakerClicksTable linkId={viewingLink.id} />}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

const CloakerAnalyticsDashboard = ({ stats, isLoading }: { stats: any; isLoading: boolean }) => {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-48" />
        ))}
      </div>
    );
  }

  if (!stats) return null;

  const sortedCountries = Object.entries(stats.byCountry)
    .sort(([, a], [, b]) => (b as number) - (a as number))
    .slice(0, 5);

  const sortedDevices = Object.entries(stats.byDevice)
    .sort(([, a], [, b]) => (b as number) - (a as number));

  const sortedBrowsers = Object.entries(stats.byBrowser)
    .sort(([, a], [, b]) => (b as number) - (a as number))
    .slice(0, 5);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <MapPin className="w-4 h-4" />
            Por País
          </CardTitle>
        </CardHeader>
        <CardContent>
          {sortedCountries.length === 0 ? (
            <p className="text-muted-foreground text-sm">Nenhum dado ainda</p>
          ) : (
            <div className="space-y-2">
              {sortedCountries.map(([country, count]) => (
                <div key={country} className="flex justify-between items-center">
                  <span className="text-sm">{country}</span>
                  <Badge variant="secondary">{count as number}</Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Smartphone className="w-4 h-4" />
            Por Dispositivo
          </CardTitle>
        </CardHeader>
        <CardContent>
          {sortedDevices.length === 0 ? (
            <p className="text-muted-foreground text-sm">Nenhum dado ainda</p>
          ) : (
            <div className="space-y-2">
              {sortedDevices.map(([device, count]) => (
                <div key={device} className="flex justify-between items-center">
                  <span className="text-sm flex items-center gap-2">
                    {device === "mobile" ? <Smartphone className="w-4 h-4" /> : <Monitor className="w-4 h-4" />}
                    {device === "mobile" ? "Mobile" : device === "desktop" ? "Desktop" : device}
                  </span>
                  <Badge variant="secondary">{count as number}</Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Globe className="w-4 h-4" />
            Por Navegador
          </CardTitle>
        </CardHeader>
        <CardContent>
          {sortedBrowsers.length === 0 ? (
            <p className="text-muted-foreground text-sm">Nenhum dado ainda</p>
          ) : (
            <div className="space-y-2">
              {sortedBrowsers.map(([browser, count]) => (
                <div key={browser} className="flex justify-between items-center">
                  <span className="text-sm">{browser}</span>
                  <Badge variant="secondary">{count as number}</Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

const CloakerClicksTable = ({ linkId }: { linkId: string }) => {
  const { clicks, stats, isLoading } = useCloakerClicks(linkId);

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Quick Stats */}
      {stats && (
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-muted/50 rounded-lg p-3 text-center">
            <p className="text-2xl font-bold">{stats.totalClicks}</p>
            <p className="text-xs text-muted-foreground">Total</p>
          </div>
          <div className="bg-green-500/10 rounded-lg p-3 text-center">
            <p className="text-2xl font-bold text-green-600">{stats.allowedClicks}</p>
            <p className="text-xs text-muted-foreground">Permitidos</p>
          </div>
          <div className="bg-destructive/10 rounded-lg p-3 text-center">
            <p className="text-2xl font-bold text-destructive">{stats.blockedClicks}</p>
            <p className="text-xs text-muted-foreground">Bloqueados</p>
          </div>
        </div>
      )}

      {/* Clicks Table */}
      {clicks.length === 0 ? (
        <p className="text-center text-muted-foreground py-8">
          Nenhum clique registrado ainda
        </p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Data</TableHead>
              <TableHead>País</TableHead>
              <TableHead>Dispositivo</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Destino</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {clicks.slice(0, 50).map((click) => (
              <TableRow key={click.id}>
                <TableCell className="text-sm">
                  {format(new Date(click.clicked_at), "dd/MM HH:mm", { locale: ptBR })}
                </TableCell>
                <TableCell>{click.country || "-"}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    {click.device_type === "mobile" ? (
                      <Smartphone className="w-4 h-4" />
                    ) : (
                      <Monitor className="w-4 h-4" />
                    )}
                    <span className="text-sm">{click.browser || "-"}</span>
                  </div>
                </TableCell>
                <TableCell>
                  {click.was_blocked ? (
                    <Badge variant="destructive" className="text-xs">
                      <ShieldX className="w-3 h-3 mr-1" />
                      Bloqueado
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-xs text-green-600 border-green-600">
                      <CheckCircle2 className="w-3 h-3 mr-1" />
                      Permitido
                    </Badge>
                  )}
                </TableCell>
                <TableCell className="text-xs text-muted-foreground max-w-[200px] truncate">
                  {click.redirect_target || "-"}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
};

export default CloakerPage;
