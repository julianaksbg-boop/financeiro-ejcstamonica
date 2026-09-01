import { Link, Outlet, createFileRoute, useLocation, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { LayoutDashboard, Receipt, CalendarRange, HandCoins, FileBarChart, LogOut, Bell, Menu, ShieldCheck, Clock, Lock, ListTree } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import ejcLogo from "@/assets/ejc-logo-vermelho.png.asset.json";

export const Route = createFileRoute("/_app")({
  component: AppLayout,
});

const baseNav = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard, permission: null },
  { to: "/movimentacoes", label: "Central de movimentações", icon: Receipt, permission: "movimentacoes" },
  { to: "/plano-de-contas", label: "Plano de Contas", icon: ListTree, permission: null },
  { to: "/adiantamentos", label: "Adiantamentos", icon: HandCoins, permission: null },
  { to: "/eventos", label: "Eventos", icon: CalendarRange, permission: null },
  { to: "/relatorios", label: "Relatórios", icon: FileBarChart, permission: null },
] as const;

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const { pathname } = useLocation();
  const { user, profile, role, permissions, hasPermission, isAdmin, signOut } = useAuth();
  const items = baseNav.filter((i) => !i.permission || hasPermission(i.permission));
  return (
    <div className="flex flex-col h-full bg-sidebar text-sidebar-foreground">
      <div className="px-5 py-6 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="size-11 rounded-lg bg-white border border-sidebar-border flex items-center justify-center overflow-hidden shadow-card">
            <img src={ejcLogo.url} alt="EJC Santa Mônica e Santa Elena Guerra" className="size-9 object-contain" />
          </div>
          <div>
            <p className="font-bold tracking-tight">Financeiro EJC</p>
            <p className="text-[11px] text-sidebar-foreground/60">Gestão financeira</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {items.map(({ to, label, icon: Icon }) => {
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

        {isAdmin && (
          <>
            <div className="pt-4 pb-1 px-3 text-[10px] uppercase tracking-wider text-sidebar-foreground/40">Configurações</div>
            <Link
              to="/administracao"
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                pathname.startsWith("/administracao")
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground/75 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground"
              )}
            >
              <ShieldCheck className="size-4" />
              Administração
              {pathname.startsWith("/administracao") && <span className="ml-auto size-1.5 rounded-full bg-sidebar-primary" />}
            </Link>
          </>
        )}
      </nav>

      <div className="p-3 border-t border-sidebar-border">
        <div className="flex items-center gap-3 px-2 py-2 rounded-lg">
          <div className="size-9 rounded-full bg-sidebar-accent flex items-center justify-center text-sm font-semibold">
            {(profile?.full_name?.[0] ?? user?.email?.[0] ?? "A").toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium truncate">{profile?.full_name ?? user?.email ?? "Admin"}</p>
            <p className="text-[10px] text-sidebar-foreground/60">
              {role === "admin"
                ? "Administrador financeiro"
                : role === "viewer"
                  ? permissions.length > 0
                    ? `Visualizador · ${permissions.length} permissão${permissions.length > 1 ? "es" : ""}`
                    : "Visualizador"
                  : "—"}
            </p>
          </div>
          <button onClick={() => signOut()} className="text-sidebar-foreground/60 hover:text-sidebar-accent-foreground p-1.5 rounded">
            <LogOut className="size-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

function AccessGate({ status }: { status: "pending" | "blocked" | "no-role" | "missing-profile" | "profile-error" }) {
  const { signOut, user } = useAuth();
  const config = {
    pending: {
      icon: Clock,
      title: "Aguardando aprovação",
      msg: "Sua conta foi criada e está pendente de aprovação por um administrador financeiro. Você receberá acesso assim que for ativada.",
      tone: "bg-gold/10 text-gold-foreground",
    },
    blocked: {
      icon: Lock,
      title: "Acesso bloqueado",
      msg: "Sua conta foi bloqueada. Entre em contato com a coordenação do EJC para mais informações.",
      tone: "bg-destructive/10 text-destructive",
    },
    "no-role": {
      icon: Lock,
      title: "Sem permissões atribuídas",
      msg: "Sua conta ainda não possui um perfil de acesso configurado. Solicite ao administrador.",
      tone: "bg-muted text-muted-foreground",
    },
    "missing-profile": {
      icon: Lock,
      title: "Cadastro incompleto",
      msg: "Não encontramos o cadastro de acesso desta conta. Solicite ao administrador para revisar seu usuário no painel de administração.",
      tone: "bg-muted text-muted-foreground",
    },
    "profile-error": {
      icon: Lock,
      title: "Não foi possível carregar o acesso",
      msg: "Tente entrar novamente. Se o problema continuar, solicite ao administrador para revisar seu usuário.",
      tone: "bg-destructive/10 text-destructive",
    },
  }[status];
  const Icon = config.icon;
  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-gradient-surface">
      <Card className="max-w-md w-full shadow-elevated">
        <CardContent className="p-8 text-center space-y-4">
          <div className={cn("size-16 rounded-full mx-auto flex items-center justify-center", config.tone)}>
            <Icon className="size-8" />
          </div>
          <div>
            <h1 className="text-xl font-bold">{config.title}</h1>
            <p className="text-sm text-muted-foreground mt-2">{config.msg}</p>
          </div>
          {user?.email && <p className="text-xs text-muted-foreground">Conta: <span className="font-medium">{user.email}</span></p>}
          <Button variant="outline" onClick={() => signOut()} className="w-full">Sair</Button>
        </CardContent>
      </Card>
    </div>
  );
}

function AppLayout() {
  const { user, loading, profile, role, permissions, profileLoaded, profileError } = useAuth();
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

  if (!profileLoaded) {
    return <div className="min-h-screen flex items-center justify-center text-sm text-muted-foreground">Carregando perfil...</div>;
  }
  if (profileError) return <AccessGate status="profile-error" />;
  if (!profile) return <AccessGate status="missing-profile" />;
  if (profile.status === "pending") return <AccessGate status="pending" />;
  if (profile.status === "blocked") return <AccessGate status="blocked" />;
  if (!role) return <AccessGate status="no-role" />;

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
            {role === "viewer" && permissions.length === 0 && (
              <span className="hidden md:inline-flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1 rounded-full bg-muted text-muted-foreground border">
                <Lock className="size-3" /> Modo somente leitura
              </span>
            )}
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
