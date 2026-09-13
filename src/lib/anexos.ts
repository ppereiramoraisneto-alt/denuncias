import type { SupabaseClient } from "@supabase/supabase-js";
import {
  ANEXO_QUANTIDADE_MAXIMA,
  ANEXO_TAMANHO_MAXIMO_BYTES,
  ANEXO_TIPOS_PERMITIDOS,
} from "@/config/anexos";
import type { Database } from "@/types/database";

const BUCKET = "anexos";

export function validarArquivo(file: File): string | null {
  if (file.size > ANEXO_TAMANHO_MAXIMO_BYTES) {
    return `"${file.name}" excede o tamanho máximo de 10 MB.`;
  }
  if (!ANEXO_TIPOS_PERMITIDOS.includes(file.type as (typeof ANEXO_TIPOS_PERMITIDOS)[number])) {
    return `"${file.name}" tem um tipo de arquivo não permitido.`;
  }
  return null;
}

function sanitizarNomeArquivo(nome: string): string {
  return nome.normalize("NFKD").replace(/[^\w.-]+/g, "_");
}

/**
 * Envia o arquivo para o bucket privado "anexos" usando o cliente admin
 * (service role) — o bucket não tem policies de RLS, então todo acesso
 * (upload e leitura via URL assinada) é mediado por código server-side
 * que já validou a autorização antes de chamar esta função.
 */
export async function enviarArquivoParaStorage(
  admin: SupabaseClient<Database>,
  denunciaId: string,
  file: File,
): Promise<{ caminho: string } | { erro: string }> {
  const erroValidacao = validarArquivo(file);
  if (erroValidacao) return { erro: erroValidacao };

  const caminho = `${denunciaId}/${crypto.randomUUID()}-${sanitizarNomeArquivo(file.name)}`;

  const { error } = await admin.storage.from(BUCKET).upload(caminho, file, {
    contentType: file.type,
  });

  if (error) {
    return { erro: "Não foi possível enviar o arquivo. Tente novamente." };
  }

  return { caminho };
}

export async function contarAnexos(
  admin: SupabaseClient<Database>,
  denunciaId: string,
): Promise<number> {
  const { count } = await admin
    .from("anexos")
    .select("*", { count: "exact", head: true })
    .eq("denuncia_id", denunciaId);
  return count ?? 0;
}

export function limiteDeAnexosAtingido(quantidadeAtual: number): boolean {
  return quantidadeAtual >= ANEXO_QUANTIDADE_MAXIMA;
}

export function formatarTamanhoArquivo(bytes: number): string {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export async function gerarUrlAssinada(
  admin: SupabaseClient<Database>,
  caminho: string,
): Promise<string | null> {
  const { data } = await admin.storage.from(BUCKET).createSignedUrl(caminho, 60);
  return data?.signedUrl ?? null;
}
