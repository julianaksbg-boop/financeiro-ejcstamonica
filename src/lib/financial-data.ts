import type { Movimentacao } from "./mock-data";

const demoIds = new Set(Array.from({ length: 14 }, (_, i) => `m${i + 1}`));

export function removeDemoMovements(items: Movimentacao[]) {
  return items.filter((item) => !demoIds.has(item.id));
}

export function financialSummary(items: Movimentacao[], year: number) {
  const annual = items.filter((m) => m.data.startsWith(`${year}-`));
  const receitas = annual.reduce((s, m) => s + Math.max(m.valor, 0), 0);
  const despesas = annual.reduce((s, m) => s + Math.max(-m.valor, 0), 0);
  const saldo = items.reduce((s, m) => s + m.valor, 0);
  const months = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
  const monthly = months.map((mes, i) => {
    const rows = annual.filter((m) => Number(m.data.slice(5, 7)) === i + 1);
    return { mes, receitas: rows.reduce((s, m) => s + Math.max(m.valor, 0), 0), despesas: rows.reduce((s, m) => s + Math.max(-m.valor, 0), 0) };
  });
  let running = items.filter((m) => m.data < `${year}-01-01`).reduce((s, m) => s + m.valor, 0);
  const history = monthly.map((m) => ({ mes: m.mes, saldo: (running += m.receitas - m.despesas) }));
  const grouped = (rows: Movimentacao[], key: "responsavel" | "categoria") => {
    const totals = new Map<string, number>();
    rows.forEach((m) => { const label = m[key] || "Sem classificação"; totals.set(label, (totals.get(label) || 0) + Math.abs(m.valor)); });
    return [...totals].map(([nome, valor]) => ({ nome, valor })).sort((a, b) => b.valor - a.valor);
  };
  return { receitas, despesas, saldo, resultado: receitas - despesas, monthly, history,
    byResponsible: grouped(annual.filter((m) => m.valor < 0), "responsavel"),
    byCategory: grouped(annual.filter((m) => m.valor > 0), "categoria").map((r) => ({ categoria: r.nome, valor: r.valor })) };
}