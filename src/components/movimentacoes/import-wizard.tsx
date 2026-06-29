import { useRef, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Upload, FileSpreadsheet, AlertCircle, CheckCircle2, Loader2, X, PartyPopper } from "lucide-react";
import { toast } from "sonner";
import { formatBRL } from "@/lib/mock-data";
import { useMovimentacoes } from "@/lib/movimentacoes-store";
import { parseExtrato, type ParsedRow } from "@/lib/parse-extrato";

export function ImportWizard({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const [step, setStep] = useState<"upload" | "loading" | "preview" | "done">("upload");
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [fileName, setFileName] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [importadasCount, setImportadasCount] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const hasKey = useMovimentacoes((s) => s.hasKey);
  const addMany = useMovimentacoes((s) => s.addMany);

  const reset = () => { setRows([]); setFileName(""); setErro(null); setStep("upload"); setImportadasCount(0); };

  const processFile = async (file: File) => {
    setErro(null); setFileName(file.name); setStep("loading");
    try {
      const parsed = await parseExtrato(file, hasKey);
      if (parsed.length === 0) { setErro("Nenhuma linha válida no arquivo."); setStep("upload"); return; }
      setRows(parsed); setStep("preview");
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Falha ao ler o arquivo.";
      setErro(msg); setStep("upload"); toast.error(msg);
    }
  };

  const importar = (modo: "novas" | "todas") => {
    const lista = modo === "novas" ? rows.filter((r) => !r.duplicado) : rows;
    const datas = rows.map((r) => r.data).filter(Boolean).sort();
    const periodFrom = datas[0];
    const periodTo = datas[datas.length - 1];
    const n = addMany(lista, { fileName, periodFrom, periodTo });
    setImportadasCount(n);
    setStep("done");
  };

  const novas = rows.filter((p) => !p.duplicado).length;
  const dups = rows.filter((p) => p.duplicado).length;
  const datasOrdenadas = rows.map((r) => r.data).sort();

  return (
    <Dialog open={open} onOpenChange={(o) => { onOpenChange(o); if (!o) reset(); }}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="size-5 text-primary" /> Importar extrato InfinityPay
          </DialogTitle>
          <DialogDescription>
            {step === "upload" && "Etapa 1 de 3 — Selecione o arquivo .xlsx exportado da InfinityPay."}
            {step === "loading" && "Processando arquivo..."}
            {step === "preview" && "Etapa 2 de 3 — Revise as movimentações encontradas."}
            {step === "done" && "Etapa 3 de 3 — Concluído!"}
          </DialogDescription>
        </DialogHeader>

        {step === "upload" && (
          <div
            className={`mt-4 p-12 border-2 border-dashed rounded-xl transition-colors ${dragOver ? "border-primary bg-primary/5" : "border-border"}`}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files?.[0]; if (f) processFile(f); }}
          >
            <div className="flex flex-col items-center text-center">
              <div className="size-16 rounded-2xl bg-gradient-primary flex items-center justify-center mb-4 shadow-elevated">
                <Upload className="size-7 text-primary-foreground" />
              </div>
              <h3 className="font-semibold">Arraste o arquivo aqui</h3>
              <p className="text-sm text-muted-foreground mt-1 mb-4">ou selecione manualmente — formatos .xlsx ou .xls</p>
              <input ref={inputRef} type="file" accept=".xlsx,.xls" className="hidden"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) processFile(f); e.target.value = ""; }} />
              <Button onClick={() => inputRef.current?.click()}>
                <FileSpreadsheet className="size-4 mr-2" /> Selecionar arquivo
              </Button>
              {erro && <p className="mt-4 text-sm text-destructive flex items-center gap-2"><AlertCircle className="size-4" />{erro}</p>}
            </div>
          </div>
        )}

        {step === "loading" && (
          <div className="py-16 flex flex-col items-center">
            <Loader2 className="size-10 text-primary animate-spin" />
            <p className="mt-4 font-medium">Processando {fileName}...</p>
          </div>
        )}

        {step === "preview" && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="rounded-lg border p-3"><p className="text-[10px] uppercase text-muted-foreground">Arquivo</p><p className="text-sm font-semibold truncate" title={fileName}>{fileName}</p></div>
              <div className="rounded-lg border p-3"><p className="text-[10px] uppercase text-muted-foreground">Movimentações</p><p className="text-lg font-bold">{rows.length}</p></div>
              <div className="rounded-lg border p-3"><p className="text-[10px] uppercase text-muted-foreground">Período</p><p className="text-xs font-semibold">{new Date(datasOrdenadas[0]).toLocaleDateString("pt-BR")} → {new Date(datasOrdenadas[datasOrdenadas.length - 1]).toLocaleDateString("pt-BR")}</p></div>
              <div className="rounded-lg border p-3"><p className="text-[10px] uppercase text-muted-foreground">Última movim.</p><p className="text-xs font-semibold">{new Date(datasOrdenadas[datasOrdenadas.length - 1]).toLocaleDateString("pt-BR")}</p></div>
            </div>

            <div className="flex flex-wrap gap-3 text-sm">
              <Badge className="bg-success text-success-foreground">{novas} novas</Badge>
              <Badge variant="outline" className="border-warning text-warning"><AlertCircle className="size-3 mr-1" />{dups} já importadas</Badge>
            </div>

            <div className="border rounded-lg max-h-[400px] overflow-auto">
              <table className="w-full text-sm">
                <thead className="bg-secondary/50 text-xs uppercase tracking-wider text-muted-foreground sticky top-0">
                  <tr>
                    <th className="text-left px-3 py-2 font-medium">Data</th>
                    <th className="text-left px-3 py-2 font-medium">Nome</th>
                    <th className="text-left px-3 py-2 font-medium">Detalhe</th>
                    <th className="text-right px-3 py-2 font-medium">Valor</th>
                    <th className="text-center px-3 py-2 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((p) => (
                    <tr key={p.id} className={`border-t ${p.duplicado ? "bg-warning/5" : ""}`}>
                      <td className="px-3 py-2 whitespace-nowrap text-xs">{new Date(p.data).toLocaleDateString("pt-BR")} {p.hora}</td>
                      <td className="px-3 py-2 font-medium">{p.nome}</td>
                      <td className="px-3 py-2 text-muted-foreground text-xs">{p.detalhe}</td>
                      <td className={`px-3 py-2 text-right font-semibold tabular-nums ${p.valor >= 0 ? "text-success" : "text-destructive"}`}>{formatBRL(p.valor)}</td>
                      <td className="px-3 py-2 text-center">
                        {p.duplicado
                          ? <Badge variant="outline" className="border-warning text-warning text-[10px]">Duplicada</Badge>
                          : <Badge className="bg-success text-success-foreground text-[10px]">Nova</Badge>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex gap-2 justify-end pt-2">
              <Button variant="outline" onClick={reset}><X className="size-4 mr-1" /> Cancelar</Button>
              <Button variant="outline" onClick={() => importar("todas")} disabled={rows.length === 0}>Importar todas ({rows.length})</Button>
              <Button onClick={() => importar("novas")} disabled={novas === 0}>
                <CheckCircle2 className="size-4 mr-1" /> Importar apenas novas ({novas})
              </Button>
            </div>
          </div>
        )}

        {step === "done" && (
          <div className="py-12 flex flex-col items-center text-center">
            <div className="size-20 rounded-full bg-success/15 flex items-center justify-center mb-4">
              <PartyPopper className="size-10 text-success" />
            </div>
            <h3 className="text-xl font-bold">Importação concluída!</h3>
            <p className="text-sm text-muted-foreground mt-1 mb-6">{importadasCount} movimentações adicionadas à Central.</p>
            <Button onClick={() => { onOpenChange(false); reset(); }}>Ir para a Central</Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
