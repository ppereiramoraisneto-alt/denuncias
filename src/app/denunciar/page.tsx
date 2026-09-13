import { Container } from "@/components/ui/container";
import { PublicFooter } from "@/components/public/footer";
import { PublicHeader } from "@/components/public/header";
import { DenunciaForm } from "@/components/public/denuncia-form";

export default function DenunciarPage() {
  return (
    <>
      <PublicHeader />
      <main className="flex-1">
        <Container className="max-w-3xl py-10 sm:py-16">
          <DenunciaForm />
        </Container>
      </main>
      <PublicFooter />
    </>
  );
}
