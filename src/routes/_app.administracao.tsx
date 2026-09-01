import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState, useCallback } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Check, X, Lock, Shield, Eye, Trash2, ShieldCheck, Search, UserPlus, Mail, SlidersHorizontal, Send } from "lucide-react";
import { toast } from "sonner";
import { InviteDialog } from "@/components/administracao/invite-dialog";
import { resendInvite } from "@/lib/api/usuarios.functions";
import { APP_PERMISSIONS, PERMISSION_LABEL, type AppPermission } from "@/lib/permissoes";

export const Route = createFileRoute("/_app/administracao")({
  head: () => ({
    meta: [
      { title: "Administração — Financeiro EJC" },
      { name: "description", content: "Gestão de usuários, convites e permissões do sistema financeiro do EJC." },
    ],
  }),
  component: AdminPage,
});

type UserStatus = "pending" | "active" | "blocked";
type AppRole = "admin" | "viewer";
type InviteStatus = "pending" | "accepted" | "cancelled";

interface UserRow {
  id: string;
  email: string;
  full_name: string | null;
  status: UserStatus;
  created_at: string;
  approved_at: string | null;
  approved_by: string | null;
  approver_email?: string | null;
  role: AppRole | null;
  permissions: AppPermission[];
}

interface InviteRow {
  id: string;
  email: string;
  full_name: string | null;
  role: AppRole;
  permissions: AppPermission[];
  status: InviteStatus;
  created_at: string;
}

const STATUS_LABEL: Record<UserStatus, { label: string; className: string }> = {
  pending: { label: "Pendente", className: "bg-gold/15 text-gold-foreground border-gold/30" },
  active: { label: "Ativo", className: "bg-emerald-500/15 text-emerald-700 border-emerald-500/30" },
  blocked: { label: "Bloqueado", className: "bg-destructive/15 text-destructive border-destructive/30" },
};

const INVITE_LABEL: Record<InviteStatus, { label: string; className: string }> = {
  pending: { label: "Aguardando aceite", className: "bg-gold/15 text-gold-foreground border-gold/30" },
  accepted: { label: "Aceito", className: "bg-emerald-500/15 text-emerald-700 border-emerald-500/30" },
  cancelled: { label: "Cancelado", className: "bg-muted text-muted-foreground" },
};

function AdminPage() {
  const { isAdmin, loading, user, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const resend = useServerFn(resendInvite);
  const [rows, setRows] = useState<UserRow[]>([]);
  const [invites, setInvites] = useState<InviteRow[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const [fetching, setFetching] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | UserStatus>("all");
  const [inviteOpen, setInviteOpen] = useState(false);

  useEffect(() => {
    if (!loading && !isAdmin) navigate({ to: "/dashboard" });
  }, [isAdmin, loading, navigate]);

  const load = useCallback(async () => {
    setFetching(true);
    const [{ data: profiles, error: pErr }, { data: roles, error: rErr }, { data: perms }, { data: inviteRows }] = await Promise.all([
      supabase.from("profiles").select("id,email,full_name,status,created_at,approved_at,approved_by").order("created_at", { ascending: false }),
      supabase.from("user_roles").select("user_id,role"),
      supabase.from("user_permissions").select("user_id,permission"),
      supabase.from("user_invites").select("id,email,full_name,role,permissions,status,created_at").order("created_at", { ascending: false }),
    ]);
    if (pErr) toast.error("Erro ao carregar usuários: " + pErr.message);
    if (rErr) toast.error("Erro ao carregar permissões: " + rErr.message);
    const roleByUser = new Map<string, AppRole>();
    (roles ?? []).forEach((r) => {
      const cur = roleByUser.get(r.user_id);
      if (!cur || r.role === "admin") roleByUser.set(r.user_id, r.role as AppRole);
    });
    const permsByUser = new Map<string, AppPermission[]>();
    (perms ?? []).forEach((p) => {
      const list = permsByUser.get(p.user_id) ?? [];
      list.push(p.permission as AppPermission);
      permsByUser.set(p.user_id, list);
    });
    const emailById = new Map<string, string>((profiles ?? []).map((p) => [p.id, p.email]));
    setRows((profiles ?? []).map((p) => ({
      id: p.id,
      email: p.email,
      full_name: p.full_name,
      status: p.status as UserStatus,
      created_at: p.created_at,
      approved_at: p.approved_at,
      approved_by: p.approved_by,
      approver_email: p.approved_by ? emailById.get(p.approved_by) ?? null : null,
      role: roleByUser.get(p.id) ?? null,
      permissions: permsByUser.get(p.id) ?? [],
    })));
    setInvites((inviteRows ?? []).map((i) => ({
      id: i.id,
      email: i.email,
      full_name: i.full_name,
      role: i.role as AppRole,
      permissions: (i.permissions ?? []) as AppPermission[],
      status: i.status as InviteStatus,
      created_at: i.created_at,
    })));
    setFetching(false);
  }, []);

  useEffect(() => { if (isAdmin) void load(); }, [isAdmin, load]);

  const setStatus = async (id: string, status: UserStatus) => {
    setBusy(id);
    const patch: { status: UserStatus; approved_at?: string | null; approved_by?: string | null } = { status };
    if (status === "active") {
      patch.approved_at = new Date().toISOString();
      patch.approved_by = user?.id ?? null;
    }
    const { error } = await supabase.from("profiles").update(patch).eq("id", id);
    setBusy(null);
    if (error) { toast.error(error.message); return; }
    toast.success("Status atualizado");
    void load();
  };

  const setRole = async (id: string, newRole: AppRole) => {
    setBusy(id);
    const { error: dErr } = await supabase.from("user_roles").delete().eq("user_id", id);
    if (dErr) { setBusy(null); toast.error(dErr.message); return; }
    const { error: iErr } = await supabase.from("user_roles").insert({ user_id: id, role: newRole });
    setBusy(null);
    if (iErr) { toast.error(iErr.message); return; }
    toast.success("Perfil atualizado");
    void load();
    if (id === user?.id) void refreshProfile();
  };

  const togglePermission = async (id: string, permission: AppPermission, granted: boolean) => {
    setBusy(id);
    const { error } = granted
      ? await supabase.from("user_permissions").insert({ user_id: id, permission, granted_by: user?.id ?? null })
      : await supabase.from("user_permissions").delete().eq("user_id", id).eq("permission", permission);
    setBusy(null);
    if (error) { toast.error(error.message); return; }
    setRows((cur) => cur.map((r) => r.id === id
      ? { ...r, permissions: granted ? [...r.permissions, permission] : r.permissions.filter((p) => p !== permission) }
      : r));
    if (id === user?.id) void refreshProfile();
  };

  const remove = async (id: string) => {
    if (id === user?.id) { toast.error("Você não pode excluir sua própria conta"); return; }
    if (!confirm("Excluir este usuário? Esta ação remove o perfil e bloqueia o acesso.")) return;
    setBusy(id);
    const { error } = await supabase.from("profiles").delete().eq("id", id);
    setBusy(null);
    if (error) { toast.error(error.message); return; }
    toast.success("Usuário removido");
    void load();
  };

  const cancelInvite = async (id: string) => {
    setBusy(id);
    const { error } = await supabase.from("user_invites").update({ status: "cancelled" }).eq("id", id);
    setBusy(null);
    if (error) { toast.error(error.message); return; }
    toast.success("Convite cancelado");
    void load();
  };

  const doResend = async (id: string) => {
    setBusy(id);
    try {
      await resend({ data: { inviteId: id, redirectTo: `${window.location.origin}/auth` } });
      toast.success("Convite reenviado");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Não foi possível reenviar");
    } finally {
      setBusy(null);
    }
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((r) => {
      if (statusFilter !== "all" && r.status !== statusFilter) return false;
      if (!q) return true;
      return r.email.toLowerCase().includes(q) || (r.full_name ?? "").toLowerCase().includes(q);
    });
  }, [rows, search, statusFilter]);

  if (loading || !isAdmin) {
    return <div className="text-sm text-muted-foreground">Verificando permissões...</div>;
  }

  const pendingCount = rows.filter((r) => r.status === "pending").length;
  const activeCount = rows.filter((r) => r.status === "active").length;
  const blockedCount = rows.filter((r) => r.status === "blocked").length;
  const pendingInvites = invites.filter((i) => i.status === "pending").length;

  return (
    <div className="space-y-6 max-w-7xl">
      <header className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <ShieldCheck className="size-6 text-primary" /> Administração
          </h1>
          <p className="text-sm text-muted-foreground">Gestão de usuários, convites e permissões do sistema</p>
        </div>
        <Button onClick={() => setInviteOpen(true)}>
          <UserPlus className="size-4" /> Convidar usuário
        </Button>
      </header>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Pendentes de aprovação" value={pendingCount} tone="gold" />
        <StatCard label="Usuários ativos" value={activeCount} tone="emerald" />
        <StatCard label="Bloqueados" value={blockedCount} tone="destructive" />
        <StatCard label="Convites em aberto" value={pendingInvites} tone="neutral" />
      </div>

      <Tabs defaultValue="usuarios">
        <TabsList>
          <TabsTrigger value="usuarios">Usuários</TabsTrigger>
          <TabsTrigger value="convites">Convites {pendingInvites > 0 && `(${pendingInvites})`}</TabsTrigger>
        </TabsList>

        <TabsContent value="usuarios" className="mt-4">
          <Card>
            <CardHeader className="flex flex-col sm:flex-row sm:items-center gap-3 sm:justify-between">
              <CardTitle className="text-base">Usuários cadastrados</CardTitle>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="size-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Buscar nome ou e-mail"
                    className="pl-8 h-9 w-full sm:w-56"
                  />
                </div>
                <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as typeof statusFilter)}>
                  <SelectTrigger className="h-9 w-[150px]"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os status</SelectItem>
                    <SelectItem value="pending">Pendentes</SelectItem>
                    <SelectItem value="active">Ativos</SelectItem>
                    <SelectItem value="blocked">Bloqueados</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {fetching ? (
                <div className="p-6 text-sm text-muted-foreground">Carregando...</div>
              ) : filtered.length === 0 ? (
                <div className="p-6 text-sm text-muted-foreground">Nenhum usuário encontrado.</div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Usuário</TableHead>
                        <TableHead>Cadastro</TableHead>
                        <TableHead>Perfil</TableHead>
                        <TableHead>Permissões</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filtered.map((r) => {
                        const isSelf = r.id === user?.id;
                        return (
                          <TableRow key={r.id}>
                            <TableCell>
                              <div className="flex flex-col">
                                <span className="font-medium text-sm">{r.full_name ?? r.email.split("@")[0]}</span>
                                <span className="text-xs text-muted-foreground">{r.email}{isSelf && " (você)"}</span>
                              </div>
                            </TableCell>
                            <TableCell className="text-xs text-muted-foreground">
                              <div className="flex flex-col">
                                <span>{new Date(r.created_at).toLocaleDateString("pt-BR")}</span>
                                {r.approved_at && (
                                  <span className="text-[10px]">
                                    aprovado {new Date(r.approved_at).toLocaleDateString("pt-BR")}
                                    {r.approver_email ? ` por ${r.approver_email}` : ""}
                                  </span>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Select
                                value={r.role ?? "viewer"}
                                disabled={busy === r.id || isSelf}
                                onValueChange={(v) => setRole(r.id, v as AppRole)}
                              >
                                <SelectTrigger className="h-8 w-[150px]"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="admin">
                                    <span className="flex items-center gap-2"><Shield className="size-3.5" /> Administrador</span>
                                  </SelectItem>
                                  <SelectItem value="viewer">
                                    <span className="flex items-center gap-2"><Eye className="size-3.5" /> Visualizador</span>
                                  </SelectItem>
                                </SelectContent>
                              </Select>
                            </TableCell>
                            <TableCell>
                              {r.role === "admin" ? (
                                <span className="text-xs text-muted-foreground">Acesso total</span>
                              ) : (
                                <Popover>
                                  <PopoverTrigger asChild>
                                    <Button variant="outline" size="sm" className="h-8" disabled={busy === r.id}>
                                      <SlidersHorizontal className="size-3.5" />
                                      {r.permissions.length === 0 ? "Somente leitura" : `${r.permissions.length} módulo${r.permissions.length > 1 ? "s" : ""}`}
                                    </Button>
                                  </PopoverTrigger>
                                  <PopoverContent align="start" className="w-80 p-0">
                                    <div className="p-3 border-b">
                                      <p className="text-sm font-medium">Permissões de edição</p>
                                      <p className="text-xs text-muted-foreground">Sem permissões, o usuário apenas consulta os dados.</p>
                                    </div>
                                    <div className="divide-y max-h-72 overflow-y-auto">
                                      {APP_PERMISSIONS.map((p) => (
                                        <label key={p} className="flex items-start gap-3 p-3 cursor-pointer">
                                          <Checkbox
                                            checked={r.permissions.includes(p)}
                                            onCheckedChange={(v) => togglePermission(r.id, p, v === true)}
                                            className="mt-0.5"
                                          />
                                          <span>
                                            <span className="block text-sm font-medium">{PERMISSION_LABEL[p].label}</span>
                                            <span className="block text-xs text-muted-foreground">{PERMISSION_LABEL[p].hint}</span>
                                          </span>
                                        </label>
                                      ))}
                                    </div>
                                  </PopoverContent>
                                </Popover>
                              )}
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className={STATUS_LABEL[r.status].className}>
                                {STATUS_LABEL[r.status].label}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-1">
                                {r.status !== "active" && (
                                  <Button size="sm" variant="outline" disabled={busy === r.id} onClick={() => setStatus(r.id, "active")} title="Aprovar / Ativar">
                                    <Check className="size-3.5" />
                                  </Button>
                                )}
                                {r.status === "pending" && (
                                  <Button size="sm" variant="outline" disabled={busy === r.id} onClick={() => setStatus(r.id, "blocked")} title="Rejeitar">
                                    <X className="size-3.5" />
                                  </Button>
                                )}
                                {r.status === "active" && !isSelf && (
                                  <Button size="sm" variant="outline" disabled={busy === r.id} onClick={() => setStatus(r.id, "blocked")} title="Bloquear">
                                    <Lock className="size-3.5" />
                                  </Button>
                                )}
                                <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive" disabled={busy === r.id || isSelf} onClick={() => remove(r.id)} title="Excluir">
                                  <Trash2 className="size-3.5" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="convites" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2"><Mail className="size-4 text-primary" /> Convites enviados</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {invites.length === 0 ? (
                <div className="p-6 text-sm text-muted-foreground">Nenhum convite enviado ainda.</div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>E-mail</TableHead>
                        <TableHead>Perfil</TableHead>
                        <TableHead>Permissões</TableHead>
                        <TableHead>Enviado</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {invites.map((i) => (
                        <TableRow key={i.id}>
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="text-sm font-medium">{i.email}</span>
                              {i.full_name && <span className="text-xs text-muted-foreground">{i.full_name}</span>}
                            </div>
                          </TableCell>
                          <TableCell className="text-sm">{i.role === "admin" ? "Administrador" : "Visualizador"}</TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {i.role === "admin"
                              ? "Acesso total"
                              : i.permissions.length === 0
                                ? "Somente leitura"
                                : i.permissions.map((p) => PERMISSION_LABEL[p].label).join(", ")}
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">{new Date(i.created_at).toLocaleDateString("pt-BR")}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className={INVITE_LABEL[i.status].className}>{INVITE_LABEL[i.status].label}</Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            {i.status === "pending" && (
                              <div className="flex items-center justify-end gap-1">
                                <Button size="sm" variant="outline" disabled={busy === i.id} onClick={() => doResend(i.id)} title="Reenviar convite">
                                  <Send className="size-3.5" />
                                </Button>
                                <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive" disabled={busy === i.id} onClick={() => cancelInvite(i.id)} title="Cancelar convite">
                                  <X className="size-3.5" />
                                </Button>
                              </div>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Card className="bg-muted/30">
        <CardContent className="p-4 text-xs text-muted-foreground space-y-1">
          <p><strong className="text-foreground">Administrador Financeiro:</strong> acesso total — importa extratos, classifica, edita lançamentos, gerencia eventos e adiantamentos, exporta relatórios e aprova usuários.</p>
          <p><strong className="text-foreground">Visualizador:</strong> consulta dashboards, eventos e prestação de contas. Pode receber permissões específicas por módulo (ex.: apenas Adiantamentos) para editar somente aquela área.</p>
        </CardContent>
      </Card>

      <InviteDialog open={inviteOpen} onOpenChange={setInviteOpen} onInvited={() => void load()} />
    </div>
  );
}

function StatCard({ label, value, tone }: { label: string; value: number; tone: "gold" | "emerald" | "destructive" | "neutral" }) {
  const toneClass = tone === "gold"
    ? "bg-gold/10 text-gold-foreground border-gold/30"
    : tone === "emerald"
      ? "bg-emerald-500/10 text-emerald-700 border-emerald-500/30"
      : tone === "destructive"
        ? "bg-destructive/10 text-destructive border-destructive/30"
        : "bg-muted/50 text-foreground border-border";
  return (
    <Card className={toneClass + " border"}>
      <CardContent className="p-4">
        <p className="text-xs uppercase tracking-wide opacity-80">{label}</p>
        <p className="text-3xl font-bold mt-1">{value}</p>
      </CardContent>
    </Card>
  );
}
