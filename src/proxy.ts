import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Renova a sessao do Supabase Auth (cookies de access/refresh token) a cada
 * requisicao. Sem isso, `createClient()` em Server Components (que nao pode
 * escrever cookies) renova o token so em memoria a cada request sem nunca
 * persistir no navegador - o refresh token antigo eventualmente para de
 * funcionar e `/admin` alterna entre autenticado e nao-autenticado.
 *
 * Nota: no Next.js 16 este arquivo substitui o antigo `middleware.ts`
 * (renomeado para `proxy.ts`, funcao `proxy`).
 */
export async function proxy(request: NextRequest) {
  let proxyResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          proxyResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            proxyResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // Obrigatorio: dispara a renovacao do token quando necessario e persiste
  // o cookie atualizado na resposta antes de seguir para a rota.
  await supabase.auth.getUser();

  return proxyResponse;
}

export const config = {
  matcher: ["/admin/:path*"],
};
