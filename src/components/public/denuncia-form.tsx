"use client";

import { useId, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import { INPUT_CLASSES } from "@/lib/form-styles";
import {
  ANEXO_EXTENSOES_ACEITAS,
  ANEXO_QUANTIDADE_MAXIMA,
  ANEXO_TAMANHO_MAXIMO_BYTES,
} from "@/config/anexos";
import { TIPOS_OCORRENCIA, TIPO_OCORRENCIA_LABELS } from "@/config/tipos-ocorrencia";
import { criarDenuncia } from "@/app/denunciar/actions";
import { formatarTamanhoArquivo } from "@/lib/anexos";

type Etapa = "identificacao" | "formulario" | "enviando" | "sucesso";

type FormState = {
  tipo: string;
  dataOcorrencia: string;
  local: string;
  envolvidos: string;
  testemunhas: string;
  descricao: string;
  nome: string;
  email: string;
  telefone: string;
};

const ESTADO_INICIAL: FormState = {
  tipo: "",
  dataOcorrencia: "",
  local: "",
  envolvidos: "",
  testemunhas: "",
  descricao: "",
  nome: "",
  email: "",
  telefone: "",
};

export function DenunciaForm() {
  const [etapa, setEtapa] = useState<Etapa>("identificacao");
  const [anonima, setAnonima] = useState<boolean | null>(null);
  const [form, setForm] = useState<FormState>(ESTADO_INICIAL);
  const [anexos, setAnexos] = useState<File[]>([]);
  const [erros, setErros] = useState<Partial<Record<keyof FormState, string>>>({});
  const [erroAnexo, setErroAnexo] = useState<string | null>(null);
  const [erroEnvio, setErroEnvio] = useState<string | null>(null);
  const [resultado, setResultado] = useState<{ protocolo: string; senha: string } | null>(null);
  const fileInputId = useId();

  function escolherIdentificacao(identificar: boolean) {
    setAnonima(!identificar);
    if (!identificar) {
      // Anônima: garante que nenhum dado pessoal permanece em memória.
      setForm((atual) => ({ ...atual, nome: "", email: "", telefone: "" }));
    }
    setEtapa("formulario");
  }

  function atualizarCampo<K extends keyof FormState>(campo: K, valor: string) {
    setForm((atual) => ({ ...atual, [campo]: valor }));
  }

  function adicionarArquivos(lista: FileList | null) {
    if (!lista || lista.length === 0) return;

    const combinados = [...anexos];
    let erro: string | null = null;

    for (const arquivo of Array.from(lista)) {
      if (combinados.length >= ANEXO_QUANTIDADE_MAXIMA) {
        erro = `Você pode anexar no máximo ${ANEXO_QUANTIDADE_MAXIMA} arquivos.`;
        break;
      }
      if (arquivo.size > ANEXO_TAMANHO_MAXIMO_BYTES) {
        erro = `"${arquivo.name}" excede o tamanho máximo de 10 MB.`;
        continue;
      }
      combinados.push(arquivo);
    }

    setAnexos(combinados);
    setErroAnexo(erro);
  }

  function removerArquivo(index: number) {
    setAnexos((atual) => atual.filter((_, i) => i !== index));
  }

  function validar(): boolean {
    const novosErros: Partial<Record<keyof FormState, string>> = {};

    if (!form.tipo) novosErros.tipo = "Selecione o tipo de ocorrência.";
    if (form.descricao.trim().length < 20) {
      novosErros.descricao =
        "Descreva os fatos com mais detalhes (mínimo 20 caracteres).";
    }

    if (anonima === false) {
      if (!form.nome.trim()) novosErros.nome = "Informe seu nome.";
      if (!form.email.trim()) {
        novosErros.email = "Informe seu e-mail.";
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
        novosErros.email = "Informe um e-mail válido.";
      }
    }

    setErros(novosErros);
    return Object.keys(novosErros).length === 0;
  }

  async function enviar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!validar()) return;

    setErroEnvio(null);
    setEtapa("enviando");

    const resposta = await criarDenuncia({
      tipo: form.tipo as (typeof TIPOS_OCORRENCIA)[number],
      dataOcorrencia: form.dataOcorrencia,
      local: form.local,
      envolvidos: form.envolvidos,
      testemunhas: form.testemunhas,
      descricao: form.descricao,
      anonima: anonima === true,
      nome: form.nome,
      email: form.email,
      telefone: form.telefone,
      anexos,
    });

    if (!resposta.sucesso) {
      setErroEnvio(resposta.erro);
      setEtapa("formulario");
      return;
    }

    setResultado({ protocolo: resposta.protocolo, senha: resposta.senha });
    setEtapa("sucesso");
  }

  if (etapa === "identificacao") {
    return (
      <div className="mx-auto max-w-md">
        <h1 className="text-xl font-semibold text-slate-900">Antes de começar</h1>
        <p className="mt-2 text-sm text-slate-600">
          Você deseja se identificar nesta denúncia? A escolha é só sua — se
          preferir o anonimato, nenhuma informação pessoal será pedida.
        </p>

        <div className="mt-6 space-y-3">
          <button
            type="button"
            onClick={() => escolherIdentificacao(false)}
            className="w-full rounded-xl border border-slate-200 bg-white p-4 text-left transition-colors hover:border-slate-900"
          >
            <span className="block font-medium text-slate-900">
              Quero permanecer anônimo
            </span>
            <span className="mt-1 block text-sm text-slate-600">
              Não vamos pedir nome, e-mail, telefone ou qualquer outro dado
              que te identifique.
            </span>
          </button>

          <button
            type="button"
            onClick={() => escolherIdentificacao(true)}
            className="w-full rounded-xl border border-slate-200 bg-white p-4 text-left transition-colors hover:border-slate-900"
          >
            <span className="block font-medium text-slate-900">
              Quero me identificar
            </span>
            <span className="mt-1 block text-sm text-slate-600">
              Seus dados ficam visíveis apenas para a equipe responsável pela
              apuração.
            </span>
          </button>
        </div>
      </div>
    );
  }

  if (etapa === "enviando") {
    return (
      <div className="mx-auto max-w-md py-16 text-center text-sm text-slate-500">
        Registrando sua denúncia...
      </div>
    );
  }

  if (etapa === "sucesso" && resultado) {
    return (
      <div className="mx-auto max-w-md text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-xl text-emerald-700">
          ✓
        </div>
        <h1 className="mt-4 text-xl font-semibold text-slate-900">
          Denúncia registrada com sucesso
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          Guarde estas informações — elas serão necessárias para acompanhar
          sua denúncia. Não enviamos isso por e-mail ou SMS.
        </p>

        <div className="mt-6 space-y-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-left">
          <div>
            <span className="block text-xs font-medium tracking-wide text-amber-700 uppercase">
              Protocolo
            </span>
            <span className="block font-mono text-lg font-semibold text-slate-900">
              {resultado.protocolo}
            </span>
          </div>
          <div>
            <span className="block text-xs font-medium tracking-wide text-amber-700 uppercase">
              Chave de acesso
            </span>
            <span className="block font-mono text-lg font-semibold text-slate-900">
              {resultado.senha}
            </span>
          </div>
        </div>

        {anexos.length > 0 && (
          <p className="mt-4 text-xs text-slate-500">
            {anexos.length} arquivo(s) de evidência enviado(s) junto com a
            denúncia.
          </p>
        )}

        <Button href="/consultar" size="lg" className="mt-6 w-full">
          Consultar esta denúncia
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={enviar} className="mx-auto max-w-xl space-y-8">
      <div>
        <button
          type="button"
          onClick={() => setEtapa("identificacao")}
          className="text-sm font-medium text-slate-500 hover:text-slate-900"
        >
          ← Alterar escolha de identificação
        </button>
        <div className="mt-2 inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
          {anonima ? "Denúncia anônima" : "Denúncia identificada"}
        </div>
      </div>

      {erroEnvio && (
        <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          {erroEnvio}
        </p>
      )}

      <section className="space-y-4">
        <h2 className="text-base font-semibold text-slate-900">
          Sobre a ocorrência
        </h2>

        <div>
          <label htmlFor="tipo" className="block text-sm font-medium text-slate-900">
            Tipo de ocorrência
          </label>
          <select
            id="tipo"
            className={cn(INPUT_CLASSES, "mt-1.5")}
            value={form.tipo}
            onChange={(e) => atualizarCampo("tipo", e.target.value)}
          >
            <option value="">Selecione...</option>
            {TIPOS_OCORRENCIA.map((tipo) => (
              <option key={tipo} value={tipo}>
                {TIPO_OCORRENCIA_LABELS[tipo]}
              </option>
            ))}
          </select>
          {erros.tipo && <p className="mt-1.5 text-sm text-red-600">{erros.tipo}</p>}
        </div>

        <div>
          <label htmlFor="data" className="block text-sm font-medium text-slate-900">
            Data ou período aproximado{" "}
            <span className="font-normal text-slate-400">(opcional)</span>
          </label>
          <input
            id="data"
            type="text"
            placeholder="Ex: 15/03/2026 ou 'início de março'"
            className={cn(INPUT_CLASSES, "mt-1.5")}
            value={form.dataOcorrencia}
            onChange={(e) => atualizarCampo("dataOcorrencia", e.target.value)}
          />
        </div>

        <div>
          <label htmlFor="local" className="block text-sm font-medium text-slate-900">
            Local <span className="font-normal text-slate-400">(opcional)</span>
          </label>
          <input
            id="local"
            type="text"
            placeholder="Ex: escritório, unidade, setor..."
            className={cn(INPUT_CLASSES, "mt-1.5")}
            value={form.local}
            onChange={(e) => atualizarCampo("local", e.target.value)}
          />
        </div>

        <div>
          <label htmlFor="envolvidos" className="block text-sm font-medium text-slate-900">
            Pessoa(s) envolvida(s){" "}
            <span className="font-normal text-slate-400">(opcional)</span>
          </label>
          <input
            id="envolvidos"
            type="text"
            placeholder="Nome, cargo ou como você as identifica"
            className={cn(INPUT_CLASSES, "mt-1.5")}
            value={form.envolvidos}
            onChange={(e) => atualizarCampo("envolvidos", e.target.value)}
          />
        </div>

        <div>
          <label htmlFor="testemunhas" className="block text-sm font-medium text-slate-900">
            Testemunhas <span className="font-normal text-slate-400">(opcional)</span>
          </label>
          <input
            id="testemunhas"
            type="text"
            placeholder="Se houver"
            className={cn(INPUT_CLASSES, "mt-1.5")}
            value={form.testemunhas}
            onChange={(e) => atualizarCampo("testemunhas", e.target.value)}
          />
        </div>

        <div>
          <label htmlFor="descricao" className="block text-sm font-medium text-slate-900">
            Descrição dos fatos
          </label>
          <textarea
            id="descricao"
            rows={6}
            placeholder="Conte com o máximo de detalhes o que aconteceu."
            className={cn(INPUT_CLASSES, "mt-1.5")}
            value={form.descricao}
            onChange={(e) => atualizarCampo("descricao", e.target.value)}
          />
          {erros.descricao && (
            <p className="mt-1.5 text-sm text-red-600">{erros.descricao}</p>
          )}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-semibold text-slate-900">
          Evidências <span className="font-normal text-slate-400">(opcional)</span>
        </h2>
        <p className="text-xs text-slate-500">
          Imagens, PDF ou Word. Até {ANEXO_QUANTIDADE_MAXIMA} arquivos, 10 MB
          cada.
        </p>

        <label
          htmlFor={fileInputId}
          className="flex cursor-pointer items-center justify-center rounded-xl border-2 border-dashed border-slate-300 px-4 py-6 text-center text-sm text-slate-600 hover:border-slate-400"
        >
          Toque para selecionar arquivos
        </label>
        <input
          id={fileInputId}
          type="file"
          multiple
          accept={ANEXO_EXTENSOES_ACEITAS}
          className="hidden"
          onChange={(e) => {
            adicionarArquivos(e.target.files);
            e.target.value = "";
          }}
        />

        {erroAnexo && <p className="text-sm text-red-600">{erroAnexo}</p>}

        {anexos.length > 0 && (
          <ul className="space-y-2">
            {anexos.map((arquivo, index) => (
              <li
                key={`${arquivo.name}-${index}`}
                className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
              >
                <span className="truncate text-slate-700">{arquivo.name}</span>
                <span className="ml-2 shrink-0 text-xs text-slate-400">
                  {formatarTamanhoArquivo(arquivo.size)}
                </span>
                <button
                  type="button"
                  onClick={() => removerArquivo(index)}
                  className="ml-3 shrink-0 text-xs font-medium text-red-600 hover:text-red-700"
                >
                  Remover
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      {anonima === false && (
        <section className="space-y-4">
          <h2 className="text-base font-semibold text-slate-900">
            Sua identificação
          </h2>

          <div>
            <label htmlFor="nome" className="block text-sm font-medium text-slate-900">
              Nome
            </label>
            <input
              id="nome"
              type="text"
              className={cn(INPUT_CLASSES, "mt-1.5")}
              value={form.nome}
              onChange={(e) => atualizarCampo("nome", e.target.value)}
            />
            {erros.nome && <p className="mt-1.5 text-sm text-red-600">{erros.nome}</p>}
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-slate-900">
              E-mail
            </label>
            <input
              id="email"
              type="email"
              className={cn(INPUT_CLASSES, "mt-1.5")}
              value={form.email}
              onChange={(e) => atualizarCampo("email", e.target.value)}
            />
            {erros.email && <p className="mt-1.5 text-sm text-red-600">{erros.email}</p>}
          </div>

          <div>
            <label htmlFor="telefone" className="block text-sm font-medium text-slate-900">
              Telefone{" "}
              <span className="font-normal text-slate-400">(opcional)</span>
            </label>
            <input
              id="telefone"
              type="tel"
              className={cn(INPUT_CLASSES, "mt-1.5")}
              value={form.telefone}
              onChange={(e) => atualizarCampo("telefone", e.target.value)}
            />
          </div>
        </section>
      )}

      <Button type="submit" size="lg" className="w-full">
        Enviar denúncia
      </Button>
    </form>
  );
}
