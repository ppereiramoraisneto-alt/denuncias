-- Etapa 6: consulta de denuncia por protocolo + chave de acesso
--
-- A verificacao da senha acontece inteiramente dentro do Postgres (crypt()
-- contra o hash armazenado). O hash nunca sai do banco; a funcao so
-- retorna linhas quando a senha confere. Assim como criar_denuncia, o
-- EXECUTE fica restrito ao service_role.

create or replace function public.consultar_denuncia(p_protocolo text, p_senha text)
returns table (
  id uuid,
  protocolo text,
  tipo text,
  data_ocorrencia text,
  local text,
  envolvidos text,
  testemunhas text,
  descricao text,
  anonima boolean,
  status text,
  created_at timestamptz,
  updated_at timestamptz
)
language plpgsql
security definer
set search_path = public, extensions
as $$
begin
  return query
  select d.id, d.protocolo, d.tipo, d.data_ocorrencia, d.local, d.envolvidos,
         d.testemunhas, d.descricao, d.anonima, d.status, d.created_at, d.updated_at
  from denuncias d
  where d.protocolo = upper(trim(p_protocolo))
    and d.senha_hash = crypt(p_senha, d.senha_hash);
end;
$$;

revoke execute on function public.consultar_denuncia(text, text) from public, anon, authenticated;
grant execute on function public.consultar_denuncia(text, text) to service_role;
