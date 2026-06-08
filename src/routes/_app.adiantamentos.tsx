import { createFileRoute } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { HandCoins, Plus, FileCheck2 } from "lucide-react";
import { ADIANTAMENTOS, formatBRL } from "@/lib/mock-data";

export const Route = createFileRoute("/_app/adiantamentos")({
  head: () => ({ meta: [{ title: "Adiantamentos — Financeiro EJC" }] }),
  component: AdiantamentosPage,
});

const statusColor = {
  "Pendente": "border-destructive text-destructive",
  "Parcialmente Prestado": "border-warning text-warning",
  "Prestação Concluída": "bg-success text-success-foreground border-success",
} as const;

function AdiantamentosPage() {
  const totalAdiantado = ADIANTAMENTOS.reduce((s, a) => s + a.valorAdiantado, 0);
  const totalPrestado = ADIANTAMENTOS.reduce((s, a) => s + a.valorPrestado, 0);
  const saldoPendente = totalAdiantado - totalPrestado;

  return (
    <div className="space-y-6 max-w-[1200px] mx-auto">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Adiantamentos</h1>
          <p className="text-sm text-muted-foreground mt-1">Controle PIX, repasses e prestação de contas das equipes.</p>
        </div>
        <Button><Plus className="size-4 mr-1" /> Novo adiantamento</Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-5 shadow-card">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">Total adiantado</p>
          <p className="text-2xl font-bold mt-2 tabular-nums">{formatBRL(totalAdiantado)}</p>
        </Card>
        <Card className="p-5 shadow-card border-l-4 border-l-success">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">Prestado</p>
          <p className="text-2xl font-bold mt-2 tabular-nums text-success">{formatBRL(totalPrestado)}</p>
        </Card>
        <Card className="p-5 shadow-card border-l-4 border-l-warning">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">Saldo pendente</p>
          <p className="text-2xl font-bold mt-2 tabular-nums text-warning">{formatBRL(saldoPendente)}</p>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {ADIANTAMENTOS.map((a) => {
          const pct = (a.valorPrestado / a.valorAdiantado) * 100;
          const saldo = a.valorAdiantado - a.valorPrestado;
          return (
            <Card key={a.id} className="p-5 shadow-card">
              <div className="flex items-start justify-between mb-4">
                <div className="flex gap-3">
                  <div className="size-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <HandCoins className="size-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold">{a.responsavel}</p>
                    <p className="text-xs text-muted-foreground">{a.evento} • {new Date(a.data).toLocaleDateString("pt-BR")}</p>
                  </div>
                </div>
                <Badge variant="outline" className={statusColor[a.status]}>{a.status}</Badge>
              </div>

              <div className="grid grid-cols-3 gap-3 mb-4 text-sm">
                <div>
                  <p className="text-xs text-muted-foreground">Adiantado</p>
                  <p className="font-semibold tabular-nums">{formatBRL(a.valorAdiantado)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Prestado</p>
                  <p className="font-semibold tabular-nums text-success">{formatBRL(a.valorPrestado)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Pendente</p>
                  <p className={`font-semibold tabular-nums ${saldo > 0 ? "text-warning" : "text-muted-foreground"}`}>{formatBRL(saldo)}</p>
                </div>
              </div>

              <Progress value={pct} className="h-2" />
              <div className="flex justify-between items-center mt-3">
                <p className="text-xs text-muted-foreground">{pct.toFixed(0)}% prestado</p>
                <Button size="sm" variant="outline"><FileCheck2 className="size-3.5 mr-1" /> Lançar prestação</Button>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
