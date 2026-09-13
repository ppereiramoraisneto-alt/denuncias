import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { cn } from "@/lib/cn";
import { INPUT_CLASSES } from "@/lib/form-styles";
import { Button } from "@/components/ui/button";
import { formatarTamanhoArquivo, gerarUrlAssinada } from "@/lib/anexos";
import { ANEXO_EXTENSOES_ACEITAS } from "@/config/anexos";
import { STATUS_BADGE_CLASS, STATUS_DENUNCIA, STATUS_LABELS } from "@/config/status";
import { TIPO_OCORRENCIA_LABELS } from "@/config/tipos-ocorrencia";
import { alterarStatus, anexarArquivoAdmin, enviarMensagemAdmin } from "./actions";

const MOVIMENTACAO_LABELS: Record<string, string> = {
  criada: "Denúncia criada",
  status_alterado: "Status alterado",
  mensagem_enviada: "Mensagem enviada",
  anexo_enviado: "Anexo enviado",
  concluida: "Denúncia concluída",
};

function formatarDataHora(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function DenunciaDetalhePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: denuncia } = await supabase
    .from("denuncias")
    .select("*")
    .eq("id", id)
    .single();

  if (!denuncia) {
    notFound();
  }

  const [{ data: mensagens }, { data: anexos }, { data: movimentacoes }] = await Promise.all([
    supabase
      .from("mensagens")
      .select("id, autor_tipo, mensagem, created_at")
      .eq("denuncia_id", id)
      .order("created_at", { ascending: true }),
    supabase
      .from("anexos")
      .select("id, nome_original, caminho_storage, tamanho, enviado_por, created_at")
      .eq("denuncia_id", id)
      .order("created_at", { ascending: true }),
    supabase
      .from("movimentacoes")
      .select("id, tipo, descricao, created_at")
      .eq("denuncia_id", id)
      .order("created_at", { ascending: false }),
  ]);

  const admin = createAdminClient();
  const anexosComUrl = await Promise.all(
    (anexos ?? []).map(async (a) => ({
      ...a,
      url: await gerarUrlAssinada(admin, a.caminho_storage),
    })),
  );

  const alterarStatusComId = alterarStatus.bind(null, id);
  const enviarMensagemComId = enviarMensagemAdmin.bind(null, id);
  const anexarArquivoComId = anexarArquivoAdmin.bind(null, id);

  return (
    <div className="space-y-6">
      <Link href="/admin" className="text-sm font-medium text-slate-500 hover:text-slate-900">
        ← Voltar ao dashboard
      </Link>

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs font-medium tracking-wide text-slate-400 uppercase">
            Protocolo
          </p>
          <p className="font-mono text-xl font-semibold text-slate-900">
            {denuncia.protocolo}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
            {denuncia.anonima ? "Anônima" : "Identificada"}
          </span>
          <span
            className={cn(
              "inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ring-1 ring-inset",
              STATUS_BADGE_CLASS[denuncia.status],
            )}
          >
            {STATUS_LABELS[denuncia.status]}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <section className="rounded-xl border border-slate-200 bg-white p-5">
            <h2 className="text-sm font-semibold text-slate-900">
              Informações da ocorrência
            </h2>
            <dl className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <dt className="text-xs text-slate-500">Tipo</dt>
                <dd className="mt-0.5 font-medium text-slate-900">
                  {TIPO_OCORRENCIA_LABELS[denuncia.tipo]}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-slate-500">Registrada em</dt>
                <dd className="mt-0.5 font-medium text-slate-900">
                  {formatarDataHora(denuncia.created_at)}
                </dd>
              </div>
              {denuncia.data_ocorrencia && (
                <div>
                  <dt className="text-xs text-slate-500">
                    Data ou período da ocorrência
                  </dt>
                  <dd className="mt-0.5 font-medium text-slate-900">
                    {denuncia.data_ocorrencia}
                  </dd>
                </div>
              )}
              {denuncia.local && (
                <div>
                  <dt className="text-xs text-slate-500">Local</dt>
                  <dd className="mt-0.5 font-medium text-slate-900">{denuncia.local}</dd>
                </div>
              )}
              {denuncia.envolvidos && (
                <div className="sm:col-span-2">
                  <dt className="text-xs text-slate-500">Pessoa(s) envolvida(s)</dt>
                  <dd className="mt-0.5 font-medium text-slate-900">
                    {denuncia.envolvidos}
                  </dd>
                </div>
              )}
              {denuncia.testemunhas && (
                <div className="sm:col-span-2">
                  <dt className="text-xs text-slate-500">Testemunhas</dt>
                  <dd className="mt-0.5 font-medium text-slate-900">
                    {denuncia.testemunhas}
                  </dd>
                </div>
              )}
            </dl>
            <div className="mt-4">
              <dt className="text-xs text-slate-500">Descrição dos fatos</dt>
              <dd className="mt-1 text-sm whitespace-pre-wrap text-slate-900">
                {denuncia.descricao}
              </dd>
            </div>
          </section>

          <section className="space-y-3 rounded-xl border border-slate-200 bg-white p-5">
            <h2 className="text-sm font-semibold text-slate-900">Anexos</h2>

            {anexosComUrl.length > 0 && (
              <ul className="space-y-2">
                {anexosComUrl.map((anexo) => (
                  <li
                    key={anexo.id}
                    className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  >
                    <div className="min-w-0">
                      {anexo.url ? (
                        <a
                          href={anexo.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="truncate font-medium text-slate-900 hover:underline"
                        >
                          {anexo.nome_original}
                        </a>
                      ) : (
                        <span className="truncate text-slate-500">{anexo.nome_original}</span>
                      )}
                      <p className="text-xs text-slate-400">
                        {anexo.enviado_por === "denunciante" ? "Denunciante" : "Equipe"} ·{" "}
                        {formatarTamanhoArquivo(anexo.tamanho)}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
            {anexosComUrl.length === 0 && (
              <p className="text-sm text-slate-500">Nenhum anexo até o momento.</p>
            )}

            <form action={anexarArquivoComId} className="flex flex-wrap items-center gap-3">
              <input
                type="file"
                name="arquivo"
                accept={ANEXO_EXTENSOES_ACEITAS}
                className="text-sm text-slate-600"
              />
              <Button type="submit" variant="secondary">
                Anexar
              </Button>
            </form>
          </section>

          <section className="space-y-3 rounded-xl border border-slate-200 bg-white p-5">
            <h2 className="text-sm font-semibold text-slate-900">Mensagens</h2>

            {mensagens && mensagens.length > 0 ? (
              <ul className="space-y-3">
                {mensagens.map((m) => (
                  <li
                    key={m.id}
                    className={cn(
                      "max-w-[85%] rounded-xl px-3 py-2 text-sm",
                      m.autor_tipo === "administrador"
                        ? "ml-auto bg-slate-900 text-white"
                        : "bg-slate-100 text-slate-900",
                    )}
                  >
                    <p className="whitespace-pre-wrap">{m.mensagem}</p>
                    <p
                      className={cn(
                        "mt-1 text-[11px]",
                        m.autor_tipo === "administrador" ? "text-slate-300" : "text-slate-400",
                      )}
                    >
                      {m.autor_tipo === "administrador" ? "Equipe" : "Denunciante"} ·{" "}
                      {formatarDataHora(m.created_at)}
                    </p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-slate-500">Nenhuma mensagem até o momento.</p>
            )}

            <form action={enviarMensagemComId} className="space-y-2">
              <textarea
                name="mensagem"
                rows={3}
                placeholder="Escreva uma mensagem para o denunciante..."
                className={INPUT_CLASSES}
              />
              <Button type="submit" className="w-full sm:w-auto">
                Enviar mensagem
              </Button>
            </form>
          </section>
        </div>

        <div className="space-y-6">
          <section className="rounded-xl border border-slate-200 bg-white p-5">
            <h2 className="text-sm font-semibold text-slate-900">Identificação</h2>
            {denuncia.anonima ? (
              <p className="mt-2 text-sm text-slate-500">
                O denunciante optou por permanecer anônimo. Nenhum dado pessoal
                foi coletado.
              </p>
            ) : (
              <dl className="mt-3 space-y-3 text-sm">
                <div>
                  <dt className="text-xs text-slate-500">Nome</dt>
                  <dd className="mt-0.5 font-medium text-slate-900">
                    {denuncia.nome_denunciante}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-slate-500">E-mail</dt>
                  <dd className="mt-0.5 font-medium text-slate-900">
                    {denuncia.email_denunciante}
                  </dd>
                </div>
                {denuncia.telefone_denunciante && (
                  <div>
                    <dt className="text-xs text-slate-500">Telefone</dt>
                    <dd className="mt-0.5 font-medium text-slate-900">
                      {denuncia.telefone_denunciante}
                    </dd>
                  </div>
                )}
              </dl>
            )}
          </section>

          <section className="rounded-xl border border-slate-200 bg-white p-5">
            <h2 className="text-sm font-semibold text-slate-900">Status</h2>
            <form action={alterarStatusComId} className="mt-3 space-y-2">
              <select
                key={denuncia.status}
                name="status"
                defaultValue={denuncia.status}
                className={cn(INPUT_CLASSES)}
              >
                {STATUS_DENUNCIA.map((s) => (
                  <option key={s} value={s}>
                    {STATUS_LABELS[s]}
                  </option>
                ))}
              </select>
              <Button type="submit" variant="secondary" className="w-full">
                Atualizar status
              </Button>
            </form>
          </section>

          <section className="rounded-xl border border-slate-200 bg-white p-5">
            <h2 className="text-sm font-semibold text-slate-900">Histórico</h2>
            {movimentacoes && movimentacoes.length > 0 ? (
              <ol className="mt-3 space-y-3">
                {movimentacoes.map((mov) => (
                  <li key={mov.id} className="text-sm">
                    <p className="font-medium text-slate-900">
                      {MOVIMENTACAO_LABELS[mov.tipo] ?? mov.tipo}
                    </p>
                    <p className="text-xs text-slate-500">{mov.descricao}</p>
                    <p className="text-xs text-slate-400">
                      {formatarDataHora(mov.created_at)}
                    </p>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="mt-2 text-sm text-slate-500">Sem movimentações.</p>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
