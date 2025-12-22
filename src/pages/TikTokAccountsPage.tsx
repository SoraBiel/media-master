import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Users, Heart, CheckCircle2, ShoppingCart, Search, Filter, X, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
import { useAuth } from "@/contexts/AuthContext";

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

type SortOption = "newest" | "price_asc" | "price_desc" | "followers_desc";

const TikTokAccountsPage = () => {
  const [accounts, setAccounts] = useState<TikTokAccount[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedNiche, setSelectedNiche] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<SortOption>("newest");
  const [showVerifiedOnly, setShowVerifiedOnly] = useState(false);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 100000]);
  const [followersRange, setFollowersRange] = useState<[number, number]>([0, 10000000]);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    fetchAccounts();

    const channel = supabase
      .channel("tiktok-accounts")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "tiktok_accounts",
        },
        () => {
          fetchAccounts();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchAccounts = async () => {
    try {
      const { data, error } = await supabase
        .from("tiktok_accounts")
        .select("*")
        .eq("is_sold", false)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setAccounts(data || []);
    } catch (error) {
      console.error("Error fetching accounts:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBuy = (account: TikTokAccount) => {
    navigate(`/checkout?type=tiktok_account&id=${account.id}`);
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + "M";
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + "K";
    }
    return num.toString();
  };

  const formatPrice = (cents: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(cents / 100);
  };

  const niches = [...new Set(accounts.map((a) => a.niche).filter(Boolean))];

  const maxPrice = Math.max(...accounts.map((a) => a.price_cents), 100000);
  const maxFollowers = Math.max(...accounts.map((a) => a.followers), 10000000);

  const filteredAccounts = accounts
    .filter((account) => {
      const matchesSearch =
        account.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
        account.description?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesNiche = !selectedNiche || account.niche === selectedNiche;
      const matchesVerified = !showVerifiedOnly || account.is_verified;
      const matchesPrice =
        account.price_cents >= priceRange[0] && account.price_cents <= priceRange[1];
      const matchesFollowers =
        account.followers >= followersRange[0] && account.followers <= followersRange[1];
      return matchesSearch && matchesNiche && matchesVerified && matchesPrice && matchesFollowers;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "price_asc":
          return a.price_cents - b.price_cents;
        case "price_desc":
          return b.price_cents - a.price_cents;
        case "followers_desc":
          return b.followers - a.followers;
        default:
          return 0;
      }
    });

  const activeFiltersCount = [
    selectedNiche,
    showVerifiedOnly,
    priceRange[0] > 0 || priceRange[1] < maxPrice,
    followersRange[0] > 0 || followersRange[1] < maxFollowers,
  ].filter(Boolean).length;

  const clearFilters = () => {
    setSelectedNiche(null);
    setShowVerifiedOnly(false);
    setPriceRange([0, maxPrice]);
    setFollowersRange([0, maxFollowers]);
    setSearchQuery("");
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold mb-2">Contas TikTok</h1>
          <p className="text-muted-foreground">
            Contas verificadas e prontas para uso
          </p>
        </div>

        {/* Search and Filters Bar */}
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por username ou descrição..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Sort */}
          <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
            <SelectTrigger className="w-full lg:w-48">
              <SelectValue placeholder="Ordenar por" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Mais recentes</SelectItem>
              <SelectItem value="price_asc">Menor preço</SelectItem>
              <SelectItem value="price_desc">Maior preço</SelectItem>
              <SelectItem value="followers_desc">Mais seguidores</SelectItem>
            </SelectContent>
          </Select>

          {/* Filters Sheet */}
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
                {/* Niches */}
                <div className="space-y-3">
                  <Label>Nicho</Label>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant={selectedNiche === null ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSelectedNiche(null)}
                    >
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

                {/* Verified Only */}
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

                {/* Price Range */}
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

                {/* Followers Range */}
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

                {/* Actions */}
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
                <X
                  className="w-3 h-3 cursor-pointer"
                  onClick={() => setSearchQuery("")}
                />
              </Badge>
            )}
            {selectedNiche && (
              <Badge variant="secondary" className="gap-1">
                {selectedNiche}
                <X
                  className="w-3 h-3 cursor-pointer"
                  onClick={() => setSelectedNiche(null)}
                />
              </Badge>
            )}
            {showVerifiedOnly && (
              <Badge variant="secondary" className="gap-1">
                Verificadas
                <X
                  className="w-3 h-3 cursor-pointer"
                  onClick={() => setShowVerifiedOnly(false)}
                />
              </Badge>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="text-muted-foreground"
            >
              Limpar todos
            </Button>
          </div>
        )}

        {/* Results Count */}
        <div className="text-sm text-muted-foreground">
          {filteredAccounts.length} conta{filteredAccounts.length !== 1 ? "s" : ""} encontrada{filteredAccounts.length !== 1 ? "s" : ""}
        </div>

        {/* Accounts Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="glass-card p-6 animate-pulse">
                <div className="w-20 h-20 bg-muted rounded-full mx-auto mb-4" />
                <div className="h-6 bg-muted rounded w-3/4 mx-auto mb-2" />
                <div className="h-4 bg-muted rounded w-1/2 mx-auto" />
              </div>
            ))}
          </div>
        ) : filteredAccounts.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Nenhuma conta disponível no momento</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAccounts.map((account, index) => (
              <motion.div
                key={account.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="glass-card p-6 hover:border-telegram/50 transition-all group"
              >
                {/* Profile */}
                <div className="text-center mb-4">
                  <div className="w-20 h-20 mx-auto mb-3 rounded-full bg-gradient-to-br from-pink-500 via-red-500 to-yellow-500 p-0.5">
                    <div className="w-full h-full rounded-full bg-card flex items-center justify-center">
                      {account.image_url ? (
                        <img
                          src={account.image_url}
                          alt={account.username}
                          className="w-full h-full rounded-full object-cover"
                        />
                      ) : (
                        <span className="text-2xl font-bold">
                          {account.username.charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center justify-center gap-2">
                    <h3 className="font-semibold text-lg">@{account.username}</h3>
                    {account.is_verified && (
                      <CheckCircle2 className="w-4 h-4 text-telegram" />
                    )}
                  </div>
                  {account.niche && (
                    <Badge variant="secondary" className="mt-2">
                      {account.niche}
                    </Badge>
                  )}
                </div>

                {/* Stats */}
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

                {/* Description */}
                {account.description && (
                  <p className="text-sm text-muted-foreground text-center mb-4 line-clamp-2">
                    {account.description}
                  </p>
                )}

                {/* Price & Action */}
                <div className="flex items-center justify-between pt-4 border-t border-border">
                  <div className="text-2xl font-bold gradient-text">
                    {formatPrice(account.price_cents)}
                  </div>
                  <Button
                    onClick={() => handleBuy(account)}
                    className="telegram-gradient text-white gap-2"
                  >
                    <ShoppingCart className="w-4 h-4" />
                    Comprar
                  </Button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default TikTokAccountsPage;
