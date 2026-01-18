import { useState, useEffect } from "react";
import {
  UserCog,
  Users,
  Plus,
  Trash2,
  RefreshCw,
  Search,
  Eye,
  UserPlus,
  UserMinus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Profile {
  id: string;
  user_id: string;
  email: string;
  full_name: string | null;
  current_plan: string | null;
}

interface AccountManager {
  user_id: string;
  profile: Profile;
  assigned_sellers_count: number;
}

interface Seller {
  id: string;
  user_id: string;
  email: string;
  full_name: string | null;
  current_plan: string | null;
  is_assigned: boolean;
  assigned_to_manager?: string | null;
}

const AdminAccountManagersPanel = () => {
  const [managers, setManagers] = useState<AccountManager[]>([]);
  const [availableUsers, setAvailableUsers] = useState<Profile[]>([]);
  const [sellers, setSellers] = useState<Seller[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [sellerSearchQuery, setSellerSearchQuery] = useState("");
  
  // Dialog states
  const [addManagerDialogOpen, setAddManagerDialogOpen] = useState(false);
  const [assignSellersDialogOpen, setAssignSellersDialogOpen] = useState(false);
  const [selectedManager, setSelectedManager] = useState<AccountManager | null>(null);
  const [selectedUserForManager, setSelectedUserForManager] = useState<string>("");
  const [selectedSellersForAssign, setSelectedSellersForAssign] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const { toast } = useToast();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    await Promise.all([
      fetchManagers(),
      fetchAvailableUsers(),
      fetchSellers(),
    ]);
    setIsLoading(false);
  };

  const fetchManagers = async () => {
    try {
      // Get all users with gerente_contas role
      const { data: managerRoles, error: rolesError } = await supabase
        .from("user_roles")
        .select("user_id")
        .eq("role", "gerente_contas");

      if (rolesError) throw rolesError;

      if (!managerRoles || managerRoles.length === 0) {
        setManagers([]);
        return;
      }

      const managerUserIds = managerRoles.map((r) => r.user_id);

      // Get profiles for these managers
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("id, user_id, email, full_name, current_plan")
        .in("user_id", managerUserIds);

      if (profilesError) throw profilesError;

      // Get assigned sellers count for each manager
      const { data: sellerCounts, error: countsError } = await supabase
        .from("account_manager_sellers")
        .select("manager_id");

      if (countsError) throw countsError;

      const countsByManager = sellerCounts?.reduce((acc, curr) => {
        acc[curr.manager_id] = (acc[curr.manager_id] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {};

      const managersData: AccountManager[] = profiles?.map((p) => ({
        user_id: p.user_id,
        profile: p,
        assigned_sellers_count: countsByManager[p.user_id] || 0,
      })) || [];

      setManagers(managersData);
    } catch (error) {
      console.error("Error fetching managers:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os gerentes",
        variant: "destructive",
      });
    }
  };

  const fetchAvailableUsers = async () => {
    try {
      // Get all users who are NOT already gerente_contas
      const { data: existingManagerRoles } = await supabase
        .from("user_roles")
        .select("user_id")
        .eq("role", "gerente_contas");

      const existingManagerIds = existingManagerRoles?.map((r) => r.user_id) || [];

      const { data: profiles, error } = await supabase
        .from("profiles")
        .select("id, user_id, email, full_name, current_plan")
        .order("email");

      if (error) throw error;

      // Filter out users who are already managers
      const available = profiles?.filter(
        (p) => !existingManagerIds.includes(p.user_id)
      ) || [];

      setAvailableUsers(available);
    } catch (error) {
      console.error("Error fetching available users:", error);
    }
  };

  const fetchSellers = async () => {
    try {
      // Get all users with 'user' role (potential sellers)
      const { data: userRoles, error: rolesError } = await supabase
        .from("user_roles")
        .select("user_id")
        .eq("role", "user");

      if (rolesError) throw rolesError;

      const userIds = userRoles?.map((r) => r.user_id) || [];

      // Get profiles
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("id, user_id, email, full_name, current_plan")
        .in("user_id", userIds);

      if (profilesError) throw profilesError;

      // Get existing assignments
      const { data: assignments, error: assignmentsError } = await supabase
        .from("account_manager_sellers")
        .select("seller_id, manager_id");

      if (assignmentsError) throw assignmentsError;

      const assignmentMap = assignments?.reduce((acc, curr) => {
        acc[curr.seller_id] = curr.manager_id;
        return acc;
      }, {} as Record<string, string>) || {};

      const sellersData: Seller[] = profiles?.map((p) => ({
        id: p.id,
        user_id: p.user_id,
        email: p.email,
        full_name: p.full_name,
        current_plan: p.current_plan,
        is_assigned: !!assignmentMap[p.user_id],
        assigned_to_manager: assignmentMap[p.user_id] || null,
      })) || [];

      setSellers(sellersData);
    } catch (error) {
      console.error("Error fetching sellers:", error);
    }
  };

  const handleAddManager = async () => {
    if (!selectedUserForManager) return;

    setIsProcessing(true);
    try {
      // Add gerente_contas role to user
      const { error } = await supabase
        .from("user_roles")
        .insert({
          user_id: selectedUserForManager,
          role: "gerente_contas",
        });

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Gerente de contas adicionado com sucesso",
      });

      setAddManagerDialogOpen(false);
      setSelectedUserForManager("");
      await fetchData();
    } catch (error: any) {
      console.error("Error adding manager:", error);
      toast({
        title: "Erro",
        description: error.message || "Não foi possível adicionar o gerente",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRemoveManager = async (userId: string) => {
    setIsProcessing(true);
    try {
      // Remove gerente_contas role
      const { error: roleError } = await supabase
        .from("user_roles")
        .delete()
        .eq("user_id", userId)
        .eq("role", "gerente_contas");

      if (roleError) throw roleError;

      // Remove all seller assignments
      const { error: assignError } = await supabase
        .from("account_manager_sellers")
        .delete()
        .eq("manager_id", userId);

      if (assignError) throw assignError;

      toast({
        title: "Sucesso",
        description: "Gerente removido com sucesso",
      });

      await fetchData();
    } catch (error: any) {
      console.error("Error removing manager:", error);
      toast({
        title: "Erro",
        description: error.message || "Não foi possível remover o gerente",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleOpenAssignSellers = (manager: AccountManager) => {
    setSelectedManager(manager);
    // Pre-select already assigned sellers
    const assignedToThis = sellers
      .filter((s) => s.assigned_to_manager === manager.user_id)
      .map((s) => s.user_id);
    setSelectedSellersForAssign(assignedToThis);
    setAssignSellersDialogOpen(true);
  };

  const handleSaveSellerAssignments = async () => {
    if (!selectedManager) return;

    setIsProcessing(true);
    try {
      const managerId = selectedManager.user_id;

      // Get current assignments for this manager
      const { data: currentAssignments } = await supabase
        .from("account_manager_sellers")
        .select("seller_id")
        .eq("manager_id", managerId);

      const currentSellerIds = currentAssignments?.map((a) => a.seller_id) || [];

      // Sellers to add
      const toAdd = selectedSellersForAssign.filter(
        (id) => !currentSellerIds.includes(id)
      );

      // Sellers to remove
      const toRemove = currentSellerIds.filter(
        (id) => !selectedSellersForAssign.includes(id)
      );

      // Remove unassigned sellers
      if (toRemove.length > 0) {
        const { error: removeError } = await supabase
          .from("account_manager_sellers")
          .delete()
          .eq("manager_id", managerId)
          .in("seller_id", toRemove);

        if (removeError) throw removeError;
      }

      // Add new sellers
      if (toAdd.length > 0) {
        // First, remove these sellers from any other managers
        await supabase
          .from("account_manager_sellers")
          .delete()
          .in("seller_id", toAdd);

        const { error: addError } = await supabase
          .from("account_manager_sellers")
          .insert(
            toAdd.map((sellerId) => ({
              manager_id: managerId,
              seller_id: sellerId,
            }))
          );

        if (addError) throw addError;
      }

      toast({
        title: "Sucesso",
        description: `Vendedores atualizados para ${selectedManager.profile.full_name || selectedManager.profile.email}`,
      });

      setAssignSellersDialogOpen(false);
      setSelectedManager(null);
      setSelectedSellersForAssign([]);
      await fetchData();
    } catch (error: any) {
      console.error("Error saving assignments:", error);
      toast({
        title: "Erro",
        description: error.message || "Não foi possível salvar as atribuições",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const toggleSellerSelection = (userId: string) => {
    setSelectedSellersForAssign((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    );
  };

  const filteredManagers = managers.filter(
    (m) =>
      m.profile.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.profile.full_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredSellersForAssign = sellers.filter(
    (s) =>
      s.email.toLowerCase().includes(sellerSearchQuery.toLowerCase()) ||
      s.full_name?.toLowerCase().includes(sellerSearchQuery.toLowerCase())
  );

  const filteredAvailableUsers = availableUsers.filter(
    (u) =>
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.full_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <RefreshCw className="w-6 h-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <UserCog className="w-5 h-5" />
          Gerenciamento de Gerentes de Contas
        </h3>
        <p className="text-sm text-muted-foreground">
          Crie gerentes de contas e atribua vendedores para gerenciamento.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10 text-primary">
                <UserCog className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total de Gerentes</p>
                <p className="text-2xl font-bold">{managers.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-success/10 text-success">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Vendedores Atribuídos</p>
                <p className="text-2xl font-bold">
                  {managers.reduce((acc, m) => acc + m.assigned_sellers_count, 0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-muted text-muted-foreground">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Vendedores Disponíveis</p>
                <p className="text-2xl font-bold">
                  {sellers.filter((s) => !s.is_assigned).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Managers Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <CardTitle className="flex items-center gap-2">
              <UserCog className="w-5 h-5" />
              Gerentes de Contas ({managers.length})
            </CardTitle>
            <div className="flex items-center gap-2">
              <Input
                placeholder="Buscar gerente..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="max-w-xs"
              />
              <Button
                onClick={() => setAddManagerDialogOpen(true)}
                className="telegram-gradient text-white"
              >
                <Plus className="w-4 h-4 mr-2" />
                Novo Gerente
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredManagers.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <UserCog className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>Nenhum gerente de contas cadastrado</p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => setAddManagerDialogOpen(true)}
              >
                <Plus className="w-4 h-4 mr-2" />
                Adicionar Gerente
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Gerente</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead className="text-center">Vendedores Atribuídos</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredManagers.map((manager) => (
                  <TableRow key={manager.user_id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                          <UserCog className="w-4 h-4 text-primary" />
                        </div>
                        <span className="font-medium">
                          {manager.profile.full_name || "—"}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {manager.profile.email}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="secondary">
                        {manager.assigned_sellers_count} vendedores
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenAssignSellers(manager)}
                        >
                          <UserPlus className="w-4 h-4 mr-1" />
                          Atribuir
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="sm" className="text-destructive">
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Remover Gerente?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Esta ação irá remover o cargo de gerente de contas de{" "}
                                <strong>{manager.profile.full_name || manager.profile.email}</strong> 
                                {manager.assigned_sellers_count > 0 && (
                                  <> e desatribuir os {manager.assigned_sellers_count} vendedores atualmente vinculados</>
                                )}.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleRemoveManager(manager.user_id)}
                                className="bg-destructive text-destructive-foreground"
                              >
                                Remover
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Add Manager Dialog */}
      <Dialog open={addManagerDialogOpen} onOpenChange={setAddManagerDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Adicionar Gerente de Contas</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Buscar Usuário</Label>
              <Input
                placeholder="Buscar por email ou nome..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <ScrollArea className="h-[300px] border rounded-md">
              {filteredAvailableUsers.length === 0 ? (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  <p>Nenhum usuário disponível</p>
                </div>
              ) : (
                <div className="p-2 space-y-1">
                  {filteredAvailableUsers.slice(0, 50).map((user) => (
                    <div
                      key={user.user_id}
                      className={`p-3 rounded-lg cursor-pointer transition-colors ${
                        selectedUserForManager === user.user_id
                          ? "bg-primary/10 border border-primary"
                          : "hover:bg-muted"
                      }`}
                      onClick={() => setSelectedUserForManager(user.user_id)}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{user.full_name || "—"}</p>
                          <p className="text-sm text-muted-foreground">{user.email}</p>
                        </div>
                        <Badge variant="secondary" className="capitalize">
                          {user.current_plan || "free"}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddManagerDialogOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleAddManager}
              disabled={!selectedUserForManager || isProcessing}
              className="telegram-gradient text-white"
            >
              {isProcessing ? (
                <><RefreshCw className="w-4 h-4 mr-2 animate-spin" />Adicionando...</>
              ) : (
                <><Plus className="w-4 h-4 mr-2" />Adicionar Gerente</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Assign Sellers Dialog */}
      <Dialog open={assignSellersDialogOpen} onOpenChange={setAssignSellersDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              Atribuir Vendedores para {selectedManager?.profile.full_name || selectedManager?.profile.email}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Input
                placeholder="Buscar vendedores..."
                value={sellerSearchQuery}
                onChange={(e) => setSellerSearchQuery(e.target.value)}
                className="max-w-sm"
              />
              <Badge variant="outline">
                {selectedSellersForAssign.length} selecionados
              </Badge>
            </div>
            <ScrollArea className="h-[400px] border rounded-md">
              <div className="p-2 space-y-1">
                {filteredSellersForAssign.map((seller) => {
                  const isSelected = selectedSellersForAssign.includes(seller.user_id);
                  const assignedToOther = seller.assigned_to_manager && 
                    seller.assigned_to_manager !== selectedManager?.user_id;
                  const otherManagerName = assignedToOther
                    ? managers.find((m) => m.user_id === seller.assigned_to_manager)?.profile.full_name || 
                      managers.find((m) => m.user_id === seller.assigned_to_manager)?.profile.email
                    : null;

                  return (
                    <div
                      key={seller.user_id}
                      className={`p-3 rounded-lg cursor-pointer transition-colors ${
                        isSelected
                          ? "bg-primary/10 border border-primary"
                          : "hover:bg-muted"
                      }`}
                      onClick={() => toggleSellerSelection(seller.user_id)}
                    >
                      <div className="flex items-center gap-3">
                        <Checkbox checked={isSelected} />
                        <div className="flex-1">
                          <p className="font-medium">{seller.full_name || "—"}</p>
                          <p className="text-sm text-muted-foreground">{seller.email}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="capitalize">
                            {seller.current_plan || "free"}
                          </Badge>
                          {assignedToOther && (
                            <Badge variant="outline" className="text-warning">
                              Atribuído: {otherManagerName}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAssignSellersDialogOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleSaveSellerAssignments}
              disabled={isProcessing}
              className="telegram-gradient text-white"
            >
              {isProcessing ? (
                <><RefreshCw className="w-4 h-4 mr-2 animate-spin" />Salvando...</>
              ) : (
                <><UserPlus className="w-4 h-4 mr-2" />Salvar Atribuições</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminAccountManagersPanel;
