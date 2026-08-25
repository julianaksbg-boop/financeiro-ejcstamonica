import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ArrowDownRight, ArrowUpRight, Search, Sparkles, Upload, Plus,
  Columns3, ArrowUpDown, PartyPopper, HandCoins,
} from "lucide-react";
import { EVENTOS, FORMAS_PAGAMENTO, formatBRL, type Movimentacao } from "@/lib/mock-data";
import { useMovimentacoes } from "@/lib/movimentacoes-store";
import { buildSugestoes, sugestaoPara } from "@/lib/sugestoes";
import { ResumoCards } from "@/components/movimentacoes/resumo-cards";
import { SidePanel } from "@/components/movimentacoes/side-panel";
import { ImportWizard } from "@/components/movimentacoes/import-wizard";
import { ClassifySheet } from "@/components/movimentacoes/classify-sheet";
import { BulkBar } from "@/components/movimentacoes/bulk-bar";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_app/movimentacoes")({
  validateSearch: (search: Record<string, unknown>) => ({
    import: search.import === "1" ? "1" : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Central de movimentações — Financeiro EJC" },
      { name: "description", content: "Importe extratos, classifique movimentações e acompanhe pendências financeiras do EJC." },
      { property: "og:title", content: "Central de movimentações — Financeiro EJC" },
      { property: "og:description", content: "Importe extratos, classifique movimentações e acompanhe pendências financeiras do EJC." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: CentralPage,
});

type FiltroChip =
  | "todas" | "pendentes" | "classificadas" | "receitas" | "despesas"
  | "adiantamentos" | "com-sugestao" | "sem-sugestao";

type SortKey = "data" | "nome" | "valor" | "status";

const ALL_COLS = ["status","data","descricao","fornecedor","valor","evento","responsavel","forma","categoria","obs"] as const;
type Col = typeof ALL_COLS[number];

const COL_LABELS: Record<Col, string> = {
  status: "Status", data: "Data", descricao: "Descrição", fornecedor: "Fornecedor",
  valor: "Valor", evento: "Evento", responsavel: "Responsável", forma: "Forma pgto",
  categoria: "Categoria", obs: "Obs.",
};

const PAGE_SIZE = 20;

function CentralPage() {
  const items = useMovimentacoes((s) => s.items);
  const lastImport = useMovimentacoes((s) => s.lastImport);
  const [importOpen, setImportOpen] = useState(false);
  const [sheetItem, setSheetItem] = useState<Movimentacao | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [filtro, setFiltro] = useState<FiltroChip>("todas");
  const [filtroEvento, setFiltroEvento] = useState("__all");
  const [filtroForma, setFiltroForma] = useState("__all");
  const [busca, setBusca] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("data");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(1);
  const [hiddenCols, setHiddenCols] = useState<Set<Col>>(new Set(["categoria", "obs"]));

  const sugestoes = useMemo(() => buildSugestoes(items), [items]);

  const filtered = useMemo(() => {
    let out = items.slice();
    out = out.filter((m) => {
      if (filtro === "pendentes" && m.status === "Classificada") return false;
      if (filtro === "classificadas" && m.status !== "Classificada") return false;
      if (filtro === "receitas" && !(m.tipo === "Receita" || (!m.tipo && m.valor > 0))) return false;
      if (filtro === "despesas" && !(m.tipo === "Despesa" || (!m.tipo && m.valor < 0))) return false;
      if (filtro === "adiantamentos" && m.tipo !== "Adiantamento") return false;
      if (filtro === "com-sugestao" && (m.status === "Classificada" || !sugestaoPara(sugestoes, m.nome))) return false;
      if (filtro === "sem-sugestao" && (m.status === "Classificada" || sugestaoPara(sugestoes, m.nome))) return false;
      if (filtroEvento !== "__all" && m.evento !== filtroEvento) return false;
      if (filtroForma !== "__all" && m.formaPagamento !== filtroForma) return false;
      if (busca) {
        const q = busca.toLowerCase();
        const blob = `${m.nome} ${m.detalhe} ${m.evento ?? ""} ${m.responsavel ?? ""} ${m.categoria ?? ""} ${m.observacao ?? ""} ${m.valor}`.toLowerCase();
        if (!blob.includes(q)) return false;
      }
      return true;
    });
    const dir = sortDir === "asc" ? 1 : -1;
    out.sort((a, b) => {
      if (sortKey === "valor") return (a.valor - b.valor) * dir;
      if (sortKey === "data") return (a.data + a.hora).localeCompare(b.data + b.hora) * dir;
      if (sortKey === "nome") return a.nome.localeCompare(b.nome) * dir;
      return a.status.localeCompare(b.status) * dir;
    });
    return out;
  }, [items, filtro, filtroEvento, filtroForma, busca, sortKey, sortDir, sugestoes]);

  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));

  const totalClass = items.filter((m) => m.status === "Classificada").length;
  const progresso = items.length ? Math.round((totalClass / items.length) * 100) : 0;
  const tudoClassificado = items.length > 0 && totalClass === items.length;

  const toggleSort = (k: SortKey) => {
    if (sortKey === k) setSortDir(sortDir === "asc" ? "desc" : "asc");
    else { setSortKey(k); setSortDir("desc"); }
  };

  const allPagedSelected = paged.length > 0 && paged.every((m) => selected.has(m.id));
  const togglePageAll = () => {
    const next = new Set(selected);
    if (allPagedSelected) paged.forEach((m) => next.delete(m.id));
    else paged.forEach((m) => next.add(m.id));
    setSelected(next);
  };

  const openNew = () => {
    const today = new Date().toISOString().slice(0, 10);
    setSheetItem({
      id: "__new__", data: today, hora: "", tipoTransacao: "Manual",
      nome: "", detalhe: "", valor: 0, status: "Pendente",
    });
    setIsNew(true);
  };

  const colVisible = (c: Col) => !hiddenCols.has(c);

  return (
    <div className="grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-6 max-w-[1600px] mx-auto">
      <div className="space-y-5 min-w-0">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Central de movimentações</h1>
            <p className="text-sm text-muted-foreground mt-1">Importe, classifique e acompanhe o financeiro do EJC em um só lugar.</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={openNew}><Plus className="size-4 mr-1" /> Novo lançamento</Button>
            <Button onClick={() => setImportOpen(true)}><Upload className="size-4 mr-1" /> Importar extrato</Button>
          </div>
        </div>

        <ResumoCards items={items} lastUpdate={lastImport?.importedAt} />

        <Card className="p-4 shadow-card">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium">
              {items.length} movimentações · <span className="text-success">{totalClass} classificadas</span> · <span className="text-warning">{items.length - totalClass} pendentes</span>
            </p>
            <span className="text-sm font-bold tabular-nums">{progresso}%</span>
          </div>
          <Progress value={progresso} className="h-2" />
          {tudoClassificado && (
            <div className="mt-3 flex items-center gap-2 text-sm text-success animate-fade-in">
              <PartyPopper className="size-4" /> Todas as movimentações foram classificadas. Excelente trabalho!
            </div>
          )}
        </Card>

        <Card className="p-3 shadow-card">
          <div className="flex flex-wrap items-center gap-2">
            {([
              ["todas", "Todas"], ["pendentes", "Pendentes"], ["classificadas", "Classificadas"],
              ["receitas", "Receitas"], ["despesas", "Despesas"], ["adiantamentos", "Adiantamentos"],
              ["com-sugestao", "Com sugestão"], ["sem-sugestao", "Sem sugestão"],
            ] as [FiltroChip, string][]).map(([k, label]) => (
              <Button key={k} size="sm" variant={filtro === k ? "default" : "ghost"}
                className={cn("h-8 rounded-full text-xs", filtro !== k && "text-muted-foreground")}
                onClick={() => { setFiltro(k); setPage(1); }}>
                {label}
              </Button>
            ))}
            <div className="h-6 w-px bg-border mx-1" />
            <Select value={filtroEvento} onValueChange={(v) => { setFiltroEvento(v); setPage(1); }}>
              <SelectTrigger className="h-8 w-[150px] text-xs"><SelectValue placeholder="Evento" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="__all">Todos os eventos</SelectItem>
                {EVENTOS.map((e) => <SelectItem key={e.id} value={e.nome}>{e.nome}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={filtroForma} onValueChange={(v) => { setFiltroForma(v); setPage(1); }}>
              <SelectTrigger className="h-8 w-[140px] text-xs"><SelectValue placeholder="Forma pgto" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="__all">Todas as formas</SelectItem>
                {FORMAS_PAGAMENTO.map((f) => <SelectItem key={f} value={f}>{f}</SelectItem>)}
              </SelectContent>
            </Select>
            <div className="relative ml-auto w-full sm:w-64">
              <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Buscar fornecedor, evento, valor..." className="pl-9 h-9" value={busca} onChange={(e) => { setBusca(e.target.value); setPage(1); }} />
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-9"><Columns3 className="size-4" /></Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Colunas</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {ALL_COLS.map((c) => (
                  <DropdownMenuCheckboxItem key={c} checked={colVisible(c)} onCheckedChange={(v) => {
                    const next = new Set(hiddenCols);
                    if (v) next.delete(c); else next.add(c);
                    setHiddenCols(next);
                  }}>
                    {COL_LABELS[c]}
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </Card>

        {selected.size > 0 && <BulkBar ids={[...selected]} onClear={() => setSelected(new Set())} />}

        <Card className="shadow-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-secondary/50 text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-3 py-3 w-10"><Checkbox checked={allPagedSelected} onCheckedChange={togglePageAll} /></th>
                  {colVisible("status") && <th className="text-left px-3 py-3 font-medium w-28">Status</th>}
                  {colVisible("data") && (
                    <th className="text-left px-3 py-3 font-medium whitespace-nowrap">
                      <button className="flex items-center gap-1 hover:text-foreground" onClick={() => toggleSort("data")}>Data <ArrowUpDown className="size-3" /></button>
                    </th>
                  )}
                  {colVisible("descricao") && <th className="text-left px-3 py-3 font-medium">Descrição</th>}
                  {colVisible("fornecedor") && (
                    <th className="text-left px-3 py-3 font-medium">
                      <button className="flex items-center gap-1 hover:text-foreground" onClick={() => toggleSort("nome")}>Fornecedor <ArrowUpDown className="size-3" /></button>
                    </th>
                  )}
                  {colVisible("valor") && (
                    <th className="text-right px-3 py-3 font-medium">
                      <button className="flex items-center gap-1 ml-auto hover:text-foreground" onClick={() => toggleSort("valor")}>Valor <ArrowUpDown className="size-3" /></button>
                    </th>
                  )}
                  {colVisible("evento") && <th className="text-left px-3 py-3 font-medium">Evento</th>}
                  {colVisible("responsavel") && <th className="text-left px-3 py-3 font-medium">Responsável</th>}
                  {colVisible("forma") && <th className="text-left px-3 py-3 font-medium">Forma</th>}
                  {colVisible("categoria") && <th className="text-left px-3 py-3 font-medium">Categoria</th>}
                  {colVisible("obs") && <th className="text-left px-3 py-3 font-medium">Obs.</th>}
                  <th className="px-3 py-3 w-24"></th>
                </tr>
              </thead>
              <tbody>
                {paged.map((m) => {
                  const sug = sugestaoPara(sugestoes, m.nome);
                  const hasSug = sug && m.status !== "Classificada";
                  const isAdiant = m.tipo === "Adiantamento";
                  const isClass = m.status === "Classificada";
                  return (
                    <tr key={m.id}
                      className={cn(
                        "border-t transition-colors group",
                        isClass ? "bg-success/[0.03]" : "hover:bg-secondary/30",
                        selected.has(m.id) && "bg-primary/5",
                      )}>
                      <td className="px-3 py-3">
                        <Checkbox checked={selected.has(m.id)} onCheckedChange={() => {
                          const next = new Set(selected);
                          if (next.has(m.id)) next.delete(m.id); else next.add(m.id);
                          setSelected(next);
                        }} />
                      </td>
                      {colVisible("status") && (
                        <td className="px-3 py-3">
                          {isAdiant
                            ? <Badge variant="outline" className="border-destructive text-destructive"><HandCoins className="size-3 mr-1" />Adiantam.</Badge>
                            : isClass
                              ? <Badge className="bg-success text-success-foreground">Classificada</Badge>
                              : hasSug
                                ? <Badge variant="outline" className="border-primary text-primary"><Sparkles className="size-3 mr-1" />Sugestão</Badge>
                                : <Badge variant="outline" className="border-warning text-warning">Pendente</Badge>}
                        </td>
                      )}
                      {colVisible("data") && (
                        <td className="px-3 py-3 whitespace-nowrap">
                          <div className="font-medium">{new Date(m.data).toLocaleDateString("pt-BR")}</div>
                          <div className="text-[10px] text-muted-foreground">{m.hora}</div>
                        </td>
                      )}
                      {colVisible("descricao") && (
                        <td className="px-3 py-3 max-w-[200px]">
                          <div className="text-xs text-muted-foreground truncate">{m.detalhe || m.tipoTransacao}</div>
                        </td>
                      )}
                      {colVisible("fornecedor") && (
                        <td className="px-3 py-3 font-medium max-w-[180px] truncate" title={m.nome}>{m.nome}</td>
                      )}
                      {colVisible("valor") && (
                        <td className="px-3 py-3 text-right">
                          <div className={`inline-flex items-center gap-1 font-semibold tabular-nums ${m.valor >= 0 ? "text-success" : "text-destructive"}`}>
                            {m.valor >= 0 ? <ArrowUpRight className="size-3.5" /> : <ArrowDownRight className="size-3.5" />}
                            {formatBRL(Math.abs(m.valor))}
                          </div>
                        </td>
                      )}
                      {colVisible("evento") && <td className="px-3 py-3 text-xs">{m.evento ?? <span className="text-muted-foreground italic">—</span>}</td>}
                      {colVisible("responsavel") && <td className="px-3 py-3 text-xs">{m.responsavel ?? <span className="text-muted-foreground italic">—</span>}</td>}
                      {colVisible("forma") && <td className="px-3 py-3 text-xs">{m.formaPagamento ?? "—"}</td>}
                      {colVisible("categoria") && <td className="px-3 py-3 text-xs">{m.categoria ?? "—"}</td>}
                      {colVisible("obs") && <td className="px-3 py-3 text-xs max-w-[160px] truncate" title={m.observacao}>{m.observacao ?? "—"}</td>}
                      <td className="px-3 py-3 text-right">
                        <Button size="sm" variant={isClass ? "ghost" : "default"} onClick={() => { setIsNew(false); setSheetItem(m); }}>
                          {isClass ? "Ver" : "Classificar"}
                        </Button>
                      </td>
                    </tr>
                  );
                })}
                {paged.length === 0 && (
                  <tr><td colSpan={12} className="text-center py-12 text-muted-foreground text-sm">Nenhuma movimentação encontrada com os filtros atuais.</td></tr>
                )}
              </tbody>
            </table>
          </div>
          {pages > 1 && (
            <div className="flex items-center justify-between p-3 border-t bg-secondary/30">
              <p className="text-xs text-muted-foreground">Página {page} de {pages} · {filtered.length} resultados</p>
              <div className="flex gap-1">
                <Button size="sm" variant="outline" disabled={page === 1} onClick={() => setPage(page - 1)}>Anterior</Button>
                <Button size="sm" variant="outline" disabled={page === pages} onClick={() => setPage(page + 1)}>Próxima</Button>
              </div>
            </div>
          )}
        </Card>
      </div>

      <aside className="hidden xl:block">
        <div className="sticky top-20">
          <SidePanel items={items} lastImport={lastImport} />
        </div>
      </aside>

      <ImportWizard open={importOpen} onOpenChange={setImportOpen} />
      <ClassifySheet
        item={sheetItem}
        sugestoes={sugestoes}
        isNew={isNew}
        onClose={() => { setSheetItem(null); setIsNew(false); }}
      />
    </div>
  );
}
