import { Container } from "@/components/ui/container";
import { PublicFooter } from "@/components/public/footer";
import { PublicHeader } from "@/components/public/header";
import { ConsultaForm } from "@/components/public/consulta-form";

export default function ConsultarPage() {
  return (
    <>
      <PublicHeader />
      <main className="flex-1">
        <Container className="max-w-3xl py-10 sm:py-16">
          <ConsultaForm />
        </Container>
      </main>
      <PublicFooter />
    </>
  );
}
