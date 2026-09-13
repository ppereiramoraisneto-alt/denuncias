/**
 * Este MVP atende uma empresa por deploy, mas o banco já é multi-tenant
 * (toda denuncia carrega empresa_id, isolado por RLS). A empresa atendida
 * por este deploy é explícita via variável de ambiente — nunca inferida
 * como "a primeira que existir", o que quebraria silenciosamente (ou pior,
 * vazaria dados entre empresas) assim que uma segunda empresa existir no
 * banco por qualquer motivo.
 */
export function obterEmpresaIdPadrao(): string {
  const id = process.env.DEFAULT_EMPRESA_ID;
  if (!id) {
    throw new Error("DEFAULT_EMPRESA_ID não configurada.");
  }
  return id;
}
