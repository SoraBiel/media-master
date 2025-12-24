import { Send, Zap, Shield, BarChart3, Clock, Users, ArrowRight, Check, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
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
    price: "R$ 0,00",
    period: "/mês",
    description: "Para conhecer a estrutura por dentro. Teste grátis por 7 dias",
    features: ["1 destino", "100 mídias/mês", "1 destino (grupo)", "Até 100 mídias/dia", "Acesso à plataforma", "Suporte por e-mail", "Teste grátis por 7 dias"],
    cta: "Selecionar",
    popular: false
  }, {
    name: "Basic",
    price: "R$ 49,90",
    period: "/mês",
    description: "Para quem quer sair do zero e começar certo",
    features: ["3 destinos", "500 mídias/mês", "Agendamento", "3 destinos (grupos)", "500 mídias/dia", "Agendamento básico", "Fluxo de chat padrão", "Suporte prioritário (WhatsApp)"],
    cta: "Selecionar",
    popular: false
  }, {
    name: "Pro",
    price: "R$ 99,90",
    period: "/mês",
    description: "Para quem quer ganhar velocidade e escalar",
    features: ["10 destinos", "2.000 mídias/mês", "Agendamento", "Model Hub", "10 destinos", "2.000 mídias/dia", "Agendamento avançado", "Fluxos de chat otimizado", "Model Hub / IA", "Modelos Vazados", "Suporte 24/7 (WhatsApp)"],
    cta: "Selecionar",
    popular: true
  }, {
    name: "Agency",
    price: "R$ 299,90",
    period: "/mês",
    description: "Escala máxima, sem limite",
    features: ["∞ destinos", "∞ mídias/mês", "Agendamento", "Model Hub", "Destinos ilimitados", "Mídias ilimitadas", "Todas as ferramentas liberadas", "API access", "Gerente dedicado"],
    cta: "Selecionar",
    popular: false
  }];
  return <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <img src="/logo-nexo.png" alt="Nexo" className="h-40" />
          </Link>
          <nav className="hidden md:flex items-center gap-6">
            <a href="#features" className="text-muted-foreground hover:text-foreground transition-colors">
              Recursos
            </a>
            <a href="#pricing" className="text-muted-foreground hover:text-foreground transition-colors">
              Preços
            </a>
            <Link to="/login" className="text-muted-foreground hover:text-foreground transition-colors">
              Entrar
            </Link>
            <Link to="/signup">
              <Button variant="gradient" size="sm">
                Criar Conta
              </Button>
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 overflow-hidden">
        <div className="absolute inset-0 bg-hero-pattern" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-telegram/5 blur-3xl" />
        
        <div className="container mx-auto px-4 relative">
          <motion.div initial={{
          opacity: 0,
          y: 20
        }} animate={{
          opacity: 1,
          y: 0
        }} transition={{
          duration: 0.6
        }} className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary/50 border border-border mb-6">
              <Zap className="w-4 h-4 text-telegram" />
              <span className="text-sm text-muted-foreground">Automação inteligente para Telegram</span>
            </div>
            
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight">
              Automatize suas{" "}
              <span className="gradient-text">publicações</span>{" "}
              no Telegram
            </h1>
            
            <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Envie mídias para grupos e canais de forma automática, com agendamento, 
              anti-spam e controle total. Tudo em uma plataforma segura e fácil de usar.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/signup">
                <Button variant="gradient" size="xl" className="w-full sm:w-auto">
                  Começar Agora
                  <ArrowRight className="w-5 h-5" />
                </Button>
              </Link>
              <Link to="/login">
                <Button variant="outline" size="xl" className="w-full sm:w-auto">
                  Já tenho conta
                </Button>
              </Link>
            </div>
          </motion.div>

          {/* Mac Mockup Dashboard Preview */}
          <motion.div initial={{
          opacity: 0,
          y: 40
        }} animate={{
          opacity: 1,
          y: 0
        }} transition={{
          duration: 0.8,
          delay: 0.2
        }} className="mt-16 relative">
            <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent z-10 pointer-events-none" />
            
            {/* Mac Frame */}
            <div className="mx-auto max-w-5xl">
              {/* Mac Top Bezel */}
              <div className="bg-[#1a1a1a] rounded-t-2xl pt-3 pb-2 px-4 border-x border-t border-[#333]">
                <div className="flex items-center justify-center relative">
                  <div className="absolute left-0 flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-[#ff5f57]" />
                    <div className="w-3 h-3 rounded-full bg-[#febc2e]" />
                    <div className="w-3 h-3 rounded-full bg-[#28c840]" />
                  </div>
                  <div className="w-1.5 h-1.5 rounded-full bg-[#444]" />
                </div>
              </div>
              
              {/* Mac Screen */}
              <div className="bg-[#0a0f1a] border-x border-[#333] overflow-hidden">
                {/* Browser Bar */}
                <div className="bg-[#1a1f2e] py-2 px-4 flex items-center justify-center">
                  <div className="bg-[#0d1117] rounded-md px-4 py-1.5 text-xs text-muted-foreground flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-success/50 flex items-center justify-center">
                      <div className="w-1.5 h-1.5 rounded-full bg-success" />
                    </div>
                    <span>app.nexotg.com/dashboard</span>
                  </div>
                </div>
                
                {/* Dashboard Content */}
                <div className="flex min-h-[380px]">
                  {/* Sidebar */}
                  <div className="w-14 bg-[#0d1117] border-r border-[#1e2533] flex flex-col items-center py-4 gap-4">
                    <div className="w-8 h-8 rounded-lg bg-telegram/20 flex items-center justify-center">
                      <Zap className="w-4 h-4 text-telegram" />
                    </div>
                    {[1, 2, 3, 4].map(i => (
                      <div key={i} className="w-8 h-8 rounded-lg bg-[#1e2533] flex items-center justify-center">
                        <div className="w-4 h-4 rounded bg-[#2a3441]" />
                      </div>
                    ))}
                  </div>
                  
                  {/* Main Content */}
                  <div className="flex-1 p-6">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-6">
                      <div>
                        <p className="text-xs text-muted-foreground tracking-widest mb-1">LIVE MARKET ANALYTICS</p>
                        <div className="flex items-center gap-3">
                          <h3 className="text-xl font-bold text-foreground">Nexo Quantum Core</h3>
                          <span className="px-2 py-0.5 text-xs font-medium bg-success/20 text-success rounded">LIVE</span>
                          <div className="text-xs text-muted-foreground">
                            VOL 24H <span className="text-telegram font-semibold">$1.2B</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Stats Row */}
                    <div className="flex gap-8 mb-6">
                      <div className="text-center">
                        <p className="text-xs text-muted-foreground mb-1">WIN RATE</p>
                        <p className="text-2xl font-bold text-success">94.8%</p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-muted-foreground mb-1">DRAWDOWN</p>
                        <p className="text-2xl font-bold text-foreground">0.8%</p>
                      </div>
                    </div>
                    
                    {/* Chart Area */}
                    <div className="h-32 flex items-end gap-1">
                      {[40, 55, 35, 60, 45, 70, 50, 65, 55, 75, 60, 80, 70, 85, 75, 90, 80, 95, 85, 70, 90, 75, 95, 80, 85].map((height, i) => (
                        <div 
                          key={i} 
                          className="flex-1 bg-telegram/80 rounded-t-sm transition-all hover:bg-telegram"
                          style={{ height: `${height}%` }}
                        />
                      ))}
                    </div>
                  </div>
                  
                  {/* Right Panel - Signals */}
                  <div className="w-56 border-l border-[#1e2533] p-4">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
                      <p className="text-xs text-muted-foreground tracking-wider">RECENT SIGNALS</p>
                    </div>
                    
                    <div className="space-y-3">
                      {[
                        { pair: "ADA/USDT", type: "VENDA", value: "$8807.81", change: "+2.7%" },
                        { pair: "ADA/USDT", type: "COMPRA", value: "$29873.39", change: "+4.8%" },
                        { pair: "BTC/USDT", type: "VENDA", value: "$2535.68", change: "+1.3%" },
                      ].map((signal, i) => (
                        <div key={i} className="bg-[#0d1117] rounded-lg p-3 border border-[#1e2533]">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="text-sm font-medium text-foreground">{signal.pair}</p>
                              <p className={`text-xs ${signal.type === 'VENDA' ? 'text-destructive' : 'text-success'}`}>
                                {signal.type}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-medium text-foreground">{signal.value}</p>
                              <p className="text-xs text-success">{signal.change}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Mac Bottom Bezel */}
              <div className="bg-[#1a1a1a] h-5 rounded-b-2xl border-x border-b border-[#333]" />
              
              {/* Mac Stand */}
              <div className="flex justify-center">
                <div className="w-28 h-8 bg-gradient-to-b from-[#2a2a2a] to-[#1a1a1a] rounded-b-lg" />
              </div>
              <div className="flex justify-center -mt-1">
                <div className="w-48 h-2 bg-gradient-to-b from-[#2a2a2a] to-[#1a1a1a] rounded-b-xl" />
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 border-t border-border">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Tudo que você precisa para{" "}
              <span className="gradient-text">automatizar</span>
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Uma plataforma completa para gerenciar suas publicações no Telegram com segurança e eficiência.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => <motion.div key={index} initial={{
            opacity: 0,
            y: 20
          }} whileInView={{
            opacity: 1,
            y: 0
          }} viewport={{
            once: true
          }} transition={{
            duration: 0.5,
            delay: index * 0.1
          }} className="glass-card p-6 hover:border-telegram/30 transition-colors group">
                <div className="w-12 h-12 rounded-lg bg-telegram/10 flex items-center justify-center text-telegram mb-4 group-hover:bg-telegram/20 transition-colors">
                  {feature.icon}
                </div>
                <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                <p className="text-muted-foreground text-sm">{feature.description}</p>
              </motion.div>)}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 border-t border-border">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Planos para cada{" "}
              <span className="gradient-text">necessidade</span>
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Escolha o plano ideal para o seu negócio. Upgrade ou downgrade a qualquer momento.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            {plans.map((plan, index) => <motion.div key={index} initial={{
            opacity: 0,
            y: 20
          }} whileInView={{
            opacity: 1,
            y: 0
          }} viewport={{
            once: true
          }} transition={{
            duration: 0.5,
            delay: index * 0.1
          }} className={`glass-card p-6 relative ${plan.popular ? 'border-telegram ring-1 ring-telegram/20' : ''}`}>
                {plan.popular && <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="px-3 py-1 text-xs font-medium telegram-gradient text-white rounded-full">
                      Mais Popular
                    </span>
                  </div>}
                <div className="mb-4">
                  <h3 className="text-lg font-semibold">{plan.name}</h3>
                  <p className="text-sm text-muted-foreground">{plan.description}</p>
                </div>
                <div className="mb-6">
                  <span className="text-4xl font-bold">{plan.price}</span>
                  <span className="text-muted-foreground">{plan.period}</span>
                </div>
                <ul className="space-y-3 mb-6">
                  {plan.features.map((feature, i) => <li key={i} className="flex items-center gap-2 text-sm">
                      <Check className="w-4 h-4 text-telegram" />
                      <span>{feature}</span>
                    </li>)}
                </ul>
                <Link to="/signup">
                  <Button variant={plan.popular ? "gradient" : "outline"} className="w-full">
                    {plan.cta}
                  </Button>
                </Link>
              </motion.div>)}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 border-t border-border">
        <div className="container mx-auto px-4">
          <div className="glass-card p-8 md:p-12 text-center relative overflow-hidden max-w-4xl mx-auto">
            <div className="absolute inset-0 bg-gradient-to-br from-telegram/10 via-transparent to-transparent" />
            <div className="relative">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Pronto para automatizar?
              </h2>
              <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
                Crie sua conta em menos de 2 minutos e comece a publicar de forma automática hoje mesmo.
              </p>
              <Link to="/signup">
                <Button variant="gradient" size="xl">
                  Criar Conta Grátis
                  <ArrowRight className="w-5 h-5" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <img src="/logo-nexo.png" alt="Nexo" className="h-40" />
            </div>
            <p className="text-sm text-muted-foreground">
              © 2024 Nexo. Todos os direitos reservados.
            </p>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <a href="#" className="hover:text-foreground transition-colors">Termos</a>
              <a href="#" className="hover:text-foreground transition-colors">Privacidade</a>
              <a href="#" className="hover:text-foreground transition-colors">Suporte</a>
            </div>
          </div>
        </div>
      </footer>
    </div>;
};
export default LandingPage;