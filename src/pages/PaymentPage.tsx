import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { getPlanById } from "@/data/plans";
import {
  getCurrentUser,
  recordPayment,
  updateUser,
} from "@/lib/userStore";
import {
  getMarketplaceItems,
  markMarketplaceItemSold,
  MarketplaceItem,
} from "@/lib/marketplaceStore";
import {
  createBuckPayTransaction,
  getBuckPayTransactionByExternalId,
} from "@/lib/buckpay";

const priceToCents = (price: number | string) => {
  if (typeof price === "number") {
    return Math.round(price * 100);
  }
  const numeric = Number(price.replace(/[^\d,]/g, "").replace(",", "."));
  return Number.isNaN(numeric) ? 0 : Math.round(numeric * 100);
};

const formatCurrency = (value: number | string) => {
  if (typeof value === "number") {
    return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  }
  return value.startsWith("R$") ? value : `R$ ${value}`;
};

const resolveBillingStatus = (planId: string) => (planId === "free" ? "free" : "active");

const PaymentPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const planId = searchParams.get("plan");
  const purchaseType = searchParams.get("type");
  const itemId = searchParams.get("item");
  const currentUser = getCurrentUser();
  const marketplaceItem = useMemo(() => {
    if (!itemId) {
      return null;
    }
    return getMarketplaceItems().find((item) => item.id === itemId) ?? null;
  }, [itemId]);
  const plan = useMemo(() => getPlanById(planId ?? "pro"), [planId]);

  const product = useMemo(() => {
    if (purchaseType && marketplaceItem) {
      return {
        id: marketplaceItem.id,
        name: marketplaceItem.name,
        description: marketplaceItem.description,
        amount: marketplaceItem.price,
        type: purchaseType,
      };
    }
    return {
      id: plan.id,
      name: plan.name,
      description: plan.description,
      amount: plan.price,
      type: "plan",
    };
  }, [marketplaceItem, plan, purchaseType]);

  const [formData, setFormData] = useState({
    name: currentUser?.name ?? "",
    email: currentUser?.email ?? "",
    document: "",
    phone: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [externalId, setExternalId] = useState("");
  const [pixCode, setPixCode] = useState("");
  const [pixQr, setPixQr] = useState("");
  const [transactionStatus, setTransactionStatus] = useState<"pending" | "paid" | "">("");

  useEffect(() => {
    if (purchaseType && !marketplaceItem) {
      toast({
        title: "Item indisponível",
        description: "Esse item não está mais disponível para compra.",
        variant: "destructive",
      });
      navigate("/dashboard");
    }
  }, [marketplaceItem, navigate, purchaseType, toast]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleCreateTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      toast({
        title: "Sessão expirada",
        description: "Entre novamente para concluir o pagamento.",
        variant: "destructive",
      });
      navigate("/login");
      return;
    }

    setIsSubmitting(true);
    try {
      const generatedExternalId = `md_${Date.now()}`;
      const response = await createBuckPayTransaction({
        external_id: generatedExternalId,
        payment_method: "pix",
        amount: priceToCents(product.amount),
        buyer: {
          name: formData.name,
          email: formData.email,
          document: formData.document || undefined,
          phone: formData.phone || undefined,
        },
        product: {
          id: product.id,
          name: product.name,
        },
        offer: {
          id: product.id,
          name: product.name,
          quantity: 1,
        },
      });

      setExternalId(generatedExternalId);
      setPixCode(response.data.pix?.code ?? "");
      setPixQr(response.data.pix?.qrcode_base64 ?? "");
      setTransactionStatus(response.data.status);
      toast({
        title: "PIX gerado",
        description: "Copie o código ou escaneie o QR code para pagar.",
      });
    } catch (error) {
      toast({
        title: "Erro ao gerar PIX",
        description: error instanceof Error ? error.message : "Não foi possível criar a transação.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerifyPayment = async () => {
    if (!externalId) {
      return;
    }
    setIsSubmitting(true);
    try {
      const response = await getBuckPayTransactionByExternalId(externalId);
      setTransactionStatus(response.data.status);
      if (response.data.status === "paid") {
        finalizePurchase(product, marketplaceItem);
      } else {
        toast({
          title: "Pagamento pendente",
          description: "O PIX ainda não foi confirmado. Tente novamente em instantes.",
        });
      }
    } catch (error) {
      toast({
        title: "Erro ao verificar",
        description: error instanceof Error ? error.message : "Não foi possível consultar o pagamento.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const finalizePurchase = (selectedProduct: { id: string; name: string; type: string }, item: MarketplaceItem | null) => {
    if (!currentUser) {
      return;
    }

    recordPayment(
      currentUser.id,
      {
        id: `pay_${Date.now()}`,
        date: new Date().toLocaleDateString("pt-BR"),
        amount: formatCurrency(product.amount),
        status: "Pago",
        plan: selectedProduct.name,
        method: "PIX",
      },
      selectedProduct.type === "plan" ? plan.id : currentUser.plan
    );

    if (selectedProduct.type === "plan") {
      updateUser(currentUser.id, {
        plan: plan.id,
        billingStatus: resolveBillingStatus(plan.id),
      });
    } else {
      updateUser(currentUser.id, {
        billingStatus: resolveBillingStatus(currentUser.plan),
      });
    }

    if (item) {
      markMarketplaceItemSold(item.id);
    }

    toast({
      title: "Pagamento confirmado",
      description: "Compra registrada com sucesso.",
    });
    navigate(selectedProduct.type === "plan" ? "/billing" : "/dashboard");
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Pagamento via PIX</h1>
          <p className="text-muted-foreground">
            Gere o QR code e finalize a compra com PIX.
          </p>
        </div>

        <div className="grid lg:grid-cols-[2fr,1fr] gap-6">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle>Dados do comprador</CardTitle>
              <CardDescription>Esses dados são enviados para a BuckPay.</CardDescription>
            </CardHeader>
            <CardContent>
              <form className="space-y-4" onSubmit={handleCreateTransaction}>
                <div className="space-y-2">
                  <Label htmlFor="name">Nome completo</Label>
                  <Input
                    id="name"
                    name="name"
                    placeholder="Nome do comprador"
                    value={formData.name}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="email@empresa.com"
                    value={formData.email}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="document">CPF</Label>
                    <Input
                      id="document"
                      name="document"
                      placeholder="Somente números"
                      value={formData.document}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Telefone</Label>
                    <Input
                      id="phone"
                      name="phone"
                      placeholder="559999999999"
                      value={formData.phone}
                      onChange={handleChange}
                    />
                  </div>
                </div>
                <Button type="submit" variant="gradient" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? "Gerando PIX..." : "Gerar cobrança PIX"}
                </Button>
              </form>

              {pixCode && (
                <div className="mt-6 space-y-4">
                  <div className="p-4 rounded-lg border border-border bg-secondary/30 space-y-3">
                    <p className="text-sm font-medium">QR Code PIX</p>
                    {pixQr ? (
                      <img
                        src={`data:image/png;base64,${pixQr}`}
                        alt="QR Code Pix"
                        className="w-48 h-48 mx-auto"
                      />
                    ) : null}
                    <Label className="text-xs text-muted-foreground">Código PIX</Label>
                    <Input value={pixCode} readOnly />
                  </div>
                  <Button variant="outline" className="w-full" onClick={handleVerifyPayment} disabled={isSubmitting}>
                    {transactionStatus === "paid" ? "Pagamento confirmado" : "Verificar pagamento"}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="glass-card h-fit">
            <CardHeader>
              <CardTitle>Resumo</CardTitle>
              <CardDescription>{product.type === "plan" ? "Plano selecionado" : "Compra selecionada"}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold">{product.name}</p>
                  <p className="text-sm text-muted-foreground">{product.description}</p>
                </div>
                <Badge className="bg-telegram text-white">PIX</Badge>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span>Valor</span>
                  <span>{formatCurrency(product.amount)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Taxas</span>
                  <span>R$0,00</span>
                </div>
                <div className="border-t border-border pt-2 flex items-center justify-between font-semibold">
                  <span>Total</span>
                  <span>{formatCurrency(product.amount)}</span>
                </div>
              </div>
              <div className="text-xs text-muted-foreground">
                O pagamento é confirmado automaticamente via API da BuckPay.
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default PaymentPage;
