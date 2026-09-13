import Link from "next/link";

export default function AdminNotFound() {
  return (
    <div className="mx-auto max-w-md py-16 text-center">
      <h1 className="text-lg font-semibold text-slate-900">Não encontrada</h1>
      <p className="mt-2 text-sm text-slate-600">
        Esta denúncia não existe ou não pertence à sua empresa.
      </p>
      <Link
        href="/admin"
        className="mt-6 inline-block text-sm font-medium text-slate-600 hover:text-slate-900"
      >
        ← Voltar ao dashboard
      </Link>
    </div>
  );
}
