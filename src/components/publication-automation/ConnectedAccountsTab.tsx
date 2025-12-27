import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, CheckCircle, Link2, Unlink, Twitter, Instagram, Facebook, ExternalLink, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface SocialAccount {
  id: string;
  platform: string;
  account_name: string | null;
  account_username: string | null;
  account_avatar_url: string | null;
  is_connected: boolean;
  last_used_at: string | null;
}

const PLATFORMS_CONFIG = [
  {
    id: "x",
    name: "X (Twitter)",
    icon: Twitter,
    color: "bg-black text-white",
    description: "Poste tweets e threads",
    apiDocs: "https://developer.twitter.com/",
    useDirectToken: true,
  },
  {
    id: "instagram",
    name: "Instagram",
    icon: Instagram,
    color: "bg-gradient-to-br from-purple-600 to-pink-500 text-white",
    description: "Compartilhe fotos e reels",
    apiDocs: "https://developers.facebook.com/docs/instagram-api/",
    useDirectToken: false,
  },
  {
    id: "facebook",
    name: "Facebook",
    icon: Facebook,
    color: "bg-blue-600 text-white",
    description: "Publique em páginas e perfis",
    apiDocs: "https://developers.facebook.com/docs/graph-api/",
    useDirectToken: false,
  },
  {
    id: "threads",
    name: "Threads",
    icon: () => <span className="font-bold text-lg">@</span>,
    color: "bg-black text-white",
    description: "Compartilhe no Threads da Meta",
    apiDocs: "https://developers.facebook.com/docs/threads/",
    useDirectToken: false,
  },
];

const ConnectedAccountsTab = () => {
  const { user } = useAuth();
  const [accounts, setAccounts] = useState<SocialAccount[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [connectingPlatform, setConnectingPlatform] = useState<string | null>(null);

  const fetchAccounts = useCallback(async () => {
    if (!user?.id) return;

    try {
      const { data, error } = await supabase
        .from("social_accounts")
        .select("*")
        .eq("user_id", user.id);

      if (error) throw error;
      setAccounts(data || []);
    } catch (error) {
      console.error("Error fetching accounts:", error);
      toast.error("Erro ao carregar contas");
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  // Handle OAuth callback
  useEffect(() => {
    const handleCallback = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get('code');
      const state = urlParams.get('state');

      if (code && state) {
        try {
          const stateData = JSON.parse(state);
          const platform = stateData.platform;

          setConnectingPlatform(platform);

          const { data, error } = await supabase.functions.invoke('social-oauth', {
            body: {
              action: 'exchange_code',
              platform,
              code,
              redirect_uri: `${window.location.origin}/publication-automation`,
            },
          });

          if (error) throw error;

          if (data.success) {
            toast.success(`Conta ${data.account.name || platform} conectada!`);
            await fetchAccounts();
          } else {
            throw new Error(data.error);
          }

          // Clean URL
          window.history.replaceState({}, '', window.location.pathname);
        } catch (error) {
          console.error('OAuth callback error:', error);
          toast.error('Erro ao conectar conta');
          window.history.replaceState({}, '', window.location.pathname);
        } finally {
          setConnectingPlatform(null);
        }
      }
    };

    handleCallback();
  }, [fetchAccounts]);

  const handleConnect = async (platformId: string) => {
    const platform = PLATFORMS_CONFIG.find(p => p.id === platformId);
    
    if (!platform) return;

    // Twitter/X uses OAuth 1.0a with preconfigured tokens
    if (platform.useDirectToken) {
      toast.info("X/Twitter está configurado via tokens de acesso", {
        description: "Os tokens já foram configurados pelo administrador. O X está pronto para uso.",
      });
      
      // Create a placeholder account entry for Twitter
      try {
        const { error } = await supabase
          .from("social_accounts")
          .upsert({
            user_id: user?.id,
            platform: 'x',
            account_name: 'X (Twitter)',
            is_connected: true,
            last_used_at: new Date().toISOString(),
          }, {
            onConflict: 'user_id,platform'
          });

        if (error) throw error;
        await fetchAccounts();
        toast.success("X/Twitter conectado!");
      } catch (error) {
        console.error('Error connecting Twitter:', error);
        toast.error("Erro ao conectar X/Twitter");
      }
      return;
    }

    // Meta platforms use OAuth 2.0
    setConnectingPlatform(platformId);

    try {
      const { data, error } = await supabase.functions.invoke('social-oauth', {
        body: {
          action: 'get_auth_url',
          platform: platformId,
          redirect_uri: `${window.location.origin}/publication-automation`,
        },
      });

      if (error) throw error;

      if (data.auth_url) {
        window.location.href = data.auth_url;
      } else if (data.error) {
        toast.error(data.error);
        setConnectingPlatform(null);
      }
    } catch (error) {
      console.error("Error getting auth URL:", error);
      toast.error("Erro ao iniciar conexão");
      setConnectingPlatform(null);
    }
  };

  const handleDisconnect = async (accountId: string) => {
    try {
      const { error } = await supabase
        .from("social_accounts")
        .delete()
        .eq("id", accountId);

      if (error) throw error;

      setAccounts(prev => prev.filter(a => a.id !== accountId));
      toast.success("Conta desconectada");
    } catch (error) {
      console.error("Error disconnecting account:", error);
      toast.error("Erro ao desconectar conta");
    }
  };

  const getAccountForPlatform = (platformId: string) => {
    return accounts.find(a => a.platform === platformId && a.is_connected);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Configuração de APIs</AlertTitle>
        <AlertDescription>
          <strong>X/Twitter:</strong> Usa tokens de acesso configurados pelo admin (OAuth 1.0a).
          <br />
          <strong>Meta (Instagram, Facebook, Threads):</strong> Conecte sua conta via OAuth 2.0.
        </AlertDescription>
      </Alert>

      <div className="grid gap-4 md:grid-cols-2">
        {PLATFORMS_CONFIG.map((platform) => {
          const connectedAccount = getAccountForPlatform(platform.id);
          const Icon = platform.icon;
          const isConnecting = connectingPlatform === platform.id;

          return (
            <Card key={platform.id}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${platform.color}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{platform.name}</CardTitle>
                      <CardDescription>{platform.description}</CardDescription>
                    </div>
                  </div>
                  {connectedAccount ? (
                    <Badge variant="default" className="bg-green-500">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Conectado
                    </Badge>
                  ) : (
                    <Badge variant="secondary">
                      Não conectado
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {connectedAccount ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                      {connectedAccount.account_avatar_url && (
                        <img
                          src={connectedAccount.account_avatar_url}
                          alt=""
                          className="w-10 h-10 rounded-full"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">
                          {connectedAccount.account_name || "Conta conectada"}
                        </p>
                        {connectedAccount.account_username && (
                          <p className="text-sm text-muted-foreground truncate">
                            @{connectedAccount.account_username}
                          </p>
                        )}
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      onClick={() => handleDisconnect(connectedAccount.id)}
                      className="w-full text-destructive hover:text-destructive"
                    >
                      <Unlink className="w-4 h-4 mr-2" />
                      Desconectar
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <Button
                      onClick={() => handleConnect(platform.id)}
                      className="w-full"
                      disabled={isConnecting}
                    >
                      {isConnecting ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Link2 className="w-4 h-4 mr-2" />
                      )}
                      {isConnecting ? "Conectando..." : `Conectar ${platform.name}`}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full text-muted-foreground"
                      onClick={() => window.open(platform.apiDocs, "_blank")}
                    >
                      <ExternalLink className="w-3 h-3 mr-1" />
                      Documentação da API
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>Como conectar suas contas</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <h4 className="font-medium flex items-center gap-2">
                <Twitter className="w-4 h-4" /> X (Twitter)
              </h4>
              <p className="text-sm text-muted-foreground">
                O X/Twitter usa OAuth 1.0a com tokens pré-configurados pelo administrador. 
                Clique em "Conectar" para ativar a integração.
              </p>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium flex items-center gap-2">
                <Instagram className="w-4 h-4" /> Meta (Instagram, Facebook, Threads)
              </h4>
              <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
                <li>Clique em "Conectar"</li>
                <li>Faça login na sua conta Meta</li>
                <li>Autorize o acesso às suas páginas</li>
                <li>Pronto! Sua conta está conectada</li>
              </ol>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ConnectedAccountsTab;
