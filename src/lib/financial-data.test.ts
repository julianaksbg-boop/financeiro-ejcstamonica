import { test, expect } from "bun:test";
import { removeDemoMovements, financialSummary } from "./financial-data";
import type { Movimentacao } from "./mock-data";

const row = (id: string, valor: number): Movimentacao => ({ id, valor, data: "2026-11-01", hora: "12:00", nome: "Lançamento", detalhe: "", tipoTransacao: "PIX", status: "Pendente" });

test("remove os 14 exemplos preservando importações e lançamentos manuais", () => {
  const examples = Array.from({ length: 14 }, (_, i) => row(`m${i + 1}`, 280));
  expect(removeDemoMovements([...examples, row("import-1", 125), row("manual-1", -25)]).map((m) => m.id)).toEqual(["import-1", "manual-1"]);
});

test("sem movimentações os totais financeiros são zero", () => {
  const s = financialSummary([], 2026);
  expect([s.receitas, s.despesas, s.saldo, s.resultado]).toEqual([0, 0, 0, 0]);
  expect(s.monthly.every((m) => m.receitas === 0 && m.despesas === 0)).toBe(true);
});

test("totais refletem apenas as movimentações reais", () => {
  const s = financialSummary([row("import-1", 125), row("manual-1", -25)], 2026);
  expect([s.receitas, s.despesas, s.saldo, s.resultado]).toEqual([125, 25, 100, 100]);
  expect(s.monthly[10]).toEqual({ mes: "Nov", receitas: 125, despesas: 25 });
});