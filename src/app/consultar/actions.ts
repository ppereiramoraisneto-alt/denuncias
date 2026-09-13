"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { enviarArquivoParaStorage, gerarUrlAssinada, limiteDeAnexosAtingido } from "@/lib/anexos";
import { ANEXO_QUANTIDADE_MAXIMA } from "@/config/anexos";
import type { StatusDenuncia } from "@/config/status";
import type { TipoOcorrencia } from "@/config/tipos-ocorrencia";
import type { AutorMensagem } from "@/types/denuncia";

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

export type MensagemPublica = {
  id: string;
  autorTipo: AutorMensagem;
  mensagem: string;
  criadaEm: string;
};

export type AnexoPublico = {
  id: string;
  nomeOriginal: string;
  tamanho: number;
  enviadoPor: AutorMensagem;
  criadoEm: string;
  url: string | null;
};

export type ConsultarDenunciaResultado =
  | {
      sucesso: true;
      denuncia: DenunciaConsultada;
      mensagens: MensagemPublica[];
      anexos: AnexoPublico[];
    }
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

  const [{ data: mensagens }, { data: anexos }] = await Promise.all([
    admin
      .from("mensagens")
      .select("id, autor_tipo, mensagem, created_at")
      .eq("denuncia_id", d.id)
      .order("created_at", { ascending: true }),
    admin
      .from("anexos")
      .select("id, nome_original, caminho_storage, tamanho, enviado_por, created_at")
      .eq("denuncia_id", d.id)
      .order("created_at", { ascending: true }),
  ]);

  const anexosComUrl = await Promise.all(
    (anexos ?? []).map(async (a) => ({
      id: a.id,
      nomeOriginal: a.nome_original,
      tamanho: a.tamanho,
      enviadoPor: a.enviado_por,
      criadoEm: a.created_at,
      url: await gerarUrlAssinada(admin, a.caminho_storage),
    })),
  );

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
    mensagens: (mensagens ?? []).map((m) => ({
      id: m.id,
      autorTipo: m.autor_tipo,
      mensagem: m.mensagem,
      criadaEm: m.created_at,
    })),
    anexos: anexosComUrl,
  };
}

export type AcaoPublicaResultado = { sucesso: true } | { sucesso: false; erro: string };

export async function enviarMensagemPublica(
  protocolo: string,
  senha: string,
  mensagem: string,
): Promise<AcaoPublicaResultado> {
  if (!mensagem.trim()) {
    return { sucesso: false, erro: "Escreva uma mensagem antes de enviar." };
  }

  const admin = createAdminClient();
  const { error } = await admin.rpc("enviar_mensagem_publica", {
    p_protocolo: protocolo.trim(),
    p_senha: senha.trim(),
    p_mensagem: mensagem.trim(),
  });

  if (error) {
    return { sucesso: false, erro: "Não foi possível enviar sua mensagem. Tente novamente." };
  }

  return { sucesso: true };
}

export async function anexarArquivoPublico(
  protocolo: string,
  senha: string,
  arquivo: File,
): Promise<AcaoPublicaResultado> {
  if (!(arquivo instanceof File) || arquivo.size === 0) {
    return { sucesso: false, erro: "Selecione um arquivo válido." };
  }

  const admin = createAdminClient();

  const denunciaId = await admin.rpc("validar_acesso_denuncia", {
    p_protocolo: protocolo.trim(),
    p_senha: senha.trim(),
  });

  if (denunciaId.error || !denunciaId.data) {
    return { sucesso: false, erro: "Protocolo ou chave de acesso incorretos." };
  }

  const { count } = await admin
    .from("anexos")
    .select("*", { count: "exact", head: true })
    .eq("denuncia_id", denunciaId.data);

  if (limiteDeAnexosAtingido(count ?? 0)) {
    return {
      sucesso: false,
      erro: `Esta denúncia já atingiu o limite de ${ANEXO_QUANTIDADE_MAXIMA} anexos.`,
    };
  }

  const envio = await enviarArquivoParaStorage(admin, denunciaId.data, arquivo);
  if ("erro" in envio) {
    return { sucesso: false, erro: envio.erro };
  }

  const { error } = await admin.rpc("registrar_anexo_publico", {
    p_protocolo: protocolo.trim(),
    p_senha: senha.trim(),
    p_nome_original: arquivo.name,
    p_caminho_storage: envio.caminho,
    p_tipo: arquivo.type,
    p_tamanho: arquivo.size,
  });

  if (error) {
    return { sucesso: false, erro: "Não foi possível registrar o anexo. Tente novamente." };
  }

  return { sucesso: true };
}
