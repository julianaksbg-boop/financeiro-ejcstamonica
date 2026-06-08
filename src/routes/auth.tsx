import { createFileRoute, useNavigate, useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useAuth } from "@/lib/auth-context";
import { toast } from "sonner";
import { Wallet } from "lucide-react";

export const Route = createFileRoute("/auth")({
  head: () => ({ meta: [{ title: "Entrar — Financeiro EJC" }] }),
  component: AuthPage,
});

function AuthPage() {
  const { signIn, signUp, user, loading } = useAuth();
  const navigate = useNavigate();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!loading && user) navigate({ to: "/dashboard" });
  }, [user, loading, navigate]);

  const handle = async (mode: "in" | "up") => {
    if (!email || password.length < 6) {
      toast.error("Informe email válido e senha com pelo menos 6 caracteres");
      return;
    }
    setBusy(true);
    const { error } = mode === "in" ? await signIn(email, password) : await signUp(email, password);
    setBusy(false);
    if (error) { toast.error(error); return; }
    if (mode === "up") toast.success("Conta criada! Verifique seu email se necessário.");
    router.invalidate();
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-gradient-surface">
      <div className="w-full max-w-md">
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="size-12 rounded-xl bg-gradient-primary flex items-center justify-center shadow-elevated">
            <Wallet className="size-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Financeiro EJC</h1>
            <p className="text-xs text-muted-foreground">Encontro de Jovens com Cristo</p>
          </div>
        </div>

        <Card className="p-6 shadow-elevated">
          <Tabs defaultValue="in" className="w-full">
            <TabsList className="grid grid-cols-2 w-full mb-6">
              <TabsTrigger value="in">Entrar</TabsTrigger>
              <TabsTrigger value="up">Criar conta</TabsTrigger>
            </TabsList>

            <TabsContent value="in" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email-in">Email</Label>
                <Input id="email-in" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="voce@ejc.com" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pw-in">Senha</Label>
                <Input id="pw-in" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
              </div>
              <Button className="w-full" disabled={busy} onClick={() => handle("in")}>
                {busy ? "Entrando..." : "Entrar"}
              </Button>
            </TabsContent>

            <TabsContent value="up" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email-up">Email</Label>
                <Input id="email-up" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="voce@ejc.com" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pw-up">Senha</Label>
                <Input id="pw-up" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="mínimo 6 caracteres" />
              </div>
              <Button className="w-full" disabled={busy} onClick={() => handle("up")}>
                {busy ? "Criando..." : "Criar conta"}
              </Button>
            </TabsContent>
          </Tabs>
        </Card>

        <p className="text-center text-xs text-muted-foreground mt-6">
          Acesso restrito ao administrador financeiro e à coordenação do EJC.
        </p>
      </div>
    </div>
  );
}
