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
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import BlockNode from './BlockNode';
import { BlockSidebar } from './BlockSidebar';
import { PropertiesPanel } from './PropertiesPanel';
import { FunnelToolbar } from './FunnelToolbar';
import { BlockType, BLOCK_INFO, BlockData, FunnelNode, FunnelEdge, SCHEMA_VERSION } from './types';
import { useToast } from '@/hooks/use-toast';

const nodeTypes = {
  block: BlockNode,
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
  const { screenToFlowPosition } = useReactFlow();
  const [isSaving, setIsSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const saveTimeoutRef = useRef<NodeJS.Timeout>();
  
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

  const convertToFlowEdges = (edges: FunnelEdge[]): Edge[] => {
    return edges.map((edge) => ({
      id: edge.id,
      source: edge.source,
      target: edge.target,
      sourceHandle: edge.sourceHandle,
      targetHandle: edge.targetHandle,
      animated: true,
      style: { stroke: 'hsl(var(--primary))' },
    }));
  };

  const [nodes, setNodes, onNodesChange] = useNodesState(convertToFlowNodes(initialNodes));
  const [edges, setEdges, onEdgesChange] = useEdgesState(convertToFlowEdges(initialEdges));
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);

  // Update nodes when initialNodes change
  useEffect(() => {
    setNodes(convertToFlowNodes(initialNodes));
    setEdges(convertToFlowEdges(initialEdges));
  }, [initialNodes, initialEdges, setNodes, setEdges]);

  // Auto-save with debounce
  const triggerAutoSave = useCallback(() => {
    setHasUnsavedChanges(true);
    
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    
    saveTimeoutRef.current = setTimeout(async () => {
      await handleSave();
    }, 2000); // Auto-save after 2 seconds of inactivity
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
    setEdges((eds) => addEdge({
      ...params,
      animated: true,
      style: { stroke: 'hsl(var(--primary))' },
    }, eds));
    triggerAutoSave();
  }, [setEdges, triggerAutoSave]);

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
      id: `${type}_${Date.now()}`,
      type: 'block',
      position,
      data: {
        blockType: type,
        ...getDefaultDataForType(type),
      },
    };

    setNodes((nds) => [...nds, newNode]);
    triggerAutoSave();
    
    toast({
      title: 'Bloco adicionado',
      description: BLOCK_INFO[type].label,
    });
  }, [screenToFlowPosition, setNodes, toast, triggerAutoSave]);

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
    triggerAutoSave();
  }, [setNodes, triggerAutoSave]);

  const handleDeleteNode = useCallback((nodeId: string) => {
    setNodes((nds) => nds.filter((node) => node.id !== nodeId));
    setEdges((eds) => eds.filter((edge) => edge.source !== nodeId && edge.target !== nodeId));
    setSelectedNode(null);
    triggerAutoSave();
    toast({ title: 'Bloco removido' });
  }, [setNodes, setEdges, toast, triggerAutoSave]);

  const onSelectionChange = useCallback(({ nodes: selectedNodes }: { nodes: Node[] }) => {
    setSelectedNode(selectedNodes.length === 1 ? selectedNodes[0] : null);
  }, []);

  const onNodesChangeWithSave = useCallback((changes: any) => {
    onNodesChange(changes);
    // Only trigger save for position changes
    if (changes.some((c: any) => c.type === 'position' && c.dragging === false)) {
      triggerAutoSave();
    }
  }, [onNodesChange, triggerAutoSave]);

  const onEdgesChangeWithSave = useCallback((changes: any) => {
    onEdgesChange(changes);
    if (changes.some((c: any) => c.type === 'remove')) {
      triggerAutoSave();
    }
  }, [onEdgesChange, triggerAutoSave]);

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

  return (
    <div className="flex h-full">
      <BlockSidebar onDragStart={onDragStart} />
      
      <div className="flex-1 flex flex-col">
        <FunnelToolbar
          funnelName={funnelName}
          isActive={isActive}
          isSaving={isSaving}
          hasUnsavedChanges={hasUnsavedChanges}
          onSave={handleSave}
          onExport={onExport}
          onImport={onImport}
          onToggleActive={onToggleActive}
        />
        
        <div 
          ref={reactFlowWrapper} 
          className="flex-1"
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
            fitView
            snapToGrid
            snapGrid={[20, 20]}
            defaultEdgeOptions={{
              animated: true,
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
    case 'end':
      return { label: 'Fim' };
    default:
      return {};
  }
}
