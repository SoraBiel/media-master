import { Send, Zap, Shield, BarChart3, Clock, Users, ArrowRight, Check, Sparkles, Star, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { motion, animate } from "framer-motion";
import { useEffect, useState } from "react";

// Animated counter component
const AnimatedNumber = ({ value, suffix = "" }: { value: number; suffix?: string }) => {
  const [displayValue, setDisplayValue] = useState(0);
  
  useEffect(() => {
    const controls = animate(0, value, {
      duration: 2,
      ease: "easeOut",
      onUpdate: (v) => setDisplayValue(Math.round(v)),
    });
    return () => controls.stop();
  }, [value]);
  
  return <>{displayValue}{suffix}</>;
};

const LandingPage = () => {
  const features = [{
    icon: <Send className="w-6 h-6" />,
    title: "Envio Automatizado",
    description: "Publique mídias em grupos e canais do Telegram de forma automática e programada."
  }, {
    icon: <Shield className="w-6 h-6" />,
    title: "Segurança Total",
    description: "Conexão segura via Bot Token ou sessão MTProto com criptografia em repouso."
  }, {
    icon: <Clock className="w-6 h-6" />,
    title: "Agendamento Inteligente",
    description: "Configure delays e limites anti-spam para evitar bloqueios do Telegram."
  }, {
    icon: <BarChart3 className="w-6 h-6" />,
    title: "Dashboard Completo",
    description: "Acompanhe o progresso em tempo real com logs detalhados e métricas."
  }, {
    icon: <Users className="w-6 h-6" />,
    title: "Multi-Destinos",
    description: "Gerencie múltiplos grupos e canais em uma única plataforma."
  }, {
    icon: <Sparkles className="w-6 h-6" />,
    title: "Model Hub",
    description: "Acesse templates prontos e estratégias de marketing com modelos IA."
  }];

  const plans = [{
    name: "Free",
    price: "R$ 0",
    period: "/mês",
    description: "Para testar a plataforma",
    features: ["1 destino", "100 mídias/mês", "Suporte por e-mail", "7 dias grátis"],
    cta: "Começar Grátis",
    popular: false
  }, {
    name: "Basic",
    price: "R$ 49",
    period: "/mês",
    description: "Para começar do zero",
    features: ["3 destinos", "500 mídias/mês", "Agendamento básico", "Suporte WhatsApp"],
    cta: "Selecionar",
    popular: false
  }, {
    name: "Pro",
    price: "R$ 99",
    period: "/mês",
    description: "Para escalar rápido",
    features: ["10 destinos", "2.000 mídias/mês", "Model Hub / IA", "Suporte 24/7"],
    cta: "Começar Agora",
    popular: true
  }, {
    name: "Agency",
    price: "R$ 299",
    period: "/mês",
    description: "Escala ilimitada",
    features: ["Destinos ilimitados", "Mídias ilimitadas", "API access", "Gerente dedicado"],
    cta: "Falar com Vendas",
    popular: false
  }];

  const stats = [
    { value: "50K+", label: "Usuários Ativos" },
    { value: "2M+", label: "Mensagens/Mês" },
    { value: "99.9%", label: "Uptime" },
    { value: "4.9", label: "Avaliação", icon: Star },
  ];

  return (
    <div className="min-h-screen bg-background overflow-hidden">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-border/30 bg-background/60 backdrop-blur-2xl">
        <div className="container mx-auto px-6 h-18 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <img src="/logo-nexo.png" alt="Nexo" className="h-32" />
          </Link>
          <nav className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors font-medium">
              Recursos
            </a>
            <a href="#pricing" className="text-sm text-muted-foreground hover:text-foreground transition-colors font-medium">
              Preços
            </a>
            <Link to="/login" className="text-sm text-muted-foreground hover:text-foreground transition-colors font-medium">
              Entrar
            </Link>
            <Link to="/signup">
              <Button variant="gradient" size="sm" className="shadow-lg shadow-telegram/20">
                Criar Conta
              </Button>
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-40 pb-24 overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0 bg-hero-pattern opacity-50" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1200px] h-[600px] rounded-full bg-telegram/8 blur-[120px]" />
        <div className="absolute bottom-0 right-0 w-[600px] h-[400px] rounded-full bg-purple-500/5 blur-[100px]" />
        
        <div className="container mx-auto px-6 relative">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="max-w-4xl mx-auto text-center"
          >
            {/* Badge */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-telegram/10 border border-telegram/20 mb-8"
            >
              <div className="w-2 h-2 rounded-full bg-telegram animate-pulse" />
              <span className="text-sm text-telegram font-medium">Automação inteligente para Telegram</span>
            </motion.div>
            
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold mb-8 leading-[1.1] tracking-tight">
              Automatize suas{" "}
              <span className="relative">
                <span className="gradient-text">publicações</span>
                <svg className="absolute -bottom-2 left-0 w-full" viewBox="0 0 300 12" fill="none">
                  <path d="M2 10C50 4 100 2 150 6C200 10 250 4 298 8" stroke="url(#underline-gradient)" strokeWidth="3" strokeLinecap="round"/>
                  <defs>
                    <linearGradient id="underline-gradient" x1="0" y1="0" x2="300" y2="0">
                      <stop stopColor="hsl(var(--telegram))" />
                      <stop offset="1" stopColor="hsl(var(--telegram))" stopOpacity="0.3" />
                    </linearGradient>
                  </defs>
                </svg>
              </span>
              <br />
              no Telegram
            </h1>
            
            <p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed">
              Envie mídias para grupos e canais de forma automática, com agendamento, 
              anti-spam e controle total. Plataforma segura e fácil de usar.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <Link to="/signup">
                <Button variant="gradient" size="xl" className="w-full sm:w-auto shadow-xl shadow-telegram/25 hover:shadow-telegram/40 transition-shadow">
                  Começar Gratuitamente
                  <ArrowRight className="w-5 h-5 ml-1" />
                </Button>
              </Link>
              <Button variant="outline" size="xl" className="w-full sm:w-auto group">
                <Play className="w-4 h-4 mr-2 group-hover:text-telegram transition-colors" />
                Ver Demo
              </Button>
            </div>

            {/* Social Proof Stats */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="flex flex-wrap justify-center gap-8 md:gap-12"
            >
              {stats.map((stat, i) => (
                <div key={i} className="text-center">
                  <div className="flex items-center justify-center gap-1">
                    <span className="text-2xl md:text-3xl font-bold text-foreground">{stat.value}</span>
                    {stat.icon && <stat.icon className="w-5 h-5 text-warning fill-warning" />}
                  </div>
                  <span className="text-sm text-muted-foreground">{stat.label}</span>
                </div>
              ))}
            </motion.div>
          </motion.div>

          {/* Mac Mockup Dashboard Preview */}
          <motion.div 
            initial={{ opacity: 0, y: 60 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.3, ease: "easeOut" }}
            className="mt-20 relative"
          >
            {/* Glow Effect */}
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent z-10 pointer-events-none" />
            <div className="absolute -inset-4 bg-telegram/10 blur-3xl rounded-3xl opacity-50" />
            
            {/* Mac Frame */}
            <div className="mx-auto max-w-5xl relative">
              {/* Mac Top Bezel */}
              <div className="bg-gradient-to-b from-[#2a2a2a] to-[#1a1a1a] rounded-t-2xl pt-3 pb-2 px-4 border-x border-t border-[#404040] shadow-2xl">
                <div className="flex items-center justify-center relative">
                  <div className="absolute left-2 flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-[#ff5f57] shadow-inner" />
                    <div className="w-3 h-3 rounded-full bg-[#febc2e] shadow-inner" />
                    <div className="w-3 h-3 rounded-full bg-[#28c840] shadow-inner" />
                  </div>
                  <div className="w-16 h-4 rounded-full bg-[#0a0a0a] flex items-center justify-center">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#333]" />
                  </div>
                </div>
              </div>
              
              {/* Mac Screen */}
              <div className="bg-[#0a0f1a] border-x border-[#404040] overflow-hidden shadow-2xl">
                {/* Browser Bar */}
                <div className="bg-gradient-to-b from-[#1e2433] to-[#1a1f2e] py-2.5 px-4 flex items-center justify-center border-b border-[#2a3344]">
                  <div className="bg-[#0d1117] rounded-lg px-4 py-2 text-xs text-muted-foreground flex items-center gap-2 border border-[#1e2533]">
                    <div className="w-3 h-3 rounded-full bg-success/30 flex items-center justify-center">
                      <div className="w-1.5 h-1.5 rounded-full bg-success" />
                    </div>
                    <span className="font-mono">app.nexotg.com/dashboard</span>
                  </div>
                </div>
                
                {/* Dashboard Content */}
                <div className="flex min-h-[420px]">
                  {/* Sidebar */}
                  <div className="w-16 bg-gradient-to-b from-[#0d1117] to-[#080c14] border-r border-[#1e2533] flex flex-col items-center py-5 gap-4">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-telegram to-telegram/70 flex items-center justify-center mb-3 shadow-lg shadow-telegram/20">
                      <Zap className="w-4 h-4 text-white" />
                    </div>
                    {[
                      { icon: BarChart3, active: true },
                      { icon: Users, active: false },
                      { icon: Send, active: false },
                      { icon: Clock, active: false },
                      { icon: Shield, active: false },
                    ].map((item, i) => (
                      <div 
                        key={i} 
                        className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${
                          item.active 
                            ? 'bg-telegram/20 text-telegram shadow-lg shadow-telegram/10' 
                            : 'bg-[#1e2533]/50 text-muted-foreground hover:bg-[#1e2533]'
                        }`}
                      >
                        <item.icon className="w-4 h-4" />
                      </div>
                    ))}
                  </div>
                  
                  {/* Main Content */}
                  <div className="flex-1 p-6 overflow-hidden bg-gradient-to-br from-[#0a0f1a] to-[#0d1219]">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-6">
                      <div>
                        <h3 className="text-xl font-bold text-foreground">Olá, João! 👋</h3>
                        <p className="text-sm text-muted-foreground">Acompanhe seus funis e conversões em tempo real.</p>
                      </div>
                      <motion.div 
                        className="px-4 py-2 rounded-xl bg-gradient-to-r from-telegram to-telegram/80 text-white text-sm font-medium flex items-center gap-2 shadow-lg shadow-telegram/30"
                        whileHover={{ scale: 1.02 }}
                      >
                        <span>+</span> Novo Funil
                      </motion.div>
                    </div>
                    
                    {/* Stats Row */}
                    <div className="grid grid-cols-6 gap-3 mb-6">
                      {[
                        { label: "Leads Hoje", value: 127, suffix: "", icon: Users, color: "text-telegram", bg: "bg-telegram/10", border: "border-telegram/20" },
                        { label: "Funis Ativos", value: 8, suffix: "", icon: BarChart3, color: "text-success", bg: "bg-success/10", border: "border-success/20" },
                        { label: "Sessões", value: 43, suffix: "", icon: Clock, color: "text-purple-400", bg: "bg-purple-400/10", border: "border-purple-400/20" },
                        { label: "Mensagens", value: 892, suffix: "", icon: Send, color: "text-warning", bg: "bg-warning/10", border: "border-warning/20" },
                        { label: "Conversão", value: 72, suffix: "%", icon: BarChart3, color: "text-pink-400", bg: "bg-pink-400/10", border: "border-pink-400/20" },
                        { label: "Status Bot", value: 0, suffix: "OK", icon: Shield, color: "text-success", bg: "bg-success/10", border: "border-success/20", isText: true },
                      ].map((stat, i) => (
                        <motion.div 
                          key={i} 
                          className={`bg-[#0d1117]/80 border ${stat.border} rounded-xl p-3 backdrop-blur-sm`}
                          initial={{ opacity: 0, y: 10 }}
                          whileInView={{ opacity: 1, y: 0 }}
                          viewport={{ once: true }}
                          transition={{ duration: 0.4, delay: 0.3 + i * 0.08 }}
                        >
                          <div className={`w-7 h-7 rounded-lg ${stat.bg} flex items-center justify-center mb-2`}>
                            <stat.icon className={`w-3.5 h-3.5 ${stat.color}`} />
                          </div>
                          <p className="text-xl font-bold text-foreground">
                            {stat.isText ? stat.suffix : <AnimatedNumber value={stat.value} suffix={stat.suffix} />}
                          </p>
                          <p className="text-[10px] text-muted-foreground font-medium">{stat.label}</p>
                        </motion.div>
                      ))}
                    </div>
                    
                    {/* Content Grid */}
                    <div className="grid grid-cols-3 gap-4">
                      {/* Funnel Table */}
                      <div className="col-span-2 bg-[#0d1117]/60 border border-[#1e2533] rounded-xl p-4 backdrop-blur-sm">
                        <div className="flex items-center justify-between mb-4">
                          <p className="text-sm font-semibold text-foreground flex items-center gap-2">
                            <BarChart3 className="w-4 h-4 text-telegram" /> Visão Geral dos Funis
                          </p>
                          <span className="text-xs text-telegram font-medium cursor-pointer hover:underline">Ver todos →</span>
                        </div>
                        <div className="space-y-1">
                          <div className="grid grid-cols-5 gap-2 text-[10px] text-muted-foreground pb-2 border-b border-[#1e2533] font-medium uppercase tracking-wider">
                            <span>Funil</span>
                            <span>Bot</span>
                            <span className="text-center">Leads</span>
                            <span className="text-center">Conv.</span>
                            <span className="text-center">Status</span>
                          </div>
                          {[
                            { name: "Vendas VIP", bot: "@nexo_bot", leads: "45/32", conv: "71%", active: true },
                            { name: "Captura Lead", bot: "@sales_bot", leads: "89/67", conv: "75%", active: true },
                            { name: "Suporte Auto", bot: "@help_bot", leads: "23/18", conv: "78%", active: false },
                          ].map((funnel, i) => (
                            <motion.div 
                              key={i} 
                              className="grid grid-cols-5 gap-2 text-xs py-3 border-b border-[#1e2533]/30 hover:bg-[#1e2533]/20 rounded-lg transition-colors cursor-pointer"
                              initial={{ opacity: 0, x: -20 }}
                              whileInView={{ opacity: 1, x: 0 }}
                              viewport={{ once: true }}
                              transition={{ duration: 0.4, delay: 0.5 + i * 0.12 }}
                            >
                              <span className="text-foreground font-medium truncate">{funnel.name}</span>
                              <span className="text-muted-foreground truncate font-mono text-[11px]">{funnel.bot}</span>
                              <span className="text-center text-foreground font-medium">{funnel.leads}</span>
                              <span className="text-center">
                                <span className="px-2 py-0.5 rounded-full bg-success/20 text-success text-[10px] font-semibold">{funnel.conv}</span>
                              </span>
                              <span className="text-center">
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${funnel.active ? 'bg-success/20 text-success' : 'bg-muted/20 text-muted-foreground'}`}>
                                  {funnel.active ? 'Ativo' : 'Pausado'}
                                </span>
                              </span>
                            </motion.div>
                          ))}
                        </div>
                      </div>
                      
                      {/* Recent Activity */}
                      <div className="bg-[#0d1117]/60 border border-[#1e2533] rounded-xl p-4 backdrop-blur-sm">
                        <p className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
                          <Clock className="w-4 h-4 text-purple-400" /> Atividade Recente
                        </p>
                        <div className="space-y-2">
                          {[
                            { msg: "Novo lead: @maria_silva", time: "agora", color: "bg-telegram" },
                            { msg: "Mensagem enviada", time: "2min", color: "bg-success" },
                            { msg: "Lead respondeu", time: "5min", color: "bg-purple-400" },
                            { msg: "Funil concluído", time: "12min", color: "bg-success" },
                          ].map((activity, i) => (
                            <motion.div 
                              key={i} 
                              className="flex items-center gap-3 p-2.5 rounded-lg bg-[#1e2533]/30 hover:bg-[#1e2533]/50 transition-colors cursor-pointer"
                              initial={{ opacity: 0, x: 10 }}
                              whileInView={{ opacity: 1, x: 0 }}
                              viewport={{ once: true }}
                              transition={{ duration: 0.3, delay: 0.7 + i * 0.1 }}
                            >
                              <div className={`w-2 h-2 rounded-full ${activity.color}`} />
                              <span className="text-[11px] text-foreground flex-1 truncate">{activity.msg}</span>
                              <span className="text-[10px] text-muted-foreground">{activity.time}</span>
                            </motion.div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Mac Bottom Bezel */}
              <div className="bg-gradient-to-b from-[#1a1a1a] to-[#0f0f0f] h-6 rounded-b-2xl border-x border-b border-[#404040]" />
              
              {/* Mac Stand */}
              <div className="flex justify-center">
                <div className="w-32 h-10 bg-gradient-to-b from-[#2a2a2a] to-[#1a1a1a] rounded-b-xl border-x border-b border-[#404040]" style={{ clipPath: 'polygon(10% 0, 90% 0, 100% 100%, 0 100%)' }} />
              </div>
              <div className="flex justify-center -mt-0.5">
                <div className="w-56 h-2 bg-gradient-to-b from-[#2a2a2a] to-[#1a1a1a] rounded-b-2xl border-x border-b border-[#404040]" />
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-telegram/3 to-transparent" />
        <div className="container mx-auto px-6 relative">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <span className="inline-block px-4 py-1.5 rounded-full bg-telegram/10 text-telegram text-sm font-medium mb-4">
              Recursos
            </span>
            <h2 className="text-4xl md:text-5xl font-bold mb-6 tracking-tight">
              Tudo que você precisa para{" "}
              <span className="gradient-text">automatizar</span>
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
              Uma plataforma completa para gerenciar suas publicações no Telegram com segurança e eficiência.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <motion.div 
                key={index} 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="group relative"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-telegram/10 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="glass-card p-8 rounded-2xl hover:border-telegram/30 transition-all duration-300 relative h-full">
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-telegram/20 to-telegram/5 flex items-center justify-center text-telegram mb-6 group-hover:scale-110 transition-transform duration-300">
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-24 relative">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] rounded-full bg-purple-500/5 blur-[100px]" />
        <div className="container mx-auto px-6 relative">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <span className="inline-block px-4 py-1.5 rounded-full bg-telegram/10 text-telegram text-sm font-medium mb-4">
              Preços
            </span>
            <h2 className="text-4xl md:text-5xl font-bold mb-6 tracking-tight">
              Planos para cada{" "}
              <span className="gradient-text">necessidade</span>
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
              Escolha o plano ideal para o seu negócio. Upgrade ou downgrade a qualquer momento.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            {plans.map((plan, index) => (
              <motion.div 
                key={index} 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className={`relative group ${plan.popular ? 'lg:-mt-4 lg:mb-4' : ''}`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-10">
                    <span className="px-4 py-1.5 text-xs font-semibold telegram-gradient text-white rounded-full shadow-lg shadow-telegram/30">
                      Mais Popular
                    </span>
                  </div>
                )}
                <div className={`glass-card p-8 rounded-2xl h-full transition-all duration-300 ${
                  plan.popular 
                    ? 'border-telegram ring-2 ring-telegram/20 shadow-xl shadow-telegram/10' 
                    : 'hover:border-border/80'
                }`}>
                  <div className="mb-6">
                    <h3 className="text-xl font-bold mb-1">{plan.name}</h3>
                    <p className="text-sm text-muted-foreground">{plan.description}</p>
                  </div>
                  <div className="mb-8">
                    <span className="text-5xl font-bold">{plan.price}</span>
                    <span className="text-muted-foreground text-lg">{plan.period}</span>
                  </div>
                  <ul className="space-y-4 mb-8">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-center gap-3 text-sm">
                        <div className="w-5 h-5 rounded-full bg-telegram/20 flex items-center justify-center flex-shrink-0">
                          <Check className="w-3 h-3 text-telegram" />
                        </div>
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Link to="/signup">
                    <Button 
                      variant={plan.popular ? "gradient" : "outline"} 
                      className={`w-full ${plan.popular ? 'shadow-lg shadow-telegram/25' : ''}`}
                    >
                      {plan.cta}
                    </Button>
                  </Link>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24">
        <div className="container mx-auto px-6">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="relative max-w-4xl mx-auto"
          >
            <div className="absolute -inset-4 bg-gradient-to-r from-telegram/20 via-purple-500/10 to-telegram/20 rounded-3xl blur-2xl" />
            <div className="glass-card p-12 md:p-16 text-center relative overflow-hidden rounded-3xl border-telegram/20">
              <div className="absolute inset-0 bg-gradient-to-br from-telegram/10 via-transparent to-purple-500/5" />
              <div className="relative">
                <h2 className="text-4xl md:text-5xl font-bold mb-6 tracking-tight">
                  Pronto para automatizar?
                </h2>
                <p className="text-muted-foreground mb-10 max-w-xl mx-auto text-lg">
                  Crie sua conta em menos de 2 minutos e comece a publicar de forma automática hoje mesmo.
                </p>
                <Link to="/signup">
                  <Button variant="gradient" size="xl" className="shadow-xl shadow-telegram/30">
                    Criar Conta Grátis
                    <ArrowRight className="w-5 h-5 ml-1" />
                  </Button>
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/50 py-12 bg-background/50">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <img src="/logo-nexo.png" alt="Nexo" className="h-32" />
            </div>
            <p className="text-sm text-muted-foreground">
              © 2024 Nexo. Todos os direitos reservados.
            </p>
            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <a href="#" className="hover:text-foreground transition-colors">Termos</a>
              <a href="#" className="hover:text-foreground transition-colors">Privacidade</a>
              <a href="#" className="hover:text-foreground transition-colors">Suporte</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
