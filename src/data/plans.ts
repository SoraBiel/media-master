import { Building2, CreditCard, Crown, LucideIcon, Zap } from "lucide-react";

export type PlanId = "free" | "basic" | "pro" | "agency";

export interface PlanDefinition {
  id: PlanId;
  name: string;
  price: string;
  period: string;
  description: string;
  features: string[];
  limitations: string[];
  popular?: boolean;
}

export const planCatalog: PlanDefinition[] = [
  {
    id: "free",
    name: "Free",
    price: "R$0",
    period: "/mês",
    description: "Para testar a plataforma",
    features: [
      "1 destino",
      "100 mídias/mês",
      "Delay mínimo 30s",
      "Suporte por email",
      "Logs básicos",
    ],
    limitations: ["Sem agendamento", "Sem Model Hub", "Sem API"],
  },
  {
    id: "basic",
    name: "Basic",
    price: "R$49",
    period: "/mês",
    description: "Para criadores de conteúdo",
    features: [
      "5 destinos",
      "1.000 mídias/mês",
      "Delay mínimo 10s",
      "Agendamento",
      "Suporte prioritário",
      "Logs completos",
    ],
    limitations: ["Model Hub limitado", "Sem API"],
  },
  {
    id: "pro",
    name: "Pro",
    price: "R$149",
    period: "/mês",
    description: "Para profissionais",
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

export const planIcons: Record<PlanId, LucideIcon> = {
  free: Zap,
  basic: CreditCard,
  pro: Crown,
  agency: Building2,
};

export const getPlanById = (planId: string) =>
  planCatalog.find((plan) => plan.id === planId) ?? planCatalog[2];
