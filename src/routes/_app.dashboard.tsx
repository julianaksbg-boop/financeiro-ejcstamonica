import { createFileRoute } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowUpRight, ArrowDownRight, Wallet, TrendingUp, AlertTriangle, ArrowRight } from "lucide-react";
import { Link } from "@tanstack/react-router";
import {
  Bar, BarChart, CartesianGrid, Line, LineChart, Pie, PieChart, Cell,
  ResponsiveContainer, Tooltip, XAxis, YAxis, Legend,
} from "recharts";
import {
  SALDO_ATUAL, RECEITAS_ANO, DESPESAS_ANO, RESULTADO_ANO,
  FLUXO_MENSAL, SALDO_HISTORICO, GASTOS_RESPONSAVEL, GASTOS_PILAR,
  RECEITAS_CATEGORIA, COMPARATIVO_ENCONTROES, MOVIMENTACOES, ADIANTAMENTOS,
  formatBRL,
} from "@/lib/mock-data";

export const Route = createFileRoute("/_app/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — Financeiro EJC" }] }),
  component: DashboardPage,
});

const CHART_COLORS = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)"];

function StatCard({ label, value, hint, icon: Icon, trend, tone = "default" }: {
  label: string; value: string; hint?: string; icon: React.ElementType;
  trend?: { value: string; up: boolean }; tone?: "default" | "success" | "destructive" | "primary";
}) {
  const tones = {
    default: "bg-card",
    success: "bg-card border-l-4 border-l-success",
    destructive: "bg-card border-l-4 border-l-destructive",
    primary: "bg-gradient-primary text-primary-foreground",
  } as const;
  const isPrimary = tone === "primary";
  return (
    <Card className={`p-5 shadow-card ${tones[tone]}`}>
      <div className="flex items-start justify-between">
        <div>
          <p className={`text-xs font-medium uppercase tracking-wider ${isPrimary ? "text-primary-foreground/80" : "text-muted-foreground"}`}>{label}</p>
          <p className="text-2xl font-bold mt-2 tracking-tight">{value}</p>
          {hint && <p className={`text-xs mt-1 ${isPrimary ? "text-primary-foreground/70" : "text-muted-foreground"}`}>{hint}</p>}
        </div>
        <div className={`size-10 rounded-lg flex items-center justify-center ${isPrimary ? "bg-white/15" : "bg-secondary"}`}>
          <Icon className={`size-5 ${isPrimary ? "text-primary-foreground" : "text-primary"}`} />
        </div>
      </div>
      {trend && (
        <div className={`flex items-center gap-1 mt-3 text-xs font-medium ${trend.up ? "text-success" : "text-destructive"}`}>
          {trend.up ? <ArrowUpRight className="size-3.5" /> : <ArrowDownRight className="size-3.5" />}
          {trend.value} vs período anterior
        </div>
      )}
    </Card>
  );
}

function DashboardPage() {
  const pendentes = MOVIMENTACOES.filter((m) => m.status === "Pendente").length;
  const sugeridas = MOVIMENTACOES.filter((m) => m.status === "Sugerida").length;
  const adiantamentosPendentes = ADIANTAMENTOS.filter((a) => a.status !== "Prestação Concluída").length;

  return (
    <div className="space-y-8 max-w-[1400px] mx-auto">
      <div className="flex items-end justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard Financeiro</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Última atualização: hoje às 14:23 • Exercício 2025
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link to="/importar">Importar extrato</Link>
          </Button>
          <Button asChild>
            <Link to="/movimentacoes">Classificar lançamentos</Link>
          </Button>
        </div>
      </div>

      {/* Alertas */}
      {(pendentes > 0 || sugeridas > 0 || adiantamentosPendentes > 0) && (
        <Card className="p-4 border-l-4 border-l-warning bg-warning/5">
          <div className="flex items-start gap-3">
            <AlertTriangle className="size-5 text-warning shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-semibold text-sm">Pendências operacionais</p>
              <div className="flex flex-wrap gap-3 mt-2 text-sm">
                {pendentes > 0 && <Badge variant="outline" className="border-warning/40">{pendentes} movimentações sem classificação</Badge>}
                {sugeridas > 0 && <Badge variant="outline" className="border-warning/40">{sugeridas} sugestões aguardando aprovação</Badge>}
                {adiantamentosPendentes > 0 && <Badge variant="outline" className="border-warning/40">{adiantamentosPendentes} adiantamentos a prestar contas</Badge>}
              </div>
            </div>
            <Button size="sm" variant="ghost" asChild>
              <Link to="/movimentacoes">Resolver <ArrowRight className="size-3.5 ml-1" /></Link>
            </Button>
          </div>
        </Card>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard tone="primary" label="Saldo atual" value={formatBRL(SALDO_ATUAL)} hint="Conta InfinityPay" icon={Wallet} />
        <StatCard tone="success" label="Receitas do ano" value={formatBRL(RECEITAS_ANO)} icon={ArrowUpRight} trend={{ value: "+18%", up: true }} />
        <StatCard tone="destructive" label="Despesas do ano" value={formatBRL(DESPESAS_ANO)} icon={ArrowDownRight} trend={{ value: "+12%", up: false }} />
        <StatCard label="Resultado acumulado" value={formatBRL(RESULTADO_ANO)} icon={TrendingUp} hint="Receitas − Despesas" />
      </div>

      {/* Charts row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="p-6 shadow-card lg:col-span-2">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="font-semibold">Receitas × Despesas por mês</h3>
              <p className="text-xs text-muted-foreground">Fluxo mensal 2025</p>
            </div>
          </div>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={FLUXO_MENSAL}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="mes" stroke="var(--muted-foreground)" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="var(--muted-foreground)" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`} />
                <Tooltip
                  contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }}
                  formatter={(v: number) => formatBRL(v)}
                />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="receitas" fill="var(--chart-3)" name="Receitas" radius={[4, 4, 0, 0]} />
                <Bar dataKey="despesas" fill="var(--chart-5)" name="Despesas" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-6 shadow-card">
          <h3 className="font-semibold">Fluxo de caixa</h3>
          <p className="text-xs text-muted-foreground mb-4">Saldo acumulado</p>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={SALDO_HISTORICO}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="mes" stroke="var(--muted-foreground)" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="var(--muted-foreground)" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`} />
                <Tooltip contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }} formatter={(v: number) => formatBRL(v)} />
                <Line type="monotone" dataKey="saldo" stroke="var(--chart-1)" strokeWidth={2.5} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Charts row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="p-6 shadow-card">
          <h3 className="font-semibold">Gastos por responsável</h3>
          <p className="text-xs text-muted-foreground mb-4">Top equipes do XXI Encontrão</p>
          <div className="h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={GASTOS_RESPONSAVEL} layout="vertical" margin={{ left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
                <XAxis type="number" stroke="var(--muted-foreground)" fontSize={11} tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`} />
                <YAxis type="category" dataKey="nome" stroke="var(--muted-foreground)" fontSize={11} width={110} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }} formatter={(v: number) => formatBRL(v)} />
                <Bar dataKey="valor" fill="var(--chart-2)" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-6 shadow-card">
          <h3 className="font-semibold">Gastos por pilar</h3>
          <p className="text-xs text-muted-foreground mb-4">Distribuição entre pilares</p>
          <div className="h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={GASTOS_PILAR} dataKey="valor" nameKey="nome" cx="50%" cy="50%" innerRadius={60} outerRadius={110} paddingAngle={2}>
                  {GASTOS_PILAR.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }} formatter={(v: number) => formatBRL(v)} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Receitas por categoria & Comparativo */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="p-6 shadow-card">
          <h3 className="font-semibold">Receitas por categoria</h3>
          <p className="text-xs text-muted-foreground mb-4">Origem das arrecadações em 2025</p>
          <div className="space-y-3 mt-6">
            {RECEITAS_CATEGORIA.map((r, i) => {
              const max = Math.max(...RECEITAS_CATEGORIA.map((x) => x.valor));
              return (
                <div key={r.categoria}>
                  <div className="flex justify-between text-sm mb-1.5">
                    <span className="font-medium">{r.categoria}</span>
                    <span className="text-muted-foreground tabular-nums">{formatBRL(r.valor)}</span>
                  </div>
                  <div className="h-2 bg-secondary rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${(r.valor / max) * 100}%`, background: CHART_COLORS[i % CHART_COLORS.length] }} />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        <Card className="p-6 shadow-card">
          <h3 className="font-semibold">Comparação entre Encontrões</h3>
          <p className="text-xs text-muted-foreground mb-4">Resultado histórico</p>
          <div className="space-y-3">
            {COMPARATIVO_ENCONTROES.map((e) => {
              const positivo = e.resultado >= 0;
              return (
                <div key={e.encontro} className="p-4 rounded-lg border bg-secondary/30">
                  <div className="flex items-center justify-between mb-3">
                    <p className="font-semibold">{e.encontro} Encontrão</p>
                    <Badge variant={positivo ? "default" : "destructive"} className={positivo ? "bg-success text-success-foreground" : ""}>
                      {formatBRL(e.resultado)}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <p className="text-muted-foreground">Receita</p>
                      <p className="font-semibold text-success tabular-nums">{formatBRL(e.receita)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Despesa</p>
                      <p className="font-semibold text-destructive tabular-nums">{formatBRL(e.despesa)}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>
    </div>
  );
}
