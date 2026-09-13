import Link from "next/link";

export default async function DenunciaDetalhePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <div className="mx-auto max-w-md py-16 text-center">
      <h1 className="text-lg font-semibold text-slate-900">Detalhe da denúncia</h1>
      <p className="mt-2 text-sm text-slate-600">
        Esta página ainda está sendo construída — chega na Etapa 9.
      </p>
      <p className="mt-4 font-mono text-xs text-slate-400">{id}</p>
      <Link
        href="/admin"
        className="mt-6 inline-block text-sm font-medium text-slate-600 hover:text-slate-900"
      >
        ← Voltar ao dashboard
      </Link>
    </div>
  );
}
