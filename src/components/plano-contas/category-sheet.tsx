import { useEffect, useState } from "react";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Archive, ArchiveRestore, Check, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  useCreateCategory, useCreateGroup, useDeleteCategory, useUpdateCategory,
  type AccountStatus, type AccountType, type CategoriaFlat, type AccountGroup,
} from "@/lib/plano-contas";

interface Props {
  open: boolean;
  onClose: () => void;
  groups: AccountGroup[];
  /** categoria em edição; ausente = criação */
  categoria?: CategoriaFlat | null;
  usageCount?: number;
  canEdit: boolean;
}

export function CategorySheet({ open, onClose, groups, categoria, usageCount = 0, canEdit }: Props) {
  const createCategory = useCreateCategory();
  const updateCategory = useUpdateCategory();
  const deleteCategory = useDeleteCategory();
  const createGroup = useCreateGroup();

  const [tipo, setTipo] = useState<AccountType>("Despesa");
  const [grupoId, setGrupoId] = useState("");
  const [nome, setNome] = useState("");
  const [descricao, setDescricao] = useState("");
  const [status, setStatus] = useState<AccountStatus>("ativo");
  const [novoGrupo, setNovoGrupo] = useState("");
  const [criandoGrupo, setCriandoGrupo] = useState(false);

  useEffect(() => {
    if (!open) return;
    setTipo(categoria?.tipo ?? "Despesa");
    setGrupoId(categoria?.grupoId ?? "");
    setNome(categoria?.nome ?? "");
    setDescricao(categoria?.descricao ?? "");
    setStatus(categoria?.status ?? "ativo");
    setNovoGrupo("");
    setCriandoGrupo(false);
  }, [open, categoria?.id]);

  const gruposDoTipo = groups.filter((g) => g.type === tipo && g.status === "ativo");

  const salvarNovoGrupo = async () => {
    if (!novoGrupo.trim()) return;
    try {
      const g = await createGroup.mutateAsync({ name: novoGrupo, type: tipo });
      setGrupoId(g.id);
      setNovoGrupo("");
      setCriandoGrupo(false);
      toast.success(`Grupo "${g.name}" criado`);
    } catch (e) {
      toast.error(`Não foi possível criar o grupo: ${(e as Error).message}`);
    }
  };

  const salvar = async () => {
    if (!grupoId) return toast.error("Selecione ou crie um grupo.");
    if (!nome.trim()) return toast.error("Informe o nome da categoria.");
    try {
      if (categoria) {
        await updateCategory.mutateAsync({ id: categoria.id, group_id: grupoId, name: nome.trim(), description: descricao || null, status });
        toast.success("Categoria atualizada");
      } else {
        await createCategory.mutateAsync({ group_id: grupoId, name: nome.trim(), description: descricao || null, status });
        toast.success("Categoria criada");
      }
      onClose();
    } catch (e) {
      toast.error(`Erro ao salvar: ${(e as Error).message}`);
    }
  };

  const excluir = async () => {
    if (!categoria) return;
    if (usageCount > 0) return toast.error("Categoria já utilizada em movimentações. Arquive-a em vez de excluir.");
    try {
      await deleteCategory.mutateAsync(categoria.id);
      toast.success("Categoria excluída");
      onClose();
    } catch (e) {
      toast.error(`Erro ao excluir: ${(e as Error).message}`);
    }
  };

  const alternarArquivo = async () => {
    if (!categoria) return;
    const novo: AccountStatus = categoria.status === "ativo" ? "arquivado" : "ativo";
    try {
      await updateCategory.mutateAsync({ id: categoria.id, status: novo });
      setStatus(novo);
      toast.success(novo === "arquivado" ? "Categoria arquivada" : "Categoria reativada");
    } catch (e) {
      toast.error(`Erro: ${(e as Error).message}`);
    }
  };

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{categoria ? "Editar categoria" : "Nova categoria"}</SheetTitle>
          <SheetDescription>
            {categoria
              ? `${categoria.tipo} › ${categoria.grupo} · ${usageCount} movimentaç${usageCount === 1 ? "ão" : "ões"}`
              : "Defina o tipo, o grupo e o nome da categoria."}
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-5 px-4 pb-8">
          <div className="space-y-2">
            <Label>Tipo</Label>
            <Select value={tipo} onValueChange={(v) => { setTipo(v as AccountType); setGrupoId(""); }} disabled={!canEdit}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Receita">Receita</SelectItem>
                <SelectItem value="Despesa">Despesa</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Grupo</Label>
              {canEdit && (
                <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => setCriandoGrupo((v) => !v)}>
                  <Plus className="size-3.5 mr-1" /> Novo grupo
                </Button>
              )}
            </div>
            {criandoGrupo && (
              <Card className="p-3 space-y-2 bg-secondary/40">
                <Input placeholder={`Nome do grupo de ${tipo.toLowerCase()}`} value={novoGrupo} onChange={(e) => setNovoGrupo(e.target.value)} />
                <div className="flex gap-2">
                  <Button size="sm" className="flex-1" onClick={salvarNovoGrupo} disabled={createGroup.isPending}>
                    <Check className="size-3.5 mr-1" /> Criar grupo
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => { setCriandoGrupo(false); setNovoGrupo(""); }}>Cancelar</Button>
                </div>
              </Card>
            )}
            <Select value={grupoId} onValueChange={setGrupoId} disabled={!canEdit}>
              <SelectTrigger><SelectValue placeholder="Selecione um grupo" /></SelectTrigger>
              <SelectContent>
                {gruposDoTipo.map((g) => <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Nome da categoria</Label>
            <Input value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Ex.: Supermercado" disabled={!canEdit} />
          </div>

          <div className="space-y-2">
            <Label>Descrição <span className="text-xs text-muted-foreground">(opcional)</span></Label>
            <Textarea rows={3} value={descricao} onChange={(e) => setDescricao(e.target.value)} disabled={!canEdit} />
          </div>

          <div className="space-y-2">
            <Label>Status</Label>
            <Select value={status} onValueChange={(v) => setStatus(v as AccountStatus)} disabled={!canEdit}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ativo">Ativa</SelectItem>
                <SelectItem value="arquivado">Arquivada</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-[11px] text-muted-foreground">
              Categorias arquivadas não aparecem em novas classificações, mas continuam nos lançamentos e relatórios.
            </p>
          </div>

          {canEdit && (
            <>
              <div className="flex gap-2 pt-2">
                <Button variant="outline" className="flex-1" onClick={onClose}>Cancelar</Button>
                <Button className="flex-1" onClick={salvar} disabled={createCategory.isPending || updateCategory.isPending}>
                  <Check className="size-4 mr-1" /> Salvar categoria
                </Button>
              </div>

              {categoria && (
                <div className="border-t pt-4 space-y-2">
                  <Button variant="outline" className="w-full" onClick={alternarArquivo}>
                    {categoria.status === "ativo"
                      ? <><Archive className="size-4 mr-1" /> Arquivar categoria</>
                      : <><ArchiveRestore className="size-4 mr-1" /> Reativar categoria</>}
                  </Button>
                  <Button
                    variant="ghost"
                    className="w-full text-destructive hover:text-destructive"
                    onClick={excluir}
                    disabled={usageCount > 0}
                  >
                    <Trash2 className="size-4 mr-1" /> Excluir definitivamente
                  </Button>
                  {usageCount > 0 && (
                    <p className="text-[11px] text-muted-foreground text-center">
                      Esta categoria possui histórico ({usageCount}) e só pode ser arquivada.
                    </p>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
