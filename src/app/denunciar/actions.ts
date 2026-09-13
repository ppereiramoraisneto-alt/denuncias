"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { TIPOS_OCORRENCIA, type TipoOcorrencia } from "@/config/tipos-ocorrencia";
import { ANEXO_QUANTIDADE_MAXIMA } from "@/config/anexos";
import { enviarArquivoParaStorage } from "@/lib/anexos";
import { obterEmpresaIdPadrao } from "@/lib/empresa";

export type CriarDenunciaInput = {
  tipo: TipoOcorrencia;
  dataOcorrencia: string;
  local: string;
  envolvidos: string;
  testemunhas: string;
  descricao: string;
  anonima: boolean;
  nome: string;
  email: string;
  telefone: string;
  anexos: File[];
};

export type CriarDenunciaResultado =
  | { sucesso: true; protocolo: string; senha: string }
  | { sucesso: false; erro: string };

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validarEntrada(input: CriarDenunciaInput): string | null {
  if (!TIPOS_OCORRENCIA.includes(input.tipo)) {
    return "Tipo de ocorrência inválido.";
  }
  if (input.descricao.trim().length < 20) {
    return "Descreva os fatos com mais detalhes (mínimo 20 caracteres).";
  }
  if (!input.anonima) {
    if (!input.nome.trim()) return "Informe seu nome.";
    if (!EMAIL_REGEX.test(input.email.trim())) return "Informe um e-mail válido.";
  }
  if (input.anexos.length > ANEXO_QUANTIDADE_MAXIMA) {
    return `Você pode anexar no máximo ${ANEXO_QUANTIDADE_MAXIMA} arquivos.`;
  }
  return null;
}

/**
 * Cria a denuncia no banco atraves da funcao `criar_denuncia` (RPC), que
 * gera protocolo e senha, faz o hash da senha e grava tudo numa unica
 * transacao. Roda exclusivamente com o cliente admin (service role) porque
 * o denunciante nao possui sessao Supabase Auth.
 */
export async function criarDenuncia(
  input: CriarDenunciaInput,
): Promise<CriarDenunciaResultado> {
  const erro = validarEntrada(input);
  if (erro) return { sucesso: false, erro };

  const admin = createAdminClient();
  const empresaId = obterEmpresaIdPadrao();

  const { data, error } = await admin.rpc("criar_denuncia", {
    p_empresa_id: empresaId,
    p_tipo: input.tipo,
    p_data_ocorrencia: input.dataOcorrencia.trim() || null,
    p_local: input.local.trim() || null,
    p_envolvidos: input.envolvidos.trim() || null,
    p_testemunhas: input.testemunhas.trim() || null,
    p_descricao: input.descricao.trim(),
    p_anonima: input.anonima,
    p_nome: input.anonima ? null : input.nome.trim(),
    p_email: input.anonima ? null : input.email.trim(),
    p_telefone: input.anonima ? null : input.telefone.trim() || null,
  });

  if (error || !data || data.length === 0) {
    return {
      sucesso: false,
      erro: "Não foi possível registrar a denúncia agora. Tente novamente em instantes.",
    };
  }

  const [resultado] = data;

  for (const arquivo of input.anexos) {
    if (arquivo.size === 0) continue;

    const envio = await enviarArquivoParaStorage(admin, resultado.id, arquivo);
    if ("erro" in envio) continue;

    await admin.from("anexos").insert({
      denuncia_id: resultado.id,
      nome_original: arquivo.name,
      caminho_storage: envio.caminho,
      tipo: arquivo.type,
      tamanho: arquivo.size,
      enviado_por: "denunciante",
    });

    await admin.from("movimentacoes").insert({
      denuncia_id: resultado.id,
      usuario_id: null,
      tipo: "anexo_enviado",
      descricao: `Arquivo "${arquivo.name}" anexado pelo denunciante.`,
    });
  }

  return { sucesso: true, protocolo: resultado.protocolo, senha: resultado.senha };
}
