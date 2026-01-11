import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Database,
  Server,
  Webhook,
  Key,
  Save,
  RefreshCw,
  Copy,
  ExternalLink,
  AlertTriangle,
  CheckCircle2,
  BookOpen,
  Code,
  FileCode,
  Layers,
  Settings,
  Globe,
  Shield,
  Zap,
} from "lucide-react";

interface SystemConfig {
  key: string;
  value: string;
  description: string;
  category: "database" | "vps" | "webhook" | "api" | "general";
  isSecret?: boolean;
}

const CONFIG_DEFINITIONS: Omit<SystemConfig, "value">[] = [
  // Database
  { key: "SUPABASE_URL", description: "URL do projeto Supabase (Lovable Cloud)", category: "database" },
  { key: "SUPABASE_ANON_KEY", description: "Chave pública anônima do Supabase", category: "database" },
  { key: "SUPABASE_PROJECT_ID", description: "ID do projeto Supabase", category: "database" },
  
  // Webhooks
  { key: "TELEGRAM_BOT_WEBHOOK_URL", description: "URL do webhook para bots Telegram", category: "webhook" },
  { key: "MERCADOPAGO_WEBHOOK_URL", description: "URL do webhook para notificações do MercadoPago", category: "webhook" },
  { key: "PAYMENT_WEBHOOK_URL", description: "URL do webhook para confirmações de pagamento", category: "webhook" },
  { key: "FUNNEL_WEBHOOK_URL", description: "URL do webhook para eventos de funil", category: "webhook" },
  
  // VPS / External
  { key: "EXTERNAL_API_BASE_URL", description: "URL base para API externa (se usar VPS)", category: "vps" },
  { key: "VPS_HOST", description: "Endereço IP ou hostname da VPS", category: "vps" },
  
  // API Keys
  { key: "MERCADOPAGO_ACCESS_TOKEN", description: "Token de acesso do MercadoPago", category: "api", isSecret: true },
  { key: "UTMIFY_API_KEY", description: "Chave da API Utmify para tracking", category: "api", isSecret: true },
  
  // General
  { key: "smart_link_base_url", description: "URL base para os Smart Links públicos", category: "general" },
  { key: "APP_BASE_URL", description: "URL base da aplicação (ex: https://seuapp.com)", category: "general" },
];

const CATEGORY_LABELS = {
  database: { label: "Banco de Dados", icon: Database, color: "text-blue-500" },
  vps: { label: "VPS / Servidor", icon: Server, color: "text-purple-500" },
  webhook: { label: "Webhooks", icon: Webhook, color: "text-green-500" },
  api: { label: "Chaves de API", icon: Key, color: "text-yellow-500" },
  general: { label: "Geral", icon: Globe, color: "text-gray-500" },
};

const AdminSystemConfigPanel = () => {
  const [configs, setConfigs] = useState<SystemConfig[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [editedValues, setEditedValues] = useState<Record<string, string>>({});
  const { toast } = useToast();

  // Get base URL from environment
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseProjectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;

  useEffect(() => {
    fetchConfigs();
  }, []);

  const fetchConfigs = async () => {
    setIsLoading(true);
    try {
      // Fetch from admin_text_settings table
      const { data, error } = await supabase
        .from("admin_text_settings")
        .select("*");

      if (error) throw error;

      // Build config list with values from DB
      const configMap = new Map(data?.map((d) => [d.setting_key, d.setting_value]) || []);
      
      const fullConfigs: SystemConfig[] = CONFIG_DEFINITIONS.map((def) => ({
        ...def,
        value: configMap.get(def.key) || getDefaultValue(def.key),
      }));

      setConfigs(fullConfigs);
      
      // Initialize edited values
      const initial: Record<string, string> = {};
      fullConfigs.forEach((c) => {
        initial[c.key] = c.value;
      });
      setEditedValues(initial);
    } catch (error) {
      console.error("Error fetching configs:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const getDefaultValue = (key: string): string => {
    switch (key) {
      case "SUPABASE_URL":
        return supabaseUrl || "";
      case "SUPABASE_PROJECT_ID":
        return supabaseProjectId || "";
      case "SUPABASE_ANON_KEY":
        return import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || "";
      case "TELEGRAM_BOT_WEBHOOK_URL":
        return `${supabaseUrl}/functions/v1/telegram-bot`;
      case "MERCADOPAGO_WEBHOOK_URL":
        return `${supabaseUrl}/functions/v1/mercadopago-webhook`;
      case "PAYMENT_WEBHOOK_URL":
        return `${supabaseUrl}/functions/v1/payment-webhook`;
      case "FUNNEL_WEBHOOK_URL":
        return `${supabaseUrl}/functions/v1/funnel-webhook`;
      case "APP_BASE_URL":
        return window.location.origin;
      default:
        return "";
    }
  };

  const handleSave = async (key: string) => {
    setIsSaving(true);
    try {
      const { data: existing } = await supabase
        .from("admin_text_settings")
        .select("id")
        .eq("setting_key", key)
        .single();

      if (existing) {
        await supabase
          .from("admin_text_settings")
          .update({ 
            setting_value: editedValues[key],
            updated_at: new Date().toISOString(),
          })
          .eq("setting_key", key);
      } else {
        await supabase
          .from("admin_text_settings")
          .insert({
            setting_key: key,
            setting_value: editedValues[key],
            description: CONFIG_DEFINITIONS.find((c) => c.key === key)?.description || "",
          });
      }

      toast({ title: "Configuração salva!", description: `${key} atualizado com sucesso.` });
      fetchConfigs();
    } catch (error: any) {
      toast({ title: "Erro ao salvar", description: error.message, variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCopy = (value: string) => {
    navigator.clipboard.writeText(value);
    toast({ title: "Copiado!", description: "Valor copiado para a área de transferência." });
  };

  const groupedConfigs = configs.reduce((acc, config) => {
    if (!acc[config.category]) {
      acc[config.category] = [];
    }
    acc[config.category].push(config);
    return acc;
  }, {} as Record<string, SystemConfig[]>);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="config" className="space-y-4">
        <TabsList>
          <TabsTrigger value="config" className="gap-2">
            <Settings className="w-4 h-4" />
            Configurações
          </TabsTrigger>
          <TabsTrigger value="docs" className="gap-2">
            <BookOpen className="w-4 h-4" />
            Documentação
          </TabsTrigger>
          <TabsTrigger value="migration" className="gap-2">
            <Database className="w-4 h-4" />
            Migração
          </TabsTrigger>
        </TabsList>

        {/* Configurações Tab */}
        <TabsContent value="config" className="space-y-6">
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Atenção</AlertTitle>
            <AlertDescription>
              Alterações nestas configurações afetam todo o sistema. Salve os valores atuais antes de modificar.
            </AlertDescription>
          </Alert>

          {Object.entries(CATEGORY_LABELS).map(([category, { label, icon: Icon, color }]) => {
            const categoryConfigs = groupedConfigs[category] || [];
            if (categoryConfigs.length === 0) return null;

            return (
              <Card key={category}>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Icon className={`w-5 h-5 ${color}`} />
                    {label}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {categoryConfigs.map((config) => (
                    <div key={config.key} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label className="text-sm font-medium">{config.key}</Label>
                        {config.isSecret && (
                          <Badge variant="secondary" className="text-xs">
                            <Shield className="w-3 h-3 mr-1" />
                            Secreto
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">{config.description}</p>
                      <div className="flex gap-2">
                        <Input
                          type={config.isSecret ? "password" : "text"}
                          value={editedValues[config.key] || ""}
                          onChange={(e) =>
                            setEditedValues((prev) => ({ ...prev, [config.key]: e.target.value }))
                          }
                          className="font-mono text-sm"
                        />
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handleCopy(editedValues[config.key] || "")}
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="default"
                          size="icon"
                          onClick={() => handleSave(config.key)}
                          disabled={isSaving}
                        >
                          <Save className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            );
          })}
        </TabsContent>

        {/* Documentação Tab */}
        <TabsContent value="docs" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="w-5 h-5" />
                Documentação do Sistema
              </CardTitle>
              <CardDescription>
                Guia completo de configuração e integração
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="architecture">
                  <AccordionTrigger className="text-left">
                    <div className="flex items-center gap-2">
                      <Layers className="w-4 h-4" />
                      Arquitetura do Sistema
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="prose prose-sm dark:prose-invert">
                    <p>O sistema utiliza a seguinte arquitetura:</p>
                    <ul>
                      <li><strong>Frontend:</strong> React + Vite + TypeScript + Tailwind CSS</li>
                      <li><strong>Backend:</strong> Lovable Cloud (Supabase) - PostgreSQL + Edge Functions</li>
                      <li><strong>Autenticação:</strong> Supabase Auth com suporte a email/senha</li>
                      <li><strong>Storage:</strong> Supabase Storage para arquivos de mídia</li>
                      <li><strong>Realtime:</strong> Supabase Realtime para atualizações em tempo real</li>
                    </ul>
                    <p className="text-sm text-muted-foreground mt-4">
                      <strong>URL do Projeto:</strong> {supabaseUrl}
                    </p>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="webhooks">
                  <AccordionTrigger className="text-left">
                    <div className="flex items-center gap-2">
                      <Webhook className="w-4 h-4" />
                      Configurando Webhooks
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="space-y-4">
                    <div className="space-y-3">
                      <h4 className="font-semibold">Telegram Bot Webhook</h4>
                      <p className="text-sm text-muted-foreground">
                        Para configurar o webhook do Telegram, use o seguinte padrão de URL:
                      </p>
                      <code className="block bg-muted p-2 rounded text-xs break-all">
                        {supabaseUrl}/functions/v1/telegram-bot
                      </code>
                      <p className="text-sm text-muted-foreground">
                        Configure no BotFather ou pela API do Telegram:
                      </p>
                      <code className="block bg-muted p-2 rounded text-xs break-all">
                        https://api.telegram.org/bot&lt;TOKEN&gt;/setWebhook?url={supabaseUrl}/functions/v1/telegram-bot
                      </code>
                    </div>
                    
                    <Separator />
                    
                    <div className="space-y-3">
                      <h4 className="font-semibold">MercadoPago Webhook</h4>
                      <p className="text-sm text-muted-foreground">
                        Configure no painel do MercadoPago em Configurações &gt; Webhooks:
                      </p>
                      <code className="block bg-muted p-2 rounded text-xs break-all">
                        {supabaseUrl}/functions/v1/mercadopago-webhook
                      </code>
                      <ul className="text-sm list-disc list-inside text-muted-foreground">
                        <li>Eventos: payment.created, payment.updated</li>
                        <li>Modo: Produção ou Sandbox</li>
                      </ul>
                    </div>
                    
                    <Separator />
                    
                    <div className="space-y-3">
                      <h4 className="font-semibold">Webhook de Pagamentos</h4>
                      <p className="text-sm text-muted-foreground">
                        Para integrações de pagamento genéricas:
                      </p>
                      <code className="block bg-muted p-2 rounded text-xs break-all">
                        {supabaseUrl}/functions/v1/payment-webhook
                      </code>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="edge-functions">
                  <AccordionTrigger className="text-left">
                    <div className="flex items-center gap-2">
                      <Zap className="w-4 h-4" />
                      Edge Functions
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      Lista de Edge Functions disponíveis no sistema:
                    </p>
                    <div className="grid gap-2">
                      {[
                        { name: "telegram-bot", desc: "Processa mensagens do Telegram", auth: true },
                        { name: "create-payment", desc: "Cria pagamentos PIX", auth: true },
                        { name: "payment-webhook", desc: "Recebe notificações de pagamento", auth: false },
                        { name: "mercadopago-webhook", desc: "Webhook do MercadoPago", auth: false },
                        { name: "mercadopago-oauth", desc: "OAuth do MercadoPago", auth: true },
                        { name: "funnel-webhook", desc: "Processa eventos de funil", auth: false },
                        { name: "campaign-dispatch", desc: "Dispara campanhas", auth: true },
                        { name: "social-post", desc: "Publica em redes sociais", auth: true },
                      ].map((fn) => (
                        <div key={fn.name} className="flex items-center justify-between p-2 bg-muted/50 rounded">
                          <div>
                            <code className="text-sm font-medium">{fn.name}</code>
                            <p className="text-xs text-muted-foreground">{fn.desc}</p>
                          </div>
                          <Badge variant={fn.auth ? "default" : "secondary"}>
                            {fn.auth ? "Auth" : "Public"}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="database">
                  <AccordionTrigger className="text-left">
                    <div className="flex items-center gap-2">
                      <Database className="w-4 h-4" />
                      Estrutura do Banco de Dados
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      Principais tabelas do sistema:
                    </p>
                    <div className="grid gap-2 text-sm">
                      {[
                        { name: "profiles", desc: "Perfis de usuários" },
                        { name: "subscriptions", desc: "Assinaturas ativas" },
                        { name: "transactions", desc: "Transações de pagamento" },
                        { name: "funnels", desc: "Funis de vendas" },
                        { name: "funnel_nodes", desc: "Nós dos funis" },
                        { name: "funnel_products", desc: "Produtos dos funis" },
                        { name: "funnel_payments", desc: "Pagamentos via funil" },
                        { name: "telegram_integrations", desc: "Bots do Telegram" },
                        { name: "telegram_sessions", desc: "Sessões de leads" },
                        { name: "campaigns", desc: "Campanhas de disparo" },
                        { name: "destinations", desc: "Destinos de campanhas" },
                        { name: "smart_link_pages", desc: "Páginas de Smart Links" },
                        { name: "admin_settings", desc: "Configurações booleanas" },
                        { name: "admin_text_settings", desc: "Configurações de texto" },
                      ].map((table) => (
                        <div key={table.name} className="flex items-center justify-between p-2 bg-muted/50 rounded">
                          <code className="font-medium">{table.name}</code>
                          <span className="text-muted-foreground">{table.desc}</span>
                        </div>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="env-vars">
                  <AccordionTrigger className="text-left">
                    <div className="flex items-center gap-2">
                      <FileCode className="w-4 h-4" />
                      Variáveis de Ambiente
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      Variáveis disponíveis no frontend (prefixo VITE_):
                    </p>
                    <div className="space-y-2">
                      <div className="p-2 bg-muted/50 rounded">
                        <code className="text-sm font-medium">VITE_SUPABASE_URL</code>
                        <p className="text-xs text-muted-foreground">URL do projeto Supabase</p>
                      </div>
                      <div className="p-2 bg-muted/50 rounded">
                        <code className="text-sm font-medium">VITE_SUPABASE_PUBLISHABLE_KEY</code>
                        <p className="text-xs text-muted-foreground">Chave anônima pública</p>
                      </div>
                      <div className="p-2 bg-muted/50 rounded">
                        <code className="text-sm font-medium">VITE_SUPABASE_PROJECT_ID</code>
                        <p className="text-xs text-muted-foreground">ID do projeto</p>
                      </div>
                    </div>
                    
                    <Separator />
                    
                    <p className="text-sm text-muted-foreground">
                      Secrets das Edge Functions (configurar em Lovable Cloud):
                    </p>
                    <div className="space-y-2">
                      {[
                        "MERCADOPAGO_ACCESS_TOKEN",
                        "UTMIFY_API_KEY",
                        "TELEGRAM_BOT_TOKEN",
                      ].map((secret) => (
                        <div key={secret} className="p-2 bg-muted/50 rounded flex items-center justify-between">
                          <code className="text-sm font-medium">{secret}</code>
                          <Badge variant="secondary">
                            <Shield className="w-3 h-3 mr-1" />
                            Secret
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Migração Tab */}
        <TabsContent value="migration" className="space-y-6">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Zona de Perigo</AlertTitle>
            <AlertDescription>
              A migração de banco de dados e webhooks é um processo complexo que requer cuidado.
              Siga as instruções passo a passo.
            </AlertDescription>
          </Alert>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="w-5 h-5" />
                Guia de Migração
              </CardTitle>
              <CardDescription>
                Como migrar o sistema para um novo ambiente
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="step1">
                  <AccordionTrigger>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">1</Badge>
                      Exportar Dados do Banco Atual
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      Para exportar os dados, você precisará:
                    </p>
                    <ol className="list-decimal list-inside space-y-2 text-sm">
                      <li>Acessar o Lovable Cloud/Supabase Dashboard</li>
                      <li>Ir em Database &gt; Backups</li>
                      <li>Criar um backup manual ou agendar backup automático</li>
                      <li>Baixar o arquivo .sql de backup</li>
                    </ol>
                    <Alert>
                      <CheckCircle2 className="h-4 w-4" />
                      <AlertDescription>
                        Para projetos Lovable Cloud, os backups são gerenciados automaticamente.
                      </AlertDescription>
                    </Alert>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="step2">
                  <AccordionTrigger>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">2</Badge>
                      Configurar Novo Ambiente
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      Se estiver migrando para uma VPS ou outro Supabase:
                    </p>
                    <ol className="list-decimal list-inside space-y-2 text-sm">
                      <li>Criar novo projeto Supabase (ou instalar Supabase Self-hosted)</li>
                      <li>Executar as migrations do schema</li>
                      <li>Importar os dados do backup</li>
                      <li>Atualizar as variáveis de ambiente no .env</li>
                    </ol>
                    <div className="bg-muted p-4 rounded-lg space-y-2">
                      <p className="text-sm font-medium">Arquivo .env para novo ambiente:</p>
                      <code className="block text-xs whitespace-pre-wrap">
{`VITE_SUPABASE_URL=https://sua-nova-url.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sua-nova-chave-anon
VITE_SUPABASE_PROJECT_ID=seu-novo-project-id`}
                      </code>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="step3">
                  <AccordionTrigger>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">3</Badge>
                      Atualizar Webhooks
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      Após migrar, atualize todos os webhooks externos:
                    </p>
                    
                    <div className="space-y-4">
                      <div className="p-3 border rounded-lg">
                        <h4 className="font-medium mb-2">Telegram</h4>
                        <p className="text-sm text-muted-foreground mb-2">
                          Reconfigure o webhook de cada bot usando:
                        </p>
                        <code className="block bg-muted p-2 rounded text-xs">
                          GET https://api.telegram.org/bot&lt;TOKEN&gt;/setWebhook?url=NOVA_URL
                        </code>
                      </div>
                      
                      <div className="p-3 border rounded-lg">
                        <h4 className="font-medium mb-2">MercadoPago</h4>
                        <ol className="list-decimal list-inside text-sm space-y-1">
                          <li>Acesse sua conta MercadoPago</li>
                          <li>Vá em Configurações &gt; Webhooks</li>
                          <li>Atualize a URL para a nova Edge Function</li>
                        </ol>
                      </div>
                      
                      <div className="p-3 border rounded-lg">
                        <h4 className="font-medium mb-2">Outros Integradores</h4>
                        <p className="text-sm text-muted-foreground">
                          Atualize qualquer outro serviço que envie webhooks para o sistema.
                        </p>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="step4">
                  <AccordionTrigger>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">4</Badge>
                      Migrar Edge Functions
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      As Edge Functions estão no diretório <code>supabase/functions/</code>:
                    </p>
                    <div className="bg-muted p-4 rounded-lg">
                      <code className="text-xs whitespace-pre-wrap">
{`supabase/functions/
├── telegram-bot/
├── create-payment/
├── payment-webhook/
├── mercadopago-webhook/
├── mercadopago-oauth/
├── mercadopago-payment/
├── funnel-webhook/
├── campaign-dispatch/
├── campaign-runner/
├── social-oauth/
├── social-post/
└── ...`}
                      </code>
                    </div>
                    <p className="text-sm text-muted-foreground mt-4">
                      Para deploy manual em um Supabase externo:
                    </p>
                    <code className="block bg-muted p-2 rounded text-xs">
                      supabase functions deploy telegram-bot --project-ref SEU_PROJECT_REF
                    </code>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="step5">
                  <AccordionTrigger>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">5</Badge>
                      Configurar Secrets
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      Configure os secrets no novo ambiente:
                    </p>
                    <code className="block bg-muted p-2 rounded text-xs">
                      supabase secrets set MERCADOPAGO_ACCESS_TOKEN=seu_token
                    </code>
                    <div className="mt-4">
                      <p className="text-sm font-medium mb-2">Secrets necessários:</p>
                      <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                        <li>MERCADOPAGO_ACCESS_TOKEN - Token do MercadoPago</li>
                        <li>UTMIFY_API_KEY - Chave da Utmify (se usar)</li>
                        <li>SUPABASE_SERVICE_ROLE_KEY - Chave de serviço (auto)</li>
                      </ul>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Server className="w-5 h-5" />
                URLs Atuais do Sistema
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div>
                    <p className="text-sm font-medium">Supabase URL</p>
                    <code className="text-xs text-muted-foreground break-all">{supabaseUrl}</code>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => handleCopy(supabaseUrl || "")}>
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div>
                    <p className="text-sm font-medium">Project ID</p>
                    <code className="text-xs text-muted-foreground">{supabaseProjectId}</code>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => handleCopy(supabaseProjectId || "")}>
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div>
                    <p className="text-sm font-medium">Telegram Webhook Base</p>
                    <code className="text-xs text-muted-foreground break-all">{supabaseUrl}/functions/v1/telegram-bot</code>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => handleCopy(`${supabaseUrl}/functions/v1/telegram-bot`)}>
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminSystemConfigPanel;
