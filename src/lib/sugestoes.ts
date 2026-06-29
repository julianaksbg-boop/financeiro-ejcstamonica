import type { Movimentacao } from "./mock-data";

export interface Sugestao {
  evento?: string;
  responsavel?: string;
  categoria?: string;
  formaPagamento?: Movimentacao["formaPagamento"];
  tipo?: Movimentacao["tipo"];
  baseadoEm: number;
}

const normNome = (s: string) =>
  s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();

const moda = <T extends string | undefined>(arr: (T | undefined)[]): T | undefined => {
  const counts = new Map<string, number>();
  for (const v of arr) if (v) counts.set(v, (counts.get(v) ?? 0) + 1);
  let best: string | undefined;
  let max = 0;
  for (const [k, v] of counts) if (v > max) { max = v; best = k; }
  return best as T | undefined;
};

export function buildSugestoes(items: Movimentacao[]): Map<string, Sugestao> {
  const grupos = new Map<string, Movimentacao[]>();
  for (const m of items) {
    if (m.status !== "Classificada") continue;
    const k = normNome(m.nome);
    if (!k) continue;
    const list = grupos.get(k) ?? [];
    list.push(m);
    grupos.set(k, list);
  }
  const out = new Map<string, Sugestao>();
  for (const [k, list] of grupos) {
    out.set(k, {
      evento: moda(list.map((m) => m.evento)),
      responsavel: moda(list.map((m) => m.responsavel)),
      categoria: moda(list.map((m) => m.categoria)),
      formaPagamento: moda(list.map((m) => m.formaPagamento)),
      tipo: moda(list.map((m) => m.tipo)),
      baseadoEm: list.length,
    });
  }
  return out;
}

export const sugestaoPara = (sugestoes: Map<string, Sugestao>, nome: string) =>
  sugestoes.get(normNome(nome));
