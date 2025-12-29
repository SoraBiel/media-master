import { useRef, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Play, 
  MessageSquare, 
  HelpCircle, 
  ListChecks,
  Hash,
  GitBranch, 
  Clock,
  Variable,
  Send,
  Bell,
  Webhook,
  Flag,
  RefreshCcw,
  CreditCard,
  GripVertical,
  Package,
  ChevronLeft,
  ChevronRight,
  BookOpen,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { BlockType, BLOCK_INFO, BLOCK_CATEGORIES } from './types';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';

const ICONS: Record<BlockType, typeof Play> = {
  start: Play,
  message: MessageSquare,
  question: HelpCircle,
  question_choice: ListChecks,
  question_number: Hash,
  condition: GitBranch,
  delay: Clock,
  variable: Variable,
  action_message: Send,
  action_notify: Bell,
  action_webhook: Webhook,
  remarketing: RefreshCcw,
  payment: CreditCard,
  delivery: Package,
  end: Flag,
};

// Explicações detalhadas de cada bloco
const BLOCK_HELP: Record<BlockType, { emoji: string; title: string; what: string; how: string; example: string }> = {
  start: {
    emoji: '🚀',
    title: 'Bloco de Início',
    what: 'É a porta de entrada do seu funil. Todo lead que inicia uma conversa com seu bot começa por aqui.',
    how: 'Basta arrastar para o canvas. Ele é obrigatório e deve ser o primeiro bloco do fluxo.',
    example: 'Quando alguém manda "/start" ou clica no link do seu bot, o fluxo começa neste bloco.'
  },
  message: {
    emoji: '💬',
    title: 'Bloco de Mensagem',
    what: 'Envia uma mensagem para o lead. Pode ser texto, imagem, vídeo ou áudio.',
    how: 'Arraste para o canvas, conecte após outro bloco e escreva sua mensagem. Você pode adicionar mídia clicando nos ícones.',
    example: '"Olá! Seja bem-vindo ao nosso atendimento 😊" ou envie um vídeo de apresentação.'
  },
  question: {
    emoji: '✍️',
    title: 'Pergunta (Texto)',
    what: 'Faz uma pergunta e espera uma resposta em texto livre. A resposta fica salva em uma variável.',
    how: 'Defina a pergunta e o nome da variável. O bot vai esperar o lead digitar antes de continuar.',
    example: '"Qual seu nome?" → A resposta fica salva na variável {nome} para usar depois.'
  },
  question_choice: {
    emoji: '🔘',
    title: 'Pergunta (Escolha)',
    what: 'Mostra opções para o lead escolher. Cada opção pode levar para um caminho diferente.',
    how: 'Adicione as opções (ex: "Sim", "Não") e conecte cada uma a blocos diferentes.',
    example: '"Você tem interesse em qual produto?" com opções: "Curso A", "Curso B", "Outro"'
  },
  question_number: {
    emoji: '🔢',
    title: 'Pergunta (Número)',
    what: 'Faz uma pergunta e espera um número como resposta. Útil para CPF, telefone, idade, etc.',
    how: 'Igual à pergunta de texto, mas só aceita números. Ótimo para validar dados.',
    example: '"Qual seu telefone com DDD?" → Salva na variável {telefone}'
  },
  condition: {
    emoji: '🔀',
    title: 'Condição (IF/ELSE)',
    what: 'Verifica uma condição e decide qual caminho seguir. É como um "se isso, então aquilo".',
    how: 'Escolha a variável, o operador (igual, contém, maior que) e o valor para comparar.',
    example: 'Se {interesse} = "Curso A" → vai para explicação do Curso A, senão → vai para Curso B'
  },
  delay: {
    emoji: '⏱️',
    title: 'Delay (Espera)',
    what: 'Pausa o fluxo por alguns segundos antes de continuar. Deixa a conversa mais natural.',
    how: 'Defina quantos segundos esperar (ex: 3 segundos). O bot fica "digitando" nesse tempo.',
    example: 'Depois de uma mensagem longa, espera 2 segundos antes de mandar a próxima.'
  },
  variable: {
    emoji: '📦',
    title: 'Variável',
    what: 'Salva um valor em uma variável para usar depois. Como uma caixinha que guarda informação.',
    how: 'Escolha o nome da variável e o valor. Pode usar outras variáveis também.',
    example: 'Salvar {produto} = "Curso Premium" para usar na mensagem de pagamento.'
  },
  action_message: {
    emoji: '📤',
    title: 'Ação: Enviar Mensagem',
    what: 'Envia uma mensagem sem esperar resposta. Igual ao bloco de mensagem mas continua automaticamente.',
    how: 'Escreva a mensagem e conecte ao próximo bloco. O fluxo continua sem parar.',
    example: 'Enviar "Aguarde um momento..." enquanto processa algo.'
  },
  action_notify: {
    emoji: '🔔',
    title: 'Ação: Notificar Admin',
    what: 'Manda uma notificação para você (admin) quando algo importante acontece.',
    how: 'Configure a mensagem de notificação. Você recebe no Telegram ou onde configurar.',
    example: 'Notificar quando alguém solicitar falar com humano: "Lead {nome} quer atendimento!"'
  },
  action_webhook: {
    emoji: '🔗',
    title: 'Ação: Webhook',
    what: 'Envia dados para um sistema externo. Útil para integrações com CRMs, planilhas, etc.',
    how: 'Cole a URL do webhook e escolha quais dados enviar. Funciona com Zapier, Make, etc.',
    example: 'Enviar nome e email do lead para uma planilha do Google Sheets automaticamente.'
  },
  remarketing: {
    emoji: '🔄',
    title: 'Remarketing',
    what: 'Agenda uma mensagem para ser enviada depois de um tempo. Recupera leads que não compraram.',
    how: 'Defina a mensagem e quanto tempo esperar (ex: 30 minutos). Só envia se não pagou.',
    example: 'Se não pagar em 30 min, enviar: "Ei, ainda está interessado? Posso ajudar!"'
  },
  payment: {
    emoji: '💳',
    title: 'Pagamento (PIX)',
    what: 'Gera um pagamento PIX para o lead. Mostra QR Code e código copia-e-cola.',
    how: 'Selecione o produto cadastrado. O sistema gera o PIX automaticamente.',
    example: 'Quando lead confirma interesse, gerar PIX de R$ 97,00 para o "Curso Premium".'
  },
  delivery: {
    emoji: '📬',
    title: 'Entrega',
    what: 'Entrega o produto após o pagamento. Pode ser link, mensagem, acesso a grupo, etc.',
    how: 'Configure o que entregar: link de download, mensagem com instruções, ou convite de grupo.',
    example: 'Após pagar, enviar: "Aqui está seu acesso: [link do curso]"'
  },
  end: {
    emoji: '🏁',
    title: 'Fim do Funil',
    what: 'Marca o final do fluxo. O bot para de responder depois desse bloco.',
    how: 'Conecte após o último bloco do fluxo. Pode ter uma mensagem de despedida.',
    example: '"Obrigado pelo contato! Qualquer dúvida, é só chamar 😊"'
  }
};

interface BlockSidebarProps {
  onDragStart: (event: React.DragEvent, blockType: BlockType) => void;
}

const CATEGORY_CONFIG: Record<string, { label: string; icon: typeof Play; gradient: string }> = {
  messages: { 
    label: 'Mensagens', 
    icon: MessageSquare,
    gradient: 'from-blue-500/20 to-blue-600/5'
  },
  questions: { 
    label: 'Perguntas', 
    icon: HelpCircle,
    gradient: 'from-violet-500/20 to-violet-600/5'
  },
  logic: { 
    label: 'Lógica', 
    icon: GitBranch,
    gradient: 'from-amber-500/20 to-amber-600/5'
  },
  actions: { 
    label: 'Ações', 
    icon: Send,
    gradient: 'from-pink-500/20 to-pink-600/5'
  },
  automation: { 
    label: 'Automação', 
    icon: RefreshCcw,
    gradient: 'from-rose-500/20 to-rose-600/5'
  },
  payments: { 
    label: 'Pagamentos', 
    icon: CreditCard,
    gradient: 'from-green-500/20 to-green-600/5'
  },
  delivery: { 
    label: 'Entrega', 
    icon: Package,
    gradient: 'from-teal-500/20 to-teal-600/5'
  },
};

// Create drag preview element
const createDragImage = (blockType: BlockType): HTMLElement => {
  const info = BLOCK_INFO[blockType];
  const preview = document.createElement('div');
  
  preview.style.cssText = `
    position: absolute;
    top: -1000px;
    left: -1000px;
    width: 200px;
    border-radius: 12px;
    overflow: hidden;
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.4);
    transform: rotate(-2deg);
    border: 2px solid #8b5cf6;
    background: white;
    font-family: system-ui, -apple-system, sans-serif;
  `;
  
  // Get color class and convert to actual color
  const colorMap: Record<string, string> = {
    'bg-emerald-500': '#10b981',
    'bg-blue-500': '#3b82f6',
    'bg-violet-500': '#8b5cf6',
    'bg-amber-500': '#f59e0b',
    'bg-slate-500': '#64748b',
    'bg-cyan-500': '#06b6d4',
    'bg-pink-500': '#ec4899',
    'bg-orange-500': '#f97316',
    'bg-red-500': '#ef4444',
    'bg-gray-500': '#6b7280',
    'bg-rose-500': '#f43f5e',
    'bg-green-500': '#22c55e',
  };
  
  const bgColor = colorMap[info.color] || '#8b5cf6';
  
  preview.innerHTML = `
    <div style="
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 12px;
      background: ${bgColor};
      color: white;
    ">
      <div style="
        width: 16px;
        height: 16px;
        border-radius: 4px;
        background: rgba(255,255,255,0.3);
      "></div>
      <span style="font-size: 14px; font-weight: 600;">${info.label}</span>
    </div>
    <div style="
      padding: 12px;
      background: white;
    ">
      <p style="
        font-size: 13px;
        color: #71717a;
        margin: 0;
      ">${info.description}</p>
    </div>
    <div style="
      position: absolute;
      bottom: -6px;
      left: 50%;
      transform: translateX(-50%);
      width: 12px;
      height: 12px;
      background: #8b5cf6;
      border-radius: 50%;
      border: 2px solid white;
      box-shadow: 0 2px 4px rgba(0,0,0,0.2);
    "></div>
  `;
  
  document.body.appendChild(preview);
  return preview;
};

export const BlockSidebar = ({ onDragStart }: BlockSidebarProps) => {
  const dragPreviewRef = useRef<HTMLElement | null>(null);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);

  const handleDragStart = (e: React.DragEvent, blockType: BlockType) => {
    // Create custom drag image
    const preview = createDragImage(blockType);
    dragPreviewRef.current = preview;
    
    // Set the drag image
    e.dataTransfer.setDragImage(preview, 100, 50);
    
    // Call the original handler
    onDragStart(e, blockType);
  };

  const handleDragEnd = () => {
    // Clean up drag preview
    if (dragPreviewRef.current) {
      document.body.removeChild(dragPreviewRef.current);
      dragPreviewRef.current = null;
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (dragPreviewRef.current) {
        document.body.removeChild(dragPreviewRef.current);
      }
    };
  }, []);

  return (
    <>
      <motion.div
        initial={false}
        animate={{ width: isCollapsed ? 64 : 288 }}
        transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
        className="h-full min-h-0 border-r border-border bg-gradient-to-b from-card to-background flex flex-col flex-shrink-0 overflow-hidden"
      >
        {/* Header */}
        <div className="p-2 border-b border-border bg-card/80 backdrop-blur-sm flex items-center justify-between min-h-[60px]">
          <AnimatePresence mode="wait">
            {!isCollapsed && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="flex-1 px-2"
              >
                <h3 className="font-semibold text-base flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                    <GripVertical className="w-4 h-4 text-primary" />
                  </div>
                  <span className="whitespace-nowrap">Blocos do Funil</span>
                </h3>
                <p className="text-xs text-muted-foreground mt-1 pl-10">
                  Arraste os blocos para o canvas
                </p>
              </motion.div>
            )}
          </AnimatePresence>
          
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="w-10 h-10 flex-shrink-0"
          >
            <motion.div
              animate={{ rotate: isCollapsed ? 0 : 180 }}
              transition={{ duration: 0.3 }}
            >
              <ChevronRight className="w-5 h-5" />
            </motion.div>
          </Button>
        </div>

        {/* Blocks List */}
        <ScrollArea className="flex-1">
          <div className={cn("space-y-1", isCollapsed ? "p-2" : "p-3 space-y-4")}>
            {Object.entries(BLOCK_CATEGORIES).map(([category, types]) => {
              const config = CATEGORY_CONFIG[category];
              const CategoryIcon = config.icon;
              
              return (
                <div key={category} className="space-y-1">
                  {/* Category Header - only show when expanded */}
                  <AnimatePresence>
                    {!isCollapsed && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2 }}
                        className={cn(
                          "flex items-center gap-2 px-3 py-2 rounded-lg mb-2",
                          "bg-gradient-to-r",
                          config.gradient
                        )}
                      >
                        <CategoryIcon className="w-4 h-4 text-muted-foreground" />
                        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground whitespace-nowrap">
                          {config.label}
                        </span>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Blocks */}
                  <div className={cn("space-y-1.5", !isCollapsed && "pl-1")}>
                    {types.map((type, index) => {
                      const info = BLOCK_INFO[type as BlockType];
                      const Icon = ICONS[type as BlockType];

                      return (
                        <Tooltip key={type} delayDuration={isCollapsed ? 100 : 300}>
                          <TooltipTrigger asChild>
                            <motion.div
                              layout
                              initial={false}
                              animate={{
                                width: isCollapsed ? 48 : 'auto',
                                height: isCollapsed ? 48 : 'auto',
                              }}
                              transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
                              draggable
                              onDragStart={(e) => handleDragStart(e as unknown as React.DragEvent, type as BlockType)}
                              onDragEnd={handleDragEnd}
                              className={cn(
                                'group flex items-center rounded-xl border border-transparent',
                                'cursor-grab active:cursor-grabbing',
                                'transition-colors duration-200',
                                isCollapsed 
                                  ? cn('justify-center text-white hover:scale-110 hover:shadow-lg', info.color)
                                  : 'gap-3 p-2.5 bg-card hover:bg-muted/80 hover:border-border hover:shadow-md',
                                'active:scale-[0.98]'
                              )}
                            >
                              {/* Icon */}
                              <div className={cn(
                                'flex items-center justify-center text-white shadow-sm transition-transform',
                                isCollapsed 
                                  ? 'w-full h-full' 
                                  : 'w-10 h-10 rounded-xl group-hover:scale-110',
                                !isCollapsed && info.color
                              )}>
                                <Icon className="w-5 h-5" />
                              </div>

                              {/* Content - only show when expanded */}
                              <AnimatePresence>
                                {!isCollapsed && (
                                  <motion.div
                                    initial={{ opacity: 0, width: 0 }}
                                    animate={{ opacity: 1, width: 'auto' }}
                                    exit={{ opacity: 0, width: 0 }}
                                    transition={{ duration: 0.2 }}
                                    className="flex-1 min-w-0 overflow-hidden"
                                  >
                                    <p className="text-sm font-medium text-foreground truncate">
                                      {info.label}
                                    </p>
                                    <p className="text-[11px] text-muted-foreground truncate leading-tight">
                                      {info.description}
                                    </p>
                                  </motion.div>
                                )}
                              </AnimatePresence>

                              {/* Drag indicator - only show when expanded */}
                              {!isCollapsed && (
                                <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                  <GripVertical className="w-4 h-4 text-muted-foreground/50" />
                                </div>
                              )}
                            </motion.div>
                          </TooltipTrigger>
                          <TooltipContent side="right" className="max-w-[200px]">
                            <p className="font-medium">{info.label}</p>
                            <p className="text-xs text-muted-foreground">{info.description}</p>
                          </TooltipContent>
                        </Tooltip>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>

        {/* Footer with Help Button */}
        <AnimatePresence>
          {!isCollapsed && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="p-3 border-t border-border bg-muted/30 space-y-2"
            >
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => setHelpOpen(true)}
              >
                <BookOpen className="w-4 h-4 mr-2" />
                Como usar cada bloco?
              </Button>
              <p className="text-[10px] text-muted-foreground text-center">
                💡 Conecte os blocos para criar o fluxo
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Help button when collapsed */}
        <AnimatePresence>
          {isCollapsed && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="p-2 border-t border-border"
            >
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="w-full h-12"
                    onClick={() => setHelpOpen(true)}
                  >
                    <BookOpen className="w-5 h-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right">
                  Como usar cada bloco?
                </TooltipContent>
              </Tooltip>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Help Dialog */}
      <Dialog open={helpOpen} onOpenChange={setHelpOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-primary" />
              Guia dos Blocos
            </DialogTitle>
            <DialogDescription>
              Entenda cada bloco e como usar no seu funil
            </DialogDescription>
          </DialogHeader>
          
          <ScrollArea className="h-[60vh] pr-4">
            <div className="space-y-4">
              {Object.entries(BLOCK_CATEGORIES).map(([category, types]) => {
                const config = CATEGORY_CONFIG[category];
                
                return (
                  <div key={category}>
                    <div className={cn(
                      "flex items-center gap-2 px-3 py-2 rounded-lg mb-3 bg-gradient-to-r",
                      config.gradient
                    )}>
                      <config.icon className="w-4 h-4" />
                      <span className="text-sm font-semibold">{config.label}</span>
                    </div>
                    
                    <div className="space-y-3 pl-2">
                      {types.map((type) => {
                        const info = BLOCK_INFO[type as BlockType];
                        const help = BLOCK_HELP[type as BlockType];
                        const Icon = ICONS[type as BlockType];
                        
                        return (
                          <div key={type} className="p-4 rounded-lg border bg-card/50 hover:bg-card transition-colors">
                            <div className="flex items-start gap-3">
                              <div className={cn(
                                "w-10 h-10 rounded-xl flex items-center justify-center text-white flex-shrink-0",
                                info.color
                              )}>
                                <Icon className="w-5 h-5" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <h4 className="font-semibold text-sm flex items-center gap-2">
                                  <span>{help.emoji}</span>
                                  {help.title}
                                </h4>
                                
                                <div className="mt-3 space-y-2">
                                  <div>
                                    <p className="text-xs font-medium text-primary">O que faz?</p>
                                    <p className="text-xs text-muted-foreground">{help.what}</p>
                                  </div>
                                  
                                  <div>
                                    <p className="text-xs font-medium text-primary">Como usar?</p>
                                    <p className="text-xs text-muted-foreground">{help.how}</p>
                                  </div>
                                  
                                  <div className="p-2 rounded bg-muted/50">
                                    <p className="text-xs font-medium text-amber-600">💡 Exemplo:</p>
                                    <p className="text-xs text-muted-foreground italic">{help.example}</p>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </>
  );
};
