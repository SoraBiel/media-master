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
            className="max-w-4xl mx-auto"
          >
            <div className="relative">
              {/* Glow effect */}
              <div className="absolute inset-0 bg-gradient-to-t from-primary/15 via-transparent to-transparent blur-2xl scale-95" />
              
              {/* MacBook Frame */}
              <div className="relative bg-zinc-900 rounded-t-2xl p-2 sm:p-3 border border-zinc-700/50">
                {/* Camera notch */}
                <div className="absolute top-1.5 left-1/2 -translate-x-1/2 w-16 h-4 bg-zinc-800 rounded-b-lg flex items-center justify-center">
                  <div className="w-2 h-2 rounded-full bg-zinc-700" />
                </div>
                
                {/* Screen content */}
                <div className="bg-[#0a0f1a] rounded-lg overflow-hidden mt-2 border border-zinc-800">
                  {/* Browser bar */}
                  <div className="bg-zinc-900/90 px-3 py-2 flex items-center gap-2 border-b border-zinc-800">
                    <div className="flex gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
                      <div className="w-2.5 h-2.5 rounded-full bg-yellow-500" />
                      <div className="w-2.5 h-2.5 rounded-full bg-green-500" />
                    </div>
                    <div className="flex-1 mx-3">
                      <div className="bg-zinc-800/80 rounded-md px-3 py-1 text-[10px] sm:text-xs text-zinc-400 flex items-center gap-2">
                        <Shield className="w-3 h-3 text-green-500" />
                        app.nexo.com/dashboard
                      </div>
                    </div>
                    <Button variant="default" size="sm" className="h-6 text-[10px] px-3 hidden sm:flex">
                      + Novo Funil
                    </Button>
                  </div>
                  
                  {/* Dashboard content */}
                  <div className="p-3 sm:p-5">
                    {/* Welcome header */}
                    <div className="mb-4">
                      <h3 className="text-white text-sm sm:text-base font-semibold flex items-center gap-2">
                        Olá, João! <span className="text-lg">👋</span>
                      </h3>
                      <p className="text-zinc-500 text-[10px] sm:text-xs">
                        Acompanhe seus funis e conversões em tempo real.
                      </p>
                    </div>
                    
                    {/* Stats grid */}
                    <div className="grid grid-cols-6 gap-2 sm:gap-3 mb-4">
                      {[
                        { icon: "📊", value: "127", label: "Leads Hoje", color: "bg-blue-500/10 border-blue-500/20" },
                        { icon: "🤖", value: "8", label: "Funis Ativos", color: "bg-purple-500/10 border-purple-500/20" },
                        { icon: "💬", value: "43", label: "Sessões", color: "bg-cyan-500/10 border-cyan-500/20" },
                        { icon: "📤", value: "892", label: "Msgs Enviadas", color: "bg-green-500/10 border-green-500/20" },
                        { icon: "📈", value: "72%", label: "Conversão", color: "bg-yellow-500/10 border-yellow-500/20" },
                        { icon: "✅", value: "OK", label: "Status", color: "bg-emerald-500/10 border-emerald-500/20" },
                      ].map((stat, i) => (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 1.3 + i * 0.08 }}
                          className={`${stat.color} rounded-lg p-2 sm:p-3 border`}
                        >
                          <div className="text-base sm:text-lg mb-1">{stat.icon}</div>
                          <div className="text-white text-sm sm:text-lg font-bold">{stat.value}</div>
                          <div className="text-zinc-500 text-[8px] sm:text-[10px]">{stat.label}</div>
                        </motion.div>
                      ))}
                    </div>

                    {/* Bottom section - Table and Activity */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {/* Table */}
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 1.8 }}
                        className="bg-zinc-900/50 rounded-lg border border-zinc-800 p-3"
                      >
                        <div className="text-white text-xs font-semibold mb-2 flex items-center gap-1.5">
                          <BarChart3 className="w-3 h-3 text-primary" />
                          Visão Geral dos Funis
                        </div>
                        <div className="space-y-1.5">
                          {[
                            { name: "Vendas VIP", leads: "2450", rate: "12.4%" },
                            { name: "Captação Lead", leads: "1820", rate: "8.2%" },
                            { name: "Remarketing", leads: "956", rate: "15.7%" },
                          ].map((row, i) => (
                            <div key={i} className="flex items-center justify-between text-[9px] sm:text-[10px] py-1 border-b border-zinc-800/50 last:border-0">
                              <span className="text-zinc-300">{row.name}</span>
                              <div className="flex gap-3">
                                <span className="text-zinc-500">{row.leads}</span>
                                <span className="text-green-400">{row.rate}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </motion.div>

                      {/* Activity */}
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 1.9 }}
                        className="bg-zinc-900/50 rounded-lg border border-zinc-800 p-3"
                      >
                        <div className="text-white text-xs font-semibold mb-2 flex items-center gap-1.5">
                          <Clock className="w-3 h-3 text-primary" />
                          Atividade Recente
                        </div>
                        <div className="space-y-1.5">
                          {[
                            { icon: "🟢", text: "Novo lead @maria_silva", time: "2min" },
                            { icon: "💰", text: "Pagamento confirmado", time: "5min" },
                            { icon: "📨", text: "Mensagem entregue", time: "8min" },
                          ].map((item, i) => (
                            <div key={i} className="flex items-center justify-between text-[9px] sm:text-[10px] py-1 border-b border-zinc-800/50 last:border-0">
                              <div className="flex items-center gap-1.5">
                                <span>{item.icon}</span>
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
              
              {/* MacBook bottom/base */}
              <div className="bg-gradient-to-b from-zinc-800 to-zinc-700 h-4 sm:h-5 rounded-b-xl mx-4">
                <div className="w-20 sm:w-28 h-1 bg-zinc-600/50 rounded-full mx-auto mt-1.5" />
              </div>
              
              {/* Shadow */}
              <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 w-[70%] h-6 bg-black/30 blur-xl rounded-full" />
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
