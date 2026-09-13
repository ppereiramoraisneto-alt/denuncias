-- Etapa 4: schema inicial do Canal de Denuncias
-- Multi-tenancy (empresa_id) e RLS ja implementados desde o inicio,
-- conforme secao 14 da especificacao do produto.

create extension if not exists pgcrypto;

-- ============================================================
-- Tabelas
-- ============================================================

create table empresas (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  created_at timestamptz not null default now()
);

create table perfis (
  id uuid primary key references auth.users(id) on delete cascade,
  empresa_id uuid not null references empresas(id) on delete cascade,
  nome text not null,
  perfil text not null check (perfil in ('administrador','analista')),
  created_at timestamptz not null default now()
);

create table denuncias (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references empresas(id) on delete cascade,
  protocolo text not null unique,
  senha_hash text not null,
  tipo text not null check (tipo in ('assedio_moral','assedio_sexual','discriminacao','violencia','retaliacao','outro')),
  data_ocorrencia text,
  local text,
  envolvidos text,
  testemunhas text,
  descricao text not null,
  anonima boolean not null default true,
  nome_denunciante text,
  email_denunciante text,
  telefone_denunciante text,
  status text not null default 'recebida' check (status in ('recebida','em_triagem','em_apuracao','aguardando_informacoes','concluida','arquivada')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint anonima_sem_dados_pessoais check (
    anonima = false
    or (nome_denunciante is null and email_denunciante is null and telefone_denunciante is null)
  )
);

create index denuncias_empresa_id_idx on denuncias (empresa_id);
create index denuncias_status_idx on denuncias (empresa_id, status);

create table mensagens (
  id uuid primary key default gen_random_uuid(),
  denuncia_id uuid not null references denuncias(id) on delete cascade,
  autor_tipo text not null check (autor_tipo in ('denunciante','administrador')),
  usuario_id uuid references auth.users(id),
  mensagem text not null,
  created_at timestamptz not null default now()
);

create index mensagens_denuncia_id_idx on mensagens (denuncia_id, created_at);

create table anexos (
  id uuid primary key default gen_random_uuid(),
  denuncia_id uuid not null references denuncias(id) on delete cascade,
  nome_original text not null,
  caminho_storage text not null,
  tipo text not null,
  tamanho bigint not null,
  enviado_por text not null check (enviado_por in ('denunciante','administrador')),
  created_at timestamptz not null default now()
);

create index anexos_denuncia_id_idx on anexos (denuncia_id);

create table movimentacoes (
  id uuid primary key default gen_random_uuid(),
  denuncia_id uuid not null references denuncias(id) on delete cascade,
  usuario_id uuid references auth.users(id),
  tipo text not null check (tipo in ('criada','status_alterado','mensagem_enviada','anexo_enviado','concluida')),
  descricao text not null,
  created_at timestamptz not null default now()
);

create index movimentacoes_denuncia_id_idx on movimentacoes (denuncia_id, created_at);

-- ============================================================
-- updated_at automatico em denuncias
-- ============================================================

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger denuncias_set_updated_at
  before update on denuncias
  for each row
  execute function public.set_updated_at();

-- ============================================================
-- Helper para RLS: empresa do usuario administrativo autenticado
-- ============================================================

create or replace function public.current_empresa_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select empresa_id from perfis where id = auth.uid()
$$;

-- ============================================================
-- Row Level Security
--
-- Denunciantes NUNCA autenticam via Supabase Auth (sem conta).
-- Todo acesso do lado publico (criar denuncia, consultar por
-- protocolo+senha, enviar mensagem/anexo) passa pelo cliente
-- admin (service role) em codigo server-side, que valida a senha
-- manualmente antes de qualquer leitura/escrita. Por isso as
-- policies abaixo cobrem apenas o papel "authenticated" (admin).
-- O papel "anon" nao recebe nenhuma policy: acesso direto do
-- navegador ao banco fica bloqueado por padrao.
-- ============================================================

alter table empresas enable row level security;
alter table perfis enable row level security;
alter table denuncias enable row level security;
alter table mensagens enable row level security;
alter table anexos enable row level security;
alter table movimentacoes enable row level security;

create policy "usuario le a propria empresa"
  on empresas for select
  to authenticated
  using (id = current_empresa_id());

create policy "usuario le o proprio perfil"
  on perfis for select
  to authenticated
  using (id = auth.uid());

create policy "admin le denuncias da propria empresa"
  on denuncias for select
  to authenticated
  using (empresa_id = current_empresa_id());

create policy "admin atualiza denuncias da propria empresa"
  on denuncias for update
  to authenticated
  using (empresa_id = current_empresa_id())
  with check (empresa_id = current_empresa_id());

create policy "admin le mensagens da propria empresa"
  on mensagens for select
  to authenticated
  using (
    exists (
      select 1 from denuncias
      where denuncias.id = mensagens.denuncia_id
      and denuncias.empresa_id = current_empresa_id()
    )
  );

create policy "admin envia mensagens na propria empresa"
  on mensagens for insert
  to authenticated
  with check (
    exists (
      select 1 from denuncias
      where denuncias.id = mensagens.denuncia_id
      and denuncias.empresa_id = current_empresa_id()
    )
  );

create policy "admin le anexos da propria empresa"
  on anexos for select
  to authenticated
  using (
    exists (
      select 1 from denuncias
      where denuncias.id = anexos.denuncia_id
      and denuncias.empresa_id = current_empresa_id()
    )
  );

create policy "admin le movimentacoes da propria empresa"
  on movimentacoes for select
  to authenticated
  using (
    exists (
      select 1 from denuncias
      where denuncias.id = movimentacoes.denuncia_id
      and denuncias.empresa_id = current_empresa_id()
    )
  );

-- ============================================================
-- Storage: bucket privado para anexos (upload/acesso via server-side)
-- ============================================================

insert into storage.buckets (id, name, public)
values ('anexos', 'anexos', false)
on conflict (id) do nothing;

-- ============================================================
-- Seed: empresa unica para este MVP (single-tenant funcional,
-- schema multi-tenant-ready)
-- ============================================================

insert into empresas (nome) values ('Empresa Demonstracao');
