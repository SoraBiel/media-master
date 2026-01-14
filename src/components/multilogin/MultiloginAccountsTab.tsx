import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { 
  Plus, 
  Trash2, 
  RefreshCw, 
  AlertCircle,
  CheckCircle,
  Clock,
  XCircle,
  ExternalLink
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

// Icons for platforms
const GoogleIcon = () => (
  <svg className="h-5 w-5" viewBox="0 0 24 24">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
  </svg>
);

const FacebookIcon = () => (
  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="#1877F2">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
  </svg>
);

const InstagramIcon = () => (
  <svg className="h-5 w-5" viewBox="0 0 24 24">
    <defs>
      <linearGradient id="instagram-gradient" x1="0%" y1="100%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#FFDC80"/>
        <stop offset="25%" stopColor="#F77737"/>
        <stop offset="50%" stopColor="#E1306C"/>
        <stop offset="75%" stopColor="#C13584"/>
        <stop offset="100%" stopColor="#833AB4"/>
      </linearGradient>
    </defs>
    <path fill="url(#instagram-gradient)" d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zM12 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
  </svg>
);

interface GoogleAccount {
  id: string;
  email: string;
  display_name: string | null;
  avatar_url: string | null;
  status: string;
  token_expires_at: string | null;
  last_used_at: string | null;
  created_at: string;
  proxy_id: string | null;
}

interface FacebookAccount {
  id: string;
  facebook_user_id: string;
  email: string | null;
  display_name: string | null;
  avatar_url: string | null;
  status: string;
  business_manager_name: string | null;
  token_expires_at: string | null;
  last_used_at: string | null;
  created_at: string;
  proxy_id: string | null;
}

interface InstagramAccount {
  id: string;
  instagram_id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  status: string;
  page_name: string | null;
  last_used_at: string | null;
  created_at: string;
  proxy_id: string | null;
}

const StatusBadge = ({ status }: { status: string }) => {
  const config = {
    active: { label: "Ativo", icon: CheckCircle, variant: "default" as const },
    expired: { label: "Expirado", icon: Clock, variant: "secondary" as const },
    revoked: { label: "Revogado", icon: XCircle, variant: "destructive" as const },
    error: { label: "Erro", icon: AlertCircle, variant: "destructive" as const },
  };
  
  const { label, icon: Icon, variant } = config[status as keyof typeof config] || config.error;
  
  return (
    <Badge variant={variant} className="flex items-center gap-1">
      <Icon className="h-3 w-3" />
      {label}
    </Badge>
  );
};

export function MultiloginAccountsTab() {
  const { user } = useAuth();
  const [googleAccounts, setGoogleAccounts] = useState<GoogleAccount[]>([]);
  const [facebookAccounts, setFacebookAccounts] = useState<FacebookAccount[]>([]);
  const [instagramAccounts, setInstagramAccounts] = useState<InstagramAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [accountType, setAccountType] = useState("google");

  useEffect(() => {
    if (user) {
      fetchAccounts();
    }
  }, [user]);

  const fetchAccounts = async () => {
    setLoading(true);
    try {
      // Fetch Google accounts
      const { data: google, error: googleError } = await supabase
        .from("multilogin_google_accounts")
        .select("*")
        .order("created_at", { ascending: false });
      
      if (googleError) throw googleError;
      setGoogleAccounts(google || []);

      // Fetch Facebook accounts
      const { data: facebook, error: facebookError } = await supabase
        .from("multilogin_facebook_accounts")
        .select("*")
        .order("created_at", { ascending: false });
      
      if (facebookError) throw facebookError;
      setFacebookAccounts(facebook || []);

      // Fetch Instagram accounts
      const { data: instagram, error: instagramError } = await supabase
        .from("multilogin_instagram_accounts")
        .select("*")
        .order("created_at", { ascending: false });
      
      if (instagramError) throw instagramError;
      setInstagramAccounts(instagram || []);
    } catch (error: any) {
      console.error("Error fetching accounts:", error);
      toast.error("Erro ao carregar contas");
    } finally {
      setLoading(false);
    }
  };

  const handleConnectGoogle = () => {
    toast.info("Configure o Google OAuth no painel de integrações primeiro", {
      description: "Você precisará de um Client ID e Secret do Google Cloud Console"
    });
  };

  const handleConnectFacebook = () => {
    toast.info("Configure o Facebook OAuth primeiro", {
      description: "Você precisará de um App ID e Secret do Meta Developer"
    });
  };

  const handleDisconnect = async (type: string, id: string) => {
    try {
      const table = `multilogin_${type}_accounts`;
      const { error } = await supabase
        .from(table as any)
        .delete()
        .eq("id", id);
      
      if (error) throw error;
      
      toast.success("Conta desconectada com sucesso");
      fetchAccounts();
    } catch (error: any) {
      console.error("Error disconnecting account:", error);
      toast.error("Erro ao desconectar conta");
    }
  };

  const renderAccountCard = (
    account: GoogleAccount | FacebookAccount | InstagramAccount,
    type: "google" | "facebook" | "instagram"
  ) => {
    const Icon = type === "google" ? GoogleIcon : type === "facebook" ? FacebookIcon : InstagramIcon;
    const email = "email" in account ? account.email : ("username" in account ? `@${account.username}` : null);
    
    return (
      <Card key={account.id} className="relative">
        <CardContent className="p-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <Avatar className="h-12 w-12 border-2 border-border">
                <AvatarImage src={account.avatar_url || undefined} />
                <AvatarFallback className="bg-muted">
                  <Icon />
                </AvatarFallback>
              </Avatar>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-foreground">
                    {account.display_name || email}
                  </span>
                  <StatusBadge status={account.status} />
                </div>
                {email && account.display_name && (
                  <p className="text-sm text-muted-foreground">{email}</p>
                )}
                <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                  <span>
                    Conectado em {format(new Date(account.created_at), "dd/MM/yyyy", { locale: ptBR })}
                  </span>
                  {account.last_used_at && (
                    <>
                      <span>•</span>
                      <span>
                        Último uso: {format(new Date(account.last_used_at), "dd/MM HH:mm", { locale: ptBR })}
                      </span>
                    </>
                  )}
                </div>
                {account.proxy_id && (
                  <Badge variant="outline" className="mt-2 text-xs">
                    Proxy vinculado
                  </Badge>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleDisconnect(type, account.id)}
                className="text-destructive hover:text-destructive hover:bg-destructive/10"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      {/* Sub-tabs for account types */}
      <Tabs value={accountType} onValueChange={setAccountType}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="google" className="flex items-center gap-2">
            <GoogleIcon />
            <span>Google ({googleAccounts.length})</span>
          </TabsTrigger>
          <TabsTrigger value="facebook" className="flex items-center gap-2">
            <FacebookIcon />
            <span>Facebook ({facebookAccounts.length})</span>
          </TabsTrigger>
          <TabsTrigger value="instagram" className="flex items-center gap-2">
            <InstagramIcon />
            <span>Instagram ({instagramAccounts.length})</span>
          </TabsTrigger>
        </TabsList>

        {/* Google Accounts */}
        <TabsContent value="google" className="mt-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Contas Google</h3>
              <p className="text-sm text-muted-foreground">
                Conecte contas Google para Google Ads e outras automações
              </p>
            </div>
            <Button onClick={handleConnectGoogle} className="gap-2">
              <Plus className="h-4 w-4" />
              Conectar Google
            </Button>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[1, 2].map((i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-4 h-20 bg-muted/20" />
                </Card>
              ))}
            </div>
          ) : googleAccounts.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <div className="p-4 rounded-full bg-muted mb-4">
                  <GoogleIcon />
                </div>
                <h3 className="font-semibold text-lg mb-2">Nenhuma conta Google conectada</h3>
                <p className="text-muted-foreground text-sm mb-4">
                  Conecte sua conta Google para começar a usar automações
                </p>
                <Button onClick={handleConnectGoogle} variant="outline" className="gap-2">
                  <Plus className="h-4 w-4" />
                  Conectar primeira conta
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-3">
              {googleAccounts.map((account) => renderAccountCard(account, "google"))}
            </div>
          )}
        </TabsContent>

        {/* Facebook Accounts */}
        <TabsContent value="facebook" className="mt-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Contas Facebook</h3>
              <p className="text-sm text-muted-foreground">
                Conecte contas do Facebook Business para gerenciar páginas e anúncios
              </p>
            </div>
            <Button onClick={handleConnectFacebook} className="gap-2">
              <Plus className="h-4 w-4" />
              Conectar Facebook
            </Button>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[1, 2].map((i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-4 h-20 bg-muted/20" />
                </Card>
              ))}
            </div>
          ) : facebookAccounts.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <div className="p-4 rounded-full bg-muted mb-4">
                  <FacebookIcon />
                </div>
                <h3 className="font-semibold text-lg mb-2">Nenhuma conta Facebook conectada</h3>
                <p className="text-muted-foreground text-sm mb-4">
                  Conecte sua conta Facebook para gerenciar páginas e anúncios
                </p>
                <Button onClick={handleConnectFacebook} variant="outline" className="gap-2">
                  <Plus className="h-4 w-4" />
                  Conectar primeira conta
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-3">
              {facebookAccounts.map((account) => renderAccountCard(account, "facebook"))}
            </div>
          )}
        </TabsContent>

        {/* Instagram Accounts */}
        <TabsContent value="instagram" className="mt-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Contas Instagram Business</h3>
              <p className="text-sm text-muted-foreground">
                Vinculadas às suas contas Facebook
              </p>
            </div>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[1, 2].map((i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-4 h-20 bg-muted/20" />
                </Card>
              ))}
            </div>
          ) : instagramAccounts.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <div className="p-4 rounded-full bg-muted mb-4">
                  <InstagramIcon />
                </div>
                <h3 className="font-semibold text-lg mb-2">Nenhuma conta Instagram vinculada</h3>
                <p className="text-muted-foreground text-sm mb-4">
                  Conecte uma conta Facebook primeiro para vincular Instagram Business
                </p>
                <Button onClick={handleConnectFacebook} variant="outline" className="gap-2">
                  <ExternalLink className="h-4 w-4" />
                  Conectar via Facebook
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-3">
              {instagramAccounts.map((account) => renderAccountCard(account, "instagram"))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Refresh button */}
      <div className="flex justify-end">
        <Button variant="outline" onClick={fetchAccounts} className="gap-2">
          <RefreshCw className="h-4 w-4" />
          Atualizar
        </Button>
      </div>
    </div>
  );
}
