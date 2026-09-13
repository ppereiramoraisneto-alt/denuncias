"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import { INPUT_CLASSES } from "@/lib/form-styles";
import { STATUS_BADGE_CLASS, STATUS_LABELS } from "@/config/status";
import { TIPO_OCORRENCIA_LABELS } from "@/config/tipos-ocorrencia";
import { consultarDenuncia, type DenunciaConsultada } from "@/app/consultar/actions";

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
    setEtapa("resultado");
  }

  function consultarOutra() {
    setDenuncia(null);
    setProtocolo("");
    setSenha("");
    setErro(null);
    setEtapa("formulario");
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

        <p className="text-xs text-slate-500">
          Mensagens da equipe responsável, envio de novos documentos e
          histórico detalhado de andamento estarão disponíveis numa próxima
          etapa.
        </p>

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
