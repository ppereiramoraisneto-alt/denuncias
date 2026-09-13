"use server";

import { revalidatePath } from "next/cache";
import { exigirPerfilAtual } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { contarAnexos, enviarArquivoParaStorage, limiteDeAnexosAtingido } from "@/lib/anexos";
import { STATUS_DENUNCIA, STATUS_LABELS, type StatusDenuncia } from "@/config/status";

export async function alterarStatus(denunciaId: string, formData: FormData) {
  const perfil = await exigirPerfilAtual();
  const novoStatus = formData.get("status");

  if (typeof novoStatus !== "string" || !STATUS_DENUNCIA.includes(novoStatus as StatusDenuncia)) {
    return;
  }

  const supabase = await createClient();

  const { data: denuncia } = await supabase
    .from("denuncias")
    .select("id")
    .eq("id", denunciaId)
    .single();
  if (!denuncia) return;

  const { error } = await supabase
    .from("denuncias")
    .update({ status: novoStatus as StatusDenuncia })
    .eq("id", denunciaId);

  if (!error) {
    await supabase.from("movimentacoes").insert({
      denuncia_id: denunciaId,
      usuario_id: perfil.userId,
      tipo: "status_alterado",
      descricao: `Status alterado para "${STATUS_LABELS[novoStatus as StatusDenuncia]}" por ${perfil.nome}.`,
    });
  }

  revalidatePath(`/admin/denuncias/${denunciaId}`);
  revalidatePath("/admin");
}

export async function enviarMensagemAdmin(denunciaId: string, formData: FormData) {
  const perfil = await exigirPerfilAtual();
  const mensagem = formData.get("mensagem");

  if (typeof mensagem !== "string" || !mensagem.trim()) {
    return;
  }

  const supabase = await createClient();

  const { data: denuncia } = await supabase
    .from("denuncias")
    .select("id")
    .eq("id", denunciaId)
    .single();
  if (!denuncia) return;

  const { error } = await supabase.from("mensagens").insert({
    denuncia_id: denunciaId,
    autor_tipo: "administrador",
    usuario_id: perfil.userId,
    mensagem: mensagem.trim(),
  });

  if (!error) {
    await supabase.from("movimentacoes").insert({
      denuncia_id: denunciaId,
      usuario_id: perfil.userId,
      tipo: "mensagem_enviada",
      descricao: `Mensagem enviada por ${perfil.nome}.`,
    });
  }

  revalidatePath(`/admin/denuncias/${denunciaId}`);
}

export async function anexarArquivoAdmin(denunciaId: string, formData: FormData) {
  const perfil = await exigirPerfilAtual();
  const arquivo = formData.get("arquivo");

  if (!(arquivo instanceof File) || arquivo.size === 0) {
    return;
  }

  const supabase = await createClient();

  const { data: denuncia } = await supabase
    .from("denuncias")
    .select("id")
    .eq("id", denunciaId)
    .single();

  if (!denuncia) return;

  const admin = createAdminClient();

  const quantidadeAtual = await contarAnexos(admin, denunciaId);
  if (limiteDeAnexosAtingido(quantidadeAtual)) return;

  const resultado = await enviarArquivoParaStorage(admin, denunciaId, arquivo);
  if ("erro" in resultado) return;

  const { error } = await supabase.from("anexos").insert({
    denuncia_id: denunciaId,
    nome_original: arquivo.name,
    caminho_storage: resultado.caminho,
    tipo: arquivo.type,
    tamanho: arquivo.size,
    enviado_por: "administrador",
  });

  if (!error) {
    await supabase.from("movimentacoes").insert({
      denuncia_id: denunciaId,
      usuario_id: perfil.userId,
      tipo: "anexo_enviado",
      descricao: `Arquivo "${arquivo.name}" anexado por ${perfil.nome}.`,
    });
  }

  revalidatePath(`/admin/denuncias/${denunciaId}`);
}
