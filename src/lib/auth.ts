import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { PerfilAdmin } from "@/config/perfis";

export type PerfilAtual = {
  userId: string;
  nome: string;
  perfil: PerfilAdmin;
  empresaId: string;
  empresaNome: string;
};

/**
 * Garante que existe uma sessao Supabase Auth válida E um perfil
 * administrativo vinculado a ela. Um usuario autenticado sem linha em
 * `perfis` (por exemplo, alguem que se autocadastrou direto pela API do
 * Supabase Auth) nao tem empresa associada e cai fora tambem.
 */
export async function exigirPerfilAtual(): Promise<PerfilAtual> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/admin/login");
  }

  const { data: perfil } = await supabase
    .from("perfis")
    .select("nome, perfil, empresa_id")
    .eq("id", user.id)
    .single();

  if (!perfil) {
    redirect("/admin/login");
  }

  const { data: empresa } = await supabase
    .from("empresas")
    .select("nome")
    .eq("id", perfil.empresa_id)
    .single();

  return {
    userId: user.id,
    nome: perfil.nome,
    perfil: perfil.perfil,
    empresaId: perfil.empresa_id,
    empresaNome: empresa?.nome ?? "",
  };
}
