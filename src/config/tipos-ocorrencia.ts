export const TIPOS_OCORRENCIA = [
  "assedio_moral",
  "assedio_sexual",
  "discriminacao",
  "violencia",
  "retaliacao",
  "outro",
] as const;

export type TipoOcorrencia = (typeof TIPOS_OCORRENCIA)[number];

export const TIPO_OCORRENCIA_LABELS: Record<TipoOcorrencia, string> = {
  assedio_moral: "Assédio moral",
  assedio_sexual: "Assédio sexual",
  discriminacao: "Discriminação",
  violencia: "Violência",
  retaliacao: "Retaliação",
  outro: "Outro",
};
