import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ArrowDownUp, ChevronDown, ChevronRight, TrendingDown, TrendingUp, Wallet } from "lucide-react";
import { useMovimentacoes } from "@/lib/movimentacoes-store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_app/fluxo-de-caixa")({
  head: () => ({
    meta: [
      { title: "Fluxo de Caixa — Financeiro EJC" },
      { name: "description", content: "Fluxo de caixa direto mês a mês: entradas, saídas e saldo do EJC." },
      { property: "og:title", content: "Fluxo de Caixa — Financeiro EJC" },
      { property: "og:description", content: "Fluxo de caixa direto mês a mês: entradas, saídas e saldo do EJC." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: FluxoCaixaPage,
});

const MESES = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
const MESES_COMPLETOS = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

const brl = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

interface CategoriaLinha {
  nome: string;
  entradas: number;
  saidas: number;
}

interface MesFluxo {
  ano: number;
  mes: number; // 0-11
  chave: string;
  entradas: number;
  saidas: number; // positivo
  saldo: number;
  saldoInicial: number;
  saldoFinal: number;
  qtd: number;
  categorias: CategoriaLinha[];
}

function FluxoCaixaPage() {
  const { items } = useMovimentacoes();
  const [ano, setAno] = useState<string>("todos");
  const [aberto, setAberto] = useState<string | null>(null);

  const anos = useMemo(() => {
    const s = new Set<number>();
    for (const m of items) {
      const y = Number(m.data.slice(0, 4));
      if (!Number.isNaN(y)) s.add(y);
    }
    return Array.from(s).sort((a, b) => b - a);
  }, [items]);

  const meses = useMemo<MesFluxo[]>(() => {
    const mapa = new Map<string, MesFluxo & { catMap: Map<string, CategoriaLinha> }>();
    for (const m of items) {
      const y = Number(m.data.slice(0, 4));
      const mo = Number(m.data.slice(5, 7)) - 1;
      if (Number.isNaN(y) || Number.isNaN(mo)) continue;
      if (ano !== "todos" && String(y) !== ano) continue;
      const chave = `${y}-${String(mo + 1).padStart(2, "0")}`;
      let row = mapa.get(chave);
      if (!row) {
        row = {
          ano: y, mes: mo, chave,
          entradas: 0, saidas: 0, saldo: 0, saldoInicial: 0, saldoFinal: 0, qtd: 0,
          categorias: [], catMap: new Map(),
        };
        mapa.set(chave, row);
      }
      const catNome = m.categoria ?? m.categoriaGrupo ?? "Sem categoria";
      let cat = row.catMap.get(catNome);
      if (!cat) {
        cat = { nome: catNome, entradas: 0, saidas: 0 };
        row.catMap.set(catNome, cat);
      }
      row.qtd += 1;
      if (m.valor >= 0) {
        row.entradas += m.valor;
        cat.entradas += m.valor;
      } else {
        row.saidas += -m.valor;
        cat.saidas += -m.valor;
      }
    }
    const ordenados = Array.from(mapa.values()).sort((a, b) => a.chave.localeCompare(b.chave));
    let acumulado = 0;
    for (const r of ordenados) {
      r.saldo = r.entradas - r.saidas;
      r.saldoInicial = acumulado;
      acumulado += r.saldo;
      r.saldoFinal = acumulado;
      r.categorias = Array.from(r.catMap.values()).sort(
        (a, b) => b.entradas + b.saidas - (a.entradas + a.saidas),
      );
    }
    return ordenados.reverse(); // mais recente primeiro
  }, [items, ano]);

  const totais = useMemo(
    () =>
      meses.reduce(
        (acc, m) => ({
          entradas: acc.entradas + m.entradas,
          saidas: acc.saidas + m.saidas,
          saldo: acc.saldo + m.saldo,
        }),
        { entradas: 0, saidas: 0, saldo: 0 },
      ),
    [meses],
  );

  const maxValor = useMemo(
    () => Math.max(1, ...meses.flatMap((m) => [m.entradas, m.saidas])),
    [meses],
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <ArrowDownUp className="size-6 text-primary" />
            Fluxo de Caixa
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Método direto: entradas e saídas realizadas, mês a mês, com saldo acumulado.
          </p>
        </div>
        <Select value={ano} onValueChange={setAno}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Ano" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos os anos</SelectItem>
            {anos.map((a) => (
              <SelectItem key={a} value={String(a)}>{a}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="shadow-card">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="size-11 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
              <TrendingUp className="size-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Entradas no período</p>
              <p className="text-lg font-bold text-emerald-600">{brl(totais.entradas)}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-card">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="size-11 rounded-lg bg-destructive/10 text-destructive flex items-center justify-center">
              <TrendingDown className="size-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Saídas no período</p>
              <p className="text-lg font-bold text-destructive">{brl(totais.saidas)}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-card">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="size-11 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <Wallet className="size-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Resultado líquido</p>
              <p className={cn("text-lg font-bold", totais.saldo >= 0 ? "text-emerald-600" : "text-destructive")}>
                {brl(totais.saldo)}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Entradas x Saídas por mês</CardTitle>
        </CardHeader>
        <CardContent>
          {meses.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">
              Nenhuma movimentação no período selecionado.
            </p>
          ) : (
            <div className="flex items-end gap-3 overflow-x-auto pb-2 pt-4">
              {[...meses].reverse().map((m) => (
                <div key={m.chave} className="flex flex-col items-center gap-1 min-w-[64px] flex-1">
                  <div className="flex items-end gap-1.5 h-36">
                    <div
                      className="w-5 rounded-t bg-emerald-500/80"
                      style={{ height: `${Math.max(2, (m.entradas / maxValor) * 100)}%` }}
                      title={`Entradas: ${brl(m.entradas)}`}
                    />
                    <div
                      className="w-5 rounded-t bg-destructive/70"
                      style={{ height: `${Math.max(2, (m.saidas / maxValor) * 100)}%` }}
                      title={`Saídas: ${brl(m.saidas)}`}
                    />
                  </div>
                  <p className="text-[11px] text-muted-foreground font-medium">
                    {MESES[m.mes]}/{String(m.ano).slice(2)}
                  </p>
                </div>
              ))}
            </div>
          )}
          <div className="flex items-center gap-4 pt-2 text-[11px] text-muted-foreground">
            <span className="inline-flex items-center gap-1.5"><span className="size-2.5 rounded-sm bg-emerald-500/80" /> Entradas</span>
            <span className="inline-flex items-center gap-1.5"><span className="size-2.5 rounded-sm bg-destructive/70" /> Saídas</span>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Demonstrativo mensal</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-xs text-muted-foreground">
                  <th className="px-4 py-3 font-medium">Mês</th>
                  <th className="px-4 py-3 font-medium text-right">Saldo inicial</th>
                  <th className="px-4 py-3 font-medium text-right">Entradas</th>
                  <th className="px-4 py-3 font-medium text-right">Saídas</th>
                  <th className="px-4 py-3 font-medium text-right">Resultado</th>
                  <th className="px-4 py-3 font-medium text-right">Saldo final</th>
                </tr>
              </thead>
              <tbody>
                {meses.map((m) => {
                  const expandido = aberto === m.chave;
                  return (
                    <FragmentRows
                      key={m.chave}
                      m={m}
                      expandido={expandido}
                      onToggle={() => setAberto(expandido ? null : m.chave)}
                    />
                  );
                })}
                {meses.length > 0 && (
                  <tr className="border-t-2 font-semibold bg-muted/40">
                    <td className="px-4 py-3">Total</td>
                    <td className="px-4 py-3 text-right">—</td>
                    <td className="px-4 py-3 text-right text-emerald-600">{brl(totais.entradas)}</td>
                    <td className="px-4 py-3 text-right text-destructive">{brl(totais.saidas)}</td>
                    <td className={cn("px-4 py-3 text-right", totais.saldo >= 0 ? "text-emerald-600" : "text-destructive")}>
                      {brl(totais.saldo)}
                    </td>
                    <td className="px-4 py-3 text-right">—</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function FragmentRows({ m, expandido, onToggle }: { m: MesFluxo; expandido: boolean; onToggle: () => void }) {
  return (
    <>
      <tr
        className="border-b hover:bg-muted/30 cursor-pointer select-none"
        onClick={onToggle}
      >
        <td className="px-4 py-3 font-medium">
          <span className="inline-flex items-center gap-2">
            {expandido ? <ChevronDown className="size-4 text-muted-foreground" /> : <ChevronRight className="size-4 text-muted-foreground" />}
            {MESES_COMPLETOS[m.mes]} {m.ano}
            <span className="text-[11px] font-normal text-muted-foreground">({m.qtd} lançamentos)</span>
          </span>
        </td>
        <td className="px-4 py-3 text-right text-muted-foreground">{brl(m.saldoInicial)}</td>
        <td className="px-4 py-3 text-right text-emerald-600">{brl(m.entradas)}</td>
        <td className="px-4 py-3 text-right text-destructive">{brl(m.saidas)}</td>
        <td className={cn("px-4 py-3 text-right font-medium", m.saldo >= 0 ? "text-emerald-600" : "text-destructive")}>
          {brl(m.saldo)}
        </td>
        <td className="px-4 py-3 text-right font-medium">{brl(m.saldoFinal)}</td>
      </tr>
      {expandido && (
        <tr className="border-b bg-muted/20">
          <td colSpan={6} className="px-4 py-3">
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground mb-2">
              Detalhamento por categoria
            </p>
            <div className="grid gap-1 sm:grid-cols-2 lg:grid-cols-3">
              {m.categorias.map((c) => (
                <div key={c.nome} className="flex items-center justify-between rounded-md border bg-card px-3 py-2 text-xs">
                  <span className="font-medium truncate mr-2">{c.nome}</span>
                  <span className="shrink-0 space-x-2">
                    {c.entradas > 0 && <span className="text-emerald-600">+{brl(c.entradas)}</span>}
                    {c.saidas > 0 && <span className="text-destructive">−{brl(c.saidas)}</span>}
                  </span>
                </div>
              ))}
            </div>
          </td>
        </tr>
      )}
    </>
  );
}
