import Link from "next/link";
import { exigirPerfilAtual } from "@/lib/auth";
import { LogoutButton } from "@/components/admin/logout-button";
import { PERFIL_LABELS } from "@/config/perfis";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const perfil = await exigirPerfilAtual();

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
          <Link href="/admin" className="flex items-center gap-2 font-semibold text-slate-900">
            <span className="flex h-8 w-8 items-center justify-center rounded-md bg-slate-900 text-sm text-white">
              CD
            </span>
            <span>{perfil.empresaNome}</span>
          </Link>
          <div className="flex items-center gap-4">
            <div className="text-right text-sm">
              <p className="font-medium text-slate-900">{perfil.nome}</p>
              <p className="text-xs text-slate-500">{PERFIL_LABELS[perfil.perfil]}</p>
            </div>
            <LogoutButton />
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">{children}</main>
    </div>
  );
}
