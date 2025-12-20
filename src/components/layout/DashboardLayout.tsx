import { ReactNode, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  Send,
  LayoutDashboard,
  CreditCard,
  MessageCircle,
  Target,
  Megaphone,
  Sparkles,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Bell,
  User,
  ShieldCheck,
  Users,
  Music2,
  ShoppingBag,
  Menu,
  Boxes,
  Library,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useToast } from "@/hooks/use-toast";
import { clearCurrentUser } from "@/lib/userStore";
import { clearAdminSession } from "@/lib/adminAuth";

interface DashboardLayoutProps {
  children: ReactNode;
}

const baseItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/dashboard" },
  { icon: CreditCard, label: "Billing", path: "/billing" },
  { icon: MessageCircle, label: "Telegram", path: "/telegram" },
  { icon: Target, label: "Destinos", path: "/destinations" },
  { icon: Megaphone, label: "Campanhas", path: "/campaigns" },
  { icon: Sparkles, label: "Model Hub", path: "/model-hub" },
  { icon: Boxes, label: "Modelos à venda", path: "/models" },
];

const adminItems = [
  { icon: ShieldCheck, label: "Dashboard Admin", path: "/admin" },
  { icon: Users, label: "Usuários", path: "/admin/users" },
  { icon: Boxes, label: "Modelos (Admin)", path: "/admin/models" },
  { icon: Music2, label: "TikTok", path: "/admin/tiktok" },
  { icon: ShoppingBag, label: "Contas TikTok", path: "/admin/tiktok-accounts" },
  { icon: Library, label: "Biblioteca", path: "/admin/library" },
  { icon: MessageCircle, label: "Telegram", path: "/admin/telegram" },
];

const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();

  const isAdminRoute = location.pathname.startsWith("/admin");

  const navItems = useMemo(() => {
    if (isAdminRoute) {
      return adminItems;
    }
    return baseItems;
  }, [isAdminRoute]);

  const titleItems = useMemo(() => [...baseItems, ...adminItems], []);

  const handleLogout = () => {
    if (isAdminRoute) {
      clearAdminSession();
      toast({
        title: "Sessão admin encerrada",
        description: "Você saiu do painel administrativo.",
      });
      navigate("/admin/login");
      return;
    }
    clearCurrentUser();
    toast({
      title: "Sessão encerrada",
      description: "Você saiu da sua conta com segurança.",
    });
    navigate("/login");
  };

  const handleProfileAction = (label: string, target?: string) => {
    if (target) {
      navigate(target);
      return;
    }
    toast({
      title: label,
      description: "Essa funcionalidade será liberada na próxima atualização.",
    });
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <aside
        className={cn(
          "fixed left-0 top-0 h-full bg-sidebar border-r border-sidebar-border z-40 transition-all duration-300 hidden md:block",
          collapsed ? "w-16" : "w-64"
        )}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="h-16 flex items-center justify-between px-4 border-b border-sidebar-border">
            <Link to="/dashboard" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg telegram-gradient flex items-center justify-center flex-shrink-0">
                <Send className="w-4 h-4 text-white" />
              </div>
              {!collapsed && (
                <span className="font-bold text-sidebar-foreground">MediaDrop</span>
              )}
            </Link>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setCollapsed(!collapsed)}
              className="text-sidebar-foreground hover:bg-sidebar-accent"
            >
              {collapsed ? (
                <ChevronRight className="w-4 h-4" />
              ) : (
                <ChevronLeft className="w-4 h-4" />
              )}
            </Button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200",
                    isActive
                      ? "bg-sidebar-primary text-sidebar-primary-foreground"
                      : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                  )}
                >
                  <item.icon className="w-5 h-5 flex-shrink-0" />
                  {!collapsed && <span className="text-sm font-medium">{item.label}</span>}
                </Link>
              );
            })}
          </nav>

          {/* Bottom Actions */}
          <div className="p-2 border-t border-sidebar-border space-y-1">
            <button
              onClick={() => handleProfileAction("Configurações")}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors"
            >
              <Settings className="w-5 h-5 flex-shrink-0" />
              {!collapsed && <span className="text-sm font-medium">Configurações</span>}
            </button>
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sidebar-foreground hover:bg-destructive/10 hover:text-destructive transition-colors w-full"
            >
              <LogOut className="w-5 h-5 flex-shrink-0" />
              {!collapsed && <span className="text-sm font-medium">Sair</span>}
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div
        className={cn(
          "flex-1 transition-all duration-300",
          collapsed ? "md:ml-16" : "md:ml-64"
        )}
      >
        {/* Top Bar */}
        <header className="h-16 border-b border-border bg-background/80 backdrop-blur-sm sticky top-0 z-30 flex items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden">
                  <Menu className="w-5 h-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="p-0 w-64">
                <nav className="p-4 space-y-2">
                  {navItems.map((item) => (
                    <Link
                      key={item.path}
                      to={item.path}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200",
                        location.pathname === item.path
                          ? "bg-sidebar-primary text-sidebar-primary-foreground"
                          : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                      )}
                    >
                      <item.icon className="w-5 h-5 flex-shrink-0" />
                      <span className="text-sm font-medium">{item.label}</span>
                    </Link>
                  ))}
                </nav>
              </SheetContent>
            </Sheet>

            <h1 className="text-lg font-semibold">
              {titleItems.find((item) => item.path === location.pathname)?.label || "Dashboard"}
            </h1>
          </div>

          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              className="relative"
              onClick={() =>
                toast({
                  title: "Notificações",
                  description: "Você está com todas as notificações em dia.",
                })
              }
            >
              <Bell className="w-5 h-5" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-telegram rounded-full" />
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full">
                  <div className="w-8 h-8 rounded-full bg-telegram/20 flex items-center justify-center">
                    <User className="w-4 h-4 text-telegram" />
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>Minha Conta</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={() => handleProfileAction("Perfil")}
                >
                  <User className="w-4 h-4 mr-2" />
                  Perfil
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => handleProfileAction("Assinatura", "/billing")}
                >
                  <CreditCard className="w-4 h-4 mr-2" />
                  Assinatura
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => handleProfileAction("Configurações")}
                >
                  <Settings className="w-4 h-4 mr-2" />
                  Configurações
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-destructive" onSelect={handleLogout}>
                  <LogOut className="w-4 h-4 mr-2" />
                  Sair
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
};

export default DashboardLayout;
