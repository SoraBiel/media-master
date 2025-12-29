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
  Image,
  MessageSquare,
  Users,
  Timer,
  Video,
  Music,
  FileAudio,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
  const [sendingImageId, setSendingImageId] = useState<string | null>(null);
  const [sendingRemarketingId, setSendingRemarketingId] = useState<string | null>(null);
  const [sendingBulkRemarketing, setSendingBulkRemarketing] = useState(false);
  const [imageDialogOpen, setImageDialogOpen] = useState(false);
  const [mediaDialogOpen, setMediaDialogOpen] = useState(false);
  const [remarketingDialogOpen, setRemarketingDialogOpen] = useState(false);
  const [bulkRemarketingDialogOpen, setBulkRemarketingDialogOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<FunnelPayment | null>(null);
  const [imageUrl, setImageUrl] = useState('');
  const [imageCaption, setImageCaption] = useState('');
  const [mediaType, setMediaType] = useState<'image' | 'video' | 'audio'>('image');
  const [mediaUrl, setMediaUrl] = useState('');
  const [mediaCaption, setMediaCaption] = useState('');
  const [sendingMediaId, setSendingMediaId] = useState<string | null>(null);
  const [remarketingMessage, setRemarketingMessage] = useState('');
  const [bulkRemarketingMessage, setBulkRemarketingMessage] = useState('');
  const [bulkRemarketingType, setBulkRemarketingType] = useState<'paid' | 'unpaid'>('unpaid');
  const [bulkRemarketingMinutes, setBulkRemarketingMinutes] = useState(5);
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

  const getBotToken = async () => {
    const { data: funnel } = await supabase
      .from('funnels')
      .select('telegram_integration_id')
      .eq('id', funnelId)
      .single();

    if (!funnel?.telegram_integration_id) {
      throw new Error('Integração do Telegram não encontrada');
    }

    const { data: integration } = await supabase
      .from('telegram_integrations')
      .select('bot_token')
      .eq('id', funnel.telegram_integration_id)
      .single();

    if (!integration?.bot_token) {
      throw new Error('Token do bot não encontrado');
    }

    return integration.bot_token;
  };

  const handleSendImage = async () => {
    if (!selectedPayment?.lead_chat_id || !imageUrl) {
      toast({
        title: 'Erro',
        description: 'URL da imagem e Chat ID são obrigatórios',
        variant: 'destructive',
      });
      return;
    }

    setSendingImageId(selectedPayment.id);
    try {
      const botToken = await getBotToken();
      
      const response = await fetch(`https://api.telegram.org/bot${botToken}/sendPhoto`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: selectedPayment.lead_chat_id,
          photo: imageUrl,
          caption: imageCaption || undefined,
          parse_mode: 'HTML',
        }),
      });

      const result = await response.json();
      
      if (!result.ok) {
        throw new Error(result.description || 'Erro ao enviar imagem');
      }

      toast({
        title: 'Imagem enviada!',
        description: `Imagem enviada para ${selectedPayment.lead_name || selectedPayment.lead_chat_id}`,
      });

      setImageDialogOpen(false);
      setImageUrl('');
      setImageCaption('');
      setSelectedPayment(null);
    } catch (error: unknown) {
      console.error('Error sending image:', error);
      toast({
        title: 'Erro ao enviar imagem',
        description: error instanceof Error ? error.message : 'Erro desconhecido',
        variant: 'destructive',
      });
    } finally {
      setSendingImageId(null);
    }
  };

  const handleSendMedia = async () => {
    if (!selectedPayment?.lead_chat_id || !mediaUrl) {
      toast({
        title: 'Erro',
        description: 'URL da mídia e Chat ID são obrigatórios',
        variant: 'destructive',
      });
      return;
    }

    setSendingMediaId(selectedPayment.id);
    try {
      const botToken = await getBotToken();
      
      let endpoint = '';
      let bodyKey = '';
      
      switch (mediaType) {
        case 'image':
          endpoint = 'sendPhoto';
          bodyKey = 'photo';
          break;
        case 'video':
          endpoint = 'sendVideo';
          bodyKey = 'video';
          break;
        case 'audio':
          endpoint = 'sendAudio';
          bodyKey = 'audio';
          break;
      }
      
      const response = await fetch(`https://api.telegram.org/bot${botToken}/${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: selectedPayment.lead_chat_id,
          [bodyKey]: mediaUrl,
          caption: mediaCaption || undefined,
          parse_mode: 'HTML',
        }),
      });

      const result = await response.json();
      
      if (!result.ok) {
        throw new Error(result.description || 'Erro ao enviar mídia');
      }

      const mediaTypeLabel = mediaType === 'image' ? 'Imagem' : mediaType === 'video' ? 'Vídeo' : 'Áudio';
      toast({
        title: `${mediaTypeLabel} enviado!`,
        description: `${mediaTypeLabel} enviado para ${selectedPayment.lead_name || selectedPayment.lead_chat_id}`,
      });

      setMediaDialogOpen(false);
      setMediaUrl('');
      setMediaCaption('');
      setSelectedPayment(null);
    } catch (error: unknown) {
      console.error('Error sending media:', error);
      toast({
        title: 'Erro ao enviar mídia',
        description: error instanceof Error ? error.message : 'Erro desconhecido',
        variant: 'destructive',
      });
    } finally {
      setSendingMediaId(null);
    }
  };

  const handleSendRemarketing = async () => {
    if (!selectedPayment?.lead_chat_id || !remarketingMessage) {
      toast({
        title: 'Erro',
        description: 'Mensagem de remarketing é obrigatória',
        variant: 'destructive',
      });
      return;
    }

    setSendingRemarketingId(selectedPayment.id);
    try {
      const botToken = await getBotToken();
      
      const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: selectedPayment.lead_chat_id,
          text: remarketingMessage,
          parse_mode: 'HTML',
        }),
      });

      const result = await response.json();
      
      if (!result.ok) {
        throw new Error(result.description || 'Erro ao enviar mensagem');
      }

      // Update reminded_at
      await supabase
        .from('funnel_payments')
        .update({ reminded_at: new Date().toISOString() })
        .eq('id', selectedPayment.id);

      toast({
        title: 'Remarketing enviado!',
        description: `Mensagem enviada para ${selectedPayment.lead_name || selectedPayment.lead_chat_id}`,
      });

      setRemarketingDialogOpen(false);
      setRemarketingMessage('');
      setSelectedPayment(null);
      fetchPayments();
    } catch (error: unknown) {
      console.error('Error sending remarketing:', error);
      toast({
        title: 'Erro ao enviar remarketing',
        description: error instanceof Error ? error.message : 'Erro desconhecido',
        variant: 'destructive',
      });
    } finally {
      setSendingRemarketingId(null);
    }
  };

  const handleBulkRemarketing = async () => {
    if (!bulkRemarketingMessage) {
      toast({
        title: 'Erro',
        description: 'Mensagem de remarketing é obrigatória',
        variant: 'destructive',
      });
      return;
    }

    setSendingBulkRemarketing(true);
    try {
      const botToken = await getBotToken();
      
      // Filter payments based on type and time
      const now = new Date();
      const cutoffTime = new Date(now.getTime() - bulkRemarketingMinutes * 60 * 1000);
      
      let targetPayments: FunnelPayment[];
      if (bulkRemarketingType === 'unpaid') {
        targetPayments = payments.filter(p => 
          p.status !== 'paid' && 
          p.lead_chat_id && 
          new Date(p.created_at) <= cutoffTime
        );
      } else {
        targetPayments = payments.filter(p => 
          p.status === 'paid' && 
          p.lead_chat_id && 
          new Date(p.created_at) <= cutoffTime
        );
      }

      if (targetPayments.length === 0) {
        toast({
          title: 'Nenhum lead encontrado',
          description: `Não há leads ${bulkRemarketingType === 'paid' ? 'pagos' : 'não pagos'} com mais de ${bulkRemarketingMinutes} minutos`,
          variant: 'destructive',
        });
        setSendingBulkRemarketing(false);
        return;
      }

      let successCount = 0;
      let errorCount = 0;

      for (const payment of targetPayments) {
        try {
          const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              chat_id: payment.lead_chat_id,
              text: bulkRemarketingMessage,
              parse_mode: 'HTML',
            }),
          });

          const result = await response.json();
          
          if (result.ok) {
            successCount++;
            await supabase
              .from('funnel_payments')
              .update({ reminded_at: new Date().toISOString() })
              .eq('id', payment.id);
          } else {
            errorCount++;
          }
          
          // Small delay between messages
          await new Promise(resolve => setTimeout(resolve, 300));
        } catch {
          errorCount++;
        }
      }

      toast({
        title: 'Remarketing enviado!',
        description: `${successCount} mensagens enviadas${errorCount > 0 ? `, ${errorCount} erros` : ''}`,
      });

      setBulkRemarketingDialogOpen(false);
      setBulkRemarketingMessage('');
      fetchPayments();
    } catch (error: unknown) {
      console.error('Error sending bulk remarketing:', error);
      toast({
        title: 'Erro ao enviar remarketing',
        description: error instanceof Error ? error.message : 'Erro desconhecido',
        variant: 'destructive',
      });
    } finally {
      setSendingBulkRemarketing(false);
    }
  };

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
      const botToken = await getBotToken();

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

      const chatId = payment.lead_chat_id;

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
        const { data: pack } = await supabase
          .from('admin_media')
          .select('media_files')
          .eq('id', product.delivery_content)
          .single();

        if (pack?.media_files && Array.isArray(pack.media_files)) {
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
    } catch (error: unknown) {
      console.error('Error resending delivery:', error);
      toast({
        title: 'Erro ao reenviar',
        description: error instanceof Error ? error.message : 'Erro desconhecido',
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

  const paidPayments = payments.filter(p => p.status === 'paid');
  const unpaidPayments = payments.filter(p => p.status !== 'paid');
  const paidCount = paidPayments.length;
  const unpaidCount = unpaidPayments.length;
  const deliveredCount = payments.filter(p => p.delivery_status === 'delivered').length;
  const totalRevenue = paidPayments.reduce((sum, p) => sum + p.amount_cents, 0);

  const renderPaymentTable = (paymentsList: FunnelPayment[], isPaidTab: boolean) => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Lead</TableHead>
          <TableHead>Produto</TableHead>
          <TableHead>Valor</TableHead>
          <TableHead>Status</TableHead>
          {isPaidTab && <TableHead>Entrega</TableHead>}
          <TableHead>Data</TableHead>
          <TableHead className="w-[180px]">Ações</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {paymentsList.map((payment) => (
          <TableRow key={payment.id}>
            <TableCell className="font-medium">
              {payment.lead_name || payment.lead_chat_id || '-'}
            </TableCell>
            <TableCell className="text-sm">
              {payment.product?.name || '-'}
            </TableCell>
            <TableCell>{formatPrice(payment.amount_cents)}</TableCell>
            <TableCell>{getStatusBadge(payment.status)}</TableCell>
            {isPaidTab && (
              <TableCell>{getDeliveryBadge(payment.delivery_status, payment.status)}</TableCell>
            )}
            <TableCell className="text-xs text-muted-foreground">
              {formatDate(payment.created_at)}
            </TableCell>
            <TableCell>
              <div className="flex gap-1">
                {/* Botão de enviar mídia (imagem/vídeo/áudio) */}
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setSelectedPayment(payment);
                    setMediaType('image');
                    setMediaUrl('');
                    setMediaCaption('');
                    setMediaDialogOpen(true);
                  }}
                  title="Enviar Mídia"
                >
                  <Image className="h-4 w-4" />
                </Button>

                {/* Botão de remarketing - disponível em ambas as abas */}
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setSelectedPayment(payment);
                    setRemarketingMessage(
                      payment.status === 'paid'
                        ? '🎁 Oi! Temos uma oferta especial para você que já é nosso cliente!'
                        : '💰 Oi! Vi que você ainda não finalizou seu pagamento. Posso te ajudar com algo?'
                    );
                    setRemarketingDialogOpen(true);
                  }}
                  title="Enviar Remarketing"
                >
                  <MessageSquare className="h-4 w-4" />
                </Button>

                {/* Botão de reenviar entrega - apenas para pagos */}
                {isPaidTab && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={resendingId === payment.id}
                        title="Reenviar Entrega"
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
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );

  return (
    <div className="h-full flex flex-col bg-background">
      <div className="p-4 border-b flex items-center justify-between">
        <h2 className="font-semibold text-lg">Pagamentos</h2>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setBulkRemarketingDialogOpen(true)}
          >
            <Users className="h-4 w-4 mr-2" />
            Remarketing em Massa
          </Button>
          <Button variant="outline" size="sm" onClick={fetchPayments} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
        </div>
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
            <div className="text-xl font-bold text-amber-500">{unpaidCount}</div>
            <p className="text-xs text-muted-foreground">Não Pagos</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-3 pb-3">
            <div className="text-xl font-bold text-primary">{formatPrice(totalRevenue)}</div>
            <p className="text-xs text-muted-foreground">Receita</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="paid" className="flex-1 flex flex-col">
        <div className="px-4 pt-2">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="paid" className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              Pagos ({paidCount})
            </TabsTrigger>
            <TabsTrigger value="unpaid" className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Não Pagos ({unpaidCount})
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="paid" className="flex-1 mt-0">
          <ScrollArea className="h-full">
            {paidPayments.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <CheckCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Nenhum pagamento confirmado</p>
              </div>
            ) : (
              renderPaymentTable(paidPayments, true)
            )}
          </ScrollArea>
        </TabsContent>

        <TabsContent value="unpaid" className="flex-1 mt-0">
          <ScrollArea className="h-full">
            {unpaidPayments.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Nenhum pagamento pendente</p>
              </div>
            ) : (
              renderPaymentTable(unpaidPayments, false)
            )}
          </ScrollArea>
        </TabsContent>
      </Tabs>

      {/* Dialog para enviar mídia (imagem/vídeo/áudio) */}
      <Dialog open={mediaDialogOpen} onOpenChange={setMediaDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {mediaType === 'image' && <Image className="h-5 w-5" />}
              {mediaType === 'video' && <Video className="h-5 w-5" />}
              {mediaType === 'audio' && <FileAudio className="h-5 w-5" />}
              Enviar Mídia
            </DialogTitle>
            <DialogDescription>
              Envie mídia para {selectedPayment?.lead_name || selectedPayment?.lead_chat_id}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Tipo de Mídia</Label>
              <div className="flex gap-2 mt-2">
                <Button
                  size="sm"
                  variant={mediaType === 'image' ? 'default' : 'outline'}
                  onClick={() => setMediaType('image')}
                  className="flex-1"
                >
                  <Image className="h-4 w-4 mr-2" />
                  Imagem
                </Button>
                <Button
                  size="sm"
                  variant={mediaType === 'video' ? 'default' : 'outline'}
                  onClick={() => setMediaType('video')}
                  className="flex-1"
                >
                  <Video className="h-4 w-4 mr-2" />
                  Vídeo
                </Button>
                <Button
                  size="sm"
                  variant={mediaType === 'audio' ? 'default' : 'outline'}
                  onClick={() => setMediaType('audio')}
                  className="flex-1"
                >
                  <FileAudio className="h-4 w-4 mr-2" />
                  Áudio
                </Button>
              </div>
            </div>
            <div>
              <Label htmlFor="mediaUrl">
                URL {mediaType === 'image' ? 'da Imagem' : mediaType === 'video' ? 'do Vídeo' : 'do Áudio'}
              </Label>
              <Input
                id="mediaUrl"
                placeholder={
                  mediaType === 'image' 
                    ? 'https://exemplo.com/imagem.jpg'
                    : mediaType === 'video'
                    ? 'https://exemplo.com/video.mp4'
                    : 'https://exemplo.com/audio.mp3'
                }
                value={mediaUrl}
                onChange={(e) => setMediaUrl(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="mediaCaption">Legenda (opcional)</Label>
              <Textarea
                id="mediaCaption"
                placeholder="Digite uma legenda..."
                value={mediaCaption}
                onChange={(e) => setMediaCaption(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMediaDialogOpen(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleSendMedia} 
              disabled={!mediaUrl || sendingMediaId === selectedPayment?.id}
            >
              {sendingMediaId === selectedPayment?.id ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : mediaType === 'image' ? (
                <Image className="h-4 w-4 mr-2" />
              ) : mediaType === 'video' ? (
                <Video className="h-4 w-4 mr-2" />
              ) : (
                <FileAudio className="h-4 w-4 mr-2" />
              )}
              Enviar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog para remarketing */}
      <Dialog open={remarketingDialogOpen} onOpenChange={setRemarketingDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Enviar Remarketing</DialogTitle>
            <DialogDescription>
              Envie uma mensagem de remarketing para {selectedPayment?.lead_name || selectedPayment?.lead_chat_id}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="remarketingMessage">Mensagem</Label>
              <Textarea
                id="remarketingMessage"
                placeholder="Digite sua mensagem de remarketing..."
                value={remarketingMessage}
                onChange={(e) => setRemarketingMessage(e.target.value)}
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRemarketingDialogOpen(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleSendRemarketing} 
              disabled={!remarketingMessage || sendingRemarketingId === selectedPayment?.id}
            >
              {sendingRemarketingId === selectedPayment?.id ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <MessageSquare className="h-4 w-4 mr-2" />
              )}
              Enviar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog para remarketing em massa */}
      <Dialog open={bulkRemarketingDialogOpen} onOpenChange={setBulkRemarketingDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Remarketing em Massa
            </DialogTitle>
            <DialogDescription>
              Envie mensagens de remarketing para múltiplos leads de uma vez
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Tipo de Lead</Label>
              <Select value={bulkRemarketingType} onValueChange={(v) => setBulkRemarketingType(v as 'paid' | 'unpaid')}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unpaid">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-amber-500" />
                      Não Pagos ({unpaidCount})
                    </div>
                  </SelectItem>
                  <SelectItem value="paid">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      Pagos ({paidCount})
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="flex items-center gap-2">
                <Timer className="h-4 w-4" />
                Tempo mínimo (minutos)
              </Label>
              <p className="text-xs text-muted-foreground mb-2">
                Apenas leads criados há mais de X minutos receberão a mensagem
              </p>
              <Input
                type="number"
                min={1}
                max={1440}
                value={bulkRemarketingMinutes}
                onChange={(e) => setBulkRemarketingMinutes(parseInt(e.target.value) || 5)}
              />
            </div>
            <div>
              <Label htmlFor="bulkRemarketingMessage">Mensagem</Label>
              <Textarea
                id="bulkRemarketingMessage"
                placeholder={
                  bulkRemarketingType === 'unpaid' 
                    ? "💰 Oi! Vi que você ainda não finalizou seu pagamento..."
                    : "🎁 Oi! Temos uma oferta especial para você..."
                }
                value={bulkRemarketingMessage}
                onChange={(e) => setBulkRemarketingMessage(e.target.value)}
                rows={4}
              />
            </div>
            <div className="bg-muted p-3 rounded-lg text-sm">
              <p className="font-medium mb-1">Resumo:</p>
              <p className="text-muted-foreground">
                {bulkRemarketingType === 'unpaid' 
                  ? `Enviará para leads NÃO PAGOS criados há mais de ${bulkRemarketingMinutes} minutos`
                  : `Enviará para leads PAGOS criados há mais de ${bulkRemarketingMinutes} minutos`
                }
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBulkRemarketingDialogOpen(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleBulkRemarketing} 
              disabled={!bulkRemarketingMessage || sendingBulkRemarketing}
            >
              {sendingBulkRemarketing ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Send className="h-4 w-4 mr-2" />
              )}
              Enviar Remarketing
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};