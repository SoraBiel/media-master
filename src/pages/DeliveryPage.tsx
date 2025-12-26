import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Package, Copy, CheckCircle2, ArrowLeft, Eye, EyeOff, AlertCircle, GitBranch, ShoppingBag, Calendar, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface DeliveryData {
  id: string;
  product_type: string;
  product_id: string;
  delivery_data: any;
  delivered_at: string;
  viewed_at: string | null;
  transaction_id: string | null;
}

const DeliveryPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  const deliveryId = searchParams.get("id");
  const transactionId = searchParams.get("transaction");

  // Single delivery view state
  const [delivery, setDelivery] = useState<DeliveryData | null>(null);
  const [productInfo, setProductInfo] = useState<any>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // All deliveries list state
  const [deliveries, setDeliveries] = useState<DeliveryData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Determine mode: single delivery or list
  const isSingleMode = !!(deliveryId || transactionId);

  useEffect(() => {
    if (!user) return;

    if (isSingleMode) {
      fetchSingleDelivery();
    } else {
      fetchAllDeliveries();
    }
  }, [user, deliveryId, transactionId]);

  const fetchAllDeliveries = async () => {
    try {
      const { data, error } = await supabase
        .from("deliveries")
        .select("*")
        .eq("user_id", user!.id)
        .order("delivered_at", { ascending: false });

      if (error) throw error;
      setDeliveries(data || []);
    } catch (error) {
      console.error("Error fetching deliveries:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchSingleDelivery = async () => {
    try {
      let deliveryData: DeliveryData | null = null;

      if (deliveryId) {
        const { data } = await supabase
          .from("deliveries")
          .select("*")
          .eq("id", deliveryId)
          .eq("user_id", user!.id)
          .maybeSingle();
        deliveryData = data;
      } else if (transactionId) {
        const { data } = await supabase
          .from("deliveries")
          .select("*")
          .eq("transaction_id", transactionId)
          .eq("user_id", user!.id)
          .maybeSingle();
        deliveryData = data;
      }

      if (!deliveryData) {
        toast({
          title: "Entrega não encontrada",
          description: "Não foi possível encontrar a entrega.",
          variant: "destructive",
        });
        navigate("/delivery");
        return;
      }

      setDelivery(deliveryData);

      // Mark as viewed
      if (!deliveryData.viewed_at) {
        await supabase
          .from("deliveries")
          .update({ viewed_at: new Date().toISOString() })
          .eq("id", deliveryData.id);
      }

      // Fetch product info
      await fetchProductInfo(deliveryData.product_type, deliveryData.product_id);
    } catch (error) {
      console.error("Error fetching delivery:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchProductInfo = async (productType: string, productId: string) => {
    let data = null;
    
    if (productType === "tiktok_account") {
      const result = await supabase
        .from("tiktok_accounts")
        .select("*")
        .eq("id", productId)
        .maybeSingle();
      data = result.data;
    } else if (productType === "instagram_account") {
      const result = await supabase
        .from("instagram_accounts")
        .select("*")
        .eq("id", productId)
        .maybeSingle();
      data = result.data;
    } else if (productType === "model") {
      const result = await supabase
        .from("models_for_sale")
        .select("*")
        .eq("id", productId)
        .maybeSingle();
      data = result.data;
    } else if (productType === "telegram_group") {
      const result = await supabase
        .from("telegram_groups")
        .select("*")
        .eq("id", productId)
        .maybeSingle();
      data = result.data;
    }
    
    setProductInfo(data);
  };

  const handleCopy = async (value: string, field: string) => {
    await navigator.clipboard.writeText(value);
    setCopiedField(field);
    toast({
      title: "Copiado!",
      description: `${field} copiado para a área de transferência.`,
    });
    setTimeout(() => setCopiedField(null), 2000);
  };

  const getProductTypeName = (type: string) => {
    const names: Record<string, string> = {
      tiktok_account: "Conta TikTok",
      instagram_account: "Conta Instagram",
      model: "Modelo IA",
      telegram_group: "Grupo Telegram",
    };
    return names[type] || type;
  };

  const getProductTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      tiktok_account: "bg-pink-500/20 text-pink-500",
      instagram_account: "bg-purple-500/20 text-purple-500",
      model: "bg-blue-500/20 text-blue-500",
      telegram_group: "bg-cyan-500/20 text-cyan-500",
    };
    return colors[type] || "bg-muted text-muted-foreground";
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      </DashboardLayout>
    );
  }

  // List all deliveries mode
  if (!isSingleMode) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl telegram-gradient flex items-center justify-center">
              <Package className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Minhas Entregas</h1>
              <p className="text-muted-foreground">Produtos que você comprou</p>
            </div>
          </div>

          {deliveries.length === 0 ? (
            <Card className="glass-card">
              <CardContent className="py-16 text-center">
                <ShoppingBag className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-xl font-semibold mb-2">Nenhuma compra ainda</h3>
                <p className="text-muted-foreground mb-6">
                  Quando você comprar um produto, ele aparecerá aqui.
                </p>
                <Button onClick={() => navigate("/accounts")}>
                  Ver Catálogo
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {deliveries.map((item) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <Card 
                    className="glass-card cursor-pointer hover:border-primary/50 transition-colors"
                    onClick={() => navigate(`/delivery?id=${item.id}`)}
                  >
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between mb-4">
                        <Badge className={getProductTypeColor(item.product_type)}>
                          {getProductTypeName(item.product_type)}
                        </Badge>
                        {!item.viewed_at && (
                          <Badge variant="default" className="bg-primary">
                            Novo
                          </Badge>
                        )}
                      </div>
                      
                      <div className="space-y-2">
                        {item.delivery_data?.username && (
                          <h3 className="font-bold text-lg">@{item.delivery_data.username}</h3>
                        )}
                        {item.delivery_data?.name && (
                          <h3 className="font-bold text-lg">{item.delivery_data.name}</h3>
                        )}
                        {item.delivery_data?.group_name && (
                          <h3 className="font-bold text-lg">{item.delivery_data.group_name}</h3>
                        )}
                        
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Calendar className="w-4 h-4" />
                          <span>
                            {format(new Date(item.delivered_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                          </span>
                        </div>
                      </div>

                      <Button 
                        variant="outline" 
                        className="w-full mt-4"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/delivery?id=${item.id}`);
                        }}
                      >
                        <ExternalLink className="w-4 h-4 mr-2" />
                        Ver Detalhes
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </DashboardLayout>
    );
  }

  // Single delivery view
  if (!delivery) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center py-20">
          <AlertCircle className="w-16 h-16 text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold mb-2">Entrega não encontrada</h2>
          <Button onClick={() => navigate("/delivery")}>Ver Todas Entregas</Button>
        </div>
      </DashboardLayout>
    );
  }

  const renderDeliveryContent = () => {
    const data = delivery.delivery_data || {};

    // TikTok Account
    if (delivery.product_type === "tiktok_account" && productInfo) {
      return (
        <div className="space-y-4">
          <div className="p-4 rounded-lg bg-success/10 border border-success/30 text-center">
            <CheckCircle2 className="w-12 h-12 mx-auto text-success mb-2" />
            <h3 className="text-xl font-bold">Compra Confirmada!</h3>
            <p className="text-muted-foreground">Sua conta TikTok está pronta</p>
          </div>

          {productInfo.image_url && (
            <div className="flex justify-center">
              <img
                src={productInfo.image_url}
                alt={productInfo.username}
                className="w-24 h-24 rounded-full object-cover border-4 border-primary"
              />
            </div>
          )}

          <div className="text-center">
            <h2 className="text-2xl font-bold">@{productInfo.username}</h2>
            <p className="text-muted-foreground">{productInfo.followers?.toLocaleString()} seguidores</p>
          </div>

          {renderCredentials(data)}
        </div>
      );
    }

    // Instagram Account
    if (delivery.product_type === "instagram_account" && productInfo) {
      return (
        <div className="space-y-4">
          <div className="p-4 rounded-lg bg-success/10 border border-success/30 text-center">
            <CheckCircle2 className="w-12 h-12 mx-auto text-success mb-2" />
            <h3 className="text-xl font-bold">Compra Confirmada!</h3>
            <p className="text-muted-foreground">Sua conta Instagram está pronta</p>
          </div>

          {productInfo.image_url && (
            <div className="flex justify-center">
              <img
                src={productInfo.image_url}
                alt={productInfo.username}
                className="w-24 h-24 rounded-full object-cover border-4 border-purple-500"
              />
            </div>
          )}

          <div className="text-center">
            <h2 className="text-2xl font-bold">@{productInfo.username}</h2>
            <p className="text-muted-foreground">{productInfo.followers?.toLocaleString()} seguidores</p>
          </div>

          {renderCredentials(data)}
        </div>
      );
    }

    // Model
    if (delivery.product_type === "model" && productInfo) {
      return (
        <div className="space-y-4">
          <div className="p-4 rounded-lg bg-success/10 border border-success/30 text-center">
            <CheckCircle2 className="w-12 h-12 mx-auto text-success mb-2" />
            <h3 className="text-xl font-bold">Compra Confirmada!</h3>
            <p className="text-muted-foreground">Seu modelo está disponível</p>
          </div>

          {productInfo.image_url && (
            <div className="flex justify-center">
              <img
                src={productInfo.image_url}
                alt={productInfo.name}
                className="w-24 h-24 rounded-lg object-cover border-4 border-blue-500"
              />
            </div>
          )}

          <div className="text-center">
            <h2 className="text-2xl font-bold">{productInfo.name}</h2>
            <p className="text-muted-foreground">{productInfo.niche}</p>
          </div>

          {data.funnel_imported && data.funnel_id && (
            <div className="p-4 rounded-lg bg-primary/10 border border-primary/30">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                    <GitBranch className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">Funil Importado!</p>
                    <p className="text-sm text-muted-foreground">
                      Um funil pronto foi adicionado à sua conta
                    </p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate(`/funnels/${data.funnel_id}`)}
                >
                  Abrir Funil
                </Button>
              </div>
            </div>
          )}

          {data.link && (
            <div className="p-4 rounded-lg bg-secondary">
              <p className="text-sm text-muted-foreground mb-2">Link de Acesso</p>
              <div className="flex items-center gap-2">
                <a
                  href={data.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary underline break-all"
                >
                  {data.link}
                </a>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleCopy(data.link, "Link")}
                >
                  {copiedField === "Link" ? (
                    <CheckCircle2 className="w-4 h-4 text-success" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </div>
          )}

          {data.notes && (
            <div className="p-4 rounded-lg bg-muted">
              <p className="text-sm font-medium mb-1">Instruções</p>
              <p className="text-sm whitespace-pre-wrap">{data.notes}</p>
            </div>
          )}
        </div>
      );
    }

    // Telegram Group
    if (delivery.product_type === "telegram_group" && productInfo) {
      return (
        <div className="space-y-4">
          <div className="p-4 rounded-lg bg-success/10 border border-success/30 text-center">
            <CheckCircle2 className="w-12 h-12 mx-auto text-success mb-2" />
            <h3 className="text-xl font-bold">Compra Confirmada!</h3>
            <p className="text-muted-foreground">Seu grupo Telegram está pronto</p>
          </div>

          {productInfo.image_url && (
            <div className="flex justify-center">
              <img
                src={productInfo.image_url}
                alt={productInfo.group_name}
                className="w-24 h-24 rounded-full object-cover border-4 border-cyan-500"
              />
            </div>
          )}

          <div className="text-center">
            <h2 className="text-2xl font-bold">{productInfo.group_name}</h2>
            {productInfo.group_username && (
              <p className="text-muted-foreground">@{productInfo.group_username}</p>
            )}
            <p className="text-sm text-muted-foreground mt-1">
              {productInfo.members_count?.toLocaleString()} membros
            </p>
          </div>

          <div className="space-y-3">
            {data.invite_link && (
              <div className="p-4 rounded-lg bg-secondary">
                <p className="text-sm text-muted-foreground mb-2">Link de Convite</p>
                <div className="flex items-center gap-2">
                  <a
                    href={data.invite_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary underline break-all flex-1"
                  >
                    {data.invite_link}
                  </a>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleCopy(data.invite_link, "Link")}
                  >
                    {copiedField === "Link" ? (
                      <CheckCircle2 className="w-4 h-4 text-success" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>
            )}

            {data.notes && (
              <div className="p-4 rounded-lg bg-warning/10 border border-warning/30">
                <p className="text-sm font-medium text-warning mb-1">Informações Adicionais</p>
                <p className="text-sm whitespace-pre-wrap">{data.notes}</p>
              </div>
            )}
          </div>
        </div>
      );
    }

    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Detalhes da entrega não disponíveis.</p>
      </div>
    );
  };

  const renderCredentials = (data: any) => (
    <div className="space-y-3">
      {data.login && (
        <div className="p-4 rounded-lg bg-secondary">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Login / Email</p>
              <p className="font-mono font-medium">{data.login}</p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleCopy(data.login, "Login")}
            >
              {copiedField === "Login" ? (
                <CheckCircle2 className="w-4 h-4 text-success" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>
      )}

      {data.password && (
        <div className="p-4 rounded-lg bg-secondary">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Senha</p>
              <p className="font-mono font-medium">
                {showPassword ? data.password : "••••••••••"}
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleCopy(data.password, "Senha")}
              >
                {copiedField === "Senha" ? (
                  <CheckCircle2 className="w-4 h-4 text-success" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {data.email && (
        <div className="p-4 rounded-lg bg-secondary">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Email vinculado</p>
              <p className="font-mono font-medium">{data.email}</p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleCopy(data.email, "Email")}
            >
              {copiedField === "Email" ? (
                <CheckCircle2 className="w-4 h-4 text-success" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>
      )}

      {data.notes && (
        <div className="p-4 rounded-lg bg-warning/10 border border-warning/30">
          <p className="text-sm font-medium text-warning mb-1">Informações Adicionais</p>
          <p className="text-sm whitespace-pre-wrap">{data.notes}</p>
        </div>
      )}
    </div>
  );

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/delivery")}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-lg telegram-gradient flex items-center justify-center">
              <Package className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-xl">Detalhes da Entrega</span>
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="glass-card">
            <CardContent className="pt-6">
              {renderDeliveryContent()}
            </CardContent>
          </Card>
        </motion.div>

        <div className="flex justify-center gap-4">
          <Button variant="outline" onClick={() => navigate("/delivery")}>
            Ver Todas Entregas
          </Button>
          <Button onClick={() => navigate("/dashboard")}>
            Ir para Dashboard
          </Button>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default DeliveryPage;
