import { Card } from "@/components/ui/card";
import { FileSpreadsheet, Calendar, TrendingUp, TrendingDown, AlertCircle } from "lucide-react";
import { formatBRL } from "@/lib/mock-data";
import type { Movimentacao } from "@/lib/mock-data";

interface Props {
  items: Movimentacao[];
  lastImport?: { fileName: string; importedAt: string; count: number; periodFrom?: string; periodTo?: string };
}

const fmt = (s?: string) => (s ? new Date(s).toLocaleDateString("pt-BR") : "—");

function Row({ label, value, className = "" }: { label: React.ReactNode; value: React.ReactNode; className?: string }) {
  return (
    <div className="flex justify-between items-baseline gap-2">
      <span className="text-xs text-muted-foreground flex items-center gap-1">{label}</span>
      <span className={`text-sm font-semibold tabular-nums ${className}`}>{value}</span>
    </div>
  );
}

export function SidePanel({ items, lastImport }: Props) {
  const receitas = items.filter((m) => m.valor > 0).reduce((s, m) => s + m.valor, 0);
  const despesas = items.filter((m) => m.valor < 0).reduce((s, m) => s + Math.abs(m.valor), 0);
  const pendentes = items.filter((m) => m.status !== "Classificada").length;

  return (
    <div className="space-y-4">
      <Card className="p-4 shadow-card">
        <div className="flex items-center gap-2 mb-3">
          <FileSpreadsheet className="size-4 text-primary" />
          <p className="font-semibold text-sm">Último extrato</p>
        </div>
        {lastImport ? (
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground truncate" title={lastImport.fileName}>{lastImport.fileName}</p>
            <Row label="Importado em" value={new Date(lastImport.importedAt).toLocaleDateString("pt-BR")} />
            <Row label="Novas movim." value={lastImport.count} />
            <Row label="Período" value={`${fmt(lastImport.periodFrom)} → ${fmt(lastImport.periodTo)}`} />
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">Nenhuma importação ainda. Use o botão "Importar extrato".</p>
        )}
      </Card>

      <Card className="p-4 shadow-card">
        <div className="flex items-center gap-2 mb-3">
          <Calendar className="size-4 text-primary" />
          <p className="font-semibold text-sm">Resumo geral</p>
        </div>
        <div className="space-y-2">
          <Row label="Saldo movimentado" value={formatBRL(receitas - despesas)} className={receitas - despesas >= 0 ? "text-success" : "text-destructive"} />
          <Row label={<><TrendingUp className="size-3 text-success" />Receitas</>} value={formatBRL(receitas)} className="text-success" />
          <Row label={<><TrendingDown className="size-3 text-destructive" />Despesas</>} value={formatBRL(despesas)} className="text-destructive" />
          <Row label={<><AlertCircle className="size-3 text-warning" />Pendências</>} value={pendentes} className="text-warning" />
        </div>
      </Card>
    </div>
  );
}
