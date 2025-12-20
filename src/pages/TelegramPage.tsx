import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Bot,
  Smartphone,
  QrCode,
  Key,
  CheckCircle2,
  AlertCircle,
  Plus,
  Trash2,
  RefreshCw,
  Shield,
  Eye,
  EyeOff,
} from "lucide-react";
import { useState } from "react";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";

const TelegramPage = () => {
  const [showToken, setShowToken] = useState(false);
  const [botToken, setBotToken] = useState("");
  const [isConnecting, setIsConnecting] = useState(false);
  const { toast } = useToast();

  const connections = [
    {
      id: 1,
      type: "bot",
      name: "MediaDrop Bot",
      username: "@mediadrop_bot",
      status: "connected",
      groups: 5,
      lastActive: "há 2 min",
    },
    {
      id: 2,
      type: "session",
      name: "Conta Principal",
      phone: "+55 11 9****-1234",
      status: "connected",
      groups: 3,
      lastActive: "há 5 min",
    },
  ];

  const handleConnectBot = () => {
    if (!botToken) {
      toast({
        title: "Erro",
        description: "Por favor, insira o token do bot.",
        variant: "destructive",
      });
      return;
    }

    setIsConnecting(true);
    setTimeout(() => {
      setIsConnecting(false);
      toast({
        title: "Bot conectado!",
        description: "Seu bot do Telegram foi conectado com sucesso.",
      });
      setBotToken("");
    }, 2000);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Conexão Telegram</h1>
          <p className="text-muted-foreground">
            Conecte seu bot ou conta do Telegram para enviar mídias.
          </p>
        </div>

        {/* Security Notice */}
        <Card className="border-telegram/30 bg-telegram/5">
          <CardContent className="p-4 flex items-start gap-3">
            <Shield className="w-5 h-5 text-telegram mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-telegram">Uso Seguro e Autorizado</p>
              <p className="text-muted-foreground mt-1">
                Use apenas em grupos/canais onde você é administrador ou tem autorização explícita.
                Tokens e sessões são criptografados em repouso.
              </p>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="bot" className="space-y-6">
          <TabsList className="bg-secondary">
            <TabsTrigger value="bot" className="gap-2">
              <Bot className="w-4 h-4" />
              Bot Token
            </TabsTrigger>
            <TabsTrigger value="session" className="gap-2">
              <Smartphone className="w-4 h-4" />
              Sessão MTProto
            </TabsTrigger>
          </TabsList>

          <TabsContent value="bot" className="space-y-6">
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bot className="w-5 h-5 text-telegram" />
                  Conectar via Bot Token
                </CardTitle>
                <CardDescription>
                  Use o @BotFather para criar um bot e obter o token. O bot deve ser adicionado
                  manualmente ao grupo/canal com permissão de administrador.
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
                      disabled={isConnecting}
                    >
                      {isConnecting ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          Conectando...
                        </>
                      ) : (
                        <>
                          <Plus className="w-4 h-4" />
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
          </TabsContent>

          <TabsContent value="session" className="space-y-6">
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Smartphone className="w-5 h-5 text-telegram" />
                  Conectar via Sessão MTProto
                </CardTitle>
                <CardDescription>
                  Conecte sua conta pessoal do Telegram via QR Code ou código de verificação.
                  Ideal para grupos onde você já é membro.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  {/* QR Code */}
                  <div className="p-6 rounded-xl border border-border bg-secondary/30 text-center">
                    <div className="w-48 h-48 mx-auto mb-4 rounded-xl bg-white flex items-center justify-center">
                      <QrCode className="w-32 h-32 text-background" />
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Escaneie com o app do Telegram
                    </p>
                    <Button variant="outline" size="sm" className="mt-3">
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Gerar novo QR
                    </Button>
                  </div>

                  {/* Phone Number */}
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Número de telefone</Label>
                      <Input
                        type="tel"
                        placeholder="+55 11 99999-9999"
                      />
                    </div>
                    <Button variant="outline" className="w-full">
                      Enviar código de verificação
                    </Button>
                    <div className="space-y-2">
                      <Label>Código de verificação</Label>
                      <Input
                        type="text"
                        placeholder="12345"
                        maxLength={5}
                      />
                    </div>
                    <Button variant="gradient" className="w-full">
                      Conectar conta
                    </Button>
                  </div>
                </div>

                <div className="p-4 rounded-lg bg-warning/10 border border-warning/30 text-sm">
                  <p className="font-medium text-warning flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    Atenção
                  </p>
                  <p className="text-muted-foreground mt-1">
                    Sessões MTProto permitem acesso total à conta. Use com cuidado e apenas
                    em dispositivos confiáveis. Você pode revogar o acesso a qualquer momento.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Connected Accounts */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle>Conexões Ativas</CardTitle>
            <CardDescription>
              Gerencie suas conexões do Telegram
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {connections.map((conn, index) => (
                <motion.div
                  key={conn.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center justify-between p-4 rounded-lg bg-secondary/50 hover:bg-secondary/70 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className={`p-2 rounded-lg ${conn.type === "bot" ? "bg-telegram/20" : "bg-purple-500/20"}`}>
                      {conn.type === "bot" ? (
                        <Bot className="w-5 h-5 text-telegram" />
                      ) : (
                        <Smartphone className="w-5 h-5 text-purple-400" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{conn.name}</span>
                        <Badge variant="secondary" className="text-success">
                          <CheckCircle2 className="w-3 h-3 mr-1" />
                          Conectado
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {conn.type === "bot" ? conn.username : conn.phone} • {conn.groups} grupos • Ativo {conn.lastActive}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon">
                      <RefreshCw className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default TelegramPage;
