import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Check, X, Lock, Shield, Eye, Trash2, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/administracao")({
  head: () => ({ meta: [{ title: "Administração — Financeiro EJC" }] }),
  component: AdminPage,
});

type UserStatus = "pending" | "active" | "blocked";
type AppRole = "admin" | "viewer";

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
}

const STATUS_LABEL: Record<UserStatus, { label: string; className: string }> = {
  pending: { label: "Pendente", className: "bg-gold/15 text-gold-foreground border-gold/30" },
  active: { label: "Ativo", className: "bg-emerald-500/15 text-emerald-700 border-emerald-500/30" },
  blocked: { label: "Bloqueado", className: "bg-destructive/15 text-destructive border-destructive/30" },
};

function AdminPage() {
  const { isAdmin, loading, user } = useAuth();
  const navigate = useNavigate();
  const [rows, setRows] = useState<UserRow[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (!loading && !isAdmin) navigate({ to: "/dashboard" });
  }, [isAdmin, loading, navigate]);

  const load = useCallback(async () => {
    setFetching(true);
    const [{ data: profiles, error: pErr }, { data: roles, error: rErr }] = await Promise.all([
      supabase.from("profiles").select("id,email,full_name,status,created_at,approved_at,approved_by").order("created_at", { ascending: false }),
      supabase.from("user_roles").select("user_id,role"),
    ]);
    if (pErr) toast.error("Erro ao carregar usuários: " + pErr.message);
    if (rErr) toast.error("Erro ao carregar permissões: " + rErr.message);
    const roleByUser = new Map<string, AppRole>();
    (roles ?? []).forEach((r) => {
      const cur = roleByUser.get(r.user_id);
      // prefer admin
      if (!cur || r.role === "admin") roleByUser.set(r.user_id, r.role as AppRole);
    });
    const emailById = new Map<string, string>((profiles ?? []).map((p) => [p.id, p.email]));
    const list: UserRow[] = (profiles ?? []).map((p) => ({
      id: p.id,
      email: p.email,
      full_name: p.full_name,
      status: p.status as UserStatus,
      created_at: p.created_at,
      approved_at: p.approved_at,
      approved_by: p.approved_by,
      approver_email: p.approved_by ? emailById.get(p.approved_by) ?? null : null,
      role: roleByUser.get(p.id) ?? null,
    }));
    setRows(list);
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
    // remove existing roles then insert
    const { error: dErr } = await supabase.from("user_roles").delete().eq("user_id", id);
    if (dErr) { setBusy(null); toast.error(dErr.message); return; }
    const { error: iErr } = await supabase.from("user_roles").insert({ user_id: id, role: newRole });
    setBusy(null);
    if (iErr) { toast.error(iErr.message); return; }
    toast.success("Perfil atualizado");
    void load();
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

  if (loading || !isAdmin) {
    return <div className="text-sm text-muted-foreground">Verificando permissões...</div>;
  }

  const pendingCount = rows.filter((r) => r.status === "pending").length;
  const activeCount = rows.filter((r) => r.status === "active").length;
  const blockedCount = rows.filter((r) => r.status === "blocked").length;

  return (
    <div className="space-y-6 max-w-7xl">
      <header className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <ShieldCheck className="size-6 text-primary" /> Administração
          </h1>
          <p className="text-sm text-muted-foreground">Gestão de usuários e permissões do sistema</p>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard label="Pendentes de aprovação" value={pendingCount} tone="gold" />
        <StatCard label="Usuários ativos" value={activeCount} tone="emerald" />
        <StatCard label="Bloqueados" value={blockedCount} tone="destructive" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Usuários cadastrados</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {fetching ? (
            <div className="p-6 text-sm text-muted-foreground">Carregando...</div>
          ) : rows.length === 0 ? (
            <div className="p-6 text-sm text-muted-foreground">Nenhum usuário cadastrado.</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Usuário</TableHead>
                    <TableHead>Cadastro</TableHead>
                    <TableHead>Aprovação</TableHead>
                    <TableHead>Perfil</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((r) => {
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
                          {new Date(r.created_at).toLocaleDateString("pt-BR")}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {r.approved_at ? (
                            <div className="flex flex-col">
                              <span>{new Date(r.approved_at).toLocaleDateString("pt-BR")}</span>
                              {r.approver_email && <span className="text-[10px]">por {r.approver_email}</span>}
                            </div>
                          ) : "—"}
                        </TableCell>
                        <TableCell>
                          <Select
                            value={r.role ?? "viewer"}
                            disabled={busy === r.id || isSelf}
                            onValueChange={(v) => setRole(r.id, v as AppRole)}
                          >
                            <SelectTrigger className="h-8 w-[150px]">
                              <SelectValue />
                            </SelectTrigger>
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

      <Card className="bg-muted/30">
        <CardContent className="p-4 text-xs text-muted-foreground space-y-1">
          <p><strong className="text-foreground">Administrador Financeiro:</strong> acesso total — importa extratos, classifica, edita lançamentos, gerencia eventos e adiantamentos, exporta relatórios e aprova usuários.</p>
          <p><strong className="text-foreground">Visualizador:</strong> acesso somente leitura — dashboard, eventos e prestação de contas. Não altera dados financeiros nem aprova cadastros.</p>
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({ label, value, tone }: { label: string; value: number; tone: "gold" | "emerald" | "destructive" }) {
  const toneClass = tone === "gold"
    ? "bg-gold/10 text-gold-foreground border-gold/30"
    : tone === "emerald"
      ? "bg-emerald-500/10 text-emerald-700 border-emerald-500/30"
      : "bg-destructive/10 text-destructive border-destructive/30";
  return (
    <Card className={toneClass + " border"}>
      <CardContent className="p-4">
        <p className="text-xs uppercase tracking-wide opacity-80">{label}</p>
        <p className="text-3xl font-bold mt-1">{value}</p>
      </CardContent>
    </Card>
  );
}
