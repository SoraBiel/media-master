import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  MessageCircle,
  Plus,
  Settings,
  FileText,
  Trash2,
  ExternalLink,
  Copy,
  CheckCircle,
  AlertCircle,
  Loader2,
  Phone,
  Building2,
  Link2,
  HelpCircle,
  ArrowRight,
  Zap,
  Facebook,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Textarea } from "@/components/ui/textarea";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useWhatsAppIntegration, WppAccount } from "@/hooks/useWhatsAppIntegration";
import { useToast } from "@/hooks/use-toast";
import { useSubscription } from "@/hooks/useSubscription";

declare global {
  interface Window {
    FB: any;
    fbAsyncInit: () => void;
  }
}

const WhatsAppPage = () => {
  const navigate = useNavigate();
  const {
    accounts,
    templates,
    selectedAccount,
    isLoading,
    isValidating,
    setSelectedAccount,
    connectAccount,
    disconnectAccount,
    createTemplate,
    deleteTemplate,
    getWebhookUrl,
  } = useWhatsAppIntegration();
  const { toast } = useToast();
  const { hasActiveSubscription, currentPlan } = useSubscription();

  const [isTemplateDialogOpen, setIsTemplateDialogOpen] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [templateForm, setTemplateForm] = useState({
    name: "",
    category: "UTILITY",
    bodyText: "",
  });

  // Load Facebook SDK
  useEffect(() => {
    // Only load if not already present
    if (window.FB) return;

    const script = document.createElement("script");
    script.src = "https://connect.facebook.net/en_US/sdk.js";
    script.async = true;
    script.defer = true;
    script.crossOrigin = "anonymous";
    document.body.appendChild(script);

    window.fbAsyncInit = function () {
      window.FB.init({
        appId: "YOUR_FACEBOOK_APP_ID", // This needs to be configured
        cookie: true,
        xfbml: true,
        version: "v18.0",
      });
    };
  }, []);

  const handleEmbeddedSignup = () => {
    if (!window.FB) {
      toast({
        title: "Erro",
        description: "Facebook SDK não carregado. Tente novamente.",
        variant: "destructive",
      });
      return;
    }

    setIsConnecting(true);

    window.FB.login(
      function (response: any) {
        if (response.authResponse) {
          const code = response.authResponse.code;
          // Exchange code for tokens via backend
          handleCodeExchange(code);
        } else {
          setIsConnecting(false);
          toast({
            title: "Conexão cancelada",
            description: "Você cancelou a conexão com o WhatsApp.",
            variant: "default",
          });
        }
      },
      {
        config_id: "YOUR_CONFIG_ID", // This needs to be configured in Meta dashboard
        response_type: "code",
        override_default_response_type: true,
        extras: {
          setup: {},
          featureType: "",
          sessionInfoVersion: "2",
        },
      }
    );
  };

  const handleCodeExchange = async (code: string) => {
    try {
      // TODO: Call backend edge function to exchange code for tokens
      // For now, show a placeholder message
      toast({
        title: "Embedded Signup",
        description: "Configure o App ID e Config ID da Meta para usar o login com Facebook.",
        variant: "default",
      });
      setIsConnecting(false);
    } catch (error) {
      console.error("Error exchanging code:", error);
      setIsConnecting(false);
      toast({
        title: "Erro",
        description: "Falha ao conectar WhatsApp. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  const handleCreateTemplate = async () => {
    if (!selectedAccount || !templateForm.name || !templateForm.bodyText) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha todos os campos",
        variant: "destructive",
      });
      return;
    }

    const components = [
      {
        type: "BODY",
        text: templateForm.bodyText,
      },
    ];

    const result = await createTemplate(
      selectedAccount.id,
      templateForm.name,
      templateForm.category,
      components
    );

    if (result) {
      setIsTemplateDialogOpen(false);
      setTemplateForm({ name: "", category: "UTILITY", bodyText: "" });
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copiado!" });
  };

  const handleCreateFunnel = () => {
    navigate("/funnels?channel=wpp&create=true");
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <MessageCircle className="w-7 h-7 text-success" />
              WhatsApp Business
            </h1>
            <p className="text-muted-foreground">
              Conecte sua conta WhatsApp Business e crie funis automáticos
            </p>
          </div>
        </div>

        {accounts.length === 0 ? (
          <Card className="glass-card">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <motion.div 
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="w-24 h-24 rounded-full bg-success/20 flex items-center justify-center mb-6"
              >
                <MessageCircle className="w-12 h-12 text-success" />
              </motion.div>
              
              <h3 className="text-2xl font-bold mb-2">Conecte seu WhatsApp</h3>
              <p className="text-muted-foreground text-center max-w-lg mb-8">
                Conecte sua conta WhatsApp Business em poucos passos e comece a criar funis automáticos para atender seus clientes 24/7.
              </p>

              <div className="grid gap-4 md:grid-cols-3 w-full max-w-3xl mb-8">
                <div className="flex flex-col items-center text-center p-4">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mb-2">
                    <Facebook className="w-5 h-5 text-primary" />
                  </div>
                  <h4 className="font-medium">1. Login com Facebook</h4>
                  <p className="text-sm text-muted-foreground">Faça login com sua conta do Facebook</p>
                </div>
                <div className="flex flex-col items-center text-center p-4">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mb-2">
                    <Building2 className="w-5 h-5 text-primary" />
                  </div>
                  <h4 className="font-medium">2. Selecione o Business</h4>
                  <p className="text-sm text-muted-foreground">Escolha ou crie seu Business Account</p>
                </div>
                <div className="flex flex-col items-center text-center p-4">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mb-2">
                    <Phone className="w-5 h-5 text-primary" />
                  </div>
                  <h4 className="font-medium">3. Conecte o Número</h4>
                  <p className="text-sm text-muted-foreground">Adicione e verifique seu número</p>
                </div>
              </div>

              <Button 
                size="lg" 
                onClick={handleEmbeddedSignup}
                disabled={isConnecting}
                className="bg-[#1877F2] hover:bg-[#166FE5] text-white gap-2"
              >
                {isConnecting ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Facebook className="w-5 h-5" />
                )}
                Conectar com Facebook
              </Button>

              {/* Help Section */}
              <div className="mt-8 w-full max-w-2xl">
                <Accordion type="single" collapsible className="w-full">
                  <AccordionItem value="requirements">
                    <AccordionTrigger className="text-sm">
                      <HelpCircle className="w-4 h-4 mr-2" />
                      Requisitos para conectar
                    </AccordionTrigger>
                    <AccordionContent className="text-muted-foreground text-sm space-y-4">
                      <p>Para conectar o WhatsApp Business, você precisa de:</p>
                      <ul className="list-disc list-inside ml-4 space-y-1">
                        <li>Uma conta do Facebook</li>
                        <li>Um número de telefone não registrado no WhatsApp comum</li>
                        <li>Acesso ao número para verificação via SMS ou ligação</li>
                      </ul>
                      <p className="text-xs mt-4 text-muted-foreground/70">
                        O processo é guiado pelo Facebook e leva apenas alguns minutos.
                      </p>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {/* Connected Success Card */}
            {accounts.some(a => a.is_connected) && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Card className="border-success/30 bg-success/5">
                  <CardContent className="flex items-center justify-between py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-success/20 flex items-center justify-center">
                        <CheckCircle className="w-5 h-5 text-success" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-success">WhatsApp Conectado!</h4>
                        <p className="text-sm text-muted-foreground">
                          Sua conta está pronta para receber mensagens e executar funis.
                        </p>
                      </div>
                    </div>
                    <Button onClick={handleCreateFunnel} className="gap-2">
                      <Zap className="w-4 h-4" />
                      Criar Funil no WhatsApp
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            <Tabs defaultValue="accounts" className="space-y-6">
              <TabsList>
                <TabsTrigger value="accounts">
                  <Phone className="w-4 h-4 mr-2" />
                  Contas ({accounts.length})
                </TabsTrigger>
                <TabsTrigger value="templates">
                  <FileText className="w-4 h-4 mr-2" />
                  Templates ({templates.length})
                </TabsTrigger>
                <TabsTrigger value="webhook">
                  <Link2 className="w-4 h-4 mr-2" />
                  Webhook
                </TabsTrigger>
              </TabsList>

              {/* Accounts Tab */}
              <TabsContent value="accounts">
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {accounts.map((account, index) => (
                    <motion.div
                      key={account.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <Card
                        className={`glass-card cursor-pointer transition-all ${
                          selectedAccount?.id === account.id
                            ? "border-success ring-2 ring-success/20"
                            : "hover:border-success/50"
                        }`}
                        onClick={() => setSelectedAccount(account)}
                      >
                        <CardHeader className="pb-2">
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-12 h-12 rounded-full bg-success/20 flex items-center justify-center">
                                <MessageCircle className="w-6 h-6 text-success" />
                              </div>
                              <div>
                                <CardTitle className="text-base">
                                  {account.business_name || "WhatsApp Business"}
                                </CardTitle>
                                <CardDescription>
                                  {account.phone_display || account.phone_number_id}
                                </CardDescription>
                              </div>
                            </div>
                            <Badge
                              variant={account.is_connected ? "default" : "secondary"}
                              className={account.is_connected ? "bg-success" : ""}
                            >
                              {account.is_connected ? "Conectado" : "Desconectado"}
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="flex items-center justify-between pt-2 border-t">
                            <span className="text-xs text-muted-foreground">
                              WABA: {account.waba_id.slice(0, 8)}...
                            </span>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-destructive"
                              onClick={(e) => {
                                e.stopPropagation();
                                disconnectAccount(account.id);
                              }}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}

                  {/* Add Account Card */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: accounts.length * 0.1 }}
                  >
                    <Card
                      className="glass-card cursor-pointer transition-all hover:border-primary/50 border-dashed"
                      onClick={handleEmbeddedSignup}
                    >
                      <CardContent className="flex flex-col items-center justify-center h-full min-h-[180px]">
                        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                          <Plus className="w-6 h-6 text-primary" />
                        </div>
                        <p className="font-medium">Adicionar Conta</p>
                        <p className="text-sm text-muted-foreground">Conectar novo número</p>
                      </CardContent>
                    </Card>
                  </motion.div>
                </div>
              </TabsContent>

              {/* Templates Tab */}
              <TabsContent value="templates">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">
                      Templates são mensagens pré-aprovadas pelo WhatsApp para iniciar conversas.
                    </p>
                    <Button
                      variant="outline"
                      onClick={() => setIsTemplateDialogOpen(true)}
                      disabled={!selectedAccount}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Novo Template
                    </Button>
                  </div>

                  {templates.length === 0 ? (
                    <Card className="glass-card">
                      <CardContent className="flex flex-col items-center justify-center py-12">
                        <FileText className="w-12 h-12 text-muted-foreground mb-4" />
                        <h3 className="font-semibold mb-2">Nenhum template</h3>
                        <p className="text-sm text-muted-foreground">
                          Crie templates para usar nos seus funis
                        </p>
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="grid gap-4 md:grid-cols-2">
                      {templates.map((template) => (
                        <Card key={template.id} className="glass-card">
                          <CardHeader className="pb-2">
                            <div className="flex items-start justify-between">
                              <div>
                                <CardTitle className="text-base">{template.template_name}</CardTitle>
                                <CardDescription>
                                  {template.category} • {template.language}
                                </CardDescription>
                              </div>
                              <div className="flex items-center gap-2">
                                <Badge
                                  variant={template.status === "approved" ? "default" : "secondary"}
                                >
                                  {template.status}
                                </Badge>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="text-destructive"
                                  onClick={() => deleteTemplate(template.id)}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                          </CardHeader>
                          <CardContent>
                            <div className="bg-muted/50 rounded-lg p-3 text-sm">
                              {(template.components as any[])?.find((c) => c.type === "BODY")?.text ||
                                "Sem conteúdo"}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              </TabsContent>

              {/* Webhook Tab */}
              <TabsContent value="webhook">
                {selectedAccount ? (
                  <Card className="glass-card">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Settings className="w-5 h-5" />
                        Configuração do Webhook
                      </CardTitle>
                      <CardDescription>
                        Configure esses valores no Meta for Developers para receber mensagens
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="space-y-2">
                        <Label>Callback URL</Label>
                        <div className="flex gap-2">
                          <Input
                            readOnly
                            value={getWebhookUrl(selectedAccount.id)}
                            className="font-mono text-sm"
                          />
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => copyToClipboard(getWebhookUrl(selectedAccount.id))}
                          >
                            <Copy className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label>Verify Token</Label>
                        <div className="flex gap-2">
                          <Input
                            readOnly
                            value={selectedAccount.webhook_verify_token}
                            className="font-mono text-sm"
                          />
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => copyToClipboard(selectedAccount.webhook_verify_token)}
                          >
                            <Copy className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>

                      <div className="bg-muted/50 rounded-lg p-4">
                        <h4 className="font-medium mb-2">Campos do Webhook para assinar:</h4>
                        <ul className="text-sm text-muted-foreground space-y-1">
                          <li className="flex items-center gap-2">
                            <CheckCircle className="w-4 h-4 text-success" />
                            messages
                          </li>
                          <li className="flex items-center gap-2">
                            <CheckCircle className="w-4 h-4 text-success" />
                            message_deliveries
                          </li>
                          <li className="flex items-center gap-2">
                            <CheckCircle className="w-4 h-4 text-success" />
                            message_reads
                          </li>
                        </ul>
                      </div>

                      <Button variant="outline" asChild>
                        <a
                          href="https://developers.facebook.com/docs/whatsapp/cloud-api/get-started"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <ExternalLink className="w-4 h-4 mr-2" />
                          Ver documentação do Meta
                        </a>
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                  <Card className="glass-card">
                    <CardContent className="flex flex-col items-center justify-center py-12">
                      <AlertCircle className="w-12 h-12 text-muted-foreground mb-4" />
                      <h3 className="font-semibold mb-2">Selecione uma conta</h3>
                      <p className="text-sm text-muted-foreground">
                        Selecione uma conta na aba "Contas" para ver as configurações do webhook
                      </p>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
            </Tabs>
          </div>
        )}

        {/* Template Dialog */}
        <Dialog open={isTemplateDialogOpen} onOpenChange={setIsTemplateDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Novo Template</DialogTitle>
              <DialogDescription>
                Templates precisam ser aprovados pelo WhatsApp antes de usar.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Nome do Template</Label>
                <Input
                  value={templateForm.name}
                  onChange={(e) =>
                    setTemplateForm({ ...templateForm, name: e.target.value.toLowerCase().replace(/\s/g, "_") })
                  }
                  placeholder="boas_vindas"
                />
              </div>

              <div className="space-y-2">
                <Label>Categoria</Label>
                <Select
                  value={templateForm.category}
                  onValueChange={(value) => setTemplateForm({ ...templateForm, category: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="UTILITY">Utilidade</SelectItem>
                    <SelectItem value="MARKETING">Marketing</SelectItem>
                    <SelectItem value="AUTHENTICATION">Autenticação</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Texto do Template</Label>
                <Textarea
                  value={templateForm.bodyText}
                  onChange={(e) => setTemplateForm({ ...templateForm, bodyText: e.target.value })}
                  placeholder="Olá {{1}}! Bem-vindo..."
                  rows={4}
                />
                <p className="text-xs text-muted-foreground">
                  Use {"{{1}}"}, {"{{2}}"} etc. para variáveis
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsTemplateDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleCreateTemplate}>Criar Template</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default WhatsAppPage;
