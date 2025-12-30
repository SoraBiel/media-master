import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ArrowRight,
  CheckCircle2,
  Zap,
  TrendingUp,
  Shield,
  Users,
  BarChart3,
  Clock,
  MessageCircle,
  Star,
  ChevronRight,
  DollarSign,
  Target,
  Headphones,
  Gift,
  Rocket,
  Check,
  Crown,
  Building2,
  Sparkles,
} from "lucide-react";

const WHATSAPP_NUMBER = "5562981234567";
const WHATSAPP_MESSAGE = "Olá! Quero começar a vender na Nexo";

const LandingPage = () => {
  const openWhatsApp = () => {
    const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(WHATSAPP_MESSAGE)}`;
    window.open(url, "_blank");
  };

  const benefits = [
    {
      icon: TrendingUp,
      title: "Aumente suas vendas",
      description: "Alcance milhares de compradores qualificados todos os dias com nossa base ativa.",
    },
    {
      icon: Zap,
      title: "Automatização completa",
      description: "Funis de venda, remarketing e entregas automáticas. Venda enquanto dorme.",
    },
    {
      icon: Shield,
      title: "Pagamentos seguros",
      description: "Integração com PIX e cartão. Receba na hora com total segurança.",
    },
    {
      icon: BarChart3,
      title: "Dashboard inteligente",
      description: "Métricas em tempo real para você tomar decisões que aumentam seu lucro.",
    },
    {
      icon: Headphones,
      title: "Suporte dedicado",
      description: "Time de sucesso do seller pronto para te ajudar a vender mais.",
    },
    {
      icon: Gift,
      title: "Zero taxa inicial",
      description: "Comece a vender sem pagar nada. Só cresce quem vende.",
    },
  ];

  const steps = [
    {
      number: "01",
      title: "Crie sua conta",
      description: "Cadastro rápido em menos de 2 minutos. Sem burocracia.",
      icon: Rocket,
    },
    {
      number: "02",
      title: "Configure seu funil",
      description: "Monte seu fluxo de vendas com nossos templates prontos.",
      icon: Target,
    },
    {
      number: "03",
      title: "Comece a faturar",
      description: "Receba pagamentos automaticamente e escale suas vendas.",
      icon: DollarSign,
    },
  ];

  const plans = [
    {
      name: "Free",
      price: "R$ 0",
      period: "/7 dias",
      description: "Teste grátis para conhecer a plataforma",
      icon: Gift,
      features: [
        "1 destino (grupo/canal)",
        "Até 100 mídias/dia",
        "Acesso à plataforma completa",
        "Suporte por e-mail",
        "Teste grátis por 7 dias",
      ],
      popular: false,
      cta: "Começar grátis",
    },
    {
      name: "Basic",
      price: "R$ 49,90",
      period: "/mês",
      description: "Para quem quer sair do zero",
      icon: Zap,
      features: [
        "3 destinos (grupos/canais)",
        "Até 500 mídias/dia",
        "Agendamento básico",
        "Fluxo de chat padrão",
        "Suporte prioritário (WhatsApp)",
      ],
      popular: false,
      cta: "Escolher Basic",
    },
    {
      name: "Pro",
      price: "R$ 99,90",
      period: "/mês",
      description: "Para escalar de verdade",
      icon: Crown,
      features: [
        "10 destinos",
        "Até 2.000 mídias/dia",
        "Agendamento avançado",
        "Fluxo de chat otimizado",
        "Model Hub / IA",
        "Modelos Vazados",
        "Suporte 24/7 (WhatsApp)",
      ],
      popular: true,
      cta: "Escolher Pro",
    },
    {
      name: "Agency",
      price: "R$ 299,90",
      period: "/mês",
      description: "Escala máxima, sem limites",
      icon: Building2,
      features: [
        "Destinos ilimitados",
        "Mídias ilimitadas",
        "Todas as ferramentas",
        "Acesso à API",
        "Gerente dedicado",
        "Prioridade total",
      ],
      popular: false,
      cta: "Falar com consultor",
    },
  ];

  const testimonials = [
    {
      name: "Lucas M.",
      role: "Vendedor Digital",
      avatar: "LM",
      content: "Em 30 dias triplicei minhas vendas. A automação é absurda, não preciso fazer nada manual.",
      rating: 5,
    },
    {
      name: "Ana C.",
      role: "Infoprodutora",
      avatar: "AC",
      content: "Migrei de outra plataforma e não me arrependo. O suporte é incrível e a taxa é justa.",
      rating: 5,
    },
    {
      name: "Pedro S.",
      role: "Afiliado",
      avatar: "PS",
      content: "O melhor custo-benefício do mercado. Faço mais de 50 vendas por dia no automático.",
      rating: 5,
    },
  ];

  const stats = [
    { value: "50K+", label: "Vendedores ativos" },
    { value: "R$ 12M+", label: "Movimentado/mês" },
    { value: "98%", label: "Satisfação" },
    { value: "24h", label: "Suporte" },
  ];

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      {/* Simple Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/90 backdrop-blur-md border-b border-border/50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center">
            <img src="/logo-nexo.png" alt="Nexo" className="h-10" />
          </Link>
          <div className="flex items-center gap-3">
            <Link to="/login">
              <Button variant="ghost" size="sm" className="hidden sm:inline-flex">
                Entrar
              </Button>
            </Link>
            <Link to="/signup">
              <Button variant="default" size="sm">
                Começar agora
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-28 pb-8 sm:pt-36 sm:pb-16 relative overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0 bg-hero-pattern opacity-60" />
        <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-primary/10 rounded-full blur-[120px]" />
        
        <div className="container mx-auto px-4 relative">
          <div className="max-w-3xl mx-auto text-center">
            {/* Headline */}
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.2 }}
              className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-[1.15]"
            >
              <span className="block">Automatize suas</span>
              <span className="gradient-text block">publicações</span>
              <span className="block">no Telegram</span>
            </motion.h1>

            {/* Subheadline */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.5 }}
              className="text-sm sm:text-base text-muted-foreground mb-8 max-w-lg mx-auto leading-relaxed"
            >
              Envie mídias para grupos e canais de forma automática, com agendamento, 
              anti-spam e controle total. Plataforma segura e fácil de usar.
            </motion.p>

            {/* CTAs */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.7 }}
              className="flex flex-col sm:flex-row gap-3 justify-center mb-8"
            >
              <Link to="/signup">
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ type: "spring", stiffness: 400 }}
                >
                  <Button variant="gradient" size="lg" className="w-full sm:w-auto text-sm relative overflow-hidden group">
                    Começar Agora
                    <ArrowRight className="w-4 h-4 ml-1.5 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </motion.div>
              </Link>
              <Link to="/login">
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ type: "spring", stiffness: 400 }}
                >
                  <Button 
                    variant="outline" 
                    size="lg" 
                    className="w-full sm:w-auto text-sm"
                  >
                    Já tenho conta
                  </Button>
                </motion.div>
              </Link>
            </motion.div>

            {/* Stats */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.9 }}
              className="flex items-center justify-center gap-8 sm:gap-12 mb-12"
            >
              <div className="text-center">
                <div className="text-2xl sm:text-3xl font-bold text-foreground">50K+</div>
                <div className="text-xs text-muted-foreground">Usuários Ativos</div>
              </div>
              <div className="text-center">
                <div className="text-2xl sm:text-3xl font-bold text-foreground">2M+</div>
                <div className="text-xs text-muted-foreground">Mensagens/Mês</div>
              </div>
            </motion.div>
          </div>

          {/* MacBook Mockup with Dashboard */}
          <motion.div
            initial={{ opacity: 0, y: 60 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 1.1 }}
            className="max-w-5xl mx-auto"
          >
            <div className="relative">
              {/* Glow effect */}
              <div className="absolute inset-0 bg-gradient-to-t from-cyan-500/10 via-transparent to-transparent blur-3xl scale-90" />
              
              {/* MacBook Frame */}
              <div className="relative bg-[#1a1a1a] rounded-t-2xl p-2 sm:p-3">
                {/* Camera notch */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-20 h-5 bg-[#1a1a1a] rounded-b-xl flex items-center justify-center z-10">
                  <div className="w-2 h-2 rounded-full bg-zinc-700" />
                </div>
                
                {/* Screen content */}
                <div className="bg-[#0d1117] rounded-lg overflow-hidden border border-zinc-800/50">
                  {/* Browser bar */}
                  <div className="bg-[#161b22] px-4 py-2.5 flex items-center justify-center border-b border-zinc-800/50">
                    <div className="absolute left-4 flex gap-2">
                      <div className="w-3 h-3 rounded-full bg-[#ff5f57]" />
                      <div className="w-3 h-3 rounded-full bg-[#febc2e]" />
                      <div className="w-3 h-3 rounded-full bg-[#28c840]" />
                    </div>
                    <div className="bg-[#0d1117] rounded-full px-4 py-1.5 flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-green-500 flex items-center justify-center">
                        <Shield className="w-2 h-2 text-white" />
                      </div>
                      <span className="text-zinc-400 text-[11px] sm:text-xs">app.nexotg.com/dashboard</span>
                    </div>
                  </div>
                  
                  {/* Dashboard with sidebar */}
                  <div className="flex">
                    {/* Sidebar */}
                    <div className="hidden sm:flex flex-col items-center py-4 px-2 bg-[#0d1117] border-r border-zinc-800/50 gap-3">
                      <div className="w-8 h-8 rounded-lg bg-cyan-500/20 flex items-center justify-center">
                        <Zap className="w-4 h-4 text-cyan-400" />
                      </div>
                      <div className="w-8 h-8 rounded-lg hover:bg-zinc-800/50 flex items-center justify-center cursor-pointer">
                        <BarChart3 className="w-4 h-4 text-zinc-500" />
                      </div>
                      <div className="w-8 h-8 rounded-lg hover:bg-zinc-800/50 flex items-center justify-center cursor-pointer">
                        <Users className="w-4 h-4 text-zinc-500" />
                      </div>
                      <div className="w-8 h-8 rounded-lg hover:bg-zinc-800/50 flex items-center justify-center cursor-pointer">
                        <MessageCircle className="w-4 h-4 text-zinc-500" />
                      </div>
                      <div className="flex-1" />
                      <div className="w-8 h-8 rounded-lg hover:bg-zinc-800/50 flex items-center justify-center cursor-pointer">
                        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500" />
                      </div>
                    </div>

                    {/* Main content */}
                    <div className="flex-1 p-4 sm:p-5">
                      {/* Header with welcome and button */}
                      <div className="flex items-start justify-between mb-5">
                        <div>
                          <h3 className="text-white text-sm sm:text-lg font-semibold flex items-center gap-2">
                            Olá, João! <span className="text-xl">👋</span>
                          </h3>
                          <p className="text-zinc-500 text-[10px] sm:text-xs">
                            Acompanhe seus funis e conversões em tempo real.
                          </p>
                        </div>
                        <button className="bg-cyan-500 hover:bg-cyan-600 text-white text-[10px] sm:text-xs px-3 py-1.5 rounded-lg font-medium flex items-center gap-1.5 transition-colors">
                          + Novo Funil
                        </button>
                      </div>
                      
                      {/* Stats cards */}
                      <div className="grid grid-cols-6 gap-2 sm:gap-3 mb-5">
                        {[
                          { icon: BarChart3, iconBg: "bg-red-500/20", iconColor: "text-red-400", value: "127", label: "Leads Hoje" },
                          { icon: Target, iconBg: "bg-blue-500/20", iconColor: "text-blue-400", value: "8", label: "Funis Ativos" },
                          { icon: Users, iconBg: "bg-yellow-500/20", iconColor: "text-yellow-400", value: "43", label: "Sessões" },
                          { icon: MessageCircle, iconBg: "bg-cyan-500/20", iconColor: "text-cyan-400", value: "892", label: "Mensagens" },
                          { icon: TrendingUp, iconBg: "bg-purple-500/20", iconColor: "text-purple-400", value: "72%", label: "Conversão" },
                          { icon: CheckCircle2, iconBg: "bg-green-500/20", iconColor: "text-green-400", value: "OK", label: "Status Bot" },
                        ].map((stat, i) => (
                          <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 1.3 + i * 0.08 }}
                            className="bg-[#161b22] rounded-xl p-2.5 sm:p-3 border border-zinc-800/50"
                          >
                            <div className={`w-6 h-6 sm:w-7 sm:h-7 rounded-lg ${stat.iconBg} flex items-center justify-center mb-2`}>
                              <stat.icon className={`w-3 h-3 sm:w-3.5 sm:h-3.5 ${stat.iconColor}`} />
                            </div>
                            <div className="text-white text-base sm:text-xl font-bold">{stat.value}</div>
                            <div className="text-zinc-500 text-[8px] sm:text-[10px]">{stat.label}</div>
                          </motion.div>
                        ))}
                      </div>

                      {/* Bottom section - Table and Activity */}
                      <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
                        {/* Table - 3 columns */}
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 1.8 }}
                          className="sm:col-span-3 bg-[#161b22] rounded-xl border border-zinc-800/50 p-3 sm:p-4"
                        >
                          <div className="flex items-center justify-between mb-3">
                            <div className="text-white text-xs sm:text-sm font-semibold flex items-center gap-2">
                              <BarChart3 className="w-3.5 h-3.5 text-cyan-400" />
                              Visão Geral dos Funis
                            </div>
                            <span className="text-cyan-400 text-[9px] sm:text-[10px] cursor-pointer hover:underline">Ver todos →</span>
                          </div>
                          
                          {/* Table header */}
                          <div className="grid grid-cols-5 gap-2 text-[8px] sm:text-[10px] text-zinc-500 uppercase tracking-wide pb-2 border-b border-zinc-800/50 mb-2">
                            <span>Funil</span>
                            <span>Bot</span>
                            <span className="text-right">Leads</span>
                            <span className="text-center">Conv.</span>
                            <span className="text-right">Status</span>
                          </div>
                          
                          {/* Table rows */}
                          <div className="space-y-2">
                            {[
                              { name: "Vendas VIP", bot: "@vip_bot", leads: "45/32", conv: 79, status: "Ativo" },
                              { name: "Captura Lead", bot: "@leads_bot", leads: "89/67", conv: 75, status: "Ativo" },
                              { name: "Suporte Auto", bot: "@sup_bot", leads: "23/18", conv: 78, status: "Pausado" },
                            ].map((row, i) => (
                              <div key={i} className="grid grid-cols-5 gap-2 text-[9px] sm:text-[11px] py-1.5 items-center">
                                <span className="text-white font-medium truncate">{row.name}</span>
                                <span className="text-zinc-500 truncate">{row.bot}</span>
                                <span className="text-zinc-400 text-right">{row.leads}</span>
                                <div className="flex justify-center">
                                  <span className={`px-1.5 py-0.5 rounded text-[8px] font-medium ${
                                    row.conv >= 78 ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'
                                  }`}>
                                    {row.conv}%
                                  </span>
                                </div>
                                <span className={`text-right text-[8px] sm:text-[9px] ${
                                  row.status === 'Ativo' ? 'text-cyan-400' : 'text-zinc-500'
                                }`}>
                                  {row.status}
                                </span>
                              </div>
                            ))}
                          </div>
                        </motion.div>

                        {/* Activity - 2 columns */}
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 1.9 }}
                          className="sm:col-span-2 bg-[#161b22] rounded-xl border border-zinc-800/50 p-3 sm:p-4"
                        >
                          <div className="text-white text-xs sm:text-sm font-semibold mb-3 flex items-center gap-2">
                            <Clock className="w-3.5 h-3.5 text-cyan-400" />
                            Atividade Recente
                          </div>
                          <div className="space-y-2.5">
                            {[
                              { color: "bg-green-500", text: "Novo lead: @maria_silva", time: "agora" },
                              { color: "bg-yellow-500", text: "Mensagem enviada", time: "2min" },
                              { color: "bg-blue-500", text: "Lead respondeu", time: "5min" },
                              { color: "bg-cyan-500", text: "Funil concluído", time: "7min" },
                            ].map((item, i) => (
                              <div key={i} className="flex items-center justify-between text-[9px] sm:text-[11px]">
                                <div className="flex items-center gap-2">
                                  <div className={`w-2 h-2 rounded-full ${item.color}`} />
                                  <span className="text-zinc-300">{item.text}</span>
                                </div>
                                <span className="text-zinc-600">{item.time}</span>
                              </div>
                            ))}
                          </div>
                        </motion.div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* MacBook bottom/base */}
              <div className="bg-gradient-to-b from-[#2a2a2a] to-[#1a1a1a] h-4 sm:h-5 rounded-b-xl mx-6 sm:mx-10">
                <div className="w-24 sm:w-32 h-1 bg-zinc-600/30 rounded-full mx-auto mt-1.5" />
              </div>
              
              {/* Shadow */}
              <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 w-[60%] h-8 bg-black/40 blur-2xl rounded-full" />
            </div>
          </motion.div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-16 sm:py-24">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4">
              Por que sellers escolhem a Nexo?
            </h2>
            <p className="text-muted-foreground max-w-lg mx-auto">
              Tudo que você precisa para vender mais, em uma única plataforma.
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {benefits.map((benefit, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
              >
                <Card className="h-full border-border/50 hover:border-primary/30 transition-colors">
                  <CardContent className="p-5 sm:p-6">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                      <benefit.icon className="w-5 h-5 text-primary" />
                    </div>
                    <h3 className="font-semibold text-base mb-2">{benefit.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {benefit.description}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section className="py-16 sm:py-24 bg-muted/30">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4">
              Comece a vender em 3 passos
            </h2>
            <p className="text-muted-foreground max-w-lg mx-auto">
              Sem complicação. Crie sua conta e comece a faturar hoje mesmo.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6 sm:gap-8 max-w-4xl mx-auto">
            {steps.map((step, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.3, delay: index * 0.15 }}
                className="relative"
              >
                <Card className="border-border/50 h-full">
                  <CardContent className="p-6 text-center">
                    <div className="text-4xl font-bold text-primary/20 mb-3">{step.number}</div>
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                      <step.icon className="w-6 h-6 text-primary" />
                    </div>
                    <h3 className="font-semibold text-lg mb-2">{step.title}</h3>
                    <p className="text-sm text-muted-foreground">{step.description}</p>
                  </CardContent>
                </Card>
                {index < 2 && (
                  <ChevronRight className="hidden md:block absolute top-1/2 -right-4 w-6 h-6 text-muted-foreground/30 -translate-y-1/2" />
                )}
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mt-10"
          >
            <Link to="/signup">
              <Button variant="gradient" size="lg">
                Criar minha conta grátis
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-16 sm:py-24 bg-muted/30">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <Badge variant="secondary" className="mb-4 px-4 py-1.5">
              <Sparkles className="w-3 h-3 mr-1.5" />
              Planos para todos os tamanhos
            </Badge>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4">
              Escolha o plano ideal para você
            </h2>
            <p className="text-muted-foreground max-w-lg mx-auto">
              Comece grátis e escale conforme seu negócio cresce.
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 max-w-6xl mx-auto">
            {plans.map((plan, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
                className="relative"
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
                    <Badge className="bg-primary text-primary-foreground px-3">
                      Mais popular
                    </Badge>
                  </div>
                )}
                <Card className={`h-full border-border/50 ${plan.popular ? 'border-primary ring-1 ring-primary' : ''}`}>
                  <CardContent className="p-5 sm:p-6">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                      <plan.icon className="w-5 h-5 text-primary" />
                    </div>
                    
                    <h3 className="font-bold text-lg mb-1">{plan.name}</h3>
                    <p className="text-xs text-muted-foreground mb-4">{plan.description}</p>
                    
                    <div className="mb-5">
                      <span className="text-3xl font-bold">{plan.price}</span>
                      <span className="text-muted-foreground text-sm">{plan.period}</span>
                    </div>

                    <ul className="space-y-2.5 mb-6">
                      {plan.features.map((feature, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm">
                          <Check className="w-4 h-4 text-success mt-0.5 flex-shrink-0" />
                          <span className="text-muted-foreground">{feature}</span>
                        </li>
                      ))}
                    </ul>

                    <Link to="/signup" className="block">
                      <Button 
                        variant={plan.popular ? "gradient" : "outline"} 
                        className="w-full"
                        size="sm"
                      >
                        {plan.cta}
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 sm:py-24 bg-muted/30">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="max-w-2xl mx-auto text-center"
          >
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
              <Rocket className="w-8 h-8 text-primary" />
            </div>
            
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4">
              Pronto para escalar suas vendas?
            </h2>
            <p className="text-muted-foreground mb-8 max-w-md mx-auto">
              Junte-se a milhares de sellers que já faturam no automático com a Nexo.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link to="/signup">
                <Button variant="gradient" size="lg" className="w-full sm:w-auto text-base">
                  Abrir minha loja agora
                  <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
              <Button 
                variant="outline" 
                size="lg" 
                onClick={openWhatsApp}
                className="w-full sm:w-auto"
              >
                <MessageCircle className="w-4 h-4 mr-2" />
                Tirar dúvidas
              </Button>
            </div>

            <p className="text-xs text-muted-foreground mt-6">
              Cadastro gratuito • Sem cartão de crédito • Cancele quando quiser
            </p>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-border/50">
        <div className="container mx-auto px-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <img src="/logo-nexo.png" alt="Nexo" className="h-7" />
            </div>
            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <Link to="/login" className="hover:text-foreground transition-colors">
                Entrar
              </Link>
              <button onClick={openWhatsApp} className="hover:text-foreground transition-colors">
                Suporte
              </button>
            </div>
            <p className="text-xs text-muted-foreground">
              © {new Date().getFullYear()} Nexo. Todos os direitos reservados.
            </p>
          </div>
        </div>
      </footer>

      {/* Floating WhatsApp Button - Mobile */}
      <motion.button
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 1, type: "spring" }}
        onClick={openWhatsApp}
        className="fixed bottom-6 right-6 w-14 h-14 bg-success rounded-full flex items-center justify-center shadow-lg hover:shadow-xl hover:scale-105 transition-all z-50 lg:hidden"
        aria-label="WhatsApp"
      >
        <MessageCircle className="w-6 h-6 text-white" />
      </motion.button>
    </div>
  );
};

export default LandingPage;
