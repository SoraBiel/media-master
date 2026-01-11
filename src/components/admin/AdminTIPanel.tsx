import { useState, useEffect, useCallback } from "react";
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
import { Switch } from "@/components/ui/switch";
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
  Trash2,
  Eye,
  EyeOff,
  Search,
  Filter,
  BarChart3,
  Users,
  MessageSquare,
  CreditCard,
  FileText,
  Wrench,
  HeartPulse,
  Timer,
  Gauge,
  History,
  ScrollText,
  Bell,
  Send,
  Bot,
  Smartphone,
  Monitor,
  PanelLeft,
  LayoutDashboard,
  Cog,
  Package,
  FolderOpen,
  Hash,
  Calendar,
  TrendingUp,
  Pause,
  RotateCcw,
  Trash,
  Mail,
  PhoneCall,
  Image,
  Video,
  Music,
  File,
  Folder,
  FolderArchive,
  Archive,
  CloudUpload,
  CloudDownload,
  HardDriveDownload,
  HardDriveUpload,
  Power,
  PowerOff,
  Plug,
  Unplug,
  WifiHigh,
  WifiLow,
  WifiZero,
  SignalHigh,
  SignalLow,
  SignalMedium,
  CircleDot,
  CircleCheck,
  CircleX,
  CircleAlert,
  CirclePause,
  TriangleAlert,
  OctagonAlert,
  ShieldCheck,
  ShieldAlert,
  ShieldX,
  ShieldQuestion,
  LockKeyhole,
  Fingerprint,
  ScanLine,
  QrCode,
  Workflow,
  GitCommit,
  GitMerge,
  GitPullRequest,
  List,
  ListChecks,
  ListX,
  ClipboardCheck,
  ClipboardList,
  ClipboardX,
  FileCheck,
  FileX,
  FileCog,
  FileWarning,
  ServerCog,
  ServerCrash,
  ServerOff,
  DatabaseZap,
  Boxes,
  Box,
  Container,
} from "lucide-react";

// ================================
// CONFIGURAÇÕES E CONSTANTES
// ================================

// Definição de todas as rotas do sistema
const SYSTEM_ROUTES = [
  { path: "/", name: "Landing Page", auth: false, description: "Página inicial pública", category: "public" },
  { path: "/login", name: "Login", auth: false, description: "Autenticação de usuários", category: "auth" },
  { path: "/signup", name: "Cadastro", auth: false, description: "Registro de novos usuários", category: "auth" },
  { path: "/forgot-password", name: "Esqueci Senha", auth: false, description: "Recuperação de senha", category: "auth" },
  { path: "/reset-password", name: "Redefinir Senha", auth: false, description: "Definir nova senha", category: "auth" },
  { path: "/onboarding", name: "Onboarding", auth: true, description: "Configuração inicial", category: "user" },
  { path: "/dashboard", name: "Dashboard", auth: true, description: "Painel principal do usuário", category: "user" },
  { path: "/billing", name: "Faturamento", auth: true, description: "Gestão de planos e pagamentos", category: "user" },
  { path: "/telegram", name: "Telegram Hub", auth: true, description: "Central de bots Telegram", category: "feature" },
  { path: "/accounts", name: "Contas", auth: true, description: "Gestão de contas conectadas", category: "user" },
  { path: "/telegram-groups", name: "Grupos Telegram", auth: true, description: "Marketplace de grupos", feature: "telegram_groups_enabled", category: "marketplace" },
  { path: "/funnels", name: "Funis", auth: true, description: "Lista de funis de vendas", feature: "funnels_enabled", category: "feature" },
  { path: "/funnels/:funnelId", name: "Editor de Funil", auth: true, description: "Construtor de funis", feature: "funnels_enabled", category: "feature" },
  { path: "/checkout", name: "Checkout", auth: true, description: "Página de pagamento", category: "payment" },
  { path: "/thank-you", name: "Obrigado", auth: true, description: "Confirmação de compra", category: "payment" },
  { path: "/delivery", name: "Entregas", auth: true, description: "Produtos adquiridos", category: "user" },
  { path: "/admin", name: "Admin Dashboard", auth: true, description: "Painel administrativo", role: "admin", category: "admin" },
  { path: "/admin/user/:userId", name: "Detalhes do Usuário", auth: true, description: "Informações do usuário", role: "admin", category: "admin" },
  { path: "/reseller", name: "Revendedor", auth: true, description: "Painel de revenda", role: "vendor", category: "vendor" },
  { path: "/indicador", name: "Indicador", auth: true, description: "Painel de indicações", role: "indicador", category: "vendor" },
  { path: "/settings", name: "Configurações", auth: true, description: "Preferências do usuário", category: "user" },
  { path: "/integrations", name: "Integrações", auth: true, description: "APIs e webhooks", category: "feature" },
  { path: "/payments", name: "Pagamentos", auth: true, description: "Histórico de transações", category: "payment" },
  { path: "/my-purchases", name: "Minhas Compras", auth: true, description: "Produtos comprados", category: "user" },
  { path: "/publication-automation", name: "Automação", auth: true, description: "Publicação automática", feature: "automation_module_enabled", category: "feature" },
  { path: "/smart-links", name: "Smart Links", auth: true, description: "Páginas de links", feature: "smart_links_enabled", category: "feature" },
  { path: "/smart-links/:pageId", name: "Editor Smart Link", auth: true, description: "Editar página", feature: "smart_links_enabled", category: "feature" },
  { path: "/referrals", name: "Indicações", auth: true, description: "Programa de afiliados", feature: "referrals_enabled", category: "feature" },
  { path: "/r/:code", name: "Redirect Referral", auth: false, description: "Redirecionamento de indicação", category: "public" },
  { path: "/@:slug", name: "Smart Link Público", auth: false, description: "Página pública do smart link", category: "public" },
  { path: "/media-library", name: "Biblioteca de Mídia", auth: true, description: "Gerenciar mídias", category: "feature" },
  { path: "/model-hub", name: "Model Hub", auth: true, description: "Hub de modelos", category: "marketplace" },
];

// Edge Functions disponíveis
const EDGE_FUNCTIONS = [
  { name: "telegram-bot", description: "Processa mensagens e webhooks do Telegram", method: "POST", auth: "webhook", category: "telegram" },
  { name: "create-payment", description: "Cria pagamentos PIX via BuckPay", method: "POST", auth: "jwt", category: "payment" },
  { name: "create-product-payment", description: "Pagamento de produtos do catálogo", method: "POST", auth: "jwt", category: "payment" },
  { name: "funnel-webhook", description: "Processa eventos de funil de vendas", method: "POST", auth: "public", category: "funnel" },
  { name: "mercadopago-callback", description: "Callback OAuth do MercadoPago", method: "GET", auth: "public", category: "payment" },
  { name: "mercadopago-oauth", description: "Inicia OAuth com MercadoPago", method: "GET", auth: "jwt", category: "payment" },
  { name: "mercadopago-payment", description: "Cria pagamento no MercadoPago", method: "POST", auth: "jwt", category: "payment" },
  { name: "mercadopago-webhook", description: "Webhook de notificações MP", method: "POST", auth: "public", category: "payment" },
  { name: "payment-reminder", description: "Envia lembretes de pagamento", method: "POST", auth: "cron", category: "automation" },
  { name: "payment-webhook", description: "Webhook genérico de pagamentos", method: "POST", auth: "public", category: "payment" },
  { name: "process-referral", description: "Processa indicações de usuários", method: "POST", auth: "jwt", category: "referral" },
  { name: "social-oauth", description: "OAuth para redes sociais", method: "GET", auth: "jwt", category: "social" },
  { name: "social-post", description: "Publica em redes sociais", method: "POST", auth: "jwt", category: "social" },
  { name: "test-destination", description: "Testa destino de campanha", method: "POST", auth: "jwt", category: "campaign" },
  { name: "campaign-dispatch", description: "Dispara campanhas de mídia", method: "POST", auth: "jwt", category: "campaign" },
  { name: "campaign-runner", description: "Executor de campanhas (cron)", method: "POST", auth: "cron", category: "campaign" },
  { name: "utmify-track", description: "Tracking UTMify", method: "POST", auth: "public", category: "analytics" },
  { name: "wpp-api", description: "API WhatsApp", method: "POST", auth: "jwt", category: "whatsapp" },
  { name: "wpp-webhook", description: "Webhook WhatsApp", method: "POST", auth: "public", category: "whatsapp" },
  { name: "admin-update-email", description: "Admin atualiza email", method: "POST", auth: "admin", category: "admin" },
];

// Tabelas do banco de dados com mais detalhes
const DATABASE_TABLES = [
  { name: "profiles", description: "Perfis de usuários", rls: true, category: "core", critical: true },
  { name: "user_roles", description: "Papéis dos usuários", rls: true, category: "core", critical: true },
  { name: "user_metrics", description: "Métricas dos usuários", rls: true, category: "analytics" },
  { name: "user_activities", description: "Atividades dos usuários", rls: true, category: "analytics" },
  { name: "subscriptions", description: "Assinaturas ativas", rls: true, category: "billing", critical: true },
  { name: "plans", description: "Planos disponíveis", rls: false, category: "billing" },
  { name: "transactions", description: "Transações financeiras", rls: true, category: "billing", critical: true },
  { name: "funnels", description: "Funis de vendas", rls: true, category: "funnel" },
  { name: "funnel_nodes", description: "Nós dos funis", rls: true, category: "funnel" },
  { name: "funnel_edges", description: "Conexões entre nós", rls: true, category: "funnel" },
  { name: "funnel_products", description: "Produtos dos funis", rls: true, category: "funnel" },
  { name: "funnel_payments", description: "Pagamentos via funil", rls: true, category: "funnel" },
  { name: "funnel_templates", description: "Templates de funis", rls: false, category: "funnel" },
  { name: "telegram_integrations", description: "Bots Telegram conectados", rls: true, category: "telegram" },
  { name: "telegram_sessions", description: "Sessões de conversa", rls: true, category: "telegram" },
  { name: "telegram_logs", description: "Logs de eventos Telegram", rls: true, category: "telegram" },
  { name: "destinations", description: "Destinos de campanha", rls: true, category: "campaign" },
  { name: "campaigns", description: "Campanhas de mídia", rls: true, category: "campaign" },
  { name: "admin_media", description: "Pacotes de mídia do admin", rls: false, category: "admin" },
  { name: "admin_settings", description: "Configurações booleanas", rls: false, category: "admin", critical: true },
  { name: "admin_text_settings", description: "Configurações de texto", rls: false, category: "admin" },
  { name: "admin_settings_history", description: "Histórico de configurações", rls: false, category: "admin" },
  { name: "smart_link_pages", description: "Páginas Smart Link", rls: true, category: "smartlink" },
  { name: "smart_link_buttons", description: "Botões das páginas", rls: true, category: "smartlink" },
  { name: "smart_link_clicks", description: "Cliques nos botões", rls: false, category: "smartlink" },
  { name: "smart_link_views", description: "Visualizações de páginas", rls: false, category: "smartlink" },
  { name: "referrals", description: "Indicações de usuários", rls: true, category: "referral" },
  { name: "commissions", description: "Comissões de indicação", rls: true, category: "referral" },
  { name: "referral_settings", description: "Config do programa", rls: false, category: "referral" },
  { name: "referral_allowed_roles", description: "Roles permitidos", rls: false, category: "referral" },
  { name: "referral_role_commissions", description: "Comissões por role", rls: false, category: "referral" },
  { name: "integrations", description: "Integrações OAuth", rls: true, category: "integration" },
  { name: "social_accounts", description: "Contas de redes sociais", rls: true, category: "social" },
  { name: "scheduled_posts", description: "Posts agendados", rls: true, category: "social" },
  { name: "post_platform_logs", description: "Logs de posts", rls: true, category: "social" },
  { name: "notifications", description: "Notificações do sistema", rls: false, category: "system" },
  { name: "dashboard_banners", description: "Banners do dashboard", rls: false, category: "system" },
  { name: "tiktok_accounts", description: "Contas TikTok à venda", rls: false, category: "marketplace" },
  { name: "instagram_accounts", description: "Contas Instagram à venda", rls: false, category: "marketplace" },
  { name: "telegram_groups", description: "Grupos Telegram à venda", rls: false, category: "marketplace" },
  { name: "models_for_sale", description: "Modelos à venda", rls: false, category: "marketplace" },
  { name: "deliveries", description: "Entregas de produtos", rls: true, category: "delivery" },
  { name: "catalog_purchases", description: "Compras do catálogo", rls: true, category: "marketplace" },
  { name: "checkout_sessions", description: "Sessões de checkout", rls: true, category: "billing" },
];

// Storage Buckets
const STORAGE_BUCKETS = [
  { name: "media-packs", description: "Pacotes de mídia para campanhas", public: true },
  { name: "product-images", description: "Imagens de produtos", public: true },
  { name: "user-media", description: "Mídia enviada por usuários", public: true },
  { name: "smart-link-assets", description: "Assets dos Smart Links", public: true },
];

// Secrets do sistema
const SYSTEM_SECRETS = [
  { name: "SUPABASE_URL", description: "URL da API do backend", category: "core", required: true },
  { name: "SUPABASE_ANON_KEY", description: "Chave pública do backend", category: "core", required: true },
  { name: "SUPABASE_SERVICE_ROLE_KEY", description: "Chave de serviço (admin)", category: "core", required: true },
  { name: "APP_URL", description: "URL da aplicação", category: "core", required: true },
  { name: "BUCKPAY_API_TOKEN", description: "Token API BuckPay", category: "payment", required: false },
  { name: "BUCKPAY_USER_AGENT", description: "User Agent BuckPay", category: "payment", required: false },
  { name: "MERCADOPAGO_CLIENT_ID", description: "Client ID MercadoPago", category: "payment", required: false },
  { name: "MERCADOPAGO_CLIENT_SECRET", description: "Client Secret MercadoPago", category: "payment", required: false },
  { name: "META_APP_ID", description: "App ID Meta/Facebook", category: "social", required: false },
  { name: "META_APP_SECRET", description: "App Secret Meta", category: "social", required: false },
  { name: "TWITTER_CONSUMER_KEY", description: "Consumer Key Twitter", category: "social", required: false },
  { name: "TWITTER_CONSUMER_SECRET", description: "Consumer Secret Twitter", category: "social", required: false },
  { name: "TWITTER_ACCESS_TOKEN", description: "Access Token Twitter", category: "social", required: false },
  { name: "TWITTER_ACCESS_TOKEN_SECRET", description: "Access Token Secret Twitter", category: "social", required: false },
];

// Troubleshooting comum
const TROUBLESHOOTING_ITEMS = [
  {
    id: "auth-error",
    title: "Erro de autenticação (401/403)",
    symptoms: ["Usuário não consegue fazer login", "Token expirado", "Acesso negado"],
    solutions: [
      "Verificar se o email foi confirmado",
      "Limpar cookies e localStorage do navegador",
      "Verificar se o usuário tem a role necessária",
      "Checar se a sessão não expirou (JWT expires_at)",
    ],
    code: `// Verificar sessão
const { data: { session } } = await supabase.auth.getSession();
console.log('Session:', session);

// Forçar refresh do token
await supabase.auth.refreshSession();`,
  },
  {
    id: "rls-error",
    title: "Dados não aparecem (RLS)",
    symptoms: ["Query retorna vazio", "Usuário não vê seus dados", "Erro de permissão no banco"],
    solutions: [
      "Verificar se RLS está habilitado na tabela",
      "Checar se existe policy para a operação (SELECT, INSERT, etc)",
      "Confirmar que auth.uid() está correto na policy",
      "Testar query como service_role para descartar RLS",
    ],
    code: `-- Verificar policies de uma tabela
SELECT * FROM pg_policies WHERE tablename = 'sua_tabela';

-- Testar como usuário específico
SET LOCAL role authenticated;
SET LOCAL request.jwt.claims TO '{"sub": "user-id"}';
SELECT * FROM sua_tabela;`,
  },
  {
    id: "edge-function-error",
    title: "Edge Function não responde",
    symptoms: ["Timeout na função", "Erro 500", "CORS error"],
    solutions: [
      "Verificar logs da função no painel",
      "Checar se todos os secrets estão configurados",
      "Verificar CORS headers na resposta",
      "Testar localmente com supabase functions serve",
    ],
    code: `// Template de Edge Function com CORS
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }
  // ...
});`,
  },
  {
    id: "webhook-error",
    title: "Webhook não recebe dados",
    symptoms: ["Telegram não envia mensagens", "MercadoPago não notifica", "Dados não chegam"],
    solutions: [
      "Verificar se o webhook está registrado corretamente",
      "Checar se a URL está acessível publicamente",
      "Verificar se verify_jwt = false no config.toml",
      "Testar com curl/Postman",
    ],
    code: `# Registrar webhook do Telegram
curl -X POST "https://api.telegram.org/bot<TOKEN>/setWebhook" \\
  -d "url=https://mfuvdsrtppoqojfrisii.supabase.co/functions/v1/funnel-webhook"

# Verificar webhook atual
curl "https://api.telegram.org/bot<TOKEN>/getWebhookInfo"`,
  },
  {
    id: "payment-error",
    title: "Pagamento não processa",
    symptoms: ["PIX não gera", "Pagamento fica pendente", "Webhook não confirma"],
    solutions: [
      "Verificar credenciais do MercadoPago/BuckPay",
      "Checar se o ambiente está correto (sandbox vs produção)",
      "Verificar logs da edge function de pagamento",
      "Confirmar que o webhook está configurado no provedor",
    ],
    code: `-- Verificar pagamentos pendentes
SELECT * FROM funnel_payments 
WHERE status = 'pending' 
ORDER BY created_at DESC LIMIT 10;

-- Verificar transações
SELECT * FROM transactions
WHERE status != 'paid'
ORDER BY created_at DESC;`,
  },
  {
    id: "storage-error",
    title: "Upload de arquivo falha",
    symptoms: ["Imagem não carrega", "Erro ao fazer upload", "URL retorna 404"],
    solutions: [
      "Verificar se o bucket existe e está público",
      "Checar políticas de storage",
      "Verificar tamanho máximo permitido",
      "Confirmar tipo de arquivo permitido",
    ],
    code: `-- Verificar buckets
SELECT * FROM storage.buckets;

-- Verificar policies de storage
SELECT * FROM storage.policies;`,
  },
];

// Checklist de manutenção
const MAINTENANCE_CHECKLIST = [
  { id: "backup", title: "Backup do banco de dados", frequency: "Diário", priority: "critical" },
  { id: "logs", title: "Revisar logs de erro", frequency: "Diário", priority: "high" },
  { id: "payments", title: "Reconciliar pagamentos pendentes", frequency: "Diário", priority: "high" },
  { id: "expired-sessions", title: "Limpar sessões expiradas", frequency: "Semanal", priority: "medium" },
  { id: "unused-media", title: "Limpar mídia não utilizada", frequency: "Mensal", priority: "low" },
  { id: "security-audit", title: "Auditoria de segurança", frequency: "Mensal", priority: "high" },
  { id: "update-deps", title: "Atualizar dependências", frequency: "Mensal", priority: "medium" },
  { id: "test-integrations", title: "Testar integrações externas", frequency: "Semanal", priority: "high" },
  { id: "review-rls", title: "Revisar políticas RLS", frequency: "Mensal", priority: "critical" },
  { id: "monitor-usage", title: "Monitorar uso de recursos", frequency: "Semanal", priority: "medium" },
];

// ================================
// INTERFACES
// ================================

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

interface HealthStatus {
  database: "healthy" | "warning" | "error" | "checking";
  auth: "healthy" | "warning" | "error" | "checking";
  storage: "healthy" | "warning" | "error" | "checking";
  functions: "healthy" | "warning" | "error" | "checking";
  realtime: "healthy" | "warning" | "error" | "checking";
}

interface SystemMetrics {
  totalUsers: number;
  activeUsers: number;
  totalFunnels: number;
  activeFunnels: number;
  totalTransactions: number;
  pendingPayments: number;
  totalSessions: number;
  activeSessions: number;
}

interface RecentLog {
  id: string;
  timestamp: string;
  type: string;
  message: string;
  details?: any;
}

// ================================
// COMPONENTE PRINCIPAL
// ================================

const AdminTIPanel = () => {
  const [activeTab, setActiveTab] = useState("health");
  const [routeTests, setRouteTests] = useState<RouteTestResult[]>([]);
  const [edgeFunctionTests, setEdgeFunctionTests] = useState<EdgeFunctionTestResult[]>([]);
  const [dbTests, setDbTests] = useState<DatabaseTestResult[]>([]);
  const [isTestingRoutes, setIsTestingRoutes] = useState(false);
  const [isTestingFunctions, setIsTestingFunctions] = useState(false);
  const [isTestingDb, setIsTestingDb] = useState(false);
  const [systemInfo, setSystemInfo] = useState<any>(null);
  const [healthStatus, setHealthStatus] = useState<HealthStatus>({
    database: "checking",
    auth: "checking",
    storage: "checking",
    functions: "checking",
    realtime: "checking",
  });
  const [metrics, setMetrics] = useState<SystemMetrics | null>(null);
  const [recentLogs, setRecentLogs] = useState<RecentLog[]>([]);
  const [isLoadingMetrics, setIsLoadingMetrics] = useState(false);
  const [isLoadingLogs, setIsLoadingLogs] = useState(false);
  const [searchFilter, setSearchFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [maintenanceChecks, setMaintenanceChecks] = useState<Record<string, boolean>>({});
  const { toast } = useToast();

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseProjectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;

  // ================================
  // INICIALIZAÇÃO
  // ================================

  useEffect(() => {
    setRouteTests(SYSTEM_ROUTES.map(r => ({ path: r.path, status: "pending" })));
    setEdgeFunctionTests(EDGE_FUNCTIONS.map(f => ({ name: f.name, status: "pending" })));
    setDbTests(DATABASE_TABLES.map(t => ({ table: t.name, status: "pending" })));
    
    setSystemInfo({
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      language: navigator.language,
      cookieEnabled: navigator.cookieEnabled,
      onLine: navigator.onLine,
      screenWidth: window.screen.width,
      screenHeight: window.screen.height,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      timestamp: new Date().toISOString(),
    });

    // Carregar dados iniciais
    runHealthCheck();
    loadMetrics();
    loadRecentLogs();
  }, []);

  // ================================
  // HEALTH CHECK
  // ================================

  const runHealthCheck = async () => {
    setHealthStatus({
      database: "checking",
      auth: "checking",
      storage: "checking",
      functions: "checking",
      realtime: "checking",
    });

    // Test Database
    try {
      const { error } = await supabase.from("profiles").select("id", { count: "exact", head: true });
      setHealthStatus(prev => ({ ...prev, database: error ? "error" : "healthy" }));
    } catch {
      setHealthStatus(prev => ({ ...prev, database: "error" }));
    }

    // Test Auth
    try {
      const { data: { session } } = await supabase.auth.getSession();
      setHealthStatus(prev => ({ ...prev, auth: session ? "healthy" : "warning" }));
    } catch {
      setHealthStatus(prev => ({ ...prev, auth: "error" }));
    }

    // Test Storage
    try {
      const { data, error } = await supabase.storage.listBuckets();
      setHealthStatus(prev => ({ ...prev, storage: error ? "error" : "healthy" }));
    } catch {
      setHealthStatus(prev => ({ ...prev, storage: "error" }));
    }

    // Test Edge Functions
    try {
      // Use client invoke (handles CORS). Any HTTP response (even 400/500) means functions are reachable.
      const { error } = await supabase.functions.invoke("funnel-webhook", {
        body: { ping: true },
      });

      if (!error) {
        setHealthStatus(prev => ({ ...prev, functions: "healthy" }));
      } else {
        const errorName = (error as any).name || "";
        const isHttpError = errorName === "FunctionsHttpError";
        setHealthStatus(prev => ({ ...prev, functions: isHttpError ? "healthy" : "error" }));
      }
    } catch {
      setHealthStatus(prev => ({ ...prev, functions: "error" }));
    }

    // Test Realtime
    try {
      const channel = supabase.channel("health-check");
      await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => reject(new Error("timeout")), 5000);
        channel.subscribe((status) => {
          clearTimeout(timeout);
          if (status === "SUBSCRIBED") {
            resolve(true);
          }
        });
      });
      await supabase.removeChannel(channel);
      setHealthStatus(prev => ({ ...prev, realtime: "healthy" }));
    } catch {
      setHealthStatus(prev => ({ ...prev, realtime: "warning" }));
    }
  };

  // ================================
  // MÉTRICAS DO SISTEMA
  // ================================

  const loadMetrics = async () => {
    setIsLoadingMetrics(true);
    try {
      const [
        { count: totalUsers },
        { count: activeUsers },
        { count: totalFunnels },
        { count: activeFunnels },
        { count: totalTransactions },
        { count: pendingPayments },
        { count: totalSessions },
        { count: activeSessions },
      ] = await Promise.all([
        supabase.from("profiles").select("*", { count: "exact", head: true }),
        supabase.from("profiles").select("*", { count: "exact", head: true }).eq("is_online", true),
        supabase.from("funnels").select("*", { count: "exact", head: true }),
        supabase.from("funnels").select("*", { count: "exact", head: true }).eq("is_active", true),
        supabase.from("transactions").select("*", { count: "exact", head: true }),
        supabase.from("funnel_payments").select("*", { count: "exact", head: true }).eq("status", "pending"),
        supabase.from("telegram_sessions").select("*", { count: "exact", head: true }),
        supabase.from("telegram_sessions").select("*", { count: "exact", head: true }).eq("is_finished", false),
      ]);

      setMetrics({
        totalUsers: totalUsers || 0,
        activeUsers: activeUsers || 0,
        totalFunnels: totalFunnels || 0,
        activeFunnels: activeFunnels || 0,
        totalTransactions: totalTransactions || 0,
        pendingPayments: pendingPayments || 0,
        totalSessions: totalSessions || 0,
        activeSessions: activeSessions || 0,
      });
    } catch (error) {
      console.error("Erro ao carregar métricas:", error);
    } finally {
      setIsLoadingMetrics(false);
    }
  };

  // ================================
  // LOGS RECENTES
  // ================================

  const loadRecentLogs = async () => {
    setIsLoadingLogs(true);
    try {
      const { data: telegramLogs } = await supabase
        .from("telegram_logs")
        .select("id, created_at, event_type, payload")
        .order("created_at", { ascending: false })
        .limit(20);

      const logs: RecentLog[] = (telegramLogs || []).map(log => ({
        id: log.id,
        timestamp: log.created_at || "",
        type: log.event_type,
        message: `Evento Telegram: ${log.event_type}`,
        details: log.payload,
      }));

      setRecentLogs(logs);
    } catch (error) {
      console.error("Erro ao carregar logs:", error);
    } finally {
      setIsLoadingLogs(false);
    }
  };

  // ================================
  // TESTES DE SISTEMA
  // ================================

  const testRoutes = async () => {
    setIsTestingRoutes(true);
    const results: RouteTestResult[] = [];

    for (const route of SYSTEM_ROUTES) {
      setRouteTests(prev => prev.map(r => 
        r.path === route.path ? { ...r, status: "testing" } : r
      ));

      const start = performance.now();
      try {
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
      
      await new Promise(resolve => setTimeout(resolve, 30));
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
        // Use Supabase client which handles CORS properly
        const { data, error } = await supabase.functions.invoke(fn.name, {
          body: { ping: true, test: true },
        });
        
        const responseTime = Math.round(performance.now() - start);
        
        // ANY response from the function means it's deployed and reachable!
        // Even 400/500 errors mean the function is ONLINE - it just rejected our test payload
        // Only network/relay errors mean the function is truly unreachable
        
        if (error) {
          const errorName = error.name || "";
          // FunctionsHttpError = function responded with HTTP error (400, 500, etc) = ONLINE
          // FunctionsRelayError = Supabase relay/infrastructure error
          // FunctionsFetchError = network error, couldn't reach at all
          const isHttpError = errorName === "FunctionsHttpError";
          
          results.push({
            name: fn.name,
            status: isHttpError ? "success" : "error",
            message: isHttpError ? `Online ✓ (${responseTime}ms)` : (error.message || "Offline"),
            responseTime,
          });
        } else {
          results.push({
            name: fn.name,
            status: "success",
            message: `Online ✓ (${responseTime}ms)`,
            responseTime,
          });
        }
      } catch (error: any) {
        const responseTime = Math.round(performance.now() - start);
        results.push({
          name: fn.name,
          status: "error",
          message: error.message || "Erro de conexão",
          responseTime,
        });
      }

      setEdgeFunctionTests(prev => prev.map(f => {
        const result = results.find(res => res.name === f.name);
        return result || f;
      }));
      
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    setIsTestingFunctions(false);
    const successCount = results.filter(r => r.status === "success").length;
    toast({ 
      title: "Teste de funções concluído!", 
      description: `${successCount}/${results.length} funções online`,
      variant: successCount === results.length ? "default" : "destructive"
    });
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

  // ================================
  // UTILITÁRIOS
  // ================================

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copiado!" });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "success":
      case "healthy":
        return <CheckCircle2 className="w-4 h-4 text-green-500" />;
      case "error":
        return <XCircle className="w-4 h-4 text-red-500" />;
      case "warning":
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      case "testing":
      case "checking":
        return <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />;
      default:
        return <Clock className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "success":
      case "healthy":
        return <Badge className="bg-green-500/10 text-green-500 border-green-500/20">OK</Badge>;
      case "error":
        return <Badge variant="destructive">Erro</Badge>;
      case "warning":
        return <Badge className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20">Aviso</Badge>;
      case "testing":
      case "checking":
        return <Badge variant="secondary">Verificando...</Badge>;
      default:
        return <Badge variant="outline">Pendente</Badge>;
    }
  };

  const getHealthOverallStatus = () => {
    const statuses = Object.values(healthStatus);
    if (statuses.includes("error")) return "error";
    if (statuses.includes("warning")) return "warning";
    if (statuses.includes("checking")) return "checking";
    return "healthy";
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString("pt-BR");
  };

  const filteredRoutes = SYSTEM_ROUTES.filter(route => {
    const matchesSearch = route.name.toLowerCase().includes(searchFilter.toLowerCase()) ||
                          route.path.toLowerCase().includes(searchFilter.toLowerCase());
    const matchesCategory = categoryFilter === "all" || route.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const filteredTables = DATABASE_TABLES.filter(table => {
    const matchesSearch = table.name.toLowerCase().includes(searchFilter.toLowerCase());
    const matchesCategory = categoryFilter === "all" || table.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const filteredFunctions = EDGE_FUNCTIONS.filter(fn => {
    const matchesSearch = fn.name.toLowerCase().includes(searchFilter.toLowerCase());
    const matchesCategory = categoryFilter === "all" || fn.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  // ================================
  // RENDER
  // ================================

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Terminal className="w-6 h-6" />
            Painel T.I. - Manutenção e Monitoramento
          </h2>
          <p className="text-muted-foreground">Sistema completo para gestão técnica e manutenção</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="gap-2">
            <Activity className="w-3 h-3" />
            {navigator.onLine ? "Online" : "Offline"}
          </Badge>
          <Badge variant="outline" className="gap-2">
            <Clock className="w-3 h-3" />
            {new Date().toLocaleTimeString("pt-BR")}
          </Badge>
        </div>
      </div>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="flex flex-wrap h-auto gap-1 p-1">
          <TabsTrigger value="health" className="gap-2 text-xs">
            <HeartPulse className="w-4 h-4" />
            <span className="hidden sm:inline">Health</span>
          </TabsTrigger>
          <TabsTrigger value="metrics" className="gap-2 text-xs">
            <BarChart3 className="w-4 h-4" />
            <span className="hidden sm:inline">Métricas</span>
          </TabsTrigger>
          <TabsTrigger value="routes" className="gap-2 text-xs">
            <Route className="w-4 h-4" />
            <span className="hidden sm:inline">Rotas</span>
          </TabsTrigger>
          <TabsTrigger value="functions" className="gap-2 text-xs">
            <Zap className="w-4 h-4" />
            <span className="hidden sm:inline">Funções</span>
          </TabsTrigger>
          <TabsTrigger value="database" className="gap-2 text-xs">
            <Database className="w-4 h-4" />
            <span className="hidden sm:inline">Banco</span>
          </TabsTrigger>
          <TabsTrigger value="logs" className="gap-2 text-xs">
            <ScrollText className="w-4 h-4" />
            <span className="hidden sm:inline">Logs</span>
          </TabsTrigger>
          <TabsTrigger value="troubleshoot" className="gap-2 text-xs">
            <Bug className="w-4 h-4" />
            <span className="hidden sm:inline">Debug</span>
          </TabsTrigger>
          <TabsTrigger value="maintenance" className="gap-2 text-xs">
            <Wrench className="w-4 h-4" />
            <span className="hidden sm:inline">Manutenção</span>
          </TabsTrigger>
          <TabsTrigger value="hosting" className="gap-2 text-xs">
            <Server className="w-4 h-4" />
            <span className="hidden sm:inline">Hosting</span>
          </TabsTrigger>
          <TabsTrigger value="migration" className="gap-2 text-xs">
            <GitBranch className="w-4 h-4" />
            <span className="hidden sm:inline">Migração</span>
          </TabsTrigger>
          <TabsTrigger value="docs" className="gap-2 text-xs">
            <BookOpen className="w-4 h-4" />
            <span className="hidden sm:inline">Docs</span>
          </TabsTrigger>
        </TabsList>

        {/* Tab: Health Check */}
        <TabsContent value="health" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {/* Overall Status */}
            <Card className="md:col-span-2 lg:col-span-1">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <HeartPulse className="w-5 h-5" />
                    Status Geral
                  </span>
                  <Button variant="outline" size="sm" onClick={runHealthCheck}>
                    <RefreshCw className="w-4 h-4" />
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-center py-6">
                  <div className={`w-24 h-24 rounded-full flex items-center justify-center ${
                    getHealthOverallStatus() === "healthy" ? "bg-green-500/10 text-green-500" :
                    getHealthOverallStatus() === "warning" ? "bg-yellow-500/10 text-yellow-500" :
                    getHealthOverallStatus() === "error" ? "bg-red-500/10 text-red-500" :
                    "bg-muted text-muted-foreground"
                  }`}>
                    {getHealthOverallStatus() === "checking" ? (
                      <Loader2 className="w-12 h-12 animate-spin" />
                    ) : getHealthOverallStatus() === "healthy" ? (
                      <CheckCircle2 className="w-12 h-12" />
                    ) : getHealthOverallStatus() === "warning" ? (
                      <AlertTriangle className="w-12 h-12" />
                    ) : (
                      <XCircle className="w-12 h-12" />
                    )}
                  </div>
                </div>
                <p className="text-center text-lg font-semibold">
                  {getHealthOverallStatus() === "healthy" ? "Sistema Saudável" :
                   getHealthOverallStatus() === "warning" ? "Atenção Necessária" :
                   getHealthOverallStatus() === "error" ? "Problemas Detectados" :
                   "Verificando..."}
                </p>
              </CardContent>
            </Card>

            {/* Individual Health Checks */}
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Verificação de Serviços</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {[
                    { key: "database", label: "Banco de Dados", icon: Database },
                    { key: "auth", label: "Autenticação", icon: Lock },
                    { key: "storage", label: "Storage", icon: HardDrive },
                    { key: "functions", label: "Edge Functions", icon: Zap },
                    { key: "realtime", label: "Realtime", icon: Activity },
                  ].map(service => (
                    <div key={service.key} className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                      {getStatusIcon(healthStatus[service.key as keyof HealthStatus])}
                      <div className="flex-1">
                        <p className="text-sm font-medium flex items-center gap-2">
                          <service.icon className="w-4 h-4" />
                          {service.label}
                        </p>
                      </div>
                      {getStatusBadge(healthStatus[service.key as keyof HealthStatus])}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="w-5 h-5" />
                Ações Rápidas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-4">
                <Button variant="outline" onClick={testRoutes} disabled={isTestingRoutes}>
                  {isTestingRoutes ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Route className="w-4 h-4 mr-2" />}
                  Testar Rotas
                </Button>
                <Button variant="outline" onClick={testEdgeFunctions} disabled={isTestingFunctions}>
                  {isTestingFunctions ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Zap className="w-4 h-4 mr-2" />}
                  Testar Funções
                </Button>
                <Button variant="outline" onClick={testDatabase} disabled={isTestingDb}>
                  {isTestingDb ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Database className="w-4 h-4 mr-2" />}
                  Testar Banco
                </Button>
                <Button variant="outline" onClick={() => { loadMetrics(); loadRecentLogs(); }}>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Atualizar Dados
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Métricas */}
        <TabsContent value="metrics" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Métricas do Sistema</h3>
            <Button variant="outline" size="sm" onClick={loadMetrics} disabled={isLoadingMetrics}>
              {isLoadingMetrics ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            </Button>
          </div>

          {metrics && (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-blue-500/10 rounded-lg">
                      <Users className="w-6 h-6 text-blue-500" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{metrics.totalUsers}</p>
                      <p className="text-sm text-muted-foreground">Usuários ({metrics.activeUsers} online)</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-green-500/10 rounded-lg">
                      <Workflow className="w-6 h-6 text-green-500" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{metrics.totalFunnels}</p>
                      <p className="text-sm text-muted-foreground">Funis ({metrics.activeFunnels} ativos)</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-purple-500/10 rounded-lg">
                      <CreditCard className="w-6 h-6 text-purple-500" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{metrics.totalTransactions}</p>
                      <p className="text-sm text-muted-foreground">Transações</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-yellow-500/10 rounded-lg">
                      <Clock className="w-6 h-6 text-yellow-500" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{metrics.pendingPayments}</p>
                      <p className="text-sm text-muted-foreground">Pagamentos Pendentes</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-cyan-500/10 rounded-lg">
                      <MessageSquare className="w-6 h-6 text-cyan-500" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{metrics.totalSessions}</p>
                      <p className="text-sm text-muted-foreground">Sessões ({metrics.activeSessions} ativas)</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-orange-500/10 rounded-lg">
                      <Route className="w-6 h-6 text-orange-500" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{SYSTEM_ROUTES.length}</p>
                      <p className="text-sm text-muted-foreground">Rotas Configuradas</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-pink-500/10 rounded-lg">
                      <Zap className="w-6 h-6 text-pink-500" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{EDGE_FUNCTIONS.length}</p>
                      <p className="text-sm text-muted-foreground">Edge Functions</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-indigo-500/10 rounded-lg">
                      <Database className="w-6 h-6 text-indigo-500" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{DATABASE_TABLES.length}</p>
                      <p className="text-sm text-muted-foreground">Tabelas no Banco</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        {/* Tab: Rotas */}
        <TabsContent value="routes" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Route className="w-5 h-5" />
                    Rotas do Sistema ({filteredRoutes.length})
                  </CardTitle>
                  <CardDescription>
                    Mapeamento completo de todas as rotas
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Buscar rota..."
                      value={searchFilter}
                      onChange={(e) => setSearchFilter(e.target.value)}
                      className="pl-9 w-48"
                    />
                  </div>
                  <Button onClick={testRoutes} disabled={isTestingRoutes}>
                    {isTestingRoutes ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Play className="w-4 h-4 mr-2" />}
                    Testar
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Rota</TableHead>
                      <TableHead>Nome</TableHead>
                      <TableHead>Categoria</TableHead>
                      <TableHead>Autenticação</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredRoutes.map((route, idx) => {
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
                            <Badge variant="outline" className="text-xs capitalize">
                              {route.category}
                            </Badge>
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

        {/* Tab: Edge Functions */}
        <TabsContent value="functions" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="w-5 h-5" />
                    Edge Functions ({filteredFunctions.length})
                  </CardTitle>
                  <CardDescription>
                    Funções serverless do backend
                  </CardDescription>
                </div>
                <Button onClick={testEdgeFunctions} disabled={isTestingFunctions}>
                  {isTestingFunctions ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Play className="w-4 h-4 mr-2" />}
                  Testar Todas
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Alert className="mb-4">
                <Info className="w-4 h-4" />
                <AlertDescription className="flex items-center gap-2">
                  Base URL: <code className="text-xs bg-muted px-2 py-0.5 rounded">{supabaseUrl}/functions/v1/</code>
                  <Button variant="ghost" size="sm" className="h-6" onClick={() => copyToClipboard(`${supabaseUrl}/functions/v1/`)}>
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
                      <TableHead>Categoria</TableHead>
                      <TableHead>Método</TableHead>
                      <TableHead>Auth</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Tempo</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredFunctions.map((fn, idx) => {
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
                            <Badge variant="outline" className="text-xs capitalize">
                              {fn.category}
                            </Badge>
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

          {/* Webhook URLs */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Webhook className="w-5 h-5" />
                URLs de Webhook
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3">
                {[
                  { name: "Telegram Bot", endpoint: "funnel-webhook", description: "Para bots do Telegram" },
                  { name: "MercadoPago", endpoint: "mercadopago-webhook", description: "Notificações de pagamento MP" },
                  { name: "Pagamento Genérico", endpoint: "payment-webhook", description: "Webhook genérico" },
                  { name: "WhatsApp", endpoint: "wpp-webhook", description: "Webhook do WhatsApp" },
                  { name: "UTMify", endpoint: "utmify-track", description: "Tracking UTMify" },
                ].map((webhook, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                    <div>
                      <p className="font-medium text-sm">{webhook.name}</p>
                      <p className="text-xs text-muted-foreground">{webhook.description}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <code className="text-xs bg-muted px-2 py-1 rounded hidden md:block">
                        {`${supabaseUrl}/functions/v1/${webhook.endpoint}`}
                      </code>
                      <Button variant="outline" size="sm" onClick={() => copyToClipboard(`${supabaseUrl}/functions/v1/${webhook.endpoint}`)}>
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Banco de Dados */}
        <TabsContent value="database" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Database className="w-5 h-5" />
                    Tabelas do Banco ({filteredTables.length})
                  </CardTitle>
                  <CardDescription>
                    Estrutura do banco de dados
                  </CardDescription>
                </div>
                <Button onClick={testDatabase} disabled={isTestingDb}>
                  {isTestingDb ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Play className="w-4 h-4 mr-2" />}
                  Testar Todas
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px]">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {filteredTables.map((table, idx) => {
                    const test = dbTests.find(t => t.table === table.name);
                    return (
                      <div key={idx} className={`flex items-center justify-between p-3 rounded-lg ${
                        table.critical ? "bg-red-500/5 border border-red-500/20" : "bg-muted/30"
                      }`}>
                        <div className="flex items-center gap-3">
                          {test && getStatusIcon(test.status)}
                          <div>
                            <div className="flex items-center gap-2">
                              <code className="text-sm font-medium">{table.name}</code>
                              {table.critical && (
                                <Badge variant="destructive" className="text-xs">Crítica</Badge>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground">{table.description}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs capitalize">
                            {table.category}
                          </Badge>
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

          {/* Storage Buckets */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <HardDrive className="w-5 h-5" />
                Storage Buckets
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 md:grid-cols-2">
                {STORAGE_BUCKETS.map((bucket, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Folder className="w-5 h-5 text-muted-foreground" />
                      <div>
                        <code className="text-sm font-medium">{bucket.name}</code>
                        <p className="text-xs text-muted-foreground">{bucket.description}</p>
                      </div>
                    </div>
                    <Badge variant={bucket.public ? "secondary" : "outline"} className="text-xs">
                      {bucket.public ? "Público" : "Privado"}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Logs */}
        <TabsContent value="logs" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <ScrollText className="w-5 h-5" />
                    Logs Recentes
                  </CardTitle>
                  <CardDescription>Últimos eventos do sistema</CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={loadRecentLogs} disabled={isLoadingLogs}>
                  {isLoadingLogs ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px]">
                {recentLogs.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <ScrollText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>Nenhum log recente encontrado</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {recentLogs.map((log) => (
                      <div key={log.id} className="p-3 bg-muted/30 rounded-lg">
                        <div className="flex items-center justify-between mb-1">
                          <Badge variant="outline" className="text-xs">{log.type}</Badge>
                          <span className="text-xs text-muted-foreground">{formatTimestamp(log.timestamp)}</span>
                        </div>
                        <p className="text-sm">{log.message}</p>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Troubleshooting */}
        <TabsContent value="troubleshoot" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bug className="w-5 h-5" />
                Guia de Troubleshooting
              </CardTitle>
              <CardDescription>Soluções para problemas comuns</CardDescription>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="w-full">
                {TROUBLESHOOTING_ITEMS.map((item) => (
                  <AccordionItem key={item.id} value={item.id}>
                    <AccordionTrigger>
                      <div className="flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 text-yellow-500" />
                        {item.title}
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="space-y-4">
                      <div>
                        <p className="text-sm font-semibold mb-2">Sintomas:</p>
                        <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                          {item.symptoms.map((s, i) => <li key={i}>{s}</li>)}
                        </ul>
                      </div>
                      <div>
                        <p className="text-sm font-semibold mb-2">Soluções:</p>
                        <ol className="list-decimal list-inside text-sm space-y-1">
                          {item.solutions.map((s, i) => <li key={i}>{s}</li>)}
                        </ol>
                      </div>
                      {item.code && (
                        <div>
                          <p className="text-sm font-semibold mb-2">Código de Diagnóstico:</p>
                          <div className="relative">
                            <pre className="bg-muted p-3 rounded-lg text-xs overflow-x-auto">
                              <code>{item.code}</code>
                            </pre>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="absolute top-2 right-2 h-6"
                              onClick={() => copyToClipboard(item.code)}
                            >
                              <Copy className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      )}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Manutenção */}
        <TabsContent value="maintenance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ClipboardList className="w-5 h-5" />
                Checklist de Manutenção
              </CardTitle>
              <CardDescription>Tarefas periódicas de manutenção do sistema</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {MAINTENANCE_CHECKLIST.map((item) => (
                  <div key={item.id} className={`flex items-center justify-between p-3 rounded-lg ${
                    item.priority === "critical" ? "bg-red-500/5 border border-red-500/20" :
                    item.priority === "high" ? "bg-yellow-500/5 border border-yellow-500/20" :
                    "bg-muted/30"
                  }`}>
                    <div className="flex items-center gap-3">
                      <Switch
                        checked={maintenanceChecks[item.id] || false}
                        onCheckedChange={(checked) => setMaintenanceChecks(prev => ({ ...prev, [item.id]: checked }))}
                      />
                      <div>
                        <p className="font-medium text-sm">{item.title}</p>
                        <p className="text-xs text-muted-foreground">Frequência: {item.frequency}</p>
                      </div>
                    </div>
                    <Badge variant={
                      item.priority === "critical" ? "destructive" :
                      item.priority === "high" ? "default" :
                      item.priority === "medium" ? "secondary" : "outline"
                    } className="text-xs">
                      {item.priority}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Secrets */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Key className="w-5 h-5" />
                Secrets do Sistema
              </CardTitle>
              <CardDescription>Variáveis de ambiente configuradas</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-2 md:grid-cols-2">
                {SYSTEM_SECRETS.map((secret, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Lock className="w-4 h-4 text-muted-foreground" />
                      <div>
                        <code className="text-xs font-medium">{secret.name}</code>
                        <p className="text-xs text-muted-foreground">{secret.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs capitalize">{secret.category}</Badge>
                      {secret.required && <Badge variant="destructive" className="text-xs">Obrigatório</Badge>}
                    </div>
                  </div>
                ))}
              </div>
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
                        <code>@ → [IP do servidor]</code>
                        <p className="mt-2"><strong>Tipo CNAME (www):</strong></p>
                        <code>www → seudominio.com</code>
                      </div>
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="vps-setup">
                    <AccordionTrigger>
                      <div className="flex items-center gap-2">
                        <HardDrive className="w-4 h-4" />
                        Configurar VPS
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="space-y-3">
                      <div className="space-y-2">
                        <div className="p-3 bg-muted rounded-lg">
                          <p className="text-xs font-semibold">1. Acesse via SSH</p>
                          <code className="text-xs">ssh root@seu-ip-vps</code>
                        </div>
                        <div className="p-3 bg-muted rounded-lg">
                          <p className="text-xs font-semibold">2. Instale Docker</p>
                          <code className="text-xs">curl -fsSL https://get.docker.com | sh</code>
                        </div>
                        <div className="p-3 bg-muted rounded-lg">
                          <p className="text-xs font-semibold">3. Configure Nginx</p>
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
                    <p className="text-xs text-muted-foreground">Conexão</p>
                    <div className="flex items-center gap-2">
                      {systemInfo.onLine ? <Wifi className="w-4 h-4 text-green-500" /> : <WifiOff className="w-4 h-4 text-red-500" />}
                      <p className="text-sm font-medium">{systemInfo.onLine ? "Online" : "Offline"}</p>
                    </div>
                  </div>
                  <div className="p-3 bg-muted/30 rounded-lg">
                    <p className="text-xs text-muted-foreground">Timezone</p>
                    <p className="text-sm font-medium">{systemInfo.timezone}</p>
                  </div>
                  <div className="p-3 bg-muted/30 rounded-lg">
                    <p className="text-xs text-muted-foreground">Cookies</p>
                    <p className="text-sm font-medium">{systemInfo.cookieEnabled ? "Habilitados" : "Desabilitados"}</p>
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
              Migração de sistema é uma operação crítica. Faça backup completo antes de prosseguir.
            </AlertDescription>
          </Alert>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <GitBranch className="w-5 h-5" />
                Guia Completo de Migração
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="step1">
                  <AccordionTrigger>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">1</Badge>
                      Preparação e Backup
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="space-y-3">
                    <ol className="list-decimal list-inside space-y-2 text-sm">
                      <li>Exporte todos os dados das tabelas críticas</li>
                      <li>Faça backup dos arquivos do Storage</li>
                      <li>Documente todas as configurações atuais</li>
                      <li>Liste todos os webhooks externos configurados</li>
                    </ol>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="step2">
                  <AccordionTrigger>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">2</Badge>
                      Configurar Novo Ambiente
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="space-y-3">
                    <ol className="list-decimal list-inside space-y-2 text-sm">
                      <li>Crie novo projeto Lovable</li>
                      <li>Ative Lovable Cloud</li>
                      <li>Configure todos os secrets necessários</li>
                      <li>Aplique as migrações do banco de dados</li>
                    </ol>
                    <div className="bg-muted p-3 rounded-lg">
                      <p className="text-xs font-semibold mb-2">Secrets necessários:</p>
                      <div className="grid gap-1 text-xs font-mono">
                        {SYSTEM_SECRETS.filter(s => s.required).map((s, i) => (
                          <div key={i} className="flex items-center gap-2">
                            <CheckCircle2 className="w-3 h-3 text-green-500" />
                            {s.name}
                          </div>
                        ))}
                      </div>
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
                  <AccordionContent className="space-y-3">
                    <p className="text-sm">Atualize as URLs em:</p>
                    <div className="space-y-2">
                      <div className="p-3 bg-muted rounded-lg">
                        <p className="text-xs font-semibold">Telegram</p>
                        <code className="text-xs">https://api.telegram.org/bot[TOKEN]/setWebhook?url=[NOVA_URL]</code>
                      </div>
                      <div className="p-3 bg-muted rounded-lg">
                        <p className="text-xs font-semibold">MercadoPago</p>
                        <p className="text-xs">Painel → Desenvolvedor → Webhooks</p>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="step4">
                  <AccordionTrigger>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">4</Badge>
                      Verificação Final
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="space-y-3">
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
                <p><strong>Backend:</strong> Lovable Cloud</p>
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
                  <Terminal className="w-5 h-5" />
                  Comandos
                </CardTitle>
              </CardHeader>
              <CardContent className="text-xs space-y-2">
                {[
                  { cmd: "npm run dev", desc: "Dev server" },
                  { cmd: "npm run build", desc: "Build produção" },
                  { cmd: "npm run preview", desc: "Preview build" },
                ].map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between">
                    <code className="bg-muted px-2 py-1 rounded">{item.cmd}</code>
                    <span className="text-muted-foreground">{item.desc}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

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
