import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, 
  Plus, 
  FileText, 
  Users, 
  ShoppingCart, 
  Headphones,
  Rocket,
  RefreshCw,
  Lock,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscription } from '@/hooks/useSubscription';
import { useToast } from '@/hooks/use-toast';

interface FunnelTemplate {
  id: string;
  name: string;
  description: string | null;
  category: string;
  is_free: boolean;
  nodes: any[];
  edges: any[];
}

const CATEGORY_ICONS: Record<string, typeof Users> = {
  marketing: Users,
  vendas: ShoppingCart,
  suporte: Headphones,
  onboarding: Rocket,
};

const CATEGORY_COLORS: Record<string, string> = {
  marketing: 'bg-blue-500',
  vendas: 'bg-emerald-500',
  suporte: 'bg-amber-500',
  onboarding: 'bg-violet-500',
};

interface TemplateSelectionProps {
  onClose: () => void;
  onSelectTemplate: (template: FunnelTemplate | null, name: string, description: string) => void;
}

export const TemplateSelection = ({ onClose, onSelectTemplate }: TemplateSelectionProps) => {
  const { user } = useAuth();
  const { currentPlan } = useSubscription();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [templates, setTemplates] = useState<FunnelTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTemplate, setSelectedTemplate] = useState<FunnelTemplate | null>(null);
  const [isNameDialogOpen, setIsNameDialogOpen] = useState(false);
  const [funnelName, setFunnelName] = useState('');
  const [funnelDescription, setFunnelDescription] = useState('');

  const isPaidPlan = currentPlan?.slug && currentPlan.slug !== 'free';

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      const { data, error } = await supabase
        .from('funnel_templates')
        .select('*')
        .eq('is_active', true)
        .order('category');

      if (error) throw error;
      
      // Parse JSONB fields
      const parsedTemplates = (data || []).map((t: any) => ({
        ...t,
        nodes: typeof t.nodes === 'string' ? JSON.parse(t.nodes) : t.nodes,
        edges: typeof t.edges === 'string' ? JSON.parse(t.edges) : t.edges,
      }));
      
      setTemplates(parsedTemplates);
    } catch (error: any) {
      console.error('Error fetching templates:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectTemplate = (template: FunnelTemplate | null) => {
    if (template && !template.is_free && !isPaidPlan) {
      toast({
        title: 'Template Premium',
        description: 'Faça upgrade do seu plano para usar este template.',
        variant: 'destructive',
      });
      return;
    }

    setSelectedTemplate(template);
    setFunnelName(template?.name || '');
    setFunnelDescription(template?.description || '');
    setIsNameDialogOpen(true);
  };

  const handleCreateFunnel = () => {
    if (!funnelName.trim()) {
      toast({
        title: 'Erro',
        description: 'Digite um nome para o funil.',
        variant: 'destructive',
      });
      return;
    }

    onSelectTemplate(selectedTemplate, funnelName, funnelDescription);
  };

  return (
    <div className="p-6 max-h-[80vh] overflow-y-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-2">Criar Novo Funil</h2>
        <p className="text-muted-foreground">
          Comece do zero ou escolha um template pronto
        </p>
      </div>

      {/* Blank Funnel */}
      <Card 
        className="mb-6 cursor-pointer hover:border-primary/50 transition-colors"
        onClick={() => handleSelectTemplate(null)}
      >
        <CardContent className="flex items-center gap-4 p-4">
          <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center">
            <Plus className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold">Criar do Zero</h3>
            <p className="text-sm text-muted-foreground">
              Canvas em branco para construir seu próprio fluxo
            </p>
          </div>
          <Sparkles className="w-5 h-5 text-muted-foreground" />
        </CardContent>
      </Card>

      {/* Templates Grid */}
      <h3 className="font-semibold mb-4 flex items-center gap-2">
        <FileText className="w-4 h-4" />
        Templates Prontos
      </h3>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="pb-2">
                <div className="h-6 bg-muted rounded w-3/4" />
              </CardHeader>
              <CardContent>
                <div className="h-4 bg-muted rounded w-full mb-2" />
                <div className="h-4 bg-muted rounded w-2/3" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {templates.map((template, index) => {
            const Icon = CATEGORY_ICONS[template.category] || FileText;
            const bgColor = CATEGORY_COLORS[template.category] || 'bg-gray-500';
            const isLocked = !template.is_free && !isPaidPlan;

            return (
              <motion.div
                key={template.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card 
                  className={`cursor-pointer transition-all ${isLocked ? 'opacity-60' : 'hover:border-primary/50'}`}
                  onClick={() => handleSelectTemplate(template)}
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-lg ${bgColor} flex items-center justify-center text-white`}>
                          <Icon className="w-5 h-5" />
                        </div>
                        <div>
                          <CardTitle className="text-base flex items-center gap-2">
                            {template.name}
                            {isLocked && <Lock className="w-3 h-3" />}
                          </CardTitle>
                          <Badge variant="outline" className="text-xs mt-1">
                            {template.category}
                          </Badge>
                        </div>
                      </div>
                      {template.is_free ? (
                        <Badge variant="secondary" className="bg-success/10 text-success">
                          Grátis
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="bg-amber-500/10 text-amber-500">
                          Premium
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {template.description}
                    </p>
                    <div className="flex items-center gap-2 mt-3 text-xs text-muted-foreground">
                      <span>{template.nodes?.length || 0} blocos</span>
                      <span>•</span>
                      <span>{template.edges?.length || 0} conexões</span>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Name Dialog */}
      <Dialog open={isNameDialogOpen} onOpenChange={setIsNameDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selectedTemplate ? `Usar template: ${selectedTemplate.name}` : 'Novo Funil'}
            </DialogTitle>
            <DialogDescription>
              Dê um nome ao seu funil
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="funnel-name">Nome do Funil</Label>
              <Input
                id="funnel-name"
                value={funnelName}
                onChange={(e) => setFunnelName(e.target.value)}
                placeholder="Ex: Captação de Leads"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="funnel-desc">Descrição (opcional)</Label>
              <Textarea
                id="funnel-desc"
                value={funnelDescription}
                onChange={(e) => setFunnelDescription(e.target.value)}
                placeholder="Descreva o objetivo deste funil..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsNameDialogOpen(false)}>
              Cancelar
            </Button>
            <Button variant="gradient" onClick={handleCreateFunnel}>
              Criar Funil
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TemplateSelection;
