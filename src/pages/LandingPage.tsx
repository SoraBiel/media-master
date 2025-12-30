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
            initial={{ opacity: 0, y: 80, rotateX: 10 }}
            animate={{ opacity: 1, y: 0, rotateX: 0 }}
            transition={{ duration: 1, delay: 1.1, ease: [0.16, 1, 0.3, 1] }}
            className="max-w-5xl mx-auto perspective-1000"
          >
            <div className="relative">
              {/* Multiple glow layers for depth */}
              <div className="absolute -inset-4 bg-gradient-to-t from-cyan-500/20 via-blue-500/5 to-transparent blur-3xl opacity-60" />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] h-[60%] bg-cyan-500/10 blur-[100px] rounded-full" />
              
              {/* MacBook Frame with realistic styling */}
              <div className="relative">
                {/* Screen bezel - top */}
                <div className="bg-gradient-to-b from-[#2d2d2d] via-[#1f1f1f] to-[#1a1a1a] rounded-t-[18px] p-[10px] sm:p-[12px] shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
                  {/* Camera notch */}
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[70px] sm:w-[80px] h-[22px] bg-[#1a1a1a] rounded-b-2xl flex items-center justify-center z-10 shadow-[inset_0_-2px_4px_rgba(0,0,0,0.3)]">
                    <div className="w-[6px] h-[6px] rounded-full bg-[#3d3d3d] shadow-[inset_0_1px_2px_rgba(0,0,0,0.5)]" />
                  </div>
                  
                  {/* Screen with realistic border */}
                  <div className="bg-[#0a0e14] rounded-[8px] overflow-hidden shadow-[inset_0_0_0_1px_rgba(255,255,255,0.03),0_0_80px_rgba(0,0,0,0.5)]">
                    {/* Browser chrome */}
                    <div className="bg-gradient-to-b from-[#1c2128] to-[#161b22] px-4 py-2.5 flex items-center border-b border-[#21262d]">
                      {/* Window controls */}
                      <div className="flex gap-[6px] absolute left-4">
                        <div className="w-[10px] h-[10px] rounded-full bg-[#ff5f57] shadow-[inset_0_-1px_1px_rgba(0,0,0,0.2)]" />
                        <div className="w-[10px] h-[10px] rounded-full bg-[#febc2e] shadow-[inset_0_-1px_1px_rgba(0,0,0,0.2)]" />
                        <div className="w-[10px] h-[10px] rounded-full bg-[#28c840] shadow-[inset_0_-1px_1px_rgba(0,0,0,0.2)]" />
                      </div>
                      
                      {/* URL bar */}
                      <div className="flex-1 flex justify-center">
                        <div className="bg-[#0d1117] rounded-lg px-4 py-1.5 flex items-center gap-2 border border-[#21262d] shadow-[inset_0_1px_2px_rgba(0,0,0,0.2)]">
                          <div className="w-[14px] h-[14px] rounded-full bg-emerald-500/90 flex items-center justify-center">
                            <Shield className="w-[8px] h-[8px] text-white" />
                          </div>
                          <span className="text-[#8b949e] text-[11px] sm:text-[12px] font-medium tracking-tight">app.nexotg.com/dashboard</span>
                        </div>
                      </div>
                      
                      {/* Right side placeholder */}
                      <div className="w-[60px]" />
                    </div>
                    
                    {/* Dashboard layout */}
                    <div className="flex min-h-[280px] sm:min-h-[340px]">
                      {/* Sidebar */}
                      <div className="hidden sm:flex flex-col items-center py-5 px-3 bg-[#0d1117] border-r border-[#21262d] w-[52px]">
                        {/* Logo */}
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center mb-5 shadow-lg shadow-cyan-500/20">
                          <Zap className="w-4 h-4 text-white" />
                        </div>
                        
                        {/* Nav items */}
                        <div className="space-y-1 flex-1">
                          <div className="w-9 h-9 rounded-lg bg-[#21262d] flex items-center justify-center">
                            <BarChart3 className="w-[18px] h-[18px] text-cyan-400" />
                          </div>
                          <div className="w-9 h-9 rounded-lg hover:bg-[#161b22] flex items-center justify-center transition-colors">
                            <Target className="w-[18px] h-[18px] text-[#484f58]" />
                          </div>
                          <div className="w-9 h-9 rounded-lg hover:bg-[#161b22] flex items-center justify-center transition-colors">
                            <Users className="w-[18px] h-[18px] text-[#484f58]" />
                          </div>
                          <div className="w-9 h-9 rounded-lg hover:bg-[#161b22] flex items-center justify-center transition-colors">
                            <MessageCircle className="w-[18px] h-[18px] text-[#484f58]" />
                          </div>
                        </div>
                        
                        {/* User avatar */}
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-400 to-pink-500 flex items-center justify-center text-[10px] font-bold text-white shadow-lg">
                          JP
                        </div>
                      </div>

                      {/* Main content area */}
                      <div className="flex-1 p-4 sm:p-5 bg-[#0d1117]">
                        {/* Header */}
                        <div className="flex items-start justify-between mb-5">
                          <div>
                            <motion.h3 
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: 1.4 }}
                              className="text-[#f0f6fc] text-sm sm:text-[17px] font-semibold flex items-center gap-2"
                            >
                              Olá, João! <span className="text-lg">👋</span>
                            </motion.h3>
                            <motion.p 
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              transition={{ delay: 1.5 }}
                              className="text-[#484f58] text-[10px] sm:text-[12px] mt-0.5"
                            >
                              Acompanhe seus funis e conversões em tempo real.
                            </motion.p>
                          </div>
                          <motion.button 
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 1.6 }}
                            className="bg-gradient-to-r from-cyan-500 to-blue-600 text-white text-[10px] sm:text-[11px] px-3 py-2 rounded-lg font-semibold flex items-center gap-1.5 shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40 transition-shadow"
                          >
                            <span className="text-[14px]">+</span> Novo Funil
                          </motion.button>
                        </div>
                        
                        {/* Stats grid with staggered animation */}
                        <div className="grid grid-cols-6 gap-2 sm:gap-2.5 mb-5">
                          {[
                            { icon: BarChart3, bg: "from-red-500/20 to-red-600/10", iconColor: "text-red-400", value: "127", label: "Leads Hoje", border: "border-red-500/20" },
                            { icon: Target, bg: "from-blue-500/20 to-blue-600/10", iconColor: "text-blue-400", value: "8", label: "Funis Ativos", border: "border-blue-500/20" },
                            { icon: Users, bg: "from-amber-500/20 to-yellow-600/10", iconColor: "text-amber-400", value: "43", label: "Sessões", border: "border-amber-500/20" },
                            { icon: MessageCircle, bg: "from-cyan-500/20 to-cyan-600/10", iconColor: "text-cyan-400", value: "892", label: "Mensagens", border: "border-cyan-500/20" },
                            { icon: TrendingUp, bg: "from-purple-500/20 to-purple-600/10", iconColor: "text-purple-400", value: "72%", label: "Conversão", border: "border-purple-500/20" },
                            { icon: CheckCircle2, bg: "from-emerald-500/20 to-green-600/10", iconColor: "text-emerald-400", value: "OK", label: "Status Bot", border: "border-emerald-500/20" },
                          ].map((stat, i) => (
                            <motion.div
                              key={i}
                              initial={{ opacity: 0, y: 15, scale: 0.95 }}
                              animate={{ opacity: 1, y: 0, scale: 1 }}
                              transition={{ delay: 1.5 + i * 0.08, duration: 0.4 }}
                              className={`bg-gradient-to-br ${stat.bg} rounded-xl p-2.5 sm:p-3 border ${stat.border} backdrop-blur-sm`}
                            >
                              <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-[#0d1117]/60 flex items-center justify-center mb-2 shadow-inner">
                                <stat.icon className={`w-3 h-3 sm:w-3.5 sm:h-3.5 ${stat.iconColor}`} />
                              </div>
                              <div className="text-[#f0f6fc] text-sm sm:text-lg font-bold tracking-tight">{stat.value}</div>
                              <div className="text-[#484f58] text-[7px] sm:text-[9px] font-medium">{stat.label}</div>
                            </motion.div>
                          ))}
                        </div>

                        {/* Bottom panels */}
                        <div className="grid grid-cols-1 sm:grid-cols-5 gap-2.5">
                          {/* Funnel table */}
                          <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 2.1 }}
                            className="sm:col-span-3 bg-[#161b22] rounded-xl border border-[#21262d] p-3 sm:p-4"
                          >
                            <div className="flex items-center justify-between mb-3">
                              <div className="text-[#f0f6fc] text-[11px] sm:text-[13px] font-semibold flex items-center gap-2">
                                <div className="w-5 h-5 rounded bg-cyan-500/20 flex items-center justify-center">
                                  <BarChart3 className="w-3 h-3 text-cyan-400" />
                                </div>
                                Visão Geral dos Funis
                              </div>
                              <span className="text-cyan-400 text-[9px] sm:text-[10px] font-medium cursor-pointer hover:underline">Ver todos →</span>
                            </div>
                            
                            {/* Table header */}
                            <div className="grid grid-cols-5 gap-2 text-[7px] sm:text-[9px] text-[#484f58] uppercase tracking-wider pb-2 border-b border-[#21262d] mb-2 font-semibold">
                              <span>Funil</span>
                              <span>Bot</span>
                              <span className="text-right">Leads</span>
                              <span className="text-center">Conv.</span>
                              <span className="text-right">Status</span>
                            </div>
                            
                            {/* Table rows */}
                            <div className="space-y-1.5">
                              {[
                                { name: "Vendas VIP", bot: "@vip_bot", leads: "45/32", conv: 79, status: "Ativo" },
                                { name: "Captura Lead", bot: "@leads_bot", leads: "89/67", conv: 75, status: "Ativo" },
                                { name: "Suporte Auto", bot: "@sup_bot", leads: "23/18", conv: 78, status: "Pausado" },
                              ].map((row, i) => (
                                <motion.div 
                                  key={i} 
                                  initial={{ opacity: 0, x: -10 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  transition={{ delay: 2.2 + i * 0.1 }}
                                  className="grid grid-cols-5 gap-2 text-[8px] sm:text-[11px] py-2 items-center hover:bg-[#1c2128] rounded-lg px-1 transition-colors"
                                >
                                  <span className="text-[#f0f6fc] font-medium truncate">{row.name}</span>
                                  <span className="text-[#484f58] truncate font-mono text-[8px] sm:text-[10px]">{row.bot}</span>
                                  <span className="text-[#8b949e] text-right font-medium">{row.leads}</span>
                                  <div className="flex justify-center">
                                    <span className={`px-1.5 py-0.5 rounded-md text-[7px] sm:text-[9px] font-bold ${
                                      row.conv >= 78 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'
                                    }`}>
                                      {row.conv}%
                                    </span>
                                  </div>
                                  <div className="flex justify-end">
                                    <span className={`text-[7px] sm:text-[9px] font-medium flex items-center gap-1 ${
                                      row.status === 'Ativo' ? 'text-cyan-400' : 'text-[#484f58]'
                                    }`}>
                                      <span className={`w-1.5 h-1.5 rounded-full ${row.status === 'Ativo' ? 'bg-cyan-400' : 'bg-[#484f58]'}`} />
                                      {row.status}
                                    </span>
                                  </div>
                                </motion.div>
                              ))}
                            </div>
                          </motion.div>

                          {/* Activity feed */}
                          <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 2.3 }}
                            className="sm:col-span-2 bg-[#161b22] rounded-xl border border-[#21262d] p-3 sm:p-4"
                          >
                            <div className="text-[#f0f6fc] text-[11px] sm:text-[13px] font-semibold mb-3 flex items-center gap-2">
                              <div className="w-5 h-5 rounded bg-cyan-500/20 flex items-center justify-center">
                                <Clock className="w-3 h-3 text-cyan-400" />
                              </div>
                              Atividade Recente
                            </div>
                            <div className="space-y-2">
                              {[
                                { color: "bg-emerald-500", ring: "ring-emerald-500/30", text: "Novo lead: @maria_silva", time: "agora" },
                                { color: "bg-amber-500", ring: "ring-amber-500/30", text: "Mensagem enviada", time: "2min" },
                                { color: "bg-blue-500", ring: "ring-blue-500/30", text: "Lead respondeu", time: "5min" },
                                { color: "bg-cyan-500", ring: "ring-cyan-500/30", text: "Funil concluído", time: "7min" },
                              ].map((item, i) => (
                                <motion.div 
                                  key={i} 
                                  initial={{ opacity: 0, x: 10 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  transition={{ delay: 2.4 + i * 0.1 }}
                                  className="flex items-center justify-between text-[8px] sm:text-[11px] py-1.5 hover:bg-[#1c2128] rounded-lg px-1 transition-colors"
                                >
                                  <div className="flex items-center gap-2">
                                    <div className={`w-2 h-2 rounded-full ${item.color} ring-2 ${item.ring}`} />
                                    <span className="text-[#c9d1d9]">{item.text}</span>
                                  </div>
                                  <span className="text-[#484f58] text-[8px] sm:text-[10px]">{item.time}</span>
                                </motion.div>
                              ))}
                            </div>
                          </motion.div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* MacBook hinge/bottom */}
                <div className="relative">
                  <div className="bg-gradient-to-b from-[#2d2d2d] to-[#252525] h-[6px] mx-2 rounded-b-sm shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]" />
                  <div className="bg-gradient-to-b from-[#3d3d3d] to-[#2a2a2a] h-[14px] sm:h-[18px] rounded-b-xl mx-8 sm:mx-14 shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_4px_20px_rgba(0,0,0,0.4)]">
                    <div className="w-[80px] sm:w-[100px] h-[3px] bg-[#1a1a1a] rounded-full mx-auto mt-[5px] sm:mt-[6px] shadow-[inset_0_1px_2px_rgba(0,0,0,0.4)]" />
                  </div>
                </div>
              </div>
              
              {/* Realistic shadow */}
              <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 w-[50%] h-[20px] bg-black/50 blur-2xl rounded-[100%]" />
              <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-[70%] h-[8px] bg-black/30 blur-xl rounded-[100%]" />
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
      <section id="pricing" className="py-16 sm:py-24">
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

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 max-w-6xl mx-auto">
            {plans.map((plan, index) => {
              const isPopular = plan.popular;
              const isAgency = plan.name === "Agency";
              const isFree = plan.name === "Free";
              
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                  whileHover={{ y: -5 }}
                  className={`relative ${isPopular ? 'lg:-mt-4 lg:mb-4' : ''}`}
                >
                  {/* Popular badge */}
                  {isPopular && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-10">
                      <Badge className="bg-gradient-to-r from-cyan-500 to-blue-500 text-white px-4 py-1 font-semibold shadow-lg shadow-cyan-500/25">
                        <Star className="w-3 h-3 mr-1.5 fill-current" />
                        Mais popular
                      </Badge>
                    </div>
                  )}
                  
                  {/* Best value badge for Agency */}
                  {isAgency && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-10">
                      <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-1 font-semibold shadow-lg shadow-purple-500/25">
                        <Crown className="w-3 h-3 mr-1.5" />
                        Premium
                      </Badge>
                    </div>
                  )}
                  
                  <Card className={`h-full overflow-hidden transition-all duration-300 ${
                    isPopular 
                      ? 'bg-gradient-to-b from-cyan-500/10 to-transparent border-cyan-500/50 ring-2 ring-cyan-500/30 shadow-xl shadow-cyan-500/10' 
                      : isAgency 
                        ? 'bg-gradient-to-b from-purple-500/10 to-transparent border-purple-500/50 hover:border-purple-500/70'
                        : 'border-border/50 hover:border-primary/30 hover:shadow-lg'
                  }`}>
                    <CardContent className="p-5 sm:p-6 relative">
                      {/* Background glow for popular */}
                      {isPopular && (
                        <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 rounded-full blur-3xl" />
                      )}
                      
                      {/* Icon */}
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${
                        isPopular 
                          ? 'bg-gradient-to-br from-cyan-500 to-blue-500 shadow-lg shadow-cyan-500/30' 
                          : isAgency 
                            ? 'bg-gradient-to-br from-purple-500 to-pink-500 shadow-lg shadow-purple-500/30'
                            : isFree
                              ? 'bg-green-500/20'
                              : 'bg-primary/10'
                      }`}>
                        <plan.icon className={`w-6 h-6 ${
                          isPopular || isAgency ? 'text-white' : isFree ? 'text-green-500' : 'text-primary'
                        }`} />
                      </div>
                      
                      {/* Plan name and description */}
                      <h3 className={`font-bold text-xl mb-1 ${isPopular ? 'text-cyan-400' : isAgency ? 'text-purple-400' : ''}`}>
                        {plan.name}
                      </h3>
                      <p className="text-xs text-muted-foreground mb-4">{plan.description}</p>
                      
                      {/* Price */}
                      <div className="mb-5 pb-5 border-b border-border/50">
                        <div className="flex items-baseline gap-1">
                          <span className={`text-3xl sm:text-4xl font-bold ${
                            isPopular ? 'text-cyan-400' : isAgency ? 'text-purple-400' : ''
                          }`}>
                            {plan.price}
                          </span>
                          <span className="text-muted-foreground text-sm">{plan.period}</span>
                        </div>
                        {isFree && (
                          <span className="text-xs text-green-500 font-medium">Sem cartão necessário</span>
                        )}
                      </div>

                      {/* Features */}
                      <ul className="space-y-3 mb-6">
                        {plan.features.map((feature, i) => (
                          <li key={i} className="flex items-start gap-2.5 text-sm">
                            <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${
                              isPopular 
                                ? 'bg-cyan-500/20' 
                                : isAgency 
                                  ? 'bg-purple-500/20'
                                  : 'bg-green-500/20'
                            }`}>
                              <Check className={`w-3 h-3 ${
                                isPopular ? 'text-cyan-400' : isAgency ? 'text-purple-400' : 'text-green-500'
                              }`} />
                            </div>
                            <span className="text-muted-foreground">{feature}</span>
                          </li>
                        ))}
                      </ul>

                      {/* CTA Button */}
                      <Link to={isAgency ? "#" : "/signup"} className="block" onClick={isAgency ? openWhatsApp : undefined}>
                        <Button 
                          variant={isPopular ? "default" : "outline"} 
                          className={`w-full font-semibold transition-all ${
                            isPopular 
                              ? 'bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40'
                              : isAgency
                                ? 'border-purple-500/50 text-purple-400 hover:bg-purple-500/10 hover:border-purple-500'
                                : ''
                          }`}
                        >
                          {plan.cta}
                          {isPopular && <ArrowRight className="w-4 h-4 ml-1" />}
                        </Button>
                      </Link>
                      
                      {/* Extra info */}
                      {isPopular && (
                        <p className="text-[10px] text-center text-muted-foreground mt-3">
                          ✓ 7 dias de garantia · Cancele quando quiser
                        </p>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
          
          {/* Trust indicators */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="flex flex-wrap items-center justify-center gap-6 mt-10 text-sm text-muted-foreground"
          >
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-green-500" />
              <span>Pagamento seguro</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-primary" />
              <span>Ativação imediata</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-500" />
              <span>Cancele quando quiser</span>
            </div>
          </motion.div>
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
