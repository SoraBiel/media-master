import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Bot, Target, Megaphone } from "lucide-react";

// Components for each section
import TelegramBotsSection from "@/components/telegram-hub/TelegramBotsSection";
import DestinationsSection from "@/components/telegram-hub/DestinationsSection";
import CampaignsSection from "@/components/telegram-hub/CampaignsSection";

const TelegramHubPage = () => {
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState("bots");

  // Check if coming from media library with a pack pre-selected
  useEffect(() => {
    const mediaPackId = searchParams.get("media_pack_id");
    if (mediaPackId) {
      setActiveTab("campaigns");
    }
  }, [searchParams]);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Central Telegram</h1>
          <p className="text-muted-foreground">
            Gerencie seus bots, destinos e campanhas em um só lugar.
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="bots" className="gap-2">
              <Bot className="w-4 h-4" />
              Bots
            </TabsTrigger>
            <TabsTrigger value="destinations" className="gap-2">
              <Target className="w-4 h-4" />
              Destinos
            </TabsTrigger>
            <TabsTrigger value="campaigns" className="gap-2">
              <Megaphone className="w-4 h-4" />
              Campanhas
            </TabsTrigger>
          </TabsList>

          <TabsContent value="bots">
            <TelegramBotsSection />
          </TabsContent>

          <TabsContent value="destinations">
            <DestinationsSection />
          </TabsContent>

          <TabsContent value="campaigns">
            <CampaignsSection />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default TelegramHubPage;
