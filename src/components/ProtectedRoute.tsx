import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
  requireVendor?: boolean;
  requireAccountManager?: boolean;
}

export const ProtectedRoute = ({ 
  children, 
  requireAdmin = false, 
  requireVendor = false,
  requireAccountManager = false 
}: ProtectedRouteProps) => {
  const { user, isAdmin, isVendor, isAccountManager, isLoading, profile } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-telegram/20 flex items-center justify-center">
            <div className="w-6 h-6 rounded-full bg-telegram animate-ping" />
          </div>
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requireAdmin && !isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  if (requireVendor && !isVendor && !isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  if (requireAccountManager && !isAccountManager && !isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  // Check if onboarding is needed
  if (profile && !profile.onboarding_completed && location.pathname !== "/onboarding") {
    return <Navigate to="/onboarding" replace />;
  }

  return <>{children}</>;
};
