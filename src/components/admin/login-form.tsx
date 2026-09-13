"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import { INPUT_CLASSES } from "@/lib/form-styles";
import { login } from "@/app/admin/login/actions";

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function entrar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErro(null);
    setEnviando(true);

    const resultado = await login(email, senha);

    if (resultado?.erro) {
      setErro(resultado.erro);
      setEnviando(false);
    }
  }

  return (
    <form onSubmit={entrar} className="space-y-6">
      <div className="text-center">
        <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-md bg-slate-900 text-sm font-semibold text-white">
          CD
        </div>
        <h1 className="mt-4 text-xl font-semibold text-slate-900">
          Acesso administrativo
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          Restrito à equipe autorizada da empresa.
        </p>
      </div>

      {erro && (
        <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{erro}</p>
      )}

      <div>
        <label htmlFor="email" className="block text-sm font-medium text-slate-900">
          E-mail
        </label>
        <input
          id="email"
          type="email"
          required
          autoComplete="email"
          className={cn(INPUT_CLASSES, "mt-1.5")}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>

      <div>
        <label htmlFor="senha" className="block text-sm font-medium text-slate-900">
          Senha
        </label>
        <input
          id="senha"
          type="password"
          required
          autoComplete="current-password"
          className={cn(INPUT_CLASSES, "mt-1.5")}
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
        />
      </div>

      <Button type="submit" size="lg" className="w-full" disabled={enviando}>
        {enviando ? "Entrando..." : "Entrar"}
      </Button>
    </form>
  );
}
