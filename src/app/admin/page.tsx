import { exigirPerfilAtual } from "@/lib/auth";
import { LogoutButton } from "@/components/admin/logout-button";
import { PERFIL_LABELS } from "@/config/perfis";

export default async function AdminPage() {
  const perfil = await exigirPerfilAtual();

  return (
    <main className="mx-auto flex min-h-screen max-w-lg flex-col items-center justify-center text-center">
      <h1 className="text-xl font-semibold text-slate-900">
        Bem-vindo, {perfil.nome}
      </h1>
      <p className="mt-2 text-sm text-slate-600">
        {PERFIL_LABELS[perfil.perfil]} · {perfil.empresaNome}
      </p>
      <p className="mt-6 text-xs text-slate-400">
        O painel completo (indicadores e lista de denúncias) chega na
        próxima etapa.
      </p>
      <div className="mt-6">
        <LogoutButton />
      </div>
    </main>
  );
}
