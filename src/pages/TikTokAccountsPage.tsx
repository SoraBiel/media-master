import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { getMarketplaceItemsByType, MarketplaceItem } from "@/lib/marketplaceStore";
import { getCurrentUser, updateUser } from "@/lib/userStore";

const TikTokAccountsPage = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const currentUser = getCurrentUser();
  const accounts = getMarketplaceItemsByType("tiktok");

  const handleReserve = (account: MarketplaceItem) => {
    if (currentUser) {
      updateUser(currentUser.id, { billingStatus: "checkout" });
    }
    toast({
      title: "Conta selecionada",
      description: `Você escolheu ${account.name}. Vamos para o checkout.`,
    });
    navigate(`/payment?type=tiktok&item=${account.id}`);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Contas TikTok à venda</h1>
          <p className="text-muted-foreground">
            Contas verificadas, com nicho definido e histórico de engajamento.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {accounts.length === 0 ? (
            <Card className="glass-card lg:col-span-3">
              <CardContent className="p-6 text-sm text-muted-foreground">
                Nenhuma conta disponível no momento.
              </CardContent>
            </Card>
          ) : (
            accounts.map((account) => (
              <Card key={account.id} className="glass-card">
                <CardHeader className="space-y-2">
                  <div className="flex items-center justify-between">
                    <CardTitle>{account.name}</CardTitle>
                    <Badge variant="secondary">Disponível</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{account.description}</p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-sm space-y-1">
                    {account.details.map((detail) => (
                      <p key={detail}>{detail}</p>
                    ))}
                  </div>
                  <p className="font-semibold">Preço: R$ {account.price}</p>
                  <Button
                    className="w-full"
                    variant="gradient"
                    onClick={() => handleReserve(account)}
                  >
                    Comprar conta
                  </Button>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default TikTokAccountsPage;
