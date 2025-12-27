import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  RefreshCw, 
  Send,
  CheckCircle, 
  Clock,
  XCircle,
  Package,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface FunnelPayment {
  id: string;
  lead_name: string | null;
  lead_chat_id: string | null;
  status: string;
  amount_cents: number;
  product_id: string | null;
  delivery_status: string | null;
  created_at: string;
  paid_at: string | null;
  delivered_at: string | null;
  product?: {
    name: string;
    delivery_type: string;
  } | null;
}

interface FunnelPaymentsPanelProps {
  funnelId: string;
}

export const FunnelPaymentsPanel = ({ funnelId }: FunnelPaymentsPanelProps) => {
  const [payments, setPayments] = useState<FunnelPayment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [resendingId, setResendingId] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchPayments = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('funnel_payments')
        .select(`
          id,
          lead_name,
          lead_chat_id,
          status,
          amount_cents,
          product_id,
          delivery_status,
          created_at,
          paid_at,
          delivered_at,
          funnel_products!funnel_payments_product_id_fkey (
            name,
            delivery_type
          )
        `)
        .eq('funnel_id', funnelId)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;

      const formattedPayments = (data || []).map(payment => ({
        ...payment,
        product: payment.funnel_products as FunnelPayment['product'],
      }));

      setPayments(formattedPayments);
    } catch (error) {
      console.error('Error fetching payments:', error);
      toast({
        title: 'Erro ao carregar pagamentos',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();

    // Subscribe to realtime updates
    const channel = supabase
      .channel(`funnel-payments-${funnelId}`)
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'funnel_payments',
        filter: `funnel_id=eq.${funnelId}`
      }, () => fetchPayments())
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [funnelId]);

  const handleResendDelivery = async (payment: FunnelPayment) => {
    if (!payment.lead_chat_id) {
      toast({
        title: 'Erro',
        description: 'Chat ID do lead não encontrado',
        variant: 'destructive',
      });
      return;
    }

    setResendingId(payment.id);
    try {
      // Get the funnel's telegram integration
      const { data: funnel } = await supabase
        .from('funnels')
        .select('telegram_integration_id')
        .eq('id', funnelId)
        .single();

      if (!funnel?.telegram_integration_id) {
        throw new Error('Integração do Telegram não encontrada');
      }

      // Get the bot token
      const { data: integration } = await supabase
        .from('telegram_integrations')
        .select('bot_token')
        .eq('id', funnel.telegram_integration_id)
        .single();

      if (!integration?.bot_token) {
        throw new Error('Token do bot não encontrado');
      }

      // Get product details
      if (!payment.product_id) {
        throw new Error('Produto não encontrado');
      }

      const { data: product } = await supabase
        .from('funnel_products')
        .select('*')
        .eq('id', payment.product_id)
        .single();

      if (!product) {
        throw new Error('Produto não encontrado');
      }

      const botToken = integration.bot_token;
      const chatId = payment.lead_chat_id;

      // Send delivery based on type
      if (product.delivery_type === 'link') {
        const message = product.delivery_message || '🎁 Aqui está sua entrega!';
        const fullMessage = `${message}\n\n🔗 ${product.delivery_content}`;
        
        await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: chatId,
            text: fullMessage,
            parse_mode: 'HTML',
          }),
        });
      } else if (product.delivery_type === 'message') {
        const message = product.delivery_content || product.delivery_message || '🎁 Entrega realizada!';
        
        await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: chatId,
            text: message,
            parse_mode: 'HTML',
          }),
        });
      } else if (product.delivery_type === 'pack') {
        // Get pack files
        const { data: pack } = await supabase
          .from('admin_media')
          .select('media_files')
          .eq('id', product.delivery_content)
          .single();

        if (pack?.media_files && Array.isArray(pack.media_files)) {
          // Send delivery message first
          if (product.delivery_message) {
            await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                chat_id: chatId,
                text: product.delivery_message,
                parse_mode: 'HTML',
              }),
            });
          }

          // Send files with rate limiting
          for (const file of pack.media_files as Array<{ url: string; type: string }>) {
            const fileUrl = file.url;
            const fileType = file.type || 'document';

            try {
              if (fileType.startsWith('image')) {
                await fetch(`https://api.telegram.org/bot${botToken}/sendPhoto`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ chat_id: chatId, photo: fileUrl }),
                });
              } else if (fileType.startsWith('video')) {
                await fetch(`https://api.telegram.org/bot${botToken}/sendVideo`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ chat_id: chatId, video: fileUrl }),
                });
              } else {
                await fetch(`https://api.telegram.org/bot${botToken}/sendDocument`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ chat_id: chatId, document: fileUrl }),
                });
              }
              // Rate limiting
              await new Promise(resolve => setTimeout(resolve, 500));
            } catch (err) {
              console.error('Error sending file:', err);
            }
          }
        }
      } else if (product.delivery_type === 'group') {
        if (product.group_invite_link) {
          const message = product.delivery_message || '🎁 Aqui está seu acesso ao grupo exclusivo!';
          const fullMessage = `${message}\n\n🔗 ${product.group_invite_link}`;
          
          await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              chat_id: chatId,
              text: fullMessage,
              parse_mode: 'HTML',
            }),
          });
        }
      }

      // Update delivery status
      await supabase
        .from('funnel_payments')
        .update({
          delivery_status: 'delivered',
          delivered_at: new Date().toISOString(),
        })
        .eq('id', payment.id);

      toast({
        title: 'Entrega reenviada!',
        description: 'A entrega foi reenviada com sucesso',
      });

      fetchPayments();
    } catch (error: any) {
      console.error('Error resending delivery:', error);
      toast({
        title: 'Erro ao reenviar',
        description: error.message || 'Erro desconhecido',
        variant: 'destructive',
      });
    } finally {
      setResendingId(null);
    }
  };

  const formatPrice = (cents: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(cents / 100);
  };

  const formatDate = (date: string | null) => {
    if (!date) return '-';
    return format(new Date(date), "dd/MM/yy HH:mm", { locale: ptBR });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <Badge className="bg-green-500"><CheckCircle className="h-3 w-3 mr-1" />Pago</Badge>;
      case 'pending':
        return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />Pendente</Badge>;
      case 'expired':
        return <Badge variant="outline"><XCircle className="h-3 w-3 mr-1" />Expirado</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getDeliveryBadge = (status: string | null, paymentStatus: string) => {
    if (paymentStatus !== 'paid') {
      return <Badge variant="outline" className="text-muted-foreground">-</Badge>;
    }
    switch (status) {
      case 'delivered':
        return <Badge className="bg-teal-500"><Package className="h-3 w-3 mr-1" />Entregue</Badge>;
      case 'pending':
        return <Badge variant="secondary"><AlertCircle className="h-3 w-3 mr-1" />Pendente</Badge>;
      default:
        return <Badge variant="secondary"><AlertCircle className="h-3 w-3 mr-1" />Pendente</Badge>;
    }
  };

  const paidCount = payments.filter(p => p.status === 'paid').length;
  const pendingCount = payments.filter(p => p.status === 'pending').length;
  const deliveredCount = payments.filter(p => p.delivery_status === 'delivered').length;
  const totalRevenue = payments.filter(p => p.status === 'paid').reduce((sum, p) => sum + p.amount_cents, 0);

  return (
    <div className="h-full flex flex-col bg-background">
      <div className="p-4 border-b flex items-center justify-between">
        <h2 className="font-semibold text-lg">Pagamentos</h2>
        <Button variant="outline" size="sm" onClick={fetchPayments} disabled={isLoading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Atualizar
        </Button>
      </div>

      <div className="grid grid-cols-4 gap-3 p-4 border-b">
        <Card>
          <CardContent className="pt-3 pb-3">
            <div className="text-xl font-bold">{payments.length}</div>
            <p className="text-xs text-muted-foreground">Total</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-3 pb-3">
            <div className="text-xl font-bold text-green-500">{paidCount}</div>
            <p className="text-xs text-muted-foreground">Pagos</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-3 pb-3">
            <div className="text-xl font-bold text-teal-500">{deliveredCount}</div>
            <p className="text-xs text-muted-foreground">Entregues</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-3 pb-3">
            <div className="text-xl font-bold text-primary">{formatPrice(totalRevenue)}</div>
            <p className="text-xs text-muted-foreground">Receita</p>
          </CardContent>
        </Card>
      </div>

      <ScrollArea className="flex-1">
        {payments.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Nenhum pagamento encontrado</p>
            <p className="text-sm">Os pagamentos aparecerão aqui quando leads gerarem PIX</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Lead</TableHead>
                <TableHead>Produto</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Entrega</TableHead>
                <TableHead>Data</TableHead>
                <TableHead className="w-[100px]">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payments.map((payment) => (
                <TableRow key={payment.id}>
                  <TableCell className="font-medium">
                    {payment.lead_name || payment.lead_chat_id || '-'}
                  </TableCell>
                  <TableCell className="text-sm">
                    {payment.product?.name || '-'}
                  </TableCell>
                  <TableCell>{formatPrice(payment.amount_cents)}</TableCell>
                  <TableCell>{getStatusBadge(payment.status)}</TableCell>
                  <TableCell>{getDeliveryBadge(payment.delivery_status, payment.status)}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {formatDate(payment.created_at)}
                  </TableCell>
                  <TableCell>
                    {payment.status === 'paid' && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={resendingId === payment.id}
                          >
                            {resendingId === payment.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Send className="h-4 w-4" />
                            )}
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Reenviar Entrega</AlertDialogTitle>
                            <AlertDialogDescription>
                              Isso irá reenviar a entrega para o lead "{payment.lead_name || payment.lead_chat_id}".
                              {payment.delivery_status === 'delivered' && (
                                <span className="block mt-2 text-amber-500">
                                  ⚠️ A entrega já foi realizada anteriormente.
                                </span>
                              )}
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleResendDelivery(payment)}>
                              Reenviar
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </ScrollArea>
    </div>
  );
};
