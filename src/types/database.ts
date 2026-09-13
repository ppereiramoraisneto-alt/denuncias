import type { StatusDenuncia } from "@/config/status";
import type { TipoOcorrencia } from "@/config/tipos-ocorrencia";
import type { PerfilAdmin } from "@/config/perfis";
import type { AutorMensagem, TipoMovimentacao } from "@/types/denuncia";

type EmpresaRow = {
  id: string;
  nome: string;
  created_at: string;
};

type PerfilRow = {
  id: string;
  empresa_id: string;
  nome: string;
  perfil: PerfilAdmin;
  created_at: string;
};

type DenunciaRow = {
  id: string;
  empresa_id: string;
  protocolo: string;
  senha_hash: string;
  tipo: TipoOcorrencia;
  data_ocorrencia: string | null;
  local: string | null;
  envolvidos: string | null;
  testemunhas: string | null;
  descricao: string;
  anonima: boolean;
  nome_denunciante: string | null;
  email_denunciante: string | null;
  telefone_denunciante: string | null;
  status: StatusDenuncia;
  created_at: string;
  updated_at: string;
};

type MensagemRow = {
  id: string;
  denuncia_id: string;
  autor_tipo: AutorMensagem;
  usuario_id: string | null;
  mensagem: string;
  created_at: string;
};

type AnexoRow = {
  id: string;
  denuncia_id: string;
  nome_original: string;
  caminho_storage: string;
  tipo: string;
  tamanho: number;
  enviado_por: AutorMensagem;
  created_at: string;
};

type MovimentacaoRow = {
  id: string;
  denuncia_id: string;
  usuario_id: string | null;
  tipo: TipoMovimentacao;
  descricao: string;
  created_at: string;
};

/** Constrói Row/Insert/Update a partir de um Row e da lista de campos com default no banco. */
type TableOf<Row extends Record<string, unknown>, ComDefault extends keyof Row> = {
  Row: Row;
  Insert: Partial<Pick<Row, ComDefault>> & Omit<Row, ComDefault>;
  Update: Partial<Row>;
  Relationships: [];
};

export type Database = {
  public: {
    Tables: {
      empresas: TableOf<EmpresaRow, "id" | "created_at">;
      perfis: TableOf<PerfilRow, "created_at">;
      denuncias: TableOf<
        DenunciaRow,
        | "id"
        | "data_ocorrencia"
        | "local"
        | "envolvidos"
        | "testemunhas"
        | "anonima"
        | "nome_denunciante"
        | "email_denunciante"
        | "telefone_denunciante"
        | "status"
        | "created_at"
        | "updated_at"
      >;
      mensagens: TableOf<MensagemRow, "id" | "usuario_id" | "created_at">;
      anexos: TableOf<AnexoRow, "id" | "created_at">;
      movimentacoes: TableOf<MovimentacaoRow, "id" | "usuario_id" | "created_at">;
    };
    Views: Record<string, never>;
    Functions: {
      current_empresa_id: {
        Args: Record<string, never>;
        Returns: string;
      };
      criar_denuncia: {
        Args: {
          p_empresa_id: string;
          p_tipo: TipoOcorrencia;
          p_data_ocorrencia: string | null;
          p_local: string | null;
          p_envolvidos: string | null;
          p_testemunhas: string | null;
          p_descricao: string;
          p_anonima: boolean;
          p_nome: string | null;
          p_email: string | null;
          p_telefone: string | null;
        };
        Returns: { id: string; protocolo: string; senha: string }[];
      };
      consultar_denuncia: {
        Args: {
          p_protocolo: string;
          p_senha: string;
        };
        Returns: {
          id: string;
          protocolo: string;
          tipo: TipoOcorrencia;
          data_ocorrencia: string | null;
          local: string | null;
          envolvidos: string | null;
          testemunhas: string | null;
          descricao: string;
          anonima: boolean;
          status: StatusDenuncia;
          created_at: string;
          updated_at: string;
        }[];
      };
      validar_acesso_denuncia: {
        Args: {
          p_protocolo: string;
          p_senha: string;
        };
        Returns: string | null;
      };
      enviar_mensagem_publica: {
        Args: {
          p_protocolo: string;
          p_senha: string;
          p_mensagem: string;
        };
        Returns: void;
      };
      registrar_anexo_publico: {
        Args: {
          p_protocolo: string;
          p_senha: string;
          p_nome_original: string;
          p_caminho_storage: string;
          p_tipo: string;
          p_tamanho: number;
        };
        Returns: void;
      };
    };
    Enums: Record<string, never>;
  };
};
