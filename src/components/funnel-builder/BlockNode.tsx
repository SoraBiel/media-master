import { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
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
  GripVertical
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { BlockType, BLOCK_INFO } from './types';

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
  end: Flag,
};

interface BlockNodeProps {
  data: Record<string, any>;
  selected?: boolean;
}

const BlockNode = ({ data, selected }: BlockNodeProps) => {
  const blockType = data.blockType as BlockType;
  const info = BLOCK_INFO[blockType];
  const Icon = ICONS[blockType] || MessageSquare;
  
  const getPreviewText = () => {
    if (data.label) return data.label;
    if (data.text) return data.text.slice(0, 50) + (data.text.length > 50 ? '...' : '');
    if (data.questionText) return data.questionText.slice(0, 50) + (data.questionText.length > 50 ? '...' : '');
    if (blockType === 'delay' && data.seconds) return `${data.seconds}s`;
    return info?.label || 'Bloco';
  };

  const showInput = blockType !== 'start';
  const showOutput = blockType !== 'end';
  const showConditionOutputs = blockType === 'condition';
  const showChoiceOutputs = blockType === 'question_choice' && data.choices;

  return (
    <div 
      className={cn(
        'min-w-[200px] max-w-[280px] rounded-xl border-2 bg-card shadow-lg transition-all duration-200',
        selected ? 'border-primary ring-2 ring-primary/20' : 'border-border hover:border-primary/50',
      )}
    >
      {/* Input Handle */}
      {showInput && (
        <Handle
          type="target"
          position={Position.Top}
          className="!w-3 !h-3 !bg-primary !border-2 !border-background"
        />
      )}
      
      {/* Header */}
      <div className={cn('flex items-center gap-2 p-3 rounded-t-lg', info?.color, 'text-white')}>
        <GripVertical className="w-4 h-4 opacity-50 cursor-grab" />
        <Icon className="w-4 h-4" />
        <span className="text-sm font-medium">{info?.label}</span>
      </div>
      
      {/* Content */}
      <div className="p-3 min-h-[40px]">
        <p className="text-sm text-muted-foreground line-clamp-2">
          {getPreviewText()}
        </p>
      </div>

      {/* Output Handle(s) */}
      {showOutput && !showConditionOutputs && !showChoiceOutputs && (
        <Handle
          type="source"
          position={Position.Bottom}
          className="!w-3 !h-3 !bg-primary !border-2 !border-background"
        />
      )}

      {/* Condition outputs */}
      {showConditionOutputs && (
        <div className="relative h-6">
          <Handle
            type="source"
            position={Position.Bottom}
            id="true"
            style={{ left: '30%' }}
            className="!w-3 !h-3 !bg-emerald-500 !border-2 !border-background"
          />
          <span className="absolute left-[22%] -bottom-4 text-[10px] text-emerald-500 font-medium">SIM</span>
          
          <Handle
            type="source"
            position={Position.Bottom}
            id="false"
            style={{ left: '70%' }}
            className="!w-3 !h-3 !bg-red-500 !border-2 !border-background"
          />
          <span className="absolute left-[64%] -bottom-4 text-[10px] text-red-500 font-medium">NÃO</span>
        </div>
      )}

      {/* Choice outputs */}
      {showChoiceOutputs && (
        <div className="relative h-6">
          {(data.choices as any[])?.map((choice: any, index: number) => {
            const position = ((index + 1) / ((data.choices as any[]).length + 1)) * 100;
            return (
              <Handle
                key={choice.id}
                type="source"
                position={Position.Bottom}
                id={choice.id}
                style={{ left: `${position}%` }}
                className="!w-3 !h-3 !bg-violet-500 !border-2 !border-background"
              />
            );
          })}
        </div>
      )}
    </div>
  );
};

export default memo(BlockNode);
