"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import type { StatusDenuncia } from "@/config/status";
import type { TipoOcorrencia } from "@/config/tipos-ocorrencia";

export type DenunciaConsultada = {
  protocolo: string;
  tipo: TipoOcorrencia;
  dataOcorrencia: string | null;
  local: string | null;
  envolvidos: string | null;
  testemunhas: string | null;
  descricao: string;
  anonima: boolean;
  status: StatusDenuncia;
  criadaEm: string;
  atualizadaEm: string;
};

export type ConsultarDenunciaResultado =
  | { sucesso: true; denuncia: DenunciaConsultada }
  | { sucesso: false; erro: string };

/**
 * Verifica protocolo + chave de acesso inteiramente dentro do Postgres
 * (a funcao consultar_denuncia compara com crypt() contra o hash). O hash
 * nunca trafega ate aqui; se a senha nao confere, a funcao simplesmente
 * nao retorna nenhuma linha.
 */
export async function consultarDenuncia(
  protocolo: string,
  senha: string,
): Promise<ConsultarDenunciaResultado> {
  if (!protocolo.trim() || !senha.trim()) {
    return { sucesso: false, erro: "Informe o protocolo e a chave de acesso." };
  }

  const admin = createAdminClient();

  const { data, error } = await admin.rpc("consultar_denuncia", {
    p_protocolo: protocolo.trim(),
    p_senha: senha.trim(),
  });

  if (error || !data || data.length === 0) {
    return { sucesso: false, erro: "Protocolo ou chave de acesso incorretos." };
  }

  const d = data[0];
  return {
    sucesso: true,
    denuncia: {
      protocolo: d.protocolo,
      tipo: d.tipo,
      dataOcorrencia: d.data_ocorrencia,
      local: d.local,
      envolvidos: d.envolvidos,
      testemunhas: d.testemunhas,
      descricao: d.descricao,
      anonima: d.anonima,
      status: d.status,
      criadaEm: d.created_at,
      atualizadaEm: d.updated_at,
    },
  };
}
