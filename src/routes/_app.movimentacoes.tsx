import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowDownRight, ArrowUpRight, Search, Sparkles, Check, FileUp } from "lucide-react";
import { MOVIMENTACOES, EVENTOS, EQUIPES, PILARES, FORMAS_PAGAMENTO, formatBRL, type Movimentacao } from "@/lib/mock-data";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/movimentacoes")({
  head: () => ({ meta: [{ title: "Movimentações — Financeiro EJC" }] }),
  component: MovimentacoesPage,
});

function MovimentacoesPage() {
  const [filtro, setFiltro] = useState<"todas" | "pendentes" | "sugeridas" | "classificadas">("todas");
  const [busca, setBusca] = useState("");
  const [selected, setSelected] = useState<Movimentacao | null>(null);

  const items = MOVIMENTACOES.filter((m) => {
    if (filtro === "pendentes" && m.status !== "Pendente") return false;
    if (filtro === "sugeridas" && m.status !== "Sugerida") return false;
    if (filtro === "classificadas" && m.status !== "Classificada") return false;
    if (busca && !`${m.nome} ${m.detalhe}`.toLowerCase().includes(busca.toLowerCase())) return false;
    return true;
  });

  const counts = {
    todas: MOVIMENTACOES.length,
    pendentes: MOVIMENTACOES.filter((m) => m.status === "Pendente").length,
    sugeridas: MOVIMENTACOES.filter((m) => m.status === "Sugerida").length,
    classificadas: MOVIMENTACOES.filter((m) => m.status === "Classificada").length,
  };

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Movimentações</h1>
        <p className="text-sm text-muted-foreground mt-1">Classifique cada lançamento por tipo, evento e responsável.</p>
      </div>

      <Card className="p-4 shadow-card">
        <div className="flex flex-wrap items-center gap-3">
          <Tabs value={filtro} onValueChange={(v) => setFiltro(v as typeof filtro)}>
            <TabsList>
              <TabsTrigger value="todas">Todas <Badge variant="secondary" className="ml-2">{counts.todas}</Badge></TabsTrigger>
              <TabsTrigger value="pendentes">Pendentes <Badge variant="secondary" className="ml-2 bg-warning/20 text-warning-foreground">{counts.pendentes}</Badge></TabsTrigger>
              <TabsTrigger value="sugeridas">Sugeridas <Badge variant="secondary" className="ml-2">{counts.sugeridas}</Badge></TabsTrigger>
              <TabsTrigger value="classificadas">Classificadas <Badge variant="secondary" className="ml-2">{counts.classificadas}</Badge></TabsTrigger>
            </TabsList>
          </Tabs>
          <div className="relative ml-auto w-full sm:w-72">
            <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Buscar por nome ou detalhe..." className="pl-9" value={busca} onChange={(e) => setBusca(e.target.value)} />
          </div>
        </div>
      </Card>

      <Card className="shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-secondary/50 text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="text-left px-4 py-3 font-medium">Data</th>
                <th className="text-left px-4 py-3 font-medium">Descrição</th>
                <th className="text-left px-4 py-3 font-medium">Evento / Responsável</th>
                <th className="text-right px-4 py-3 font-medium">Valor</th>
                <th className="text-center px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {items.map((m) => (
                <tr key={m.id} className="border-t hover:bg-secondary/30 transition-colors">
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="text-xs text-muted-foreground">{m.hora}</div>
                    <div className="font-medium">{new Date(m.data).toLocaleDateString("pt-BR")}</div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-medium">{m.nome}</div>
                    <div className="text-xs text-muted-foreground">{m.detalhe || m.tipoTransacao}</div>
                  </td>
                  <td className="px-4 py-3">
                    {m.evento ? (
                      <>
                        <div className="text-sm">{m.evento}</div>
                        <div className="text-xs text-muted-foreground">{m.responsavel}</div>
                      </>
                    ) : (
                      <span className="text-xs text-muted-foreground italic">não classificado</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className={`inline-flex items-center gap-1 font-semibold tabular-nums ${m.valor >= 0 ? "text-success" : "text-destructive"}`}>
                      {m.valor >= 0 ? <ArrowUpRight className="size-3.5" /> : <ArrowDownRight className="size-3.5" />}
                      {formatBRL(Math.abs(m.valor))}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    {m.status === "Classificada" && <Badge className="bg-success text-success-foreground">Classificada</Badge>}
                    {m.status === "Pendente" && <Badge variant="outline" className="border-warning text-warning">Pendente</Badge>}
                    {m.status === "Sugerida" && <Badge variant="outline" className="border-primary text-primary"><Sparkles className="size-3 mr-1" />Sugerida</Badge>}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Button size="sm" variant={m.status === "Classificada" ? "ghost" : "default"} onClick={() => setSelected(m)}>
                      {m.status === "Classificada" ? "Ver" : "Classificar"}
                    </Button>
                  </td>
                </tr>
              ))}
              {items.length === 0 && (
                <tr><td colSpan={6} className="text-center py-12 text-muted-foreground text-sm">Nenhuma movimentação encontrada.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <ClassifySheet item={selected} onClose={() => setSelected(null)} />
    </div>
  );
}

function ClassifySheet({ item, onClose }: { item: Movimentacao | null; onClose: () => void }) {
  const [tipo, setTipo] = useState(item?.tipo ?? (item && item.valor >= 0 ? "Receita" : "Despesa"));
  const [evento, setEvento] = useState(item?.evento ?? "");
  const [responsavel, setResponsavel] = useState(item?.responsavel ?? "");
  const [forma, setForma] = useState(item?.formaPagamento ?? "");
  const [obs, setObs] = useState(item?.observacao ?? "");

  if (!item) return null;
  const sugestao = item.status === "Sugerida";

  return (
    <Sheet open={!!item} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Classificar movimentação</SheetTitle>
          <SheetDescription>{new Date(item.data).toLocaleDateString("pt-BR")} • {item.hora}</SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-5 px-4">
          <Card className="p-4 bg-secondary/40">
            <div className="flex justify-between items-start">
              <div>
                <p className="font-semibold">{item.nome}</p>
                <p className="text-xs text-muted-foreground">{item.detalhe || item.tipoTransacao}</p>
              </div>
              <div className={`text-xl font-bold tabular-nums ${item.valor >= 0 ? "text-success" : "text-destructive"}`}>
                {formatBRL(item.valor)}
              </div>
            </div>
          </Card>

          {sugestao && (
            <Card className="p-3 bg-primary/5 border-primary/30 flex items-start gap-2 text-xs">
              <Sparkles className="size-4 text-primary shrink-0 mt-0.5" />
              <p><strong>Sugestão automática</strong> baseada em histórico. Revise antes de confirmar.</p>
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
            <Label>Comprovante</Label>
            <Button variant="outline" className="w-full justify-start" type="button">
              <FileUp className="size-4 mr-2" /> Anexar comprovante (opcional)
            </Button>
          </div>

          <div className="flex gap-2 pt-2 pb-6">
            <Button variant="outline" className="flex-1" onClick={onClose}>Cancelar</Button>
            <Button className="flex-1" onClick={() => { toast.success("Movimentação classificada com sucesso"); onClose(); }}>
              <Check className="size-4 mr-1" /> Confirmar
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
