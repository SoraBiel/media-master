import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Users, 
  TrendingUp, 
  DollarSign, 
  UserCheck,
  UserX,
  Search,
  RefreshCw,
  AlertCircle
} from "lucide-react";
import { toast } from "sonner";
import { AccountManagerSellersTab } from "@/components/account-manager/AccountManagerSellersTab";
import { AccountManagerOverviewTab } from "@/components/account-manager/AccountManagerOverviewTab";
import { AccountManagerLogsTab } from "@/components/account-manager/AccountManagerLogsTab";

interface SellerStats {
  total: number;
  active: number;
  inactive: number;
}

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

const AccountManagerPage = () => {
  const { user, isAdmin } = useAuth();
  const [assignedSellers, setAssignedSellers] = useState<AssignedSeller[]>([]);
  const [stats, setStats] = useState<SellerStats>({ total: 0, active: 0, inactive: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const fetchAssignedSellers = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      // Fetch sellers assigned to this manager
      const { data: assignments, error: assignError } = await supabase
        .from("account_manager_sellers")
        .select("*")
        .eq("manager_id", user.id);

      if (assignError) throw assignError;

      if (!assignments || assignments.length === 0) {
        setAssignedSellers([]);
        setStats({ total: 0, active: 0, inactive: 0 });
        setIsLoading(false);
        return;
      }

      // Fetch profiles for assigned sellers
      const sellerIds = assignments.map(a => a.seller_id);
      const { data: profiles, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .in("user_id", sellerIds);

      if (profileError) throw profileError;

      // Merge assignments with profiles
      const sellersWithProfiles: AssignedSeller[] = assignments.map(assignment => ({
        ...assignment,
        profile: profiles?.find(p => p.user_id === assignment.seller_id) || null
      }));

      setAssignedSellers(sellersWithProfiles);

      // Calculate stats
      const activeCount = sellersWithProfiles.filter(s => s.profile && !s.profile.is_suspended).length;
      setStats({
        total: sellersWithProfiles.length,
        active: activeCount,
        inactive: sellersWithProfiles.length - activeCount
      });

    } catch (error) {
      console.error("Error fetching assigned sellers:", error);
      toast.error("Erro ao carregar sellers");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAssignedSellers();
  }, [user]);

  const filteredSellers = assignedSellers.filter(seller => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      seller.profile?.full_name?.toLowerCase().includes(search) ||
      seller.profile?.email?.toLowerCase().includes(search)
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Gerente de Contas</h1>
          <p className="text-muted-foreground">
            Gerencie os sellers vinculados à sua conta
          </p>
        </div>
        <Button onClick={fetchAssignedSellers} variant="outline" size="sm">
          <RefreshCw className="w-4 h-4 mr-2" />
          Atualizar
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary/10 rounded-lg">
                <Users className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total de Sellers</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-success/10 rounded-lg">
                <UserCheck className="w-6 h-6 text-success" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Sellers Ativos</p>
                <p className="text-2xl font-bold">{stats.active}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-destructive/10 rounded-lg">
                <UserX className="w-6 h-6 text-destructive" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Sellers Inativos</p>
                <p className="text-2xl font-bold">{stats.inactive}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="sellers">Sellers</TabsTrigger>
          <TabsTrigger value="logs">Logs</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <AccountManagerOverviewTab 
            sellers={filteredSellers} 
            isLoading={isLoading}
            stats={stats}
          />
        </TabsContent>

        <TabsContent value="sellers">
          <AccountManagerSellersTab 
            sellers={filteredSellers}
            isLoading={isLoading}
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            onRefresh={fetchAssignedSellers}
          />
        </TabsContent>

        <TabsContent value="logs">
          <AccountManagerLogsTab />
        </TabsContent>
      </Tabs>

      {/* Empty State */}
      {!isLoading && assignedSellers.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <AlertCircle className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">Nenhum seller vinculado</h3>
            <p className="text-muted-foreground">
              Você ainda não possui sellers vinculados à sua conta.
              {isAdmin && " Como admin, você pode vincular sellers no painel administrativo."}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AccountManagerPage;
