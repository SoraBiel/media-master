import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import DashboardPage from "./pages/DashboardPage";
import BillingPage from "./pages/BillingPage";
import TelegramPage from "./pages/TelegramPage";
import DestinationsPage from "./pages/DestinationsPage";
import MediaLibraryPage from "./pages/MediaLibraryPage";
import CampaignsPage from "./pages/CampaignsPage";
import ModelHubPage from "./pages/ModelHubPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/billing" element={<BillingPage />} />
          <Route path="/telegram" element={<TelegramPage />} />
          <Route path="/destinations" element={<DestinationsPage />} />
          <Route path="/media-library" element={<MediaLibraryPage />} />
          <Route path="/campaigns" element={<CampaignsPage />} />
          <Route path="/model-hub" element={<ModelHubPage />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
