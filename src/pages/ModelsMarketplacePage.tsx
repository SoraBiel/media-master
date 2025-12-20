import { useState } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { getMarketplaceItemsByType, MarketplaceItem } from "@/lib/marketplaceStore";
import { updateUser, getCurrentUser } from "@/lib/userStore";

const ModelsMarketplacePage = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const currentUser = getCurrentUser();
  const [items] = useState<MarketplaceItem[]>(getMarketplaceItemsByType("model"));

  const handlePurchase = (item: MarketplaceItem) => {
    if (currentUser) {
      updateUser(currentUser.id, { billingStatus: "checkout" });
    }
    toast({
      title: "Redirecionando para checkout",
      description: `Você selecionou o modelo ${item.name}.`,
    });
    navigate(`/payment?type=model&item=${item.id}`);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Modelos à venda</h1>
          <p className="text-muted-foreground">
            Adquira modelos prontos para acelerar suas campanhas.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {items.length === 0 ? (
            <Card className="glass-card lg:col-span-3">
              <CardContent className="p-6 text-sm text-muted-foreground">
                Nenhum modelo disponível no momento.
              </CardContent>
            </Card>
          ) : (
            items.map((item) => (
              <Card key={item.id} className="glass-card">
                <CardHeader>
                  <CardTitle>{item.name}</CardTitle>
                  <p className="text-sm text-muted-foreground">{item.description}</p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex flex-wrap gap-2">
                    {item.details.map((detail) => (
                      <Badge key={detail} variant="secondary">
                        {detail}
                      </Badge>
                    ))}
                  </div>
                  <div className="text-lg font-semibold">R$ {item.price}</div>
                  <Button className="w-full" variant="gradient" onClick={() => handlePurchase(item)}>
                    Comprar modelo
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

export default ModelsMarketplacePage;
