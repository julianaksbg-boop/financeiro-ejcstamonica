import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type AccountType = "Receita" | "Despesa";
export type AccountStatus = "ativo" | "arquivado";

export interface AccountGroup {
  id: string;
  name: string;
  type: AccountType;
  description: string | null;
  status: AccountStatus;
  created_at: string;
  updated_at: string;
}

export interface AccountCategory {
  id: string;
  group_id: string;
  name: string;
  description: string | null;
  status: AccountStatus;
  archived_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface CategoriaFlat {
  id: string;
  nome: string;
  grupo: string;
  grupoId: string;
  tipo: AccountType;
  status: AccountStatus;
  descricao: string | null;
  caminho: string;
}

const GROUPS_KEY = ["account_groups"];
const CATEGORIES_KEY = ["account_categories"];

export function useAccountGroups() {
  return useQuery({
    queryKey: GROUPS_KEY,
    queryFn: async (): Promise<AccountGroup[]> => {
      const { data, error } = await supabase
        .from("account_groups")
        .select("*")
        .order("type", { ascending: true })
        .order("name", { ascending: true });
      if (error) throw error;
      return (data ?? []) as AccountGroup[];
    },
  });
}

export function useAccountCategories() {
  return useQuery({
    queryKey: CATEGORIES_KEY,
    queryFn: async (): Promise<AccountCategory[]> => {
      const { data, error } = await supabase
        .from("account_categories")
        .select("*")
        .order("name", { ascending: true });
      if (error) throw error;
      return (data ?? []) as AccountCategory[];
    },
  });
}

/** Lista plana de categorias com grupo e tipo resolvidos — usada nos seletores. */
export function usePlanoDeContas() {
  const groups = useAccountGroups();
  const categories = useAccountCategories();

  const groupById = new Map((groups.data ?? []).map((g) => [g.id, g]));
  const flat: CategoriaFlat[] = (categories.data ?? []).flatMap((c) => {
    const g = groupById.get(c.group_id);
    if (!g) return [];
    return [{
      id: c.id,
      nome: c.name,
      grupo: g.name,
      grupoId: g.id,
      tipo: g.type,
      status: c.status,
      descricao: c.description,
      caminho: `${g.type} › ${g.name} › ${c.name}`,
    }];
  });

  return {
    groups: groups.data ?? [],
    categories: categories.data ?? [],
    flat,
    loading: groups.isLoading || categories.isLoading,
    error: groups.error ?? categories.error,
  };
}

function useInvalidate() {
  const qc = useQueryClient();
  return () => {
    void qc.invalidateQueries({ queryKey: GROUPS_KEY });
    void qc.invalidateQueries({ queryKey: CATEGORIES_KEY });
  };
}

export function useCreateGroup() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: async (input: { name: string; type: AccountType; description?: string | null }) => {
      const { data, error } = await supabase
        .from("account_groups")
        .insert({ name: input.name.trim(), type: input.type, description: input.description || null })
        .select("*")
        .single();
      if (error) throw error;
      return data as AccountGroup;
    },
    onSuccess: invalidate,
  });
}

export function useUpdateGroup() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: async ({ id, ...patch }: { id: string; name?: string; type?: AccountType; description?: string | null; status?: AccountStatus }) => {
      const { error } = await supabase.from("account_groups").update(patch).eq("id", id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });
}

export function useDeleteGroup() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("account_groups").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });
}

export function useCreateCategory() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: async (input: { group_id: string; name: string; description?: string | null; status?: AccountStatus }) => {
      const { data, error } = await supabase
        .from("account_categories")
        .insert({
          group_id: input.group_id,
          name: input.name.trim(),
          description: input.description || null,
          status: input.status ?? "ativo",
          archived_at: input.status === "arquivado" ? new Date().toISOString() : null,
        })
        .select("*")
        .single();
      if (error) throw error;
      return data as AccountCategory;
    },
    onSuccess: invalidate,
  });
}

export function useUpdateCategory() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: async ({ id, ...patch }: { id: string; group_id?: string; name?: string; description?: string | null; status?: AccountStatus }) => {
      const { error } = await supabase
        .from("account_categories")
        .update({
          ...patch,
          ...(patch.status ? { archived_at: patch.status === "arquivado" ? new Date().toISOString() : null } : {}),
        })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });
}

export function useDeleteCategory() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("account_categories").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });
}
