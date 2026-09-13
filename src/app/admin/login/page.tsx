import { Container } from "@/components/ui/container";
import { LoginForm } from "@/components/admin/login-form";

export default function AdminLoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50">
      <Container className="max-w-sm">
        <LoginForm />
      </Container>
    </main>
  );
}
