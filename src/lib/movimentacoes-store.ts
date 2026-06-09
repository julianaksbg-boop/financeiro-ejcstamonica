import { create } from "zustand";
import { persist } from "zustand/middleware";
import { MOVIMENTACOES, type Movimentacao } from "./mock-data";

export const movKey = (m: Pick<Movimentacao, "data" | "hora" | "valor" | "nome">) =>
  `${m.data}|${m.hora}|${m.valor}|${m.nome}`.toLowerCase();

interface MovState {
  items: Movimentacao[];
  addMany: (items: Movimentacao[]) => number;
  update: (id: string, patch: Partial<Movimentacao>) => void;
  hasKey: (k: string) => boolean;
  reset: () => void;
}

export const useMovimentacoes = create<MovState>()(
  persist(
    (set, get) => ({
      items: MOVIMENTACOES,
      addMany: (newItems) => {
        const existing = new Set(get().items.map(movKey));
        const toAdd = newItems.filter((m) => !existing.has(movKey(m)));
        if (toAdd.length) set({ items: [...toAdd, ...get().items] });
        return toAdd.length;
      },
      update: (id, patch) =>
        set({ items: get().items.map((m) => (m.id === id ? { ...m, ...patch } : m)) }),
      hasKey: (k) => get().items.some((m) => movKey(m) === k),
      reset: () => set({ items: MOVIMENTACOES }),
    }),
    { name: "ejc-movimentacoes-v1" },
  ),
);
