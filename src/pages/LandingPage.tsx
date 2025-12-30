import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, CheckCircle2, Zap, TrendingUp, Shield, Users, BarChart3, Clock, MessageCircle, Star, ChevronRight, DollarSign, Target, Headphones, Gift, Rocket, Check, Crown, Building2, Sparkles, Plus, Bot, Play, Pause } from "lucide-react";
const WHATSAPP_NUMBER = "5562981234567";
const WHATSAPP_MESSAGE = "Olá! Quero começar a vender na Nexo";
const LandingPage = () => {
  const openWhatsApp = () => {
    const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(WHATSAPP_MESSAGE)}`;
    window.open(url, "_blank");
  };
  const benefits = [{
    icon: TrendingUp,
    title: "Aumente suas vendas",
    description: "Alcance milhares de compradores qualificados todos os dias com nossa base ativa."
  }, {
    icon: Zap,
    title: "Automatização completa",
    description: "Funis de venda, remarketing e entregas automáticas. Venda enquanto dorme."
  }, {
    icon: Shield,
    title: "Pagamentos seguros",
    description: "Integração com PIX e cartão. Receba na hora com total segurança."
  }, {
    icon: BarChart3,
    title: "Dashboard inteligente",
    description: "Métricas em tempo real para você tomar decisões que aumentam seu lucro."
  }, {
    icon: Headphones,
    title: "Suporte dedicado",
    description: "Time de sucesso do seller pronto para te ajudar a vender mais."
  }, {
    icon: Gift,
    title: "Zero taxa inicial",
    description: "Comece a vender sem pagar nada. Só cresce quem vende."
  }];
  const steps = [{
    number: "01",
    title: "Crie sua conta",
    description: "Cadastro rápido em menos de 2 minutos. Sem burocracia.",
    icon: Rocket
  }, {
    number: "02",
    title: "Configure seu funil",
    description: "Monte seu fluxo de vendas com nossos templates prontos.",
    icon: Target
  }, {
    number: "03",
    title: "Comece a faturar",
    description: "Receba pagamentos automaticamente e escale suas vendas.",
    icon: DollarSign
  }];
  const plans = [{
    name: "Free",
    price: "R$ 0,00",
    period: "/mês",
    description: "Para conhecer a estrutura por dentro. Teste grátis por 7 dias",
    features: ["1 destino", "100 mídias/mês", "1 destino (grupo)", "Até 100 mídias/dia", "Acesso à plataforma", "Suporte por e-mail", "Teste grátis por 7 dias"],
    popular: false
  }, {
    name: "Basic",
    price: "R$ 49,90",
    period: "/mês",
    description: "Para quem quer sair do zero e começar certo",
    features: ["3 destinos", "500 mídias/mês", "Agendamento", "3 destinos (grupos)", "500 mídias/dia", "Agendamento básico", "Fluxo de chat padrão", "Suporte prioritário (WhatsApp)"],
    popular: false
  }, {
    name: "Pro",
    price: "R$ 99,90",
    period: "/mês",
    description: "Para quem quer ganhar velocidade e escalar",
    features: ["10 destinos", "2.000 mídias/mês", "Agendamento", "Model Hub", "10 destinos", "2.000 mídias/dia", "Agendamento avançado", "Fluxos de chat otimizado", "Model Hub / IA", "Modelos Vazados", "Suporte 24/7 (WhatsApp)"],
    popular: true
  }, {
    name: "Agency",
    price: "R$ 299,90",
    period: "/mês",
    description: "Escala máxima, sem limite",
    features: ["∞ destinos", "∞ mídias/mês", "Agendamento", "Model Hub", "Destinos ilimitados", "Mídias ilimitadas", "Todas as ferramentas liberadas", "API access", "Gerente dedicado"],
    popular: false
  }];
  const testimonials = [{
    name: "Lucas M.",
    role: "Vendedor Digital",
    avatar: "LM",
    content: "Em 30 dias triplicei minhas vendas. A automação é absurda, não preciso fazer nada manual.",
    rating: 5
  }, {
    name: "Ana C.",
    role: "Infoprodutora",
    avatar: "AC",
    content: "Migrei de outra plataforma e não me arrependo. O suporte é incrível e a taxa é justa.",
    rating: 5
  }, {
    name: "Pedro S.",
    role: "Afiliado",
    avatar: "PS",
    content: "O melhor custo-benefício do mercado. Faço mais de 50 vendas por dia no automático.",
    rating: 5
  }];
  const stats = [{
    value: "50K+",
    label: "Vendedores ativos"
  }, {
    value: "R$ 12M+",
    label: "Movimentado/mês"
  }, {
    value: "98%",
    label: "Satisfação"
  }, {
    value: "24h",
    label: "Suporte"
  }];
  return <div className="min-h-screen bg-background overflow-x-hidden">
      {/* Simple Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/90 backdrop-blur-md border-b border-border/50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center">
            <img src="/logo-nexo.png" alt="Nexo" className="h-40" />
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
            <motion.h1 initial={{
            opacity: 0,
            y: 30
          }} animate={{
            opacity: 1,
            y: 0
          }} transition={{
            duration: 0.7,
            delay: 0.2
          }} className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-[1.15]">
              <span className="block">Automatize suas</span>
              <span className="gradient-text block">publicações</span>
              <span className="block">no Telegram</span>
            </motion.h1>

            {/* Subheadline */}
            <motion.p initial={{
            opacity: 0,
            y: 20
          }} animate={{
            opacity: 1,
            y: 0
          }} transition={{
            duration: 0.6,
            delay: 0.5
          }} className="text-sm sm:text-base text-muted-foreground mb-8 max-w-lg mx-auto leading-relaxed">
              Envie mídias para grupos e canais de forma automática, com agendamento, 
              anti-spam e controle total. Plataforma segura e fácil de usar.
            </motion.p>

            {/* CTAs */}
            <motion.div initial={{
            opacity: 0,
            y: 20
          }} animate={{
            opacity: 1,
            y: 0
          }} transition={{
            duration: 0.6,
            delay: 0.7
          }} className="flex flex-col sm:flex-row gap-3 justify-center mb-8">
              <Link to="/signup">
                <motion.div whileHover={{
                scale: 1.05
              }} whileTap={{
                scale: 0.98
              }} transition={{
                type: "spring",
                stiffness: 400
              }}>
                  <Button variant="gradient" size="lg" className="w-full sm:w-auto text-sm relative overflow-hidden group">
                    Começar Agora
                    <ArrowRight className="w-4 h-4 ml-1.5 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </motion.div>
              </Link>
              <Link to="/login">
                <motion.div whileHover={{
                scale: 1.05
              }} whileTap={{
                scale: 0.98
              }} transition={{
                type: "spring",
                stiffness: 400
              }}>
                  <Button variant="outline" size="lg" className="w-full sm:w-auto text-sm">
                    Já tenho conta
                  </Button>
                </motion.div>
              </Link>
            </motion.div>

            {/* Stats */}
            <motion.div initial={{
            opacity: 0
          }} animate={{
            opacity: 1
          }} transition={{
            duration: 0.6,
            delay: 0.9
          }} className="flex items-center justify-center gap-8 sm:gap-12 mb-12">
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

          {/* MacBook Mockup with Real Dashboard */}
          <motion.div initial={{
          opacity: 0,
          y: 80,
          rotateX: 8
        }} animate={{
          opacity: 1,
          y: 0,
          rotateX: 0
        }} transition={{
          duration: 1.2,
          delay: 1,
          ease: [0.16, 1, 0.3, 1]
        }} className="max-w-5xl mx-auto" style={{
          perspective: "1200px"
        }}>
            <div className="relative">
              {/* Ambient glow effects */}
              <div className="absolute -inset-8 bg-gradient-to-b from-cyan-500/15 via-blue-500/10 to-purple-500/5 blur-3xl opacity-70 rounded-full" />
              <motion.div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[60%] h-[40%] bg-cyan-400/15 blur-[80px] rounded-full" animate={{
              opacity: [0.5, 0.8, 0.5],
              scale: [1, 1.05, 1]
            }} transition={{
              duration: 4,
              repeat: Infinity,
              ease: "easeInOut"
            }} />
              
              {/* MacBook Pro Frame */}
              <div className="relative">
                {/* Top bezel with camera */}
                <div className="bg-gradient-to-b from-[#3a3a3a] via-[#2a2a2a] to-[#1e1e1e] rounded-t-[20px] pt-[6px] px-[8px] sm:px-[10px] pb-[8px] sm:pb-[10px] shadow-[inset_0_1px_1px_rgba(255,255,255,0.1),inset_0_-1px_1px_rgba(0,0,0,0.3)]">
                  {/* Camera notch */}
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[90px] sm:w-[100px] h-[26px] sm:h-[28px] bg-[#1a1a1a] rounded-b-[14px] flex items-center justify-center z-20 shadow-[inset_0_-3px_6px_rgba(0,0,0,0.4),0_2px_4px_rgba(0,0,0,0.2)]">
                    <div className="w-[7px] h-[7px] rounded-full bg-gradient-to-b from-[#4a4a4a] to-[#2a2a2a] shadow-[inset_0_1px_2px_rgba(0,0,0,0.6),0_0_2px_rgba(255,255,255,0.1)]">
                      <div className="w-[3px] h-[3px] rounded-full bg-[#1a3a1a] mt-[2px] ml-[2px] opacity-60" />
                    </div>
                  </div>
                  
                  {/* Screen */}
                  <div className="bg-[#0d1117] rounded-[6px] overflow-hidden shadow-[0_0_0_1px_rgba(255,255,255,0.05),inset_0_0_60px_rgba(0,0,0,0.3)]">
                    {/* Browser chrome bar */}
                    <div className="bg-gradient-to-b from-[#21262d] to-[#161b22] h-[38px] sm:h-[42px] flex items-center px-3 sm:px-4 border-b border-[#30363d]/50 relative">
                      {/* Traffic lights */}
                      <div className="flex gap-[7px] items-center">
                        <div className="w-[11px] h-[11px] rounded-full bg-gradient-to-b from-[#ff6058] to-[#e14640] shadow-[inset_0_-1px_1px_rgba(0,0,0,0.2),0_1px_2px_rgba(0,0,0,0.1)]" />
                        <div className="w-[11px] h-[11px] rounded-full bg-gradient-to-b from-[#ffbe2f] to-[#dea123] shadow-[inset_0_-1px_1px_rgba(0,0,0,0.2),0_1px_2px_rgba(0,0,0,0.1)]" />
                        <div className="w-[11px] h-[11px] rounded-full bg-gradient-to-b from-[#2bc840] to-[#1fa834] shadow-[inset_0_-1px_1px_rgba(0,0,0,0.2),0_1px_2px_rgba(0,0,0,0.1)]" />
                      </div>
                      
                      {/* URL bar centered */}
                      <div className="absolute left-1/2 -translate-x-1/2 flex items-center">
                        <div className="bg-[#0d1117] rounded-lg px-3 sm:px-4 py-1.5 flex items-center gap-2 border border-[#30363d] shadow-[inset_0_1px_3px_rgba(0,0,0,0.3)]">
                          <div className="w-[15px] h-[15px] rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-sm">
                            <Shield className="w-[9px] h-[9px] text-white" />
                          </div>
                          <span className="text-[#8b949e] text-[10px] sm:text-[12px] font-medium">app.nexotg.com/dashboard</span>
                        </div>
                      </div>
                      
                      {/* Right side icons placeholder */}
                      <div className="ml-auto flex items-center gap-2">
                        <div className="w-4 h-4 rounded bg-[#30363d]/50" />
                      </div>
                    </div>
                    
                    {/* App layout with sidebar */}
                    <div className="flex min-h-[320px] sm:min-h-[380px]">
                      {/* Sidebar - matching real dashboard */}
                      <div className="hidden sm:flex flex-col items-center py-4 bg-gradient-to-b from-[#0d1117] to-[#0a0e14] border-r border-[#21262d] w-[56px]">
                        {/* Logo */}
                        <motion.div initial={{
                        scale: 0
                      }} animate={{
                        scale: 1
                      }} transition={{
                        delay: 1.3,
                        type: "spring",
                        stiffness: 300
                      }} className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-400 via-blue-500 to-blue-600 flex items-center justify-center mb-6 shadow-lg shadow-cyan-500/30">
                          <Zap className="w-5 h-5 text-white" />
                        </motion.div>
                        
                        {/* Nav icons */}
                        <div className="flex-1 flex flex-col items-center gap-1">
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-b from-[#21262d] to-[#1c2128] flex items-center justify-center border border-[#30363d]/50 shadow-sm">
                            <BarChart3 className="w-[18px] h-[18px] text-cyan-400" />
                          </div>
                          <div className="w-10 h-10 rounded-xl flex items-center justify-center hover:bg-[#21262d]/50 transition-colors">
                            <Target className="w-[18px] h-[18px] text-[#484f58]" />
                          </div>
                          <div className="w-10 h-10 rounded-xl flex items-center justify-center hover:bg-[#21262d]/50 transition-colors">
                            <Users className="w-[18px] h-[18px] text-[#484f58]" />
                          </div>
                          <div className="w-10 h-10 rounded-xl flex items-center justify-center hover:bg-[#21262d]/50 transition-colors">
                            <MessageCircle className="w-[18px] h-[18px] text-[#484f58]" />
                          </div>
                          <div className="w-10 h-10 rounded-xl flex items-center justify-center hover:bg-[#21262d]/50 transition-colors">
                            <DollarSign className="w-[18px] h-[18px] text-[#484f58]" />
                          </div>
                        </div>
                        
                        {/* User avatar */}
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-orange-400 via-pink-500 to-purple-500 flex items-center justify-center text-[11px] font-bold text-white shadow-lg ring-2 ring-[#21262d]">
                          JP
                        </div>
                      </div>

                      {/* Main content */}
                      <div className="flex-1 bg-[#0d1117] p-4 sm:p-5 overflow-hidden">
                        {/* Header with greeting */}
                        <div className="flex items-start justify-between mb-4 sm:mb-5">
                          <motion.div initial={{
                          opacity: 0,
                          x: -20
                        }} animate={{
                          opacity: 1,
                          x: 0
                        }} transition={{
                          delay: 1.4
                        }}>
                            <h3 className="text-[#f0f6fc] text-base sm:text-lg font-semibold flex items-center gap-2">
                              Olá, João! <span className="text-xl">👋</span>
                            </h3>
                            <p className="text-[#484f58] text-[10px] sm:text-[12px]">
                              Acompanhe o desempenho dos seus funis
                            </p>
                          </motion.div>
                          
                          <div className="flex items-center gap-2">
                            {/* Date picker mock */}
                            <motion.div initial={{
                            opacity: 0
                          }} animate={{
                            opacity: 1
                          }} transition={{
                            delay: 1.5
                          }} className="hidden sm:flex items-center gap-1.5 bg-[#21262d] rounded-lg px-2.5 py-1.5 border border-[#30363d] text-[10px] text-[#8b949e]">
                              <Clock className="w-3 h-3" />
                              Últimos 7 dias
                            </motion.div>
                            
                            {/* New funnel button */}
                            <motion.button initial={{
                            opacity: 0,
                            scale: 0.9
                          }} animate={{
                            opacity: 1,
                            scale: 1
                          }} transition={{
                            delay: 1.6
                          }} className="bg-gradient-to-r from-cyan-500 to-blue-600 text-white text-[10px] sm:text-[11px] px-3 py-2 rounded-lg font-semibold flex items-center gap-1 shadow-lg shadow-cyan-500/30">
                              <Plus className="w-3.5 h-3.5" />
                              Novo Funil
                            </motion.button>
                          </div>
                        </div>
                        
                        {/* Stats cards - matching real dashboard (3 cards) */}
                        <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-4 sm:mb-5">
                          {[{
                          icon: Users,
                          color: "text-cyan-400",
                          bg: "bg-cyan-500/10",
                          value: "247",
                          label: "Leads no Período"
                        }, {
                          icon: Target,
                          color: "text-emerald-400",
                          bg: "bg-emerald-500/10",
                          value: "8",
                          label: "Funis Ativos"
                        }, {
                          icon: DollarSign,
                          color: "text-emerald-400",
                          bg: "bg-emerald-500/10",
                          value: "R$ 12.450",
                          label: "Faturamento"
                        }].map((stat, i) => <motion.div key={i} initial={{
                          opacity: 0,
                          y: 15
                        }} animate={{
                          opacity: 1,
                          y: 0
                        }} transition={{
                          delay: 1.6 + i * 0.1
                        }} className="bg-[#161b22] rounded-xl p-3 sm:p-4 border border-[#21262d] hover:border-[#30363d] transition-colors">
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="text-[#484f58] text-[8px] sm:text-[10px] font-medium mb-1">{stat.label}</p>
                                  <p className="text-[#f0f6fc] text-lg sm:text-2xl font-bold">{stat.value}</p>
                                </div>
                                <div className={`p-2 sm:p-2.5 rounded-lg ${stat.bg}`}>
                                  <stat.icon className={`w-4 h-4 sm:w-5 sm:h-5 ${stat.color}`} />
                                </div>
                              </div>
                            </motion.div>)}
                        </div>

                        {/* Chart section - matching real dashboard */}
                        <motion.div initial={{
                        opacity: 0,
                        y: 20
                      }} animate={{
                        opacity: 1,
                        y: 0
                      }} transition={{
                        delay: 2
                      }} className="bg-[#161b22] rounded-xl border border-[#21262d] p-3 sm:p-4 mb-4">
                          <div className="flex items-center gap-2 mb-3">
                            <TrendingUp className="w-4 h-4 text-emerald-400" />
                            <span className="text-[#f0f6fc] text-[11px] sm:text-[13px] font-semibold">Evolução de Vendas - 7 dias</span>
                          </div>
                          
                          {/* Chart visualization */}
                          <div className="h-[80px] sm:h-[100px] flex items-end justify-between gap-1 px-1">
                            {[35, 52, 41, 68, 45, 89, 72].map((height, i) => <motion.div key={i} initial={{
                            height: 0
                          }} animate={{
                            height: `${height}%`
                          }} transition={{
                            delay: 2.1 + i * 0.08,
                            duration: 0.6,
                            ease: "easeOut"
                          }} className="flex-1 bg-gradient-to-t from-emerald-500/80 to-emerald-400/40 rounded-t-sm relative group">
                                <div className="absolute -top-5 left-1/2 -translate-x-1/2 text-[7px] text-[#8b949e] opacity-0 group-hover:opacity-100 transition-opacity">
                                  R${Math.round(height * 20)}
                                </div>
                              </motion.div>)}
                          </div>
                          <div className="flex justify-between mt-2 text-[7px] sm:text-[8px] text-[#484f58]">
                            <span>Seg</span>
                            <span>Ter</span>
                            <span>Qua</span>
                            <span>Qui</span>
                            <span>Sex</span>
                            <span>Sáb</span>
                            <span>Dom</span>
                          </div>
                        </motion.div>

                        {/* Funnel table - matching real dashboard */}
                        <motion.div initial={{
                        opacity: 0,
                        y: 20
                      }} animate={{
                        opacity: 1,
                        y: 0
                      }} transition={{
                        delay: 2.3
                      }} className="bg-[#161b22] rounded-xl border border-[#21262d] p-3 sm:p-4">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <Target className="w-4 h-4 text-[#8b949e]" />
                              <span className="text-[#f0f6fc] text-[11px] sm:text-[13px] font-semibold">Seus Funis</span>
                            </div>
                            <span className="text-cyan-400 text-[9px] sm:text-[10px] font-medium hover:underline cursor-pointer flex items-center gap-1">
                              Ver todos <ArrowRight className="w-3 h-3" />
                            </span>
                          </div>
                          
                          {/* Table header */}
                          <div className="grid grid-cols-5 gap-2 text-[7px] sm:text-[9px] text-[#484f58] uppercase tracking-wider pb-2 border-b border-[#21262d] font-medium">
                            <span>Nome</span>
                            <span className="hidden sm:block">Bot</span>
                            <span className="text-center">Leads</span>
                            <span className="text-center">Conv.</span>
                            <span className="text-center">Status</span>
                          </div>
                          
                          {/* Table rows */}
                          <div className="divide-y divide-[#21262d]/50">
                            {[{
                            name: "Vendas VIP",
                            bot: "@vip_bot",
                            leads: "89/67",
                            conv: 75,
                            active: true
                          }, {
                            name: "Captura Lead",
                            bot: "@lead_bot",
                            leads: "156/112",
                            conv: 72,
                            active: true
                          }, {
                            name: "Remarketing",
                            bot: "@rmkt_bot",
                            leads: "45/38",
                            conv: 84,
                            active: false
                          }].map((row, i) => <motion.div key={i} initial={{
                            opacity: 0,
                            x: -10
                          }} animate={{
                            opacity: 1,
                            x: 0
                          }} transition={{
                            delay: 2.4 + i * 0.1
                          }} className="grid grid-cols-5 gap-2 py-2.5 items-center hover:bg-[#1c2128] -mx-1 px-1 rounded transition-colors cursor-pointer">
                                <span className="text-[#f0f6fc] text-[9px] sm:text-[11px] font-medium truncate">{row.name}</span>
                                <span className="hidden sm:flex items-center gap-1 text-[#484f58] text-[8px] sm:text-[10px] font-mono">
                                  <Bot className="w-3 h-3" />
                                  {row.bot}
                                </span>
                                <span className="text-center text-[9px] sm:text-[11px]">
                                  <span className="text-[#f0f6fc] font-medium">{row.leads.split('/')[0]}</span>
                                  <span className="text-[#484f58] mx-0.5">/</span>
                                  <span className="text-emerald-400">{row.leads.split('/')[1]}</span>
                                </span>
                                <div className="flex justify-center">
                                  <span className={`px-1.5 py-0.5 rounded text-[7px] sm:text-[9px] font-bold ${row.conv >= 75 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'}`}>
                                    {row.conv}%
                                  </span>
                                </div>
                                <div className="flex justify-center">
                                  <span className={`flex items-center gap-1 text-[7px] sm:text-[9px] font-medium px-1.5 py-0.5 rounded ${row.active ? 'bg-emerald-500/20 text-emerald-400' : 'bg-[#21262d] text-[#484f58]'}`}>
                                    {row.active ? <Play className="w-2.5 h-2.5" /> : <Pause className="w-2.5 h-2.5" />}
                                    {row.active ? 'Ativo' : 'Pausado'}
                                  </span>
                                </div>
                              </motion.div>)}
                          </div>
                        </motion.div>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* MacBook bottom hinge */}
                <div className="relative">
                  <div className="bg-gradient-to-b from-[#2d2d2d] to-[#252525] h-[5px] mx-1 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]" />
                  <div className="bg-gradient-to-b from-[#3a3a3a] via-[#2d2d2d] to-[#1a1a1a] h-[16px] sm:h-[20px] rounded-b-[10px] mx-10 sm:mx-16 shadow-[inset_0_1px_1px_rgba(255,255,255,0.1),0_6px_24px_rgba(0,0,0,0.5)]">
                    <div className="w-[90px] sm:w-[110px] h-[3px] bg-[#0a0a0a] rounded-full mx-auto mt-[6px] sm:mt-[8px] shadow-[inset_0_1px_2px_rgba(0,0,0,0.5)]" />
                  </div>
                </div>
              </div>
              
              {/* Shadows */}
              <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 w-[45%] h-[25px] bg-black/60 blur-2xl rounded-[100%]" />
              <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 w-[65%] h-[10px] bg-black/40 blur-xl rounded-[100%]" />
            </div>
          </motion.div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-16 sm:py-24">
        <div className="container mx-auto px-4">
          <motion.div initial={{
          opacity: 0,
          y: 20
        }} whileInView={{
          opacity: 1,
          y: 0
        }} viewport={{
          once: true
        }} className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4">
              Por que sellers escolhem a Nexo?
            </h2>
            <p className="text-muted-foreground max-w-lg mx-auto">
              Tudo que você precisa para vender mais, em uma única plataforma.
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {benefits.map((benefit, index) => <motion.div key={index} initial={{
            opacity: 0,
            y: 20
          }} whileInView={{
            opacity: 1,
            y: 0
          }} viewport={{
            once: true
          }} transition={{
            duration: 0.3,
            delay: index * 0.1
          }}>
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
              </motion.div>)}
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section className="py-16 sm:py-24 bg-muted/30">
        <div className="container mx-auto px-4">
          <motion.div initial={{
          opacity: 0,
          y: 20
        }} whileInView={{
          opacity: 1,
          y: 0
        }} viewport={{
          once: true
        }} className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4">
              Comece a vender em 3 passos
            </h2>
            <p className="text-muted-foreground max-w-lg mx-auto">
              Sem complicação. Crie sua conta e comece a faturar hoje mesmo.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6 sm:gap-8 max-w-4xl mx-auto">
            {steps.map((step, index) => <motion.div key={index} initial={{
            opacity: 0,
            y: 20
          }} whileInView={{
            opacity: 1,
            y: 0
          }} viewport={{
            once: true
          }} transition={{
            duration: 0.3,
            delay: index * 0.15
          }} className="relative">
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
                {index < 2 && <ChevronRight className="hidden md:block absolute top-1/2 -right-4 w-6 h-6 text-muted-foreground/30 -translate-y-1/2" />}
              </motion.div>)}
          </div>

          <motion.div initial={{
          opacity: 0
        }} whileInView={{
          opacity: 1
        }} viewport={{
          once: true
        }} className="text-center mt-10">
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
      <section id="pricing" className="py-20 sm:py-28 bg-[#0a0a0f]">
        <div className="container mx-auto px-4">
          <motion.div initial={{
          opacity: 0,
          y: 20
        }} whileInView={{
          opacity: 1,
          y: 0
        }} viewport={{
          once: true
        }} className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 tracking-tight">
              Planos para cada <span className="text-cyan-400">necessidade</span>
            </h2>
            <p className="text-muted-foreground max-w-lg mx-auto text-base">
              Escolha o plano ideal para o seu negócio. Upgrade ou downgrade a qualquer momento.
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-6xl mx-auto">
            {plans.map((plan, index) => {
            const isPopular = plan.popular;
            return <motion.div key={index} initial={{
              opacity: 0,
              y: 20
            }} whileInView={{
              opacity: 1,
              y: 0
            }} viewport={{
              once: true
            }} transition={{
              duration: 0.4,
              delay: index * 0.1
            }} className="relative">
                  {/* Popular badge */}
                  {isPopular && <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
                      <span className="bg-cyan-500 text-white text-xs font-semibold px-4 py-1.5 rounded-full whitespace-nowrap">
                        Mais Popular
                      </span>
                    </div>}
                  
                  <div className={`h-full bg-[#0d1117] border rounded-xl transition-colors ${isPopular ? 'border-cyan-500/50' : 'border-[#1e2430] hover:border-[#2a3140]'}`}>
                    <div className="p-6">
                      {/* Plan name */}
                      <div className="mb-5">
                        <h3 className="text-lg font-semibold mb-2 text-foreground">
                          {plan.name}
                        </h3>
                        <p className="text-xs text-muted-foreground leading-relaxed min-h-[32px]">
                          {plan.description}
                        </p>
                      </div>
                      
                      {/* Price */}
                      <div className="mb-6">
                        <div className="flex items-baseline gap-0.5">
                          <span className="text-sm text-muted-foreground">R$</span>
                          <span className="text-4xl font-bold tracking-tight text-foreground">
                            {plan.price.replace('R$ ', '')}
                          </span>
                          <span className="text-sm text-muted-foreground">{plan.period}</span>
                        </div>
                      </div>

                      {/* Features */}
                      <div className="space-y-2.5 mb-6">
                        {plan.features.map((feature, i) => <div key={i} className="flex items-start gap-2">
                            <Check className="w-4 h-4 mt-0.5 flex-shrink-0 text-cyan-400" />
                            <span className="text-sm text-muted-foreground">
                              {feature}
                            </span>
                          </div>)}
                      </div>

                      {/* CTA Button */}
                      <Link to="/signup" className="block">
                        <Button variant={isPopular ? "default" : "outline"} className={`w-full h-11 font-medium text-sm transition-all ${isPopular ? 'bg-cyan-500 hover:bg-cyan-600 text-white border-0' : 'border-[#2a3140] text-foreground hover:bg-[#151b26] hover:border-[#3a4150]'}`}>
                          Selecionar
                        </Button>
                      </Link>
                    </div>
                  </div>
                </motion.div>;
          })}
          </div>
        </div>
      </section>

      <section className="py-16 sm:py-24 bg-muted/30">
        <div className="container mx-auto px-4">
          <motion.div initial={{
          opacity: 0,
          y: 20
        }} whileInView={{
          opacity: 1,
          y: 0
        }} viewport={{
          once: true
        }} className="max-w-2xl mx-auto text-center">
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
              <Button variant="outline" size="lg" onClick={openWhatsApp} className="w-full sm:w-auto">
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
              <img src="/logo-nexo.png" alt="Nexo" className="h-40" />
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
      <motion.button initial={{
      scale: 0
    }} animate={{
      scale: 1
    }} transition={{
      delay: 1,
      type: "spring"
    }} onClick={openWhatsApp} className="fixed bottom-6 right-6 w-14 h-14 bg-success rounded-full flex items-center justify-center shadow-lg hover:shadow-xl hover:scale-105 transition-all z-50 lg:hidden" aria-label="WhatsApp">
        <MessageCircle className="w-6 h-6 text-white" />
      </motion.button>
    </div>;
};
export default LandingPage;