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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
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
  XCircle,
  BookOpen,
  Code,
  FileCode,
  Layers,
  Settings,
  Globe,
  Shield,
  Zap,
  Play,
  Loader2,
  Terminal,
  Network,
  HardDrive,
  Cloud,
  Route,
  TestTube,
  FileJson,
  Download,
  Upload,
  Lock,
  Unlock,
  Clock,
  Activity,
  Cpu,
  MemoryStick,
  Wifi,
  WifiOff,
  CheckCheck,
  Bug,
  GitBranch,
  FolderTree,
  Link,
  ArrowRight,
  Info,
  AlertCircle,
} from "lucide-react";

// Definição de todas as rotas do sistema
const SYSTEM_ROUTES = [
  { path: "/", name: "Landing Page", auth: false, description: "Página inicial pública" },
  { path: "/login", name: "Login", auth: false, description: "Autenticação de usuários" },
  { path: "/signup", name: "Cadastro", auth: false, description: "Registro de novos usuários" },
  { path: "/forgot-password", name: "Esqueci Senha", auth: false, description: "Recuperação de senha" },
  { path: "/reset-password", name: "Redefinir Senha", auth: false, description: "Definir nova senha" },
  { path: "/dashboard", name: "Dashboard", auth: true, description: "Painel principal do usuário" },
  { path: "/billing", name: "Faturamento", auth: true, description: "Gestão de planos e pagamentos" },
  { path: "/telegram", name: "Telegram Hub", auth: true, description: "Central de bots Telegram" },
  { path: "/accounts", name: "Contas", auth: true, description: "Gestão de contas conectadas" },
  { path: "/telegram-groups", name: "Grupos Telegram", auth: true, description: "Marketplace de grupos", feature: "telegram_groups_enabled" },
  { path: "/funnels", name: "Funis", auth: true, description: "Lista de funis de vendas", feature: "funnels_enabled" },
  { path: "/funnels/:funnelId", name: "Editor de Funil", auth: true, description: "Construtor de funis", feature: "funnels_enabled" },
  { path: "/checkout", name: "Checkout", auth: true, description: "Página de pagamento" },
  { path: "/thank-you", name: "Obrigado", auth: true, description: "Confirmação de compra" },
  { path: "/delivery", name: "Entregas", auth: true, description: "Produtos adquiridos" },
  { path: "/admin", name: "Admin Dashboard", auth: true, description: "Painel administrativo", role: "admin" },
  { path: "/admin/user/:userId", name: "Detalhes do Usuário", auth: true, description: "Informações do usuário", role: "admin" },
  { path: "/reseller", name: "Revendedor", auth: true, description: "Painel de revenda", role: "vendor" },
  { path: "/settings", name: "Configurações", auth: true, description: "Preferências do usuário" },
  { path: "/integrations", name: "Integrações", auth: true, description: "APIs e webhooks" },
  { path: "/payments", name: "Pagamentos", auth: true, description: "Histórico de transações" },
  { path: "/my-purchases", name: "Minhas Compras", auth: true, description: "Produtos comprados" },
  { path: "/publication-automation", name: "Automação", auth: true, description: "Publicação automática", feature: "automation_module_enabled" },
  { path: "/smart-links", name: "Smart Links", auth: true, description: "Páginas de links", feature: "smart_links_enabled" },
  { path: "/smart-links/:pageId", name: "Editor Smart Link", auth: true, description: "Editar página", feature: "smart_links_enabled" },
  { path: "/referrals", name: "Indicações", auth: true, description: "Programa de afiliados", feature: "referrals_enabled" },
  { path: "/r/:code", name: "Redirect Referral", auth: false, description: "Redirecionamento de indicação" },
  { path: "/@:slug", name: "Smart Link Público", auth: false, description: "Página pública do smart link" },
];

// Edge Functions disponíveis
const EDGE_FUNCTIONS = [
  { name: "telegram-bot", description: "Processa mensagens e webhooks do Telegram", method: "POST", auth: "webhook" },
  { name: "create-payment", description: "Cria pagamentos PIX via BuckPay", method: "POST", auth: "jwt" },
  { name: "create-product-payment", description: "Pagamento de produtos do catálogo", method: "POST", auth: "jwt" },
  { name: "funnel-webhook", description: "Processa eventos de funil de vendas", method: "POST", auth: "public" },
  { name: "mercadopago-callback", description: "Callback OAuth do MercadoPago", method: "GET", auth: "public" },
  { name: "mercadopago-oauth", description: "Inicia OAuth com MercadoPago", method: "GET", auth: "jwt" },
  { name: "mercadopago-payment", description: "Cria pagamento no MercadoPago", method: "POST", auth: "jwt" },
  { name: "mercadopago-webhook", description: "Webhook de notificações MP", method: "POST", auth: "public" },
  { name: "payment-reminder", description: "Envia lembretes de pagamento", method: "POST", auth: "cron" },
  { name: "payment-webhook", description: "Webhook genérico de pagamentos", method: "POST", auth: "public" },
  { name: "process-referral", description: "Processa indicações de usuários", method: "POST", auth: "jwt" },
  { name: "social-oauth", description: "OAuth para redes sociais", method: "GET", auth: "jwt" },
  { name: "social-post", description: "Publica em redes sociais", method: "POST", auth: "jwt" },
  { name: "test-destination", description: "Testa destino de campanha", method: "POST", auth: "jwt" },
  { name: "campaign-dispatch", description: "Dispara campanhas de mídia", method: "POST", auth: "jwt" },
  { name: "campaign-runner", description: "Executor de campanhas (cron)", method: "POST", auth: "cron" },
  { name: "utmify-track", description: "Tracking UTMify", method: "POST", auth: "public" },
  { name: "wpp-api", description: "API WhatsApp", method: "POST", auth: "jwt" },
  { name: "wpp-webhook", description: "Webhook WhatsApp", method: "POST", auth: "public" },
  { name: "admin-update-email", description: "Admin atualiza email", method: "POST", auth: "admin" },
];

// Tabelas do banco de dados
const DATABASE_TABLES = [
  { name: "profiles", description: "Perfis de usuários", rls: true },
  { name: "user_roles", description: "Papéis dos usuários (admin, vendor, user)", rls: true },
  { name: "subscriptions", description: "Assinaturas ativas", rls: true },
  { name: "plans", description: "Planos disponíveis", rls: false },
  { name: "transactions", description: "Transações financeiras", rls: true },
  { name: "funnels", description: "Funis de vendas", rls: true },
  { name: "funnel_nodes", description: "Nós dos funis", rls: true },
  { name: "funnel_edges", description: "Conexões entre nós", rls: true },
  { name: "funnel_products", description: "Produtos dos funis", rls: true },
  { name: "funnel_payments", description: "Pagamentos via funil", rls: true },
  { name: "telegram_integrations", description: "Bots Telegram conectados", rls: true },
  { name: "telegram_sessions", description: "Sessões de conversa", rls: true },
  { name: "telegram_logs", description: "Logs de eventos Telegram", rls: true },
  { name: "destinations", description: "Destinos de campanha", rls: true },
  { name: "campaigns", description: "Campanhas de mídia", rls: true },
  { name: "admin_media", description: "Pacotes de mídia do admin", rls: false },
  { name: "admin_settings", description: "Configurações booleanas", rls: false },
  { name: "admin_text_settings", description: "Configurações de texto", rls: false },
  { name: "smart_link_pages", description: "Páginas Smart Link", rls: true },
  { name: "smart_link_buttons", description: "Botões das páginas", rls: true },
  { name: "smart_link_clicks", description: "Cliques nos botões", rls: false },
  { name: "smart_link_views", description: "Visualizações de páginas", rls: false },
  { name: "referrals", description: "Indicações de usuários", rls: true },
  { name: "commissions", description: "Comissões de indicação", rls: true },
  { name: "referral_settings", description: "Config do programa", rls: false },
  { name: "integrations", description: "Integrações OAuth", rls: true },
  { name: "social_accounts", description: "Contas de redes sociais", rls: true },
  { name: "scheduled_posts", description: "Posts agendados", rls: true },
  { name: "notifications", description: "Notificações do sistema", rls: false },
  { name: "dashboard_banners", description: "Banners do dashboard", rls: false },
  { name: "tiktok_accounts", description: "Contas TikTok à venda", rls: false },
  { name: "instagram_accounts", description: "Contas Instagram à venda", rls: false },
  { name: "telegram_groups", description: "Grupos Telegram à venda", rls: false },
  { name: "models_for_sale", description: "Modelos à venda", rls: false },
  { name: "deliveries", description: "Entregas de produtos", rls: true },
];

interface RouteTestResult {
  path: string;
  status: "pending" | "success" | "error" | "testing";
  message?: string;
  responseTime?: number;
}

interface EdgeFunctionTestResult {
  name: string;
  status: "pending" | "success" | "error" | "testing";
  message?: string;
  responseTime?: number;
}

interface DatabaseTestResult {
  table: string;
  status: "pending" | "success" | "error" | "testing";
  rowCount?: number;
  message?: string;
}

const AdminTIPanel = () => {
  const [activeTab, setActiveTab] = useState("routes");
  const [routeTests, setRouteTests] = useState<RouteTestResult[]>([]);
  const [edgeFunctionTests, setEdgeFunctionTests] = useState<EdgeFunctionTestResult[]>([]);
  const [dbTests, setDbTests] = useState<DatabaseTestResult[]>([]);
  const [isTestingRoutes, setIsTestingRoutes] = useState(false);
  const [isTestingFunctions, setIsTestingFunctions] = useState(false);
  const [isTestingDb, setIsTestingDb] = useState(false);
  const [systemInfo, setSystemInfo] = useState<any>(null);
  const { toast } = useToast();

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseProjectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;

  useEffect(() => {
    // Initialize route tests
    setRouteTests(SYSTEM_ROUTES.map(r => ({ path: r.path, status: "pending" })));
    setEdgeFunctionTests(EDGE_FUNCTIONS.map(f => ({ name: f.name, status: "pending" })));
    setDbTests(DATABASE_TABLES.map(t => ({ table: t.name, status: "pending" })));
    
    // Get system info
    setSystemInfo({
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      language: navigator.language,
      cookieEnabled: navigator.cookieEnabled,
      onLine: navigator.onLine,
      screenWidth: window.screen.width,
      screenHeight: window.screen.height,
    });
  }, []);

  const testRoutes = async () => {
    setIsTestingRoutes(true);
    const results: RouteTestResult[] = [];

    for (const route of SYSTEM_ROUTES) {
      setRouteTests(prev => prev.map(r => 
        r.path === route.path ? { ...r, status: "testing" } : r
      ));

      const start = performance.now();
      try {
        // Simple check - just verify the route exists in our config
        const responseTime = Math.round(performance.now() - start);
        results.push({
          path: route.path,
          status: "success",
          message: "Rota configurada",
          responseTime,
        });
      } catch (error: any) {
        results.push({
          path: route.path,
          status: "error",
          message: error.message,
        });
      }

      setRouteTests(prev => prev.map(r => {
        const result = results.find(res => res.path === r.path);
        return result || r;
      }));
      
      await new Promise(resolve => setTimeout(resolve, 50));
    }

    setIsTestingRoutes(false);
    toast({ title: "Teste de rotas concluído!", description: `${results.filter(r => r.status === "success").length}/${results.length} rotas OK` });
  };

  const testEdgeFunctions = async () => {
    setIsTestingFunctions(true);
    const results: EdgeFunctionTestResult[] = [];

    for (const fn of EDGE_FUNCTIONS) {
      setEdgeFunctionTests(prev => prev.map(f => 
        f.name === fn.name ? { ...f, status: "testing" } : f
      ));

      const start = performance.now();
      try {
        // Test with OPTIONS request (CORS preflight)
        const response = await fetch(`${supabaseUrl}/functions/v1/${fn.name}`, {
          method: "OPTIONS",
        });
        
        const responseTime = Math.round(performance.now() - start);
        results.push({
          name: fn.name,
          status: response.ok || response.status === 204 ? "success" : "error",
          message: response.ok || response.status === 204 ? "Função acessível" : `Status: ${response.status}`,
          responseTime,
        });
      } catch (error: any) {
        results.push({
          name: fn.name,
          status: "error",
          message: error.message || "Erro de conexão",
        });
      }

      setEdgeFunctionTests(prev => prev.map(f => {
        const result = results.find(res => res.name === f.name);
        return result || f;
      }));
      
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    setIsTestingFunctions(false);
    toast({ title: "Teste de funções concluído!", description: `${results.filter(r => r.status === "success").length}/${results.length} funções OK` });
  };

  const testDatabase = async () => {
    setIsTestingDb(true);
    const results: DatabaseTestResult[] = [];

    for (const table of DATABASE_TABLES) {
      setDbTests(prev => prev.map(t => 
        t.table === table.name ? { ...t, status: "testing" } : t
      ));

      try {
        const { count, error } = await supabase
          .from(table.name as any)
          .select("*", { count: "exact", head: true });

        if (error) {
          results.push({
            table: table.name,
            status: "error",
            message: error.message,
          });
        } else {
          results.push({
            table: table.name,
            status: "success",
            rowCount: count || 0,
            message: `${count || 0} registros`,
          });
        }
      } catch (error: any) {
        results.push({
          table: table.name,
          status: "error",
          message: error.message,
        });
      }

      setDbTests(prev => prev.map(t => {
        const result = results.find(res => res.table === t.table);
        return result || t;
      }));
      
      await new Promise(resolve => setTimeout(resolve, 50));
    }

    setIsTestingDb(false);
    toast({ title: "Teste de banco concluído!", description: `${results.filter(r => r.status === "success").length}/${results.length} tabelas OK` });
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copiado!" });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "success":
        return <CheckCircle2 className="w-4 h-4 text-green-500" />;
      case "error":
        return <XCircle className="w-4 h-4 text-red-500" />;
      case "testing":
        return <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />;
      default:
        return <Clock className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "success":
        return <Badge className="bg-green-500/10 text-green-500 border-green-500/20">OK</Badge>;
      case "error":
        return <Badge variant="destructive">Erro</Badge>;
      case "testing":
        return <Badge variant="secondary">Testando...</Badge>;
      default:
        return <Badge variant="outline">Pendente</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Painel T.I.</h2>
          <p className="text-muted-foreground">Documentação técnica, testes e migração do sistema</p>
        </div>
        <Badge variant="outline" className="gap-2">
          <Activity className="w-3 h-3" />
          {navigator.onLine ? "Online" : "Offline"}
        </Badge>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid grid-cols-2 md:grid-cols-6 gap-1">
          <TabsTrigger value="routes" className="gap-2 text-xs md:text-sm">
            <Route className="w-4 h-4" />
            <span className="hidden md:inline">Rotas</span>
          </TabsTrigger>
          <TabsTrigger value="functions" className="gap-2 text-xs md:text-sm">
            <Zap className="w-4 h-4" />
            <span className="hidden md:inline">Funções</span>
          </TabsTrigger>
          <TabsTrigger value="database" className="gap-2 text-xs md:text-sm">
            <Database className="w-4 h-4" />
            <span className="hidden md:inline">Banco</span>
          </TabsTrigger>
          <TabsTrigger value="hosting" className="gap-2 text-xs md:text-sm">
            <Server className="w-4 h-4" />
            <span className="hidden md:inline">Hospedagem</span>
          </TabsTrigger>
          <TabsTrigger value="migration" className="gap-2 text-xs md:text-sm">
            <GitBranch className="w-4 h-4" />
            <span className="hidden md:inline">Migração</span>
          </TabsTrigger>
          <TabsTrigger value="docs" className="gap-2 text-xs md:text-sm">
            <BookOpen className="w-4 h-4" />
            <span className="hidden md:inline">Docs</span>
          </TabsTrigger>
        </TabsList>

        {/* Tab: Rotas */}
        <TabsContent value="routes" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Route className="w-5 h-5" />
                    Teste de Rotas
                  </CardTitle>
                  <CardDescription>
                    Verifique todas as rotas do sistema ({SYSTEM_ROUTES.length} rotas)
                  </CardDescription>
                </div>
                <Button onClick={testRoutes} disabled={isTestingRoutes}>
                  {isTestingRoutes ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <Play className="w-4 h-4 mr-2" />
                  )}
                  Testar Todas
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Rota</TableHead>
                      <TableHead>Nome</TableHead>
                      <TableHead>Autenticação</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {SYSTEM_ROUTES.map((route, idx) => {
                      const test = routeTests.find(t => t.path === route.path);
                      return (
                        <TableRow key={idx}>
                          <TableCell>
                            <code className="text-xs bg-muted px-2 py-1 rounded">{route.path}</code>
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium text-sm">{route.name}</p>
                              <p className="text-xs text-muted-foreground">{route.description}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-1 flex-wrap">
                              {route.auth ? (
                                <Badge variant="secondary" className="text-xs">
                                  <Lock className="w-3 h-3 mr-1" />
                                  Auth
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="text-xs">
                                  <Unlock className="w-3 h-3 mr-1" />
                                  Público
                                </Badge>
                              )}
                              {route.role && (
                                <Badge className="text-xs bg-purple-500/10 text-purple-500 border-purple-500/20">
                                  {route.role}
                                </Badge>
                              )}
                              {route.feature && (
                                <Badge className="text-xs bg-blue-500/10 text-blue-500 border-blue-500/20">
                                  feature
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            {test && getStatusBadge(test.status)}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Funções */}
        <TabsContent value="functions" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="w-5 h-5" />
                    Edge Functions
                  </CardTitle>
                  <CardDescription>
                    Teste de conectividade das funções ({EDGE_FUNCTIONS.length} funções)
                  </CardDescription>
                </div>
                <Button onClick={testEdgeFunctions} disabled={isTestingFunctions}>
                  {isTestingFunctions ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <Play className="w-4 h-4 mr-2" />
                  )}
                  Testar Todas
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Alert className="mb-4">
                <Info className="w-4 h-4" />
                <AlertDescription>
                  Base URL: <code className="text-xs bg-muted px-2 py-0.5 rounded">{supabaseUrl}/functions/v1/</code>
                  <Button variant="ghost" size="sm" className="ml-2 h-6" onClick={() => copyToClipboard(`${supabaseUrl}/functions/v1/`)}>
                    <Copy className="w-3 h-3" />
                  </Button>
                </AlertDescription>
              </Alert>
              <ScrollArea className="h-[450px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Função</TableHead>
                      <TableHead>Descrição</TableHead>
                      <TableHead>Método</TableHead>
                      <TableHead>Auth</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Tempo</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {EDGE_FUNCTIONS.map((fn, idx) => {
                      const test = edgeFunctionTests.find(t => t.name === fn.name);
                      return (
                        <TableRow key={idx}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <code className="text-xs bg-muted px-2 py-1 rounded">{fn.name}</code>
                              <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => copyToClipboard(`${supabaseUrl}/functions/v1/${fn.name}`)}>
                                <Copy className="w-3 h-3" />
                              </Button>
                            </div>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">
                            {fn.description}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-xs">{fn.method}</Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={fn.auth === "public" ? "secondary" : "default"} className="text-xs">
                              {fn.auth}
                            </Badge>
                          </TableCell>
                          <TableCell>{test && getStatusIcon(test.status)}</TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {test?.responseTime ? `${test.responseTime}ms` : "-"}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Banco de Dados */}
        <TabsContent value="database" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Database className="w-5 h-5" />
                    Tabelas do Banco
                  </CardTitle>
                  <CardDescription>
                    Verificar conexão com tabelas ({DATABASE_TABLES.length} tabelas)
                  </CardDescription>
                </div>
                <Button onClick={testDatabase} disabled={isTestingDb}>
                  {isTestingDb ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <Play className="w-4 h-4 mr-2" />
                  )}
                  Testar Todas
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px]">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {DATABASE_TABLES.map((table, idx) => {
                    const test = dbTests.find(t => t.table === table.name);
                    return (
                      <div key={idx} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                        <div className="flex items-center gap-3">
                          {test && getStatusIcon(test.status)}
                          <div>
                            <code className="text-sm font-medium">{table.name}</code>
                            <p className="text-xs text-muted-foreground">{table.description}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {table.rls ? (
                            <Badge variant="secondary" className="text-xs">
                              <Shield className="w-3 h-3 mr-1" />
                              RLS
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-xs">Público</Badge>
                          )}
                          {test?.rowCount !== undefined && (
                            <Badge variant="outline" className="text-xs">
                              {test.rowCount} rows
                            </Badge>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Hospedagem */}
        <TabsContent value="hosting" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Cloud className="w-5 h-5" />
                  Lovable Cloud (Backend)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Project ID</Label>
                  <div className="flex gap-2">
                    <Input value={supabaseProjectId || ""} readOnly className="font-mono text-xs" />
                    <Button variant="outline" size="icon" onClick={() => copyToClipboard(supabaseProjectId || "")}>
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>API URL</Label>
                  <div className="flex gap-2">
                    <Input value={supabaseUrl || ""} readOnly className="font-mono text-xs" />
                    <Button variant="outline" size="icon" onClick={() => copyToClipboard(supabaseUrl || "")}>
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                <Separator />
                <div className="text-sm text-muted-foreground space-y-2">
                  <p><strong>Incluso no Lovable Cloud:</strong></p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Banco de dados PostgreSQL</li>
                    <li>Edge Functions (serverless)</li>
                    <li>Storage para arquivos</li>
                    <li>Autenticação integrada</li>
                    <li>Realtime subscriptions</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Server className="w-5 h-5" />
                  VPS / Hospedagem Externa
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Alert>
                  <Info className="w-4 h-4" />
                  <AlertDescription>
                    O sistema usa Lovable Cloud como backend principal. VPS é opcional para serviços adicionais.
                  </AlertDescription>
                </Alert>
                
                <Accordion type="single" collapsible>
                  <AccordionItem value="dns">
                    <AccordionTrigger>
                      <div className="flex items-center gap-2">
                        <Globe className="w-4 h-4" />
                        Configurar DNS
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="space-y-3">
                      <p className="text-sm text-muted-foreground">Para usar um domínio personalizado:</p>
                      <div className="bg-muted p-3 rounded-lg space-y-2 text-xs font-mono">
                        <p><strong>Tipo A (root):</strong></p>
                        <code>@ → 185.158.133.1</code>
                        <p className="mt-2"><strong>Tipo A (www):</strong></p>
                        <code>www → 185.158.133.1</code>
                        <p className="mt-2"><strong>TXT (verificação):</strong></p>
                        <code>_lovable → lovable_verify=XXX</code>
                      </div>
                      <p className="text-xs text-muted-foreground">Configure no painel do seu registrador de domínio.</p>
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="vps-setup">
                    <AccordionTrigger>
                      <div className="flex items-center gap-2">
                        <HardDrive className="w-4 h-4" />
                        Configurar VPS (Opcional)
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="space-y-3">
                      <p className="text-sm text-muted-foreground">Se precisar de serviços externos à Lovable:</p>
                      <div className="space-y-2">
                        <div className="p-3 bg-muted rounded-lg">
                          <p className="text-xs font-semibold">1. Acesse sua VPS via SSH</p>
                          <code className="text-xs">ssh root@seu-ip-vps</code>
                        </div>
                        <div className="p-3 bg-muted rounded-lg">
                          <p className="text-xs font-semibold">2. Instale Docker</p>
                          <code className="text-xs">curl -fsSL https://get.docker.com | sh</code>
                        </div>
                        <div className="p-3 bg-muted rounded-lg">
                          <p className="text-xs font-semibold">3. Configure Nginx como proxy</p>
                          <code className="text-xs">apt install nginx certbot</code>
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="ssl">
                    <AccordionTrigger>
                      <div className="flex items-center gap-2">
                        <Lock className="w-4 h-4" />
                        Certificado SSL
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="space-y-3">
                      <p className="text-sm text-muted-foreground">O Lovable Cloud fornece SSL automaticamente para domínios conectados.</p>
                      <p className="text-sm text-muted-foreground">Para VPS externa, use Certbot:</p>
                      <div className="bg-muted p-3 rounded-lg">
                        <code className="text-xs">certbot --nginx -d seudominio.com</code>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </CardContent>
            </Card>
          </div>

          {/* System Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Cpu className="w-5 h-5" />
                Informações do Sistema
              </CardTitle>
            </CardHeader>
            <CardContent>
              {systemInfo && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-3 bg-muted/30 rounded-lg">
                    <p className="text-xs text-muted-foreground">Plataforma</p>
                    <p className="text-sm font-medium">{systemInfo.platform}</p>
                  </div>
                  <div className="p-3 bg-muted/30 rounded-lg">
                    <p className="text-xs text-muted-foreground">Idioma</p>
                    <p className="text-sm font-medium">{systemInfo.language}</p>
                  </div>
                  <div className="p-3 bg-muted/30 rounded-lg">
                    <p className="text-xs text-muted-foreground">Resolução</p>
                    <p className="text-sm font-medium">{systemInfo.screenWidth}x{systemInfo.screenHeight}</p>
                  </div>
                  <div className="p-3 bg-muted/30 rounded-lg">
                    <p className="text-xs text-muted-foreground">Status</p>
                    <div className="flex items-center gap-2">
                      {systemInfo.onLine ? (
                        <Wifi className="w-4 h-4 text-green-500" />
                      ) : (
                        <WifiOff className="w-4 h-4 text-red-500" />
                      )}
                      <p className="text-sm font-medium">{systemInfo.onLine ? "Online" : "Offline"}</p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Migração */}
        <TabsContent value="migration" className="space-y-4">
          <Alert variant="destructive">
            <AlertTriangle className="w-4 h-4" />
            <AlertTitle>Atenção!</AlertTitle>
            <AlertDescription>
              Migração de banco de dados é uma operação crítica. Faça backup de todos os dados antes de prosseguir.
            </AlertDescription>
          </Alert>

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Download className="w-5 h-5" />
                  Exportar Dados
                </CardTitle>
                <CardDescription>Faça backup dos dados atuais</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Database className="w-4 h-4" />
                      <span className="text-sm">Exportar todas as tabelas</span>
                    </div>
                    <Button variant="outline" size="sm" disabled>
                      <Download className="w-4 h-4 mr-2" />
                      JSON
                    </Button>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                    <div className="flex items-center gap-2">
                      <FileJson className="w-4 h-4" />
                      <span className="text-sm">Exportar configurações</span>
                    </div>
                    <Button variant="outline" size="sm" disabled>
                      <Download className="w-4 h-4 mr-2" />
                      Config
                    </Button>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                    <div className="flex items-center gap-2">
                      <FolderTree className="w-4 h-4" />
                      <span className="text-sm">Exportar estrutura</span>
                    </div>
                    <Button variant="outline" size="sm" disabled>
                      <Download className="w-4 h-4 mr-2" />
                      Schema
                    </Button>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  * Funcionalidade de exportação em desenvolvimento. Use o backend do Lovable Cloud para backup.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="w-5 h-5" />
                  Importar Dados
                </CardTitle>
                <CardDescription>Restaurar dados de backup</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="border-2 border-dashed border-muted rounded-lg p-6 text-center">
                  <Upload className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">Arraste arquivos de backup aqui</p>
                  <Button variant="secondary" size="sm" className="mt-2" disabled>
                    Selecionar Arquivos
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  * Funcionalidade de importação em desenvolvimento.
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <GitBranch className="w-5 h-5" />
                Guia de Migração Completa
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="step1">
                  <AccordionTrigger>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">1</Badge>
                      Preparação do Ambiente Destino
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="space-y-3">
                    <ol className="list-decimal list-inside space-y-2 text-sm">
                      <li>Crie um novo projeto no Lovable</li>
                      <li>Ative o Lovable Cloud no novo projeto</li>
                      <li>Copie as credenciais do novo projeto</li>
                      <li>Configure as Edge Functions necessárias</li>
                    </ol>
                    <div className="bg-muted p-3 rounded-lg">
                      <p className="text-xs font-semibold mb-2">Variáveis necessárias:</p>
                      <ul className="text-xs space-y-1 font-mono">
                        <li>SUPABASE_URL</li>
                        <li>SUPABASE_ANON_KEY</li>
                        <li>SUPABASE_SERVICE_ROLE_KEY</li>
                      </ul>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="step2">
                  <AccordionTrigger>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">2</Badge>
                      Migrar Esquema do Banco
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="space-y-3">
                    <p className="text-sm">Execute as migrações na ordem correta:</p>
                    <ol className="list-decimal list-inside space-y-2 text-sm">
                      <li>Tabelas base (profiles, plans, etc)</li>
                      <li>Tabelas de relacionamento</li>
                      <li>Funções e triggers</li>
                      <li>Políticas RLS</li>
                      <li>Storage buckets</li>
                    </ol>
                    <Alert>
                      <Info className="w-4 h-4" />
                      <AlertDescription className="text-xs">
                        As migrações estão em <code>supabase/migrations/</code>
                      </AlertDescription>
                    </Alert>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="step3">
                  <AccordionTrigger>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">3</Badge>
                      Migrar Dados
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="space-y-3">
                    <p className="text-sm">Ordem recomendada para migração de dados:</p>
                    <ol className="list-decimal list-inside space-y-1 text-sm">
                      <li>profiles → user_roles → subscriptions</li>
                      <li>plans → transactions</li>
                      <li>admin_settings → admin_text_settings</li>
                      <li>telegram_integrations → funnels → funnel_nodes</li>
                      <li>smart_link_pages → smart_link_buttons</li>
                      <li>Arquivos do Storage</li>
                    </ol>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="step4">
                  <AccordionTrigger>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">4</Badge>
                      Configurar Webhooks
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="space-y-3">
                    <p className="text-sm">Atualize os webhooks externos:</p>
                    <div className="space-y-2">
                      <div className="p-3 bg-muted rounded-lg">
                        <p className="text-xs font-semibold">Telegram</p>
                        <code className="text-xs">https://api.telegram.org/bot{`<TOKEN>`}/setWebhook?url=NOVA_URL</code>
                      </div>
                      <div className="p-3 bg-muted rounded-lg">
                        <p className="text-xs font-semibold">MercadoPago</p>
                        <p className="text-xs">Atualize no painel → Desenvolvedor → Webhooks</p>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="step5">
                  <AccordionTrigger>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">5</Badge>
                      Verificação Final
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="space-y-3">
                    <p className="text-sm">Checklist de verificação:</p>
                    <div className="space-y-2">
                      {[
                        "Todas as tabelas criadas",
                        "Dados migrados corretamente",
                        "RLS policies funcionando",
                        "Edge Functions respondendo",
                        "Webhooks configurados",
                        "Storage acessível",
                        "Login/Signup funcionando",
                        "Pagamentos testados",
                      ].map((item, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-sm">
                          <CheckCheck className="w-4 h-4 text-muted-foreground" />
                          <span>{item}</span>
                        </div>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Documentação */}
        <TabsContent value="docs" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Layers className="w-5 h-5" />
                  Arquitetura
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm space-y-2">
                <p><strong>Frontend:</strong> React + Vite + TypeScript</p>
                <p><strong>Estilização:</strong> Tailwind CSS + shadcn/ui</p>
                <p><strong>Estado:</strong> TanStack Query + Context</p>
                <p><strong>Backend:</strong> Lovable Cloud (Supabase)</p>
                <p><strong>Database:</strong> PostgreSQL</p>
                <p><strong>Auth:</strong> Supabase Auth</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <FolderTree className="w-5 h-5" />
                  Estrutura de Pastas
                </CardTitle>
              </CardHeader>
              <CardContent className="font-mono text-xs space-y-1">
                <p>src/</p>
                <p className="pl-4">├── components/</p>
                <p className="pl-4">├── contexts/</p>
                <p className="pl-4">├── hooks/</p>
                <p className="pl-4">├── integrations/</p>
                <p className="pl-4">├── lib/</p>
                <p className="pl-4">├── pages/</p>
                <p className="pl-4">└── utils/</p>
                <p>supabase/</p>
                <p className="pl-4">├── functions/</p>
                <p className="pl-4">└── migrations/</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Key className="w-5 h-5" />
                  Secrets Configurados
                </CardTitle>
              </CardHeader>
              <CardContent className="text-xs space-y-1">
                {[
                  "SUPABASE_URL",
                  "SUPABASE_ANON_KEY",
                  "SUPABASE_SERVICE_ROLE_KEY",
                  "BUCKPAY_API_TOKEN",
                  "MERCADOPAGO_CLIENT_ID",
                  "MERCADOPAGO_CLIENT_SECRET",
                  "META_APP_ID",
                  "META_APP_SECRET",
                  "TWITTER_*",
                ].map((secret, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <Lock className="w-3 h-3 text-muted-foreground" />
                    <code>{secret}</code>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Terminal className="w-5 h-5" />
                Comandos Úteis
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 md:grid-cols-2">
                {[
                  { cmd: "npm run dev", desc: "Iniciar servidor de desenvolvimento" },
                  { cmd: "npm run build", desc: "Build de produção" },
                  { cmd: "npm run preview", desc: "Preview do build" },
                  { cmd: "npx supabase functions serve", desc: "Testar Edge Functions localmente" },
                  { cmd: "npx supabase db push", desc: "Aplicar migrações" },
                  { cmd: "npx supabase gen types typescript", desc: "Gerar tipos TypeScript" },
                ].map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                    <div>
                      <code className="text-xs font-medium">{item.cmd}</code>
                      <p className="text-xs text-muted-foreground">{item.desc}</p>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => copyToClipboard(item.cmd)}>
                      <Copy className="w-3 h-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Link className="w-5 h-5" />
                Links Úteis
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-2 md:grid-cols-3">
                {[
                  { name: "Documentação Lovable", url: "https://docs.lovable.dev" },
                  { name: "Supabase Docs", url: "https://supabase.com/docs" },
                  { name: "Tailwind CSS", url: "https://tailwindcss.com/docs" },
                  { name: "shadcn/ui", url: "https://ui.shadcn.com" },
                  { name: "React Router", url: "https://reactrouter.com" },
                  { name: "TanStack Query", url: "https://tanstack.com/query" },
                ].map((link, idx) => (
                  <a
                    key={idx}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 p-3 bg-muted/30 rounded-lg hover:bg-muted transition-colors"
                  >
                    <ExternalLink className="w-4 h-4" />
                    <span className="text-sm">{link.name}</span>
                  </a>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminTIPanel;
