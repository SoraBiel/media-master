import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Link } from "react-router-dom";

const TikTokPage = () => {
  const { toast } = useToast();

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">TikTok</h1>
          <p className="text-muted-foreground">
            Gerencie integrações, conteúdos e métricas da sua operação no TikTok.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle>Conta conectada</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">Status</span>
                <Badge className="bg-success/20 text-success">Ativo</Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                @mediadrop.oficial • Última sincronização há 2h
              </p>
              <Button
                className="w-full"
                onClick={() =>
                  toast({
                    title: "Sincronização iniciada",
                    description: "Atualizando dados da conta TikTok.",
                  })
                }
              >
                Sincronizar agora
              </Button>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardHeader>
              <CardTitle>Conteúdos programados</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2 text-sm">
                <p>• 12 vídeos em fila</p>
                <p>• 3 posts aprovados pela equipe</p>
                <p>• 2 campanhas aguardando revisão</p>
              </div>
              <Button
                variant="outline"
                className="w-full"
                onClick={() =>
                  toast({
                    title: "Fila de conteúdos",
                    description: "Abrindo agenda de publicações.",
                  })
                }
              >
                Gerenciar fila
              </Button>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardHeader>
              <CardTitle>Analytics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2 text-sm">
                <p>• 98k visualizações na semana</p>
                <p>• 4,2k novos seguidores</p>
                <p>• Engajamento médio de 7,8%</p>
              </div>
              <Button
                variant="outline"
                className="w-full"
                onClick={() =>
                  toast({
                    title: "Relatório TikTok",
                    description: "Relatório completo enviado para seu email.",
                  })
                }
              >
                Gerar relatório
              </Button>
            </CardContent>
          </Card>
        </div>

        <Card className="glass-card">
          <CardContent className="p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-semibold">Quer comprar contas TikTok prontas?</h3>
              <p className="text-sm text-muted-foreground">
                Veja as opções disponíveis com histórico de engajamento validado.
              </p>
            </div>
            <Link to="/admin/tiktok-accounts">
              <Button variant="gradient">Ver contas disponíveis</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default TikTokPage;
