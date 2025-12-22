import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, CreditCard, Zap, Crown, Building2, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useSubscription } from "@/hooks/useSubscription";

interface Plan {
  id: string;
  name: string;
  slug: string;
  price_cents: number;
  description: string | null;
  features: string[];
  max_destinations: number | null;
  max_media_per_month: number | null;
  has_scheduling: boolean | null;
  has_ai_models: boolean | null;
}

const BillingPage = () => {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { subscription, currentPlan, hasActiveSubscription, getDaysRemaining } = useSubscription();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [isLoading, setIsLoading] = useState<string | null>(null);

  useEffect(() => {
    const fetchPlans = async () => {
      const { data } = await supabase
        .from("plans")
        .select("*")
        .eq("is_active", true)
        .order("price_cents", { ascending: true });
      
      if (data) {
        setPlans(data.map(p => ({
          ...p,
          features: Array.isArray(p.features) ? p.features as string[] : []
        })));
      }
    };
    fetchPlans();
  }, []);

  const handleSelectPlan = (plan: Plan) => {
    setIsLoading(plan.slug);
    navigate(`/checkout?type=subscription&plan=${plan.slug}`);
  };

  const formatPrice = (cents: number) => {
    return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(cents / 100);
  };

  const getIconForPlan = (slug: string) => {
    switch (slug) {
      case "free": return Zap;
      case "basic": return CreditCard;
      case "pro": return Crown;
      case "agency": return Building2;
      default: return Zap;
    }
  };

  const daysRemaining = getDaysRemaining();

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Billing & Planos</h1>
          <p className="text-muted-foreground">Gerencie sua assinatura e métodos de pagamento.</p>
        </div>

        {/* Current Plan Status */}
        {hasActiveSubscription() && currentPlan && (
          <Card className="glass-card border-telegram/30">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl telegram-gradient flex items-center justify-center">
                    <Crown className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-lg">Plano {currentPlan.name}</h3>
                      <Badge className="bg-telegram text-white">Ativo</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {daysRemaining !== null ? `${daysRemaining} dias restantes` : "Assinatura ativa"}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Plans Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {plans.map((plan, index) => {
            const Icon = getIconForPlan(plan.slug);
            const isCurrentPlan = profile?.current_plan === plan.slug;
            const isPopular = plan.slug === "pro";

            return (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
              >
                <Card className={`glass-card h-full flex flex-col relative ${isPopular ? "border-telegram ring-1 ring-telegram/20" : ""} ${isCurrentPlan ? "ring-2 ring-telegram" : ""}`}>
                  {isPopular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <span className="px-3 py-1 text-xs font-medium telegram-gradient text-white rounded-full">Mais Popular</span>
                    </div>
                  )}
                  <CardHeader>
                    <div className="flex items-center gap-3 mb-2">
                      <div className={`p-2 rounded-lg ${isPopular ? "telegram-gradient" : "bg-secondary"}`}>
                        <Icon className={`w-5 h-5 ${isPopular ? "text-white" : "text-foreground"}`} />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{plan.name}</CardTitle>
                        <CardDescription>{plan.description}</CardDescription>
                      </div>
                    </div>
                    <div className="mt-2">
                      <span className="text-3xl font-bold">{formatPrice(plan.price_cents)}</span>
                      <span className="text-muted-foreground">/mês</span>
                    </div>
                  </CardHeader>
                  <CardContent className="flex-1 flex flex-col">
                    <ul className="space-y-2 flex-1">
                      {plan.max_destinations && (
                        <li className="flex items-center gap-2 text-sm">
                          <Check className="w-4 h-4 text-telegram flex-shrink-0" />
                          <span>{plan.max_destinations === 999 ? "Destinos ilimitados" : `${plan.max_destinations} destinos`}</span>
                        </li>
                      )}
                      {plan.max_media_per_month && (
                        <li className="flex items-center gap-2 text-sm">
                          <Check className="w-4 h-4 text-telegram flex-shrink-0" />
                          <span>{plan.max_media_per_month === 999999 ? "Mídias ilimitadas" : `${plan.max_media_per_month.toLocaleString()} mídias/mês`}</span>
                        </li>
                      )}
                      {plan.has_scheduling && (
                        <li className="flex items-center gap-2 text-sm">
                          <Check className="w-4 h-4 text-telegram flex-shrink-0" />
                          <span>Agendamento</span>
                        </li>
                      )}
                      {plan.has_ai_models && (
                        <li className="flex items-center gap-2 text-sm">
                          <Check className="w-4 h-4 text-telegram flex-shrink-0" />
                          <span>Model Hub</span>
                        </li>
                      )}
                      {plan.features.map((feature, i) => (
                        <li key={i} className="flex items-center gap-2 text-sm">
                          <Check className="w-4 h-4 text-telegram flex-shrink-0" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                    <Button
                      variant={isCurrentPlan ? "secondary" : isPopular ? "gradient" : "outline"}
                      className="w-full mt-6"
                      disabled={isCurrentPlan || isLoading !== null}
                      onClick={() => handleSelectPlan(plan)}
                    >
                      {isLoading === plan.slug ? "Carregando..." : isCurrentPlan ? "Plano Atual" : (
                        <>Selecionar<ArrowRight className="w-4 h-4 ml-1" /></>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default BillingPage;
