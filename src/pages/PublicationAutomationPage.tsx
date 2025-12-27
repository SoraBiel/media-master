import DashboardLayout from "@/components/layout/DashboardLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Send, Link2, History } from "lucide-react";
import CreatePostTab from "@/components/publication-automation/CreatePostTab";
import ConnectedAccountsTab from "@/components/publication-automation/ConnectedAccountsTab";
import PostHistoryTab from "@/components/publication-automation/PostHistoryTab";

const PublicationAutomationPage = () => {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Automação de Publicações</h1>
          <p className="text-muted-foreground">
            Publique em várias redes sociais de uma vez
          </p>
        </div>

        <Tabs defaultValue="create" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 lg:w-auto lg:inline-grid">
            <TabsTrigger value="create" className="gap-2">
              <Send className="w-4 h-4" />
              <span className="hidden sm:inline">Criar Post</span>
            </TabsTrigger>
            <TabsTrigger value="accounts" className="gap-2">
              <Link2 className="w-4 h-4" />
              <span className="hidden sm:inline">Contas</span>
            </TabsTrigger>
            <TabsTrigger value="history" className="gap-2">
              <History className="w-4 h-4" />
              <span className="hidden sm:inline">Histórico</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="create">
            <CreatePostTab />
          </TabsContent>

          <TabsContent value="accounts">
            <ConnectedAccountsTab />
          </TabsContent>

          <TabsContent value="history">
            <PostHistoryTab />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default PublicationAutomationPage;
