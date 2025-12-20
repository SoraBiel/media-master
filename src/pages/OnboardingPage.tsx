import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, ArrowRight, Send, CreditCard, MessageCircle, Megaphone } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

const steps = [
  {
    title: "Escolha seu plano",
    description: "Compare recursos e selecione o plano ideal para começar.",
    icon: CreditCard,
    action: "Ir para planos",
    route: "/billing",
  },
  {
    title: "Conecte o Telegram",
    description: "Adicione o bot ou conecte sua conta para começar a publicar.",
    icon: MessageCircle,
    action: "Conectar agora",
    route: "/telegram",
  },
  {
    title: "Crie sua primeira campanha",
    description: "Organize mídias e programe seus envios com segurança.",
    icon: Megaphone,
    action: "Nova campanha",
    route: "/campaigns",
  },
  {
    title: "Acompanhe seus resultados",
    description: "Use o dashboard para monitorar desempenho e alertas.",
    icon: Send,
    action: "Ver dashboard",
    route: "/dashboard",
  },
];

const OnboardingPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Passo a passo inicial</h1>
          <p className="text-muted-foreground">
            Siga as etapas abaixo para configurar sua conta e começar a usar o MediaDrop TG.
          </p>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          {steps.map((step, index) => (
            <Card key={step.title} className="glass-card">
              <CardContent className="p-6 space-y-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-telegram/10 flex items-center justify-center text-telegram">
                      <step.icon className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Etapa {index + 1}</p>
                      <h3 className="text-lg font-semibold">{step.title}</h3>
                    </div>
                  </div>
                  <CheckCircle2 className="w-5 h-5 text-muted-foreground" />
                </div>
                <p className="text-sm text-muted-foreground">{step.description}</p>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    toast({
                      title: "Etapa selecionada",
                      description: `Vamos seguir para: ${step.title}.`,
                    });
                    navigate(step.route);
                  }}
                >
                  {step.action}
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default OnboardingPage;
