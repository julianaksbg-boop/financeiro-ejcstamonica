import { createFileRoute } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CalendarRange, Plus, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { EVENTOS, MOVIMENTACOES, formatBRL } from "@/lib/mock-data";

export const Route = createFileRoute("/_app/eventos")({
  head: () => ({ meta: [{ title: "Eventos — Financeiro EJC" }] }),
  component: EventosPage,
});

function EventosPage() {
  const stats = EVENTOS.map((e) => {
    const movs = MOVIMENTACOES.filter((m) => m.evento === e.nome);
    const receitas = movs.filter((m) => m.valor > 0).reduce((s, m) => s + m.valor, 0);
    const despesas = movs.filter((m) => m.valor < 0).reduce((s, m) => s + Math.abs(m.valor), 0);
    return { ...e, receitas, despesas, resultado: receitas - despesas, qtd: movs.length };
  });

  return (
    <div className="space-y-6 max-w-[1300px] mx-auto">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Eventos</h1>
          <p className="text-sm text-muted-foreground mt-1">Visão financeira por evento do EJC.</p>
        </div>
        <Button><Plus className="size-4 mr-1" /> Novo evento</Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {stats.map((e) => (
          <Card key={e.id} className="p-5 shadow-card hover:shadow-elevated transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div className="flex gap-3">
                <div className="size-10 rounded-lg flex items-center justify-center shrink-0" style={{ background: `color-mix(in oklab, var(--${e.cor}) 15%, transparent)` }}>
                  <CalendarRange className="size-5" style={{ color: `var(--${e.cor})` }} />
                </div>
                <div>
                  <p className="font-semibold leading-tight">{e.nome}</p>
                  <p className="text-xs text-muted-foreground">{e.ano} • {e.qtd} lançamentos</p>
                </div>
              </div>
              <Badge variant={e.resultado >= 0 ? "default" : "destructive"} className={e.resultado >= 0 ? "bg-success text-success-foreground" : ""}>
                {e.resultado >= 0 ? "+" : ""}{formatBRL(e.resultado)}
              </Badge>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-lg bg-success/10">
                <div className="flex items-center gap-1.5 text-xs text-success font-medium">
                  <ArrowUpRight className="size-3.5" /> Receitas
                </div>
                <p className="font-bold tabular-nums mt-1">{formatBRL(e.receitas)}</p>
              </div>
              <div className="p-3 rounded-lg bg-destructive/5">
                <div className="flex items-center gap-1.5 text-xs text-destructive font-medium">
                  <ArrowDownRight className="size-3.5" /> Despesas
                </div>
                <p className="font-bold tabular-nums mt-1">{formatBRL(e.despesas)}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
