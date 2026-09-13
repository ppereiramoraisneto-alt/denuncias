export const STATUS_DENUNCIA = [
  "recebida",
  "em_triagem",
  "em_apuracao",
  "aguardando_informacoes",
  "concluida",
  "arquivada",
] as const;

export type StatusDenuncia = (typeof STATUS_DENUNCIA)[number];

export const STATUS_LABELS: Record<StatusDenuncia, string> = {
  recebida: "Recebida",
  em_triagem: "Em triagem",
  em_apuracao: "Em apuração",
  aguardando_informacoes: "Aguardando informações",
  concluida: "Concluída",
  arquivada: "Arquivada",
};

/** Cor de badge (Tailwind) por status — usada no dashboard e na página da denúncia. */
export const STATUS_BADGE_CLASS: Record<StatusDenuncia, string> = {
  recebida: "bg-blue-50 text-blue-700 ring-blue-600/20",
  em_triagem: "bg-amber-50 text-amber-700 ring-amber-600/20",
  em_apuracao: "bg-purple-50 text-purple-700 ring-purple-600/20",
  aguardando_informacoes: "bg-orange-50 text-orange-700 ring-orange-600/20",
  concluida: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  arquivada: "bg-slate-100 text-slate-600 ring-slate-500/20",
};
