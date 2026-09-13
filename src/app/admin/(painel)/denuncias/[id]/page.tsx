import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { cn } from "@/lib/cn";
import { STATUS_BADGE_CLASS, STATUS_LABELS } from "@/config/status";
import { TIPO_OCORRENCIA_LABELS } from "@/config/tipos-ocorrencia";

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

          <section className="rounded-xl border border-dashed border-slate-300 bg-white p-5 text-sm text-slate-500">
            Mensagens, anexos e histórico detalhado de movimentações estarão
            disponíveis na Etapa 10.
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
        </div>
      </div>
    </div>
  );
}
