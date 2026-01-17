import { ReactNode, useState, useEffect, useMemo } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { LayoutDashboard, CreditCard, MessageCircle, Settings, LogOut, ChevronLeft, ChevronRight, Bell, BellOff, User, Shield, Menu, Crown, Headphones, GitBranch, MessageSquare, Plug, Wallet, Users, Store, Package, Share2, Link2, Gift, ShoppingBag, Fingerprint, Eye, BarChart3 } from "lucide-react";
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
    isIndicador,
    profile
  } = useAuth();
  const {
    hasActiveSubscription,
    currentPlan
  } = useSubscription();
  const {
    settings: adminSettings,
    isLoading: isLoadingSettings
  } = useAdminSettings();
  const {
    permissionStatus,
    isEnabled,
    toggleNotifications,
    isSupported
  } = usePaymentNotifications();
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
        icon: ShoppingBag,
        label: "Loja",
        path: "/accounts"
      });
    }

    // Telegram Groups is now inside the Store tab, removed from sidebar

    // Minhas Entregas (produtos comprados)
    items.push({
      icon: Package,
      label: "Minhas Entregas",
      path: "/delivery"
    });

    // Automação de Publicações - logo após Minhas Entregas
    if (adminSettings.automation_module_enabled) {
      items.push({
        icon: Share2,
        label: "Automação",
        path: "/publication-automation"
      });
    }

    // Smart Links
    if (adminSettings.smart_links_enabled) {
      items.push({
        icon: Link2,
        label: "Smart Links",
        path: "/smart-links"
      });
    }

    // Multilogin
    if (adminSettings.multilogin_enabled) {
      items.push({
        icon: Fingerprint,
        label: "Multilogin",
        path: "/multilogin"
      });
    }

    // Cloaker
    if (adminSettings.cloaker_enabled) {
      items.push({
        icon: Eye,
        label: "Cloaker",
        path: "/cloaker"
      });
    }

    // UTM Tracking
    if (adminSettings.utm_tracking_enabled) {
      items.push({
        icon: BarChart3,
        label: "UTM Tracking",
        path: "/utm-tracking"
      });
    }

    // Indique & Ganhe - only show for users with 'indicador' role
    // This is controlled separately via the indicadorItems below

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

  // Indicador-only items (single unified page)
  const indicadorItems = [
    {
      icon: Gift,
      label: "Indique & Ganhe",
      path: "/referrals"
    }
  ];
  const allNavItems = [...navItems, ...((isIndicador || isAdmin) ? indicadorItems : []), ...(isVendor || isAdmin ? vendorItems : []), ...(isAdmin ? adminItems : [])];
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
    onItemClick,
    isMobile = false
  }: {
    onItemClick?: () => void;
    isMobile?: boolean;
  }) => {
    const showLabels = isMobile || !collapsed;
    return <>
        {/* Logo */}
        <div className="h-14 flex items-center justify-between px-3 border-b border-sidebar-border">
          <Link to="/dashboard" className="flex items-center" onClick={onItemClick}>
            <img src="/logo-nexo.png" alt="Nexo" className="" />
          </Link>
          {!isMobile && <Button variant="ghost" size="icon-sm" onClick={() => setCollapsed(!collapsed)} className="text-sidebar-foreground hover:bg-sidebar-accent">
              {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </Button>}
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-2 space-y-0.5 overflow-y-auto">
          {allNavItems.map(item => {
          const isActive = location.pathname === item.path;
          return <Link key={item.path} to={item.path} onClick={onItemClick} className={cn("flex items-center gap-3 px-3 py-2.5 rounded-md transition-all duration-150", isActive ? "bg-primary/15 text-primary border-l-2 border-primary" : "text-sidebar-foreground hover:bg-sidebar-accent/80 hover:text-sidebar-accent-foreground border-l-2 border-transparent")}>
                <item.icon className={cn("flex-shrink-0", showLabels ? "w-4 h-4" : "w-5 h-5")} />
                {showLabels && <span className="text-sm font-medium truncate">{item.label}</span>}
              </Link>;
        })}
        </nav>

        {/* Bottom Actions */}
        <div className="p-2 border-t border-sidebar-border space-y-0.5">
          <button onClick={() => {
          onItemClick?.();
          openSupport();
        }} className="flex items-center gap-3 px-3 py-2.5 rounded-md text-sidebar-foreground hover:bg-success/10 hover:text-success transition-colors w-full">
            <Headphones className={cn("flex-shrink-0", showLabels ? "w-4 h-4" : "w-5 h-5")} />
            {showLabels && <span className="text-sm font-medium">Suporte</span>}
          </button>
          <Link to="/settings" onClick={onItemClick} className="flex items-center gap-3 px-3 py-2.5 rounded-md text-sidebar-foreground hover:bg-sidebar-accent/80 hover:text-sidebar-accent-foreground transition-colors">
            <Settings className={cn("flex-shrink-0", showLabels ? "w-4 h-4" : "w-5 h-5")} />
            {showLabels && <span className="text-sm font-medium">Configurações</span>}
          </Link>
          <button onClick={() => {
          onItemClick?.();
          handleSignOut();
        }} className="flex items-center gap-3 px-3 py-2.5 rounded-md text-sidebar-foreground hover:bg-destructive/10 hover:text-destructive transition-colors w-full">
            <LogOut className={cn("flex-shrink-0", showLabels ? "w-4 h-4" : "w-5 h-5")} />
            {showLabels && <span className="text-sm font-medium">Sair</span>}
          </button>
        </div>
      </>;
  };
  return <div className="min-h-screen bg-background flex">
      {/* Desktop Sidebar */}
      <aside className={cn("fixed left-0 top-0 h-full bg-sidebar border-r border-sidebar-border z-40 transition-all duration-200 hidden lg:flex flex-col", collapsed ? "w-16" : "w-56")}>
        <NavContent />
      </aside>

      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-14 bg-background/95 backdrop-blur-md border-b border-border z-40 flex items-center justify-between px-3 safe-area-inset">
        <Link to="/dashboard" className="flex items-center">
          <img src="/logo-nexo.png" alt="Nexo" className="h-8" />
        </Link>
        
        <div className="flex items-center gap-1">
          {isSupported && <Button variant="ghost" size="icon-sm" onClick={toggleNotifications} className={cn("relative", isEnabled && permissionStatus === 'granted' && "text-primary")}>
              {isEnabled && permissionStatus === 'granted' ? <Bell className="w-4 h-4" /> : <BellOff className="w-4 h-4" />}
              {isEnabled && permissionStatus === 'granted' && <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-success rounded-full" />}
            </Button>}
          
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon-sm">
                <Menu className="w-5 h-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-72 bg-sidebar border-r-0">
              <div className="flex flex-col h-full">
                <NavContent onItemClick={() => setMobileOpen(false)} isMobile />
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      {/* Main Content */}
      <div className={cn("flex-1 transition-all duration-200", "lg:ml-56", collapsed && "lg:ml-16")}>
        {/* Desktop Top Bar */}
        <header className="h-14 border-b border-border bg-background/95 backdrop-blur-md sticky top-0 z-30 hidden lg:flex items-center justify-between px-6">
          <h1 className="font-semibold text-lg">
            {allNavItems.find(item => item.path === location.pathname)?.label || "Dashboard"}
          </h1>

          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" onClick={openSupport} className="text-success border-success/30 hover:bg-success/10 hover:border-success/50">
              <Headphones className="w-4 h-4 mr-1.5" />
              Suporte
            </Button>
            
            {isSupported && <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon-sm" onClick={toggleNotifications} className={cn("relative", isEnabled && permissionStatus === 'granted' && "text-primary")}>
                    {isEnabled && permissionStatus === 'granted' ? <Bell className="w-4 h-4" /> : <BellOff className="w-4 h-4" />}
                    {isEnabled && permissionStatus === 'granted' && <span className="absolute top-0.5 right-0.5 w-1.5 h-1.5 bg-success rounded-full" />}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  {isEnabled && permissionStatus === 'granted' ? 'Notificações ativadas' : 'Ativar notificações'}
                </TooltipContent>
              </Tooltip>}

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon-sm" className="rounded-full">
                  <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="w-3.5 h-3.5 text-primary" />
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52">
                <DropdownMenuLabel className="flex items-center gap-2">
                  <span className="truncate">{profile?.full_name || "Minha Conta"}</span>
                  {isAdmin && <span className="text-2xs bg-primary/15 text-primary px-1.5 py-0.5 rounded-full font-medium">
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
                <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={handleSignOut}>
                  <LogOut className="w-4 h-4 mr-2" />
                  Sair
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-3 sm:p-4 md:p-6 pt-[4.5rem] lg:pt-4 page-transition">{children}</main>
      </div>
    </div>;
};
export default DashboardLayout;