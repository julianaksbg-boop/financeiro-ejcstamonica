import * as XLSX from "xlsx";
import type { Movimentacao, StatusMovimentacao } from "./mock-data";

export interface ParsedRow extends Movimentacao {
  duplicado: boolean;
}

const norm = (s: string) =>
  s
    .toString()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();

const HEADER_MAP: Record<string, keyof RawRow> = {
  data: "data",
  hora: "hora",
  "tipo de transacao": "tipoTransacao",
  "tipo de transação": "tipoTransacao",
  tipo: "tipoTransacao",
  nome: "nome",
  detalhe: "detalhe",
  descricao: "detalhe",
  descrição: "detalhe",
  valor: "valor",
};

interface RawRow {
  data?: unknown;
  hora?: unknown;
  tipoTransacao?: unknown;
  nome?: unknown;
  detalhe?: unknown;
  valor?: unknown;
}

const toISODate = (v: unknown): string => {
  if (v instanceof Date) return v.toISOString().slice(0, 10);
  if (typeof v === "number") {
    // Excel serial date
    const d = XLSX.SSF.parse_date_code(v);
    if (d) return `${d.y}-${String(d.m).padStart(2, "0")}-${String(d.d).padStart(2, "0")}`;
  }
  const s = String(v ?? "").trim();
  // dd/mm/yyyy
  const m = s.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (m) return `${m[3]}-${m[2]}-${m[1]}`;
  // yyyy-mm-dd or yyyy-mm-ddTxx
  const m2 = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (m2) return `${m2[1]}-${m2[2]}-${m2[3]}`;
  return s;
};

const toHora = (v: unknown): string => {
  if (v instanceof Date) {
    return v.toTimeString().slice(0, 8);
  }
  if (typeof v === "number" && v < 1) {
    const total = Math.round(v * 24 * 3600);
    const h = String(Math.floor(total / 3600)).padStart(2, "0");
    const mi = String(Math.floor((total % 3600) / 60)).padStart(2, "0");
    const s = String(total % 60).padStart(2, "0");
    return `${h}:${mi}:${s}`;
  }
  return String(v ?? "").trim();
};

const toNumber = (v: unknown): number => {
  if (typeof v === "number") return v;
  const s = String(v ?? "")
    .replace(/[R$\s]/g, "")
    .replace(/\./g, "")
    .replace(",", ".");
  const n = parseFloat(s);
  return isNaN(n) ? 0 : n;
};

export async function parseExtrato(
  file: File,
  hasKey: (k: string) => boolean,
): Promise<ParsedRow[]> {
  const buf = await file.arrayBuffer();
  const wb = XLSX.read(buf, { cellDates: true });
  const ws = wb.Sheets[wb.SheetNames[0]];
  const aoa = XLSX.utils.sheet_to_json<unknown[]>(ws, { header: 1, raw: true });

  // find header row
  let headerIdx = -1;
  let headers: string[] = [];
  for (let i = 0; i < Math.min(aoa.length, 10); i++) {
    const row = (aoa[i] ?? []).map((c) => norm(String(c ?? "")));
    if (row.includes("data") && row.includes("valor")) {
      headerIdx = i;
      headers = row;
      break;
    }
  }
  if (headerIdx < 0) throw new Error("Cabeçalho não encontrado. Esperado colunas: Data, Hora, Tipo, Nome, Detalhe, Valor.");

  const colIndex: Partial<Record<keyof RawRow, number>> = {};
  headers.forEach((h, i) => {
    const key = HEADER_MAP[h];
    if (key) colIndex[key] = i;
  });

  const result: ParsedRow[] = [];
  for (let i = headerIdx + 1; i < aoa.length; i++) {
    const row = aoa[i];
    if (!row || row.every((c) => c === null || c === undefined || c === "")) continue;
    const data = toISODate(row[colIndex.data ?? 0]);
    const hora = toHora(row[colIndex.hora ?? 1]);
    const tipoTransacao = String(row[colIndex.tipoTransacao ?? 2] ?? "").trim();
    const nome = String(row[colIndex.nome ?? 3] ?? "").trim();
    const detalhe = String(row[colIndex.detalhe ?? 4] ?? "").trim();
    let valor = toNumber(row[colIndex.valor ?? 5]);
    // se for "Enviado" e valor positivo, vira negativo
    if (/enviado/i.test(detalhe) && valor > 0) valor = -valor;

    if (!data || !nome) continue;

    const key = `${data}|${hora}|${valor}|${nome}`.toLowerCase();
    const duplicado = hasKey(key);
    result.push({
      id: `imp-${data}-${hora}-${i}-${Math.random().toString(36).slice(2, 7)}`,
      data,
      hora,
      tipoTransacao,
      nome,
      detalhe,
      valor,
      status: "Pendente" as StatusMovimentacao,
      duplicado,
    });
  }
  return result;
}
