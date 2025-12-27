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
  groups?: TypebotGroup[];
  edges?: TypebotEdge[];
  variables?: any[];
  // Alternative format (exported from dashboard)
  typebot?: {
    groups: TypebotGroup[];
    edges: TypebotEdge[];
    variables?: any[];
  };
  // Another format variant
  publicId?: string;
  name?: string;
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
    const normalizedType = typebotType?.toLowerCase()?.trim() || '';
    
    // Start blocks
    if (normalizedType === 'start') return 'start';
    
    // Text/Message blocks
    if (normalizedType.includes('text') && !normalizedType.includes('input')) return 'message';
    if (normalizedType === 'bubbletext' || normalizedType === 'bubble text') return 'message';
    
    // Image blocks
    if (normalizedType.includes('image')) return 'message';
    if (normalizedType === 'bubbleimage' || normalizedType === 'bubble image') return 'message';
    
    // Video blocks
    if (normalizedType.includes('video')) return 'message';
    if (normalizedType === 'bubblevideo' || normalizedType === 'bubble video') return 'message';
    
    // Audio blocks
    if (normalizedType.includes('audio')) return 'message';
    if (normalizedType === 'bubbleaudio' || normalizedType === 'bubble audio') return 'message';
    
    // File upload blocks
    if (normalizedType.includes('file') && normalizedType.includes('input')) return 'question';
    if (normalizedType === 'fileinput' || normalizedType === 'file input') return 'question';
    
    // Email input
    if (normalizedType.includes('email')) return 'question';
    
    // Phone input
    if (normalizedType.includes('phone')) return 'question';
    
    // URL input
    if (normalizedType.includes('url') && normalizedType.includes('input')) return 'question';
    
    // Number input
    if (normalizedType.includes('number')) return 'question_number';
    
    // Text input
    if (normalizedType.includes('text') && normalizedType.includes('input')) return 'question';
    
    // Rating input - map to question_number
    if (normalizedType.includes('rating')) return 'question_number';
    
    // Date input
    if (normalizedType.includes('date')) return 'question';
    
    // Choice/Buttons blocks
    if (normalizedType.includes('choice') || normalizedType.includes('button')) return 'question_choice';
    if (normalizedType === 'pictureinput' || normalizedType === 'picture choice') return 'question_choice';
    
    // Payment blocks
    if (normalizedType.includes('payment') || normalizedType.includes('stripe')) return 'payment';
    if (normalizedType.includes('checkout')) return 'payment';
    
    // Condition
    if (normalizedType.includes('condition')) return 'condition';
    
    // Wait/Delay/Typing
    if (normalizedType === 'wait' || normalizedType.includes('delay')) return 'delay';
    if (normalizedType.includes('typing') || normalizedType === 'typebubble') return 'delay';
    
    // Set variable
    if (normalizedType.includes('variable') || normalizedType === 'setvariable') return 'variable';
    
    // Webhook/HTTP
    if (normalizedType.includes('webhook') || normalizedType.includes('http')) return 'action_webhook';
    
    // Script/Code
    if (normalizedType.includes('script') || normalizedType.includes('code')) return 'action_webhook';
    
    // Google Sheets
    if (normalizedType.includes('sheet') || normalizedType.includes('google')) return 'action_webhook';
    
    // Email send
    if (normalizedType.includes('send') && normalizedType.includes('email')) return 'action_webhook';
    
    // Redirect/End
    if (normalizedType.includes('redirect') || normalizedType === 'end') return 'end';
    
    // Jump/Link
    if (normalizedType.includes('jump') || normalizedType.includes('link')) return 'end';
    
    // Embed
    if (normalizedType.includes('embed')) return 'message';
    
    // Default fallback
    return 'message';
  };

  const extractTextFromRichText = (richText: any[]): string => {
    if (!Array.isArray(richText)) return '';
    return richText.map((r: any) => 
      r.children?.map((c: any) => c.text || '').join('') || r.text || ''
    ).join('\n');
  };

  const extractBlockData = (block: TypebotBlock, blockType: BlockType): Record<string, any> => {
    const data: Record<string, any> = {};
    const normalizedType = block.type?.toLowerCase() || '';
    
    switch (blockType) {
      case 'message':
        // Extract text content
        if (block.content?.richText) {
          data.text = extractTextFromRichText(block.content.richText);
        } else if (block.content?.plainText) {
          data.text = block.content.plainText;
        } else if (block.content?.html) {
          data.text = block.content.html.replace(/<[^>]*>/g, '');
        } else if (typeof block.content === 'string') {
          data.text = block.content;
        }
        
        // Extract media URLs
        if (block.content?.url) {
          if (normalizedType.includes('image')) {
            data.imageUrl = block.content.url;
          } else if (normalizedType.includes('video')) {
            data.videoUrl = block.content.url;
          } else if (normalizedType.includes('audio')) {
            data.audioUrl = block.content.url;
          }
        }
        
        // Embed content
        if (block.content?.embedUrl || block.content?.iframeUrl) {
          data.embedUrl = block.content.embedUrl || block.content.iframeUrl;
        }
        break;
        
      case 'question':
      case 'question_number':
        // Question text
        if (block.content?.richText) {
          data.questionText = extractTextFromRichText(block.content.richText);
        } else if (block.options?.labels?.placeholder) {
          data.questionText = block.options.labels.placeholder;
        }
        
        // Variable to save
        if (block.options?.variableId) {
          data.variableName = block.options.variableId;
        }
        
        // Placeholder
        if (block.options?.labels?.placeholder) {
          data.placeholder = block.options.labels.placeholder;
        }
        
        // File upload specific
        if (normalizedType.includes('file')) {
          data.isFileUpload = true;
          data.acceptedFileTypes = block.options?.acceptedFileTypes || ['*'];
        }
        
        // Rating specific
        if (normalizedType.includes('rating')) {
          data.maxRating = block.options?.length || 5;
        }
        break;
        
      case 'question_choice':
        if (block.content?.richText) {
          data.questionText = extractTextFromRichText(block.content.richText);
        }
        if (block.items) {
          data.choices = block.items.map((item: any, index: number) => ({
            id: item.id || `choice_${index}`,
            label: item.content || item.title || item.label || `Opção ${index + 1}`,
            value: String(index + 1),
            imageUrl: item.pictureSrc || item.imageUrl || undefined,
          }));
        }
        data.isMultiple = block.options?.isMultipleChoice || false;
        break;
        
      case 'payment':
        data.provider = 'mercadopago';
        data.amount = block.options?.amount || block.options?.price || 0;
        data.currency = block.options?.currency || 'BRL';
        data.productName = block.options?.name || block.options?.productName || 'Produto';
        data.description = block.options?.description || '';
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
        data.seconds = block.options?.secondsToWaitFor || block.options?.delay || 3;
        break;
        
      case 'variable':
        data.action = 'set';
        data.variableName = block.options?.variableId || '';
        data.varValue = block.options?.expressionToEvaluate || block.options?.value || '';
        break;
        
      case 'action_webhook':
        data.webhookUrl = block.options?.url || block.options?.webhook?.url || '';
        data.webhookMethod = block.options?.method || 'POST';
        data.webhookBody = block.options?.body || block.options?.data || '';
        break;
        
      case 'end':
        data.redirectUrl = block.options?.url || '';
        break;
    }
    
    return data;
  };

  const convertTypebotToNexo = (typebotData: TypebotFlow): { nodes: FunnelNode[]; edges: FunnelEdge[] } => {
    const nodes: FunnelNode[] = [];
    const edges: FunnelEdge[] = [];
    const blockIdMap = new Map<string, string>();
    
    const groups = typebotData.groups || [];
    const typebotEdges = typebotData.edges || [];
    
    // Process each group
    groups.forEach((group, groupIndex) => {
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
          const typebotEdge = typebotEdges.find(e => e.from.blockId === sourceOriginalId);
          if (typebotEdge?.to.blockId) {
            edge.target = blockIdMap.get(typebotEdge.to.blockId) || '';
          }
        }
      }
    });
    
    // Process typebot edges
    typebotEdges.forEach((typebotEdge) => {
      const sourceId = blockIdMap.get(typebotEdge.from.blockId);
      let targetId = typebotEdge.to.blockId ? blockIdMap.get(typebotEdge.to.blockId) : undefined;
      
      // If target is a group, find first block
      if (!targetId && typebotEdge.to.groupId) {
        const targetGroup = groups.find(g => g.id === typebotEdge.to.groupId);
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

  const normalizeTypebotData = (parsed: any): TypebotFlow => {
    // Log keys for debugging
    console.log('Typebot JSON keys:', Object.keys(parsed));
    
    // Check different Typebot export formats
    
    // Format 1: Direct groups/edges at root
    if (parsed.groups && Array.isArray(parsed.groups)) {
      console.log('Detected format: Direct groups at root');
      return {
        groups: parsed.groups,
        edges: parsed.edges || [],
        variables: parsed.variables || [],
      };
    }
    
    // Format 2: Nested inside "typebot" object
    if (parsed.typebot?.groups && Array.isArray(parsed.typebot.groups)) {
      console.log('Detected format: Nested typebot object');
      return {
        groups: parsed.typebot.groups,
        edges: parsed.typebot.edges || [],
        variables: parsed.typebot.variables || [],
      };
    }
    
    // Format 3: Results export format (has "results" array)
    if (parsed.results && parsed.typebot) {
      console.log('Detected format: Results export');
      return {
        groups: parsed.typebot.groups || [],
        edges: parsed.typebot.edges || [],
        variables: parsed.typebot.variables || [],
      };
    }
    
    // Format 4: Workspace export (has "typebots" array)
    if (parsed.typebots && Array.isArray(parsed.typebots) && parsed.typebots[0]) {
      console.log('Detected format: Workspace export');
      const firstBot = parsed.typebots[0];
      return {
        groups: firstBot.groups || [],
        edges: firstBot.edges || [],
        variables: firstBot.variables || [],
      };
    }
    
    // Format 5: Version 6 format with events
    if (parsed.version && parsed.events && parsed.groups) {
      console.log('Detected format: Version 6 with events');
      return {
        groups: parsed.groups,
        edges: parsed.edges || [],
        variables: parsed.variables || [],
      };
    }
    
    // Format 6: Flows/blocks structure (some Typebot versions)
    if (parsed.flows && Array.isArray(parsed.flows)) {
      console.log('Detected format: Flows array');
      const allGroups: TypebotGroup[] = [];
      const allEdges: TypebotEdge[] = [];
      parsed.flows.forEach((flow: any) => {
        if (flow.groups) allGroups.push(...flow.groups);
        if (flow.edges) allEdges.push(...flow.edges);
      });
      return { groups: allGroups, edges: allEdges, variables: [] };
    }
    
    // Format 7: Blocks at root level (simplified export)
    if (parsed.blocks && Array.isArray(parsed.blocks)) {
      console.log('Detected format: Blocks at root');
      return {
        groups: [{
          id: 'main',
          title: 'Main',
          blocks: parsed.blocks,
          graphCoordinates: { x: 0, y: 0 },
        }],
        edges: parsed.edges || [],
        variables: parsed.variables || [],
      };
    }
    
    // Format 8: Data wrapper (API response format)
    if (parsed.data?.groups || parsed.data?.typebot?.groups) {
      console.log('Detected format: Data wrapper');
      const inner = parsed.data.typebot || parsed.data;
      return {
        groups: inner.groups || [],
        edges: inner.edges || [],
        variables: inner.variables || [],
      };
    }
    
    // Format 9: publicTypebot wrapper
    if (parsed.publicTypebot?.groups) {
      console.log('Detected format: publicTypebot wrapper');
      return {
        groups: parsed.publicTypebot.groups,
        edges: parsed.publicTypebot.edges || [],
        variables: parsed.publicTypebot.variables || [],
      };
    }
    
    // Show what keys we found for debugging
    const keysFound = Object.keys(parsed).slice(0, 10).join(', ');
    throw new Error(`Formato não reconhecido. Chaves encontradas: ${keysFound}. Cole o conteúdo do arquivo exportado do Typebot usando "Export flow".`);
  };

  const handleConvert = () => {
    setIsConverting(true);
    setError(null);
    setConvertedData(null);
    
    try {
      const parsed = JSON.parse(inputJson);
      
      // Normalize to standard format
      const normalizedData = normalizeTypebotData(parsed);
      
      const result = convertTypebotToNexo(normalizedData);
      
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