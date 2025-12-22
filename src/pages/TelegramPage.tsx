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
  Image,
  Users,
} from "lucide-react";
import { useState } from "react";
import { motion } from "framer-motion";
import { useTelegramIntegration } from "@/hooks/useTelegramIntegration";

const TelegramPage = () => {
  const [showToken, setShowToken] = useState(false);
  const [botToken, setBotToken] = useState("");
  const [messageText, setMessageText] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isLoadingChats, setIsLoadingChats] = useState(false);

  const {
    integration,
    availableChats,
    isLoading,
    isValidating,
    validateToken,
    fetchAvailableChats,
    selectChat,
    sendMessage,
    disconnect,
  } = useTelegramIntegration();

  const handleConnectBot = async () => {
    if (!botToken) return;
    await validateToken(botToken);
    setBotToken("");
  };

  const handleLoadChats = async () => {
    setIsLoadingChats(true);
    await fetchAvailableChats();
    setIsLoadingChats(false);
  };

  const handleSendMessage = async () => {
    if (!messageText.trim()) return;
    setIsSending(true);
    try {
      await sendMessage(messageText);
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
            Conecte seu bot do Telegram para enviar mídias automaticamente.
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

        {!integration?.is_connected ? (
          /* Connection Form */
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bot className="w-5 h-5 text-telegram" />
                Conectar via Bot Token
              </CardTitle>
              <CardDescription>
                Use o @BotFather para criar um bot e obter o token. O bot deve ser adicionado ao grupo/canal como admin.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
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
            </CardContent>
          </Card>
        ) : (
          /* Connected State */
          <div className="space-y-6">
            {/* Bot Info */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card className="glass-card">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Bot className="w-5 h-5 text-telegram" />
                      Bot Conectado
                    </div>
                    <Button variant="ghost" size="sm" onClick={disconnect} className="text-destructive">
                      <Trash2 className="w-4 h-4 mr-2" />
                      Desconectar
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4 p-4 rounded-lg bg-secondary/50">
                    <div className="p-3 rounded-lg bg-telegram/20">
                      <Bot className="w-6 h-6 text-telegram" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{integration.bot_name || "Bot"}</span>
                        <Badge variant="secondary" className="text-success">
                          <CheckCircle2 className="w-3 h-3 mr-1" />
                          Conectado
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        @{integration.bot_username}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Chat Selection */}
            <Tabs defaultValue="destination" className="space-y-4">
              <TabsList>
                <TabsTrigger value="destination" className="gap-2">
                  <Users className="w-4 h-4" />
                  Destino
                </TabsTrigger>
                <TabsTrigger value="send" className="gap-2">
                  <Send className="w-4 h-4" />
                  Enviar
                </TabsTrigger>
              </TabsList>

              <TabsContent value="destination">
                <Card className="glass-card">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="w-5 h-5" />
                      Selecionar Destino
                    </CardTitle>
                    <CardDescription>
                      Escolha o grupo ou canal onde o bot enviará as mensagens.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {integration.chat_id && (
                      <div className="p-3 rounded-lg bg-success/10 border border-success/30">
                        <div className="flex items-center gap-2 text-success">
                          <CheckCircle2 className="w-4 h-4" />
                          <span className="font-medium">Destino atual:</span>
                          <span>{integration.chat_title || integration.chat_id}</span>
                        </div>
                      </div>
                    )}

                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        onClick={handleLoadChats}
                        disabled={isLoadingChats}
                        className="flex-1"
                      >
                        {isLoadingChats ? (
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
                    </div>

                    {availableChats.length > 0 && (
                      <div className="space-y-2">
                        <Label>Grupos/Canais Disponíveis</Label>
                        <Select onValueChange={(value) => {
                          const chat = availableChats.find(c => String(c.id) === value);
                          if (chat) {
                            selectChat(String(chat.id), chat.title);
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

                    {availableChats.length === 0 && !isLoadingChats && (
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
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="send">
                <Card className="glass-card">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <MessageSquare className="w-5 h-5" />
                      Enviar Mensagem
                    </CardTitle>
                    <CardDescription>
                      Envie uma mensagem de teste para o destino configurado.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {!integration.chat_id ? (
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
                          onClick={handleSendMessage}
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
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default TelegramPage;
