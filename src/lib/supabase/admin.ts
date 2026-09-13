import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

/**
 * Cliente Supabase com chave de service role — ignora RLS por completo.
 *
 * USO RESTRITO a código server-side (Server Actions / Route Handlers) e apenas
 * nos fluxos em que o denunciante não possui sessão Supabase Auth (ex: consulta
 * de denúncia via protocolo + senha). Todo acesso concedido por este cliente deve
 * ser validado manualmente no código antes de retornar dados.
 *
 * NUNCA importar este arquivo em código que roda no navegador.
 */
export function createAdminClient() {
  if (typeof window !== "undefined") {
    throw new Error("createAdminClient não pode ser usado no navegador.");
  }

  return createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  );
}
