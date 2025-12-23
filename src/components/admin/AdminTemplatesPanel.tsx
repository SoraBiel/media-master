import { useState, useEffect, useRef } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  Plus,
  Pencil,
  Trash2,
  Copy,
  Eye,
  DollarSign,
  Gift,
  MoreVertical,
  RefreshCw,
  Upload,
  FileJson,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
import { supabase } from '@/integrations/supabase/client';
import type { Json } from '@/integrations/supabase/types';

interface FunnelTemplate {
  id: string;
  name: string;
  description: string | null;
  category: string;
  is_free: boolean;
  is_active: boolean;
  nodes: Json;
  edges: Json;
  schema_version: number;
  template_version: number;
  created_at: string;
}

const CATEGORIES = [
  { value: 'lead_capture', label: 'Captação de Leads' },
  { value: 'sales', label: 'Vendas' },
  { value: 'support', label: 'Suporte' },
  { value: 'onboarding', label: 'Onboarding' },
  { value: 'reactivation', label: 'Reativação' },
  { value: 'general', label: 'Geral' },
];

const PLAN_ACCESS = [
  { value: 'free', label: 'Grátis (Todos)' },
  { value: 'basic', label: 'Basic+' },
  { value: 'pro', label: 'Pro+' },
  { value: 'agency', label: 'Agency' },
];

export const AdminTemplatesPanel = () => {
  const { toast } = useToast();
  const [templates, setTemplates] = useState<FunnelTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<FunnelTemplate | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'general',
    is_free: true,
    is_active: true,
    min_plan: 'free',
  });

  const [nodesEdges, setNodesEdges] = useState<{ nodes: any[]; edges: any[] }>({
    nodes: [],
    edges: [],
  });

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('funnel_templates')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTemplates(data || []);
    } catch (error) {
      console.error('Error fetching templates:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os templates.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenEdit = (template?: FunnelTemplate) => {
    if (template) {
      setSelectedTemplate(template);
      setFormData({
        name: template.name,
        description: template.description || '',
        category: template.category,
        is_free: template.is_free ?? true,
        is_active: template.is_active ?? true,
        min_plan: template.is_free ? 'free' : 'basic',
      });
      setNodesEdges({
        nodes: Array.isArray(template.nodes) ? template.nodes : [],
        edges: Array.isArray(template.edges) ? template.edges : [],
      });
    } else {
      setSelectedTemplate(null);
      setFormData({
        name: '',
        description: '',
        category: 'general',
        is_free: true,
        is_active: true,
        min_plan: 'free',
      });
      setNodesEdges({ nodes: [], edges: [] });
    }
    setEditDialogOpen(true);
  };

  const handleOpenDelete = (template: FunnelTemplate) => {
    setSelectedTemplate(template);
    setDeleteDialogOpen(true);
  };

  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        if (data.nodes && data.edges) {
          setNodesEdges({ nodes: data.nodes, edges: data.edges });
          if (data.name) setFormData(prev => ({ ...prev, name: data.name }));
          if (data.description) setFormData(prev => ({ ...prev, description: data.description }));
          toast({ title: 'Funil importado com sucesso!' });
        } else {
          throw new Error('Formato inválido');
        }
      } catch (error) {
        toast({
          title: 'Erro ao importar',
          description: 'Arquivo JSON inválido.',
          variant: 'destructive',
        });
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast({
        title: 'Erro',
        description: 'Nome é obrigatório.',
        variant: 'destructive',
      });
      return;
    }

    if (nodesEdges.nodes.length === 0) {
      toast({
        title: 'Erro',
        description: 'Importe um funil ou adicione blocos.',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const templateData = {
        name: formData.name,
        description: formData.description || null,
        category: formData.category,
        is_free: formData.is_free,
        is_active: formData.is_active,
        nodes: nodesEdges.nodes as unknown as Json,
        edges: nodesEdges.edges as unknown as Json,
        schema_version: 1,
      };

      if (selectedTemplate) {
        // Update existing
        const { error } = await supabase
          .from('funnel_templates')
          .update({
            ...templateData,
            template_version: selectedTemplate.template_version + 1,
          })
          .eq('id', selectedTemplate.id);

        if (error) throw error;
        toast({ title: 'Template atualizado!' });
      } else {
        // Create new
        const { error } = await supabase
          .from('funnel_templates')
          .insert({
            ...templateData,
            template_version: 1,
          });

        if (error) throw error;
        toast({ title: 'Template criado!' });
      }

      setEditDialogOpen(false);
      fetchTemplates();
    } catch (error: any) {
      console.error('Error saving template:', error);
      toast({
        title: 'Erro ao salvar',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedTemplate) return;

    try {
      const { error } = await supabase
        .from('funnel_templates')
        .delete()
        .eq('id', selectedTemplate.id);

      if (error) throw error;
      toast({ title: 'Template excluído!' });
      setDeleteDialogOpen(false);
      fetchTemplates();
    } catch (error: any) {
      toast({
        title: 'Erro ao excluir',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleToggleActive = async (template: FunnelTemplate) => {
    try {
      const { error } = await supabase
        .from('funnel_templates')
        .update({ is_active: !template.is_active })
        .eq('id', template.id);

      if (error) throw error;
      fetchTemplates();
      toast({ title: template.is_active ? 'Template desativado' : 'Template ativado' });
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleToggleFree = async (template: FunnelTemplate) => {
    try {
      const { error } = await supabase
        .from('funnel_templates')
        .update({ is_free: !template.is_free })
        .eq('id', template.id);

      if (error) throw error;
      fetchTemplates();
      toast({ title: template.is_free ? 'Template agora é pago' : 'Template agora é gratuito' });
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleDuplicate = async (template: FunnelTemplate) => {
    try {
      const { error } = await supabase
        .from('funnel_templates')
        .insert({
          name: `${template.name} (Cópia)`,
          description: template.description,
          category: template.category,
          is_free: template.is_free,
          is_active: false,
          nodes: template.nodes,
          edges: template.edges,
          schema_version: template.schema_version,
          template_version: 1,
        });

      if (error) throw error;
      toast({ title: 'Template duplicado!' });
      fetchTemplates();
    } catch (error: any) {
      toast({
        title: 'Erro ao duplicar',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const filteredTemplates = templates.filter(t =>
    t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getCategoryLabel = (value: string) => 
    CATEGORIES.find(c => c.value === value)?.label || value;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Input
            placeholder="Buscar templates..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-64"
          />
          <Button variant="outline" size="icon" onClick={fetchTemplates} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
        <Button onClick={() => handleOpenEdit()}>
          <Plus className="h-4 w-4 mr-2" />
          Novo Template
        </Button>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold">{templates.length}</div>
            <p className="text-xs text-muted-foreground">Total de Templates</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-success">
              {templates.filter(t => t.is_active).length}
            </div>
            <p className="text-xs text-muted-foreground">Ativos</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-primary">
              {templates.filter(t => t.is_free).length}
            </div>
            <p className="text-xs text-muted-foreground">Gratuitos</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-amber-500">
              {templates.filter(t => !t.is_free).length}
            </div>
            <p className="text-xs text-muted-foreground">Pagos</p>
          </CardContent>
        </Card>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Categoria</TableHead>
              <TableHead>Blocos</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Versão</TableHead>
              <TableHead>Criado em</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8">
                  <RefreshCw className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                </TableCell>
              </TableRow>
            ) : filteredTemplates.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                  Nenhum template encontrado
                </TableCell>
              </TableRow>
            ) : (
              filteredTemplates.map((template) => (
                <TableRow key={template.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{template.name}</p>
                      {template.description && (
                        <p className="text-xs text-muted-foreground truncate max-w-xs">
                          {template.description}
                        </p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{getCategoryLabel(template.category)}</Badge>
                  </TableCell>
                  <TableCell>
                    {Array.isArray(template.nodes) ? template.nodes.length : 0}
                  </TableCell>
                  <TableCell>
                    {template.is_active ? (
                      <Badge className="bg-success">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Ativo
                      </Badge>
                    ) : (
                      <Badge variant="secondary">
                        <XCircle className="h-3 w-3 mr-1" />
                        Inativo
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {template.is_free ? (
                      <Badge variant="outline" className="text-success border-success">
                        <Gift className="h-3 w-3 mr-1" />
                        Grátis
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-amber-500 border-amber-500">
                        <DollarSign className="h-3 w-3 mr-1" />
                        Pago
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>v{template.template_version}</TableCell>
                  <TableCell>
                    {format(new Date(template.created_at), 'dd/MM/yyyy', { locale: ptBR })}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleOpenEdit(template)}>
                          <Pencil className="h-4 w-4 mr-2" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDuplicate(template)}>
                          <Copy className="h-4 w-4 mr-2" />
                          Duplicar
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => handleToggleActive(template)}>
                          {template.is_active ? (
                            <>
                              <XCircle className="h-4 w-4 mr-2" />
                              Desativar
                            </>
                          ) : (
                            <>
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Ativar
                            </>
                          )}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleToggleFree(template)}>
                          {template.is_free ? (
                            <>
                              <DollarSign className="h-4 w-4 mr-2" />
                              Tornar Pago
                            </>
                          ) : (
                            <>
                              <Gift className="h-4 w-4 mr-2" />
                              Tornar Grátis
                            </>
                          )}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          onClick={() => handleOpenDelete(template)}
                          className="text-destructive"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Edit/Create Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {selectedTemplate ? 'Editar Template' : 'Novo Template'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nome *</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Nome do template"
              />
            </div>

            <div className="space-y-2">
              <Label>Descrição</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Descrição breve do template"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Categoria</Label>
                <Select
                  value={formData.category}
                  onValueChange={(v) => setFormData(prev => ({ ...prev, category: v }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map(cat => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Plano Mínimo</Label>
                <Select
                  value={formData.min_plan}
                  onValueChange={(v) => setFormData(prev => ({ 
                    ...prev, 
                    min_plan: v,
                    is_free: v === 'free',
                  }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PLAN_ACCESS.map(plan => (
                      <SelectItem key={plan.value} value={plan.value}>
                        {plan.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <div>
                <Label>Ativo</Label>
                <p className="text-xs text-muted-foreground">Template visível para usuários</p>
              </div>
              <Switch
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
              />
            </div>

            <div className="space-y-2">
              <Label>Estrutura do Funil</Label>
              <div className="flex items-center gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json"
                  className="hidden"
                  onChange={handleFileImport}
                />
                <Button
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex-1"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Importar JSON
                </Button>
                {nodesEdges.nodes.length > 0 && (
                  <Badge variant="secondary">
                    <FileJson className="h-3 w-3 mr-1" />
                    {nodesEdges.nodes.length} blocos
                  </Badge>
                )}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={isSubmitting}>
              {isSubmitting && <RefreshCw className="h-4 w-4 mr-2 animate-spin" />}
              {selectedTemplate ? 'Salvar' : 'Criar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Template</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o template "{selectedTemplate?.name}"?
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
