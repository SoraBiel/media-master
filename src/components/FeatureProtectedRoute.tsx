import { Navigate } from "react-router-dom";
import { useAdminSettings, AdminSettings } from "@/hooks/useAdminSettings";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";

interface FeatureProtectedRouteProps {
  children: React.ReactNode;
  featureKey: keyof AdminSettings;
  redirectTo?: string;
}

const FeatureProtectedRoute = ({
  children,
  featureKey,
  redirectTo = "/dashboard",
}: FeatureProtectedRouteProps) => {
  const { settings, isLoading } = useAdminSettings();
  const { isAdmin } = useAuth();

  // Always allow admin access
  if (isAdmin) {
    return <>{children}</>;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Check if feature is enabled
  if (!settings[featureKey]) {
    return <Navigate to={redirectTo} replace />;
  }

  return <>{children}</>;
};

export default FeatureProtectedRoute;
