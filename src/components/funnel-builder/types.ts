// Block types for the funnel builder
export type BlockType = 
  | 'start'
  | 'message'
  | 'question'
  | 'question_choice'
  | 'question_number'
  | 'condition'
  | 'delay'
  | 'variable'
  | 'action_message'
  | 'action_notify'
  | 'action_webhook'
  | 'remarketing'
  | 'payment'
  | 'delivery'
  | 'end';

export interface BlockData {
  // Message block
  text?: string;
  mediaType?: 'image' | 'video' | 'audio';
  mediaUrl?: string;
  imageUrl?: string;
  videoUrl?: string;
  caption?: string;
  
  // Question block
  questionText?: string;
  variableName?: string;
  placeholder?: string;
  validation?: {
    required?: boolean;
    minLength?: number;
    maxLength?: number;
    pattern?: string;
  };
  
  // Question choice block
  choices?: Array<{
    id: string;
    label: string;
    value: string;
  }>;
  allowMultiple?: boolean;
  
  // Question number block
  min?: number;
  max?: number;
  currency?: string;
  
  // Condition block
  variable?: string;
  operator?: 'equals' | 'not_equals' | 'contains' | 'greater' | 'less' | 'exists' | 'empty' | 'is_paid' | 'is_pending';
  value?: string;
  
  // Delay block
  seconds?: number;
  
  // Variable block
  action?: 'set' | 'get' | 'clear';
  varValue?: string;
  
  // Action blocks
  notifyEmail?: string;
  webhookUrl?: string;
  webhookMethod?: 'GET' | 'POST';
  webhookHeaders?: Record<string, string>;
  webhookBody?: string;
  
  // Remarketing block
  remarketingType?: 'inactivity' | 'abandoned' | 'followup';
  remarketingDelay?: number; // em horas
  remarketingMessage?: string;
  remarketingMaxAttempts?: number;
  
  // Payment block
  productId?: string;
  productSelectionType?: 'fixed' | 'variable';
  productVariable?: string;
  paymentMessage?: string;
  successMessage?: string;
  timeoutMinutes?: number;
  
  // Delivery block (packs)
  deliveryPackId?: string;
  deliveryMessage?: string;
  deliveryType?: 'pack' | 'link' | 'message';
  deliveryLink?: string;
  
  // General
  label?: string;
}

export interface FunnelNode {
  id: string;
  type: BlockType;
  position: { x: number; y: number };
  data: BlockData;
}

export interface FunnelEdge {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string;
  targetHandle?: string;
}

export interface FunnelData {
  id: string;
  name: string;
  description?: string;
  schemaVersion: number;
  nodes: FunnelNode[];
  edges: FunnelEdge[];
  variables?: string[];
}

export interface FunnelTemplate {
  id: string;
  name: string;
  description?: string;
  category: string;
  schemaVersion: number;
  templateVersion: number;
  nodes: FunnelNode[];
  edges: FunnelEdge[];
  isFree?: boolean;
}

export const BLOCK_CATEGORIES = {
  messages: ['start', 'message', 'end'],
  questions: ['question', 'question_choice', 'question_number'],
  logic: ['condition', 'delay', 'variable'],
  actions: ['action_message', 'action_notify', 'action_webhook'],
  automation: ['remarketing'],
  payments: ['payment'],
  delivery: ['delivery'],
} as const;

export const BLOCK_INFO: Record<BlockType, { 
  label: string; 
  description: string; 
  color: string;
  category: string;
}> = {
  start: {
    label: 'Início',
    description: 'Ponto de entrada do funil',
    color: 'bg-emerald-500',
    category: 'messages',
  },
  message: {
    label: 'Mensagem',
    description: 'Envia texto, imagem ou vídeo',
    color: 'bg-blue-500',
    category: 'messages',
  },
  question: {
    label: 'Pergunta (Texto)',
    description: 'Aguarda resposta em texto livre',
    color: 'bg-violet-500',
    category: 'questions',
  },
  question_choice: {
    label: 'Pergunta (Escolha)',
    description: 'Múltipla escolha com botões',
    color: 'bg-violet-500',
    category: 'questions',
  },
  question_number: {
    label: 'Pergunta (Número)',
    description: 'Aguarda resposta numérica',
    color: 'bg-violet-500',
    category: 'questions',
  },
  condition: {
    label: 'Condição',
    description: 'IF/ELSE baseado em variáveis',
    color: 'bg-amber-500',
    category: 'logic',
  },
  delay: {
    label: 'Delay',
    description: 'Aguarda X segundos',
    color: 'bg-slate-500',
    category: 'logic',
  },
  variable: {
    label: 'Variável',
    description: 'Define ou lê variável',
    color: 'bg-cyan-500',
    category: 'logic',
  },
  action_message: {
    label: 'Enviar Mensagem',
    description: 'Ação de envio',
    color: 'bg-pink-500',
    category: 'actions',
  },
  action_notify: {
    label: 'Notificar Admin',
    description: 'Envia notificação ao admin',
    color: 'bg-orange-500',
    category: 'actions',
  },
  action_webhook: {
    label: 'Webhook',
    description: 'Chama URL externa',
    color: 'bg-red-500',
    category: 'actions',
  },
  end: {
    label: 'Fim',
    description: 'Finaliza o funil',
    color: 'bg-gray-500',
    category: 'messages',
  },
  remarketing: {
    label: 'Remarketing',
    description: 'Reengaja leads inativos automaticamente',
    color: 'bg-rose-500',
    category: 'automation',
  },
  payment: {
    label: 'Pagamento',
    description: 'Gera PIX e aguarda pagamento',
    color: 'bg-green-500',
    category: 'payments',
  },
  delivery: {
    label: 'Entrega',
    description: 'Envia pack de mídia ao cliente',
    color: 'bg-teal-500',
    category: 'delivery',
  },
};

export const SCHEMA_VERSION = 1;
