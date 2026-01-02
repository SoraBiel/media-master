import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { BackgroundUploadProvider } from "@/contexts/BackgroundUploadContext";
import { BackgroundUploadIndicator } from "@/components/BackgroundUploadIndicator";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import FeatureProtectedRoute from "@/components/FeatureProtectedRoute";
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import DashboardPage from "./pages/DashboardPage";
import BillingPage from "./pages/BillingPage";
import TelegramHubPage from "./pages/TelegramHubPage";
import AccountsPage from "./pages/AccountsPage";
import OnboardingPage from "./pages/OnboardingPage";
import CheckoutPage from "./pages/CheckoutPage";
import ThankYouPage from "./pages/ThankYouPage";
import TelegramGroupsPage from "./pages/TelegramGroupsPage";
import FunnelsPage from "./pages/FunnelsPage";
import FunnelBuilderPage from "./pages/FunnelBuilderPage";
import WhatsAppPage from "./pages/WhatsAppPage";
import AdminDashboardPage from "./pages/AdminDashboardPage";
import ResellerPage from "./pages/ResellerPage";
import SettingsPage from "./pages/SettingsPage";
import DeliveryPage from "./pages/DeliveryPage";
import UserDetailsPage from "./pages/UserDetailsPage";
import IntegrationsPage from "./pages/IntegrationsPage";
import PaymentsPage from "./pages/PaymentsPage";
import MyPurchasesPage from "./pages/MyPurchasesPage";
import PublicationAutomationPage from "./pages/PublicationAutomationPage";
import SmartLinksPage from "./pages/SmartLinksPage";
import SmartLinkEditorPage from "./pages/SmartLinkEditorPage";
import SmartLinkPublicPage from "./pages/SmartLinkPublicPage";
import ReferralsPage from "./pages/ReferralsPage";
import ReferralRedirectPage from "./pages/ReferralRedirectPage";
import NotFound from "./pages/NotFound";
import { Navigate } from "react-router-dom";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <BackgroundUploadProvider>
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/signup" element={<SignupPage />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />
              <Route path="/reset-password" element={<ResetPasswordPage />} />
              <Route path="/onboarding" element={<ProtectedRoute><OnboardingPage /></ProtectedRoute>} />
              <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
              <Route path="/billing" element={<ProtectedRoute><BillingPage /></ProtectedRoute>} />
              <Route path="/telegram" element={<ProtectedRoute><TelegramHubPage /></ProtectedRoute>} />
              <Route path="/accounts" element={<ProtectedRoute><AccountsPage /></ProtectedRoute>} />
              <Route path="/telegram-groups" element={
                <ProtectedRoute>
                  <FeatureProtectedRoute featureKey="telegram_groups_enabled">
                    <TelegramGroupsPage />
                  </FeatureProtectedRoute>
                </ProtectedRoute>
              } />
              <Route path="/funnels" element={
                <ProtectedRoute>
                  <FeatureProtectedRoute featureKey="funnels_enabled">
                    <FunnelsPage />
                  </FeatureProtectedRoute>
                </ProtectedRoute>
              } />
              <Route path="/funnels/:funnelId" element={
                <ProtectedRoute>
                  <FeatureProtectedRoute featureKey="funnels_enabled">
                    <FunnelBuilderPage />
                  </FeatureProtectedRoute>
                </ProtectedRoute>
              } />
              <Route path="/checkout" element={<ProtectedRoute><CheckoutPage /></ProtectedRoute>} />
              <Route path="/thank-you" element={<ProtectedRoute><ThankYouPage /></ProtectedRoute>} />
              <Route path="/delivery" element={<ProtectedRoute><DeliveryPage /></ProtectedRoute>} />
              <Route path="/admin" element={<ProtectedRoute requireAdmin><AdminDashboardPage /></ProtectedRoute>} />
              <Route path="/admin/user/:userId" element={<ProtectedRoute requireAdmin><UserDetailsPage /></ProtectedRoute>} />
              <Route path="/reseller" element={<ProtectedRoute requireVendor><ResellerPage /></ProtectedRoute>} />
              <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
              <Route path="/integrations" element={<ProtectedRoute><IntegrationsPage /></ProtectedRoute>} />
              <Route path="/payments" element={<ProtectedRoute><PaymentsPage /></ProtectedRoute>} />
              <Route path="/my-purchases" element={<ProtectedRoute><MyPurchasesPage /></ProtectedRoute>} />
              <Route path="/publication-automation" element={
                <ProtectedRoute>
                  <FeatureProtectedRoute featureKey="automation_module_enabled">
                    <PublicationAutomationPage />
                  </FeatureProtectedRoute>
                </ProtectedRoute>
              } />
              <Route path="/smart-links" element={
                <ProtectedRoute>
                  <FeatureProtectedRoute featureKey="smart_links_enabled">
                    <SmartLinksPage />
                  </FeatureProtectedRoute>
                </ProtectedRoute>
              } />
              <Route path="/smart-links/:pageId" element={
                <ProtectedRoute>
                  <FeatureProtectedRoute featureKey="smart_links_enabled">
                    <SmartLinkEditorPage />
                  </FeatureProtectedRoute>
                </ProtectedRoute>
              } />
              <Route path="/@:slug" element={<SmartLinkPublicPage />} />
              <Route path="/referrals" element={
                <ProtectedRoute>
                  <FeatureProtectedRoute featureKey="referrals_enabled">
                    <ReferralsPage />
                  </FeatureProtectedRoute>
                </ProtectedRoute>
              } />
              {/* Redirect old /indicador to /referrals */}
              <Route path="/indicador" element={<Navigate to="/referrals" replace />} />
              <Route path="/r/:code" element={<ReferralRedirectPage />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
            <BackgroundUploadIndicator />
          </BackgroundUploadProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
