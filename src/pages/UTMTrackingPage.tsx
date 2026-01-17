import { useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { useUTMPixel, useUTMEvents, useUTMifyIntegration, UTMEvent } from "@/hooks/useUTMTracking";
import { Code, Copy, BarChart3, Activity, Zap, Globe, Smartphone, CheckCircle2, XCircle, Settings, ExternalLink, Eye, DollarSign, TrendingUp } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { DateRangePicker } from "@/components/DateRangePicker";
import { subDays } from "date-fns";

const UTMTrackingPage = () => {
  const { pixel, isLoading: isLoadingPixel, createPixel, togglePixel } = useUTMPixel();
  const { toast } = useToast();
  
  const [dateRange, setDateRange] = useState({
    from: subDays(new Date(), 30),
    to: new Date(),
  });
  
  const { events, stats, isLoading: isLoadingEvents } = useUTMEvents(dateRange);
  const { integration: utmifyIntegration, isLoading: isLoadingUtmify, isTesting, saveToken, testToken, toggleTracking } = useUTMifyIntegration();
  
  const [utmifyToken, setUtmifyToken] = useState("");
  const [showPixelCode, setShowPixelCode] = useState(false);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copiado!",
      description: `${label} copiado para a área de transferência.`,
    });
  };

  const getPixelScript = () => {
    if (!pixel) return "";
    return `<!-- Nexo UTM Pixel -->
<script>
(function(n,e,x,o){
  n.NexoPixelId='${pixel.pixel_id}';
  var s=e.createElement('script');
  s.async=1;s.src='${window.location.origin}/pixel.js';
  e.head.appendChild(s);
})(window,document);
</script>
<!-- End Nexo UTM Pixel -->`;
  };

  const handleSaveUtmifyToken = async () => {
    if (!utmifyToken.trim()) {
      toast({
        title: "Token vazio",
        description: "Digite seu token da UTMify.",
        variant: "destructive",
      });
      return;
    }
    await saveToken(utmifyToken);
    setUtmifyToken("");
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold">UTM Tracking</h1>
            <p className="text-muted-foreground">Rastreie a origem dos seus clientes e conversões</p>
          </div>
          <DateRangePicker
            dateRange={dateRange}
            onDateRangeChange={(range) => {
              if (range?.from && range?.to) {
                setDateRange({ from: range.from, to: range.to });
              }
            }}
          />
        </div>

        <Tabs defaultValue="dashboard">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="dashboard">
              <BarChart3 className="w-4 h-4 mr-2" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="pixel">
              <Code className="w-4 h-4 mr-2" />
              Pixel
            </TabsTrigger>
            <TabsTrigger value="utmify">
              <Zap className="w-4 h-4 mr-2" />
              UTMify
            </TabsTrigger>
            <TabsTrigger value="events">
              <Activity className="w-4 h-4 mr-2" />
              Eventos
            </TabsTrigger>
          </TabsList>

          {/* Dashboard Tab */}
          <TabsContent value="dashboard" className="space-y-4">
            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Eye className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{isLoadingEvents ? "-" : stats?.pageViews || 0}</p>
                      <p className="text-xs text-muted-foreground">Visualizações</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-success/10">
                      <DollarSign className="w-5 h-5 text-success" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{isLoadingEvents ? "-" : stats?.conversions || 0}</p>
                      <p className="text-xs text-muted-foreground">Conversões</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-blue-500/10">
                      <Activity className="w-5 h-5 text-blue-500" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{isLoadingEvents ? "-" : stats?.totalEvents || 0}</p>
                      <p className="text-xs text-muted-foreground">Total Eventos</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-purple-500/10">
                      <TrendingUp className="w-5 h-5 text-purple-500" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">
                        {isLoadingEvents || !stats?.pageViews ? "-" : 
                          `${((stats.conversions / stats.pageViews) * 100).toFixed(1)}%`}
                      </p>
                      <p className="text-xs text-muted-foreground">Taxa Conv.</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Analytics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <UTMAnalyticsCard
                title="Por Fonte (utm_source)"
                data={stats?.bySource || {}}
                isLoading={isLoadingEvents}
                icon={<Globe className="w-4 h-4" />}
              />
              <UTMAnalyticsCard
                title="Por Mídia (utm_medium)"
                data={stats?.byMedium || {}}
                isLoading={isLoadingEvents}
                icon={<Activity className="w-4 h-4" />}
              />
              <UTMAnalyticsCard
                title="Por Campanha"
                data={stats?.byCampaign || {}}
                isLoading={isLoadingEvents}
                icon={<BarChart3 className="w-4 h-4" />}
              />
              <UTMAnalyticsCard
                title="Por Dispositivo"
                data={stats?.byDevice || {}}
                isLoading={isLoadingEvents}
                icon={<Smartphone className="w-4 h-4" />}
              />
              <UTMAnalyticsCard
                title="Por País"
                data={stats?.byCountry || {}}
                isLoading={isLoadingEvents}
                icon={<Globe className="w-4 h-4" />}
              />
            </div>
          </TabsContent>

          {/* Pixel Tab */}
          <TabsContent value="pixel" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Code className="w-5 h-5" />
                  Seu Pixel de Rastreamento
                </CardTitle>
                <CardDescription>
                  Instale este código em suas páginas externas para rastrear visitantes e conversões
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {isLoadingPixel ? (
                  <Skeleton className="h-32 w-full" />
                ) : !pixel ? (
                  <div className="text-center py-8">
                    <Code className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium mb-2">Nenhum pixel criado</h3>
                    <p className="text-muted-foreground mb-4">
                      Crie seu pixel para começar a rastrear visitantes
                    </p>
                    <Button onClick={createPixel}>
                      Criar Meu Pixel
                    </Button>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                      <div>
                        <p className="text-sm text-muted-foreground">ID do Pixel</p>
                        <p className="font-mono text-lg font-bold">{pixel.pixel_id}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={pixel.is_active ? "default" : "secondary"}>
                          {pixel.is_active ? "Ativo" : "Inativo"}
                        </Badge>
                        <Switch
                          checked={pixel.is_active}
                          onCheckedChange={togglePixel}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label>Código do Pixel</Label>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowPixelCode(!showPixelCode)}
                        >
                          {showPixelCode ? "Ocultar" : "Mostrar"} Código
                        </Button>
                      </div>
                      
                      {showPixelCode && (
                        <div className="relative">
                          <pre className="bg-muted p-4 rounded-lg text-xs overflow-x-auto">
                            {getPixelScript()}
                          </pre>
                          <Button
                            variant="outline"
                            size="sm"
                            className="absolute top-2 right-2"
                            onClick={() => copyToClipboard(getPixelScript(), "Código do pixel")}
                          >
                            <Copy className="w-4 h-4 mr-1" />
                            Copiar
                          </Button>
                        </div>
                      )}
                    </div>

                    <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                      <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
                        Como instalar
                      </h4>
                      <ol className="text-sm text-blue-800 dark:text-blue-200 space-y-1 list-decimal list-inside">
                        <li>Copie o código do pixel acima</li>
                        <li>Cole dentro da tag <code className="bg-blue-100 dark:bg-blue-900 px-1 rounded">&lt;head&gt;</code> do seu site</li>
                        <li>O pixel irá rastrear automaticamente visualizações e UTMs</li>
                        <li>Para conversões, dispare o evento: <code className="bg-blue-100 dark:bg-blue-900 px-1 rounded">NexoPixel.track('conversion')</code></li>
                      </ol>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* UTMify Tab */}
          <TabsContent value="utmify" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="w-5 h-5" />
                  Integração UTMify
                </CardTitle>
                <CardDescription>
                  Envie automaticamente seus eventos de pagamento para a UTMify
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {isLoadingUtmify ? (
                  <Skeleton className="h-32 w-full" />
                ) : (
                  <>
                    {utmifyIntegration ? (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                          <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-success/10">
                              <CheckCircle2 className="w-5 h-5 text-success" />
                            </div>
                            <div>
                              <p className="font-medium">UTMify Conectado</p>
                              <p className="text-sm text-muted-foreground">
                                Token configurado • {utmifyIntegration.tracking_enabled ? "Rastreamento ativo" : "Rastreamento pausado"}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={utmifyIntegration.tracking_enabled}
                              onCheckedChange={toggleTracking}
                            />
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={testToken}
                              disabled={isTesting}
                            >
                              {isTesting ? "Testando..." : "Testar"}
                            </Button>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label>Atualizar Token (opcional)</Label>
                          <div className="flex gap-2">
                            <Input
                              type="password"
                              placeholder="Novo token UTMify"
                              value={utmifyToken}
                              onChange={(e) => setUtmifyToken(e.target.value)}
                            />
                            <Button onClick={handleSaveUtmifyToken}>
                              Salvar
                            </Button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="flex items-center gap-3 p-4 bg-muted rounded-lg">
                          <div className="p-2 rounded-lg bg-muted-foreground/10">
                            <XCircle className="w-5 h-5 text-muted-foreground" />
                          </div>
                          <div>
                            <p className="font-medium">UTMify não conectado</p>
                            <p className="text-sm text-muted-foreground">
                              Configure seu token para enviar eventos automaticamente
                            </p>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label>Token da API UTMify</Label>
                          <div className="flex gap-2">
                            <Input
                              type="password"
                              placeholder="Cole seu token UTMify aqui"
                              value={utmifyToken}
                              onChange={(e) => setUtmifyToken(e.target.value)}
                            />
                            <Button onClick={handleSaveUtmifyToken}>
                              Conectar
                            </Button>
                          </div>
                        </div>

                        <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
                          <h4 className="font-medium text-amber-900 dark:text-amber-100 mb-2">
                            Como obter seu token
                          </h4>
                          <ol className="text-sm text-amber-800 dark:text-amber-200 space-y-1 list-decimal list-inside">
                            <li>Acesse sua conta na UTMify</li>
                            <li>Vá em Configurações → API</li>
                            <li>Copie o token de API</li>
                            <li>Cole aqui e clique em Conectar</li>
                          </ol>
                          <Button
                            variant="link"
                            size="sm"
                            className="mt-2 p-0 h-auto text-amber-700 dark:text-amber-300"
                            asChild
                          >
                            <a href="https://utmify.com.br" target="_blank" rel="noopener noreferrer">
                              Acessar UTMify <ExternalLink className="w-3 h-3 ml-1" />
                            </a>
                          </Button>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Settings className="w-4 h-4" />
                  Eventos Enviados Automaticamente
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-success" />
                    <span>Pagamento PIX gerado</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-success" />
                    <span>Pagamento aprovado</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-success" />
                    <span>Pagamento recusado/cancelado</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-success" />
                    <span>Reembolso processado</span>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-4">
                  Os eventos são enviados automaticamente quando ocorrem nos seus funis de venda.
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Events Tab */}
          <TabsContent value="events" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Eventos Recentes</CardTitle>
                <CardDescription>Últimos eventos rastreados pelo seu pixel</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingEvents ? (
                  <div className="space-y-3">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <Skeleton key={i} className="h-12 w-full" />
                    ))}
                  </div>
                ) : events.length === 0 ? (
                  <div className="text-center py-12">
                    <Activity className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium">Nenhum evento registrado</h3>
                    <p className="text-muted-foreground">
                      Instale o pixel e comece a rastrear visitantes
                    </p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Data</TableHead>
                        <TableHead>Evento</TableHead>
                        <TableHead>Fonte</TableHead>
                        <TableHead>Mídia</TableHead>
                        <TableHead>Campanha</TableHead>
                        <TableHead>Dispositivo</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {events.slice(0, 50).map((event) => (
                        <TableRow key={event.id}>
                          <TableCell className="text-sm">
                            {format(new Date(event.created_at), "dd/MM HH:mm", { locale: ptBR })}
                          </TableCell>
                          <TableCell>
                            <Badge variant={event.event_type === "conversion" ? "default" : "secondary"}>
                              {event.event_type}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm">{event.utm_source || "-"}</TableCell>
                          <TableCell className="text-sm">{event.utm_medium || "-"}</TableCell>
                          <TableCell className="text-sm max-w-[150px] truncate">{event.utm_campaign || "-"}</TableCell>
                          <TableCell className="text-sm">{event.device_type || "-"}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

const UTMAnalyticsCard = ({ 
  title, 
  data, 
  isLoading, 
  icon 
}: { 
  title: string; 
  data: Record<string, number>; 
  isLoading: boolean;
  icon: React.ReactNode;
}) => {
  const sortedData = Object.entries(data)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-32" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-24 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          {icon}
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {sortedData.length === 0 ? (
          <p className="text-muted-foreground text-sm py-4 text-center">Nenhum dado</p>
        ) : (
          <div className="space-y-2">
            {sortedData.map(([key, count]) => {
              const total = Object.values(data).reduce((a, b) => a + b, 0);
              const percentage = total > 0 ? (count / total) * 100 : 0;
              
              return (
                <div key={key} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="truncate max-w-[120px]">{key}</span>
                    <span className="text-muted-foreground">{count} ({percentage.toFixed(0)}%)</span>
                  </div>
                  <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-primary rounded-full transition-all" 
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default UTMTrackingPage;
