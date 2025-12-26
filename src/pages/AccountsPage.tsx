import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  Users, Heart, CheckCircle2, ShoppingCart, Search, X, SlidersHorizontal, 
  RefreshCw, Video, Instagram, Zap, MessageSquare, Calendar, Image, ArrowRight, AlertTriangle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { supabase } from "@/integrations/supabase/client";

interface TikTokAccount {
  id: string;
  username: string;
  followers: number;
  likes: number;
  description: string;
  niche: string;
  price_cents: number;
  is_verified: boolean;
  is_sold: boolean;
  image_url: string | null;
}

interface BlackModel {
  id: string;
  name: string;
  bio: string | null;
  niche: string | null;
  category: string | null;
  price_cents: number;
  is_sold: boolean;
  image_url: string | null;
}

type SortOption = "newest" | "price_asc" | "price_desc" | "followers_desc";

const AccountsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = searchParams.get("tab") || "tiktok";
  
  const [tiktokAccounts, setTiktokAccounts] = useState<TikTokAccount[]>([]);
  const [blackModels, setBlackModels] = useState<BlackModel[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedNiche, setSelectedNiche] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<SortOption>("newest");
  const [showVerifiedOnly, setShowVerifiedOnly] = useState(false);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 100000]);
  const [followersRange, setFollowersRange] = useState<[number, number]>([0, 10000000]);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [activeTab, setActiveTab] = useState(initialTab);
  const navigate = useNavigate();

  useEffect(() => {
    fetchData();

    const tiktokChannel = supabase
      .channel("tiktok-accounts")
      .on("postgres_changes", { event: "*", schema: "public", table: "tiktok_accounts" }, fetchData)
      .subscribe();

    const modelsChannel = supabase
      .channel("models_changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "models_for_sale" }, fetchData)
      .subscribe();

    return () => {
      supabase.removeChannel(tiktokChannel);
      supabase.removeChannel(modelsChannel);
    };
  }, []);

  const fetchData = async () => {
    try {
      const [tiktokRes, modelsRes] = await Promise.all([
        supabase.from("tiktok_accounts").select("*").eq("is_sold", false).order("created_at", { ascending: false }),
        supabase.from("models_for_sale").select("*").eq("is_sold", false).eq("category", "black").order("created_at", { ascending: false }),
      ]);

      if (tiktokRes.data) setTiktokAccounts(tiktokRes.data);
      if (modelsRes.data) setBlackModels(modelsRes.data);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    setSearchParams({ tab });
    clearFilters();
  };

  const handleBuyTikTok = (account: TikTokAccount) => {
    navigate(`/checkout?type=tiktok_account&id=${account.id}`);
  };

  const handleBuyModel = (model: BlackModel) => {
    navigate(`/checkout?type=model&id=${model.id}`);
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
    if (num >= 1000) return (num / 1000).toFixed(1) + "K";
    return num.toString();
  };

  const formatPrice = (cents: number) => {
    return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(cents / 100);
  };

  const tiktokNiches = [...new Set(tiktokAccounts.map((a) => a.niche).filter(Boolean))];
  const modelNiches = [...new Set(blackModels.map((m) => m.niche).filter(Boolean))];
  const niches = activeTab === "tiktok" ? tiktokNiches : activeTab === "black" ? modelNiches : [];

  const maxPrice = Math.max(...tiktokAccounts.map((a) => a.price_cents), ...blackModels.map(m => m.price_cents), 100000);
  const maxFollowers = Math.max(...tiktokAccounts.map((a) => a.followers), 10000000);

  const filteredTiktokAccounts = tiktokAccounts
    .filter((account) => {
      const matchesSearch = account.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
        account.description?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesNiche = !selectedNiche || account.niche === selectedNiche;
      const matchesVerified = !showVerifiedOnly || account.is_verified;
      const matchesPrice = account.price_cents >= priceRange[0] && account.price_cents <= priceRange[1];
      const matchesFollowers = account.followers >= followersRange[0] && account.followers <= followersRange[1];
      return matchesSearch && matchesNiche && matchesVerified && matchesPrice && matchesFollowers;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "price_asc": return a.price_cents - b.price_cents;
        case "price_desc": return b.price_cents - a.price_cents;
        case "followers_desc": return b.followers - a.followers;
        default: return 0;
      }
    });

  const filteredBlackModels = blackModels
    .filter((model) => {
      const matchesSearch = model.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        model.bio?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesNiche = !selectedNiche || model.niche === selectedNiche;
      const matchesPrice = model.price_cents >= priceRange[0] && model.price_cents <= priceRange[1];
      return matchesSearch && matchesNiche && matchesPrice;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "price_asc": return a.price_cents - b.price_cents;
        case "price_desc": return b.price_cents - a.price_cents;
        default: return 0;
      }
    });

  const activeFiltersCount = [selectedNiche, showVerifiedOnly, priceRange[0] > 0 || priceRange[1] < maxPrice, followersRange[0] > 0 || followersRange[1] < maxFollowers].filter(Boolean).length;

  const clearFilters = () => {
    setSelectedNiche(null);
    setShowVerifiedOnly(false);
    setPriceRange([0, maxPrice]);
    setFollowersRange([0, maxFollowers]);
    setSearchQuery("");
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <RefreshCw className="w-8 h-8 animate-spin text-telegram" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold mb-2">Contas</h1>
          <p className="text-muted-foreground">
            Contas e modelos verificados prontos para uso
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
          <TabsList className="bg-secondary">
            <TabsTrigger value="tiktok" className="gap-2">
              <Video className="w-4 h-4" />
              TikTok
            </TabsTrigger>
            <TabsTrigger value="instagram" className="gap-2">
              <Instagram className="w-4 h-4" />
              Instagram
            </TabsTrigger>
            <TabsTrigger value="black" className="gap-2">
              <Zap className="w-4 h-4" />
              Modelos Black
            </TabsTrigger>
          </TabsList>

          {/* Search and Filters Bar - Common for all tabs */}
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder={activeTab === "black" ? "Buscar por nome ou descrição..." : "Buscar por username ou descrição..."}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
              <SelectTrigger className="w-full lg:w-48">
                <SelectValue placeholder="Ordenar por" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Mais recentes</SelectItem>
                <SelectItem value="price_asc">Menor preço</SelectItem>
                <SelectItem value="price_desc">Maior preço</SelectItem>
                {activeTab === "tiktok" && (
                  <SelectItem value="followers_desc">Mais seguidores</SelectItem>
                )}
              </SelectContent>
            </Select>

            <Sheet open={filtersOpen} onOpenChange={setFiltersOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <SlidersHorizontal className="w-4 h-4" />
                  Filtros
                  {activeFiltersCount > 0 && (
                    <Badge variant="secondary" className="ml-1">
                      {activeFiltersCount}
                    </Badge>
                  )}
                </Button>
              </SheetTrigger>
              <SheetContent>
                <SheetHeader>
                  <SheetTitle>Filtros</SheetTitle>
                </SheetHeader>
                <div className="space-y-6 mt-6">
                  {niches.length > 0 && (
                    <div className="space-y-3">
                      <Label>Nicho</Label>
                      <div className="flex flex-wrap gap-2">
                        <Button variant={selectedNiche === null ? "default" : "outline"} size="sm" onClick={() => setSelectedNiche(null)}>
                          Todos
                        </Button>
                        {niches.map((niche) => (
                          <Button
                            key={niche}
                            variant={selectedNiche === niche ? "default" : "outline"}
                            size="sm"
                            onClick={() => setSelectedNiche(niche)}
                          >
                            {niche}
                          </Button>
                        ))}
                      </div>
                    </div>
                  )}

                  {activeTab === "tiktok" && (
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id="verified"
                        checked={showVerifiedOnly}
                        onCheckedChange={(checked) => setShowVerifiedOnly(checked === true)}
                      />
                      <Label htmlFor="verified" className="cursor-pointer">
                        Apenas contas verificadas
                      </Label>
                    </div>
                  )}

                  <div className="space-y-3">
                    <Label>Faixa de Preço</Label>
                    <Slider
                      value={priceRange}
                      min={0}
                      max={maxPrice}
                      step={1000}
                      onValueChange={(v) => setPriceRange(v as [number, number])}
                      className="mt-2"
                    />
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>{formatPrice(priceRange[0])}</span>
                      <span>{formatPrice(priceRange[1])}</span>
                    </div>
                  </div>

                  {activeTab === "tiktok" && (
                    <div className="space-y-3">
                      <Label>Faixa de Seguidores</Label>
                      <Slider
                        value={followersRange}
                        min={0}
                        max={maxFollowers}
                        step={10000}
                        onValueChange={(v) => setFollowersRange(v as [number, number])}
                        className="mt-2"
                      />
                      <div className="flex justify-between text-sm text-muted-foreground">
                        <span>{formatNumber(followersRange[0])}</span>
                        <span>{formatNumber(followersRange[1])}</span>
                      </div>
                    </div>
                  )}

                  <div className="flex gap-2 pt-4">
                    <Button variant="outline" onClick={clearFilters} className="flex-1">
                      Limpar filtros
                    </Button>
                    <Button onClick={() => setFiltersOpen(false)} className="flex-1">
                      Aplicar
                    </Button>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>

          {/* Active Filters Tags */}
          {(selectedNiche || showVerifiedOnly || searchQuery) && (
            <div className="flex flex-wrap gap-2 items-center">
              <span className="text-sm text-muted-foreground">Filtros ativos:</span>
              {searchQuery && (
                <Badge variant="secondary" className="gap-1">
                  Busca: {searchQuery}
                  <X className="w-3 h-3 cursor-pointer" onClick={() => setSearchQuery("")} />
                </Badge>
              )}
              {selectedNiche && (
                <Badge variant="secondary" className="gap-1">
                  {selectedNiche}
                  <X className="w-3 h-3 cursor-pointer" onClick={() => setSelectedNiche(null)} />
                </Badge>
              )}
              {showVerifiedOnly && (
                <Badge variant="secondary" className="gap-1">
                  Verificadas
                  <X className="w-3 h-3 cursor-pointer" onClick={() => setShowVerifiedOnly(false)} />
                </Badge>
              )}
              <Button variant="ghost" size="sm" onClick={clearFilters} className="text-muted-foreground">
                Limpar todos
              </Button>
            </div>
          )}

          {/* TikTok Tab */}
          <TabsContent value="tiktok" className="space-y-4">
            <div className="text-sm text-muted-foreground">
              {filteredTiktokAccounts.length} conta{filteredTiktokAccounts.length !== 1 ? "s" : ""} encontrada{filteredTiktokAccounts.length !== 1 ? "s" : ""}
            </div>

            {filteredTiktokAccounts.length === 0 ? (
              <div className="text-center py-12">
                <Video className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Nenhuma conta TikTok disponível no momento</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredTiktokAccounts.map((account, index) => (
                  <motion.div
                    key={account.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="glass-card p-6 hover:border-telegram/50 transition-all group"
                  >
                    <div className="text-center mb-4">
                      <div className="w-20 h-20 mx-auto mb-3 rounded-full bg-gradient-to-br from-pink-500 via-red-500 to-yellow-500 p-0.5">
                        <div className="w-full h-full rounded-full bg-card flex items-center justify-center">
                          {account.image_url ? (
                            <img src={account.image_url} alt={account.username} className="w-full h-full rounded-full object-cover" />
                          ) : (
                            <span className="text-2xl font-bold">{account.username.charAt(0).toUpperCase()}</span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center justify-center gap-2">
                        <h3 className="font-semibold text-lg">@{account.username}</h3>
                        {account.is_verified && <CheckCircle2 className="w-4 h-4 text-telegram" />}
                      </div>
                      {account.niche && <Badge variant="secondary" className="mt-2">{account.niche}</Badge>}
                    </div>

                    <div className="flex justify-center gap-6 mb-4">
                      <div className="text-center">
                        <div className="flex items-center gap-1 text-lg font-semibold">
                          <Users className="w-4 h-4" />
                          {formatNumber(account.followers)}
                        </div>
                        <p className="text-xs text-muted-foreground">Seguidores</p>
                      </div>
                      <div className="text-center">
                        <div className="flex items-center gap-1 text-lg font-semibold">
                          <Heart className="w-4 h-4" />
                          {formatNumber(account.likes)}
                        </div>
                        <p className="text-xs text-muted-foreground">Curtidas</p>
                      </div>
                    </div>

                    {account.description && (
                      <p className="text-sm text-muted-foreground text-center mb-4 line-clamp-2">{account.description}</p>
                    )}

                    <div className="flex items-center justify-between pt-4 border-t border-border">
                      <div className="text-2xl font-bold gradient-text">{formatPrice(account.price_cents)}</div>
                      <Button onClick={() => handleBuyTikTok(account)} className="telegram-gradient text-white gap-2">
                        <ShoppingCart className="w-4 h-4" />
                        Comprar
                      </Button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Instagram Tab */}
          <TabsContent value="instagram" className="space-y-4">
            <Card className="glass-card">
              <CardContent className="p-12 text-center">
                <Instagram className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Em breve</h3>
                <p className="text-muted-foreground">
                  Contas Instagram estarão disponíveis em breve.
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Black Models Tab */}
          <TabsContent value="black" className="space-y-4">
            <Card className="border-warning/30 bg-warning/5">
              <CardContent className="p-4 flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-warning mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-warning">Aviso de Compliance</p>
                  <p className="text-muted-foreground mt-1">
                    Estratégias agressivas devem ser usadas dentro dos limites legais e éticos. Respeite as políticas do Telegram.
                  </p>
                </div>
              </CardContent>
            </Card>

            <div className="text-sm text-muted-foreground">
              {filteredBlackModels.length} modelo{filteredBlackModels.length !== 1 ? "s" : ""} encontrado{filteredBlackModels.length !== 1 ? "s" : ""}
            </div>

            {filteredBlackModels.length === 0 ? (
              <Card className="glass-card">
                <CardContent className="p-12 text-center">
                  <Zap className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Nenhum modelo Black disponível</h3>
                  <p className="text-muted-foreground">Novos modelos serão adicionados em breve.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredBlackModels.map((model, i) => (
                  <motion.div key={model.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
                    <Card className="glass-card h-full">
                      <CardHeader>
                        <div className="flex justify-between items-start">
                          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                            <Zap className="w-6 h-6 text-white" />
                          </div>
                          <Badge variant="default">{formatPrice(model.price_cents)}</Badge>
                        </div>
                        <CardTitle className="mt-4">{model.name}</CardTitle>
                        <CardDescription>{model.niche || "Estratégia"}</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {model.bio && <p className="text-sm text-muted-foreground">{model.bio}</p>}
                        <ul className="text-sm space-y-2">
                          <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-success" />Templates prontos</li>
                          <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-success" />Roteiros de funil</li>
                          <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-success" />Checklist operacional</li>
                        </ul>
                        <Button onClick={() => handleBuyModel(model)} variant="gradient" className="w-full">
                          Comprar<ArrowRight className="w-4 h-4 ml-1" />
                        </Button>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default AccountsPage;
