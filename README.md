# Canal de Denúncias

SaaS de canal de denúncias corporativas (assédio e condutas inadequadas), com
ambiente público para denunciantes e painel administrativo para a empresa.

## Stack

- Next.js (App Router) + TypeScript
- Tailwind CSS
- Supabase (Postgres, Auth, Storage, RLS)
- Vercel (deploy)

## Estrutura

```
src/
  app/                # Rotas (App Router)
  components/         # Componentes de UI
  lib/
    supabase/
      client.ts       # Cliente Supabase para o navegador (chave anon)
      server.ts       # Cliente Supabase para Server Components/Actions (chave anon)
      admin.ts         # Cliente com service role — uso restrito, apenas server-side
  types/               # Tipos de domínio e do banco
  config/              # Enums e constantes compartilhadas (status, tipos, perfis)
```

## Configuração local

1. Copie `.env.example` para `.env.local` e preencha com as credenciais do
   projeto Supabase (URL, anon key, service role key).
2. Instale as dependências: `npm install`
3. Rode o servidor de desenvolvimento: `npm run dev`

## Segurança

- `SUPABASE_SERVICE_ROLE_KEY` nunca deve ser usada em código client-side.
- Todo acesso a dados deve ser validado por Row Level Security (RLS) no
  Supabase, não apenas por filtros no frontend.
