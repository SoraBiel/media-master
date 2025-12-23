import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Lock, CreditCard, AlertTriangle } from "lucide-react";

interface FeatureBlockedOverlayProps {
  reason: string;
  isExpired?: boolean;
  isSuspended?: boolean;
}

export const FeatureBlockedOverlay = ({
  reason,
  isExpired,
  isSuspended,
}: FeatureBlockedOverlayProps) => {
  const navigate = useNavigate();

  return (
    <div className="fixed inset-0 bg-background/95 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="max-w-md text-center space-y-6">
        <div className={`w-20 h-20 mx-auto rounded-full flex items-center justify-center ${
          isSuspended ? "bg-destructive/20" : "bg-warning/20"
        }`}>
          {isSuspended ? (
            <AlertTriangle className="w-10 h-10 text-destructive" />
          ) : (
            <Lock className="w-10 h-10 text-warning" />
          )}
        </div>
        
        <div className="space-y-2">
          <h2 className="text-2xl font-bold">
            {isSuspended ? "Conta Suspensa" : "Acesso Bloqueado"}
          </h2>
          <p className="text-muted-foreground">{reason}</p>
        </div>

        {isExpired && !isSuspended && (
          <Button
            size="lg"
            variant="gradient"
            onClick={() => navigate("/billing")}
            className="w-full max-w-xs"
          >
            <CreditCard className="w-5 h-5 mr-2" />
            Renovar Plano
          </Button>
        )}

        {isSuspended && (
          <p className="text-sm text-muted-foreground">
            Entre em contato com o suporte para mais informações.
          </p>
        )}
      </div>
    </div>
  );
};
