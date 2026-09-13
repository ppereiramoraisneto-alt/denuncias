-- Etapa 10: mensagens, anexos e historico
--
-- Faltavam policies de INSERT para o admin (so havia SELECT em movimentacoes
-- e anexos). E o lado publico (denunciante, sem sessao Supabase Auth)
-- precisa de funcoes SECURITY DEFINER que validem protocolo+senha antes de
-- qualquer escrita, seguindo o mesmo padrao de criar_denuncia/consultar_denuncia.

-- ============================================================
-- Policies de INSERT para o admin autenticado
-- ============================================================

create policy "admin insere movimentacoes na propria empresa"
  on movimentacoes for insert
  to authenticated
  with check (
    exists (
      select 1 from denuncias
      where denuncias.id = movimentacoes.denuncia_id
      and denuncias.empresa_id = current_empresa_id()
    )
  );

create policy "admin insere anexos na propria empresa"
  on anexos for insert
  to authenticated
  with check (
    exists (
      select 1 from denuncias
      where denuncias.id = anexos.denuncia_id
      and denuncias.empresa_id = current_empresa_id()
    )
  );

-- ============================================================
-- Acesso publico (denunciante): valida protocolo+senha a cada chamada,
-- nunca confiando num id armazenado no cliente.
-- ============================================================

create or replace function public.validar_acesso_denuncia(p_protocolo text, p_senha text)
returns uuid
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_id uuid;
begin
  select id into v_id
  from denuncias
  where protocolo = upper(trim(p_protocolo))
    and senha_hash = crypt(p_senha, senha_hash);
  return v_id;
end;
$$;

revoke execute on function public.validar_acesso_denuncia(text, text) from public, anon, authenticated;
grant execute on function public.validar_acesso_denuncia(text, text) to service_role;

create or replace function public.enviar_mensagem_publica(p_protocolo text, p_senha text, p_mensagem text)
returns void
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_denuncia_id uuid;
begin
  v_denuncia_id := validar_acesso_denuncia(p_protocolo, p_senha);
  if v_denuncia_id is null then
    raise exception 'Protocolo ou chave de acesso incorretos.';
  end if;

  insert into mensagens (denuncia_id, autor_tipo, usuario_id, mensagem)
  values (v_denuncia_id, 'denunciante', null, p_mensagem);

  insert into movimentacoes (denuncia_id, usuario_id, tipo, descricao)
  values (v_denuncia_id, null, 'mensagem_enviada', 'Mensagem enviada pelo denunciante.');
end;
$$;

revoke execute on function public.enviar_mensagem_publica(text, text, text) from public, anon, authenticated;
grant execute on function public.enviar_mensagem_publica(text, text, text) to service_role;

create or replace function public.registrar_anexo_publico(
  p_protocolo text,
  p_senha text,
  p_nome_original text,
  p_caminho_storage text,
  p_tipo text,
  p_tamanho bigint
)
returns void
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_denuncia_id uuid;
begin
  v_denuncia_id := validar_acesso_denuncia(p_protocolo, p_senha);
  if v_denuncia_id is null then
    raise exception 'Protocolo ou chave de acesso incorretos.';
  end if;

  insert into anexos (denuncia_id, nome_original, caminho_storage, tipo, tamanho, enviado_por)
  values (v_denuncia_id, p_nome_original, p_caminho_storage, p_tipo, p_tamanho, 'denunciante');

  insert into movimentacoes (denuncia_id, usuario_id, tipo, descricao)
  values (v_denuncia_id, null, 'anexo_enviado', format('Arquivo "%s" anexado pelo denunciante.', p_nome_original));
end;
$$;

revoke execute on function public.registrar_anexo_publico(text, text, text, text, text, bigint) from public, anon, authenticated;
grant execute on function public.registrar_anexo_publico(text, text, text, text, text, bigint) to service_role;
