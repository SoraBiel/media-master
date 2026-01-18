import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { 
  Search, 
  Eye,
  Edit,
  Crown,
  Mail,
  Calendar,
  UserCog
} from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { SellerDetailsDialog } from "./SellerDetailsDialog";

interface AssignedSeller {
  id: string;
  manager_id: string;
  seller_id: string;
  notes: string | null;
  assigned_at: string;
  profile: {
    user_id: string;
    email: string;
    full_name: string | null;
    current_plan: string | null;
    is_online: boolean;
    is_suspended: boolean;
    last_seen_at: string | null;
    created_at: string | null;
  } | null;
}

interface AccountManagerSellersTabProps {
  sellers: AssignedSeller[];
  isLoading: boolean;
  searchTerm: string;
  onSearchChange: (value: string) => void;
  onRefresh: () => void;
}

const planColors: Record<string, string> = {
  free: "bg-muted text-muted-foreground",
  basic: "bg-blue-500/10 text-blue-500",
  pro: "bg-purple-500/10 text-purple-500",
  agency: "bg-amber-500/10 text-amber-500"
};

export const AccountManagerSellersTab = ({ 
  sellers, 
  isLoading, 
  searchTerm, 
  onSearchChange,
  onRefresh 
}: AccountManagerSellersTabProps) => {
  const { user } = useAuth();
  const [selectedSeller, setSelectedSeller] = useState<AssignedSeller | null>(null);
  const [selectedSellerId, setSelectedSellerId] = useState<string | null>(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [notes, setNotes] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  const handleOpenNotes = (seller: AssignedSeller) => {
    setSelectedSeller(seller);
    setNotes(seller.notes || "");
    setDialogOpen(true);
  };

  const handleOpenDetails = (sellerId: string) => {
    setSelectedSellerId(sellerId);
    setDetailsDialogOpen(true);
  };

  const handleSaveNotes = async () => {
    if (!selectedSeller || !user) return;
    
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from("account_manager_sellers")
        .update({ notes })
        .eq("id", selectedSeller.id);

      if (error) throw error;

      // Log the action
      await supabase.from("account_manager_logs").insert({
        manager_id: user.id,
        target_user_id: selectedSeller.seller_id,
        action: "Atualizou observações do seller",
        action_type: "notes_update",
        details: { notes_length: notes.length }
      });

      toast.success("Observações salvas!");
      setDialogOpen(false);
      onRefresh();
    } catch (error) {
      console.error("Error saving notes:", error);
      toast.error("Erro ao salvar observações");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <CardTitle>Meus Sellers</CardTitle>
            <CardDescription>
              Lista de sellers vinculados à sua conta
            </CardDescription>
          </div>
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome ou email..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {sellers.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">
            {searchTerm ? "Nenhum seller encontrado com este termo" : "Nenhum seller vinculado"}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Status</TableHead>
                  <TableHead>Seller</TableHead>
                  <TableHead>Plano</TableHead>
                  <TableHead>Último Acesso</TableHead>
                  <TableHead>Desde</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sellers.map((seller) => (
                  <TableRow key={seller.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${
                          seller.profile?.is_suspended 
                            ? "bg-destructive" 
                            : seller.profile?.is_online 
                              ? "bg-success" 
                              : "bg-muted-foreground"
                        }`} />
                        <span className="text-xs text-muted-foreground">
                          {seller.profile?.is_suspended 
                            ? "Suspenso" 
                            : seller.profile?.is_online 
                              ? "Online" 
                              : "Offline"}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">
                          {seller.profile?.full_name || "Sem nome"}
                        </p>
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <Mail className="w-3 h-3" />
                          {seller.profile?.email}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={planColors[seller.profile?.current_plan || "free"]}>
                        <Crown className="w-3 h-3 mr-1" />
                        {(seller.profile?.current_plan || "free").charAt(0).toUpperCase() + 
                         (seller.profile?.current_plan || "free").slice(1)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground">
                        {seller.profile?.last_seen_at 
                          ? formatDistanceToNow(new Date(seller.profile.last_seen_at), { 
                              addSuffix: true, 
                              locale: ptBR 
                            })
                          : "Nunca"
                        }
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {format(new Date(seller.assigned_at), "dd/MM/yyyy", { locale: ptBR })}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button 
                          variant="ghost" 
                          size="icon-sm"
                          onClick={() => handleOpenDetails(seller.seller_id)}
                          title="Ver detalhes"
                        >
                          <UserCog className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon-sm"
                          onClick={() => handleOpenNotes(seller)}
                          title="Observações"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Notes Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Observações do Seller</DialogTitle>
              <DialogDescription>
                {selectedSeller?.profile?.full_name || selectedSeller?.profile?.email}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <Textarea
                placeholder="Adicione observações sobre este seller..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={6}
              />
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleSaveNotes} disabled={isSaving}>
                  {isSaving ? "Salvando..." : "Salvar"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Seller Details Dialog */}
        <SellerDetailsDialog 
          sellerId={selectedSellerId}
          open={detailsDialogOpen}
          onOpenChange={setDetailsDialogOpen}
          onUpdate={onRefresh}
        />
      </CardContent>
    </Card>
  );
};
