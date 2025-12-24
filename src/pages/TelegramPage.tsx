import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Bot,
  Key,
  CheckCircle2,
  AlertCircle,
  Trash2,
  RefreshCw,
  Shield,
  Eye,
  EyeOff,
  Send,
  MessageSquare,
  Users,
  Lock,
  Plus,
} from "lucide-react";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useMultipleTelegramBots, TelegramBot, TelegramChat, BotHealthStatus } from "@/hooks/useMultipleTelegramBots";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

interface Plan {
  id: string;
  slug: string;
  name: string;
  max_destinations: number;
}

const TelegramPage = () => {
  const [showToken, setShowToken] = useState(false);
  const [botToken, setBotToken] = useState("");
  const [currentPlan, setCurrentPlan] = useState<Plan | null>(null);
  const [selectedBotId, setSelectedBotId] = useState<string | null>(null);
  const [availableChats, setAvailableChats] = useState<TelegramChat[]>([]);
  const [isLoadingChats, setIsLoadingChats] = useState(false);
  const [messageText, setMessageText] = useState("");
  const [isSending, setIsSending] = useState(false);

  const { user } = useAuth();

  const {
    bots,
    isLoading,
    isValidating,
    addBot,
    removeBot,
    fetchChatsForBot,
    selectChatForBot,
    sendMessage,
    connectedBotsCount,
    botHealthStatuses,
    isCheckingHealth,
    checkAllBotsHealth,
  } = useMultipleTelegramBots();

  useEffect(() => {
    const fetchPlan = async () => {
      if (!user) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("current_plan")
        .eq("user_id", user.id)
        .single();

      if (profile?.current_plan) {
        const { data: plan } = await supabase
          .from("plans")
          .select("id, slug, name, max_destinations")
          .eq("slug", profile.current_plan)
          .single();

        if (plan) setCurrentPlan(plan);
      }
    };

    fetchPlan();
  }, [user]);

  const maxBots = currentPlan?.max_destinations === -1 ? Infinity : (currentPlan?.max_destinations || 1);
  const canAddMoreBots = connectedBotsCount < maxBots;

  const handleConnectBot = async () => {
    if (!botToken || !canAddMoreBots) return;
    try {
      await addBot(botToken);
      setBotToken("");
    } catch (error) {
      // Error handled in hook
    }
  };

  const handleLoadChats = async (bot: TelegramBot) => {
    setSelectedBotId(bot.id);
    setIsLoadingChats(true);
    const chats = await fetchChatsForBot(bot.bot_token);
    setAvailableChats(chats);
    setIsLoadingChats(false);
  };

  const handleSelectChat = async (botId: string, chatId: string, chatTitle: string) => {
    await selectChatForBot(botId, chatId, chatTitle);
    setAvailableChats([]);
    setSelectedBotId(null);
  };

  const handleSendMessage = async (bot: TelegramBot) => {
    if (!messageText.trim() || !bot.chat_id) return;
    setIsSending(true);
    try {
      await sendMessage(bot.bot_token, bot.chat_id, messageText);
      setMessageText("");
    } finally {
      setIsSending(false);
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <RefreshCw className="w-8 h-8 animate-spin text-telegram" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Conexão Telegram</h1>
          <p className="text-muted-foreground">
            Conecte seus bots do Telegram para enviar mídias automaticamente.
          </p>
        </div>

        {/* Security Notice */}
        <Card className="border-telegram/30 bg-telegram/5">
          <CardContent className="p-4 flex items-start gap-3">
            <Shield className="w-5 h-5 text-telegram mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-telegram">Uso Seguro e Autorizado</p>
              <p className="text-muted-foreground mt-1">
                Use apenas em grupos/canais onde você é administrador. Tokens são armazenados de forma segura.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Plan Limit Info */}
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="p-4 flex items-start justify-between">
            <div className="flex items-center gap-3">
              <Bot className="w-5 h-5 text-primary" />
              <div className="text-sm">
                <p className="font-medium">Destinos conectados: {connectedBotsCount} / {maxBots === Infinity ? "∞" : maxBots}</p>
                <p className="text-muted-foreground">Plano atual: {currentPlan?.name || "Carregando..."}</p>
              </div>
            </div>
            {!canAddMoreBots && (
              <Badge variant="secondary" className="gap-1">
                <Lock className="w-3 h-3" />
                Limite atingido
              </Badge>
            )}
          </CardContent>
        </Card>

        {/* Add New Bot Section */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="w-5 h-5 text-telegram" />
              Adicionar Novo Bot
            </CardTitle>
            <CardDescription>
              Use o @BotFather para criar um bot e obter o token. O bot deve ser adicionado ao grupo/canal como admin.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {!canAddMoreBots ? (
              <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/30 text-sm">
                <div className="flex items-center gap-2 text-destructive">
                  <Lock className="w-4 h-4" />
                  <span className="font-medium">Limite de destinos atingido</span>
                </div>
                <p className="text-muted-foreground mt-1">
                  Seu plano {currentPlan?.name} permite no máximo {maxBots} destino(s). 
                  Faça upgrade para conectar mais bots.
                </p>
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  <Label htmlFor="bot-token">Token do Bot</Label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="bot-token"
                        type={showToken ? "text" : "password"}
                        placeholder="123456789:ABCdefGHIjklMNOpqrsTUVwxyz"
                        value={botToken}
                        onChange={(e) => setBotToken(e.target.value)}
                        className="pl-10 pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowToken(!showToken)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    <Button
                      variant="gradient"
                      onClick={handleConnectBot}
                      disabled={isValidating || !botToken}
                    >
                      {isValidating ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          Validando...
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-4 h-4" />
                          Conectar
                        </>
                      )}
                    </Button>
                  </div>
                </div>

                <div className="p-4 rounded-lg bg-secondary/50 text-sm space-y-2">
                  <p className="font-medium">Como obter o token:</p>
                  <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                    <li>Abra o Telegram e procure por @BotFather</li>
                    <li>Envie /newbot e siga as instruções</li>
                    <li>Copie o token gerado e cole aqui</li>
                    <li>Adicione o bot ao grupo/canal como administrador</li>
                  </ol>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Connected Bots List */}
        {bots.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <Bot className="w-5 h-5" />
                Bots Conectados ({bots.length})
              </h2>
              <Button
                variant="outline"
                size="sm"
                onClick={checkAllBotsHealth}
                disabled={isCheckingHealth}
              >
                {isCheckingHealth ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin mr-2" />
                    Verificando...
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Verificar Status
                  </>
                )}
              </Button>
            </div>

            <div className="grid gap-4">
              {bots.map((bot, index) => (
                <motion.div
                  key={bot.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="glass-card">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-4">
                          <div className={`p-3 rounded-lg ${
                            botHealthStatuses[bot.id]?.isOnline === false 
                              ? 'bg-destructive/20' 
                              : 'bg-telegram/20'
                          }`}>
                            <Bot className={`w-6 h-6 ${
                              botHealthStatuses[bot.id]?.isOnline === false 
                                ? 'text-destructive' 
                                : 'text-telegram'
                            }`} />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{bot.bot_name || "Bot"}</span>
                              {botHealthStatuses[bot.id]?.isOnline === false ? (
                                <Badge variant="destructive" className="gap-1">
                                  <AlertCircle className="w-3 h-3" />
                                  Offline
                                </Badge>
                              ) : (
                                <Badge variant="secondary" className="text-success">
                                  <CheckCircle2 className="w-3 h-3 mr-1" />
                                  {botHealthStatuses[bot.id]?.isOnline === true ? 'Online' : 'Conectado'}
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground">
                              @{bot.bot_username}
                            </p>
                            {botHealthStatuses[bot.id]?.isOnline === false && (
                              <p className="text-xs text-destructive mt-1">
                                {botHealthStatuses[bot.id]?.error || 'Token inválido ou bot inacessível'}
                              </p>
                            )}
                            {bot.chat_id && (
                              <p className="text-sm text-success mt-1">
                                Destino: {bot.chat_title || bot.chat_id}
                              </p>
                            )}
                          </div>
                        </div>
                        <Button variant="ghost" size="sm" onClick={() => removeBot(bot.id)} className="text-destructive">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>

                      <div className="mt-4 pt-4 border-t space-y-4">
                        <Tabs defaultValue="destination" className="w-full">
                          <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="destination" className="gap-2">
                              <Users className="w-4 h-4" />
                              Destino
                            </TabsTrigger>
                            <TabsTrigger value="send" className="gap-2">
                              <Send className="w-4 h-4" />
                              Enviar
                            </TabsTrigger>
                          </TabsList>

                          <TabsContent value="destination" className="space-y-4 mt-4">
                            {bot.chat_id && (
                              <div className="p-3 rounded-lg bg-success/10 border border-success/30">
                                <div className="flex items-center gap-2 text-success">
                                  <CheckCircle2 className="w-4 h-4" />
                                  <span className="font-medium">Destino atual:</span>
                                  <span>{bot.chat_title || bot.chat_id}</span>
                                </div>
                              </div>
                            )}

                            <Button
                              variant="outline"
                              onClick={() => handleLoadChats(bot)}
                              disabled={isLoadingChats && selectedBotId === bot.id}
                              className="w-full"
                            >
                              {isLoadingChats && selectedBotId === bot.id ? (
                                <>
                                  <RefreshCw className="w-4 h-4 animate-spin mr-2" />
                                  Buscando...
                                </>
                              ) : (
                                <>
                                  <RefreshCw className="w-4 h-4 mr-2" />
                                  Buscar Grupos/Canais
                                </>
                              )}
                            </Button>

                            {selectedBotId === bot.id && availableChats.length > 0 && (
                              <div className="space-y-2">
                                <Label>Grupos/Canais Disponíveis</Label>
                                <Select onValueChange={(value) => {
                                  const chat = availableChats.find(c => String(c.id) === value);
                                  if (chat) {
                                    handleSelectChat(bot.id, String(chat.id), chat.title);
                                  }
                                }}>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Selecione um destino" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {availableChats.map((chat) => (
                                      <SelectItem key={chat.id} value={String(chat.id)}>
                                        {chat.title} ({chat.type})
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                            )}

                            {selectedBotId === bot.id && availableChats.length === 0 && !isLoadingChats && (
                              <div className="p-4 rounded-lg bg-warning/10 border border-warning/30 text-sm">
                                <div className="flex items-center gap-2 text-warning">
                                  <AlertCircle className="w-4 h-4" />
                                  <span className="font-medium">Nenhum grupo encontrado</span>
                                </div>
                                <p className="text-muted-foreground mt-1">
                                  Adicione o bot a um grupo/canal e envie uma mensagem para ele aparecer aqui.
                                </p>
                              </div>
                            )}
                          </TabsContent>

                          <TabsContent value="send" className="space-y-4 mt-4">
                            {!bot.chat_id ? (
                              <div className="p-4 rounded-lg bg-warning/10 border border-warning/30 text-sm">
                                <div className="flex items-center gap-2 text-warning">
                                  <AlertCircle className="w-4 h-4" />
                                  <span>Configure um destino primeiro na aba "Destino"</span>
                                </div>
                              </div>
                            ) : (
                              <>
                                <div className="space-y-2">
                                  <Label>Mensagem</Label>
                                  <Textarea
                                    placeholder="Digite sua mensagem..."
                                    value={messageText}
                                    onChange={(e) => setMessageText(e.target.value)}
                                    rows={4}
                                  />
                                  <p className="text-xs text-muted-foreground">
                                    Suporta HTML: &lt;b&gt;negrito&lt;/b&gt;, &lt;i&gt;itálico&lt;/i&gt;, &lt;a href=""&gt;link&lt;/a&gt;
                                  </p>
                                </div>

                                <Button
                                  variant="gradient"
                                  onClick={() => handleSendMessage(bot)}
                                  disabled={isSending || !messageText.trim()}
                                  className="w-full"
                                >
                                  {isSending ? (
                                    <>
                                      <RefreshCw className="w-4 h-4 animate-spin mr-2" />
                                      Enviando...
                                    </>
                                  ) : (
                                    <>
                                      <Send className="w-4 h-4 mr-2" />
                                      Enviar Mensagem
                                    </>
                                  )}
                                </Button>
                              </>
                            )}
                          </TabsContent>
                        </Tabs>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {bots.length === 0 && (
          <Card className="glass-card">
            <CardContent className="py-12 text-center text-muted-foreground">
              <Bot className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">Nenhum bot conectado</p>
              <p>Adicione seu primeiro bot usando o formulário acima.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
};

export default TelegramPage;
