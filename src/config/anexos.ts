export const ANEXO_TIPOS_PERMITIDOS = [
  "image/png",
  "image/jpeg",
  "image/webp",
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
] as const;

export const ANEXO_EXTENSOES_ACEITAS = ".png,.jpg,.jpeg,.webp,.pdf,.doc,.docx";

export const ANEXO_TAMANHO_MAXIMO_BYTES = 10 * 1024 * 1024;
export const ANEXO_QUANTIDADE_MAXIMA = 5;
