import { useEffect, useRef } from 'react';
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
import { BlockType, BLOCK_INFO } from './types';
import { createRoot } from 'react-dom/client';

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

interface BlockPreviewProps {
  blockType: BlockType;
}

export const BlockPreview = ({ blockType }: BlockPreviewProps) => {
  const info = BLOCK_INFO[blockType];
  const Icon = ICONS[blockType] || MessageSquare;

  return (
    <div 
      className={cn(
        'w-[220px] rounded-xl border-2 bg-card shadow-xl',
        'border-primary ring-2 ring-primary/30',
      )}
      style={{ 
        transform: 'rotate(-2deg)',
        opacity: 0.95,
      }}
    >
      {/* Header */}
      <div className={cn('flex items-center gap-2 p-3 rounded-t-lg', info?.color, 'text-white')}>
        <GripVertical className="w-4 h-4 opacity-50" />
        <Icon className="w-4 h-4" />
        <span className="text-sm font-medium">{info?.label}</span>
      </div>
      
      {/* Content */}
      <div className="p-3 min-h-[40px]">
        <p className="text-sm text-muted-foreground">
          {info?.description}
        </p>
      </div>

      {/* Visual indicator */}
      <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-3 h-3 bg-primary rounded-full border-2 border-background shadow-lg animate-pulse" />
    </div>
  );
};

export const createDragPreview = (blockType: BlockType): HTMLElement => {
  const info = BLOCK_INFO[blockType];
  const IconComponent = ICONS[blockType];
  
  // Create container
  const container = document.createElement('div');
  container.style.position = 'absolute';
  container.style.top = '-1000px';
  container.style.left = '-1000px';
  container.style.pointerEvents = 'none';
  document.body.appendChild(container);

  // Create preview element
  const preview = document.createElement('div');
  preview.className = 'w-[200px] rounded-xl border-2 bg-white dark:bg-zinc-900 shadow-2xl border-primary';
  preview.style.transform = 'rotate(-2deg)';
  
  preview.innerHTML = `
    <div class="flex items-center gap-2 p-3 rounded-t-lg text-white ${info.color}">
      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
        <circle cx="12" cy="12" r="10"></circle>
      </svg>
      <span class="text-sm font-medium">${info.label}</span>
    </div>
    <div class="p-3 bg-white dark:bg-zinc-900">
      <p class="text-sm text-zinc-500 dark:text-zinc-400">${info.description}</p>
    </div>
  `;
  
  container.appendChild(preview);
  
  return container;
};

export const useDragPreview = (blockType: BlockType | null) => {
  const previewRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!blockType) {
      if (previewRef.current) {
        document.body.removeChild(previewRef.current);
        previewRef.current = null;
      }
      return;
    }

    const info = BLOCK_INFO[blockType];
    
    // Create preview element
    const container = document.createElement('div');
    container.id = 'drag-preview';
    container.style.cssText = `
      position: fixed;
      top: -1000px;
      left: -1000px;
      z-index: 9999;
      pointer-events: none;
    `;
    
    container.innerHTML = `
      <div style="
        width: 200px;
        border-radius: 12px;
        border: 2px solid hsl(var(--primary));
        background: hsl(var(--card));
        box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
        transform: rotate(-2deg);
        overflow: hidden;
      ">
        <div style="
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px;
          color: white;
        " class="${info.color}">
          <span style="font-size: 14px; font-weight: 500;">${info.label}</span>
        </div>
        <div style="padding: 12px; background: hsl(var(--card));">
          <p style="font-size: 14px; color: hsl(var(--muted-foreground));">${info.description}</p>
        </div>
      </div>
    `;
    
    document.body.appendChild(container);
    previewRef.current = container;

    return () => {
      if (previewRef.current) {
        document.body.removeChild(previewRef.current);
        previewRef.current = null;
      }
    };
  }, [blockType]);

  return previewRef;
};
