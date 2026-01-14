import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { 
  Shield, 
  Link2, 
  Unlink,
  Globe,
  Fingerprint,
  ArrowRight,
  Cog
} from "lucide-react";

interface Account {
  id: string;
  email?: string;
  display_name?: string | null;
  username?: string;
  status: string;
  proxy_id: string | null;
  context_id: string;
}

interface Proxy {
  id: string;
  name: string;
  host: string;
  port: number;
  is_active: boolean;
}

interface Worker {
  id: string;
  name: string;
  account_id: string;
  proxy_id: string | null;
  status: string;
}

export function MultiloginIsolationTab() {
  const { user } = useAuth();
  const [googleAccounts, setGoogleAccounts] = useState<Account[]>([]);
  const [facebookAccounts, setFacebookAccounts] = useState<Account[]>([]);
  const [instagramAccounts, setInstagramAccounts] = useState<Account[]>([]);
  const [proxies, setProxies] = useState<Proxy[]>([]);
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch all data in parallel
      const [googleRes, facebookRes, instagramRes, proxiesRes, workersRes] = await Promise.all([
        supabase.from("multilogin_google_accounts").select("id, email, display_name, status, proxy_id, context_id"),
        supabase.from("multilogin_facebook_accounts").select("id, email, display_name, status, proxy_id, context_id"),
        supabase.from("multilogin_instagram_accounts").select("id, username, display_name, status, proxy_id, context_id"),
        supabase.from("multilogin_proxies").select("id, name, host, port, is_active"),
        supabase.from("multilogin_workers").select("id, name, account_id, proxy_id, status")
      ]);

      if (googleRes.error) throw googleRes.error;
      if (facebookRes.error) throw facebookRes.error;
      if (instagramRes.error) throw instagramRes.error;
      if (proxiesRes.error) throw proxiesRes.error;
      if (workersRes.error) throw workersRes.error;

      setGoogleAccounts(googleRes.data || []);
      setFacebookAccounts(facebookRes.data || []);
      setInstagramAccounts(instagramRes.data || []);
      setProxies((proxiesRes.data || []).filter(p => p.is_active));
      setWorkers(workersRes.data || []);
    } catch (error: any) {
      console.error("Error fetching data:", error);
      toast.error("Erro ao carregar dados de isolamento");
    } finally {
      setLoading(false);
    }
  };

  const handleLinkProxy = async (accountType: string, accountId: string, proxyId: string | null) => {
    try {
      const table = `multilogin_${accountType}_accounts`;
      const { error } = await supabase
        .from(table as any)
        .update({ proxy_id: proxyId === "none" ? null : proxyId })
        .eq("id", accountId);
      
      if (error) throw error;
      
      toast.success(proxyId === "none" ? "Proxy desvinculado" : "Proxy vinculado com sucesso");
      fetchData();
    } catch (error: any) {
      console.error("Error linking proxy:", error);
      toast.error("Erro ao vincular proxy");
    }
  };

  const getProxyForAccount = (proxyId: string | null) => {
    if (!proxyId) return null;
    return proxies.find(p => p.id === proxyId);
  };

  const getWorkersForAccount = (accountId: string) => {
    return workers.filter(w => w.account_id === accountId);
  };

  const renderAccountIsolation = (
    account: Account,
    type: "google" | "facebook" | "instagram",
    label: string
  ) => {
    const proxy = getProxyForAccount(account.proxy_id);
    const accountWorkers = getWorkersForAccount(account.id);
    
    return (
      <Card key={account.id}>
        <CardContent className="p-4">
          <div className="space-y-4">
            {/* Account Info */}
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Fingerprint className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <div className="font-medium">
                  {account.display_name || account.email || account.username}
                </div>
                <div className="text-xs text-muted-foreground font-mono">
                  Context: {account.context_id.substring(0, 8)}...
                </div>
              </div>
              <Badge variant={account.status === "active" ? "default" : "secondary"}>
                {type}
              </Badge>
            </div>

            {/* Isolation Chain */}
            <div className="flex items-center justify-between gap-2 p-3 rounded-lg bg-muted/50">
              {/* Account */}
              <div className="flex flex-col items-center text-center">
                <div className="p-2 rounded-full bg-background border">
                  <Fingerprint className="h-4 w-4" />
                </div>
                <span className="text-xs mt-1">Conta</span>
              </div>
              
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
              
              {/* Proxy */}
              <div className="flex flex-col items-center text-center">
                <div className={`p-2 rounded-full border ${proxy ? "bg-green-500/10 border-green-500/30" : "bg-muted"}`}>
                  <Globe className={`h-4 w-4 ${proxy ? "text-green-500" : "text-muted-foreground"}`} />
                </div>
                <span className="text-xs mt-1">{proxy ? proxy.name : "Sem proxy"}</span>
              </div>
              
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
              
              {/* Worker */}
              <div className="flex flex-col items-center text-center">
                <div className={`p-2 rounded-full border ${accountWorkers.length > 0 ? "bg-blue-500/10 border-blue-500/30" : "bg-muted"}`}>
                  <Cog className={`h-4 w-4 ${accountWorkers.length > 0 ? "text-blue-500" : "text-muted-foreground"}`} />
                </div>
                <span className="text-xs mt-1">
                  {accountWorkers.length > 0 ? `${accountWorkers.length} worker(s)` : "Sem worker"}
                </span>
              </div>
            </div>

            {/* Proxy Selector */}
            <div className="flex items-center gap-2">
              <Select
                value={account.proxy_id || "none"}
                onValueChange={(value) => handleLinkProxy(type, account.id, value)}
              >
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Selecione um proxy" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">
                    <span className="flex items-center gap-2">
                      <Unlink className="h-4 w-4" />
                      Sem proxy
                    </span>
                  </SelectItem>
                  {proxies.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      <span className="flex items-center gap-2">
                        <Globe className="h-4 w-4" />
                        {p.name} ({p.host}:{p.port})
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  const allAccounts = [
    ...googleAccounts.map(a => ({ ...a, type: "google" as const })),
    ...facebookAccounts.map(a => ({ ...a, type: "facebook" as const })),
    ...instagramAccounts.map(a => ({ ...a, type: "instagram" as const }))
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Isolamento de Contexto
          </h3>
          <p className="text-sm text-muted-foreground">
            Cada conta possui um contexto único com token, proxy e worker isolados
          </p>
        </div>
      </div>

      {/* Info Card */}
      <Card className="bg-blue-500/5 border-blue-500/20">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Shield className="h-5 w-5 text-blue-500 mt-0.5" />
            <div>
              <h4 className="font-medium text-blue-700 dark:text-blue-400">Como funciona o isolamento?</h4>
              <p className="text-sm text-muted-foreground mt-1">
                Cada conta conectada recebe um <strong>Context ID</strong> único. Ao vincular um proxy, 
                todas as requisições dessa conta passarão por aquele IP. Workers associados também 
                herdam essas configurações, garantindo que nenhuma conta compartilhe contexto com outra.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Accounts Grid */}
      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-4 h-48 bg-muted/20" />
            </Card>
          ))}
        </div>
      ) : allAccounts.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <div className="p-4 rounded-full bg-muted mb-4">
              <Shield className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="font-semibold text-lg mb-2">Nenhuma conta para configurar</h3>
            <p className="text-muted-foreground text-sm mb-4">
              Conecte contas na aba "Contas" para configurar o isolamento
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {allAccounts.map((account) => 
            renderAccountIsolation(account, account.type, account.type)
          )}
        </div>
      )}

      {/* Stats */}
      {!loading && allAccounts.length > 0 && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold">{allAccounts.length}</div>
              <div className="text-sm text-muted-foreground">Contas Total</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-green-500">
                {allAccounts.filter(a => a.proxy_id).length}
              </div>
              <div className="text-sm text-muted-foreground">Com Proxy</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold">{proxies.length}</div>
              <div className="text-sm text-muted-foreground">Proxies Ativos</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold">{workers.length}</div>
              <div className="text-sm text-muted-foreground">Workers</div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
