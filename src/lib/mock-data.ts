// Dados de exemplo para o protótipo do Sistema Financeiro EJC

export const EQUIPES = [
  "Mini Bar",
  "Camisetas",
  "Secretaria",
  "Inscrições",
  "Doações",
  "Sala e Música",
  "Liturgia",
  "Cozinha e Café",
  "Ordem",
  "Kids",
  "Externa",
  "Acolhida",
] as const;

export const PILARES = [
  "Liturgia",
  "Ação Social e Eventos",
  "Artes e Lazer",
  "Marketing",
  "Música",
] as const;

export const EVENTOS = [
  { id: "xx-encontrao", nome: "XX Encontrão", ano: 2024, cor: "chart-1" },
  { id: "xxi-encontrao", nome: "XXI Encontrão", ano: 2025, cor: "chart-2" },
  { id: "quitandas", nome: "Quitandas", ano: 2025, cor: "chart-3" },
  { id: "rifa", nome: "Rifa", ano: 2025, cor: "chart-4" },
  { id: "santa-massa", nome: "Santa Massa", ano: 2025, cor: "chart-5" },
  { id: "confraternizacao", nome: "Confraternização", ano: 2025, cor: "chart-1" },
  { id: "dia-criancas", nome: "Dia das Crianças", ano: 2025, cor: "chart-2" },
  { id: "semanais", nome: "Encontros Semanais", ano: 2025, cor: "chart-3" },
] as const;

export const FORMAS_PAGAMENTO = ["PIX", "Débito", "Crédito", "Dinheiro", "Transferência"] as const;

export const CATEGORIAS_RECEITA = [
  "Inscrições",
  "Doações",
  "Rifa",
  "Quitandas",
  "Santa Massa",
  "Confraternização",
  "Outros",
] as const;

export const CATEGORIAS_DESPESA = [
  "Alimentação",
  "Materiais",
  "Decoração",
  "Gráfica e Comunicação",
  "Camisetas",
  "Aluguel de Espaço",
  "Transporte",
  "Música e Som",
  "Premiação",
  "Outros",
] as const;

export type TipoMovimentacao = "Receita" | "Despesa" | "Adiantamento";
export type StatusMovimentacao = "Classificada" | "Pendente" | "Sugerida";

export interface Movimentacao {
  id: string;
  data: string;
  hora: string;
  tipoTransacao: string;
  nome: string;
  detalhe: string;
  valor: number;
  tipo?: TipoMovimentacao;
  evento?: string;
  responsavel?: string;
  formaPagamento?: typeof FORMAS_PAGAMENTO[number];
  categoria?: string;
  categoriaId?: string;
  categoriaGrupo?: string;
  observacao?: string;
  status: StatusMovimentacao;
  comprovante?: string;
}

export const MOVIMENTACOES: Movimentacao[] = [
  { id: "m1", data: "2025-06-02", hora: "14:23", tipoTransacao: "PIX Recebido", nome: "Maria Eduarda Souza", detalhe: "Inscrição XXI Encontrão", valor: 280, tipo: "Receita", evento: "XXI Encontrão", responsavel: "Inscrições", formaPagamento: "PIX", status: "Classificada" },
  { id: "m2", data: "2025-06-02", hora: "10:15", tipoTransacao: "PIX Recebido", nome: "Lucas Pereira", detalhe: "Inscrição XXI Encontrão", valor: 280, tipo: "Receita", evento: "XXI Encontrão", responsavel: "Inscrições", formaPagamento: "PIX", status: "Classificada" },
  { id: "m3", data: "2025-06-01", hora: "16:42", tipoTransacao: "Débito", nome: "Supermercado Bretas", detalhe: "Compras cozinha", valor: -847.5, tipo: "Despesa", evento: "XXI Encontrão", responsavel: "Cozinha e Café", formaPagamento: "Débito", status: "Sugerida" },
  { id: "m4", data: "2025-06-01", hora: "12:18", tipoTransacao: "PIX Enviado", nome: "Equipe Compras", detalhe: "Adiantamento para mercado", valor: -3000, tipo: "Adiantamento", evento: "XXI Encontrão", responsavel: "Cozinha e Café", formaPagamento: "PIX", status: "Classificada" },
  { id: "m5", data: "2025-05-30", hora: "20:11", tipoTransacao: "PIX Recebido", nome: "João Vitor Lima", detalhe: "Quitanda - bolo de fubá", valor: 35, tipo: "Receita", evento: "Quitandas", responsavel: "Ação Social e Eventos", formaPagamento: "PIX", status: "Classificada" },
  { id: "m6", data: "2025-05-29", hora: "19:08", tipoTransacao: "PIX Recebido", nome: "Ana Beatriz", detalhe: "Rifa - 5 números", valor: 50, tipo: "Receita", evento: "Rifa", responsavel: "Marketing", formaPagamento: "PIX", status: "Classificada" },
  { id: "m7", data: "2025-05-28", hora: "15:44", tipoTransacao: "Débito", nome: "Loja Camisetaria SA", detalhe: "Camisetas equipe", valor: -1240, status: "Pendente" },
  { id: "m8", data: "2025-05-28", hora: "10:00", tipoTransacao: "PIX Recebido", nome: "Pedro Henrique", detalhe: "", valor: 100, status: "Pendente" },
  { id: "m9", data: "2025-05-27", hora: "14:30", tipoTransacao: "Débito", nome: "Padaria Pão Quente", detalhe: "Café da manhã equipe", valor: -185, tipo: "Despesa", evento: "XXI Encontrão", responsavel: "Cozinha e Café", formaPagamento: "Débito", status: "Classificada" },
  { id: "m10", data: "2025-05-26", hora: "11:22", tipoTransacao: "PIX Enviado", nome: "Gráfica Imprime Tudo", detalhe: "Cartazes e crachás", valor: -420, tipo: "Despesa", evento: "XXI Encontrão", responsavel: "Secretaria", formaPagamento: "PIX", status: "Classificada" },
  { id: "m11", data: "2025-05-25", hora: "09:14", tipoTransacao: "PIX Recebido", nome: "Carla Mendes", detalhe: "Doação", valor: 500, tipo: "Receita", evento: "XXI Encontrão", responsavel: "Doações", formaPagamento: "PIX", status: "Classificada" },
  { id: "m12", data: "2025-05-24", hora: "17:55", tipoTransacao: "Débito", nome: "Açougue Bom Boi", detalhe: "Santa Massa - carnes", valor: -680, tipo: "Despesa", evento: "Santa Massa", responsavel: "Cozinha e Café", formaPagamento: "Débito", status: "Sugerida" },
  { id: "m13", data: "2025-05-23", hora: "13:00", tipoTransacao: "Crédito", nome: "Decoração Festa", detalhe: "Itens decoração sala", valor: -310, tipo: "Despesa", evento: "XXI Encontrão", responsavel: "Sala e Música", formaPagamento: "Crédito", status: "Classificada" },
  { id: "m14", data: "2025-05-22", hora: "08:30", tipoTransacao: "PIX Recebido", nome: "Família Oliveira", detalhe: "Inscrição casal", valor: 560, tipo: "Receita", evento: "XXI Encontrão", responsavel: "Inscrições", formaPagamento: "PIX", status: "Classificada" },
];

export interface Adiantamento {
  id: string;
  data: string;
  responsavel: string;
  evento: string;
  valorAdiantado: number;
  valorPrestado: number;
  status: "Pendente" | "Parcialmente Prestado" | "Prestação Concluída";
  observacao?: string;
}

export const ADIANTAMENTOS: Adiantamento[] = [
  { id: "a1", data: "2025-06-01", responsavel: "Cozinha e Café", evento: "XXI Encontrão", valorAdiantado: 3000, valorPrestado: 1170, status: "Parcialmente Prestado", observacao: "PIX para equipe de compras" },
  { id: "a2", data: "2025-05-20", responsavel: "Mini Bar", evento: "XXI Encontrão", valorAdiantado: 800, valorPrestado: 0, status: "Pendente" },
  { id: "a3", data: "2025-05-10", responsavel: "Acolhida", evento: "XXI Encontrão", valorAdiantado: 500, valorPrestado: 500, status: "Prestação Concluída" },
  { id: "a4", data: "2025-04-28", responsavel: "Kids", evento: "Dia das Crianças", valorAdiantado: 1200, valorPrestado: 1180, status: "Parcialmente Prestado" },
];

// Métricas agregadas
export const SALDO_ATUAL = 24580.42;
export const RECEITAS_ANO = 68420;
export const DESPESAS_ANO = 43839.58;
export const RESULTADO_ANO = RECEITAS_ANO - DESPESAS_ANO;

export const FLUXO_MENSAL = [
  { mes: "Jan", receitas: 4200, despesas: 1800 },
  { mes: "Fev", receitas: 5800, despesas: 2400 },
  { mes: "Mar", receitas: 7100, despesas: 3200 },
  { mes: "Abr", receitas: 9200, despesas: 4800 },
  { mes: "Mai", receitas: 12400, despesas: 7600 },
  { mes: "Jun", receitas: 15800, despesas: 9200 },
  { mes: "Jul", receitas: 8920, despesas: 6400 },
  { mes: "Ago", receitas: 5000, despesas: 8439.58 },
];

export const SALDO_HISTORICO = FLUXO_MENSAL.reduce<{ mes: string; saldo: number }[]>((acc, m, i) => {
  const ant = i === 0 ? 0 : acc[i - 1].saldo;
  acc.push({ mes: m.mes, saldo: ant + m.receitas - m.despesas });
  return acc;
}, []);

export const GASTOS_RESPONSAVEL = [
  { nome: "Cozinha e Café", valor: 14200 },
  { nome: "Secretaria", valor: 6800 },
  { nome: "Sala e Música", valor: 5400 },
  { nome: "Acolhida", valor: 4100 },
  { nome: "Kids", valor: 3900 },
  { nome: "Mini Bar", valor: 3200 },
  { nome: "Camisetas", valor: 2800 },
  { nome: "Ordem", valor: 1900 },
  { nome: "Externa", valor: 1539.58 },
];

export const GASTOS_PILAR = [
  { nome: "Liturgia", valor: 7800 },
  { nome: "Ação Social e Eventos", valor: 12400 },
  { nome: "Artes e Lazer", valor: 9200 },
  { nome: "Marketing", valor: 6300 },
  { nome: "Música", valor: 8139.58 },
];

export const RECEITAS_CATEGORIA = [
  { categoria: "Inscrições", valor: 38400 },
  { categoria: "Doações", valor: 8200 },
  { categoria: "Rifa", valor: 6700 },
  { categoria: "Quitandas", valor: 5400 },
  { categoria: "Santa Massa", valor: 6200 },
  { categoria: "Confraternização", valor: 3520 },
];

export const COMPARATIVO_ENCONTROES = [
  { encontro: "XIX", receita: 42000, despesa: 36500, resultado: 5500 },
  { encontro: "XX", receita: 58000, despesa: 47200, resultado: 10800 },
  { encontro: "XXI", receita: 68420, despesa: 43839.58, resultado: 24580.42 },
];

export const formatBRL = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
