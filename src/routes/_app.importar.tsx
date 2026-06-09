import { createFileRoute } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Upload, FileSpreadsheet, AlertCircle, CheckCircle2, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { formatBRL } from "@/lib/mock-data";
import { useMovimentacoes } from "@/lib/movimentacoes-store";
import { parseExtrato, type ParsedRow } from "@/lib/parse-extrato";
import { useNavigate } from "@tanstack/react-router";

export const Route = createFileRoute("/_app/importar")({
  head: () => ({ meta: [{ title: "Importar extrato — Financeiro EJC" }] }),
  component: ImportarPage,
});

function ImportarPage() {
  const [estado, setEstado] = useState<"vazio" | "carregando" | "previa">("vazio");
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [fileName, setFileName] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const hasKey = useMovimentacoes((s) => s.hasKey);
  const addMany = useMovimentacoes((s) => s.addMany);
  const navigate = useNavigate();

  const processFile = async (file: File) => {
    setErro(null);
    setFileName(file.name);
    setEstado("carregando");
    try {
      const parsed = await parseExtrato(file, hasKey);
      if (parsed.length === 0) {
        setErro("Nenhuma linha válida encontrada no arquivo.");
        setEstado("vazio");
        return;
      }
      setRows(parsed);
      setEstado("previa");
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Falha ao ler o arquivo.";
      setErro(msg);
      setEstado("vazio");
      toast.error(msg);
    }
  };

  const confirmar = () => {
    const novos = rows.filter((r) => !r.duplicado);
    const adicionados = addMany(novos);
    toast.success(`${adicionados} movimentações importadas${adicionados < novos.length ? ` (${novos.length - adicionados} já existentes)` : ""}`);
    setRows([]);
    setEstado("vazio");
    navigate({ to: "/movimentacoes" });
  };

  const novas = rows.filter((p) => !p.duplicado).length;
  const dups = rows.filter((p) => p.duplicado).length;

  return (
    <div className="space-y-6 max-w-[1100px] mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Importar extrato InfinityPay</h1>
        <p className="text-sm text-muted-foreground mt-1">Faça upload do .xlsx exportado da conta. O sistema identifica duplicidades automaticamente.</p>
      </div>

      {estado === "vazio" && (
        <Card
          className={`p-12 border-dashed border-2 shadow-card transition-colors ${dragOver ? "border-primary bg-primary/5" : ""}`}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            const f = e.dataTransfer.files?.[0];
            if (f) processFile(f);
          }}
        >
          <div className="flex flex-col items-center text-center max-w-md mx-auto">
            <div className="size-16 rounded-2xl bg-gradient-primary flex items-center justify-center mb-4 shadow-elevated">
              <Upload className="size-7 text-primary-foreground" />
            </div>
            <h3 className="font-semibold text-lg">Arraste seu arquivo aqui</h3>
            <p className="text-sm text-muted-foreground mt-1 mb-6">
              Formato suportado: Excel (.xlsx) exportado da InfinityPay. Você pode importar extratos históricos desde 2025.
            </p>
            <input
              ref={inputRef}
              type="file"
              accept=".xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) processFile(f);
                e.target.value = "";
              }}
            />
            <Button size="lg" onClick={() => inputRef.current?.click()}>
              <FileSpreadsheet className="size-4 mr-2" /> Selecionar arquivo
            </Button>
            <p className="text-xs text-muted-foreground mt-4">
              Colunas detectadas: Data, Hora, Tipo de transação, Nome, Detalhe, Valor
            </p>
            {erro && (
              <p className="mt-4 text-sm text-destructive flex items-center gap-2"><AlertCircle className="size-4" /> {erro}</p>
            )}
          </div>
        </Card>
      )}

      {estado === "carregando" && (
        <Card className="p-12 shadow-card">
          <div className="flex flex-col items-center text-center">
            <Loader2 className="size-10 text-primary animate-spin" />
            <p className="mt-4 font-medium">Processando {fileName}...</p>
            <p className="text-sm text-muted-foreground">Identificando duplicidades</p>
          </div>
        </Card>
      )}

      {estado === "previa" && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Card className="p-4 shadow-card">
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Total no arquivo</p>
              <p className="text-2xl font-bold mt-1">{rows.length}</p>
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
            <div className="p-4 border-b flex items-center justify-between flex-wrap gap-3">
              <div>
                <p className="font-semibold">Prévia da importação — {fileName}</p>
                <p className="text-xs text-muted-foreground">Confirme para enviar as novas movimentações para a tela de classificação.</p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => { setRows([]); setEstado("vazio"); }}>
                  <X className="size-4 mr-1" /> Cancelar
                </Button>
                <Button onClick={confirmar} disabled={novas === 0}>
                  <CheckCircle2 className="size-4 mr-1" /> Confirmar importação ({novas})
                </Button>
              </div>
            </div>
            <div className="overflow-x-auto max-h-[600px]">
              <table className="w-full text-sm">
                <thead className="bg-secondary/50 text-xs uppercase tracking-wider text-muted-foreground sticky top-0">
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
                  {rows.map((p) => (
                    <tr key={p.id} className={`border-t ${p.duplicado ? "bg-warning/5" : ""}`}>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="text-xs text-muted-foreground">{p.hora}</div>
                        <div className="font-medium">{new Date(p.data).toLocaleDateString("pt-BR")}</div>
                      </td>
                      <td className="px-4 py-3 text-xs">{p.tipoTransacao}</td>
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
