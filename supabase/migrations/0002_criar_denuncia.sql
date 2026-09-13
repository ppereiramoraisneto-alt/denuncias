-- Etapa 5: geracao de protocolo e chave de acesso
--
-- Toda a criacao da denuncia acontece dentro de uma unica funcao Postgres
-- (protocolo aleatorio + senha aleatoria + hash + insert + log de auditoria),
-- para que a senha em texto puro exista apenas de forma efemera no retorno
-- desta chamada e nunca seja armazenada.
--
-- A funcao e SECURITY DEFINER e o EXECUTE e restrito ao papel service_role:
-- so o codigo server-side (Server Action com o cliente admin) pode chama-la.
-- O papel anon nunca tem acesso direto a ela via API publica.

create or replace function public.gerar_codigo(tamanho int)
returns text
language plpgsql
as $$
declare
  -- sem 0/O/1/I, para evitar confusao ao digitar o codigo de volta
  alfabeto text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  resultado text := '';
  i int;
begin
  for i in 1..tamanho loop
    resultado := resultado || substr(alfabeto, 1 + floor(random() * length(alfabeto))::int, 1);
  end loop;
  return resultado;
end;
$$;

revoke execute on function public.gerar_codigo(int) from public, anon, authenticated;

create or replace function public.criar_denuncia(
  p_empresa_id uuid,
  p_tipo text,
  p_data_ocorrencia text,
  p_local text,
  p_envolvidos text,
  p_testemunhas text,
  p_descricao text,
  p_anonima boolean,
  p_nome text,
  p_email text,
  p_telefone text
)
returns table (id uuid, protocolo text, senha text)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_protocolo text;
  v_senha text;
  v_id uuid;
  v_tentativas int := 0;
begin
  loop
    v_protocolo := gerar_codigo(4) || '-' || gerar_codigo(4);
    exit when not exists (select 1 from denuncias d where d.protocolo = v_protocolo);
    v_tentativas := v_tentativas + 1;
    if v_tentativas > 5 then
      raise exception 'Nao foi possivel gerar um protocolo unico.';
    end if;
  end loop;

  v_senha := gerar_codigo(4) || '-' || gerar_codigo(4);

  insert into denuncias (
    empresa_id, protocolo, senha_hash, tipo, data_ocorrencia, local,
    envolvidos, testemunhas, descricao, anonima,
    nome_denunciante, email_denunciante, telefone_denunciante
  ) values (
    p_empresa_id, v_protocolo, crypt(v_senha, gen_salt('bf')), p_tipo, p_data_ocorrencia, p_local,
    p_envolvidos, p_testemunhas, p_descricao, p_anonima,
    case when p_anonima then null else p_nome end,
    case when p_anonima then null else p_email end,
    case when p_anonima then null else p_telefone end
  )
  returning denuncias.id into v_id;

  insert into movimentacoes (denuncia_id, usuario_id, tipo, descricao)
  values (v_id, null, 'criada', 'Denúncia registrada pelo canal público.');

  return query select v_id, v_protocolo, v_senha;
end;
$$;

revoke execute on function public.criar_denuncia(
  uuid, text, text, text, text, text, text, boolean, text, text, text
) from public, anon, authenticated;

grant execute on function public.criar_denuncia(
  uuid, text, text, text, text, text, text, boolean, text, text, text
) to service_role;
