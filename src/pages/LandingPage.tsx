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
  Smartphone,
  DollarSign,
  Target,
  Headphones,
  Gift,
  Rocket,
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
      <section className="pt-28 pb-16 sm:pt-36 sm:pb-24 relative overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-hero-pattern opacity-60" />
        <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-primary/10 rounded-full blur-[120px]" />
        
        <div className="container mx-auto px-4 relative">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="max-w-3xl mx-auto text-center"
          >
            {/* Badge */}
            <Badge variant="secondary" className="mb-6 px-4 py-1.5 text-xs font-medium">
              <Zap className="w-3 h-3 mr-1.5" />
              +500 novos sellers essa semana
            </Badge>

            {/* Headline */}
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-[1.1]">
              Venda mais no{" "}
              <span className="gradient-text">piloto automático</span>
            </h1>

            {/* Subheadline */}
            <p className="text-base sm:text-lg text-muted-foreground mb-8 max-w-xl mx-auto leading-relaxed">
              A plataforma completa para vendedores digitais. Funis automatizados, 
              pagamentos integrados e suporte 24h para você escalar suas vendas.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center mb-10">
              <Link to="/signup">
                <Button variant="gradient" size="lg" className="w-full sm:w-auto text-base">
                  Quero vender na Nexo
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
                Falar com consultor
              </Button>
            </div>

            {/* Trust indicators */}
            <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-success" />
                <span>Sem mensalidade</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-success" />
                <span>Setup em 5 min</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-success" />
                <span>Suporte incluso</span>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 border-y border-border/50 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
            {stats.map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
                className="text-center"
              >
                <div className="text-2xl sm:text-3xl md:text-4xl font-bold text-primary mb-1">
                  {stat.value}
                </div>
                <div className="text-xs sm:text-sm text-muted-foreground">{stat.label}</div>
              </motion.div>
            ))}
          </div>
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

      {/* Testimonials */}
      <section className="py-16 sm:py-24">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4">
              Sellers que já escalam com a Nexo
            </h2>
            <p className="text-muted-foreground max-w-lg mx-auto">
              Veja o que nossos vendedores dizem sobre a plataforma.
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 max-w-5xl mx-auto">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
              >
                <Card className="h-full border-border/50">
                  <CardContent className="p-5 sm:p-6">
                    {/* Rating */}
                    <div className="flex gap-0.5 mb-4">
                      {[...Array(testimonial.rating)].map((_, i) => (
                        <Star key={i} className="w-4 h-4 fill-warning text-warning" />
                      ))}
                    </div>
                    
                    {/* Content */}
                    <p className="text-sm text-foreground mb-4 leading-relaxed">
                      "{testimonial.content}"
                    </p>
                    
                    {/* Author */}
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-xs font-semibold text-primary">
                          {testimonial.avatar}
                        </span>
                      </div>
                      <div>
                        <div className="font-medium text-sm">{testimonial.name}</div>
                        <div className="text-xs text-muted-foreground">{testimonial.role}</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
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
