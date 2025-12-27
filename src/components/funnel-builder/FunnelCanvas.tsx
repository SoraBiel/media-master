import { useCallback, useRef, useEffect, useState } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  addEdge,
  useNodesState,
  useEdgesState,
  Connection,
  Edge,
  Node,
  OnConnect,
  ReactFlowProvider,
  useReactFlow,
  EdgeProps,
  getBezierPath,
  BaseEdge,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Pencil, ScrollText, Webhook, Package, Settings, X, LayoutGrid, LayoutList } from 'lucide-react';

import BlockNode from './BlockNode';
import { BlockSidebar } from './BlockSidebar';
import { PropertiesPanel } from './PropertiesPanel';
import { FunnelToolbar } from './FunnelToolbar';
import { FunnelLogsPanel } from './FunnelLogsPanel';
import { WebhookConfig } from './WebhookConfig';
import FunnelProductsTab from './FunnelProductsTab';
import { FunnelSettingsTab } from './FunnelSettingsTab';
import { BlockType, BLOCK_INFO, BlockData, FunnelNode, FunnelEdge, SCHEMA_VERSION } from './types';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

const nodeTypes = {
  block: BlockNode,
};

// Custom deletable edge component
interface DeletableEdgeData {
  onDelete?: (id: string) => void;
  [key: string]: unknown;
}

const DeletableEdge = ({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
  data,
}: EdgeProps<Edge<DeletableEdgeData>>) => {
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const onEdgeClick = (event: React.MouseEvent) => {
    event.stopPropagation();
    const edgeData = data as DeletableEdgeData | undefined;
    if (edgeData?.onDelete) {
      edgeData.onDelete(id);
    }
  };

  return (
    <>
      <BaseEdge path={edgePath} markerEnd={markerEnd} style={style} />
      <foreignObject
        width={24}
        height={24}
        x={labelX - 12}
        y={labelY - 12}
        className="edgebutton-foreignobject"
        requiredExtensions="http://www.w3.org/1999/xhtml"
      >
        <div className="flex items-center justify-center w-full h-full">
          <button
            className="w-5 h-5 rounded-full bg-destructive hover:bg-destructive/80 flex items-center justify-center cursor-pointer transition-all opacity-0 hover:opacity-100 group-hover:opacity-100"
            onClick={onEdgeClick}
            style={{ opacity: 0.7 }}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = '0.7')}
          >
            <X className="w-3 h-3 text-destructive-foreground" />
          </button>
        </div>
      </foreignObject>
    </>
  );
};

const edgeTypes = {
  deletable: DeletableEdge,
};

interface FunnelCanvasProps {
  funnelId: string;
  funnelName: string;
  initialNodes: FunnelNode[];
  initialEdges: FunnelEdge[];
  onSave: (nodes: FunnelNode[], edges: FunnelEdge[]) => Promise<void>;
  onExport: () => void;
  onImport: (data: any) => void;
  isActive: boolean;
  onToggleActive: () => void;
}

const FunnelCanvasInner = ({
  funnelId,
  funnelName,
  initialNodes,
  initialEdges,
  onSave,
  onExport,
  onImport,
  isActive,
  onToggleActive,
}: FunnelCanvasProps) => {
  const { toast } = useToast();
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const { screenToFlowPosition, fitView } = useReactFlow();
  const [isSaving, setIsSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [activeTab, setActiveTab] = useState('editor');
  const [webhookDialogOpen, setWebhookDialogOpen] = useState(false);
  const didInitialFitRef = useRef(false);
  const [layoutDirection, setLayoutDirection] = useState<'horizontal' | 'vertical'>('horizontal');
  
  // Convert to React Flow format
  const convertToFlowNodes = (nodes: FunnelNode[]): Node[] => {
    return nodes.map((node) => ({
      id: node.id,
      type: 'block',
      position: node.position,
      data: {
        blockType: node.type,
        ...node.data,
      },
    }));
  };

  const [nodes, setNodes, onNodesChange] = useNodesState(convertToFlowNodes(initialNodes));
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);

  // Delete edge handler - must be after setEdges is defined
  const handleDeleteEdge = useCallback((edgeId: string) => {
    setEdges((eds) => eds.filter((e) => e.id !== edgeId));
    setHasUnsavedChanges(true);
    toast({ title: 'Conexão removida - Clique em Salvar para persistir' });
  }, [setEdges, toast]);

  // Convert edges with delete handler
  const convertToFlowEdges = useCallback((edges: FunnelEdge[]): Edge[] => {
    return edges.map((edge) => ({
      id: edge.id,
      source: edge.source,
      target: edge.target,
      sourceHandle: edge.sourceHandle || 'default',
      targetHandle: edge.targetHandle,
      type: 'deletable',
      animated: true,
      style: { stroke: 'hsl(var(--primary))' },
      data: { onDelete: handleDeleteEdge },
    }));
  }, [handleDeleteEdge]);

  // Initialize edges after handleDeleteEdge is defined
  useEffect(() => {
    setEdges(convertToFlowEdges(initialEdges));
  }, []);

  // Update nodes when initialNodes change
  useEffect(() => {
    setNodes(convertToFlowNodes(initialNodes));
    setEdges(convertToFlowEdges(initialEdges));
  }, [initialNodes, initialEdges, setNodes, setEdges, convertToFlowEdges]);

  // Fit view only once (avoid re-centering after save)
  useEffect(() => {
    if (didInitialFitRef.current) return;
    if (nodes.length === 0) return;

    didInitialFitRef.current = true;
    requestAnimationFrame(() => {
      fitView({ padding: 0.2, duration: 250 });
    });
  }, [nodes.length, fitView]);

  // Confirm browser/tab close when there are unsaved changes
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (!hasUnsavedChanges) return;
      e.preventDefault();
      e.returnValue = '';
    };

    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [hasUnsavedChanges]);

  // Mark changes as unsaved (no auto-save - user must click save)
  const markUnsaved = useCallback(() => {
    setHasUnsavedChanges(true);
  }, []);

  // Convert back to funnel format
  const convertToFunnelFormat = useCallback(() => {
    const funnelNodes: FunnelNode[] = nodes.map((node) => ({
      id: node.id,
      type: (node.data as any).blockType as BlockType,
      position: node.position,
      data: Object.fromEntries(
        Object.entries(node.data as BlockData).filter(([key]) => key !== 'blockType')
      ) as BlockData,
    }));

    const funnelEdges: FunnelEdge[] = edges.map((edge) => ({
      id: edge.id,
      source: edge.source,
      target: edge.target,
      sourceHandle: edge.sourceHandle || undefined,
      targetHandle: edge.targetHandle || undefined,
    }));

    return { nodes: funnelNodes, edges: funnelEdges };
  }, [nodes, edges]);

  const handleSave = useCallback(async () => {
    setIsSaving(true);
    try {
      const { nodes: funnelNodes, edges: funnelEdges } = convertToFunnelFormat();
      await onSave(funnelNodes, funnelEdges);
      setHasUnsavedChanges(false);
    } catch (error) {
      console.error('Error saving:', error);
      toast({
        title: 'Erro ao salvar',
        description: 'Não foi possível salvar o funil.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  }, [convertToFunnelFormat, onSave, toast]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+S to save
      if (e.ctrlKey && e.key === 's') {
        e.preventDefault();
        handleSave();
      }
      
      // Delete selected node
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedNode) {
        const target = e.target as HTMLElement;
        if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;
        
        handleDeleteNode(selectedNode.id);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleSave, selectedNode]);

  // Local storage backup
  useEffect(() => {
    const backupKey = `funnel_backup_${funnelId}`;
    
    if (hasUnsavedChanges) {
      const { nodes: funnelNodes, edges: funnelEdges } = convertToFunnelFormat();
      localStorage.setItem(backupKey, JSON.stringify({
        nodes: funnelNodes,
        edges: funnelEdges,
        timestamp: Date.now(),
      }));
    }
  }, [nodes, edges, funnelId, hasUnsavedChanges, convertToFunnelFormat]);

  const onConnect: OnConnect = useCallback((params: Connection) => {
    setEdges((eds) =>
      addEdge(
        {
          id: crypto.randomUUID(),
          ...params,
          type: 'deletable',
          animated: true,
          style: { stroke: 'hsl(var(--primary))' },
          data: { onDelete: handleDeleteEdge },
        },
        eds
      )
    );
    markUnsaved();
  }, [setEdges, markUnsaved, handleDeleteEdge]);

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback((event: React.DragEvent) => {
    event.preventDefault();

    const type = event.dataTransfer.getData('application/reactflow') as BlockType;
    if (!type || !BLOCK_INFO[type]) return;

    const position = screenToFlowPosition({
      x: event.clientX,
      y: event.clientY,
    });

    const newNode: Node = {
      id: crypto.randomUUID(),
      type: 'block',
      position,
      data: {
        blockType: type,
        ...getDefaultDataForType(type),
      },
    };

    setNodes((nds) => [...nds, newNode]);
    markUnsaved();
    
    toast({
      title: 'Bloco adicionado',
      description: `${BLOCK_INFO[type].label} - Clique em Salvar para persistir`,
    });
  }, [screenToFlowPosition, setNodes, toast, markUnsaved]);

  const onDragStart = useCallback((event: React.DragEvent, blockType: BlockType) => {
    event.dataTransfer.setData('application/reactflow', blockType);
    event.dataTransfer.effectAllowed = 'move';
  }, []);

  const handleUpdateNode = useCallback((nodeId: string, data: Partial<BlockData>) => {
    setNodes((nds) =>
      nds.map((node) =>
        node.id === nodeId
          ? { ...node, data: { ...node.data, ...data } }
          : node
      )
    );
    markUnsaved();
  }, [setNodes, markUnsaved]);

  const handleDeleteNode = useCallback((nodeId: string) => {
    setNodes((nds) => nds.filter((node) => node.id !== nodeId));
    setEdges((eds) => eds.filter((edge) => edge.source !== nodeId && edge.target !== nodeId));
    setSelectedNode(null);
    markUnsaved();
    toast({ title: 'Bloco removido - Clique em Salvar para persistir' });
  }, [setNodes, setEdges, toast, markUnsaved]);

  // Toggle layout between horizontal and vertical
  const handleToggleLayout = useCallback(() => {
    const newDirection = layoutDirection === 'horizontal' ? 'vertical' : 'horizontal';
    setLayoutDirection(newDirection);
    
    // Reorganize nodes based on current edges (flow order)
    const nodeMap = new Map(nodes.map(n => [n.id, n]));
    const incomingEdges = new Map<string, string[]>();
    const outgoingEdges = new Map<string, string[]>();
    
    edges.forEach(edge => {
      if (!outgoingEdges.has(edge.source)) outgoingEdges.set(edge.source, []);
      outgoingEdges.get(edge.source)!.push(edge.target);
      
      if (!incomingEdges.has(edge.target)) incomingEdges.set(edge.target, []);
      incomingEdges.get(edge.target)!.push(edge.source);
    });
    
    // Find start nodes (no incoming edges)
    const startNodes = nodes.filter(n => !incomingEdges.has(n.id) || incomingEdges.get(n.id)!.length === 0);
    
    // BFS to order nodes by level
    const visited = new Set<string>();
    const levels: Node[][] = [];
    let currentLevel = startNodes;
    
    while (currentLevel.length > 0) {
      levels.push(currentLevel);
      currentLevel.forEach(n => visited.add(n.id));
      
      const nextLevel: Node[] = [];
      currentLevel.forEach(node => {
        const targets = outgoingEdges.get(node.id) || [];
        targets.forEach(targetId => {
          if (!visited.has(targetId)) {
            const targetNode = nodeMap.get(targetId);
            if (targetNode && !nextLevel.find(n => n.id === targetId)) {
              nextLevel.push(targetNode);
            }
          }
        });
      });
      currentLevel = nextLevel;
    }
    
    // Add any unvisited nodes
    nodes.forEach(n => {
      if (!visited.has(n.id)) {
        if (levels.length === 0) levels.push([]);
        levels[levels.length - 1].push(n);
      }
    });
    
    // Reposition nodes
    const NODE_WIDTH = 250;
    const NODE_HEIGHT = 120;
    const GAP_X = newDirection === 'horizontal' ? 300 : 50;
    const GAP_Y = newDirection === 'horizontal' ? 150 : 200;
    
    const updatedNodes = nodes.map(node => {
      let levelIndex = 0;
      let indexInLevel = 0;
      
      for (let i = 0; i < levels.length; i++) {
        const idx = levels[i].findIndex(n => n.id === node.id);
        if (idx !== -1) {
          levelIndex = i;
          indexInLevel = idx;
          break;
        }
      }
      
      const levelSize = levels[levelIndex]?.length || 1;
      
      let x, y;
      if (newDirection === 'horizontal') {
        // Horizontal: nodes flow left to right
        x = levelIndex * GAP_X;
        y = indexInLevel * GAP_Y - ((levelSize - 1) * GAP_Y) / 2;
      } else {
        // Vertical: nodes flow top to bottom
        x = indexInLevel * (NODE_WIDTH + GAP_X) - ((levelSize - 1) * (NODE_WIDTH + GAP_X)) / 2;
        y = levelIndex * GAP_Y;
      }
      
      return {
        ...node,
        position: { x, y },
      };
    });
    
    setNodes(updatedNodes);
    markUnsaved();
    
    // Fit view after layout change
    setTimeout(() => {
      fitView({ padding: 0.2, duration: 300 });
    }, 50);
    
    toast({
      title: newDirection === 'horizontal' ? 'Layout horizontal' : 'Layout vertical',
      description: 'Os blocos foram reorganizados.',
    });
  }, [layoutDirection, nodes, edges, setNodes, markUnsaved, fitView, toast]);

  const onSelectionChange = useCallback(({ nodes: selectedNodes }: { nodes: Node[] }) => {
    setSelectedNode(selectedNodes.length === 1 ? selectedNodes[0] : null);
  }, []);

  const onNodesChangeWithSave = useCallback((changes: any) => {
    onNodesChange(changes);
    // Only mark unsaved for position changes
    if (changes.some((c: any) => c.type === 'position' && c.dragging === false)) {
      markUnsaved();
    }
  }, [onNodesChange, markUnsaved]);

  const onEdgesChangeWithSave = useCallback((changes: any) => {
    onEdgesChange(changes);
    if (changes.some((c: any) => c.type === 'remove')) {
      markUnsaved();
    }
  }, [onEdgesChange, markUnsaved]);

  // Handle file drop for import
  const handleFileDrop = useCallback((event: React.DragEvent) => {
    const file = event.dataTransfer.files[0];
    if (file && file.name.endsWith('.json')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target?.result as string);
          onImport(data);
        } catch (error) {
          toast({
            title: 'Erro ao importar',
            description: 'Arquivo JSON inválido.',
            variant: 'destructive',
          });
        }
      };
      reader.readAsText(file);
    }
  }, [onImport, toast]);

  // Convert nodes to sandbox format
  const sandboxNodes = nodes.map((node) => ({
    id: node.id,
    type: (node.data as any).blockType as string,
    data: Object.fromEntries(
      Object.entries(node.data as Record<string, any>).filter(([key]) => key !== 'blockType')
    ),
  }));

  const sandboxEdges = edges.map((edge) => ({
    id: edge.id,
    source: edge.source,
    target: edge.target,
    sourceHandle: edge.sourceHandle || null,
  }));

  const handleResetSessions = useCallback(async () => {
    const { error } = await supabase
      .from('telegram_sessions')
      .update({ is_finished: true })
      .eq('funnel_id', funnelId)
      .eq('is_finished', false);

    if (error) throw error;
  }, [funnelId]);

  return (
    <div className="flex h-full min-h-0 flex-col">
      <FunnelToolbar
        funnelName={funnelName}
        funnelId={funnelId}
        isActive={isActive}
        isSaving={isSaving}
        hasUnsavedChanges={hasUnsavedChanges}
        onSave={handleSave}
        onExport={onExport}
        onImport={onImport}
        onToggleActive={onToggleActive}
        onResetSessions={handleResetSessions}
        sandboxNodes={sandboxNodes}
        sandboxEdges={sandboxEdges}
      />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 min-h-0 flex flex-col">
        <div className="px-4 py-2 border-b bg-background flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="editor" className="flex items-center gap-2">
              <Pencil className="h-4 w-4" />
              Editor
            </TabsTrigger>
            <TabsTrigger value="logs" className="flex items-center gap-2">
              <ScrollText className="h-4 w-4" />
              Logs
            </TabsTrigger>
            <TabsTrigger value="products" className="flex items-center gap-2">
              <Package className="h-4 w-4" />
              Produto
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Configurações
            </TabsTrigger>
          </TabsList>
          <div className="flex items-center gap-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleToggleLayout}
                  >
                    {layoutDirection === 'horizontal' ? (
                      <LayoutList className="h-4 w-4" />
                    ) : (
                      <LayoutGrid className="h-4 w-4" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  {layoutDirection === 'horizontal' ? 'Mudar para layout vertical' : 'Mudar para layout horizontal'}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setWebhookDialogOpen(true)}
            >
              <Webhook className="h-4 w-4 mr-2" />
              Webhook
            </Button>
          </div>
        </div>

        <TabsContent value="editor" className="flex-1 min-h-0 flex m-0 data-[state=inactive]:hidden overflow-hidden">
          <BlockSidebar onDragStart={onDragStart} />

          <div className="flex-1 min-h-0 flex flex-col">
            <div
              ref={reactFlowWrapper}
              className="flex-1 min-h-0"
              onDrop={(e) => {
                if (e.dataTransfer.files.length > 0) {
                  handleFileDrop(e);
                }
              }}
            >
              <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChangeWithSave}
                onEdgesChange={onEdgesChangeWithSave}
                onConnect={onConnect}
                onDrop={onDrop}
                onDragOver={onDragOver}
                onSelectionChange={onSelectionChange}
                nodeTypes={nodeTypes}
                edgeTypes={edgeTypes}
                snapToGrid
                snapGrid={[20, 20]}
                defaultEdgeOptions={{
                  animated: true,
                  type: 'deletable',
                  style: { stroke: 'hsl(var(--primary))' },
                }}
                className="bg-muted/20"
              >
                <Background gap={20} size={1} className="bg-muted/30" />
                <Controls />
                <MiniMap 
                  nodeColor={(node) => {
                    const blockType = (node.data as any)?.blockType as BlockType;
                    const info = BLOCK_INFO[blockType];
                    return info?.color.replace('bg-', '').replace('-500', '') || '#888';
                  }}
                  maskColor="rgba(0,0,0,0.1)"
                />
              </ReactFlow>
            </div>
          </div>
          
          <PropertiesPanel
            selectedNode={selectedNode}
            onUpdateNode={handleUpdateNode}
            onDeleteNode={handleDeleteNode}
          />
        </TabsContent>

        <TabsContent value="logs" className="flex-1 m-0 data-[state=inactive]:hidden">
          <FunnelLogsPanel funnelId={funnelId} />
        </TabsContent>

        <TabsContent value="products" className="flex-1 m-0 p-4 data-[state=inactive]:hidden overflow-auto">
          <FunnelProductsTab funnelId={funnelId} />
        </TabsContent>

        <TabsContent value="settings" className="flex-1 m-0 data-[state=inactive]:hidden overflow-auto">
          <FunnelSettingsTab funnelId={funnelId} />
        </TabsContent>
      </Tabs>

      <WebhookConfig
        funnelId={funnelId}
        open={webhookDialogOpen}
        onOpenChange={setWebhookDialogOpen}
      />
    </div>
  );
};

export const FunnelCanvas = (props: FunnelCanvasProps) => {
  return (
    <ReactFlowProvider>
      <FunnelCanvasInner {...props} />
    </ReactFlowProvider>
  );
};

// Helper function to get default data for each block type
function getDefaultDataForType(type: BlockType): BlockData {
  switch (type) {
    case 'start':
      return { label: 'Início' };
    case 'message':
      return { text: '' };
    case 'question':
      return { questionText: '', variableName: '' };
    case 'question_choice':
      return { 
        questionText: '', 
        variableName: '',
        choices: [
          { id: 'choice_1', label: 'Opção 1', value: '1' },
          { id: 'choice_2', label: 'Opção 2', value: '2' },
        ],
      };
    case 'question_number':
      return { questionText: '', variableName: '' };
    case 'condition':
      return { variable: '', operator: 'equals', value: '' };
    case 'delay':
      return { seconds: 5 };
    case 'variable':
      return { action: 'set', variableName: '', varValue: '' };
    case 'action_message':
      return { text: '' };
    case 'action_notify':
      return { text: '' };
    case 'action_webhook':
      return { webhookUrl: '', webhookMethod: 'POST' };
    case 'remarketing':
      return { 
        remarketingType: 'inactivity',
        remarketingDelay: 24,
        remarketingMessage: 'Oi! Notei que você não finalizou. Posso ajudar?',
        remarketingMaxAttempts: 3,
      };
    case 'payment':
      return { 
        productId: '',
        productSelectionType: 'fixed',
        paymentMessage: '💰 Segue o PIX para pagamento:\n\n{pix_code}\n\nValor: R$ {amount}',
        successMessage: '✅ Pagamento confirmado! Obrigado pela compra.',
        timeoutMinutes: 30,
      };
    case 'delivery':
      return { 
        deliveryType: 'pack',
        deliveryPackId: '',
        deliveryMessage: '🎁 Aqui está sua entrega!',
      };
    case 'end':
      return { label: 'Fim' };
    default:
      return {};
  }
}
