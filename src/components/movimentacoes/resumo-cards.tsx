import { Card } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Wallet, AlertCircle, CheckCircle2, HandCoins, Clock } from "lucide-react";
import { formatBRL } from "@/lib/mock-data";
import type { Movimentacao } from "@/lib/mock-data";

export function ResumoCards({ items, lastUpdate }: { items: Movimentacao[]; lastUpdate?: string }) {
  const receitas = items.filter((m) => m.valor > 0).reduce((s, m) => s + m.valor, 0);
  const despesas = items.filter((m) => m.valor < 0).reduce((s, m) => s + Math.abs(m.valor), 0);
  const total = receitas - despesas;
  const pendentes = items.filter((m) => m.status !== "Classificada").length;
  const classificadas = items.filter((m) => m.status === "Classificada").length;
  const adiantamentos = items.filter((m) => m.tipo === "Adiantamento").length;

  const cards = [
    { label: "Total movimentado", value: formatBRL(total), icon: Wallet, tone: "text-foreground", bg: "bg-secondary/40" },
    { label: "Receitas", value: formatBRL(receitas), icon: TrendingUp, tone: "text-success", bg: "bg-success/10" },
    { label: "Despesas", value: formatBRL(despesas), icon: TrendingDown, tone: "text-destructive", bg: "bg-destructive/10" },
  ];

  return (
    <section aria-label="Resumo das movimentações" className="space-y-4">
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      {cards.map(({ label, value, icon: Icon, tone, bg }) => (
        <Card key={label} className="min-w-0 gap-0 rounded-lg p-4 shadow-card">
          <div className="flex items-center gap-2">
            <div className={`size-8 rounded-lg ${bg} flex items-center justify-center shrink-0`}>
              <Icon className={`size-4 ${tone}`} />
            </div>
            <p className="text-sm text-muted-foreground font-medium">{label}</p>
          </div>
          <p className={`mt-3 text-xl font-bold tabular-nums break-words ${tone}`}>{value}</p>
        </Card>
      ))}
    </div>
    <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
      <span className="inline-flex items-center gap-2"><AlertCircle className="size-4 text-warning-foreground" /><strong className="tabular-nums">{pendentes}</strong> pendentes</span>
      <span className="inline-flex items-center gap-2"><CheckCircle2 className="size-4 text-success" /><strong className="tabular-nums">{classificadas}</strong> classificadas</span>
      <span className="inline-flex items-center gap-2"><HandCoins className="size-4 text-primary" /><strong className="tabular-nums">{adiantamentos}</strong> adiantamentos</span>
      <span className="inline-flex items-center gap-2 text-xs text-muted-foreground sm:ml-auto"><Clock className="size-3.5 shrink-0" />Última atualização: {lastUpdate ? new Date(lastUpdate).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }) : "—"}</span>
    </div>
    </section>
  );
}
