import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  ChevronDown, ChevronRight, Layers, ListTree, Plus, Search, Table2, TrendingDown, TrendingUp,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth-context";
import { useMovimentacoes } from "@/lib/movimentacoes-store";
import { usePlanoDeContas, type AccountType, type CategoriaFlat } from "@/lib/plano-contas";
import { CategorySheet } from "@/components/plano-contas/category-sheet";
import { GroupsDialog } from "@/components/plano-contas/groups-dialog";

export const Route = createFileRoute("/_app/plano-de-contas")({
  head: () => ({
    meta: [
      { title: "Plano de Contas — Financeiro EJC" },
      { name: "description", content: "Organize os grupos e categorias usados para classificar receitas e despesas do EJC." },
      { property: "og:title", content: "Plano de Contas — Financeiro EJC" },
      { property: "og:description", content: "Organize os grupos e categorias usados para classificar receitas e despesas do EJC." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: PlanoDeContasPage,
});

function PlanoDeContasPage() {
  const { isAdmin } = useAuth();
  const { groups, categories, flat, loading } = usePlanoDeContas();
  const items = useMovimentacoes((s) => s.items);

  const [view, setView] = useState<"arvore" | "tabela">("arvore");
  const [busca, setBusca] = useState("");
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editing, setEditing] = useState<CategoriaFlat | null>(null);
  const [groupsOpen, setGroupsOpen] = useState(false);
  const [mostrarArquivadas, setMostrarArquivadas] = useState(false);

  const usage = useMemo(() => {
    const map = new Map<string, number>();
    for (const m of items) {
      const byId = m.categoriaId;
      if (byId) map.set(byId, (map.get(byId) ?? 0) + 1);
    }
    // histórico legado por nome
    for (const c of flat) {
      if (map.has(c.id)) continue;
      const n = items.filter((m) => !m.categoriaId && m.categoria === c.nome).length;
      if (n) map.set(c.id, n);
    }
    return map;
  }, [items, flat]);

  const visiveis = useMemo(() => {
    const q = busca.trim().toLowerCase();
    return flat.filter((c) => {
      if (!mostrarArquivadas && c.status === "arquivado") return false;
      if (!q) return true;
      return c.caminho.toLowerCase().includes(q);
    });
  }, [flat, busca, mostrarArquivadas]);

  const abrirNova = () => { setEditing(null); setSheetOpen(true); };
  const abrirCategoria = (c: CategoriaFlat) => { setEditing(c); setSheetOpen(true); };

  const toggleGroup = (id: string) => {
    const next = new Set(collapsed);
    if (next.has(id)) next.delete(id); else next.add(id);
    setCollapsed(next);
  };

  const renderTipo = (tipo: AccountType) => {
    const grupos = groups
      .filter((g) => g.type === tipo)
      .filter((g) => mostrarArquivadas || g.status === "ativo")
      .map((g) => ({ grupo: g, cats: visiveis.filter((c) => c.grupoId === g.id) }))
      .filter(({ cats }) => cats.length > 0 || !busca.trim());

    return (
      <Card className="p-4 shadow-card">
        <div className="flex items-center gap-2 mb-4 pb-3 border-b">
          {tipo === "Receita"
            ? <TrendingUp className="size-4 text-success" />
            : <TrendingDown className="size-4 text-destructive" />}
          <h2 className="text-xs font-bold uppercase tracking-wider">{tipo}s</h2>
          <Badge variant="outline" className="text-[10px] ml-auto">
            {visiveis.filter((c) => c.tipo === tipo).length} categorias
          </Badge>
        </div>

        <div className="space-y-1.5">
          {grupos.length === 0 && <p className="text-sm text-muted-foreground italic">Nenhum grupo encontrado.</p>}
          {grupos.map(({ grupo, cats }) => {
            const isCollapsed = collapsed.has(grupo.id);
            return (
              <div key={grupo.id}>
                <button
                  onClick={() => toggleGroup(grupo.id)}
                  className="w-full flex items-center gap-2 rounded-lg px-2 py-2 hover:bg-secondary/60 transition-colors text-left"
                >
                  {isCollapsed ? <ChevronRight className="size-4 text-muted-foreground" /> : <ChevronDown className="size-4 text-muted-foreground" />}
                  <span className="text-sm font-semibold">{grupo.name}</span>
                  {grupo.status === "arquivado" && <Badge variant="outline" className="text-[10px] text-muted-foreground">Arquivado</Badge>}
                  <span className="text-[11px] text-muted-foreground ml-auto">{cats.length}</span>
                </button>
                {!isCollapsed && (
                  <div className="pl-8 space-y-0.5 pb-1">
                    {cats.length === 0 && <p className="text-xs text-muted-foreground italic px-2 py-1">Sem categorias neste grupo.</p>}
                    {cats.map((c) => (
                      <button
                        key={c.id}
                        onClick={() => abrirCategoria(c)}
                        className="w-full flex items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-secondary/60 transition-colors text-left group"
                      >
                        <span className="size-1.5 rounded-full bg-muted-foreground/40 shrink-0" />
                        <span className={cn("truncate", c.status === "arquivado" && "text-muted-foreground line-through")}>{c.nome}</span>
                        {usage.get(c.id) ? (
                          <Badge variant="outline" className="text-[10px] ml-auto">{usage.get(c.id)} mov.</Badge>
                        ) : (
                          <span className="ml-auto text-[10px] text-muted-foreground opacity-0 group-hover:opacity-100">
                            {isAdmin ? "editar" : "ver"}
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </Card>
    );
  };

  return (
    <div className="space-y-5 max-w-[1200px] mx-auto">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <ListTree className="size-7 text-primary" /> Plano de Contas
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Organize as categorias utilizadas para classificar as receitas e despesas do EJC.
          </p>
        </div>
        {isAdmin && (
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setGroupsOpen(true)}><Layers className="size-4 mr-1" /> Gerenciar grupos</Button>
            <Button onClick={abrirNova}><Plus className="size-4 mr-1" /> Nova categoria</Button>
          </div>
        )}
      </div>

      <Card className="p-3 shadow-card">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Buscar categoria, grupo ou tipo..." className="pl-9 h-9" value={busca} onChange={(e) => setBusca(e.target.value)} />
          </div>
          <Button size="sm" variant={mostrarArquivadas ? "default" : "ghost"} className="h-9 rounded-full text-xs"
            onClick={() => setMostrarArquivadas((v) => !v)}>
            Mostrar arquivadas
          </Button>
          <div className="h-6 w-px bg-border mx-1" />
          <Button size="sm" variant={view === "arvore" ? "default" : "ghost"} className="h-9 text-xs" onClick={() => setView("arvore")}>
            <ListTree className="size-4 mr-1" /> Árvore
          </Button>
          <Button size="sm" variant={view === "tabela" ? "default" : "ghost"} className="h-9 text-xs" onClick={() => setView("tabela")}>
            <Table2 className="size-4 mr-1" /> Tabela
          </Button>
        </div>
      </Card>

      {loading && <Card className="p-8 text-center text-sm text-muted-foreground">Carregando plano de contas...</Card>}

      {!loading && view === "arvore" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-start">
          {renderTipo("Despesa")}
          {renderTipo("Receita")}
        </div>
      )}

      {!loading && view === "tabela" && (
        <Card className="shadow-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-secondary/50 text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="text-left px-3 py-3 font-medium">Tipo</th>
                  <th className="text-left px-3 py-3 font-medium">Grupo</th>
                  <th className="text-left px-3 py-3 font-medium">Categoria</th>
                  <th className="text-left px-3 py-3 font-medium">Status</th>
                  <th className="text-right px-3 py-3 font-medium">Movimentações</th>
                  <th className="px-3 py-3 w-24"></th>
                </tr>
              </thead>
              <tbody>
                {visiveis
                  .slice()
                  .sort((a, b) => a.caminho.localeCompare(b.caminho, "pt-BR"))
                  .map((c) => (
                    <tr key={c.id} className="border-t hover:bg-secondary/30 transition-colors">
                      <td className="px-3 py-3">
                        <Badge variant="outline" className={cn("text-[10px]", c.tipo === "Receita" ? "border-success text-success" : "border-destructive text-destructive")}>
                          {c.tipo}
                        </Badge>
                      </td>
                      <td className="px-3 py-3 text-xs">{c.grupo}</td>
                      <td className="px-3 py-3 font-medium">{c.nome}</td>
                      <td className="px-3 py-3">
                        {c.status === "ativo"
                          ? <Badge className="bg-success text-success-foreground text-[10px]">Ativa</Badge>
                          : <Badge variant="outline" className="text-[10px] text-muted-foreground">Arquivada</Badge>}
                      </td>
                      <td className="px-3 py-3 text-right tabular-nums text-xs">{usage.get(c.id) ?? 0}</td>
                      <td className="px-3 py-3 text-right">
                        <Button size="sm" variant="ghost" onClick={() => abrirCategoria(c)}>{isAdmin ? "Editar" : "Ver"}</Button>
                      </td>
                    </tr>
                  ))}
                {visiveis.length === 0 && (
                  <tr><td colSpan={6} className="text-center py-12 text-muted-foreground text-sm">Nenhuma categoria encontrada.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <CategorySheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        groups={groups}
        categoria={editing}
        usageCount={editing ? usage.get(editing.id) ?? 0 : 0}
        canEdit={isAdmin}
      />
      <GroupsDialog
        open={groupsOpen}
        onClose={() => setGroupsOpen(false)}
        groups={groups}
        categories={categories}
        canEdit={isAdmin}
      />
    </div>
  );
}
