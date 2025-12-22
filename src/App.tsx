import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import DashboardPage from "./pages/DashboardPage";
import BillingPage from "./pages/BillingPage";
import TelegramPage from "./pages/TelegramPage";
import DestinationsPage from "./pages/DestinationsPage";
import CampaignsPage from "./pages/CampaignsPage";
import ModelHubPage from "./pages/ModelHubPage";
import OnboardingPage from "./pages/OnboardingPage";
import CheckoutPage from "./pages/CheckoutPage";
import ThankYouPage from "./pages/ThankYouPage";
import TikTokAccountsPage from "./pages/TikTokAccountsPage";
import AdminDashboardPage from "./pages/AdminDashboardPage";
import SettingsPage from "./pages/SettingsPage";
import DeliveryPage from "./pages/DeliveryPage";
import UserDetailsPage from "./pages/UserDetailsPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
            <Route path="/onboarding" element={<ProtectedRoute><OnboardingPage /></ProtectedRoute>} />
            <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
            <Route path="/billing" element={<ProtectedRoute><BillingPage /></ProtectedRoute>} />
            <Route path="/telegram" element={<ProtectedRoute><TelegramPage /></ProtectedRoute>} />
            <Route path="/destinations" element={<ProtectedRoute><DestinationsPage /></ProtectedRoute>} />
            <Route path="/campaigns" element={<ProtectedRoute><CampaignsPage /></ProtectedRoute>} />
            <Route path="/model-hub" element={<ProtectedRoute><ModelHubPage /></ProtectedRoute>} />
            <Route path="/tiktok-accounts" element={<ProtectedRoute><TikTokAccountsPage /></ProtectedRoute>} />
            <Route path="/checkout" element={<ProtectedRoute><CheckoutPage /></ProtectedRoute>} />
            <Route path="/thank-you" element={<ProtectedRoute><ThankYouPage /></ProtectedRoute>} />
            <Route path="/delivery" element={<ProtectedRoute><DeliveryPage /></ProtectedRoute>} />
            <Route path="/admin" element={<ProtectedRoute requireAdmin><AdminDashboardPage /></ProtectedRoute>} />
            <Route path="/admin/user/:userId" element={<ProtectedRoute requireAdmin><UserDetailsPage /></ProtectedRoute>} />
            <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
