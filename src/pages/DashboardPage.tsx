import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Send,
  Target,
  Image,
  Megaphone,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  Plus,
} from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";

const DashboardPage = () => {
  const stats = [
    {
      title: "Envios este mês",
      value: "2,847",
      change: "+12%",
      icon: Send,
      color: "text-telegram",
      bgColor: "bg-telegram/10",
    },
    {
      title: "Destinos ativos",
      value: "8",
      change: "+2",
      icon: Target,
      color: "text-success",
      bgColor: "bg-success/10",
    },
    {
      title: "Mídias na biblioteca",
      value: "1,234",
      change: "+48",
      icon: Image,
      color: "text-warning",
      bgColor: "bg-warning/10",
    },
    {
      title: "Campanhas ativas",
      value: "3",
      change: "0",
      icon: Megaphone,
      color: "text-purple-400",
      bgColor: "bg-purple-400/10",
    },
  ];

  const recentJobs = [
    { name: "Campanha Black Friday", status: "running", progress: 68, sent: 342, total: 500 },
    { name: "Promo Dezembro", status: "queued", progress: 0, sent: 0, total: 200 },
    { name: "Newsletter Semanal", status: "completed", progress: 100, sent: 150, total: 150 },
    { name: "Ofertas Relâmpago", status: "paused", progress: 45, sent: 90, total: 200 },
  ];

  const alerts = [
    { type: "warning", message: "FloodWait detectado no canal @promocoes", time: "há 5 min" },
    { type: "success", message: "Campanha 'Newsletter' concluída com sucesso", time: "há 1 hora" },
    { type: "error", message: "Falha de permissão no grupo 'Vendas'", time: "há 2 horas" },
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "running":
        return <div className="w-2 h-2 rounded-full bg-success animate-pulse" />;
      case "completed":
        return <CheckCircle2 className="w-4 h-4 text-success" />;
      case "queued":
        return <Clock className="w-4 h-4 text-muted-foreground" />;
      case "paused":
        return <AlertTriangle className="w-4 h-4 text-warning" />;
      default:
        return null;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "running":
        return "Em execução";
      case "completed":
        return "Concluído";
      case "queued":
        return "Na fila";
      case "paused":
        return "Pausado";
      default:
        return status;
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Welcome Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Bem-vindo de volta! 👋</h1>
            <p className="text-muted-foreground">
              Aqui está um resumo da sua atividade no MediaDrop TG.
            </p>
          </div>
          <Link to="/campaigns">
            <Button variant="gradient">
              <Plus className="w-4 h-4 mr-2" />
              Nova Campanha
            </Button>
          </Link>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
            >
              <Card className="glass-card">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                      <stat.icon className={`w-5 h-5 ${stat.color}`} />
                    </div>
                    <div className="flex items-center gap-1 text-success text-sm">
                      <TrendingUp className="w-3 h-3" />
                      {stat.change}
                    </div>
                  </div>
                  <div className="mt-4">
                    <p className="text-2xl font-bold">{stat.value}</p>
                    <p className="text-sm text-muted-foreground">{stat.title}</p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Main Content Grid */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Recent Jobs */}
          <Card className="lg:col-span-2 glass-card">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Campanhas Recentes</CardTitle>
              <Link to="/campaigns">
                <Button variant="ghost" size="sm">
                  Ver todas
                  <ArrowUpRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentJobs.map((job, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-4 p-4 rounded-lg bg-secondary/50 hover:bg-secondary/70 transition-colors"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-medium">{job.name}</span>
                        <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-muted text-xs">
                          {getStatusIcon(job.status)}
                          <span>{getStatusLabel(job.status)}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <Progress value={job.progress} className="flex-1 h-2" />
                        <span className="text-sm text-muted-foreground whitespace-nowrap">
                          {job.sent} / {job.total}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Alerts */}
          <Card className="glass-card">
            <CardHeader>
              <CardTitle>Alertas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {alerts.map((alert, index) => (
                  <div
                    key={index}
                    className={`p-3 rounded-lg border ${
                      alert.type === "warning"
                        ? "border-warning/30 bg-warning/5"
                        : alert.type === "success"
                        ? "border-success/30 bg-success/5"
                        : "border-destructive/30 bg-destructive/5"
                    }`}
                  >
                    <p className="text-sm">{alert.message}</p>
                    <p className="text-xs text-muted-foreground mt-1">{alert.time}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Usage Card */}
        <Card className="glass-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-semibold">Uso do Plano Pro</h3>
                <p className="text-sm text-muted-foreground">
                  2,847 de 10,000 mídias usadas este mês
                </p>
              </div>
              <Link to="/billing">
                <Button variant="outline" size="sm">
                  Upgrade
                </Button>
              </Link>
            </div>
            <Progress value={28.47} className="h-3" />
            <div className="flex justify-between mt-2 text-xs text-muted-foreground">
              <span>28.47% usado</span>
              <span>Renova em 15 dias</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default DashboardPage;
