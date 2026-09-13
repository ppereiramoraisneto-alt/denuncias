import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import { INPUT_CLASSES } from "@/lib/form-styles";
import {
  STATUS_BADGE_CLASS,
  STATUS_DENUNCIA,
  STATUS_LABELS,
  type StatusDenuncia,
} from "@/config/status";
import {
  TIPOS_OCORRENCIA,
  TIPO_OCORRENCIA_LABELS,
  type TipoOcorrencia,
} from "@/config/tipos-ocorrencia";

type Filtros = {
  status?: string;
  tipo?: string;
  de?: string;
  ate?: string;
};

function formatarData(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

async function carregarEstatisticas() {
  const supabase = await createClient();
  const { data } = await supabase.from("denuncias").select("status");

  const contagem: Partial<Record<StatusDenuncia, number>> = {};
  for (const row of data ?? []) {
    contagem[row.status] = (contagem[row.status] ?? 0) + 1;
  }

  return {
    total: data?.length ?? 0,
    recebida: contagem.recebida ?? 0,
    em_triagem: contagem.em_triagem ?? 0,
    em_apuracao: contagem.em_apuracao ?? 0,
    aguardando_informacoes: contagem.aguardando_informacoes ?? 0,
    concluida: contagem.concluida ?? 0,
  };
}

async function carregarDenuncias(filtros: Filtros) {
  const supabase = await createClient();

  let query = supabase
    .from("denuncias")
    .select("id, protocolo, tipo, status, anonima, created_at")
    .order("created_at", { ascending: false });

  if (filtros.status) query = query.eq("status", filtros.status as StatusDenuncia);
  if (filtros.tipo) query = query.eq("tipo", filtros.tipo as TipoOcorrencia);
  if (filtros.de) query = query.gte("created_at", filtros.de);
  if (filtros.ate) query = query.lte("created_at", `${filtros.ate}T23:59:59`);

  const { data: denuncias } = await query;
  if (!denuncias || denuncias.length === 0) return [];

  const ids = denuncias.map((d) => d.id);
  const { data: movimentacoes } = await supabase
    .from("movimentacoes")
    .select("denuncia_id, descricao, created_at")
    .in("denuncia_id", ids)
    .order("created_at", { ascending: false });

  const ultimaPorDenuncia = new Map<string, { descricao: string; created_at: string }>();
  for (const mov of movimentacoes ?? []) {
    if (!ultimaPorDenuncia.has(mov.denuncia_id)) {
      ultimaPorDenuncia.set(mov.denuncia_id, mov);
    }
  }

  return denuncias.map((d) => ({
    ...d,
    ultimaMovimentacao: ultimaPorDenuncia.get(d.id) ?? null,
  }));
}

function StatCard({ label, valor }: { label: string; valor: number }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <p className="text-2xl font-semibold text-slate-900">{valor}</p>
      <p className="mt-1 text-xs text-slate-500">{label}</p>
    </div>
  );
}

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const filtros: Filtros = {
    status: typeof params.status === "string" ? params.status : undefined,
    tipo: typeof params.tipo === "string" ? params.tipo : undefined,
    de: typeof params.de === "string" ? params.de : undefined,
    ate: typeof params.ate === "string" ? params.ate : undefined,
  };

  const [estatisticas, denuncias] = await Promise.all([
    carregarEstatisticas(),
    carregarDenuncias(filtros),
  ]);

  const temFiltroAtivo = Boolean(filtros.status || filtros.tipo || filtros.de || filtros.ate);

  return (
    <div className="space-y-8">
      <section className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        <StatCard label="Total" valor={estatisticas.total} />
        <StatCard label="Recebidas" valor={estatisticas.recebida} />
        <StatCard label="Em triagem" valor={estatisticas.em_triagem} />
        <StatCard label="Em apuração" valor={estatisticas.em_apuracao} />
        <StatCard
          label="Aguardando informações"
          valor={estatisticas.aguardando_informacoes}
        />
        <StatCard label="Concluídas" valor={estatisticas.concluida} />
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-4">
        <form method="get" className="flex flex-wrap items-end gap-4">
          <div>
            <label htmlFor="status" className="block text-xs font-medium text-slate-600">
              Status
            </label>
            <select
              id="status"
              name="status"
              defaultValue={filtros.status ?? ""}
              className={cn(INPUT_CLASSES, "mt-1")}
            >
              <option value="">Todos</option>
              {STATUS_DENUNCIA.map((s) => (
                <option key={s} value={s}>
                  {STATUS_LABELS[s]}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="tipo" className="block text-xs font-medium text-slate-600">
              Tipo
            </label>
            <select
              id="tipo"
              name="tipo"
              defaultValue={filtros.tipo ?? ""}
              className={cn(INPUT_CLASSES, "mt-1")}
            >
              <option value="">Todos</option>
              {TIPOS_OCORRENCIA.map((t) => (
                <option key={t} value={t}>
                  {TIPO_OCORRENCIA_LABELS[t]}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="de" className="block text-xs font-medium text-slate-600">
              De
            </label>
            <input
              type="date"
              id="de"
              name="de"
              defaultValue={filtros.de ?? ""}
              className={cn(INPUT_CLASSES, "mt-1")}
            />
          </div>

          <div>
            <label htmlFor="ate" className="block text-xs font-medium text-slate-600">
              Até
            </label>
            <input
              type="date"
              id="ate"
              name="ate"
              defaultValue={filtros.ate ?? ""}
              className={cn(INPUT_CLASSES, "mt-1")}
            />
          </div>

          <Button type="submit">Filtrar</Button>
          {temFiltroAtivo && (
            <Link href="/admin" className="text-sm text-slate-500 hover:text-slate-900">
              Limpar filtros
            </Link>
          )}
        </form>
      </section>

      <section className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-200 text-xs text-slate-500 uppercase">
            <tr>
              <th className="px-4 py-3 font-medium">Protocolo</th>
              <th className="px-4 py-3 font-medium">Tipo</th>
              <th className="px-4 py-3 font-medium">Data</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Identificação</th>
              <th className="px-4 py-3 font-medium">Última movimentação</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {denuncias.map((d) => (
              <tr key={d.id} className="border-b border-slate-100 last:border-0">
                <td className="px-4 py-3 font-mono text-xs">{d.protocolo}</td>
                <td className="px-4 py-3">{TIPO_OCORRENCIA_LABELS[d.tipo]}</td>
                <td className="px-4 py-3">{formatarData(d.created_at)}</td>
                <td className="px-4 py-3">
                  <span
                    className={cn(
                      "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset",
                      STATUS_BADGE_CLASS[d.status],
                    )}
                  >
                    {STATUS_LABELS[d.status]}
                  </span>
                </td>
                <td className="px-4 py-3">{d.anonima ? "Anônima" : "Identificada"}</td>
                <td className="px-4 py-3 text-slate-500">
                  {d.ultimaMovimentacao
                    ? `${d.ultimaMovimentacao.descricao} — ${formatarData(d.ultimaMovimentacao.created_at)}`
                    : "—"}
                </td>
                <td className="px-4 py-3 text-right">
                  <Link
                    href={`/admin/denuncias/${d.id}`}
                    className="font-medium text-slate-600 hover:text-slate-900"
                  >
                    Ver
                  </Link>
                </td>
              </tr>
            ))}
            {denuncias.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-slate-400">
                  Nenhuma denúncia encontrada.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </section>
    </div>
  );
}
