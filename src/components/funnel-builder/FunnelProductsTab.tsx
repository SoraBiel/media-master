import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useMercadoPagoIntegration } from "@/hooks/useMercadoPagoIntegration";
import { Loader2, Plus, Trash2, Package, Link2, AlertCircle, ExternalLink, QrCode, Copy, Check, Users } from "lucide-react";
import { Link } from "react-router-dom";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

interface FunnelProduct {
  id: string;
  funnel_id: string;
  user_id: string;
  name: string;
  description: string | null;
  price_cents: number;
  currency: string;
  product_type: string;
  payment_method: string;
  delivery_type: string;
  delivery_content: string | null;
  delivery_message: string | null;
  group_chat_id: string | null;
  group_invite_link: string | null;
  is_active: boolean;
  created_at: string;
}

interface FunnelProductsTabProps {
  funnelId: string;
}

const FunnelProductsTab = ({ funnelId }: FunnelProductsTabProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { isConnected, isLoading: isLoadingIntegration } = useMercadoPagoIntegration();
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    product_type: 'digital',
    delivery_type: 'link',
    delivery_content: '',
    delivery_message: '',
    group_chat_id: '',
    group_invite_link: ''
  });

  // Fetch products for this funnel
  const { data: products, isLoading: isLoadingProducts } = useQuery({
    queryKey: ['funnel-products', funnelId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('funnel_products')
        .select('*')
        .eq('funnel_id', funnelId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as FunnelProduct[];
    },
    enabled: !!funnelId
  });

  // Create product
  const createMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error("Usuário não autenticado");
      
      const priceCents = Math.round(parseFloat(formData.price.replace(',', '.')) * 100);
      
      if (isNaN(priceCents) || priceCents <= 0) {
        throw new Error("Preço inválido");
      }

      const { data, error } = await supabase
        .from('funnel_products')
        .insert({
          funnel_id: funnelId,
          user_id: user.id,
          name: formData.name,
          description: formData.description || null,
          price_cents: priceCents,
          product_type: formData.product_type,
          delivery_type: formData.delivery_type,
          delivery_content: formData.delivery_content || null,
          delivery_message: formData.delivery_message || null,
          group_chat_id: formData.delivery_type === 'group' ? formData.group_chat_id || null : null,
          group_invite_link: formData.delivery_type === 'group' ? formData.group_invite_link || null : null
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['funnel-products', funnelId] });
      setIsDialogOpen(false);
      setFormData({
        name: '',
        description: '',
        price: '',
        product_type: 'digital',
        delivery_type: 'link',
        delivery_content: '',
        delivery_message: '',
        group_chat_id: '',
        group_invite_link: ''
      });
      toast({
        title: "Produto criado",
        description: "O produto foi criado com sucesso"
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao criar produto",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Delete product
  const deleteMutation = useMutation({
    mutationFn: async (productId: string) => {
      const { error } = await supabase
        .from('funnel_products')
        .delete()
        .eq('id', productId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['funnel-products', funnelId] });
      toast({
        title: "Produto excluído",
        description: "O produto foi removido com sucesso"
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao excluir",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const formatPrice = (cents: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(cents / 100);
  };

  if (isLoadingIntegration) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Show warning if Mercado Pago is not connected
  if (!isConnected) {
    return (
      <Card className="border-warning/50 bg-warning/5">
        <CardContent className="py-8">
          <div className="flex flex-col items-center text-center space-y-4">
            <div className="w-16 h-16 bg-warning/20 rounded-full flex items-center justify-center">
              <AlertCircle className="w-8 h-8 text-warning" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">Mercado Pago não conectado</h3>
              <p className="text-muted-foreground mt-1">
                Para criar produtos e receber pagamentos, você precisa conectar sua conta do Mercado Pago.
              </p>
            </div>
            <Button asChild>
              <Link to="/integrations">
                <Link2 className="w-4 h-4 mr-2" />
                Ir para Integrações
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Produtos do Funil</h2>
          <p className="text-sm text-muted-foreground">
            Configure os produtos que serão vendidos neste funil
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Novo Produto
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Criar Produto</DialogTitle>
              <DialogDescription>
                Configure as informações do produto e entrega
              </DialogDescription>
            </DialogHeader>
            
            <form 
              className="space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                createMutation.mutate();
              }}
            >
              <div className="space-y-2">
                <Label>Nome do Produto</Label>
                <Input 
                  placeholder="Ex: Curso Completo de Marketing"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>Descrição (opcional)</Label>
                <Textarea 
                  placeholder="Descreva seu produto..."
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Valor (R$)</Label>
                  <Input 
                    placeholder="99,90"
                    value={formData.price}
                    onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label>Tipo</Label>
                  <Select 
                    value={formData.product_type}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, product_type: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="digital">Produto Digital</SelectItem>
                      <SelectItem value="service">Serviço</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Tipo de Entrega</Label>
                <Select 
                  value={formData.delivery_type}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, delivery_type: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="link">Enviar Link</SelectItem>
                    <SelectItem value="message">Mensagem Personalizada</SelectItem>
                    <SelectItem value="both">Link + Mensagem</SelectItem>
                    <SelectItem value="group">Acesso a Grupo (Telegram)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {(formData.delivery_type === 'link' || formData.delivery_type === 'both') && (
                <div className="space-y-2">
                  <Label>Link de Entrega</Label>
                  <Input 
                    placeholder="https://..."
                    value={formData.delivery_content}
                    onChange={(e) => setFormData(prev => ({ ...prev, delivery_content: e.target.value }))}
                  />
                </div>
              )}

              {(formData.delivery_type === 'message' || formData.delivery_type === 'both') && (
                <div className="space-y-2">
                  <Label>Mensagem de Entrega</Label>
                  <Textarea 
                    placeholder="Obrigado pela compra! Aqui está seu acesso..."
                    value={formData.delivery_message}
                    onChange={(e) => setFormData(prev => ({ ...prev, delivery_message: e.target.value }))}
                    rows={3}
                  />
                </div>
              )}

              {formData.delivery_type === 'group' && (
                <div className="space-y-4 p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Users className="w-4 h-4" />
                    <span>Configuração do Grupo</span>
                  </div>
                  <div className="space-y-2">
                    <Label>ID do Grupo/Canal</Label>
                    <Input 
                      placeholder="-1001234567890"
                      value={formData.group_chat_id}
                      onChange={(e) => setFormData(prev => ({ ...prev, group_chat_id: e.target.value }))}
                    />
                    <p className="text-xs text-muted-foreground">
                      O ID do grupo deve começar com -100. O bot precisa ser admin do grupo.
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label>Link de Convite (opcional)</Label>
                    <Input 
                      placeholder="https://t.me/+AbCdEfGhIjK"
                      value={formData.group_invite_link}
                      onChange={(e) => setFormData(prev => ({ ...prev, group_invite_link: e.target.value }))}
                    />
                    <p className="text-xs text-muted-foreground">
                      Se fornecido, o link será enviado ao cliente após aprovação.
                    </p>
                  </div>
                </div>
              )}

              <Button 
                type="submit" 
                className="w-full"
                disabled={createMutation.isPending}
              >
                {createMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <Plus className="w-4 h-4 mr-2" />
                )}
                Criar Produto
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Products List */}
      {isLoadingProducts ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : products && products.length > 0 ? (
        <div className="grid gap-4">
          {products.map((product) => (
            <Card key={product.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                      <Package className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-medium">{product.name}</h3>
                      {product.description && (
                        <p className="text-sm text-muted-foreground line-clamp-1">
                          {product.description}
                        </p>
                      )}
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant="secondary">
                          {product.product_type === 'digital' ? 'Digital' : 'Serviço'}
                        </Badge>
                        <Badge variant="outline">
                          {product.delivery_type === 'link' ? 'Link' : 
                           product.delivery_type === 'message' ? 'Mensagem' : 
                           product.delivery_type === 'group' ? 'Grupo' : 'Link + Mensagem'}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-lg font-bold text-success">
                      {formatPrice(product.price_cents)}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:text-destructive"
                      onClick={() => deleteMutation.mutate(product.id)}
                      disabled={deleteMutation.isPending}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="border-dashed">
          <CardContent className="py-8">
            <div className="flex flex-col items-center text-center space-y-3">
              <Package className="w-12 h-12 text-muted-foreground" />
              <div>
                <h3 className="font-medium">Nenhum produto criado</h3>
                <p className="text-sm text-muted-foreground">
                  Crie seu primeiro produto para começar a vender
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default FunnelProductsTab;
