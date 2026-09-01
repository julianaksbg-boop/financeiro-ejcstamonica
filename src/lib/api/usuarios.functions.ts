import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const permissionEnum = z.enum([
  "movimentacoes",
  "plano_contas",
  "adiantamentos",
  "eventos",
  "relatorios",
]);

const inviteSchema = z.object({
  email: z.string().email(),
  fullName: z.string().trim().max(120).optional(),
  role: z.enum(["admin", "viewer"]),
  permissions: z.array(permissionEnum).default([]),
  redirectTo: z.string().url(),
});

export const inviteUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(inviteSchema)
  .handler(async ({ data, context }) => {
    const { data: isAdmin, error: roleError } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (roleError) throw new Error(roleError.message);
    if (!isAdmin) throw new Error("Apenas administradores podem convidar usuários.");

    const email = data.email.trim().toLowerCase();
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // Cancel any previous pending invite for the same e-mail
    await supabaseAdmin
      .from("user_invites")
      .update({ status: "cancelled" })
      .eq("status", "pending")
      .ilike("email", email);

    const { data: invite, error: insertError } = await supabaseAdmin
      .from("user_invites")
      .insert({
        email,
        full_name: data.fullName || null,
        role: data.role,
        permissions: data.role === "admin" ? [] : data.permissions,
        invited_by: context.userId,
      })
      .select("id,email,full_name,role,permissions,status,created_at")
      .single();
    if (insertError) throw new Error(insertError.message);

    const { error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
      redirectTo: data.redirectTo,
      data: data.fullName ? { full_name: data.fullName } : undefined,
    });

    if (inviteError) {
      await supabaseAdmin.from("user_invites").update({ status: "cancelled" }).eq("id", invite.id);
      throw new Error(
        inviteError.message.includes("already been registered")
          ? "Este e-mail já possui uma conta no sistema."
          : `Não foi possível enviar o convite: ${inviteError.message}`,
      );
    }

    return { invite };
  });

export const resendInvite = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({ inviteId: z.string().uuid(), redirectTo: z.string().url() }))
  .handler(async ({ data, context }) => {
    const { data: isAdmin } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (!isAdmin) throw new Error("Apenas administradores podem reenviar convites.");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: invite, error } = await supabaseAdmin
      .from("user_invites")
      .select("email,full_name,status")
      .eq("id", data.inviteId)
      .single();
    if (error) throw new Error(error.message);
    if (invite.status !== "pending") throw new Error("Este convite não está mais pendente.");

    const { error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(invite.email, {
      redirectTo: data.redirectTo,
      data: invite.full_name ? { full_name: invite.full_name } : undefined,
    });
    if (inviteError) throw new Error(inviteError.message);
    return { ok: true };
  });
