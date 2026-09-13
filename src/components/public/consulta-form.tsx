"use client";

import { useId, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import { INPUT_CLASSES } from "@/lib/form-styles";
import { STATUS_BADGE_CLASS, STATUS_LABELS } from "@/config/status";
import { TIPO_OCORRENCIA_LABELS } from "@/config/tipos-ocorrencia";
import {
  consultarDenuncia,
  enviarMensagemPublica,
  anexarArquivoPublico,
  type AnexoPublico,
  type DenunciaConsultada,
  type MensagemPublica,
} from "@/app/consultar/actions";
import { ANEXO_EXTENSOES_ACEITAS, ANEXO_QUANTIDADE_MAXIMA } from "@/config/anexos";
import { formatarTamanhoArquivo, validarArquivo } from "@/lib/anexos";

type Etapa = "formulario" | "consultando" | "resultado";

function formatarData(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function ConsultaForm() {
  const [etapa, setEtapa] = useState<Etapa>("formulario");
  const [protocolo, setProtocolo] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [denuncia, setDenuncia] = useState<DenunciaConsultada | null>(null);
  const [mensagens, setMensagens] = useState<MensagemPublica[]>([]);
  const [anexos, setAnexos] = useState<AnexoPublico[]>([]);

  const [novaMensagem, setNovaMensagem] = useState("");
  const [enviandoMensagem, setEnviandoMensagem] = useState(false);
  const [erroMensagem, setErroMensagem] = useState<string | null>(null);

  const [enviandoAnexo, setEnviandoAnexo] = useState(false);
  const [erroAnexo, setErroAnexo] = useState<string | null>(null);
  const fileInputId = useId();

  async function consultar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErro(null);
    setEtapa("consultando");

    const resposta = await consultarDenuncia(protocolo, senha);

    if (!resposta.sucesso) {
      setErro(resposta.erro);
      setEtapa("formulario");
      return;
    }

    setDenuncia(resposta.denuncia);
    setMensagens(resposta.mensagens);
    setAnexos(resposta.anexos);
    setEtapa("resultado");
  }

  async function recarregar() {
    const resposta = await consultarDenuncia(protocolo, senha);
    if (resposta.sucesso) {
      setDenuncia(resposta.denuncia);
      setMensagens(resposta.mensagens);
      setAnexos(resposta.anexos);
    }
  }

  function consultarOutra() {
    setDenuncia(null);
    setMensagens([]);
    setAnexos([]);
    setProtocolo("");
    setSenha("");
    setErro(null);
    setEtapa("formulario");
  }

  async function enviarMensagem(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!novaMensagem.trim()) return;

    setErroMensagem(null);
    setEnviandoMensagem(true);

    const resposta = await enviarMensagemPublica(protocolo, senha, novaMensagem);

    if (!resposta.sucesso) {
      setErroMensagem(resposta.erro);
      setEnviandoMensagem(false);
      return;
    }

    setNovaMensagem("");
    await recarregar();
    setEnviandoMensagem(false);
  }

  async function enviarAnexo(file: File | null) {
    if (!file) return;

    if (anexos.length >= ANEXO_QUANTIDADE_MAXIMA) {
      setErroAnexo(`Esta denúncia já atingiu o limite de ${ANEXO_QUANTIDADE_MAXIMA} anexos.`);
      return;
    }

    const erroValidacao = validarArquivo(file);
    if (erroValidacao) {
      setErroAnexo(erroValidacao);
      return;
    }

    setErroAnexo(null);
    setEnviandoAnexo(true);

    const resposta = await anexarArquivoPublico(protocolo, senha, file);

    if (!resposta.sucesso) {
      setErroAnexo(resposta.erro);
      setEnviandoAnexo(false);
      return;
    }

    await recarregar();
    setEnviandoAnexo(false);
  }

  if (etapa === "resultado" && denuncia) {
    return (
      <div className="mx-auto max-w-lg space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-medium tracking-wide text-slate-400 uppercase">
              Protocolo
            </p>
            <p className="font-mono text-lg font-semibold text-slate-900">
              {denuncia.protocolo}
            </p>
          </div>
          <span
            className={cn(
              "inline-flex shrink-0 items-center rounded-full px-3 py-1 text-xs font-medium ring-1 ring-inset",
              STATUS_BADGE_CLASS[denuncia.status],
            )}
          >
            {STATUS_LABELS[denuncia.status]}
          </span>
        </div>

        <dl className="space-y-4 rounded-xl border border-slate-200 bg-white p-4 text-sm">
          <div>
            <dt className="text-slate-500">Tipo de ocorrência</dt>
            <dd className="mt-0.5 font-medium text-slate-900">
              {TIPO_OCORRENCIA_LABELS[denuncia.tipo]}
            </dd>
          </div>
          <div>
            <dt className="text-slate-500">Registrada em</dt>
            <dd className="mt-0.5 font-medium text-slate-900">
              {formatarData(denuncia.criadaEm)}
            </dd>
          </div>
          {denuncia.dataOcorrencia && (
            <div>
              <dt className="text-slate-500">Data ou período da ocorrência</dt>
              <dd className="mt-0.5 font-medium text-slate-900">
                {denuncia.dataOcorrencia}
              </dd>
            </div>
          )}
          {denuncia.local && (
            <div>
              <dt className="text-slate-500">Local</dt>
              <dd className="mt-0.5 font-medium text-slate-900">{denuncia.local}</dd>
            </div>
          )}
          {denuncia.envolvidos && (
            <div>
              <dt className="text-slate-500">Pessoa(s) envolvida(s)</dt>
              <dd className="mt-0.5 font-medium text-slate-900">
                {denuncia.envolvidos}
              </dd>
            </div>
          )}
          {denuncia.testemunhas && (
            <div>
              <dt className="text-slate-500">Testemunhas</dt>
              <dd className="mt-0.5 font-medium text-slate-900">
                {denuncia.testemunhas}
              </dd>
            </div>
          )}
          <div>
            <dt className="text-slate-500">Descrição dos fatos</dt>
            <dd className="mt-0.5 whitespace-pre-wrap text-slate-900">
              {denuncia.descricao}
            </dd>
          </div>
        </dl>

        <section className="space-y-3 rounded-xl border border-slate-200 bg-white p-4">
          <h2 className="text-sm font-semibold text-slate-900">Anexos</h2>

          {anexos.length > 0 && (
            <ul className="space-y-2">
              {anexos.map((anexo) => (
                <li
                  key={anexo.id}
                  className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2 text-sm"
                >
                  <div className="min-w-0">
                    {anexo.url ? (
                      <a
                        href={anexo.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="truncate font-medium text-slate-900 hover:underline"
                      >
                        {anexo.nomeOriginal}
                      </a>
                    ) : (
                      <span className="truncate text-slate-500">{anexo.nomeOriginal}</span>
                    )}
                    <p className="text-xs text-slate-400">
                      {anexo.enviadoPor === "denunciante" ? "Você" : "Equipe responsável"} ·{" "}
                      {formatarTamanhoArquivo(anexo.tamanho)}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}

          <label
            htmlFor={fileInputId}
            className="flex cursor-pointer items-center justify-center rounded-xl border-2 border-dashed border-slate-300 px-4 py-4 text-center text-sm text-slate-600 hover:border-slate-400"
          >
            {enviandoAnexo ? "Enviando..." : "Toque para anexar um novo arquivo"}
          </label>
          <input
            id={fileInputId}
            type="file"
            accept={ANEXO_EXTENSOES_ACEITAS}
            className="hidden"
            disabled={enviandoAnexo}
            onChange={(e) => {
              const arquivo = e.target.files?.[0] ?? null;
              enviarAnexo(arquivo);
              e.target.value = "";
            }}
          />
          {erroAnexo && <p className="text-sm text-red-600">{erroAnexo}</p>}
        </section>

        <section className="space-y-3 rounded-xl border border-slate-200 bg-white p-4">
          <h2 className="text-sm font-semibold text-slate-900">Mensagens</h2>

          {mensagens.length === 0 ? (
            <p className="text-sm text-slate-500">
              Nenhuma mensagem ainda. A equipe responsável pode entrar em
              contato por aqui durante a apuração.
            </p>
          ) : (
            <ul className="space-y-3">
              {mensagens.map((m) => (
                <li
                  key={m.id}
                  className={cn(
                    "max-w-[85%] rounded-xl px-3 py-2 text-sm",
                    m.autorTipo === "denunciante"
                      ? "ml-auto bg-slate-900 text-white"
                      : "bg-slate-100 text-slate-900",
                  )}
                >
                  <p className="whitespace-pre-wrap">{m.mensagem}</p>
                  <p
                    className={cn(
                      "mt-1 text-[11px]",
                      m.autorTipo === "denunciante" ? "text-slate-300" : "text-slate-400",
                    )}
                  >
                    {m.autorTipo === "denunciante" ? "Você" : "Equipe responsável"} ·{" "}
                    {formatarData(m.criadaEm)}
                  </p>
                </li>
              ))}
            </ul>
          )}

          <form onSubmit={enviarMensagem} className="space-y-2">
            {erroMensagem && <p className="text-sm text-red-600">{erroMensagem}</p>}
            <textarea
              rows={3}
              placeholder="Escreva uma mensagem para a equipe responsável..."
              className={INPUT_CLASSES}
              value={novaMensagem}
              onChange={(e) => setNovaMensagem(e.target.value)}
            />
            <Button type="submit" disabled={enviandoMensagem} className="w-full sm:w-auto">
              {enviandoMensagem ? "Enviando..." : "Enviar mensagem"}
            </Button>
          </form>
        </section>

        <Button type="button" variant="secondary" onClick={consultarOutra}>
          Consultar outra denúncia
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={consultar} className="mx-auto max-w-sm space-y-6">
      <div className="text-center">
        <h1 className="text-xl font-semibold text-slate-900">Consultar denúncia</h1>
        <p className="mt-2 text-sm text-slate-600">
          Informe o protocolo e a chave de acesso que você recebeu ao
          registrar a denúncia.
        </p>
      </div>

      {erro && (
        <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{erro}</p>
      )}

      <div>
        <label htmlFor="protocolo" className="block text-sm font-medium text-slate-900">
          Protocolo
        </label>
        <input
          id="protocolo"
          type="text"
          required
          placeholder="Ex: ABCD-1234"
          className={cn(INPUT_CLASSES, "mt-1.5 font-mono uppercase")}
          value={protocolo}
          onChange={(e) => setProtocolo(e.target.value)}
        />
      </div>

      <div>
        <label htmlFor="senha" className="block text-sm font-medium text-slate-900">
          Chave de acesso
        </label>
        <input
          id="senha"
          type="text"
          required
          placeholder="Ex: WXYZ-5678"
          className={cn(INPUT_CLASSES, "mt-1.5 font-mono uppercase")}
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
        />
      </div>

      <Button type="submit" size="lg" className="w-full" disabled={etapa === "consultando"}>
        {etapa === "consultando" ? "Consultando..." : "Consultar"}
      </Button>
    </form>
  );
}
