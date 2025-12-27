import { useState, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { 
  Upload, 
  FileJson, 
  ArrowRight, 
  Download, 
  Copy, 
  Check, 
  AlertCircle,
  Loader2,
  Sparkles
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { FunnelNode, FunnelEdge, BlockType, SCHEMA_VERSION } from './types';

interface TypebotConverterProps {
  funnelId: string;
  onImport?: (nodes: FunnelNode[], edges: FunnelEdge[]) => void;
}

interface TypebotBlock {
  id: string;
  type: string;
  content?: any;
  items?: any[];
  options?: any;
}

interface TypebotGroup {
  id: string;
  title: string;
  blocks: TypebotBlock[];
  graphCoordinates: { x: number; y: number };
}

interface TypebotEdge {
  id: string;
  from: { blockId: string; itemId?: string };
  to: { groupId?: string; blockId?: string };
}

interface TypebotFlow {
  version?: string;
  groups: TypebotGroup[];
  edges: TypebotEdge[];
  variables?: any[];
}

export const TypebotConverter = ({ funnelId, onImport }: TypebotConverterProps) => {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [inputJson, setInputJson] = useState('');
  const [outputJson, setOutputJson] = useState('');
  const [isConverting, setIsConverting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [convertedData, setConvertedData] = useState<{ nodes: FunnelNode[]; edges: FunnelEdge[] } | null>(null);

  const mapTypebotBlockType = (typebotType: string): BlockType => {
    const typeMap: Record<string, BlockType> = {
      // Start blocks
      'start': 'start',
      'Start': 'start',
      
      // Text/Message blocks
      'text': 'message',
      'Text': 'message',
      'Bubble text': 'message',
      'bubbleText': 'message',
      
      // Input blocks
      'text input': 'question',
      'Text input': 'question',
      'textInput': 'question',
      'email input': 'question',
      'Email input': 'question',
      'emailInput': 'question',
      'phone input': 'question',
      'Phone input': 'question',
      'phoneInput': 'question',
      'url input': 'question',
      'Url input': 'question',
      'urlInput': 'question',
      
      // Number input
      'number input': 'question_number',
      'Number input': 'question_number',
      'numberInput': 'question_number',
      
      // Choice blocks
      'choice input': 'question_choice',
      'Choice input': 'question_choice',
      'choiceInput': 'question_choice',
      'Buttons input': 'question_choice',
      'buttons input': 'question_choice',
      'buttonsInput': 'question_choice',
      
      // Condition
      'condition': 'condition',
      'Condition': 'condition',
      
      // Wait/Delay
      'wait': 'delay',
      'Wait': 'delay',
      
      // Set variable
      'set variable': 'variable',
      'Set variable': 'variable',
      'setVariable': 'variable',
      
      // Webhook
      'webhook': 'action_webhook',
      'Webhook': 'action_webhook',
      'HTTP request': 'action_webhook',
      'httpRequest': 'action_webhook',
      
      // Image/Video
      'image': 'message',
      'Image': 'message',
      'Bubble image': 'message',
      'bubbleImage': 'message',
      'video': 'message',
      'Video': 'message',
      'Bubble video': 'message',
      'bubbleVideo': 'message',
      
      // End
      'redirect': 'end',
      'Redirect': 'end',
    };

    return typeMap[typebotType] || 'message';
  };

  const extractBlockData = (block: TypebotBlock, blockType: BlockType): Record<string, any> => {
    const data: Record<string, any> = {};
    
    switch (blockType) {
      case 'message':
        if (block.content?.richText) {
          data.text = block.content.richText.map((r: any) => 
            r.children?.map((c: any) => c.text || '').join('') || ''
          ).join('\n');
        } else if (block.content?.plainText) {
          data.text = block.content.plainText;
        } else if (typeof block.content === 'string') {
          data.text = block.content;
        }
        if (block.content?.url) {
          if (block.type?.toLowerCase().includes('image')) {
            data.imageUrl = block.content.url;
          } else if (block.type?.toLowerCase().includes('video')) {
            data.videoUrl = block.content.url;
          }
        }
        break;
        
      case 'question':
      case 'question_number':
        if (block.content?.richText) {
          data.questionText = block.content.richText.map((r: any) => 
            r.children?.map((c: any) => c.text || '').join('') || ''
          ).join('\n');
        }
        if (block.options?.variableId) {
          data.variableName = block.options.variableId;
        }
        if (block.options?.labels?.placeholder) {
          data.placeholder = block.options.labels.placeholder;
        }
        break;
        
      case 'question_choice':
        if (block.content?.richText) {
          data.questionText = block.content.richText.map((r: any) => 
            r.children?.map((c: any) => c.text || '').join('') || ''
          ).join('\n');
        }
        if (block.items) {
          data.choices = block.items.map((item: any, index: number) => ({
            id: item.id || `choice_${index}`,
            label: item.content || item.label || `Opção ${index + 1}`,
            value: String(index + 1),
          }));
        }
        break;
        
      case 'condition':
        if (block.items && block.items[0]?.content?.comparisons) {
          const comparison = block.items[0].content.comparisons[0];
          data.variable = comparison?.variableId || '';
          data.operator = comparison?.comparisonOperator || 'equals';
          data.value = comparison?.value || '';
        }
        break;
        
      case 'delay':
        data.seconds = block.options?.secondsToWaitFor || 5;
        break;
        
      case 'variable':
        data.action = 'set';
        data.variableName = block.options?.variableId || '';
        data.varValue = block.options?.expressionToEvaluate || '';
        break;
        
      case 'action_webhook':
        data.webhookUrl = block.options?.url || '';
        data.webhookMethod = block.options?.method || 'POST';
        break;
    }
    
    return data;
  };

  const convertTypebotToNexo = (typebotData: TypebotFlow): { nodes: FunnelNode[]; edges: FunnelEdge[] } => {
    const nodes: FunnelNode[] = [];
    const edges: FunnelEdge[] = [];
    const blockIdMap = new Map<string, string>();
    
    // Process each group
    typebotData.groups.forEach((group, groupIndex) => {
      const baseX = group.graphCoordinates?.x || groupIndex * 300;
      const baseY = group.graphCoordinates?.y || 0;
      
      group.blocks.forEach((block, blockIndex) => {
        const newId = crypto.randomUUID();
        blockIdMap.set(block.id, newId);
        
        const blockType = mapTypebotBlockType(block.type);
        const blockData = extractBlockData(block, blockType);
        
        nodes.push({
          id: newId,
          type: blockType,
          position: {
            x: baseX,
            y: baseY + blockIndex * 150,
          },
          data: {
            label: group.title || undefined,
            ...blockData,
          },
        });
        
        // Create edge to next block in same group
        if (blockIndex < group.blocks.length - 1) {
          const nextBlockId = group.blocks[blockIndex + 1].id;
          edges.push({
            id: crypto.randomUUID(),
            source: newId,
            target: '', // Will be filled later
            sourceHandle: 'default',
          });
        }
      });
    });
    
    // Update edges with correct target IDs
    edges.forEach((edge, index) => {
      if (!edge.target) {
        // Find corresponding typebot edge or next block
        const sourceOriginalId = Array.from(blockIdMap.entries())
          .find(([_, newId]) => newId === edge.source)?.[0];
        
        if (sourceOriginalId) {
          const typebotEdge = typebotData.edges.find(e => e.from.blockId === sourceOriginalId);
          if (typebotEdge?.to.blockId) {
            edge.target = blockIdMap.get(typebotEdge.to.blockId) || '';
          }
        }
      }
    });
    
    // Process typebot edges
    typebotData.edges.forEach((typebotEdge) => {
      const sourceId = blockIdMap.get(typebotEdge.from.blockId);
      let targetId = typebotEdge.to.blockId ? blockIdMap.get(typebotEdge.to.blockId) : undefined;
      
      // If target is a group, find first block
      if (!targetId && typebotEdge.to.groupId) {
        const targetGroup = typebotData.groups.find(g => g.id === typebotEdge.to.groupId);
        if (targetGroup?.blocks[0]) {
          targetId = blockIdMap.get(targetGroup.blocks[0].id);
        }
      }
      
      if (sourceId && targetId) {
        // Check if edge already exists
        const exists = edges.some(e => e.source === sourceId && e.target === targetId);
        if (!exists) {
          edges.push({
            id: crypto.randomUUID(),
            source: sourceId,
            target: targetId,
            sourceHandle: typebotEdge.from.itemId || 'default',
          });
        }
      }
    });
    
    // Filter out edges without targets
    const validEdges = edges.filter(e => e.target);
    
    // Add start node if not present
    const hasStart = nodes.some(n => n.type === 'start');
    if (!hasStart && nodes.length > 0) {
      const startId = crypto.randomUUID();
      nodes.unshift({
        id: startId,
        type: 'start',
        position: { x: nodes[0].position.x - 300, y: nodes[0].position.y },
        data: { label: 'Início' },
      });
      
      validEdges.unshift({
        id: crypto.randomUUID(),
        source: startId,
        target: nodes[1].id,
        sourceHandle: 'default',
      });
    }
    
    return { nodes, edges: validEdges };
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      setInputJson(content);
      setError(null);
    };
    reader.readAsText(file);
    
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleConvert = () => {
    setIsConverting(true);
    setError(null);
    setConvertedData(null);
    
    try {
      const parsed = JSON.parse(inputJson);
      
      // Validate basic structure
      if (!parsed.groups || !Array.isArray(parsed.groups)) {
        throw new Error('Arquivo inválido: não encontrado "groups" no JSON do Typebot');
      }
      
      const result = convertTypebotToNexo(parsed);
      
      const nexoFormat = {
        schemaVersion: SCHEMA_VERSION,
        nodes: result.nodes,
        edges: result.edges,
      };
      
      setOutputJson(JSON.stringify(nexoFormat, null, 2));
      setConvertedData(result);
      
      toast({
        title: 'Conversão concluída!',
        description: `${result.nodes.length} blocos e ${result.edges.length} conexões convertidos.`,
      });
    } catch (err: any) {
      setError(err.message || 'Erro ao converter JSON');
      toast({
        title: 'Erro na conversão',
        description: err.message,
        variant: 'destructive',
      });
    } finally {
      setIsConverting(false);
    }
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(outputJson);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({ title: 'Copiado para a área de transferência!' });
  };

  const handleDownload = () => {
    const blob = new Blob([outputJson], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `nexo-funnel-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportToFunnel = () => {
    if (convertedData && onImport) {
      onImport(convertedData.nodes, convertedData.edges);
      toast({
        title: 'Funil importado!',
        description: 'Os blocos foram adicionados ao seu funil.',
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
            <FileJson className="h-5 w-5 text-white" />
          </div>
          <div>
            <CardTitle className="text-base">Conversor Typebot → Nexo</CardTitle>
            <CardDescription>
              Importe seu funil do Typebot e converta para o formato Nexo
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Upload section */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleFileUpload}
              className="hidden"
            />
            <Button
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              className="flex-1"
            >
              <Upload className="h-4 w-4 mr-2" />
              Carregar arquivo .json
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Exporte seu funil do Typebot (Settings → Export) e faça upload aqui
          </p>
        </div>
        
        {/* Input JSON */}
        <div className="space-y-2">
          <label className="text-sm font-medium">JSON do Typebot</label>
          <Textarea
            value={inputJson}
            onChange={(e) => {
              setInputJson(e.target.value);
              setError(null);
            }}
            placeholder='{"groups": [...], "edges": [...]}'
            className="font-mono text-xs h-32 resize-none"
          />
        </div>
        
        {/* Convert button */}
        <div className="flex justify-center">
          <Button
            onClick={handleConvert}
            disabled={!inputJson.trim() || isConverting}
            className="gap-2"
          >
            {isConverting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4" />
            )}
            Converter para Nexo
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
        
        {/* Error */}
        {error && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            {error}
          </div>
        )}
        
        {/* Output JSON */}
        {outputJson && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">JSON Nexo (Convertido)</label>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={handleCopy}>
                  {copied ? (
                    <Check className="h-4 w-4 text-green-500" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
                <Button variant="ghost" size="sm" onClick={handleDownload}>
                  <Download className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <Textarea
              value={outputJson}
              readOnly
              className="font-mono text-xs h-32 resize-none bg-muted/50"
            />
            
            {/* Import button */}
            {onImport && convertedData && (
              <Button onClick={handleImportToFunnel} className="w-full">
                <Sparkles className="h-4 w-4 mr-2" />
                Importar para este Funil
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};