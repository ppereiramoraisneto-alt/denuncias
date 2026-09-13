import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { PublicFooter } from "@/components/public/footer";
import { PublicHeader } from "@/components/public/header";
import { TIPO_OCORRENCIA_LABELS } from "@/config/tipos-ocorrencia";

const CONFIANCA = [
  {
    titulo: "Anonimato garantido",
    descricao:
      "Se preferir não se identificar, nenhum dado pessoal é solicitado ou armazenado.",
  },
  {
    titulo: "Acesso restrito",
    descricao:
      "Só pessoas autorizadas da empresa acessam as denúncias, com registro de cada ação.",
  },
  {
    titulo: "Você no controle",
    descricao:
      "Acompanhe o andamento e converse com a equipe responsável quando quiser.",
  },
];

const PASSOS = [
  {
    titulo: "Você registra a denúncia",
    descricao:
      "Conte o que aconteceu. Você escolhe se quer se identificar ou permanecer anônimo.",
  },
  {
    titulo: "Você recebe um protocolo",
    descricao:
      "Um número de protocolo e uma senha de acesso são gerados na hora — guarde os dois.",
  },
  {
    titulo: "A equipe responsável analisa",
    descricao:
      "Sua denúncia é triada e apurada com sigilo pela equipe autorizada da empresa.",
  },
  {
    titulo: "Você acompanha o andamento",
    descricao:
      "Volte quando quiser com o protocolo e a senha para ver o status e trocar mensagens.",
  },
];

export default function HomePage() {
  return (
    <>
      <PublicHeader />
      <main className="flex-1">
        <section className="bg-slate-50">
          <Container className="max-w-5xl py-16 text-center sm:py-24">
            <h1 className="text-3xl font-semibold tracking-tight text-balance text-slate-900 sm:text-4xl">
              Um espaço seguro para relatar condutas inadequadas
            </h1>
            <p className="mx-auto mt-4 max-w-xl text-base text-balance text-slate-600 sm:text-lg">
              Denuncie assédio, discriminação e outras violações com total
              confidencialidade. Você decide se quer se identificar.
            </p>
            <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
              <Button href="/denunciar" size="lg" className="w-full sm:w-auto">
                Fazer denúncia
              </Button>
              <Button
                href="/consultar"
                variant="secondary"
                size="lg"
                className="w-full sm:w-auto"
              >
                Consultar denúncia existente
              </Button>
            </div>
          </Container>
        </section>

        <section className="border-y border-slate-200 bg-white">
          <Container className="grid max-w-5xl grid-cols-1 gap-8 py-10 sm:grid-cols-3">
            {CONFIANCA.map((item) => (
              <div key={item.titulo}>
                <h2 className="font-medium text-slate-900">{item.titulo}</h2>
                <p className="mt-1 text-sm text-slate-600">{item.descricao}</p>
              </div>
            ))}
          </Container>
        </section>

        <section>
          <Container className="max-w-5xl py-16">
            <h2 className="text-center text-2xl font-semibold text-slate-900">
              Como funciona
            </h2>
            <ol className="mt-10 grid grid-cols-1 gap-8 sm:grid-cols-2">
              {PASSOS.map((passo, index) => (
                <li key={passo.titulo} className="flex gap-4">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-900 text-sm font-semibold text-white">
                    {index + 1}
                  </span>
                  <div>
                    <h3 className="font-medium text-slate-900">{passo.titulo}</h3>
                    <p className="mt-1 text-sm text-slate-600">{passo.descricao}</p>
                  </div>
                </li>
              ))}
            </ol>
          </Container>
        </section>

        <section className="bg-slate-50">
          <Container className="max-w-5xl py-16 text-center">
            <h2 className="text-2xl font-semibold text-slate-900">
              O que você pode denunciar
            </h2>
            <div className="mt-8 flex flex-wrap justify-center gap-2">
              {Object.values(TIPO_OCORRENCIA_LABELS).map((label) => (
                <span
                  key={label}
                  className="rounded-full bg-white px-4 py-2 text-sm font-medium text-slate-700 ring-1 ring-inset ring-slate-200"
                >
                  {label}
                </span>
              ))}
            </div>
          </Container>
        </section>
      </main>
      <PublicFooter />
    </>
  );
}
