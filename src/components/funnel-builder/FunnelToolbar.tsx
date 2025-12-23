import { useRef } from 'react';
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
import { useToast } from '@/hooks/use-toast';

interface FunnelToolbarProps {
  funnelName: string;
  isActive: boolean;
  isSaving: boolean;
  hasUnsavedChanges: boolean;
  onSave: () => void;
  onExport: () => void;
  onImport: (data: any) => void;
  onToggleActive: () => void;
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
}: FunnelToolbarProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        
        // Validate schema
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
    
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="h-14 border-b border-border bg-card/80 backdrop-blur-sm px-4 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/funnels')}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex items-center gap-2">
          <h1 className="font-semibold">{funnelName}</h1>
          {hasUnsavedChanges && (
            <Badge variant="outline" className="text-xs">
              <CloudOff className="w-3 h-3 mr-1" />
              Não salvo
            </Badge>
          )}
          {!hasUnsavedChanges && (
            <Badge variant="outline" className="text-xs text-muted-foreground">
              <Cloud className="w-3 h-3 mr-1" />
              Salvo
            </Badge>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2">
        {/* Import/Export */}
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

        {/* Toggle Active */}
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

        {/* Save Button */}
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
  );
};
