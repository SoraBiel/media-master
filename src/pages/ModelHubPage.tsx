import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sparkles, Zap, Users, MessageSquare, Calendar, Image, ArrowRight, AlertTriangle, CheckCircle2, RefreshCw } from "lucide-react";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface Model {
  id: string;
  name: string;
  bio: string | null;
  niche: string | null;
  category: string | null;
  price_cents: number;
  is_sold: boolean;
  image_url: string | null;
}

const ModelHubPage = () => {
  const [models, setModels] = useState<Model[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchModels = async () => {
    try {
      const { data, error } = await supabase
        .from("models_for_sale")
        .select("*")
        .eq("is_sold", false)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setModels(data || []);
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
        <div>
          <h1 className="text-2xl font-bold">Model Hub</h1>
          <p className="text-muted-foreground">Templates e estratégias prontas para suas campanhas.</p>
        </div>

        <Tabs defaultValue="ia" className="space-y-6">
          <TabsList className="bg-secondary">
            <TabsTrigger value="ia" className="gap-2"><Sparkles className="w-4 h-4" />Modelos IA</TabsTrigger>
            <TabsTrigger value="black" className="gap-2"><Zap className="w-4 h-4" />Modelos Black</TabsTrigger>
          </TabsList>

          <TabsContent value="ia" className="space-y-6">
            {iaModels.length > 0 ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {iaModels.map((model, i) => (
                  <motion.div key={model.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
                    <Card className="glass-card h-full">
                      <CardHeader>
                        <div className="flex justify-between items-start">
                          <div className="w-12 h-12 rounded-xl telegram-gradient flex items-center justify-center">
                            <Users className="w-6 h-6 text-white" />
                          </div>
                          <Badge variant="default">{formatPrice(model.price_cents)}</Badge>
                        </div>
                        <CardTitle className="mt-4">{model.name}</CardTitle>
                        <CardDescription>{model.niche || "Sem nicho definido"}</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {model.bio && (
                          <p className="text-sm text-muted-foreground">{model.bio}</p>
                        )}
                        <div className="flex flex-wrap gap-2">
                          <Badge variant="secondary"><Image className="w-3 h-3 mr-1" />Assets</Badge>
                          <Badge variant="secondary"><MessageSquare className="w-3 h-3 mr-1" />Scripts</Badge>
                          <Badge variant="secondary"><Calendar className="w-3 h-3 mr-1" />Calendário</Badge>
                        </div>
                        <Button variant="gradient" className="w-full">
                          Comprar<ArrowRight className="w-4 h-4 ml-1" />
                        </Button>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            ) : (
              <Card className="glass-card">
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
            <Card className="border-warning/30 bg-warning/5">
              <CardContent className="p-4 flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-warning mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-warning">Aviso de Compliance</p>
                  <p className="text-muted-foreground mt-1">Estratégias agressivas devem ser usadas dentro dos limites legais e éticos. Respeite as políticas do Telegram.</p>
                </div>
              </CardContent>
            </Card>

            {blackModels.length > 0 ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {blackModels.map((model, i) => (
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
                        {model.bio && (
                          <p className="text-sm text-muted-foreground">{model.bio}</p>
                        )}
                        <ul className="text-sm space-y-2">
                          <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-success" />Templates prontos</li>
                          <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-success" />Roteiros de funil</li>
                          <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-success" />Checklist operacional</li>
                        </ul>
                        <Button variant="gradient" className="w-full">
                          Comprar<ArrowRight className="w-4 h-4 ml-1" />
                        </Button>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            ) : (
              <Card className="glass-card">
                <CardContent className="p-12 text-center">
                  <Zap className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
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