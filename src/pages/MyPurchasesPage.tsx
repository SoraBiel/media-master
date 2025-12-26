import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  ShoppingBag, 
  Eye, 
  Calendar, 
  Users, 
  Bot, 
  MessageCircle,
  ExternalLink,
  Package
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Purchase {
  id: string;
  product_id: string;
  product_type: string;
  delivered_at: string | null;
  viewed_at: string | null;
  delivery_data: any;
  product_info?: any;
}

export default function MyPurchasesPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    if (user) {
      fetchPurchases();
    }
  }, [user]);

  const fetchPurchases = async () => {
    try {
      setLoading(true);
      
      // Fetch deliveries
      const { data: deliveries, error: deliveriesError } = await supabase
        .from('deliveries')
        .select('*')
        .eq('user_id', user?.id)
        .order('delivered_at', { ascending: false });

      if (deliveriesError) throw deliveriesError;

      // Enrich with product info
      const enrichedPurchases: Purchase[] = [];
      
      for (const delivery of deliveries || []) {
        let productInfo = null;
        
        if (delivery.product_type === 'tiktok_account') {
          const { data } = await supabase
            .from('tiktok_accounts')
            .select('*')
            .eq('id', delivery.product_id)
            .single();
          productInfo = data;
        } else if (delivery.product_type === 'model') {
          const { data } = await supabase
            .from('models_for_sale')
            .select('*')
            .eq('id', delivery.product_id)
            .single();
          productInfo = data;
        } else if (delivery.product_type === 'telegram_group') {
          const { data } = await supabase
            .from('telegram_groups')
            .select('*')
            .eq('id', delivery.product_id)
            .single();
          productInfo = data;
        }

        enrichedPurchases.push({
          ...delivery,
          product_info: productInfo
        });
      }

      setPurchases(enrichedPurchases);
    } catch (error) {
      console.error('Error fetching purchases:', error);
    } finally {
      setLoading(false);
    }
  };

  const getProductIcon = (type: string) => {
    switch (type) {
      case 'tiktok_account':
        return <Users className="h-5 w-5" />;
      case 'model':
        return <Bot className="h-5 w-5" />;
      case 'telegram_group':
        return <MessageCircle className="h-5 w-5" />;
      default:
        return <Package className="h-5 w-5" />;
    }
  };

  const getProductTypeName = (type: string) => {
    switch (type) {
      case 'tiktok_account':
        return 'Conta TikTok';
      case 'model':
        return 'Modelo IA';
      case 'telegram_group':
        return 'Grupo Telegram';
      default:
        return 'Produto';
    }
  };

  const getProductName = (purchase: Purchase) => {
    if (purchase.product_info) {
      if (purchase.product_type === 'tiktok_account') {
        return `@${purchase.product_info.username}`;
      } else if (purchase.product_type === 'model') {
        return purchase.product_info.name;
      } else if (purchase.product_type === 'telegram_group') {
        return purchase.product_info.group_name;
      }
    }
    return 'Produto';
  };

  const getProductDetails = (purchase: Purchase) => {
    if (purchase.product_info) {
      if (purchase.product_type === 'tiktok_account') {
        return `${purchase.product_info.followers?.toLocaleString() || 0} seguidores`;
      } else if (purchase.product_type === 'model') {
        return purchase.product_info.niche || 'IA';
      } else if (purchase.product_type === 'telegram_group') {
        return `${purchase.product_info.members_count?.toLocaleString() || 0} membros`;
      }
    }
    return '';
  };

  const filteredPurchases = purchases.filter(p => {
    if (activeTab === 'all') return true;
    return p.product_type === activeTab;
  });

  const counts = {
    all: purchases.length,
    tiktok_account: purchases.filter(p => p.product_type === 'tiktok_account').length,
    model: purchases.filter(p => p.product_type === 'model').length,
    telegram_group: purchases.filter(p => p.product_type === 'telegram_group').length,
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Minhas Compras</h1>
            <p className="text-muted-foreground mt-1">
              Todos os produtos que você adquiriu
            </p>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <ShoppingBag className="h-5 w-5" />
            <span>{purchases.length} {purchases.length === 1 ? 'compra' : 'compras'}</span>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="all" className="flex items-center gap-2">
              <Package className="h-4 w-4" />
              Todos ({counts.all})
            </TabsTrigger>
            <TabsTrigger value="tiktok_account" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              TikTok ({counts.tiktok_account})
            </TabsTrigger>
            <TabsTrigger value="model" className="flex items-center gap-2">
              <Bot className="h-4 w-4" />
              Modelos ({counts.model})
            </TabsTrigger>
            <TabsTrigger value="telegram_group" className="flex items-center gap-2">
              <MessageCircle className="h-4 w-4" />
              Grupos ({counts.telegram_group})
            </TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-6">
            {loading ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {[1, 2, 3].map(i => (
                  <Card key={i}>
                    <CardHeader>
                      <Skeleton className="h-6 w-32" />
                    </CardHeader>
                    <CardContent>
                      <Skeleton className="h-4 w-full mb-2" />
                      <Skeleton className="h-4 w-24" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : filteredPurchases.length === 0 ? (
              <Card className="p-12 text-center">
                <ShoppingBag className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Nenhuma compra encontrada</h3>
                <p className="text-muted-foreground mb-4">
                  {activeTab === 'all' 
                    ? 'Você ainda não realizou nenhuma compra.'
                    : `Você ainda não comprou nenhum ${getProductTypeName(activeTab).toLowerCase()}.`
                  }
                </p>
                <div className="flex gap-2 justify-center">
                  <Button variant="outline" onClick={() => navigate('/models')}>
                    Ver Modelos
                  </Button>
                  <Button variant="outline" onClick={() => navigate('/tiktok-accounts')}>
                    Ver Contas TikTok
                  </Button>
                  <Button variant="outline" onClick={() => navigate('/telegram-groups')}>
                    Ver Grupos
                  </Button>
                </div>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {filteredPurchases.map(purchase => (
                  <Card key={purchase.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <div className="flex items-center gap-2">
                        <div className="p-2 rounded-lg bg-primary/10 text-primary">
                          {getProductIcon(purchase.product_type)}
                        </div>
                        <div>
                          <CardTitle className="text-base">
                            {getProductName(purchase)}
                          </CardTitle>
                          <p className="text-sm text-muted-foreground">
                            {getProductDetails(purchase)}
                          </p>
                        </div>
                      </div>
                      <Badge variant="secondary">
                        {getProductTypeName(purchase.product_type)}
                      </Badge>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {purchase.product_info?.image_url && (
                        <div className="aspect-video rounded-lg overflow-hidden bg-muted">
                          <img 
                            src={purchase.product_info.image_url} 
                            alt={getProductName(purchase)}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                      
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        <span>
                          Adquirido em {purchase.delivered_at 
                            ? format(new Date(purchase.delivered_at), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })
                            : 'N/A'
                          }
                        </span>
                      </div>

                      <div className="flex gap-2">
                        <Button 
                          className="flex-1"
                          onClick={() => navigate(`/delivery/${purchase.id}`)}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          Ver Entrega
                        </Button>
                        {purchase.delivery_data?.invite_link && (
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => window.open(purchase.delivery_data.invite_link, '_blank')}
                          >
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
