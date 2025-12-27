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
  GripVertical,
  RefreshCcw,
  Image,
  Video,
  CreditCard,
  Package
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
  remarketing: RefreshCcw,
  payment: CreditCard,
  delivery: Package,
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
    if (blockType === 'delivery' && data.deliveryType) {
      const typeLabels: Record<string, string> = { pack: 'Pack de Mídia', link: 'Link', message: 'Mensagem' };
      return typeLabels[data.deliveryType] || 'Entrega';
    }
    return info?.label || 'Bloco';
  };

  const showInput = blockType !== 'start';
  const showOutput = blockType !== 'end';
  const showConditionOutputs = blockType === 'condition';
  const showChoiceOutputs = blockType === 'question_choice' && data.choices;

  // Determine special styling for different block types
  const isStartOrEnd = blockType === 'start' || blockType === 'end';
  const isPaymentOrDelivery = blockType === 'payment' || blockType === 'delivery';

  return (
    <div 
      className={cn(
        'group min-w-[220px] max-w-[300px] rounded-2xl border-2 bg-card transition-all duration-300',
        'shadow-lg hover:shadow-xl',
        selected 
          ? 'border-primary ring-4 ring-primary/20 scale-[1.02]' 
          : 'border-border/60 hover:border-primary/40',
        isStartOrEnd && 'min-w-[180px]',
      )}
    >
      {/* Input Handle */}
      {showInput && (
        <Handle
          type="target"
          position={Position.Top}
          className={cn(
            '!w-4 !h-4 !-top-2 !border-[3px] !border-background transition-all duration-200',
            '!bg-gradient-to-br !from-primary !to-primary/80',
            'hover:!scale-125 hover:!shadow-lg',
          )}
        />
      )}
      
      {/* Header */}
      <div className={cn(
        'flex items-center gap-2.5 px-4 py-3 rounded-t-xl transition-all duration-200',
        info?.color, 
        'text-white'
      )}>
        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-white/20 backdrop-blur-sm">
          <Icon className="w-4 h-4" />
        </div>
        <div className="flex-1">
          <span className="text-sm font-semibold tracking-tight">{info?.label}</span>
        </div>
        <GripVertical className="w-4 h-4 opacity-40 cursor-grab group-hover:opacity-70 transition-opacity" />
      </div>
      
      {/* Content */}
      <div className="p-4 min-h-[50px] bg-gradient-to-b from-card to-card/80">
        {/* Media Preview */}
        {(data.imageUrl || data.videoUrl) && (
          <div className="mb-3 space-y-2">
            {data.imageUrl && (
              <div className="relative rounded-xl overflow-hidden border border-border/30 shadow-sm">
                <img 
                  src={data.imageUrl} 
                  alt="Preview" 
                  className="w-full h-20 object-cover"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
                <div className="absolute top-1.5 left-1.5 bg-background/90 backdrop-blur-sm rounded-md px-2 py-1 flex items-center gap-1 shadow-sm">
                  <Image className="w-3 h-3 text-primary" />
                  <span className="text-[10px] font-medium text-muted-foreground">Imagem</span>
                </div>
              </div>
            )}
            {data.videoUrl && (
              <div className="relative rounded-xl overflow-hidden border border-border/30 bg-muted/30 shadow-sm">
                <div className="w-full h-14 flex items-center justify-center">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Video className="w-5 h-5 text-primary" />
                  </div>
                </div>
                <div className="absolute top-1.5 left-1.5 bg-background/90 backdrop-blur-sm rounded-md px-2 py-1 flex items-center gap-1 shadow-sm">
                  <Video className="w-3 h-3 text-primary" />
                  <span className="text-[10px] font-medium text-muted-foreground">Vídeo</span>
                </div>
              </div>
            )}
          </div>
        )}
        
        {/* Payment/Delivery badge */}
        {isPaymentOrDelivery && (
          <div className={cn(
            "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium mb-2",
            blockType === 'payment' ? 'bg-green-500/10 text-green-600' : 'bg-teal-500/10 text-teal-600'
          )}>
            {blockType === 'payment' ? '💰 PIX' : '📦 Entrega'}
          </div>
        )}
        
        <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
          {getPreviewText()}
        </p>
      </div>

      {/* Output Handle(s) */}
      {showOutput && !showConditionOutputs && !showChoiceOutputs && (
        <Handle
          type="source"
          position={Position.Bottom}
          id="default"
          className={cn(
            '!w-4 !h-4 !-bottom-2 !border-[3px] !border-background transition-all duration-200',
            '!bg-gradient-to-br !from-primary !to-primary/80',
            'hover:!scale-125 hover:!shadow-lg',
          )}
        />
      )}

      {/* Condition outputs */}
      {showConditionOutputs && (
        <div className="relative h-8 border-t border-border/30 bg-muted/20 rounded-b-xl">
          <Handle
            type="source"
            position={Position.Bottom}
            id="true"
            style={{ left: '30%' }}
            className="!w-4 !h-4 !-bottom-2 !bg-emerald-500 !border-[3px] !border-background hover:!scale-125 transition-transform"
          />
          <span className="absolute left-[20%] top-1.5 text-[10px] font-bold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full">SIM</span>
          
          <Handle
            type="source"
            position={Position.Bottom}
            id="false"
            style={{ left: '70%' }}
            className="!w-4 !h-4 !-bottom-2 !bg-red-500 !border-[3px] !border-background hover:!scale-125 transition-transform"
          />
          <span className="absolute left-[60%] top-1.5 text-[10px] font-bold text-red-500 bg-red-500/10 px-2 py-0.5 rounded-full">NÃO</span>
        </div>
      )}

      {/* Choice outputs */}
      {showChoiceOutputs && (
        <div className="relative h-8 border-t border-border/30 bg-muted/20 rounded-b-xl">
          {(data.choices as any[])?.map((choice: any, index: number) => {
            const position = ((index + 1) / ((data.choices as any[]).length + 1)) * 100;
            return (
              <Handle
                key={choice.id}
                type="source"
                position={Position.Bottom}
                id={choice.id}
                style={{ left: `${position}%` }}
                className="!w-4 !h-4 !-bottom-2 !bg-violet-500 !border-[3px] !border-background hover:!scale-125 transition-transform"
              />
            );
          })}
        </div>
      )}
    </div>
  );
};

export default memo(BlockNode);
