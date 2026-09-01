import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Mail, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { inviteUser } from "@/lib/api/usuarios.functions";
import { APP_PERMISSIONS, PERMISSION_LABEL, type AppPermission } from "@/lib/permissoes";

export function InviteDialog({ open, onOpenChange, onInvited }: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onInvited: () => void;
}) {
  const invite = useServerFn(inviteUser);
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState<"admin" | "viewer">("viewer");
  const [perms, setPerms] = useState<AppPermission[]>([]);
  const [sending, setSending] = useState(false);

  const toggle = (p: AppPermission) =>
    setPerms((cur) => (cur.includes(p) ? cur.filter((x) => x !== p) : [...cur, p]));

  const reset = () => { setEmail(""); setFullName(""); setRole("viewer"); setPerms([]); };

  const submit = async () => {
    if (!email.includes("@")) { toast.error("Informe um e-mail válido"); return; }
    setSending(true);
    try {
      await invite({
        data: {
          email,
          fullName: fullName || undefined,
          role,
          permissions: perms,
          redirectTo: `${window.location.origin}/auth`,
        },
      });
      toast.success("Convite enviado por e-mail");
      reset();
      onOpenChange(false);
      onInvited();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Não foi possível enviar o convite");
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!sending) { onOpenChange(v); if (!v) reset(); } }}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><Mail className="size-4 text-primary" /> Convidar usuário</DialogTitle>
          <DialogDescription>
            A pessoa recebe um e-mail para criar a senha e já entra ativa com o perfil e as permissões definidas aqui.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="invite-email">E-mail</Label>
            <Input id="invite-email" type="email" placeholder="nome@email.com" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="invite-name">Nome (opcional)</Label>
            <Input id="invite-name" placeholder="Nome completo" value={fullName} onChange={(e) => setFullName(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Perfil</Label>
            <Select value={role} onValueChange={(v) => setRole(v as "admin" | "viewer")}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">Administrador financeiro (acesso total)</SelectItem>
                <SelectItem value="viewer">Visualizador (consulta + permissões escolhidas)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {role === "viewer" && (
            <div className="space-y-2">
              <Label>Permissões adicionais</Label>
              <div className="rounded-lg border divide-y">
                {APP_PERMISSIONS.map((p) => (
                  <label key={p} className="flex items-start gap-3 p-3 cursor-pointer">
                    <Checkbox checked={perms.includes(p)} onCheckedChange={() => toggle(p)} className="mt-0.5" />
                    <span>
                      <span className="block text-sm font-medium">{PERMISSION_LABEL[p].label}</span>
                      <span className="block text-xs text-muted-foreground">{PERMISSION_LABEL[p].hint}</span>
                    </span>
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={sending}>Cancelar</Button>
          <Button onClick={submit} disabled={sending}>
            {sending ? <><Loader2 className="size-4 animate-spin" /> Enviando...</> : "Enviar convite"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
