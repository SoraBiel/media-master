import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Users, Heart, CheckCircle2, ShoppingCart, Search, X, SlidersHorizontal, 
  RefreshCw, Video, Instagram, Zap, MessageSquare, Calendar, Image, ArrowRight, AlertTriangle,
  Flame, Crown, ThumbsUp, Eye, ShoppingBag, Sparkles, Star
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
  assets: unknown;
  scripts: unknown;
}

type SortOption = "newest" | "price_asc" | "price_desc" | "followers_desc";

// Tinder-style component for Black Models
const TinderStyleModels = ({ 
  models, 
  onBuy, 
  formatPrice 
}: { 
  models: BlackModel[]; 
  onBuy: (model: BlackModel) => void; 
  formatPrice: (cents: number) => string;
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState<'left' | 'right' | null>(null);
  const [showAssets, setShowAssets] = useState(false);

  const currentModel = models[currentIndex];

  const handleSwipe = (dir: 'left' | 'right') => {
    setDirection(dir);
    if (dir === 'right' && currentModel) {
      onBuy(currentModel);
    }
    setTimeout(() => {
      setDirection(null);
      setCurrentIndex((prev) => (prev + 1) % models.length);
    }, 300);
  };

  const handleBuyDirect = () => {
    if (currentModel) {
      onBuy(currentModel);
    }
  };

  // Parse assets safely
  const getAssets = (model: BlackModel): { name: string; type: string; url?: string }[] => {
    if (!model.assets) return [];
    if (Array.isArray(model.assets)) {
      return model.assets.filter((a): a is { name: string; type: string; url?: string } => 
        typeof a === 'object' && a !== null && 'name' in a && 'type' in a
      );
    }
    return [];
  };

  // Parse scripts safely
  const getScripts = (model: BlackModel): { title: string; content: string }[] => {
    if (!model.scripts) return [];
    if (Array.isArray(model.scripts)) {
      return model.scripts.filter((s): s is { title: string; content: string } => 
        typeof s === 'object' && s !== null && 'title' in s && 'content' in s
      );
    }
    return [];
  };

  const assets = currentModel ? getAssets(currentModel) : [];
  const scripts = currentModel ? getScripts(currentModel) : [];
  const totalItems = assets.length + scripts.length;

  if (!currentModel) return null;

  return (
    <div className="flex flex-col items-center gap-6">
      {/* Card Counter */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <span className="font-medium text-foreground">{currentIndex + 1}</span>
        <span>/</span>
        <span>{models.length}</span>
        <span className="ml-2">modelos disponíveis</span>
      </div>

      {/* Main Card Container */}
      <div className="relative w-full max-w-md mx-auto">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentModel.id}
            initial={{ scale: 0.95, opacity: 0, x: direction === 'left' ? -100 : direction === 'right' ? 100 : 0 }}
            animate={{ scale: 1, opacity: 1, x: 0 }}
            exit={{ 
              scale: 0.95, 
              opacity: 0, 
              x: direction === 'left' ? -300 : direction === 'right' ? 300 : 0,
              rotate: direction === 'left' ? -15 : direction === 'right' ? 15 : 0
            }}
            transition={{ duration: 0.3 }}
            className="relative overflow-hidden rounded-3xl shadow-2xl"
            style={{
              background: 'linear-gradient(180deg, hsl(var(--card)) 0%, hsl(var(--card)) 100%)',
            }}
          >
            {/* Glowing border effect */}
            <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-pink-500/20 via-purple-500/20 to-orange-500/20 pointer-events-none" />
            
            {/* Image Section */}
            <div className="relative h-80 bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400">
              {currentModel.image_url ? (
                <img 
                  src={currentModel.image_url} 
                  alt={currentModel.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <div className="text-center">
                    <Flame className="w-20 h-20 text-white/80 mx-auto mb-2" />
                    <p className="text-white/60 text-sm">Modelo Premium</p>
                  </div>
                </div>
              )}
              
              {/* Gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
              
              {/* Top badges */}
              <div className="absolute top-4 left-4 right-4 flex justify-between items-start">
                <motion.div 
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-gradient-to-r from-orange-500 to-red-500 text-white text-xs font-bold shadow-lg"
                >
                  <Flame className="w-3.5 h-3.5" />
                  HOT
                </motion.div>
                
                <motion.div 
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.1 }}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-black/50 backdrop-blur-sm text-white text-xs font-medium"
                >
                  <Sparkles className="w-3.5 h-3.5 text-yellow-400" />
                  Funil Incluso
                </motion.div>
              </div>

              {/* Price tag */}
              <motion.div 
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="absolute bottom-4 right-4 px-4 py-2 rounded-2xl bg-white text-black font-bold text-xl shadow-xl"
              >
                {formatPrice(currentModel.price_cents)}
              </motion.div>

              {/* Name and info */}
              <div className="absolute bottom-4 left-4 right-24">
                <h2 className="text-2xl font-bold text-white mb-1">{currentModel.name}</h2>
                <div className="flex items-center gap-2 text-white/80 text-sm">
                  <Crown className="w-4 h-4 text-yellow-400" />
                  <span>{currentModel.niche || 'Estratégia Premium'}</span>
                </div>
              </div>
            </div>

            {/* Content Section */}
            <div className="p-6 space-y-4">
              {currentModel.bio && (
                <p className="text-muted-foreground text-sm leading-relaxed line-clamp-2">
                  {currentModel.bio}
                </p>
              )}
              
              {/* Assets Preview Button */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setShowAssets(true)}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-purple-500/10 via-pink-500/10 to-orange-500/10 border border-purple-500/20 flex items-center justify-between group hover:border-purple-500/40 transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                    <Eye className="w-5 h-5 text-white" />
                  </div>
                  <div className="text-left">
                    <p className="font-medium text-foreground text-sm">Ver o que está incluso</p>
                    <p className="text-xs text-muted-foreground">
                      {totalItems > 0 ? `${totalItems} itens inclusos` : 'Assets, scripts e mais'}
                    </p>
                  </div>
                </div>
                <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-purple-500 group-hover:translate-x-1 transition-all" />
              </motion.button>
              
              {/* Features */}
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-8 h-8 rounded-full bg-green-500/10 flex items-center justify-center">
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                  </div>
                  <span className="text-foreground">Templates prontos</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-8 h-8 rounded-full bg-green-500/10 flex items-center justify-center">
                    <MessageSquare className="w-4 h-4 text-green-500" />
                  </div>
                  <span className="text-foreground">Roteiros de funil</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-8 h-8 rounded-full bg-green-500/10 flex items-center justify-center">
                    <Star className="w-4 h-4 text-green-500" />
                  </div>
                  <span className="text-foreground">Suporte dedicado</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-8 h-8 rounded-full bg-green-500/10 flex items-center justify-center">
                    <Zap className="w-4 h-4 text-green-500" />
                  </div>
                  <span className="text-foreground">Checklist operacional</span>
                </div>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Assets Preview Modal */}
        <AnimatePresence>
          {showAssets && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
              onClick={() => setShowAssets(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-card rounded-3xl w-full max-w-lg max-h-[80vh] overflow-hidden shadow-2xl border border-border"
              >
                {/* Modal Header */}
                <div className="relative p-6 bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500">
                  <button 
                    onClick={() => setShowAssets(false)}
                    className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition-colors"
                  >
                    <X className="w-5 h-5 text-white" />
                  </button>
                  <h3 className="text-xl font-bold text-white">{currentModel.name}</h3>
                  <p className="text-white/80 text-sm mt-1">Preview do conteúdo incluso</p>
                </div>
                
                {/* Modal Content */}
                <div className="p-6 overflow-y-auto max-h-[60vh] space-y-6">
                  {/* Assets Section */}
                  {assets.length > 0 && (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <Image className="w-5 h-5 text-purple-500" />
                        <h4 className="font-semibold text-foreground">Assets Inclusos</h4>
                        <Badge variant="secondary" className="ml-auto">{assets.length}</Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        {assets.map((asset, idx) => (
                          <motion.div
                            key={idx}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.05 }}
                            className="p-3 rounded-xl bg-secondary/50 border border-border hover:border-purple-500/30 transition-colors"
                          >
                            <div className="flex items-start gap-2">
                              <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center flex-shrink-0">
                                {asset.type === 'image' ? (
                                  <Image className="w-4 h-4 text-purple-500" />
                                ) : asset.type === 'video' ? (
                                  <Video className="w-4 h-4 text-pink-500" />
                                ) : (
                                  <Zap className="w-4 h-4 text-orange-500" />
                                )}
                              </div>
                              <div className="min-w-0">
                                <p className="text-sm font-medium text-foreground truncate">{asset.name}</p>
                                <p className="text-xs text-muted-foreground capitalize">{asset.type}</p>
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Scripts Section */}
                  {scripts.length > 0 && (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <MessageSquare className="w-5 h-5 text-pink-500" />
                        <h4 className="font-semibold text-foreground">Scripts de Funil</h4>
                        <Badge variant="secondary" className="ml-auto">{scripts.length}</Badge>
                      </div>
                      <div className="space-y-2">
                        {scripts.map((script, idx) => (
                          <motion.div
                            key={idx}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: (assets.length + idx) * 0.05 }}
                            className="p-3 rounded-xl bg-secondary/50 border border-border"
                          >
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-lg bg-pink-500/10 flex items-center justify-center flex-shrink-0">
                                <MessageSquare className="w-4 h-4 text-pink-500" />
                              </div>
                              <div>
                                <p className="text-sm font-medium text-foreground">{script.title}</p>
                                <p className="text-xs text-muted-foreground line-clamp-1">{script.content}</p>
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Default features if no custom assets/scripts */}
                  {totalItems === 0 && (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-yellow-500" />
                        <h4 className="font-semibold text-foreground">Conteúdo Premium</h4>
                      </div>
                      <div className="space-y-2">
                        {[
                          { icon: Image, label: 'Pack de fotos HD', desc: 'Imagens profissionais prontas' },
                          { icon: Video, label: 'Vídeos promocionais', desc: 'Conteúdo para stories e reels' },
                          { icon: MessageSquare, label: 'Scripts de vendas', desc: 'Roteiros testados e validados' },
                          { icon: Zap, label: 'Funil completo', desc: 'Estrutura pronta para usar' },
                          { icon: CheckCircle2, label: 'Checklist operacional', desc: 'Passo a passo detalhado' },
                        ].map((item, idx) => (
                          <motion.div
                            key={idx}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: idx * 0.1 }}
                            className="flex items-center gap-3 p-3 rounded-xl bg-secondary/50 border border-border"
                          >
                            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500/10 to-pink-500/10 flex items-center justify-center">
                              <item.icon className="w-5 h-5 text-purple-500" />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-foreground">{item.label}</p>
                              <p className="text-xs text-muted-foreground">{item.desc}</p>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Modal Footer */}
                <div className="p-6 border-t border-border bg-secondary/30">
                  <Button 
                    onClick={() => {
                      setShowAssets(false);
                      handleBuyDirect();
                    }}
                    className="w-full bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500 text-white hover:opacity-90"
                  >
                    <ShoppingBag className="w-4 h-4 mr-2" />
                    Comprar por {formatPrice(currentModel.price_cents)}
                  </Button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Swipe indicators */}
        <AnimatePresence>
          {direction === 'left' && (
            <motion.div
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.5 }}
              className="absolute top-1/2 left-8 -translate-y-1/2 px-6 py-3 rounded-xl border-4 border-red-500 text-red-500 font-bold text-2xl rotate-[-20deg]"
            >
              PULAR
            </motion.div>
          )}
          {direction === 'right' && (
            <motion.div
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.5 }}
              className="absolute top-1/2 right-8 -translate-y-1/2 px-6 py-3 rounded-xl border-4 border-green-500 text-green-500 font-bold text-2xl rotate-[20deg]"
            >
              COMPRAR!
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-6">
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => handleSwipe('left')}
          className="w-16 h-16 rounded-full bg-card border-2 border-red-500/30 flex items-center justify-center shadow-lg hover:bg-red-500/10 transition-colors"
        >
          <X className="w-8 h-8 text-red-500" />
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={handleBuyDirect}
          className="w-20 h-20 rounded-full bg-gradient-to-br from-yellow-400 via-orange-500 to-pink-500 flex items-center justify-center shadow-xl"
        >
          <ShoppingBag className="w-10 h-10 text-white" />
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => handleSwipe('right')}
          className="w-16 h-16 rounded-full bg-card border-2 border-green-500/30 flex items-center justify-center shadow-lg hover:bg-green-500/10 transition-colors"
        >
          <Heart className="w-8 h-8 text-green-500" />
        </motion.button>
      </div>

      {/* Navigation dots */}
      <div className="flex gap-2">
        {models.map((_, idx) => (
          <button
            key={idx}
            onClick={() => setCurrentIndex(idx)}
            className={`w-2 h-2 rounded-full transition-all ${
              idx === currentIndex 
                ? 'w-6 bg-gradient-to-r from-pink-500 to-orange-500' 
                : 'bg-muted-foreground/30 hover:bg-muted-foreground/50'
            }`}
          />
        ))}
      </div>
    </div>
  );
};


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

          {/* Black Models Tab - Tinder Style */}
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

            {filteredBlackModels.length === 0 ? (
              <Card className="glass-card">
                <CardContent className="p-12 text-center">
                  <Zap className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Nenhum modelo Black disponível</h3>
                  <p className="text-muted-foreground">Novos modelos serão adicionados em breve.</p>
                </CardContent>
              </Card>
            ) : (
              <TinderStyleModels 
                models={filteredBlackModels} 
                onBuy={handleBuyModel} 
                formatPrice={formatPrice} 
              />
            )}
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default AccountsPage;
