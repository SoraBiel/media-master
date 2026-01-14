import { useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MultiloginAccountsTab } from "@/components/multilogin/MultiloginAccountsTab";
import { MultiloginProxiesTab } from "@/components/multilogin/MultiloginProxiesTab";
import { MultiloginIsolationTab } from "@/components/multilogin/MultiloginIsolationTab";
import { MultiloginWorkersTab } from "@/components/multilogin/MultiloginWorkersTab";
import { MultiloginLogsTab } from "@/components/multilogin/MultiloginLogsTab";
import { 
  Users, 
  Globe, 
  Shield, 
  Cog, 
  FileText,
  Fingerprint
} from "lucide-react";

const MultiloginPage = () => {
  const [activeTab, setActiveTab] = useState("accounts");

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20">
            <Fingerprint className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Multilogin</h1>
            <p className="text-sm text-muted-foreground">
              Gerencie múltiplas contas com isolamento total
            </p>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-5 lg:w-auto lg:inline-flex">
            <TabsTrigger value="accounts" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">Contas</span>
            </TabsTrigger>
            <TabsTrigger value="proxies" className="flex items-center gap-2">
              <Globe className="h-4 w-4" />
              <span className="hidden sm:inline">Proxies</span>
            </TabsTrigger>
            <TabsTrigger value="isolation" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              <span className="hidden sm:inline">Isolamento</span>
            </TabsTrigger>
            <TabsTrigger value="workers" className="flex items-center gap-2">
              <Cog className="h-4 w-4" />
              <span className="hidden sm:inline">Workers</span>
            </TabsTrigger>
            <TabsTrigger value="logs" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              <span className="hidden sm:inline">Logs</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="accounts" className="mt-6">
            <MultiloginAccountsTab />
          </TabsContent>

          <TabsContent value="proxies" className="mt-6">
            <MultiloginProxiesTab />
          </TabsContent>

          <TabsContent value="isolation" className="mt-6">
            <MultiloginIsolationTab />
          </TabsContent>

          <TabsContent value="workers" className="mt-6">
            <MultiloginWorkersTab />
          </TabsContent>

          <TabsContent value="logs" className="mt-6">
            <MultiloginLogsTab />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default MultiloginPage;
