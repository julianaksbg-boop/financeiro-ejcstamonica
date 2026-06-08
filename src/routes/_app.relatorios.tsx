import { createFileRoute } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, Download, FileSpreadsheet } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/relatorios")({
  head: () => ({ meta: [{ title: "Relatórios — Financeiro EJC" }] }),
  component: RelatoriosPage,
});

const RELATORIOS = [
  { titulo: "Receitas por evento", desc: "Total arrecadado em cada evento do exercício." },
  { titulo: "Despesas por evento", desc: "Custos consolidados por evento." },
  { titulo: "Gastos por responsável", desc: "Quanto cada equipe/pilar consumiu." },
  { titulo: "Prestação de contas dos adiantamentos", desc: "Adiantados × prestados × saldo." },
  { titulo: "Comparação entre Encontrões", desc: "Histórico financeiro entre edições." },
  { titulo: "Prestação de contas consolidada do ano", desc: "Relatório completo para a coordenação." },
];

function RelatoriosPage() {
  return (
    <div className="space-y-6 max-w-[1200px] mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Relatórios</h1>
        <p className="text-sm text-muted-foreground mt-1">Exporte demonstrativos para a coordenação em PDF ou Excel.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {RELATORIOS.map((r) => (
          <Card key={r.titulo} className="p-5 shadow-card hover:shadow-elevated transition-shadow">
            <div className="flex gap-3 mb-4">
              <div className="size-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <FileText className="size-5 text-primary" />
              </div>
              <div>
                <p className="font-semibold">{r.titulo}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{r.desc}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="flex-1" onClick={() => toast.success(`${r.titulo} exportado em PDF`)}>
                <Download className="size-3.5 mr-1" /> PDF
              </Button>
              <Button variant="outline" size="sm" className="flex-1" onClick={() => toast.success(`${r.titulo} exportado em Excel`)}>
                <FileSpreadsheet className="size-3.5 mr-1" /> Excel
              </Button>
            </div>
          </Card>
        ))}
      </div>

      <Card className="p-5 shadow-card bg-gradient-surface">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <p className="font-semibold">Histórico financeiro</p>
            <p className="text-sm text-muted-foreground mt-1">Compare exercícios financeiros entre anos.</p>
          </div>
          <div className="flex gap-2">
            <Badge variant="outline">2025</Badge>
            <Badge variant="outline" className="opacity-50">2026</Badge>
            <Badge variant="outline" className="opacity-50">2027</Badge>
          </div>
        </div>
      </Card>
    </div>
  );
}
