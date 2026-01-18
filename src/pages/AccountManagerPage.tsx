import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { 
  Users, 
  UserCheck,
  UserX,
  RefreshCw,
  LayoutDashboard,
  History
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

const AccountManagerPage = () => {
  const { user } = useAuth();
  const [allUsers, setAllUsers] = useState<UserProfile[]>([]);
  const [stats, setStats] = useState<SellerStats>({ total: 0, active: 0, inactive: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const fetchAllUsers = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      // Fetch all user profiles (gerente de contas has access to all)
      const { data: profiles, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });

      if (profileError) throw profileError;

      setAllUsers(profiles || []);

      // Calculate stats
      const activeCount = profiles?.filter(p => !p.is_suspended).length || 0;
      const inactiveCount = profiles?.filter(p => p.is_suspended).length || 0;
      
      setStats({
        total: profiles?.length || 0,
        active: activeCount,
        inactive: inactiveCount
      });

    } catch (error) {
      console.error("Error fetching users:", error);
      toast.error("Erro ao carregar usuários");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAllUsers();
  }, [user]);

  const filteredUsers = allUsers.filter(userProfile => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      userProfile.full_name?.toLowerCase().includes(search) ||
      userProfile.email?.toLowerCase().includes(search)
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Gerente de Contas</h1>
          <p className="text-muted-foreground">
            Gerencie todos os usuários da plataforma
          </p>
        </div>
        <Button onClick={fetchAllUsers} variant="outline" size="sm">
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
                <p className="text-sm text-muted-foreground">Total de Usuários</p>
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
                <p className="text-sm text-muted-foreground">Usuários Ativos</p>
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
                <p className="text-sm text-muted-foreground">Usuários Suspensos</p>
                <p className="text-2xl font-bold">{stats.inactive}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview" className="gap-2">
            <LayoutDashboard className="w-4 h-4" />
            Visão Geral
          </TabsTrigger>
          <TabsTrigger value="users" className="gap-2">
            <Users className="w-4 h-4" />
            Usuários
          </TabsTrigger>
          <TabsTrigger value="logs" className="gap-2">
            <History className="w-4 h-4" />
            Logs
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <AccountManagerOverviewTab 
            users={filteredUsers} 
            isLoading={isLoading}
            stats={stats}
          />
        </TabsContent>

        <TabsContent value="users">
          <AccountManagerSellersTab 
            users={filteredUsers}
            isLoading={isLoading}
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            onRefresh={fetchAllUsers}
          />
        </TabsContent>

        <TabsContent value="logs">
          <AccountManagerLogsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AccountManagerPage;
