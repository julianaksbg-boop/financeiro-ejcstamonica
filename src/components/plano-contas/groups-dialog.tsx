import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Archive, ArchiveRestore, Check, Pencil, Plus, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import {
  useCreateGroup, useDeleteGroup, useUpdateGroup,
  type AccountGroup, type AccountType, type AccountCategory,
} from "@/lib/plano-contas";

interface Props {
  open: boolean;
  onClose: () => void;
  groups: AccountGroup[];
  categories: AccountCategory[];
  canEdit: boolean;
}

export function GroupsDialog({ open, onClose, groups, categories, canEdit }: Props) {
  const createGroup = useCreateGroup();
  const updateGroup = useUpdateGroup();
  const deleteGroup = useDeleteGroup();

  const [novoNome, setNovoNome] = useState("");
  const [novoTipo, setNovoTipo] = useState<AccountType>("Despesa");
  const [editId, setEditId] = useState<string | null>(null);
  const [editNome, setEditNome] = useState("");

  const countOf = (id: string) => categories.filter((c) => c.group_id === id).length;

  const criar = async () => {
    if (!novoNome.trim()) return toast.error("Informe o nome do grupo.");
    try {
      await createGroup.mutateAsync({ name: novoNome, type: novoTipo });
      setNovoNome("");
      toast.success("Grupo criado");
    } catch (e) {
      toast.error(`Erro ao criar grupo: ${(e as Error).message}`);
    }
  };

  const salvarEdicao = async (g: AccountGroup) => {
    if (!editNome.trim()) return;
    try {
      await updateGroup.mutateAsync({ id: g.id, name: editNome.trim() });
      setEditId(null);
      toast.success("Grupo atualizado");
    } catch (e) {
      toast.error(`Erro: ${(e as Error).message}`);
    }
  };

  const alternarStatus = async (g: AccountGroup) => {
    try {
      await updateGroup.mutateAsync({ id: g.id, status: g.status === "ativo" ? "arquivado" : "ativo" });
      toast.success(g.status === "ativo" ? "Grupo arquivado" : "Grupo reativado");
    } catch (e) {
      toast.error(`Erro: ${(e as Error).message}`);
    }
  };

  const excluir = async (g: AccountGroup) => {
    if (countOf(g.id) > 0) return toast.error("Grupo com categorias. Mova ou exclua as categorias antes, ou arquive o grupo.");
    try {
      await deleteGroup.mutateAsync(g.id);
      toast.success("Grupo excluído");
    } catch (e) {
      toast.error(`Erro ao excluir: ${(e as Error).message}`);
    }
  };

  const render = (tipo: AccountType) => {
    const list = groups.filter((g) => g.type === tipo);
    return (
      <div className="space-y-2">
        <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">{tipo}s</p>
        {list.length === 0 && <p className="text-xs text-muted-foreground italic">Nenhum grupo cadastrado.</p>}
        {list.map((g) => (
          <div key={g.id} className="flex items-center gap-2 rounded-lg border px-3 py-2">
            {editId === g.id ? (
              <>
                <Input className="h-8" value={editNome} onChange={(e) => setEditNome(e.target.value)} />
                <Button size="icon" variant="ghost" className="size-8" onClick={() => salvarEdicao(g)}><Check className="size-4" /></Button>
                <Button size="icon" variant="ghost" className="size-8" onClick={() => setEditId(null)}><X className="size-4" /></Button>
              </>
            ) : (
              <>
                <span className="text-sm font-medium truncate flex-1">{g.name}</span>
                <Badge variant="outline" className="text-[10px]">{countOf(g.id)} cat.</Badge>
                {g.status === "arquivado" && <Badge variant="outline" className="text-[10px] border-muted-foreground text-muted-foreground">Arquivado</Badge>}
                {canEdit && (
                  <>
                    <Button size="icon" variant="ghost" className="size-8" onClick={() => { setEditId(g.id); setEditNome(g.name); }}>
                      <Pencil className="size-3.5" />
                    </Button>
                    <Button size="icon" variant="ghost" className="size-8" onClick={() => alternarStatus(g)}>
                      {g.status === "ativo" ? <Archive className="size-3.5" /> : <ArchiveRestore className="size-3.5" />}
                    </Button>
                    <Button size="icon" variant="ghost" className="size-8 text-destructive hover:text-destructive" onClick={() => excluir(g)} disabled={countOf(g.id) > 0}>
                      <Trash2 className="size-3.5" />
                    </Button>
                  </>
                )}
              </>
            )}
          </div>
        ))}
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Gerenciar grupos</DialogTitle>
          <DialogDescription>Grupos organizam as categorias por tema. Eles podem ser reutilizados em vários eventos.</DialogDescription>
        </DialogHeader>

        {canEdit && (
          <div className="flex gap-2">
            <Select value={novoTipo} onValueChange={(v) => setNovoTipo(v as AccountType)}>
              <SelectTrigger className="w-[130px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Receita">Receita</SelectItem>
                <SelectItem value="Despesa">Despesa</SelectItem>
              </SelectContent>
            </Select>
            <Input placeholder="Nome do novo grupo" value={novoNome} onChange={(e) => setNovoNome(e.target.value)} />
            <Button onClick={criar} disabled={createGroup.isPending}><Plus className="size-4" /></Button>
          </div>
        )}

        <div className="space-y-5">
          {render("Despesa")}
          {render("Receita")}
        </div>
      </DialogContent>
    </Dialog>
  );
}
