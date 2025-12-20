import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useEffect } from "react";
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
import OnboardingPage from "./pages/OnboardingPage";
import TikTokPage from "./pages/TikTokPage";
import TikTokAccountsPage from "./pages/TikTokAccountsPage";
import PaymentPage from "./pages/PaymentPage";
import AdminDashboardPage from "./pages/AdminDashboardPage";
import AdminUsersPage from "./pages/AdminUsersPage";
import AdminModelsPage from "./pages/AdminModelsPage";
import ModelsMarketplacePage from "./pages/ModelsMarketplacePage";
import AdminLoginPage from "./pages/AdminLoginPage";
import RequireAdmin from "./components/auth/RequireAdmin";
import { seedUsers } from "@/lib/userStore";
import { seedMarketplace } from "@/lib/marketplaceStore";

const queryClient = new QueryClient();

const App = () => {
  useEffect(() => {
    seedUsers();
    seedMarketplace();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
            <Route path="/onboarding" element={<OnboardingPage />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/billing" element={<BillingPage />} />
            <Route path="/payment" element={<PaymentPage />} />
            <Route path="/models" element={<ModelsMarketplacePage />} />
            <Route path="/telegram" element={<TelegramPage />} />
            <Route path="/destinations" element={<DestinationsPage />} />
            <Route path="/campaigns" element={<CampaignsPage />} />
            <Route path="/model-hub" element={<ModelHubPage />} />
            <Route path="/admin/login" element={<AdminLoginPage />} />
            <Route
              path="/admin"
              element={
                <RequireAdmin>
                  <AdminDashboardPage />
                </RequireAdmin>
              }
            />
            <Route
              path="/admin/users"
              element={
                <RequireAdmin>
                  <AdminUsersPage />
                </RequireAdmin>
              }
            />
            <Route
              path="/admin/models"
              element={
                <RequireAdmin>
                  <AdminModelsPage />
                </RequireAdmin>
              }
            />
            <Route
              path="/admin/telegram"
              element={
                <RequireAdmin>
                  <TelegramPage />
                </RequireAdmin>
              }
            />
            <Route
              path="/admin/tiktok"
              element={
                <RequireAdmin>
                  <TikTokPage />
                </RequireAdmin>
              }
            />
            <Route
              path="/admin/tiktok-accounts"
              element={
                <RequireAdmin>
                  <TikTokAccountsPage />
                </RequireAdmin>
              }
            />
            <Route
              path="/admin/library"
              element={
                <RequireAdmin>
                  <MediaLibraryPage />
                </RequireAdmin>
              }
            />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
