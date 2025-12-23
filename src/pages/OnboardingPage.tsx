import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Send, CheckCircle2, ArrowRight, ArrowLeft, Sparkles, Target, Megaphone, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const steps = [
  {
    id: 1,
    title: "Bem-vindo ao Nexo!",
    description: "Sua plataforma para automação de mídia no Telegram. Vamos configurar sua conta em poucos passos.",
    icon: Send,
  },
  {
    id: 2,
    title: "Conecte seu Telegram",
    description: "Você pode conectar usando um Bot Token (recomendado) ou sua conta pessoal via MTProto.",
    icon: Target,
  },
  {
    id: 3,
    title: "Adicione Destinos",
    description: "Configure os grupos e canais onde você deseja publicar suas mídias automaticamente.",
    icon: Megaphone,
  },
  {
    id: 4,
    title: "Escolha seu Plano",
    description: "Selecione o plano que melhor atende suas necessidades. Você pode começar gratuitamente!",
    icon: CreditCard,
  },
];

const OnboardingPage = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const navigate = useNavigate();
  const { user, refreshProfile } = useAuth();
  const { toast } = useToast();

  const handleComplete = async () => {
    try {
      await supabase
        .from("profiles")
        .update({ onboarding_completed: true })
        .eq("user_id", user?.id);

      await refreshProfile();
      
      toast({
        title: "Configuração concluída!",
        description: "Bem-vindo ao Nexo!",
      });

      navigate("/dashboard");
    } catch (error) {
      console.error("Error completing onboarding:", error);
    }
  };

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = async () => {
    await handleComplete();
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-telegram/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 w-full max-w-2xl"
      >
        <div className="glass-card p-8 md:p-12">
          {/* Progress */}
          <div className="flex items-center justify-between mb-8">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                    index <= currentStep
                      ? "bg-telegram text-white"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {index < currentStep ? (
                    <CheckCircle2 className="w-5 h-5" />
                  ) : (
                    <span>{step.id}</span>
                  )}
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={`w-full h-1 mx-2 rounded transition-all ${
                      index < currentStep ? "bg-telegram" : "bg-muted"
                    }`}
                    style={{ width: "60px" }}
                  />
                )}
              </div>
            ))}
          </div>

          {/* Content */}
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="text-center mb-8"
            >
              <div className="w-20 h-20 mx-auto mb-6 rounded-2xl telegram-gradient flex items-center justify-center">
                {(() => {
                  const IconComponent = steps[currentStep].icon;
                  return <IconComponent className="w-10 h-10 text-white" />;
                })()}
              </div>

              <h2 className="text-2xl md:text-3xl font-bold mb-4">
                {steps[currentStep].title}
              </h2>
              <p className="text-muted-foreground text-lg">
                {steps[currentStep].description}
              </p>
            </motion.div>
          </AnimatePresence>

          {/* Actions */}
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              onClick={handlePrev}
              disabled={currentStep === 0}
              className="gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Anterior
            </Button>

            <Button variant="ghost" onClick={handleSkip} className="text-muted-foreground">
              Pular
            </Button>

            <Button onClick={handleNext} className="gap-2 telegram-gradient text-white">
              {currentStep === steps.length - 1 ? "Começar" : "Próximo"}
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default OnboardingPage;
