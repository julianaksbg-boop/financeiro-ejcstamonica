import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Sparkles, Check, FileUp, Wand2 } from "lucide-react";
import {
  EVENTOS, EQUIPES, PILARES, FORMAS_PAGAMENTO,
  CATEGORIAS_DESPESA, CATEGORIAS_RECEITA, formatBRL,
  type Movimentacao,
} from "@/lib/mock-data";
import { useMovimentacoes } from "@/lib/movimentacoes-store";
import { sugestaoPara, type Sugestao } from "@/lib/sugestoes";
import { toast } from "sonner";

interface Props {
  item: Movimentacao | null;
  sugestoes: Map<string, Sugestao>;
  onClose: () => void;
  isNew?: boolean;
}

export function ClassifySheet({ item, sugestoes, onClose, isNew }: Props) {
  const update = useMovimentacoes((s) => s.update);
  const addManual = useMovimentacoes((s) => s.addManual);
  const [data, setData] = useState("");
  const [nome, setNome] = useState("");
  const [detalhe, setDetalhe] = useState("");
  const [valor, setValor] = useState(0);
  const [tipo, setTipo] = useState<Movimentacao["tipo"] | "">("");
  const [evento, setEvento] = useState("");
  const [responsavel, setResponsavel] = useState("");
  const [categoria, setCategoria] = useState("");
  const [forma, setForma] = useState<Movimentacao["formaPagamento"] | "">("");
  const [obs, setObs] = useState("");

  useEffect(() => {
    if (!item) return;
    setData(item.data);
    setNome(item.nome);
    setDetalhe(item.detalhe);
    setValor(item.valor);
    setTipo(item.tipo ?? (item.valor >= 0 ? "Receita" : "Despesa"));
    setEvento(item.evento ?? "");
    setResponsavel(item.responsavel ?? "");
    setCategoria(item.categoria ?? "");
    setForma(item.formaPagamento ?? "");
    setObs(item.observacao ?? "");
  }, [item?.id]);

  if (!item) return null;

  const sug = sugestaoPara(sugestoes, item.nome);
  const categorias = tipo === "Receita" ? CATEGORIAS_RECEITA : CATEGORIAS_DESPESA;

  const aceitarSugestao = () => {
    if (!sug) return;
    if (sug.evento) setEvento(sug.evento);
    if (sug.responsavel) setResponsavel(sug.responsavel);
    if (sug.categoria) setCategoria(sug.categoria);
    if (sug.formaPagamento) setForma(sug.formaPagamento);
    if (sug.tipo) setTipo(sug.tipo);
    toast.success("Sugestão aplicada. Revise antes de confirmar.");
  };

  const confirmar = () => {
    const patch: Partial<Movimentacao> = {
      tipo: (tipo || undefined) as Movimentacao["tipo"],
      evento: evento || undefined,
      responsavel: responsavel || undefined,
      categoria: categoria || undefined,
      formaPagamento: (forma || undefined) as Movimentacao["formaPagamento"],
      observacao: obs || undefined,
      status: "Classificada",
    };
    if (isNew) {
      addManual({
        id: `man-${Date.now()}`,
        data, hora: new Date().toTimeString().slice(0, 5),
        tipoTransacao: "Lançamento manual",
        nome, detalhe, valor,
        ...patch,
        status: "Classificada",
      });
      toast.success("Lançamento manual criado");
    } else {
      update(item.id, patch);
      toast.success("Movimentação classificada com sucesso");
    }
    onClose();
  };

  return (
    <Sheet open={!!item} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{isNew ? "Novo lançamento manual" : "Classificar movimentação"}</SheetTitle>
          <SheetDescription>{new Date(item.data).toLocaleDateString("pt-BR")} • {item.hora}</SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-5 px-4">
          {isNew ? (
            <Card className="p-4 bg-secondary/40 space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div><Label className="text-xs">Data</Label><Input type="date" value={data} onChange={(e) => setData(e.target.value)} /></div>
                <div><Label className="text-xs">Valor (negativo = despesa)</Label><Input type="number" step="0.01" value={valor} onChange={(e) => setValor(parseFloat(e.target.value) || 0)} /></div>
              </div>
              <div><Label className="text-xs">Nome / Fornecedor</Label><Input value={nome} onChange={(e) => setNome(e.target.value)} /></div>
              <div><Label className="text-xs">Detalhe</Label><Input value={detalhe} onChange={(e) => setDetalhe(e.target.value)} /></div>
            </Card>
          ) : (
            <Card className="p-4 bg-secondary/40">
              <div className="flex justify-between items-start gap-3">
                <div className="min-w-0">
                  <p className="font-semibold truncate">{item.nome}</p>
                  <p className="text-xs text-muted-foreground">{item.detalhe || item.tipoTransacao}</p>
                  <p className="text-[10px] text-muted-foreground mt-1">{item.tipoTransacao}</p>
                </div>
                <div className={`text-xl font-bold tabular-nums shrink-0 ${item.valor >= 0 ? "text-success" : "text-destructive"}`}>
                  {formatBRL(item.valor)}
                </div>
              </div>
            </Card>
          )}

          {sug && !isNew && (
            <Card className="p-4 border-primary/40 bg-primary/5">
              <div className="flex items-start gap-2 mb-3">
                <Sparkles className="size-4 text-primary shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-semibold">Sugestão encontrada</p>
                  <p className="text-[11px] text-muted-foreground">Baseada em {sug.baseadoEm} classificaç{sug.baseadoEm > 1 ? "ões" : "ão"} anteriores com este fornecedor.</p>
                </div>
              </div>
              <div className="space-y-1 text-xs">
                {sug.evento && <p><span className="text-muted-foreground">Evento:</span> <strong>{sug.evento}</strong></p>}
                {sug.responsavel && <p><span className="text-muted-foreground">Responsável:</span> <strong>{sug.responsavel}</strong></p>}
                {sug.categoria && <p><span className="text-muted-foreground">Categoria:</span> <strong>{sug.categoria}</strong></p>}
                {sug.formaPagamento && <p><span className="text-muted-foreground">Forma:</span> <strong>{sug.formaPagamento}</strong></p>}
              </div>
              <Button size="sm" variant="outline" className="mt-3 w-full border-primary/50 text-primary hover:bg-primary/10" onClick={aceitarSugestao}>
                <Wand2 className="size-3.5 mr-1" /> Aceitar sugestão
              </Button>
            </Card>
          )}

          <div className="space-y-2">
            <Label>Tipo</Label>
            <Select value={tipo} onValueChange={(v) => setTipo(v as typeof tipo)}>
              <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Receita">Receita</SelectItem>
                <SelectItem value="Despesa">Despesa</SelectItem>
                <SelectItem value="Adiantamento">Adiantamento</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Evento</Label>
            <Select value={evento} onValueChange={setEvento}>
              <SelectTrigger><SelectValue placeholder="Selecione um evento" /></SelectTrigger>
              <SelectContent>
                {EVENTOS.map((e) => <SelectItem key={e.id} value={e.nome}>{e.nome}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Responsável</Label>
            <Select value={responsavel} onValueChange={setResponsavel}>
              <SelectTrigger><SelectValue placeholder="Equipe ou pilar" /></SelectTrigger>
              <SelectContent>
                <div className="px-2 py-1 text-[10px] uppercase text-muted-foreground font-semibold">Equipes</div>
                {EQUIPES.map((e) => <SelectItem key={e} value={e}>{e}</SelectItem>)}
                <div className="px-2 py-1 text-[10px] uppercase text-muted-foreground font-semibold mt-1">Pilares</div>
                {PILARES.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Categoria</Label>
            <Select value={categoria} onValueChange={setCategoria}>
              <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>
                {categorias.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Forma de pagamento</Label>
            <Select value={forma} onValueChange={(v) => setForma(v as typeof forma)}>
              <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>
                {FORMAS_PAGAMENTO.map((f) => <SelectItem key={f} value={f}>{f}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Observação</Label>
            <Textarea placeholder="Notas internas (opcional)" rows={3} value={obs} onChange={(e) => setObs(e.target.value)} />
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-2">Comprovante <span className="text-[10px] text-muted-foreground">(em breve)</span></Label>
            <Button variant="outline" className="w-full justify-start" type="button" disabled>
              <FileUp className="size-4 mr-2" /> Anexar comprovante
            </Button>
          </div>

          <div className="flex gap-2 pt-2 pb-6">
            <Button variant="outline" className="flex-1" onClick={onClose}>Cancelar</Button>
            <Button className="flex-1" onClick={confirmar}>
              <Check className="size-4 mr-1" /> {isNew ? "Criar lançamento" : "Confirmar"}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
