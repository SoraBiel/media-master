import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Package, Copy, CheckCircle2, ArrowLeft, Eye, EyeOff, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface DeliveryData {
  id: string;
  product_type: string;
  product_id: string;
  delivery_data: any;
  delivered_at: string;
  viewed_at: string | null;
}

const DeliveryPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  const deliveryId = searchParams.get("id");
  const transactionId = searchParams.get("transaction");

  const [delivery, setDelivery] = useState<DeliveryData | null>(null);
  const [productInfo, setProductInfo] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  useEffect(() => {
    const fetchDelivery = async () => {
      if (!user) {
        navigate("/login");
        return;
      }

      try {
        let deliveryData: DeliveryData | null = null;

        if (deliveryId) {
          const { data } = await supabase
            .from("deliveries")
            .select("*")
            .eq("id", deliveryId)
            .eq("user_id", user.id)
            .maybeSingle();
          deliveryData = data;
        } else if (transactionId) {
          const { data } = await supabase
            .from("deliveries")
            .select("*")
            .eq("transaction_id", transactionId)
            .eq("user_id", user.id)
            .maybeSingle();
          deliveryData = data;
        }

        if (!deliveryData) {
          toast({
            title: "Entrega não encontrada",
            description: "Não foi possível encontrar a entrega.",
            variant: "destructive",
          });
          navigate("/dashboard");
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
        if (deliveryData.product_type === "tiktok_account") {
          const { data } = await supabase
            .from("tiktok_accounts")
            .select("*")
            .eq("id", deliveryData.product_id)
            .maybeSingle();
          setProductInfo(data);
        } else if (deliveryData.product_type === "model") {
          const { data } = await supabase
            .from("models_for_sale")
            .select("*")
            .eq("id", deliveryData.product_id)
            .maybeSingle();
          setProductInfo(data);
        } else if (deliveryData.product_type === "telegram_group") {
          const { data } = await supabase
            .from("telegram_groups")
            .select("*")
            .eq("id", deliveryData.product_id)
            .maybeSingle();
          setProductInfo(data);
        }
      } catch (error) {
        console.error("Error fetching delivery:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDelivery();
  }, [user, deliveryId, transactionId, navigate, toast]);

  const handleCopy = async (value: string, field: string) => {
    await navigator.clipboard.writeText(value);
    setCopiedField(field);
    toast({
      title: "Copiado!",
      description: `${field} copiado para a área de transferência.`,
    });
    setTimeout(() => setCopiedField(null), 2000);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!delivery) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold mb-2">Entrega não encontrada</h2>
          <Button onClick={() => navigate("/dashboard")}>Voltar ao Dashboard</Button>
        </div>
      </div>
    );
  }

  const renderDeliveryContent = () => {
    const data = delivery.delivery_data || {};

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
        </div>
      );
    }

    if (delivery.product_type === "model" && productInfo) {
      return (
        <div className="space-y-4">
          <div className="p-4 rounded-lg bg-success/10 border border-success/30 text-center">
            <CheckCircle2 className="w-12 h-12 mx-auto text-success mb-2" />
            <h3 className="text-xl font-bold">Compra Confirmada!</h3>
            <p className="text-muted-foreground">Seu modelo está disponível</p>
          </div>

          <div className="text-center">
            <h2 className="text-2xl font-bold">{productInfo.name}</h2>
            <p className="text-muted-foreground">{productInfo.niche}</p>
          </div>

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
                className="w-24 h-24 rounded-full object-cover border-4 border-primary"
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

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-lg mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-lg telegram-gradient flex items-center justify-center">
              <Package className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-xl">Entrega</span>
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

        <div className="mt-6 text-center">
          <Button variant="outline" onClick={() => navigate("/dashboard")}>
            Ir para Dashboard
          </Button>
        </div>
      </div>
    </div>
  );
};

export default DeliveryPage;
