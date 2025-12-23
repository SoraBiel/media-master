import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Save,
  Play,
  Pause,
  Download,
  Upload,
  Cloud,
  CloudOff,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { FunnelSandbox } from './FunnelSandbox';

interface SandboxNode {
  id: string;
  type: string;
  data: Record<string, any>;
}

interface SandboxEdge {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string | null;
}

interface FunnelToolbarProps {
  funnelName: string;
  isActive: boolean;
  isSaving: boolean;
  hasUnsavedChanges: boolean;
  onSave: () => void;
  onExport: () => void;
  onImport: (data: any) => void;
  onToggleActive: () => void;
  sandboxNodes?: SandboxNode[];
  sandboxEdges?: SandboxEdge[];
}

export const FunnelToolbar = ({
  funnelName,
  isActive,
  isSaving,
  hasUnsavedChanges,
  onSave,
  onExport,
  onImport,
  onToggleActive,
  sandboxNodes = [],
  sandboxEdges = [],
}: FunnelToolbarProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [confirmLeaveOpen, setConfirmLeaveOpen] = useState(false);

  const handleFileImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);

        if (!data.schemaVersion || !data.nodes || !Array.isArray(data.nodes)) {
          throw new Error('Formato de arquivo inválido');
        }

        onImport(data);
        toast({
          title: 'Funil importado',
          description: `${data.nodes.length} blocos importados com sucesso.`,
        });
      } catch (error: any) {
        toast({
          title: 'Erro ao importar',
          description: error.message || 'Arquivo JSON inválido.',
          variant: 'destructive',
        });
      }
    };
    reader.readAsText(file);

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleBack = () => {
    if (hasUnsavedChanges) {
      setConfirmLeaveOpen(true);
      return;
    }
    navigate('/funnels');
  };

  return (
    <>
      <div className="h-14 border-b border-border bg-card/80 backdrop-blur-sm px-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={handleBack}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-2">
            <h1 className="font-semibold">{funnelName}</h1>
            {hasUnsavedChanges && (
              <Badge variant="outline" className="text-xs text-amber-500 border-amber-500/50">
                <CloudOff className="w-3 h-3 mr-1" />
                Alterações não salvas
              </Badge>
            )}
            {!hasUnsavedChanges && (
              <Badge variant="outline" className="text-xs text-muted-foreground">
                <Cloud className="w-3 h-3 mr-1" />
                Tudo salvo
              </Badge>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <FunnelSandbox
            funnelName={funnelName}
            nodes={sandboxNodes}
            edges={sandboxEdges}
          />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Arquivo
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onExport}>
                <Download className="w-4 h-4 mr-2" />
                Exportar JSON
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => fileInputRef.current?.click()}>
                <Upload className="w-4 h-4 mr-2" />
                Importar JSON
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            className="hidden"
            onChange={handleFileImport}
          />

          <Button
            variant={isActive ? 'secondary' : 'outline'}
            size="sm"
            onClick={onToggleActive}
          >
            {isActive ? (
              <>
                <Pause className="w-4 h-4 mr-2" />
                Desativar
              </>
            ) : (
              <>
                <Play className="w-4 h-4 mr-2" />
                Ativar
              </>
            )}
          </Button>

          <Button
            variant="gradient"
            size="sm"
            onClick={onSave}
            disabled={isSaving}
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Salvar
              </>
            )}
          </Button>
        </div>
      </div>

      <AlertDialog open={confirmLeaveOpen} onOpenChange={setConfirmLeaveOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Sair sem salvar?</AlertDialogTitle>
            <AlertDialogDescription>
              Você tem alterações não salvas. Se sair agora, elas serão perdidas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Continuar editando</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setConfirmLeaveOpen(false);
                navigate('/funnels');
              }}
            >
              Sair sem salvar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
