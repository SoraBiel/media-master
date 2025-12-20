import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sparkles, Zap, Users, MessageSquare, Calendar, Image, ArrowRight, AlertTriangle, CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";

const ModelHubPage = () => {
  const iaModels = [
    { id: 1, name: "Luna Digital", niche: "Lifestyle", lang: "PT-BR", followers: "50k+", status: "active" },
    { id: 2, name: "Sofia Tech", niche: "Tech Reviews", lang: "PT-BR", followers: "30k+", status: "active" },
    { id: 3, name: "Nina Fitness", niche: "Fitness", lang: "EN", followers: "100k+", status: "coming" },
  ];

  const blackModels = [
    { id: 1, name: "Funil Agressivo", type: "Conversão", difficulty: "Avançado" },
    { id: 2, name: "Escassez & Urgência", type: "Vendas", difficulty: "Intermediário" },
    { id: 3, name: "Sequência DM", type: "Engajamento", difficulty: "Iniciante" },
  ];

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
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {iaModels.map((model, i) => (
                <motion.div key={model.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
                  <Card className="glass-card h-full">
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div className="w-12 h-12 rounded-xl telegram-gradient flex items-center justify-center"><Users className="w-6 h-6 text-white" /></div>
                        <Badge variant={model.status === "active" ? "default" : "secondary"}>{model.status === "active" ? "Disponível" : "Em breve"}</Badge>
                      </div>
                      <CardTitle className="mt-4">{model.name}</CardTitle>
                      <CardDescription>{model.niche} • {model.lang} • {model.followers} seguidores</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex flex-wrap gap-2">
                        <Badge variant="secondary"><Image className="w-3 h-3 mr-1" />Assets</Badge>
                        <Badge variant="secondary"><MessageSquare className="w-3 h-3 mr-1" />Scripts</Badge>
                        <Badge variant="secondary"><Calendar className="w-3 h-3 mr-1" />Calendário</Badge>
                      </div>
                      <Button variant="gradient" className="w-full" disabled={model.status !== "active"}>
                        Usar Modelo<ArrowRight className="w-4 h-4 ml-1" />
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
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

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {blackModels.map((model, i) => (
                <motion.div key={model.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
                  <Card className="glass-card h-full">
                    <CardHeader>
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center"><Zap className="w-6 h-6 text-white" /></div>
                      <CardTitle className="mt-4">{model.name}</CardTitle>
                      <CardDescription>{model.type} • {model.difficulty}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <ul className="text-sm space-y-2">
                        <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-success" />Templates prontos</li>
                        <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-success" />Roteiros de funil</li>
                        <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-success" />Checklist operacional</li>
                      </ul>
                      <Button variant="outline" className="w-full">Ver Detalhes<ArrowRight className="w-4 h-4 ml-1" /></Button>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default ModelHubPage;
