import type { StatusDenuncia } from "@/config/status";
import type { TipoOcorrencia } from "@/config/tipos-ocorrencia";

export type Denuncia = {
  id: string;
  empresaId: string;
  protocolo: string;
  tipo: TipoOcorrencia;
  dataOcorrencia: string | null;
  local: string | null;
  envolvidos: string | null;
  testemunhas: string | null;
  descricao: string;
  anonima: boolean;
  nomeDenunciante: string | null;
  emailDenunciante: string | null;
  telefoneDenunciante: string | null;
  status: StatusDenuncia;
  createdAt: string;
  updatedAt: string;
};

export type AutorMensagem = "denunciante" | "administrador";

export type Mensagem = {
  id: string;
  denunciaId: string;
  autorTipo: AutorMensagem;
  usuarioId: string | null;
  mensagem: string;
  createdAt: string;
};

export type Anexo = {
  id: string;
  denunciaId: string;
  nomeOriginal: string;
  caminhoStorage: string;
  tipo: string;
  tamanho: number;
  enviadoPor: AutorMensagem;
  createdAt: string;
};

export type TipoMovimentacao =
  | "criada"
  | "status_alterado"
  | "mensagem_enviada"
  | "anexo_enviado"
  | "concluida";

export type Movimentacao = {
  id: string;
  denunciaId: string;
  usuarioId: string | null;
  tipo: TipoMovimentacao;
  descricao: string;
  createdAt: string;
};
