import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, CreditCard, Zap, Crown, Building2, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

const BillingPage = () => {
  const [currentPlan] = useState("pro");
  const [isLoading, setIsLoading] = useState<string | null>(null);
  const { toast } = useToast();

  const plans = [
    {
      id: "free",
      name: "Free",
      price: "R$0",
      period: "/mês",
      description: "Para testar a plataforma",
      icon: Zap,
      features: [
        "1 destino",
        "100 mídias/mês",
        "Delay mínimo 30s",
        "Suporte por email",
        "Logs básicos",
      ],
      limitations: [
        "Sem agendamento",
        "Sem Model Hub",
        "Sem API",
      ],
    },
    {
      id: "basic",
      name: "Basic",
      price: "R$49",
      period: "/mês",
      description: "Para criadores de conteúdo",
      icon: CreditCard,
      features: [
        "5 destinos",
        "1.000 mídias/mês",
        "Delay mínimo 10s",
        "Agendamento",
        "Suporte prioritário",
        "Logs completos",
      ],
      limitations: [
        "Model Hub limitado",
        "Sem API",
      ],
    },
    {
      id: "pro",
      name: "Pro",
      price: "R$149",
      period: "/mês",
      description: "Para profissionais",
      icon: Crown,
      features: [
        "20 destinos",
        "10.000 mídias/mês",
        "Delay mínimo 5s",
        "Agendamento avançado",
        "Model Hub completo",
        "API access",
        "Suporte 24/7",
        "Auditoria completa",
      ],
      limitations: [],
      popular: true,
    },
    {
      id: "agency",
      name: "Agency",
      price: "R$499",
      period: "/mês",
      description: "Para agências e equipes",
      icon: Building2,
      features: [
        "Destinos ilimitados",
        "Mídias ilimitadas",
        "Delay customizável",
        "Multi-usuários",
        "White label",
        "API ilimitada",
        "Gerente dedicado",
        "SLA garantido",
      ],
      limitations: [],
    },
  ];

  const handleSelectPlan = (planId: string) => {
    setIsLoading(planId);
    setTimeout(() => {
      setIsLoading(null);
      toast({
        title: "Plano atualizado!",
        description: `Você agora está no plano ${planId.charAt(0).toUpperCase() + planId.slice(1)}.`,
      });
    }, 2000);
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
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl telegram-gradient flex items-center justify-center">
                  <Crown className="w-6 h-6 text-white" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-lg">Plano Pro</h3>
                    <Badge className="bg-telegram text-white">Ativo</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Próxima cobrança: R$149 em 15/01/2025
                  </p>
                </div>
              </div>
              <Button variant="outline">
                Gerenciar Pagamento
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Plans Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {plans.map((plan, index) => (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
            >
              <Card
                className={`glass-card h-full flex flex-col relative ${
                  plan.popular ? "border-telegram ring-1 ring-telegram/20" : ""
                } ${currentPlan === plan.id ? "ring-2 ring-telegram" : ""}`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="px-3 py-1 text-xs font-medium telegram-gradient text-white rounded-full">
                      Mais Popular
                    </span>
                  </div>
                )}
                <CardHeader>
                  <div className="flex items-center gap-3 mb-2">
                    <div className={`p-2 rounded-lg ${plan.popular ? "telegram-gradient" : "bg-secondary"}`}>
                      <plan.icon className={`w-5 h-5 ${plan.popular ? "text-white" : "text-foreground"}`} />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{plan.name}</CardTitle>
                      <CardDescription>{plan.description}</CardDescription>
                    </div>
                  </div>
                  <div className="mt-2">
                    <span className="text-3xl font-bold">{plan.price}</span>
                    <span className="text-muted-foreground">{plan.period}</span>
                  </div>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col">
                  <ul className="space-y-2 flex-1">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm">
                        <Check className="w-4 h-4 text-telegram flex-shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                    {plan.limitations.map((limitation, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span className="w-4 h-4 flex items-center justify-center">✕</span>
                        <span>{limitation}</span>
                      </li>
                    ))}
                  </ul>
                  <Button
                    variant={currentPlan === plan.id ? "secondary" : plan.popular ? "gradient" : "outline"}
                    className="w-full mt-6"
                    disabled={currentPlan === plan.id || isLoading !== null}
                    onClick={() => handleSelectPlan(plan.id)}
                  >
                    {isLoading === plan.id ? (
                      "Processando..."
                    ) : currentPlan === plan.id ? (
                      "Plano Atual"
                    ) : (
                      <>
                        Selecionar
                        <ArrowRight className="w-4 h-4 ml-1" />
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Payment History */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle>Histórico de Pagamentos</CardTitle>
            <CardDescription>Seus pagamentos recentes</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { date: "15/12/2024", amount: "R$149,00", status: "Pago", plan: "Pro" },
                { date: "15/11/2024", amount: "R$149,00", status: "Pago", plan: "Pro" },
                { date: "15/10/2024", amount: "R$49,00", status: "Pago", plan: "Basic" },
              ].map((payment, index) => (
                <div
                  key={index}
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
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default BillingPage;
