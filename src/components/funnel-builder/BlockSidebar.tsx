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

      {/* Footer hint - only show when expanded */}
      <AnimatePresence>
        {!isCollapsed && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="p-3 border-t border-border bg-muted/30"
          >
            <p className="text-[10px] text-muted-foreground text-center">
              💡 Dica: Conecte os blocos para criar o fluxo
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
