import { ReactNode, useState, useEffect, useMemo } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Send, LayoutDashboard, CreditCard, MessageCircle, Megaphone, Settings, LogOut, ChevronLeft, ChevronRight, Bell, BellOff, User, Shield, Menu, Crown, Headphones, GitBranch, MessageSquare, Plug, Wallet, Users, ShoppingBag, Store, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useAuth } from "@/contexts/AuthContext";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useSubscription } from "@/hooks/useSubscription";
import { useAdminSettings } from "@/hooks/useAdminSettings";
import { usePaymentNotifications } from "@/hooks/usePaymentNotifications";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface DashboardLayoutProps {
  children: ReactNode;
}
const SUPPORT_WHATSAPP = "+556282123402";
const DashboardLayout = ({
  children
}: DashboardLayoutProps) => {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const {
    signOut,
    isAdmin,
    isVendor,
    profile
  } = useAuth();
  const {
    hasActiveSubscription,
    currentPlan
  } = useSubscription();
  const { settings: adminSettings, isLoading: isLoadingSettings } = useAdminSettings();
  const { permissionStatus, isEnabled, toggleNotifications, isSupported } = usePaymentNotifications();
  // Build navigation items dynamically based on subscription status
  const getNavItems = () => {
    const items = [{
      icon: LayoutDashboard,
      label: "Dashboard",
      path: "/dashboard"
    }];
    
    // Pagamentos - right after Dashboard
    items.push({
      icon: Wallet,
      label: "Pagamentos",
      path: "/payments"
    });

    // Show "Planos" only if user doesn't have an active subscription
    // Show "Meu Plano" if user has an active subscription
    if (hasActiveSubscription()) {
      items.push({
        icon: Crown,
        label: `Plano ${currentPlan?.name || "Ativo"}`,
        path: "/billing"
      });
    } else {
      items.push({
        icon: CreditCard,
        label: "Planos",
        path: "/billing"
      });
    }
    
    items.push({
      icon: MessageCircle,
      label: "Telegram",
      path: "/telegram"
    });
    
    // Only show Funis if enabled by admin
    if (adminSettings.funnels_enabled) {
      items.push({
        icon: GitBranch,
        label: "Funis",
        path: "/funnels"
      });
    }
    
    // Only show WhatsApp if enabled by admin
    if (adminSettings.whatsapp_enabled) {
      items.push({
        icon: MessageSquare,
        label: "WhatsApp",
        path: "/whatsapp"
      });
    }
    
    // Only show Accounts if any account type is enabled
    if (adminSettings.tiktok_enabled || adminSettings.models_enabled) {
      items.push({
        icon: Users,
        label: "Contas",
        path: "/accounts"
      });
    }
    
    // Only show Telegram Groups if enabled by admin
    if (adminSettings.telegram_groups_enabled) {
      items.push({
        icon: MessageCircle,
        label: "Grupos Telegram",
        path: "/telegram-groups"
      });
    }
    
    // Minhas Entregas (produtos comprados)
    items.push({
      icon: Package,
      label: "Minhas Entregas",
      path: "/delivery"
    });
    
    // Integrações - before Admin
    items.push({
      icon: Plug,
      label: "Integrações",
      path: "/integrations"
    });
    
    return items;
  };
  
  // Only compute nav items when settings are loaded to prevent flash
  const navItems = useMemo(() => {
    if (isLoadingSettings) return [];
    return getNavItems();
  }, [hasActiveSubscription, currentPlan, adminSettings, isLoadingSettings]);

  // Admin-only items
  const adminItems = [{
    icon: Shield,
    label: "Admin",
    path: "/admin"
  }];

  // Vendor-only items
  const vendorItems = [{
    icon: Store,
    label: "Revendedor",
    path: "/reseller"
  }];

  const allNavItems = [
    ...navItems,
    ...(isVendor || isAdmin ? vendorItems : []),
    ...(isAdmin ? adminItems : [])
  ];
  const handleSignOut = async () => {
    await signOut();
    navigate("/login");
  };
  const openSupport = () => {
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const phoneNumber = SUPPORT_WHATSAPP.replace('+', '');
    if (isMobile) {
      // Opens WhatsApp app on mobile devices
      window.location.href = `whatsapp://send?phone=${phoneNumber}`;
    } else {
      // Opens WhatsApp Web on desktop
      window.open(`https://web.whatsapp.com/send?phone=${phoneNumber}`, "_blank", "noopener,noreferrer");
    }
  };
  const NavContent = ({
    onItemClick
  }: {
    onItemClick?: () => void;
  }) => <>
      {/* Logo */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-sidebar-border">
        <Link to="/dashboard" className="flex items-center gap-2" onClick={onItemClick}>
          <img src="/logo-nexo.png" alt="Nexo" className="" />
          {!collapsed && <span className="font-bold text-sidebar-foreground">​</span>}
        </Link>
        <Button variant="ghost" size="icon" onClick={() => setCollapsed(!collapsed)} className="text-sidebar-foreground hover:bg-sidebar-accent hidden lg:flex">
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
        {allNavItems.map(item => {
        const isActive = location.pathname === item.path;
        return <Link key={item.path} to={item.path} onClick={onItemClick} className={cn("flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200", isActive ? "bg-sidebar-primary text-sidebar-primary-foreground" : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground")}>
              <item.icon className="w-5 h-5 flex-shrink-0" />
              {!collapsed && <span className="text-sm font-medium">{item.label}</span>}
            </Link>;
      })}
      </nav>

      {/* Bottom Actions */}
      <div className="p-2 border-t border-sidebar-border space-y-1">
        {/* Support Button */}
        <button onClick={() => {
        onItemClick?.();
        openSupport();
      }} className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sidebar-foreground hover:bg-success/10 hover:text-success transition-colors w-full">
          <Headphones className="w-5 h-5 flex-shrink-0" />
          {!collapsed && <span className="text-sm font-medium">Suporte</span>}
        </button>
        <Link to="/settings" onClick={onItemClick} className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors">
          <Settings className="w-5 h-5 flex-shrink-0" />
          {!collapsed && <span className="text-sm font-medium">Configurações</span>}
        </Link>
        <button onClick={() => {
        onItemClick?.();
        handleSignOut();
      }} className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sidebar-foreground hover:bg-destructive/10 hover:text-destructive transition-colors w-full">
          <LogOut className="w-5 h-5 flex-shrink-0" />
          {!collapsed && <span className="text-sm font-medium">Sair</span>}
        </button>
      </div>
    </>;
  return <div className="min-h-screen bg-background flex">
      {/* Desktop Sidebar */}
      <aside className={cn("fixed left-0 top-0 h-full bg-sidebar border-r border-sidebar-border z-40 transition-all duration-300 hidden lg:flex flex-col", collapsed ? "w-16" : "w-64")}>
        <NavContent />
      </aside>

      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-background/80 backdrop-blur-sm border-b border-border z-40 flex items-center justify-between px-4">
        <Link to="/dashboard" className="flex items-center gap-2">
          <img src="/logo-nexo.png" alt="Nexo" className="h-10" />
        </Link>
        
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={openSupport} className="text-success">
            <Headphones className="w-5 h-5" />
          </Button>
          
          {isSupported && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={toggleNotifications}
                  className={cn(
                    "relative",
                    isEnabled && permissionStatus === 'granted' && "text-primary"
                  )}
                >
                  {isEnabled && permissionStatus === 'granted' ? (
                    <Bell className="w-5 h-5" />
                  ) : (
                    <BellOff className="w-5 h-5" />
                  )}
                  {isEnabled && permissionStatus === 'granted' && (
                    <span className="absolute top-1 right-1 w-2 h-2 bg-green-500 rounded-full" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                {isEnabled && permissionStatus === 'granted' 
                  ? 'Notificações de pagamento ativadas' 
                  : 'Ativar notificações de pagamento'}
              </TooltipContent>
            </Tooltip>
          )}
          
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="w-5 h-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-64 bg-sidebar">
              <div className="flex flex-col h-full">
                <NavContent onItemClick={() => setMobileOpen(false)} />
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      {/* Main Content */}
      <div className={cn("flex-1 transition-all duration-300", "lg:ml-64", collapsed && "lg:ml-16")}>
        {/* Desktop Top Bar */}
        <header className="h-16 border-b border-border bg-background/80 backdrop-blur-sm sticky top-0 z-30 hidden lg:flex items-center justify-between px-6">
          <h1 className="font-semibold text-4xl">
            {allNavItems.find(item => item.path === location.pathname)?.label || "Dashboard"}
          </h1>

          <div className="flex items-center gap-4">
            <Button variant="outline" size="sm" onClick={openSupport} className="text-success border-success/30 hover:bg-success/10">
              <Headphones className="w-4 h-4 mr-2" />
              Suporte
            </Button>
            {isSupported && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={toggleNotifications}
                    className={cn(
                      "relative",
                      isEnabled && permissionStatus === 'granted' && "text-primary"
                    )}
                  >
                    {isEnabled && permissionStatus === 'granted' ? (
                      <Bell className="w-5 h-5" />
                    ) : (
                      <BellOff className="w-5 h-5" />
                    )}
                    {isEnabled && permissionStatus === 'granted' && (
                      <span className="absolute top-1 right-1 w-2 h-2 bg-green-500 rounded-full" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  {isEnabled && permissionStatus === 'granted' 
                    ? 'Notificações de pagamento ativadas' 
                    : 'Ativar notificações de pagamento'}
                </TooltipContent>
              </Tooltip>
            )}

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full">
                  <div className="w-8 h-8 rounded-full bg-telegram/20 flex items-center justify-center">
                    <User className="w-4 h-4 text-telegram" />
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  {profile?.full_name || "Minha Conta"}
                  {isAdmin && <span className="ml-2 text-xs bg-telegram/20 text-telegram px-2 py-0.5 rounded-full">
                      Admin
                    </span>}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate("/settings")}>
                  <User className="w-4 h-4 mr-2" />
                  Perfil
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/billing")}>
                  <CreditCard className="w-4 h-4 mr-2" />
                  Assinatura
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/settings")}>
                  <Settings className="w-4 h-4 mr-2" />
                  Configurações
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-destructive" onClick={handleSignOut}>
                  <LogOut className="w-4 h-4 mr-2" />
                  Sair
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-4 md:p-6 pt-20 lg:pt-6">{children}</main>
      </div>
    </div>;
};
export default DashboardLayout;