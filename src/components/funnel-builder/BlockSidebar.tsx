import { useRef, useEffect } from 'react';
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
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { BlockType, BLOCK_INFO, BLOCK_CATEGORIES } from './types';
import { ScrollArea } from '@/components/ui/scroll-area';
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
    <div className="w-72 h-full min-h-0 border-r border-border bg-gradient-to-b from-card to-background flex flex-col flex-shrink-0">
      {/* Header */}
      <div className="p-4 border-b border-border bg-card/80 backdrop-blur-sm">
        <h3 className="font-semibold text-base flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <GripVertical className="w-4 h-4 text-primary" />
          </div>
          Blocos do Funil
        </h3>
        <p className="text-xs text-muted-foreground mt-1">
          Arraste os blocos para o canvas
        </p>
      </div>

      {/* Blocks List */}
      <ScrollArea className="flex-1">
        <div className="p-3 space-y-4">
          {Object.entries(BLOCK_CATEGORIES).map(([category, types]) => {
            const config = CATEGORY_CONFIG[category];
            const CategoryIcon = config.icon;
            
            return (
              <div key={category} className="space-y-2">
                {/* Category Header */}
                <div className={cn(
                  "flex items-center gap-2 px-3 py-2 rounded-lg",
                  "bg-gradient-to-r",
                  config.gradient
                )}>
                  <CategoryIcon className="w-4 h-4 text-muted-foreground" />
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    {config.label}
                  </span>
                </div>

                {/* Blocks */}
                <div className="space-y-1.5 pl-1">
                  {types.map((type) => {
                    const info = BLOCK_INFO[type as BlockType];
                    const Icon = ICONS[type as BlockType];

                    return (
                      <Tooltip key={type} delayDuration={300}>
                        <TooltipTrigger asChild>
                          <div
                            draggable
                            onDragStart={(e) => handleDragStart(e, type as BlockType)}
                            onDragEnd={handleDragEnd}
                            className={cn(
                              'group flex items-center gap-3 p-2.5 rounded-xl border border-transparent',
                              'cursor-grab active:cursor-grabbing',
                              'bg-card hover:bg-muted/80 hover:border-border',
                              'transition-all duration-200 hover:shadow-md hover:scale-[1.02]',
                              'active:scale-[0.98]'
                            )}
                          >
                            {/* Icon */}
                            <div className={cn(
                              'w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-sm',
                              'transition-transform group-hover:scale-110',
                              info.color
                            )}>
                              <Icon className="w-5 h-5" />
                            </div>

                            {/* Content */}
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-foreground truncate">
                                {info.label}
                              </p>
                              <p className="text-[11px] text-muted-foreground truncate leading-tight">
                                {info.description}
                              </p>
                            </div>

                            {/* Drag indicator */}
                            <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                              <GripVertical className="w-4 h-4 text-muted-foreground/50" />
                            </div>
                          </div>
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

      {/* Footer hint */}
      <div className="p-3 border-t border-border bg-muted/30">
        <p className="text-[10px] text-muted-foreground text-center">
          💡 Dica: Conecte os blocos para criar o fluxo
        </p>
      </div>
    </div>
  );
};
