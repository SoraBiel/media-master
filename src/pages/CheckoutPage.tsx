import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  Send, 
  Copy, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  ArrowLeft, 
  Shield, 
  Sparkles,
  User,
  Mail,
  Phone,
  CreditCard,
  Star,
  Users,
  TrendingUp
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
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

  const [isLoadingProduct, setIsLoadingProduct] = useState(true);
  const [isGeneratingPix, setIsGeneratingPix] = useState(false);
  const [pixData, setPixData] = useState<PixData | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<"pending" | "paid" | "failed">("pending");
  const [productInfo, setProductInfo] = useState<any>(null);
  const [copied, setCopied] = useState(false);
  const [isValidCheckout, setIsValidCheckout] = useState(true);

  // Determine if this is a subscription (BuckPay) or product (Mercado Pago)
  const isSubscription = productType === "subscription";
  const isProduct = ["tiktok_account", "model", "telegram_group", "instagram_account"].includes(productType);

  // Determine payment body based on type
  const getPaymentBody = () => ({
    product_type: productType,
    product_id: productId || undefined,
    plan_slug: planSlug || undefined,
    buyer: {
      name: profile?.full_name,
      email: profile?.email,
      phone: profile?.phone,
    },
  });

  // Validate checkout params and fetch product info
  useEffect(() => {
    const fetchProductInfo = async () => {
      const hasValidParams = 
        (productType === "subscription" && planSlug) ||
        (productType === "tiktok_account" && productId) ||
        (productType === "instagram_account" && productId) ||
        (productType === "model" && productId) ||
        (productType === "telegram_group" && productId);

      if (!hasValidParams) {
        setIsValidCheckout(false);
        setIsLoadingProduct(false);
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
      } else if (productType === "instagram_account" && productId) {
        const { data } = await supabase
          .from("instagram_accounts")
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
      } else if (productType === "telegram_group" && productId) {
        const { data } = await supabase
          .from("telegram_groups")
          .select("*")
          .eq("id", productId)
          .single();
        setProductInfo(data);
      }

      setIsLoadingProduct(false);
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

    if (!profile?.phone) {
      toast({
        title: "Telefone obrigatório",
        description: "Atualize seu perfil com um número de telefone para continuar",
        variant: "destructive",
      });
      return;
    }

    setIsGeneratingPix(true);

    try {
      const functionName = isSubscription ? "create-payment" : "create-product-payment";
      const body = getPaymentBody();

      const { data, error } = await supabase.functions.invoke(functionName, { body });

      if (error) throw new Error(error.message);
      
      if (data.pix) {
        setPixData({
          code: data.pix.code || data.pix.qr_code,
          qrcode_base64: data.pix.qrcode_base64 || data.pix.qr_code_base64,
          transaction_id: data.id?.toString(),
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
      setIsGeneratingPix(false);
    }
  };

  const startPolling = (externalId: string) => {
    const channel = supabase
      .channel(`transaction_${externalId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "transactions",
          filter: `external_id=eq.${externalId}`,
        },
        (payload) => {
          if (payload.new && (payload.new as any).status === "paid") {
            setPaymentStatus("paid");
            supabase.removeChannel(channel);
            
            toast({
              title: "Pagamento confirmado!",
              description: isSubscription 
                ? "Sua assinatura foi ativada com sucesso."
                : "Seu produto está disponível para entrega.",
            });

            setTimeout(() => {
              if (productType === "subscription") {
                navigate("/thank-you");
              } else {
                navigate("/delivery");
              }
            }, 2000);
          }
        }
      )
      .subscribe();

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
          supabase.removeChannel(channel);
          
          toast({
            title: "Pagamento confirmado!",
            description: isSubscription 
              ? "Sua assinatura foi ativada com sucesso."
              : "Seu produto está disponível para entrega.",
          });

          setTimeout(() => {
            if (productType === "subscription") {
              navigate("/thank-you");
            } else {
              navigate("/delivery");
            }
          }, 2000);
        }
      } catch (error) {
        console.error("Error checking payment status:", error);
      }
    }, 5000);

    setTimeout(() => {
      clearInterval(interval);
      supabase.removeChannel(channel);
    }, 30 * 60 * 1000);
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

  const getProductTitle = () => {
    if (!productInfo) return "";
    switch (productType) {
      case "subscription":
        return `Plano ${productInfo.name}`;
      case "tiktok_account":
        return `@${productInfo.username}`;
      case "instagram_account":
        return `@${productInfo.username}`;
      case "model":
        return productInfo.name;
      case "telegram_group":
        return productInfo.group_name;
      default:
        return "";
    }
  };

  const getProductDescription = () => {
    if (!productInfo) return "";
    switch (productType) {
      case "subscription":
        return productInfo.description;
      case "tiktok_account":
        return `${productInfo.followers?.toLocaleString()} seguidores`;
      case "instagram_account":
        return `${productInfo.followers?.toLocaleString()} seguidores`;
      case "model":
        return productInfo.bio;
      case "telegram_group":
        return `${productInfo.members_count?.toLocaleString()} membros`;
      default:
        return "";
    }
  };

  const getProductTypeLabel = () => {
    switch (productType) {
      case "subscription": return "Assinatura";
      case "tiktok_account": return "Conta TikTok";
      case "instagram_account": return "Conta Instagram";
      case "model": return "Modelo Black";
      case "telegram_group": return "Grupo Telegram";
      default: return "Produto";
    }
  };

  const getProductImage = () => {
    if (!productInfo) return null;
    return productInfo.image_url;
  };

  const getProductStats = () => {
    if (!productInfo) return [];
    switch (productType) {
      case "tiktok_account":
        return [
          { label: "Seguidores", value: productInfo.followers?.toLocaleString() || "0", icon: Users },
          { label: "Curtidas", value: productInfo.likes?.toLocaleString() || "0", icon: Star },
        ];
      case "instagram_account":
        return [
          { label: "Seguidores", value: productInfo.followers?.toLocaleString() || "0", icon: Users },
          { label: "Posts", value: productInfo.posts_count?.toLocaleString() || "0", icon: TrendingUp },
        ];
      case "model":
        return [
          { label: "Categoria", value: productInfo.category || "IA", icon: Sparkles },
          { label: "Nicho", value: productInfo.niche || "-", icon: Star },
        ];
      case "telegram_group":
        return [
          { label: "Membros", value: productInfo.members_count?.toLocaleString() || "0", icon: Users },
          { label: "Tipo", value: productInfo.group_type || "Grupo", icon: Star },
        ];
      default:
        return [];
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      {/* Decorative elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-primary/5 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 p-4 md:p-8">
        <div className="max-w-xl mx-auto">
          {/* Header */}
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-4 mb-8"
          >
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="rounded-full">
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shadow-lg shadow-primary/25">
                <CreditCard className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="font-bold text-xl">Checkout</h1>
                <p className="text-xs text-muted-foreground">Finalize sua compra</p>
              </div>
            </div>
          </motion.div>

          {/* Product Card - Premium Design */}
          {productInfo && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-card via-card to-primary/5 border border-border/50 shadow-2xl mb-6"
            >
              {/* Product Image */}
              {getProductImage() && (
                <div className="relative h-48 overflow-hidden">
                  <img 
                    src={getProductImage()} 
                    alt={getProductTitle()}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-card via-transparent to-transparent" />
                  <Badge className="absolute top-4 left-4 bg-primary/90 backdrop-blur-sm">
                    {getProductTypeLabel()}
                  </Badge>
                </div>
              )}

              {!getProductImage() && (
                <div className="pt-6 px-6">
                  <Badge className="bg-primary/90">{getProductTypeLabel()}</Badge>
                </div>
              )}

              <div className="p-6">
                <h2 className="text-2xl font-bold mb-2">{getProductTitle()}</h2>
                <p className="text-muted-foreground mb-4 line-clamp-2">{getProductDescription()}</p>
                
                {/* Stats Grid */}
                {getProductStats().length > 0 && (
                  <div className="grid grid-cols-2 gap-3 mb-6">
                    {getProductStats().map((stat, i) => (
                      <div key={i} className="flex items-center gap-2 p-3 rounded-xl bg-muted/50">
                        <stat.icon className="w-4 h-4 text-primary" />
                        <div>
                          <p className="text-xs text-muted-foreground">{stat.label}</p>
                          <p className="font-semibold text-sm">{stat.value}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Price */}
                <div className="flex items-end justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Valor total</p>
                    <div className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                      {formatPrice(productInfo.price_cents)}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Shield className="w-4 h-4 text-green-500" />
                    <span>Pagamento Seguro</span>
                  </div>
                </div>

                {isProduct && (
                  <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
                    <img 
                      src="https://www.mercadopago.com/favicon.ico" 
                      alt="MP" 
                      className="w-4 h-4" 
                    />
                    <span>Processado pelo Mercado Pago</span>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* Loading State - Generating PIX */}
          {isGeneratingPix && !pixData && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="rounded-3xl bg-card border border-border/50 shadow-xl overflow-hidden"
            >
              <div className="p-8 text-center space-y-4">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
                  className="w-16 h-16 mx-auto rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shadow-lg shadow-primary/25"
                >
                  <CreditCard className="w-8 h-8 text-white" />
                </motion.div>
                <div>
                  <h3 className="font-semibold text-lg">Gerando PIX...</h3>
                  <p className="text-sm text-muted-foreground mt-1">Aguarde, estamos preparando seu pagamento</p>
                </div>
              </div>
            </motion.div>
          )}

          {/* User Info & Payment - Only show if not generating and no PIX yet */}
          {!pixData && profile && !isGeneratingPix && !isLoadingProduct && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="rounded-3xl bg-card border border-border/50 shadow-xl overflow-hidden"
            >
              <div className="p-6 border-b border-border/50 bg-muted/30">
                <h3 className="font-semibold flex items-center gap-2">
                  <User className="w-4 h-4 text-primary" />
                  Dados do comprador
                </h3>
              </div>
              
              <div className="p-6 space-y-3">
                <div className="flex items-center gap-3 p-4 rounded-xl bg-muted/30 border border-border/30">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-muted-foreground">Nome</p>
                    <p className="font-medium">{profile.full_name || "Não informado"}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-4 rounded-xl bg-muted/30 border border-border/30">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Mail className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-muted-foreground">Email</p>
                    <p className="font-medium truncate">{profile.email}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-4 rounded-xl bg-muted/30 border border-border/30">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Phone className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-muted-foreground">Telefone</p>
                    <p className="font-medium">
                      {profile.phone || <span className="text-destructive">Obrigatório - atualize seu perfil</span>}
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-6 pt-0">
                <Button
                  onClick={handleGeneratePix}
                  disabled={isGeneratingPix || !profile.phone}
                  className="w-full h-14 text-lg font-semibold rounded-2xl bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg shadow-primary/25 transition-all"
                >
                  {productInfo?.price_cents === 0 ? (
                    "Ativar Plano Grátis"
                  ) : (
                    <span className="flex items-center gap-2">
                      <Sparkles className="w-5 h-5" />
                      Gerar PIX
                    </span>
                  )}
                </Button>
              </div>
            </motion.div>
          )}

          {/* PIX Display - Premium */}
          {pixData && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="rounded-3xl bg-card border border-border/50 shadow-xl overflow-hidden"
            >
              {paymentStatus === "paid" ? (
                <div className="p-8 text-center">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", delay: 0.2 }}
                    className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center shadow-lg shadow-green-500/30"
                  >
                    <CheckCircle2 className="w-12 h-12 text-white" />
                  </motion.div>
                  <h3 className="text-2xl font-bold mb-2">Pagamento Confirmado!</h3>
                  <p className="text-muted-foreground">
                    {isSubscription ? "Redirecionando para o dashboard..." : "Redirecionando para suas entregas..."}
                  </p>
                </div>
              ) : (
                <>
                  <div className="p-6 border-b border-border/50 bg-gradient-to-r from-amber-500/10 to-orange-500/10">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center">
                        <Clock className="w-5 h-5 text-amber-500" />
                      </div>
                      <div>
                        <p className="font-semibold text-amber-600">Aguardando pagamento</p>
                        <p className="text-xs text-muted-foreground">Escaneie o QR Code ou copie o código</p>
                      </div>
                    </div>
                  </div>

                  <div className="p-6">
                    {/* QR Code */}
                    <div className="bg-white p-6 rounded-2xl mb-6 flex items-center justify-center shadow-inner">
                      {pixData.qrcode_base64 && (
                        <img
                          src={pixData.qrcode_base64.startsWith('data:') 
                            ? pixData.qrcode_base64 
                            : `data:image/png;base64,${pixData.qrcode_base64}`}
                          alt="QR Code PIX"
                          className="w-52 h-52"
                        />
                      )}
                    </div>

                    {/* PIX Code */}
                    <div className="mb-6">
                      <Label className="text-xs text-muted-foreground uppercase tracking-wider">
                        Código PIX (Copia e Cola)
                      </Label>
                      <div className="flex gap-2 mt-2">
                        <Input
                          value={pixData.code}
                          readOnly
                          className="font-mono text-xs h-12 rounded-xl bg-muted/50"
                        />
                        <Button
                          onClick={handleCopyPix}
                          className={`h-12 px-6 rounded-xl transition-all ${
                            copied 
                              ? 'bg-green-500 hover:bg-green-600' 
                              : 'bg-primary hover:bg-primary/90'
                          }`}
                        >
                          {copied ? (
                            <CheckCircle2 className="w-5 h-5" />
                          ) : (
                            <Copy className="w-5 h-5" />
                          )}
                        </Button>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 p-4 bg-muted/30 rounded-xl border border-border/30">
                      <AlertCircle className="w-5 h-5 text-muted-foreground shrink-0 mt-0.5" />
                      <p className="text-sm text-muted-foreground">
                        Abra o app do seu banco, escolha pagar com PIX e escaneie o QR Code ou cole o código.
                        O pagamento é confirmado automaticamente.
                      </p>
                    </div>
                  </div>
                </>
              )}
            </motion.div>
          )}

          {/* Trust Badges */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="mt-6 flex items-center justify-center gap-6 text-xs text-muted-foreground"
          >
            <div className="flex items-center gap-1">
              <Shield className="w-4 h-4 text-green-500" />
              <span>SSL Seguro</span>
            </div>
            <div className="flex items-center gap-1">
              <CheckCircle2 className="w-4 h-4 text-green-500" />
              <span>Dados Protegidos</span>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;