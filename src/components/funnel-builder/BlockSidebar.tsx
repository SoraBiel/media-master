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
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { BlockType, BLOCK_INFO, BLOCK_CATEGORIES } from './types';

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
  end: Flag,
};

interface BlockSidebarProps {
  onDragStart: (event: React.DragEvent, blockType: BlockType) => void;
}

const CATEGORY_LABELS: Record<string, string> = {
  messages: 'Mensagens',
  questions: 'Perguntas',
  logic: 'Lógica',
  actions: 'Ações',
  automation: 'Automação',
};

export const BlockSidebar = ({ onDragStart }: BlockSidebarProps) => {
  return (
    <div className="w-64 h-full min-h-0 border-r border-border bg-card/50 p-4 flex flex-col flex-shrink-0">
      <h3 className="font-semibold text-sm text-muted-foreground mb-4 uppercase tracking-wider">
        Blocos
      </h3>

      <div className="flex-1 min-h-0 overflow-y-auto pr-1">
        {Object.entries(BLOCK_CATEGORIES).map(([category, types]) => (
          <div key={category} className="mb-6">
            <h4 className="text-xs font-medium text-muted-foreground mb-2 uppercase">
              {CATEGORY_LABELS[category]}
            </h4>
            <div className="space-y-2">
              {types.map((type) => {
                const info = BLOCK_INFO[type as BlockType];
                const Icon = ICONS[type as BlockType];

                return (
                  <div
                    key={type}
                    draggable
                    onDragStart={(e) => onDragStart(e, type as BlockType)}
                    className={cn(
                      'flex items-center gap-3 p-3 rounded-lg border border-border',
                      'cursor-grab active:cursor-grabbing hover:border-primary/50 transition-all',
                      'bg-background hover:bg-muted/50'
                    )}
                  >
                    <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center text-white', info.color)}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{info.label}</p>
                      <p className="text-[10px] text-muted-foreground truncate">
                        {info.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
