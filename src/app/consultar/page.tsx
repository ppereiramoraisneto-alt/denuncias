import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { PublicFooter } from "@/components/public/footer";
import { PublicHeader } from "@/components/public/header";

export default function ConsultarPage() {
  return (
    <>
      <PublicHeader />
      <main className="flex flex-1 items-center justify-center">
        <Container className="max-w-md py-24 text-center">
          <h1 className="text-xl font-semibold text-slate-900">
            Consultar denúncia
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            Esta etapa ainda está sendo construída. Em breve você poderá
            acompanhar sua denúncia com o protocolo e a senha de acesso.
          </p>
          <Button href="/" variant="secondary" className="mt-6">
            Voltar ao início
          </Button>
        </Container>
      </main>
      <PublicFooter />
    </>
  );
}
