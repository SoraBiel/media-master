import { useState, useEffect } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User, Mail, Phone, Camera, Save, Loader2, Shield, Bell, Palette } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Switch } from "@/components/ui/switch";
import { motion } from "framer-motion";
import { NotificationSettings } from "@/components/NotificationSettings";

const SettingsPage = () => {
  const { profile, refreshProfile, isAdmin } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    full_name: "",
    phone: "",
    avatar_url: "",
  });

  useEffect(() => {
    if (profile) {
      setFormData({
        full_name: profile.full_name || "",
        phone: profile.phone || "",
        avatar_url: profile.avatar_url || "",
      });
    }
  }, [profile]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSaveProfile = async () => {
    if (!profile) return;

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: formData.full_name.trim(),
          phone: formData.phone.trim(),
          avatar_url: formData.avatar_url.trim(),
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", profile.user_id);

      if (error) throw error;

      await refreshProfile();
      toast({
        title: "Perfil atualizado",
        description: "Suas informações foram salvas com sucesso.",
      });
    } catch (error: any) {
      toast({
        title: "Erro ao salvar",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-4xl mx-auto">
        <div>
          <h1 className="text-2xl font-bold">Configurações</h1>
          <p className="text-muted-foreground">
            Gerencie suas preferências e informações de perfil.
          </p>
        </div>

        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 lg:w-auto lg:inline-flex">
            <TabsTrigger value="profile" className="gap-2">
              <User className="w-4 h-4" />
              <span className="hidden sm:inline">Perfil</span>
            </TabsTrigger>
            <TabsTrigger value="notifications" className="gap-2">
              <Bell className="w-4 h-4" />
              <span className="hidden sm:inline">Notificações</span>
            </TabsTrigger>
            <TabsTrigger value="appearance" className="gap-2">
              <Palette className="w-4 h-4" />
              <span className="hidden sm:inline">Aparência</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              {/* Profile Card */}
              <Card className="glass-card">
                <CardHeader>
                  <CardTitle>Informações do Perfil</CardTitle>
                  <CardDescription>
                    Atualize suas informações pessoais
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Avatar Section */}
                  <div className="flex flex-col sm:flex-row items-center gap-6">
                    <div className="relative">
                      <Avatar className="w-24 h-24 border-4 border-background shadow-lg">
                        <AvatarImage src={formData.avatar_url} />
                        <AvatarFallback className="text-2xl bg-telegram/20 text-telegram">
                          {formData.full_name ? getInitials(formData.full_name) : "?"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-telegram flex items-center justify-center cursor-pointer hover:bg-telegram/90 transition-colors">
                        <Camera className="w-4 h-4 text-white" />
                      </div>
                    </div>
                    <div className="text-center sm:text-left">
                      <h3 className="font-semibold text-lg">{formData.full_name || "Seu Nome"}</h3>
                      <p className="text-muted-foreground">{profile?.email}</p>
                      <div className="flex items-center gap-2 mt-2 justify-center sm:justify-start">
                        <span className="text-xs px-2 py-1 rounded-full bg-telegram/20 text-telegram capitalize">
                          {profile?.current_plan || "free"}
                        </span>
                        {isAdmin && (
                          <span className="text-xs px-2 py-1 rounded-full bg-yellow-500/20 text-yellow-500 flex items-center gap-1">
                            <Shield className="w-3 h-3" />
                            Admin
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Form Fields */}
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="full_name">Nome completo</Label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          id="full_name"
                          name="full_name"
                          placeholder="Seu nome"
                          value={formData.full_name}
                          onChange={handleChange}
                          className="pl-10"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          id="email"
                          type="email"
                          value={profile?.email || ""}
                          className="pl-10"
                          disabled
                        />
                      </div>
                      <p className="text-xs text-muted-foreground">
                        O email não pode ser alterado
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="phone">Telefone</Label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          id="phone"
                          name="phone"
                          placeholder="(00) 00000-0000"
                          value={formData.phone}
                          onChange={handleChange}
                          className="pl-10"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="avatar_url">URL do Avatar</Label>
                      <div className="relative">
                        <Camera className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          id="avatar_url"
                          name="avatar_url"
                          placeholder="https://..."
                          value={formData.avatar_url}
                          onChange={handleChange}
                          className="pl-10"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <Button
                      onClick={handleSaveProfile}
                      disabled={isLoading}
                      variant="gradient"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Salvando...
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4 mr-2" />
                          Salvar alterações
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Account Info */}
              <Card className="glass-card">
                <CardHeader>
                  <CardTitle>Informações da Conta</CardTitle>
                  <CardDescription>
                    Detalhes sobre sua conta e assinatura
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="p-4 rounded-lg bg-secondary/50">
                      <p className="text-sm text-muted-foreground">Plano atual</p>
                      <p className="font-semibold capitalize">{profile?.current_plan || "Free"}</p>
                    </div>
                    <div className="p-4 rounded-lg bg-secondary/50">
                      <p className="text-sm text-muted-foreground">Status</p>
                      <p className="font-semibold text-success">Ativo</p>
                    </div>
                    <div className="p-4 rounded-lg bg-secondary/50">
                      <p className="text-sm text-muted-foreground">Membro desde</p>
                      <p className="font-semibold">
                        {profile?.created_at
                          ? new Date(profile.created_at).toLocaleDateString("pt-BR")
                          : "-"}
                      </p>
                    </div>
                    <div className="p-4 rounded-lg bg-secondary/50">
                      <p className="text-sm text-muted-foreground">Último acesso</p>
                      <p className="font-semibold">
                        {profile?.last_seen_at
                          ? new Date(profile.last_seen_at).toLocaleDateString("pt-BR")
                          : "-"}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>

          <TabsContent value="notifications">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              {/* Payment Notifications - New Component */}
              <NotificationSettings />

              {/* Other Notifications */}
              <Card className="glass-card">
                <CardHeader>
                  <CardTitle>Outras Notificações</CardTitle>
                  <CardDescription>
                    Configure outras preferências de notificação
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Notificações por email</p>
                      <p className="text-sm text-muted-foreground">
                        Receba atualizações sobre suas campanhas
                      </p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Alertas de erro</p>
                      <p className="text-sm text-muted-foreground">
                        Seja notificado quando houver falhas
                      </p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Resumo semanal</p>
                      <p className="text-sm text-muted-foreground">
                        Receba um resumo da sua atividade
                      </p>
                    </div>
                    <Switch />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Novidades e promoções</p>
                      <p className="text-sm text-muted-foreground">
                        Fique por dentro de novas funcionalidades
                      </p>
                    </div>
                    <Switch />
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>

          <TabsContent value="appearance">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card className="glass-card">
                <CardHeader>
                  <CardTitle>Aparência</CardTitle>
                  <CardDescription>
                    Personalize a aparência do aplicativo
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <p className="font-medium mb-4">Tema</p>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="p-4 rounded-lg border-2 border-telegram bg-secondary/50 cursor-pointer text-center">
                        <div className="w-full h-8 rounded bg-background mb-2" />
                        <p className="text-sm font-medium">Escuro</p>
                      </div>
                      <div className="p-4 rounded-lg border border-border bg-secondary/50 cursor-pointer text-center opacity-50">
                        <div className="w-full h-8 rounded bg-white mb-2" />
                        <p className="text-sm font-medium">Claro</p>
                        <p className="text-xs text-muted-foreground">Em breve</p>
                      </div>
                      <div className="p-4 rounded-lg border border-border bg-secondary/50 cursor-pointer text-center opacity-50">
                        <div className="w-full h-8 rounded bg-gradient-to-r from-background to-white mb-2" />
                        <p className="text-sm font-medium">Sistema</p>
                        <p className="text-xs text-muted-foreground">Em breve</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Animações</p>
                      <p className="text-sm text-muted-foreground">
                        Habilitar animações na interface
                      </p>
                    </div>
                    <Switch defaultChecked />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Menu compacto</p>
                      <p className="text-sm text-muted-foreground">
                        Manter menu lateral recolhido
                      </p>
                    </div>
                    <Switch />
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default SettingsPage;