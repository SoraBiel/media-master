import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getPlanById, planCatalog, planIcons } from "@/data/plans";
import { getCurrentUser, updateUser } from "@/lib/userStore";

const BillingPage = () => {
  const [isLoading, setIsLoading] = useState<string | null>(null);
  const navigate = useNavigate();
  const currentUser = getCurrentUser();
  const currentPlan = currentUser?.plan ?? "free";
  const plan = getPlanById(currentPlan);
  const CurrentIcon = planIcons[plan.id];

  const paymentHistory = useMemo(() => {
    return currentUser?.payments ?? [];
  }, [currentUser]);

  const handleSelectPlan = (planId: string) => {
    setIsLoading(planId);
    setTimeout(() => {
      setIsLoading(null);
      if (currentUser) {
        updateUser(currentUser.id, { billingStatus: "checkout" });
      }
      navigate(`/payment?plan=${planId}`);
    }, 300);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Billing & Planos</h1>
          <p className="text-muted-foreground">
            Gerencie sua assinatura e métodos de pagamento.
          </p>
        </div>

        {/* Current Plan Status */}
        <Card className="glass-card border-telegram/30">
          <CardContent className="p-6">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl telegram-gradient flex items-center justify-center">
                  <CurrentIcon className="w-6 h-6 text-white" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-lg">Plano {plan.name}</h3>
                    <Badge className="bg-telegram text-white">Ativo</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Próxima cobrança: {plan.price} em 15/01/2025
                  </p>
                </div>
              </div>
              <Button variant="outline" onClick={() => navigate(`/payment?plan=${currentPlan}`)}>
                Gerenciar Pagamento
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Plans Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {planCatalog.map((planItem, index) => {
            const Icon = planIcons[planItem.id];
            return (
              <motion.div
                key={planItem.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
              >
                <Card
                  className={`glass-card h-full flex flex-col relative ${
                    planItem.popular ? "border-telegram ring-1 ring-telegram/20" : ""
                  } ${currentPlan === planItem.id ? "ring-2 ring-telegram" : ""}`}
                >
                  {planItem.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <span className="px-3 py-1 text-xs font-medium telegram-gradient text-white rounded-full">
                        Mais Popular
                      </span>
                    </div>
                  )}
                  <CardHeader>
                    <div className="flex items-center gap-3 mb-2">
                      <div className={`p-2 rounded-lg ${planItem.popular ? "telegram-gradient" : "bg-secondary"}`}>
                        <Icon className={`w-5 h-5 ${planItem.popular ? "text-white" : "text-foreground"}`} />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{planItem.name}</CardTitle>
                        <CardDescription>{planItem.description}</CardDescription>
                      </div>
                    </div>
                    <div className="mt-2">
                      <span className="text-3xl font-bold">{planItem.price}</span>
                      <span className="text-muted-foreground">{planItem.period}</span>
                    </div>
                  </CardHeader>
                  <CardContent className="flex-1 flex flex-col">
                    <ul className="space-y-2 flex-1">
                      {planItem.features.map((feature) => (
                        <li key={feature} className="flex items-center gap-2 text-sm">
                          <Check className="w-4 h-4 text-telegram flex-shrink-0" />
                          <span>{feature}</span>
                        </li>
                      ))}
                      {planItem.limitations.map((limitation) => (
                        <li key={limitation} className="flex items-center gap-2 text-sm text-muted-foreground">
                          <span className="w-4 h-4 flex items-center justify-center">✕</span>
                          <span>{limitation}</span>
                        </li>
                      ))}
                    </ul>
                    <Button
                      variant={currentPlan === planItem.id ? "secondary" : planItem.popular ? "gradient" : "outline"}
                      className="w-full mt-6"
                      disabled={currentPlan === planItem.id || isLoading !== null}
                      onClick={() => handleSelectPlan(planItem.id)}
                    >
                      {isLoading === planItem.id ? (
                        "Redirecionando..."
                      ) : currentPlan === planItem.id ? (
                        "Plano Atual"
                      ) : (
                        <>
                          Selecionar e pagar
                          <ArrowRight className="w-4 h-4 ml-1" />
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>

        {/* Payment History */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle>Histórico de Pagamentos</CardTitle>
            <CardDescription>Seus pagamentos recentes</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {paymentHistory.length === 0 ? (
                <div className="text-sm text-muted-foreground">Nenhum pagamento registrado ainda.</div>
              ) : (
                paymentHistory.map((payment) => (
                  <div
                    key={payment.id}
                    className="flex items-center justify-between p-4 rounded-lg bg-secondary/50"
                  >
                    <div>
                      <p className="font-medium">{payment.date}</p>
                      <p className="text-sm text-muted-foreground">Plano {payment.plan}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{payment.amount}</p>
                      <Badge variant="secondary" className="text-success">
                        {payment.status}
                      </Badge>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default BillingPage;
