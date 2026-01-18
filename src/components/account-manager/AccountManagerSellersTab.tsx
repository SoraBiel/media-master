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
  Search, 
  Crown,
  Mail,
  Calendar,
  UserCog
} from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { SellerDetailsDialog } from "./SellerDetailsDialog";

interface UserProfile {
  id: string;
  user_id: string;
  email: string;
  full_name: string | null;
  current_plan: string | null;
  is_online: boolean;
  is_suspended: boolean;
  last_seen_at: string | null;
  created_at: string | null;
}

interface AccountManagerSellersTabProps {
  users: UserProfile[];
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
  users, 
  isLoading, 
  searchTerm, 
  onSearchChange,
  onRefresh 
}: AccountManagerSellersTabProps) => {
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);

  const handleOpenDetails = (userId: string) => {
    setSelectedUserId(userId);
    setDetailsDialogOpen(true);
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
            <CardTitle>Todos os Usuários</CardTitle>
            <CardDescription>
              Lista completa de usuários da plataforma
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
        {users.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">
            {searchTerm ? "Nenhum usuário encontrado com este termo" : "Nenhum usuário cadastrado"}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Status</TableHead>
                  <TableHead>Usuário</TableHead>
                  <TableHead>Plano</TableHead>
                  <TableHead>Último Acesso</TableHead>
                  <TableHead>Cadastro</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id} className={user.is_suspended ? "opacity-60" : ""}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${
                          user.is_suspended 
                            ? "bg-destructive" 
                            : user.is_online 
                              ? "bg-success" 
                              : "bg-muted-foreground"
                        }`} />
                        <span className="text-xs text-muted-foreground">
                          {user.is_suspended 
                            ? "Suspenso" 
                            : user.is_online 
                              ? "Online" 
                              : "Offline"}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">
                          {user.full_name || "Sem nome"}
                        </p>
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <Mail className="w-3 h-3" />
                          {user.email}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={planColors[user.current_plan || "free"]}>
                        <Crown className="w-3 h-3 mr-1" />
                        {(user.current_plan || "free").charAt(0).toUpperCase() + 
                         (user.current_plan || "free").slice(1)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground">
                        {user.last_seen_at 
                          ? formatDistanceToNow(new Date(user.last_seen_at), { 
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
                        {user.created_at 
                          ? format(new Date(user.created_at), "dd/MM/yyyy", { locale: ptBR })
                          : "—"
                        }
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleOpenDetails(user.user_id)}
                        title="Ver detalhes e ações"
                      >
                        <UserCog className="w-4 h-4 mr-1" />
                        Gerenciar
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Seller Details Dialog */}
        <SellerDetailsDialog 
          sellerId={selectedUserId}
          open={detailsDialogOpen}
          onOpenChange={setDetailsDialogOpen}
          onUpdate={onRefresh}
        />
      </CardContent>
    </Card>
  );
};
