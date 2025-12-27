import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, CheckCircle, Link2, Unlink, Twitter, Instagram, Facebook, ExternalLink } from "lucide-react";
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
    id: "twitter",
    name: "X (Twitter)",
    icon: Twitter,
    color: "bg-black text-white",
    description: "Poste tweets e threads",
    apiDocs: "https://developer.twitter.com/",
  },
  {
    id: "instagram",
    name: "Instagram",
    icon: Instagram,
    color: "bg-gradient-to-br from-purple-600 to-pink-500 text-white",
    description: "Compartilhe fotos e reels",
    apiDocs: "https://developers.facebook.com/docs/instagram-api/",
  },
  {
    id: "facebook",
    name: "Facebook",
    icon: Facebook,
    color: "bg-blue-600 text-white",
    description: "Publique em páginas e perfis",
    apiDocs: "https://developers.facebook.com/docs/graph-api/",
  },
  {
    id: "threads",
    name: "Threads",
    icon: () => <span className="font-bold text-lg">@</span>,
    color: "bg-black text-white",
    description: "Compartilhe no Threads da Meta",
    apiDocs: "https://developers.facebook.com/docs/threads/",
  },
];

const ConnectedAccountsTab = () => {
  const { user } = useAuth();
  const [accounts, setAccounts] = useState<SocialAccount[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchAccounts();
  }, [user?.id]);

  const fetchAccounts = async () => {
    if (!user?.id) return;

    try {
      const { data, error } = await supabase
        .from("social_accounts")
        .select("*")
        .eq("user_id", user.id);

      if (error) throw error;
      setAccounts(data || []);
    } catch (error: any) {
      console.error("Error fetching accounts:", error);
      toast.error("Erro ao carregar contas");
    } finally {
      setIsLoading(false);
    }
  };

  const handleConnect = async (platformId: string) => {
    toast.info("Integração OAuth em desenvolvimento", {
      description: "As integrações com APIs sociais serão implementadas em breve."
    });
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
    } catch (error: any) {
      console.error("Error disconnecting account:", error);
      toast.error("Erro ao desconectar conta");
    }
  };

  const getAccountForPlatform = (platformId: string) => {
    return accounts.find(a => a.platform === platformId && a.is_connected);
  };

  return (
    <div className="space-y-6">
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Integrações em Desenvolvimento</AlertTitle>
        <AlertDescription>
          As integrações OAuth com X, Instagram, Facebook e Threads serão ativadas quando você configurar as credenciais das APIs. 
          Acesse o painel de desenvolvedor de cada plataforma para obter suas chaves.
        </AlertDescription>
      </Alert>

      <div className="grid gap-4 md:grid-cols-2">
        {PLATFORMS_CONFIG.map((platform) => {
          const connectedAccount = getAccountForPlatform(platform.id);
          const Icon = platform.icon;

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
                    >
                      <Link2 className="w-4 h-4 mr-2" />
                      Conectar {platform.name}
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
              <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
                <li>Acesse developer.twitter.com</li>
                <li>Crie um App no Twitter Developer Portal</li>
                <li>Habilite OAuth 2.0</li>
                <li>Configure as permissões de leitura e escrita</li>
              </ol>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium flex items-center gap-2">
                <Instagram className="w-4 h-4" /> Meta (Instagram, Facebook, Threads)
              </h4>
              <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
                <li>Acesse developers.facebook.com</li>
                <li>Crie um App Meta Business</li>
                <li>Configure Instagram Business API</li>
                <li>Vincule sua página do Facebook</li>
              </ol>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ConnectedAccountsTab;
