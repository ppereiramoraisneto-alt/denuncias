import Link from "next/link";
import { Container } from "@/components/ui/container";

export function PublicHeader() {
  return (
    <header className="border-b border-slate-200 bg-white">
      <Container className="flex h-16 max-w-5xl items-center justify-between">
        <Link href="/" className="flex items-center gap-2 font-semibold text-slate-900">
          <span className="flex h-8 w-8 items-center justify-center rounded-md bg-slate-900 text-sm text-white">
            CD
          </span>
          <span>Canal de Denúncias</span>
        </Link>
        <Link
          href="/consultar"
          className="text-sm font-medium text-slate-600 hover:text-slate-900"
        >
          Consultar denúncia
        </Link>
      </Container>
    </header>
  );
}
