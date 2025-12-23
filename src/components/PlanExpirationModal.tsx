import { useNavigate } from "react-router-dom";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { AlertTriangle, Clock, CreditCard, XCircle } from "lucide-react";
import { ExpirationWarning } from "@/hooks/usePlanExpiration";

interface PlanExpirationModalProps {
  open: boolean;
  warning: ExpirationWarning;
  planName: string | null;
  daysRemaining: number | null;
  onDismiss: () => void;
}

export const PlanExpirationModal = ({
  open,
  warning,
  planName,
  daysRemaining,
  onDismiss,
}: PlanExpirationModalProps) => {
  const navigate = useNavigate();

  const getWarningConfig = () => {
    switch (warning) {
      case "expired":
        return {
          title: "Plano Expirado!",
          description: `Seu plano ${planName || ""} expirou. Renove agora para continuar usando todas as funcionalidades.`,
          icon: XCircle,
          iconColor: "text-destructive",
          buttonText: "Renovar Agora",
          urgent: true,
        };
      case "24hours":
        return {
          title: "Seu plano expira em menos de 24 horas!",
          description: `Seu plano ${planName || ""} expira em breve. Renove para não perder acesso.`,
          icon: AlertTriangle,
          iconColor: "text-destructive",
          buttonText: "Renovar Agora",
          urgent: true,
        };
      case "2days":
        return {
          title: "Seu plano expira em 2 dias",
          description: `Seu plano ${planName || ""} está prestes a expirar. Renove para continuar sem interrupções.`,
          icon: Clock,
          iconColor: "text-warning",
          buttonText: "Renovar",
          urgent: false,
        };
      case "3days":
        return {
          title: "Seu plano expira em 3 dias",
          description: `Lembrete: seu plano ${planName || ""} expira em ${daysRemaining} dias.`,
          icon: Clock,
          iconColor: "text-warning",
          buttonText: "Ver Planos",
          urgent: false,
        };
      default:
        return null;
    }
  };

  const config = getWarningConfig();
  if (!config) return null;

  const Icon = config.icon;

  return (
    <AlertDialog open={open} onOpenChange={(open) => !open && onDismiss()}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className={`p-3 rounded-full ${config.urgent ? "bg-destructive/10" : "bg-warning/10"}`}>
              <Icon className={`w-6 h-6 ${config.iconColor}`} />
            </div>
            <AlertDialogTitle className="text-xl">{config.title}</AlertDialogTitle>
          </div>
          <AlertDialogDescription className="text-base">
            {config.description}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="gap-2 sm:gap-0">
          {!config.urgent && (
            <AlertDialogCancel onClick={onDismiss}>Lembrar depois</AlertDialogCancel>
          )}
          <AlertDialogAction
            onClick={() => {
              onDismiss();
              navigate("/billing");
            }}
            className={config.urgent ? "bg-destructive hover:bg-destructive/90" : ""}
          >
            <CreditCard className="w-4 h-4 mr-2" />
            {config.buttonText}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
