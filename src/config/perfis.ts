export const PERFIS_ADMIN = ["administrador", "analista"] as const;

export type PerfilAdmin = (typeof PERFIS_ADMIN)[number];

export const PERFIL_LABELS: Record<PerfilAdmin, string> = {
  administrador: "Administrador",
  analista: "Analista",
};
