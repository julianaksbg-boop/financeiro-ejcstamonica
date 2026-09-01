export const APP_PERMISSIONS = [
  "movimentacoes",
  "plano_contas",
  "adiantamentos",
  "eventos",
  "relatorios",
] as const;

export type AppPermission = (typeof APP_PERMISSIONS)[number];

export const PERMISSION_LABEL: Record<AppPermission, { label: string; hint: string }> = {
  movimentacoes: {
    label: "Movimentações",
    hint: "Importar extratos, classificar e editar lançamentos",
  },
  plano_contas: {
    label: "Plano de contas",
    hint: "Criar, editar e arquivar grupos e categorias",
  },
  adiantamentos: {
    label: "Adiantamentos",
    hint: "Registrar adiantamentos e prestações de contas",
  },
  eventos: {
    label: "Eventos",
    hint: "Criar e editar eventos e responsáveis",
  },
  relatorios: {
    label: "Relatórios",
    hint: "Exportar relatórios em PDF e Excel",
  },
};
