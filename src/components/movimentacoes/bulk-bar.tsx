import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Check, X } from "lucide-react";
import { EVENTOS, EQUIPES, PILARES, FORMAS_PAGAMENTO, CATEGORIAS_DESPESA, CATEGORIAS_RECEITA, type Movimentacao } from "@/lib/mock-data";
import { useMovimentacoes } from "@/lib/movimentacoes-store";
import { toast } from "sonner";

export function BulkBar({ ids, onClear }: { ids: string[]; onClear: () => void }) {
  const updateMany = useMovimentacoes((s) => s.updateMany);
  const [evento, setEvento] = useState("");
  const [responsavel, setResponsavel] = useState("");
  const [forma, setForma] = useState<Movimentacao["formaPagamento"] | "">("");
  const [categoria, setCategoria] = useState("");
  const [obs, setObs] = useState("");

  const aplicar = () => {
    const patch: Partial<Movimentacao> = {};
    if (evento) patch.evento = evento;
    if (responsavel) patch.responsavel = responsavel;
    if (forma) patch.formaPagamento = forma as Movimentacao["formaPagamento"];
    if (categoria) patch.categoria = categoria;
    if (obs) patch.observacao = obs;
    if (Object.keys(patch).length === 0) {
      toast.error("Preencha ao menos um campo para aplicar.");
      return;
    }
    patch.status = "Classificada";
    updateMany(ids, patch);
    toast.success(`${ids.length} movimentações classificadas em lote`);
    setEvento(""); setResponsavel(""); setForma(""); setCategoria(""); setObs("");
    onClear();
  };

  const categorias = [...CATEGORIAS_RECEITA, ...CATEGORIAS_DESPESA];

  return (
    <Card className="p-3 shadow-elevated border-primary/40 bg-primary/5 animate-fade-in">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm font-semibold pr-2 border-r mr-1">
          {ids.length} selecionada{ids.length > 1 ? "s" : ""}
        </span>
        <Select value={evento} onValueChange={setEvento}>
          <SelectTrigger className="h-9 w-[160px] text-xs"><SelectValue placeholder="Evento" /></SelectTrigger>
          <SelectContent>{EVENTOS.map((e) => <SelectItem key={e.id} value={e.nome}>{e.nome}</SelectItem>)}</SelectContent>
        </Select>
        <Select value={responsavel} onValueChange={setResponsavel}>
          <SelectTrigger className="h-9 w-[170px] text-xs"><SelectValue placeholder="Responsável" /></SelectTrigger>
          <SelectContent>
            {EQUIPES.map((e) => <SelectItem key={e} value={e}>{e}</SelectItem>)}
            {PILARES.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={forma} onValueChange={(v) => setForma(v as typeof forma)}>
          <SelectTrigger className="h-9 w-[130px] text-xs"><SelectValue placeholder="Forma pgto" /></SelectTrigger>
          <SelectContent>{FORMAS_PAGAMENTO.map((f) => <SelectItem key={f} value={f}>{f}</SelectItem>)}</SelectContent>
        </Select>
        <Select value={categoria} onValueChange={setCategoria}>
          <SelectTrigger className="h-9 w-[160px] text-xs"><SelectValue placeholder="Categoria" /></SelectTrigger>
          <SelectContent>{categorias.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
        </Select>
        <Input className="h-9 w-[180px] text-xs" placeholder="Observação" value={obs} onChange={(e) => setObs(e.target.value)} />
        <div className="ml-auto flex gap-2">
          <Button variant="ghost" size="sm" onClick={onClear}><X className="size-4" /> Limpar</Button>
          <Button size="sm" onClick={aplicar}><Check className="size-4 mr-1" /> Aplicar a {ids.length}</Button>
        </div>
      </div>
    </Card>
  );
}
