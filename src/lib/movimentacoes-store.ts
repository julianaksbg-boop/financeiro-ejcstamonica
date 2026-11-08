import { create } from "zustand";
import { persist } from "zustand/middleware";
import { type Movimentacao } from "./mock-data";
import { removeDemoMovements } from "./financial-data";

export const movKey = (m: Pick<Movimentacao, "data" | "hora" | "valor" | "nome">) =>
  `${m.data}|${m.hora}|${m.valor}|${m.nome}`.toLowerCase();

interface MovState {
  items: Movimentacao[];
  lastImport?: { fileName: string; importedAt: string; count: number; periodFrom?: string; periodTo?: string };
  addMany: (items: Movimentacao[], meta?: { fileName: string; periodFrom?: string; periodTo?: string }) => number;
  addManual: (mov: Movimentacao) => void;
  update: (id: string, patch: Partial<Movimentacao>) => void;
  updateMany: (ids: string[], patch: Partial<Movimentacao>) => void;
  hasKey: (k: string) => boolean;
  reset: () => void;
}

export const useMovimentacoes = create<MovState>()(
  persist(
    (set, get) => ({
      items: [],
      addMany: (newItems, meta) => {
        const existing = new Set(get().items.map(movKey));
        const toAdd = newItems.filter((m) => !existing.has(movKey(m)));
        if (toAdd.length) set({ items: [...toAdd, ...get().items] });
        if (meta) {
          set({ lastImport: { ...meta, count: toAdd.length, importedAt: new Date().toISOString() } });
        }
        return toAdd.length;
      },
      addManual: (mov) => set({ items: [mov, ...get().items] }),
      update: (id, patch) =>
        set({ items: get().items.map((m) => (m.id === id ? { ...m, ...patch } : m)) }),
      updateMany: (ids, patch) => {
        const set2 = new Set(ids);
        set({ items: get().items.map((m) => (set2.has(m.id) ? { ...m, ...patch } : m)) });
      },
      hasKey: (k) => get().items.some((m) => movKey(m) === k),
      reset: () => set({ items: [], lastImport: undefined }),
    }),
    {
      name: "ejc-movimentacoes-v2",
      version: 1,
      migrate: (persisted) => {
        const previous = persisted as Partial<MovState>;
        return { ...previous, items: removeDemoMovements(previous.items ?? []) };
      },
    },
  ),
);
