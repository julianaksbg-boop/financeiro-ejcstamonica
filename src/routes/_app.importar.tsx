import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Upload, FileSpreadsheet, AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { formatBRL } from "@/lib/mock-data";

export const Route = createFileRoute("/_app/importar")({
  head: () => ({ meta: [{ title: "Importar extrato — Financeiro EJC" }] }),
  component: ImportarPage,
});

const PREVIEW = [
  { data: "2025-06-02", hora: "14:23", tipo: "PIX Recebido", nome: "Maria Eduarda Souza", detalhe: "Inscrição XXI Encontrão", valor: 280, duplicado: false },
  { data: "2025-06-02", hora: "10:15", tipo: "PIX Recebido", nome: "Lucas Pereira", detalhe: "Inscrição XXI Encontrão", valor: 280, duplicado: false },
  { data: "2025-06-01", hora: "16:42", tipo: "Débito", nome: "Supermercado Bretas", detalhe: "Compras cozinha", valor: -847.5, duplicado: false },
  { data: "2025-06-01", hora: "12:18", tipo: "PIX Enviado", nome: "Equipe Compras", detalhe: "Adiantamento mercado", valor: -3000, duplicado: true },
  { data: "2025-05-30", hora: "20:11", tipo: "PIX Recebido", nome: "João Vitor Lima", detalhe: "Quitanda - bolo de fubá", valor: 35, duplicado: false },
];

function ImportarPage() {
  const [estado, setEstado] = useState<"vazio" | "carregando" | "previa">("vazio");

  const simularUpload = () => {
    setEstado("carregando");
    setTimeout(() => setEstado("previa"), 1200);
  };

  const novas = PREVIEW.filter((p) => !p.duplicado).length;
  const dups = PREVIEW.filter((p) => p.duplicado).length;

  return (
    <div className="space-y-6 max-w-[1100px] mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Importar extrato InfinityPay</h1>
        <p className="text-sm text-muted-foreground mt-1">Faça upload do .xlsx exportado da conta. O sistema identifica duplicidades automaticamente.</p>
      </div>

      {estado === "vazio" && (
        <Card className="p-12 border-dashed border-2 shadow-card">
          <div className="flex flex-col items-center text-center max-w-md mx-auto">
            <div className="size-16 rounded-2xl bg-gradient-primary flex items-center justify-center mb-4 shadow-elevated">
              <Upload className="size-7 text-primary-foreground" />
            </div>
            <h3 className="font-semibold text-lg">Arraste seu arquivo aqui</h3>
            <p className="text-sm text-muted-foreground mt-1 mb-6">
              Formato suportado: Excel (.xlsx) exportado da InfinityPay. Você pode importar extratos históricos desde 2025.
            </p>
            <Button size="lg" onClick={simularUpload}>
              <FileSpreadsheet className="size-4 mr-2" /> Selecionar arquivo
            </Button>
            <p className="text-xs text-muted-foreground mt-4">
              Colunas detectadas: Data, Hora, Tipo, Nome, Detalhe, Valor
            </p>
          </div>
        </Card>
      )}

      {estado === "carregando" && (
        <Card className="p-12 shadow-card">
          <div className="flex flex-col items-center text-center">
            <Loader2 className="size-10 text-primary animate-spin" />
            <p className="mt-4 font-medium">Processando arquivo...</p>
            <p className="text-sm text-muted-foreground">Identificando duplicidades</p>
          </div>
        </Card>
      )}

      {estado === "previa" && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Card className="p-4 shadow-card">
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Total no arquivo</p>
              <p className="text-2xl font-bold mt-1">{PREVIEW.length}</p>
            </Card>
            <Card className="p-4 shadow-card border-l-4 border-l-success">
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Novas movimentações</p>
              <p className="text-2xl font-bold mt-1 text-success">{novas}</p>
            </Card>
            <Card className="p-4 shadow-card border-l-4 border-l-warning">
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Duplicadas (ignoradas)</p>
              <p className="text-2xl font-bold mt-1 text-warning">{dups}</p>
            </Card>
          </div>

          <Card className="shadow-card overflow-hidden">
            <div className="p-4 border-b flex items-center justify-between">
              <div>
                <p className="font-semibold">Prévia da importação</p>
                <p className="text-xs text-muted-foreground">Confirme para enviar as novas movimentações para a tela de classificação.</p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setEstado("vazio")}>Cancelar</Button>
                <Button onClick={() => { toast.success(`${novas} movimentações importadas`); setEstado("vazio"); }}>
                  <CheckCircle2 className="size-4 mr-1" /> Confirmar importação
                </Button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-secondary/50 text-xs uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="text-left px-4 py-3 font-medium">Data</th>
                    <th className="text-left px-4 py-3 font-medium">Tipo</th>
                    <th className="text-left px-4 py-3 font-medium">Nome</th>
                    <th className="text-left px-4 py-3 font-medium">Detalhe</th>
                    <th className="text-right px-4 py-3 font-medium">Valor</th>
                    <th className="text-center px-4 py-3 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {PREVIEW.map((p, i) => (
                    <tr key={i} className={`border-t ${p.duplicado ? "bg-warning/5" : ""}`}>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="text-xs text-muted-foreground">{p.hora}</div>
                        <div className="font-medium">{new Date(p.data).toLocaleDateString("pt-BR")}</div>
                      </td>
                      <td className="px-4 py-3 text-xs">{p.tipo}</td>
                      <td className="px-4 py-3 font-medium">{p.nome}</td>
                      <td className="px-4 py-3 text-muted-foreground">{p.detalhe}</td>
                      <td className={`px-4 py-3 text-right font-semibold tabular-nums ${p.valor >= 0 ? "text-success" : "text-destructive"}`}>
                        {formatBRL(p.valor)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {p.duplicado
                          ? <Badge variant="outline" className="border-warning text-warning"><AlertCircle className="size-3 mr-1" />Duplicada</Badge>
                          : <Badge className="bg-success text-success-foreground">Nova</Badge>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}
    </div>
  );
}
