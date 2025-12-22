import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Send, Copy, CheckCircle2, Clock, AlertCircle, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface PixData {
  code: string;
  qrcode_base64: string;
  transaction_id: string;
  external_id: string;
}

const CheckoutPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const { toast } = useToast();

  const productType = searchParams.get("type") || "subscription";
  const productId = searchParams.get("id") || "";
  const planSlug = searchParams.get("plan") || "";

  const [isLoading, setIsLoading] = useState(false);
  const [pixData, setPixData] = useState<PixData | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<"pending" | "paid" | "failed">("pending");
  const [productInfo, setProductInfo] = useState<any>(null);
  const [copied, setCopied] = useState(false);
  const [isValidCheckout, setIsValidCheckout] = useState(true);

  // Validate checkout params and fetch product info
  useEffect(() => {
    const fetchProductInfo = async () => {
      // Check if we have valid checkout params
      const hasValidParams = 
        (productType === "subscription" && planSlug) ||
        (productType === "tiktok_account" && productId) ||
        (productType === "model" && productId);

      if (!hasValidParams) {
        setIsValidCheckout(false);
        toast({
          title: "Checkout inválido",
          description: "Selecione um produto para continuar",
          variant: "destructive",
        });
        navigate("/billing");
        return;
      }

      if (productType === "subscription" && planSlug) {
        const validSlugs = ["free", "basic", "pro", "agency"] as const;
        if (validSlugs.includes(planSlug as any)) {
          const { data } = await supabase
            .from("plans")
            .select("*")
            .eq("slug", planSlug as "free" | "basic" | "pro" | "agency")
            .single();
          setProductInfo(data);
        }
      } else if (productType === "tiktok_account" && productId) {
        const { data } = await supabase
          .from("tiktok_accounts")
          .select("*")
          .eq("id", productId)
          .single();
        setProductInfo(data);
      } else if (productType === "model" && productId) {
        const { data } = await supabase
          .from("models_for_sale")
          .select("*")
          .eq("id", productId)
          .single();
        setProductInfo(data);
      }
    };

    fetchProductInfo();
  }, [productType, productId, planSlug, navigate, toast]);

  const handleGeneratePix = async () => {
    if (!profile?.full_name || !profile?.email) {
      toast({
        title: "Erro",
        description: "Complete seu perfil para continuar",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const response = await supabase.functions.invoke("create-payment", {
        body: {
          product_type: productType,
          product_id: productId || undefined,
          plan_slug: planSlug || undefined,
          buyer: {
            name: profile.full_name,
            email: profile.email,
            phone: profile.phone || undefined,
          },
        },
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      const data = response.data;
      
      if (data.pix) {
        setPixData({
          code: data.pix.code,
          qrcode_base64: data.pix.qrcode_base64,
          transaction_id: data.id,
          external_id: data.external_id,
        });

        startPolling(data.external_id);
      } else if (data.success && productType === "subscription" && planSlug === "free") {
        toast({
          title: "Plano ativado!",
          description: "Seu plano Free foi ativado com sucesso.",
        });
        navigate("/dashboard");
      }
    } catch (error: any) {
      console.error("Error generating PIX:", error);
      toast({
        title: "Erro ao gerar PIX",
        description: error.message || "Tente novamente",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const startPolling = (externalId: string) => {
    const interval = setInterval(async () => {
      try {
        const { data } = await supabase
          .from("transactions")
          .select("status")
          .eq("external_id", externalId)
          .single();

        if (data?.status === "paid") {
          setPaymentStatus("paid");
          clearInterval(interval);
          
          toast({
            title: "Pagamento confirmado!",
            description: "Seu pagamento foi processado com sucesso.",
          });

          setTimeout(() => {
            navigate("/dashboard");
          }, 3000);
        }
      } catch (error) {
        console.error("Error checking payment status:", error);
      }
    }, 5000);

    setTimeout(() => clearInterval(interval), 30 * 60 * 1000);
  };

  const handleCopyPix = async () => {
    if (pixData?.code) {
      await navigator.clipboard.writeText(pixData.code);
      setCopied(true);
      toast({
        title: "Código copiado!",
        description: "Cole no seu app de banco para pagar",
      });
      setTimeout(() => setCopied(false), 3000);
    }
  };

  const formatPrice = (cents: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(cents / 100);
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-lg mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-lg telegram-gradient flex items-center justify-center">
              <Send className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-xl">Checkout</span>
          </div>
        </div>

        {/* Product Info */}
        {productInfo && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card p-6 mb-6"
          >
            <h2 className="text-xl font-semibold mb-2">
              {productType === "subscription" && `Plano ${productInfo.name}`}
              {productType === "tiktok_account" && `@${productInfo.username}`}
              {productType === "model" && productInfo.name}
            </h2>
            <p className="text-muted-foreground mb-4">
              {productType === "subscription" && productInfo.description}
              {productType === "tiktok_account" && `${productInfo.followers?.toLocaleString()} seguidores`}
              {productType === "model" && productInfo.bio}
            </p>
            <div className="text-3xl font-bold gradient-text">
              {formatPrice(productInfo.price_cents)}
            </div>
          </motion.div>
        )}

        {/* User Info Display */}
        {!pixData && profile && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="glass-card p-6"
          >
            <h3 className="text-lg font-semibold mb-4">Seus dados</h3>
            
            <div className="space-y-4 mb-6">
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <span className="text-muted-foreground">Nome</span>
                <span className="font-medium">{profile.full_name || "Não informado"}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <span className="text-muted-foreground">Email</span>
                <span className="font-medium">{profile.email}</span>
              </div>
              {profile.phone && (
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <span className="text-muted-foreground">Telefone</span>
                  <span className="font-medium">{profile.phone}</span>
                </div>
              )}
            </div>

            <Button
              onClick={handleGeneratePix}
              disabled={isLoading}
              className="w-full telegram-gradient text-white"
            >
              {isLoading ? "Gerando PIX..." : productInfo?.price_cents === 0 ? "Ativar Plano Grátis" : "Gerar PIX"}
            </Button>
          </motion.div>
        )}

        {/* PIX Display */}
        {pixData && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card p-6"
          >
            {paymentStatus === "paid" ? (
              <div className="text-center py-8">
                <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-success/20 flex items-center justify-center">
                  <CheckCircle2 className="w-10 h-10 text-success" />
                </div>
                <h3 className="text-2xl font-bold mb-2">Pagamento Confirmado!</h3>
                <p className="text-muted-foreground">
                  Redirecionando para o dashboard...
                </p>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-2 mb-4">
                  <Clock className="w-5 h-5 text-warning" />
                  <span className="text-warning font-medium">Aguardando pagamento</span>
                </div>

                {/* QR Code */}
                <div className="bg-white p-4 rounded-lg mb-4 flex items-center justify-center">
                  <img
                    src={`data:image/png;base64,${pixData.qrcode_base64}`}
                    alt="QR Code PIX"
                    className="w-48 h-48"
                  />
                </div>

                {/* PIX Code */}
                <div className="mb-4">
                  <Label>Código PIX (Copia e Cola)</Label>
                  <div className="flex gap-2 mt-1">
                    <Input
                      value={pixData.code}
                      readOnly
                      className="font-mono text-xs"
                    />
                    <Button
                      onClick={handleCopyPix}
                      variant={copied ? "default" : "outline"}
                      className="shrink-0"
                    >
                      {copied ? (
                        <CheckCircle2 className="w-4 h-4" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </div>

                <div className="flex items-start gap-2 p-4 bg-muted/50 rounded-lg">
                  <AlertCircle className="w-5 h-5 text-muted-foreground shrink-0 mt-0.5" />
                  <p className="text-sm text-muted-foreground">
                    Escaneie o QR Code ou copie o código PIX e cole no seu aplicativo de banco.
                    O pagamento será confirmado automaticamente.
                  </p>
                </div>
              </>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default CheckoutPage;
