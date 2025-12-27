import { useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sparkles, Zap, Users, MessageSquare, Calendar, Image, ArrowRight, AlertTriangle, CheckCircle2, RefreshCw, Search, Star, Award, TrendingUp, Rocket, Heart, X, Info, MapPin, Flame, Crown, ThumbsUp, Eye, ShoppingBag } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

interface Model {
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
  assets: any;
  scripts: any;
  funnel_json: any;
  created_by: string | null;
}

const ModelHubPage = () => {
  const [models, setModels] = useState<Model[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentBlackIndex, setCurrentBlackIndex] = useState(0);
  const [swipeDirection, setSwipeDirection] = useState<"left" | "right" | null>(null);
  const [likedModels, setLikedModels] = useState<Set<string>>(new Set());
  const navigate = useNavigate();

  const handleBuy = (model: Model) => {
    navigate(`/checkout?type=model&id=${model.id}`);
  };

  const fetchModels = async () => {
    try {
      const { data, error } = await supabase
        .from("models_for_sale")
        .select("*")
        .eq("is_sold", false)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setModels((data || []) as Model[]);
    } catch (error: any) {
      console.error("Error fetching models:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchModels();

    const channel = supabase
      .channel("models_changes")
      .on("postgres_changes", {
        event: "*",
        schema: "public",
        table: "models_for_sale",
      }, () => fetchModels())
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const iaModels = models.filter(m => m.category === "ia");
  const blackModels = models.filter(m => m.category === "black");

  const formatPrice = (cents: number) => {
    return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(cents / 100);
  };

  const filterModels = (modelList: Model[]) => {
    if (!searchQuery) return modelList;
    const query = searchQuery.toLowerCase();
    return modelList.filter(m => 
      m.name.toLowerCase().includes(query) ||
      m.bio?.toLowerCase().includes(query) ||
      m.niche?.toLowerCase().includes(query)
    );
  };

  const getModelFeatures = (model: Model) => {
    const features: string[] = [];
    if (model.assets && Array.isArray(model.assets) && model.assets.length > 0) {
      features.push("Assets inclusos");
    }
    if (model.scripts && Array.isArray(model.scripts) && model.scripts.length > 0) {
      features.push("Scripts prontos");
    }
    if (model.funnel_json) {
      features.push("Funil pronto");
    }
    if (model.deliverable_link) {
      features.push("Link de acesso");
    }
    if (model.deliverable_notes) {
      features.push("Instruções detalhadas");
    }
    return features.length > 0 ? features : ["Templates prontos", "Roteiros de funil", "Checklist operacional"];
  };

  // Handle swipe for Black models (Tinder style)
  const handleSwipe = (direction: "left" | "right") => {
    const filteredBlack = filterModels(blackModels);
    if (filteredBlack.length === 0) return;
    
    setSwipeDirection(direction);
    
    if (direction === "right") {
      const currentModel = filteredBlack[currentBlackIndex];
      setLikedModels(prev => new Set(prev).add(currentModel.id));
      // Auto navigate to buy after liking
      setTimeout(() => handleBuy(currentModel), 300);
    }
    
    setTimeout(() => {
      setSwipeDirection(null);
      setCurrentBlackIndex(prev => (prev + 1) % filteredBlack.length);
    }, 300);
  };

  const goToNextModel = () => {
    const filteredBlack = filterModels(blackModels);
    setCurrentBlackIndex(prev => (prev + 1) % filteredBlack.length);
  };

  const goToPrevModel = () => {
    const filteredBlack = filterModels(blackModels);
    setCurrentBlackIndex(prev => (prev - 1 + filteredBlack.length) % filteredBlack.length);
  };

  const ModelCard = ({ model, gradient }: { model: Model; gradient: string }) => {
    const features = getModelFeatures(model);
    
    return (
      <Card className="overflow-hidden bg-gradient-to-br from-card to-card/50 border-border/50 hover:border-primary/50 transition-all duration-300 group h-full flex flex-col">
        <CardHeader className="pb-4">
          <div className="flex items-start gap-4">
            {model.image_url ? (
              <img 
                src={model.image_url} 
                alt={model.name} 
                className="w-16 h-16 rounded-xl object-cover ring-2 ring-primary/20 group-hover:ring-primary/50 transition-all"
              />
            ) : (
              <div className={`w-16 h-16 rounded-xl ${gradient} flex items-center justify-center shadow-lg`}>
                <Zap className="w-8 h-8 text-white" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <CardTitle className="text-xl truncate">{model.name}</CardTitle>
              <CardDescription className="flex items-center gap-2 mt-1">
                {model.niche ? (
                  <Badge variant="outline" className="text-xs">{model.niche}</Badge>
                ) : (
                  <span className="text-muted-foreground text-sm">Estratégia</span>
                )}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="flex-1 flex flex-col">
          {model.bio && (
            <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{model.bio}</p>
          )}
          
          <div className="space-y-2 mb-6 flex-1">
            {features.map((feature, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                <span className="text-sm text-muted-foreground">{feature}</span>
              </div>
            ))}
          </div>
          
          <div className="space-y-3 mt-auto">
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold text-primary">{formatPrice(model.price_cents)}</span>
              {model.funnel_json && (
                <Badge className="bg-primary/10 text-primary border-primary/20">
                  <Rocket className="w-3 h-3 mr-1" />
                  Funil Incluso
                </Badge>
              )}
            </div>
            
            <Button 
              className="w-full bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 transition-all"
              onClick={() => handleBuy(model)}
            >
              Comprar
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  };

  // Tinder-style card for Black models
  const TinderCard = ({ model }: { model: Model }) => {
    const features = getModelFeatures(model);
    
    return (
      <motion.div
        className="absolute inset-0"
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ 
          scale: 1, 
          opacity: 1,
          x: swipeDirection === "left" ? -300 : swipeDirection === "right" ? 300 : 0,
          rotate: swipeDirection === "left" ? -15 : swipeDirection === "right" ? 15 : 0
        }}
        exit={{ scale: 0.9, opacity: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
      >
        <Card className="h-full overflow-hidden bg-gradient-to-br from-slate-900 via-purple-950 to-slate-900 border-2 border-purple-500/30 shadow-2xl shadow-purple-500/20">
          {/* Image section */}
          <div className="relative h-[45%] overflow-hidden">
            {model.image_url ? (
              <img 
                src={model.image_url} 
                alt={model.name} 
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-purple-600 via-pink-500 to-rose-500 flex items-center justify-center">
                <Flame className="w-24 h-24 text-white/80" />
              </div>
            )}
            
            {/* Gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent" />
            
            {/* Top badges */}
            <div className="absolute top-4 left-4 flex gap-2">
              <Badge className="bg-gradient-to-r from-purple-600 to-pink-600 text-white border-0 shadow-lg">
                <Flame className="w-3 h-3 mr-1" />
                HOT
              </Badge>
              {model.funnel_json && (
                <Badge className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white border-0 shadow-lg">
                  <Rocket className="w-3 h-3 mr-1" />
                  Funil
                </Badge>
              )}
            </div>
            
            {/* Price tag */}
            <div className="absolute top-4 right-4">
              <div className="px-3 py-1.5 rounded-full bg-black/60 backdrop-blur-sm border border-white/20">
                <span className="text-lg font-bold text-white">{formatPrice(model.price_cents)}</span>
              </div>
            </div>
            
            {/* Name and niche */}
            <div className="absolute bottom-0 left-0 right-0 p-5">
              <div className="flex items-end justify-between">
                <div>
                  <h2 className="text-3xl font-bold text-white drop-shadow-lg">{model.name}</h2>
                  {model.niche && (
                    <div className="flex items-center gap-2 mt-1">
                      <MapPin className="w-4 h-4 text-purple-400" />
                      <span className="text-purple-300">{model.niche}</span>
                    </div>
                  )}
                </div>
                <motion.button
                  className="p-2 rounded-full bg-white/10 backdrop-blur-sm"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <Info className="w-5 h-5 text-white" />
                </motion.button>
              </div>
            </div>
          </div>
          
          {/* Content section */}
          <CardContent className="h-[55%] flex flex-col p-5 bg-gradient-to-b from-slate-900/80 to-slate-900">
            {/* Bio */}
            {model.bio && (
              <p className="text-gray-300 text-sm leading-relaxed mb-4 line-clamp-3">
                {model.bio}
              </p>
            )}
            
            {/* Features */}
            <div className="flex-1 space-y-2.5">
              <p className="text-xs text-purple-400 uppercase tracking-wider font-semibold mb-2">O que você recebe:</p>
              {features.map((feature, idx) => (
                <motion.div 
                  key={idx} 
                  className="flex items-center gap-3"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.1 }}
                >
                  <div className="w-6 h-6 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 flex items-center justify-center flex-shrink-0">
                    <CheckCircle2 className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-sm text-gray-200">{feature}</span>
                </motion.div>
              ))}
            </div>
            
            {/* Action buttons (Tinder style) */}
            <div className="flex items-center justify-center gap-6 pt-4 mt-auto">
              <motion.button
                className="w-16 h-16 rounded-full bg-gradient-to-br from-slate-700 to-slate-800 border-2 border-slate-600 flex items-center justify-center shadow-lg"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => handleSwipe("left")}
              >
                <X className="w-8 h-8 text-rose-400" />
              </motion.button>
              
              <motion.button
                className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 border-2 border-blue-400 flex items-center justify-center shadow-lg"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => handleBuy(model)}
              >
                <ShoppingBag className="w-6 h-6 text-white" />
              </motion.button>
              
              <motion.button
                className="w-16 h-16 rounded-full bg-gradient-to-br from-pink-500 to-rose-500 border-2 border-pink-400 flex items-center justify-center shadow-lg"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => handleSwipe("right")}
              >
                <Heart className="w-8 h-8 text-white" />
              </motion.button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <RefreshCw className="w-8 h-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  const filteredBlackModels = filterModels(blackModels);
  const currentBlackModel = filteredBlackModels[currentBlackIndex];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-purple-500 bg-clip-text text-transparent">
              Model Hub
            </h1>
            <p className="text-muted-foreground mt-1">Templates e estratégias prontas para suas campanhas</p>
          </div>
          
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Buscar por nome ou descrição..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/20">
                <Award className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{models.length}</p>
                <p className="text-xs text-muted-foreground">Modelos</p>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 border-emerald-500/20">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-500/20">
                <Sparkles className="w-5 h-5 text-emerald-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{iaModels.length}</p>
                <p className="text-xs text-muted-foreground">Modelos IA</p>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-purple-500/10 to-purple-500/5 border-purple-500/20">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-500/20">
                <Flame className="w-5 h-5 text-purple-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{blackModels.length}</p>
                <p className="text-xs text-muted-foreground">Modelos Black</p>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-amber-500/10 to-amber-500/5 border-amber-500/20">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-500/20">
                <TrendingUp className="w-5 h-5 text-amber-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{models.filter(m => m.funnel_json).length}</p>
                <p className="text-xs text-muted-foreground">Com Funil</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="all" className="space-y-6">
          <TabsList className="bg-secondary/50 p-1">
            <TabsTrigger value="all" className="gap-2 data-[state=active]:bg-background">
              <Star className="w-4 h-4" />
              Todos ({models.length})
            </TabsTrigger>
            <TabsTrigger value="ia" className="gap-2 data-[state=active]:bg-background">
              <Sparkles className="w-4 h-4" />
              Modelos IA ({iaModels.length})
            </TabsTrigger>
            <TabsTrigger value="black" className="gap-2 data-[state=active]:bg-background">
              <Flame className="w-4 h-4" />
              Modelos Black ({blackModels.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-6">
            {filterModels(models).length > 0 ? (
              <>
                <p className="text-sm text-muted-foreground">{filterModels(models).length} modelo(s) encontrado(s)</p>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filterModels(models).map((model, i) => (
                    <motion.div 
                      key={model.id} 
                      initial={{ opacity: 0, y: 20 }} 
                      animate={{ opacity: 1, y: 0 }} 
                      transition={{ delay: i * 0.05 }}
                    >
                      <ModelCard 
                        model={model} 
                        gradient={model.category === "ia" 
                          ? "bg-gradient-to-br from-emerald-500 to-cyan-500" 
                          : "bg-gradient-to-br from-purple-500 to-pink-500"
                        } 
                      />
                    </motion.div>
                  ))}
                </div>
              </>
            ) : (
              <Card className="border-dashed">
                <CardContent className="p-12 text-center">
                  <Search className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Nenhum modelo encontrado</h3>
                  <p className="text-muted-foreground">
                    {searchQuery ? "Tente buscar com outros termos" : "Novos modelos serão adicionados em breve"}
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="ia" className="space-y-6">
            {filterModels(iaModels).length > 0 ? (
              <>
                <p className="text-sm text-muted-foreground">{filterModels(iaModels).length} modelo(s) IA encontrado(s)</p>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filterModels(iaModels).map((model, i) => (
                    <motion.div 
                      key={model.id} 
                      initial={{ opacity: 0, y: 20 }} 
                      animate={{ opacity: 1, y: 0 }} 
                      transition={{ delay: i * 0.05 }}
                    >
                      <ModelCard model={model} gradient="bg-gradient-to-br from-emerald-500 to-cyan-500" />
                    </motion.div>
                  ))}
                </div>
              </>
            ) : (
              <Card className="border-dashed">
                <CardContent className="p-12 text-center">
                  <Sparkles className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Nenhum modelo IA disponível</h3>
                  <p className="text-muted-foreground">
                    Novos modelos serão adicionados em breve.
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="black" className="space-y-6">
            <Card className="border-pink-500/30 bg-gradient-to-r from-pink-500/10 via-purple-500/10 to-pink-500/10">
              <CardContent className="p-4 flex items-start gap-3">
                <div className="p-2 rounded-full bg-gradient-to-r from-pink-500 to-purple-500">
                  <Flame className="w-5 h-5 text-white" />
                </div>
                <div className="text-sm">
                  <p className="font-semibold bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent">Modelos Exclusivos</p>
                  <p className="text-muted-foreground mt-1">Deslize para a direita para comprar ou esquerda para pular. Estratégias premium para resultados extraordinários.</p>
                </div>
              </CardContent>
            </Card>

            {filteredBlackModels.length > 0 ? (
              <div className="flex flex-col items-center">
                {/* Navigation dots */}
                <div className="flex gap-2 mb-4">
                  {filteredBlackModels.map((_, idx) => (
                    <button
                      key={idx}
                      className={cn(
                        "w-2 h-2 rounded-full transition-all",
                        idx === currentBlackIndex 
                          ? "w-6 bg-gradient-to-r from-pink-500 to-purple-500" 
                          : "bg-muted-foreground/30 hover:bg-muted-foreground/50"
                      )}
                      onClick={() => setCurrentBlackIndex(idx)}
                    />
                  ))}
                </div>
                
                {/* Tinder-style card container */}
                <div className="relative w-full max-w-md h-[600px] mx-auto">
                  <AnimatePresence mode="wait">
                    {currentBlackModel && (
                      <TinderCard key={currentBlackModel.id} model={currentBlackModel} />
                    )}
                  </AnimatePresence>
                </div>
                
                {/* Counter */}
                <p className="text-sm text-muted-foreground mt-4">
                  {currentBlackIndex + 1} de {filteredBlackModels.length} modelos
                </p>
              </div>
            ) : (
              <Card className="border-dashed">
                <CardContent className="p-12 text-center">
                  <Flame className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Nenhum modelo Black disponível</h3>
                  <p className="text-muted-foreground">
                    Novos modelos serão adicionados em breve.
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default ModelHubPage;