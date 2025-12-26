import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Users, CheckCircle2, ShoppingCart, Search, Filter, X, SlidersHorizontal, MessageCircle } from "lucide-react";
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
}

type SortOption = "newest" | "price_asc" | "price_desc" | "members_desc";

const TelegramGroupsPage = () => {
  const [groups, setGroups] = useState<TelegramGroup[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedNiche, setSelectedNiche] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<SortOption>("newest");
  const [showVerifiedOnly, setShowVerifiedOnly] = useState(false);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 100000]);
  const [membersRange, setMembersRange] = useState<[number, number]>([0, 10000000]);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    fetchGroups();

    const channel = supabase
      .channel("telegram-groups")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "telegram_groups",
        },
        () => {
          fetchGroups();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchGroups = async () => {
    try {
      const { data, error } = await supabase
        .from("telegram_groups")
        .select("*")
        .eq("is_sold", false)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setGroups(data || []);
    } catch (error) {
      console.error("Error fetching groups:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBuy = (group: TelegramGroup) => {
    navigate(`/checkout?type=telegram_group&id=${group.id}`);
  };

  // Get unique niches from groups
  const niches = [...new Set(groups.map((g) => g.niche).filter(Boolean))] as string[];
  const types = [...new Set(groups.map((g) => g.group_type).filter(Boolean))] as string[];

  // Filter and sort groups
  const filteredGroups = groups
    .filter((group) => {
      const matchesSearch =
        group.group_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        group.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        group.group_username?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesNiche = !selectedNiche || group.niche === selectedNiche;
      const matchesType = !selectedType || group.group_type === selectedType;
      const matchesVerified = !showVerifiedOnly || group.is_verified;
      const matchesPrice =
        group.price_cents >= priceRange[0] * 100 &&
        group.price_cents <= priceRange[1] * 100;
      const matchesMembers =
        group.members_count >= membersRange[0] &&
        group.members_count <= membersRange[1];

      return (
        matchesSearch &&
        matchesNiche &&
        matchesType &&
        matchesVerified &&
        matchesPrice &&
        matchesMembers
      );
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "price_asc":
          return a.price_cents - b.price_cents;
        case "price_desc":
          return b.price_cents - a.price_cents;
        case "members_desc":
          return b.members_count - a.members_count;
        default:
          return 0;
      }
    });

  const formatPrice = (cents: number) => {
    return (cents / 100).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedNiche(null);
    setSelectedType(null);
    setShowVerifiedOnly(false);
    setPriceRange([0, 100000]);
    setMembersRange([0, 10000000]);
    setSortBy("newest");
  };

  const hasActiveFilters =
    searchQuery ||
    selectedNiche ||
    selectedType ||
    showVerifiedOnly ||
    priceRange[0] > 0 ||
    priceRange[1] < 100000 ||
    membersRange[0] > 0 ||
    membersRange[1] < 10000000;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4">
          <div>
            <p className="text-muted-foreground">
              Adquira grupos e canais do Telegram prontos para monetização
            </p>
          </div>

          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar grupos..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            <div className="flex gap-2">
              <Select
                value={sortBy}
                onValueChange={(value: SortOption) => setSortBy(value)}
              >
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Ordenar por" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Mais recentes</SelectItem>
                  <SelectItem value="price_asc">Menor preço</SelectItem>
                  <SelectItem value="price_desc">Maior preço</SelectItem>
                  <SelectItem value="members_desc">Mais membros</SelectItem>
                </SelectContent>
              </Select>

              <Sheet open={filtersOpen} onOpenChange={setFiltersOpen}>
                <SheetTrigger asChild>
                  <Button variant="outline" className="relative">
                    <SlidersHorizontal className="h-4 w-4 mr-2" />
                    Filtros
                    {hasActiveFilters && (
                      <span className="absolute -top-1 -right-1 h-3 w-3 bg-primary rounded-full" />
                    )}
                  </Button>
                </SheetTrigger>
                <SheetContent>
                  <SheetHeader>
                    <SheetTitle className="flex items-center justify-between">
                      Filtros
                      {hasActiveFilters && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={clearFilters}
                        >
                          <X className="h-4 w-4 mr-1" />
                          Limpar
                        </Button>
                      )}
                    </SheetTitle>
                  </SheetHeader>

                  <div className="space-y-6 mt-6">
                    {/* Niche Filter */}
                    <div className="space-y-2">
                      <Label>Nicho</Label>
                      <Select
                        value={selectedNiche || "all"}
                        onValueChange={(value) =>
                          setSelectedNiche(value === "all" ? null : value)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Todos os nichos" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Todos os nichos</SelectItem>
                          {niches.map((niche) => (
                            <SelectItem key={niche} value={niche}>
                              {niche}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Type Filter */}
                    <div className="space-y-2">
                      <Label>Tipo</Label>
                      <Select
                        value={selectedType || "all"}
                        onValueChange={(value) =>
                          setSelectedType(value === "all" ? null : value)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Todos os tipos" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Todos os tipos</SelectItem>
                          <SelectItem value="group">Grupo</SelectItem>
                          <SelectItem value="channel">Canal</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Verified Only */}
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="verified"
                        checked={showVerifiedOnly}
                        onCheckedChange={(checked) =>
                          setShowVerifiedOnly(checked === true)
                        }
                      />
                      <Label htmlFor="verified">Apenas verificados</Label>
                    </div>

                    {/* Price Range */}
                    <div className="space-y-3">
                      <Label>
                        Faixa de preço: {formatPrice(priceRange[0] * 100)} -{" "}
                        {formatPrice(priceRange[1] * 100)}
                      </Label>
                      <Slider
                        value={priceRange}
                        onValueChange={(value) =>
                          setPriceRange(value as [number, number])
                        }
                        min={0}
                        max={100000}
                        step={100}
                      />
                    </div>

                    {/* Members Range */}
                    <div className="space-y-3">
                      <Label>
                        Membros: {formatNumber(membersRange[0])} -{" "}
                        {formatNumber(membersRange[1])}
                      </Label>
                      <Slider
                        value={membersRange}
                        onValueChange={(value) =>
                          setMembersRange(value as [number, number])
                        }
                        min={0}
                        max={10000000}
                        step={1000}
                      />
                    </div>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>

        {/* Groups Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <div
                key={i}
                className="h-80 bg-muted/50 rounded-xl animate-pulse"
              />
            ))}
          </div>
        ) : filteredGroups.length === 0 ? (
          <div className="text-center py-16">
            <MessageCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium">Nenhum grupo encontrado</h3>
            <p className="text-muted-foreground mt-1">
              {hasActiveFilters
                ? "Tente ajustar os filtros"
                : "Novos grupos serão adicionados em breve"}
            </p>
            {hasActiveFilters && (
              <Button variant="outline" className="mt-4" onClick={clearFilters}>
                Limpar filtros
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredGroups.map((group, index) => (
              <motion.div
                key={group.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="group relative bg-card border border-border rounded-xl overflow-hidden hover:border-primary/50 transition-all duration-300"
              >
                {/* Image */}
                <div className="aspect-square relative overflow-hidden bg-gradient-to-br from-primary/20 to-primary/5">
                  {group.image_url ? (
                    <img
                      src={group.image_url}
                      alt={group.group_name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <MessageCircle className="h-16 w-16 text-primary/30" />
                    </div>
                  )}

                  {/* Badges */}
                  <div className="absolute top-2 left-2 flex flex-wrap gap-1">
                    {group.is_verified && (
                      <Badge className="bg-primary text-primary-foreground">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Verificado
                      </Badge>
                    )}
                    <Badge variant="secondary">
                      {group.group_type === 'channel' ? 'Canal' : 'Grupo'}
                    </Badge>
                  </div>

                  {/* Price Badge */}
                  <div className="absolute bottom-2 right-2">
                    <Badge className="bg-background/90 text-foreground font-bold text-lg px-3 py-1">
                      {formatPrice(group.price_cents)}
                    </Badge>
                  </div>
                </div>

                {/* Content */}
                <div className="p-4 space-y-3">
                  <div>
                    <h3 className="font-semibold truncate">{group.group_name}</h3>
                    {group.group_username && (
                      <p className="text-sm text-muted-foreground">@{group.group_username}</p>
                    )}
                  </div>

                  {group.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {group.description}
                    </p>
                  )}

                  {/* Stats */}
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      {formatNumber(group.members_count)}
                    </div>
                    {group.niche && (
                      <Badge variant="outline" className="text-xs">
                        {group.niche}
                      </Badge>
                    )}
                  </div>

                  {/* Buy Button */}
                  <Button
                    className="w-full"
                    onClick={() => handleBuy(group)}
                  >
                    <ShoppingCart className="h-4 w-4 mr-2" />
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

export default TelegramGroupsPage;