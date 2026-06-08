import { Link, Outlet, createFileRoute, useLocation, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { LayoutDashboard, Receipt, CalendarRange, HandCoins, Upload, FileBarChart, LogOut, Wallet, Bell, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_app")({
  component: AppLayout,
});

const navItems = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/movimentacoes", label: "Movimentações", icon: Receipt },
  { to: "/importar", label: "Importar extrato", icon: Upload },
  { to: "/adiantamentos", label: "Adiantamentos", icon: HandCoins },
  { to: "/eventos", label: "Eventos", icon: CalendarRange },
  { to: "/relatorios", label: "Relatórios", icon: FileBarChart },
] as const;

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const { pathname } = useLocation();
  const { user, signOut } = useAuth();
  return (
    <div className="flex flex-col h-full bg-sidebar text-sidebar-foreground">
      <div className="px-5 py-6 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="size-10 rounded-lg bg-gradient-primary flex items-center justify-center">
            <Wallet className="size-5 text-primary-foreground" />
          </div>
          <div>
            <p className="font-bold tracking-tight">Financeiro EJC</p>
            <p className="text-[11px] text-sidebar-foreground/60">Gestão financeira</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map(({ to, label, icon: Icon }) => {
          const active = pathname.startsWith(to);
          return (
            <Link
              key={to}
              to={to}
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                active
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground/75 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground"
              )}
            >
              <Icon className="size-4" />
              {label}
              {active && <span className="ml-auto size-1.5 rounded-full bg-sidebar-primary" />}
            </Link>
          );
        })}
      </nav>

      <div className="p-3 border-t border-sidebar-border">
        <div className="flex items-center gap-3 px-2 py-2 rounded-lg">
          <div className="size-9 rounded-full bg-sidebar-accent flex items-center justify-center text-sm font-semibold">
            {(user?.email?.[0] ?? "A").toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium truncate">{user?.email ?? "Admin"}</p>
            <p className="text-[10px] text-sidebar-foreground/60">Administrador financeiro</p>
          </div>
          <button onClick={() => signOut()} className="text-sidebar-foreground/60 hover:text-sidebar-accent-foreground p-1.5 rounded">
            <LogOut className="size-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

function AppLayout() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth" });
  }, [user, loading, navigate]);

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-sm text-muted-foreground">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-background">
      <aside className="hidden lg:flex w-64 shrink-0">
        <SidebarContent />
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-14 border-b bg-card flex items-center justify-between px-4 lg:px-6 sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="lg:hidden">
                  <Menu className="size-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="p-0 w-64">
                <SidebarContent />
              </SheetContent>
            </Sheet>
            <p className="text-sm text-muted-foreground hidden md:block">
              Exercício <span className="font-semibold text-foreground">2025</span>
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="size-4" />
              <span className="absolute top-2 right-2 size-2 rounded-full bg-destructive" />
            </Button>
          </div>
        </header>

        <main className="flex-1 p-4 lg:p-8 overflow-x-hidden">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
