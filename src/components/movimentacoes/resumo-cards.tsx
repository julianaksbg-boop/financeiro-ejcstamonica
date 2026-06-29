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
    { label: "Pendentes", value: pendentes.toString(), icon: AlertCircle, tone: "text-warning", bg: "bg-warning/10" },
    { label: "Classificadas", value: classificadas.toString(), icon: CheckCircle2, tone: "text-success", bg: "bg-success/10" },
    { label: "Adiantamentos", value: adiantamentos.toString(), icon: HandCoins, tone: "text-primary", bg: "bg-primary/10" },
    { label: "Última atualização", value: lastUpdate ? new Date(lastUpdate).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }) : "—", icon: Clock, tone: "text-muted-foreground", bg: "bg-muted" },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-7 gap-3">
      {cards.map(({ label, value, icon: Icon, tone, bg }) => (
        <Card key={label} className="p-3 shadow-card hover:shadow-elevated transition-shadow">
          <div className="flex items-center gap-2">
            <div className={`size-8 rounded-lg ${bg} flex items-center justify-center shrink-0`}>
              <Icon className={`size-4 ${tone}`} />
            </div>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">{label}</p>
          </div>
          <p className={`mt-2 text-lg font-bold tabular-nums truncate ${tone}`}>{value}</p>
        </Card>
      ))}
    </div>
  );
}
