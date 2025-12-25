import { useState } from "react";
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

const WhatsAppPage = () => {
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

  const [isConnectDialogOpen, setIsConnectDialogOpen] = useState(false);
  const [isTemplateDialogOpen, setIsTemplateDialogOpen] = useState(false);
  const [connectForm, setConnectForm] = useState({
    wabaId: "",
    phoneNumberId: "",
    accessToken: "",
    businessName: "",
  });
  const [templateForm, setTemplateForm] = useState({
    name: "",
    category: "UTILITY",
    bodyText: "",
  });

  const handleConnect = async () => {
    if (!connectForm.wabaId || !connectForm.phoneNumberId || !connectForm.accessToken) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha todos os campos",
        variant: "destructive",
      });
      return;
    }

    const result = await connectAccount(
      connectForm.wabaId,
      connectForm.phoneNumberId,
      connectForm.accessToken,
      connectForm.businessName
    );

    if (result) {
      setIsConnectDialogOpen(false);
      setConnectForm({ wabaId: "", phoneNumberId: "", accessToken: "", businessName: "" });
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
          <Button variant="gradient" onClick={() => setIsConnectDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Conectar Conta
          </Button>
        </div>

        {accounts.length === 0 ? (
          <Card className="glass-card">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <div className="w-20 h-20 rounded-full bg-success/20 flex items-center justify-center mb-6">
                <MessageCircle className="w-10 h-10 text-success" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Nenhuma conta conectada</h3>
              <p className="text-muted-foreground text-center max-w-md mb-6">
                Conecte sua conta WhatsApp Business para começar a criar funis e automatizar suas conversas.
              </p>
              <Button variant="gradient" onClick={() => setIsConnectDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Conectar WhatsApp
              </Button>

              {/* Help Section */}
              <div className="mt-8 w-full max-w-2xl">
                <Accordion type="single" collapsible className="w-full">
                  <AccordionItem value="how-to">
                    <AccordionTrigger className="text-sm">
                      <HelpCircle className="w-4 h-4 mr-2" />
                      Como obter as credenciais?
                    </AccordionTrigger>
                    <AccordionContent className="text-muted-foreground text-sm space-y-4">
                      <p>
                        <strong>1.</strong> Acesse o{" "}
                        <a
                          href="https://developers.facebook.com"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary underline"
                        >
                          Meta for Developers
                        </a>
                      </p>
                      <p>
                        <strong>2.</strong> Crie um aplicativo do tipo "Business" e adicione o produto "WhatsApp"
                      </p>
                      <p>
                        <strong>3.</strong> No painel do WhatsApp, você encontrará:
                      </p>
                      <ul className="list-disc list-inside ml-4 space-y-1">
                        <li><strong>WABA ID:</strong> ID da conta WhatsApp Business</li>
                        <li><strong>Phone Number ID:</strong> ID do número de telefone</li>
                        <li><strong>Access Token:</strong> Token de acesso permanente</li>
                      </ul>
                      <p>
                        <strong>4.</strong> Configure o Webhook apontando para a URL que forneceremos
                      </p>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </div>
            </CardContent>
          </Card>
        ) : (
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
                    <p className="text-muted-foreground">
                      Selecione uma conta para ver as configurações do webhook
                    </p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        )}
      </div>

      {/* Connect Dialog */}
      <Dialog open={isConnectDialogOpen} onOpenChange={setIsConnectDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageCircle className="w-5 h-5 text-success" />
              Conectar WhatsApp Business
            </DialogTitle>
            <DialogDescription>
              Insira as credenciais da sua conta WhatsApp Business API
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="businessName">Nome do Negócio (opcional)</Label>
              <Input
                id="businessName"
                placeholder="Minha Empresa"
                value={connectForm.businessName}
                onChange={(e) =>
                  setConnectForm({ ...connectForm, businessName: e.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="wabaId">WABA ID *</Label>
              <Input
                id="wabaId"
                placeholder="1234567890123456"
                value={connectForm.wabaId}
                onChange={(e) => setConnectForm({ ...connectForm, wabaId: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phoneNumberId">Phone Number ID *</Label>
              <Input
                id="phoneNumberId"
                placeholder="1234567890123456"
                value={connectForm.phoneNumberId}
                onChange={(e) =>
                  setConnectForm({ ...connectForm, phoneNumberId: e.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="accessToken">Access Token *</Label>
              <Textarea
                id="accessToken"
                placeholder="EAAxxxxxxxxx..."
                rows={3}
                value={connectForm.accessToken}
                onChange={(e) =>
                  setConnectForm({ ...connectForm, accessToken: e.target.value })
                }
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsConnectDialogOpen(false)}>
              Cancelar
            </Button>
            <Button variant="gradient" onClick={handleConnect} disabled={isValidating}>
              {isValidating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Validando...
                </>
              ) : (
                "Conectar"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Template Dialog */}
      <Dialog open={isTemplateDialogOpen} onOpenChange={setIsTemplateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Novo Template</DialogTitle>
            <DialogDescription>
              Crie um template para usar nos funis do WhatsApp
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="templateName">Nome do Template *</Label>
              <Input
                id="templateName"
                placeholder="welcome_message"
                value={templateForm.name}
                onChange={(e) =>
                  setTemplateForm({ ...templateForm, name: e.target.value.toLowerCase().replace(/\s/g, "_") })
                }
              />
              <p className="text-xs text-muted-foreground">
                Apenas letras minúsculas, números e underscores
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="templateCategory">Categoria</Label>
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
              <Label htmlFor="bodyText">Texto da Mensagem *</Label>
              <Textarea
                id="bodyText"
                placeholder="Olá {{1}}! Seja bem-vindo..."
                rows={4}
                value={templateForm.bodyText}
                onChange={(e) => setTemplateForm({ ...templateForm, bodyText: e.target.value })}
              />
              <p className="text-xs text-muted-foreground">
                Use {"{{1}}"}, {"{{2}}"}, etc. para variáveis
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsTemplateDialogOpen(false)}>
              Cancelar
            </Button>
            <Button variant="gradient" onClick={handleCreateTemplate}>
              Criar Template
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default WhatsAppPage;
