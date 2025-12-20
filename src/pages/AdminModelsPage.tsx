import { useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { addMarketplaceItem, getMarketplaceItems, MarketplaceItem } from "@/lib/marketplaceStore";

const AdminModelsPage = () => {
  const { toast } = useToast();
  const [items, setItems] = useState<MarketplaceItem[]>(
    getMarketplaceItems().filter((item) => item.type === "model")
  );
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    details: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const priceValue = Number(formData.price);
    if (Number.isNaN(priceValue) || priceValue <= 0) {
      toast({
        title: "Preço inválido",
        description: "Informe um valor válido para o modelo.",
        variant: "destructive",
      });
      return;
    }

    const details = formData.details
      .split(",")
      .map((detail) => detail.trim())
      .filter(Boolean);

    addMarketplaceItem({
      type: "model",
      name: formData.name,
      description: formData.description,
      price: priceValue,
      details,
    });

    setItems(getMarketplaceItems().filter((item) => item.type === "model"));
    setFormData({ name: "", description: "", price: "", details: "" });
    toast({
      title: "Modelo adicionado",
      description: "O novo modelo foi publicado na vitrine.",
    });
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Modelos à venda</h1>
          <p className="text-muted-foreground">
            Adicione novos modelos e controle o catálogo de ofertas.
          </p>
        </div>

        <Card className="glass-card">
          <CardHeader>
            <CardTitle>Novo modelo</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="grid md:grid-cols-2 gap-4" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <Label htmlFor="name">Nome do modelo</Label>
                <Input
                  id="name"
                  name="name"
                  placeholder="Nome do pacote"
                  value={formData.name}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="price">Preço (R$)</Label>
                <Input
                  id="price"
                  name="price"
                  placeholder="390"
                  value={formData.price}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="description">Descrição</Label>
                <Input
                  id="description"
                  name="description"
                  placeholder="Resumo do que o modelo entrega"
                  value={formData.description}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="details">Conteúdo incluso (separe por vírgula)</Label>
                <Input
                  id="details"
                  name="details"
                  placeholder="Checklist, copies, templates"
                  value={formData.details}
                  onChange={handleChange}
                />
              </div>
              <Button type="submit" variant="gradient" className="md:col-span-2">
                Publicar modelo
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader>
            <CardTitle>Catálogo atual</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {items.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhum modelo cadastrado.</p>
            ) : (
              items.map((item) => (
                <div key={item.id} className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div>
                    <p className="font-medium">{item.name}</p>
                    <p className="text-xs text-muted-foreground">{item.description}</p>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {item.details.map((detail) => (
                        <Badge key={detail} variant="secondary">
                          {detail}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant={item.status === "sold" ? "outline" : "secondary"}>
                      {item.status === "sold" ? "Vendido" : "Disponível"}
                    </Badge>
                    <div className="font-semibold">R$ {item.price}</div>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default AdminModelsPage;
