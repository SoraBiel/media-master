import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { CheckCircle2, Home, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useSubscription } from "@/hooks/useSubscription";

const ThankYouPage = () => {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { currentPlan, fetchSubscription } = useSubscription();

  useEffect(() => {
    // Refresh subscription data
    fetchSubscription();
  }, []);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="max-w-md w-full text-center"
      >
        {/* Success Icon */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
          className="w-24 h-24 mx-auto mb-6 rounded-full bg-success/20 flex items-center justify-center"
        >
          <CheckCircle2 className="w-12 h-12 text-success" />
        </motion.div>

        {/* Thank You Text */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <h1 className="text-3xl font-bold mb-2">Obrigado pela assinatura!</h1>
          <div className="flex items-center justify-center gap-2 mb-4">
            <Sparkles className="w-5 h-5 text-warning" />
            <p className="text-xl text-muted-foreground">
              {profile?.full_name?.split(" ")[0] || "Usuário"}
            </p>
            <Sparkles className="w-5 h-5 text-warning" />
          </div>
        </motion.div>

        {/* Plan Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="glass-card p-6 mb-6"
        >
          <p className="text-muted-foreground mb-2">Sua assinatura foi ativada com sucesso!</p>
          {currentPlan && (
            <div className="mt-4 p-4 bg-telegram/10 rounded-lg border border-telegram/30">
              <p className="text-lg font-semibold text-telegram">
                Plano {currentPlan.name}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Você agora tem acesso a todos os recursos do seu plano.
              </p>
            </div>
          )}
        </motion.div>

        {/* Features unlocked */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="glass-card p-4 mb-6"
        >
          <p className="font-medium mb-3">O que você pode fazer agora:</p>
          <ul className="text-sm text-muted-foreground space-y-2 text-left">
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-success" />
              Acessar pacotes de mídia premium
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-success" />
              Criar campanhas ilimitadas
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-success" />
              Disparar mídias para seus grupos
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-success" />
              Agendar envios automáticos
            </li>
          </ul>
        </motion.div>

        {/* CTA Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <Button
            onClick={() => navigate("/dashboard")}
            className="w-full telegram-gradient text-white"
            size="lg"
          >
            <Home className="w-5 h-5 mr-2" />
            Ir para o Menu Inicial
          </Button>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default ThankYouPage;
